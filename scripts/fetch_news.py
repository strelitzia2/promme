"""promme AI 뉴스 수집기 — GitHub Actions에서 주기적으로 실행

1) RSS 피드와 NAVER API HUB 뉴스 검색에서 AI 관련 기사 제목·링크를 모음
2) 링크·제목·유사 제목 기준으로 중복 제거
3) 보안 / 할인 / 출시 / 소식으로 분류
4) data/news.json 에 최신 150건(30일 이내)만 저장

기사 본문은 저장하지 않고 제목과 원문 링크만 보관합니다.
"""
import datetime as dt
import difflib
import email.utils
import hashlib
import html
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

import xml.etree.ElementTree as ET

import requests

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "news.json"
KST = dt.timezone(dt.timedelta(hours=9))
NOW = dt.datetime.now(dt.timezone.utc)
KEEP_DAYS = 30
KEEP_MAX = 150
SIMILAR = 0.82            # 제목 유사도가 이 이상이면 같은 소식으로 봄
SIMILAR_WINDOW_H = 72     # 유사 제목 비교 범위(시간)
UA = {"User-Agent": "promme-news-bot/1.0 (+https://strelitzia2.github.io/promme/)"}

# ai_only=True: AI와 관련된 제목만 남김(보안 매체 등 일반 피드용)
FEEDS = [
    {"source": "OpenAI", "url": "https://openai.com/news/rss.xml", "ai_only": False},
    {"source": "Google", "url": "https://blog.google/technology/ai/rss/", "ai_only": False},
    {"source": "Hugging Face", "url": "https://huggingface.co/blog/feed.xml", "ai_only": False},
    {"source": "TechCrunch", "url": "https://techcrunch.com/category/artificial-intelligence/feed/", "ai_only": False},
    {"source": "AI타임스", "url": "https://www.aitimes.com/rss/allArticle.xml", "ai_only": False},
    {"source": "The Hacker News", "url": "https://feeds.feedburner.com/TheHackersNews", "ai_only": True},
]

NAVER_URL = "https://naverapihub.apigw.ntruss.com/search/v1/news"
NAVER_QUERIES = ["생성형 AI 출시", "AI 보안 취약점", "AI 요금 할인", "ChatGPT", "클로드 AI", "제미나이 AI"]

AI_WORDS = re.compile(
    r"\bAI\b|A\.I\.|인공지능|생성형|LLM|GPT|ChatGPT|챗GPT|OpenAI|오픈AI|Claude|클로드|Anthropic|앤트로픽|"
    r"Gemini|제미나이|Copilot|코파일럿|딥시크|DeepSeek|Llama|라마|Mistral|미스트랄|Grok|그록|"
    r"AI 에이전트|AI agent|machine learning|머신러닝|딥러닝|neural network", re.I)
TAG_RULES = [
    ("보안", re.compile(r"보안|취약점|해킹|해커|유출|악성|랜섬|피싱|탈옥|침해|security|vulnerab|exploit|breach|"
                       r"malware|ransomware|phishing|jailbreak|\bCVE\b|\bRCE\b|backdoor|compromis", re.I)),
    ("할인", re.compile(r"할인|무료|가격|요금|인하|프로모션|구독료|free|price|pricing|discount|cheaper|cost cut", re.I)),
    ("출시", re.compile(r"출시|공개|발표|선보|런칭|론칭|업데이트|launch|release|introduc|unveil|rolls? out|"
                       r"now available|debut|announc", re.I)),
]


def clean_title(t: str) -> str:
    t = html.unescape(re.sub(r"<[^>]+>", "", t or ""))
    return re.sub(r"\s+", " ", t).strip()


def norm_title(t: str) -> str:
    t = clean_title(t).lower()
    t = re.sub(r"\[[^\]]*\]|\([^)]*\)|【[^】]*】|<[^>]*>", " ", t)       # [속보] (종합) 등
    t = re.sub(r"[\"'“”‘’·…,.!?:;|/\\\-–—_~]+", " ", t)
    return re.sub(r"\s+", " ", t).strip()


def norm_url(u: str) -> str:
    p = urlsplit((u or "").strip())
    q = [(k, v) for k, v in parse_qsl(p.query) if not k.lower().startswith(("utm_", "fbclid", "gclid", "ref"))]
    path = p.path.rstrip("/") or "/"
    return urlunsplit((p.scheme.lower() or "https", p.netloc.lower(), path, urlencode(q), ""))


def item_id(url: str) -> str:
    return hashlib.sha1(norm_url(url).encode()).hexdigest()[:12]


def parse_feed(content: bytes):
    """RSS 2.0 / Atom → [{title, link, date}] (외부 라이브러리 없이 표준 라이브러리로 파싱)"""
    root = ET.fromstring(content)
    local = lambda el: el.tag.rsplit("}", 1)[-1]
    out = []
    for el in root.iter():
        if local(el) not in ("item", "entry"):
            continue
        title = link = date = ""
        for c in el:
            n = local(c)
            if n == "title":
                title = "".join(c.itertext())
            elif n == "link":
                href = c.get("href")
                if href and c.get("rel", "alternate") == "alternate":
                    link = link or href
                elif not href and (c.text or "").strip():
                    link = link or c.text.strip()
            elif n in ("pubDate", "published", "updated", "date") and not date:
                date = (c.text or "").strip()
        out.append({"title": title, "link": link, "date": date})
    return out


def parse_date(s: str) -> dt.datetime:
    """날짜 문자열 → UTC datetime (실패 시 지금)"""
    s = (s or "").strip()
    if not s:
        return NOW
    try:
        d = email.utils.parsedate_to_datetime(s)
        return (d if d.tzinfo else d.replace(tzinfo=dt.timezone.utc)).astimezone(dt.timezone.utc)
    except (TypeError, ValueError):
        pass
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%dT%H:%M:%S.%f%z", "%Y-%m-%d"):
        try:
            d = dt.datetime.strptime(s, fmt)
            if not d.tzinfo:          # 시간대 표기가 없으면 국내 매체 기준 한국 시간으로 간주
                d = d.replace(tzinfo=KST)
            return d.astimezone(dt.timezone.utc)
        except ValueError:
            continue
    return NOW


def tag_of(title: str) -> str:
    for name, rx in TAG_RULES:
        if rx.search(title):
            return name
    return "소식"


def lang_of(title: str) -> str:
    return "ko" if re.search(r"[가-힣]", title) else "en"


def from_feeds():
    out, ok = [], 0
    for f in FEEDS:
        try:
            r = requests.get(f["url"], headers=UA, timeout=20)
            r.raise_for_status()
            entries = parse_feed(r.content)
            ok += 1
        except Exception as e:  # 피드 하나가 실패해도 나머지는 계속
            print(f"[skip] {f['source']}: {e}", file=sys.stderr)
            continue
        for e in entries[:40]:
            title, link = clean_title(e["title"]), e["link"]
            if not title or not link:
                continue
            if f["ai_only"] and not AI_WORDS.search(title):
                continue
            out.append({"title": title, "url": link, "source": f["source"], "published": parse_date(e["date"])})
    print(f"RSS: {ok}/{len(FEEDS)} 피드, {len(out)}건")
    return out, ok


def from_naver():
    key_id, key = os.environ.get("NAVER_CLIENT_ID"), os.environ.get("NAVER_CLIENT_SECRET")
    if not key_id or not key:
        print("NAVER 키 없음 — 건너뜀")
        return [], 0
    out, ok = [], 0
    headers = {**UA, "X-NCP-APIGW-API-KEY-ID": key_id, "X-NCP-APIGW-API-KEY": key}
    for q in NAVER_QUERIES:
        try:
            r = requests.get(NAVER_URL, headers=headers, params={"query": q, "display": 20, "sort": "date"}, timeout=20)
            r.raise_for_status()
            items = r.json().get("items", [])
            ok += 1
        except Exception as e:
            print(f"[skip] NAVER '{q}': {e}", file=sys.stderr)
            continue
        for it in items:
            title = clean_title(it.get("title"))
            url = it.get("originallink") or it.get("link")
            if not title or not url or not AI_WORDS.search(title):
                continue
            host = urlsplit(url).netloc.replace("www.", "")
            out.append({"title": title, "url": url, "source": host or "네이버 뉴스",
                        "published": parse_date(it.get("pubDate", ""))})
    print(f"NAVER: {ok}/{len(NAVER_QUERIES)} 검색어, {len(out)}건")
    return out, ok


def load_existing():
    if not OUT.exists():
        return []
    try:
        data = json.loads(OUT.read_text(encoding="utf-8"))
    except ValueError:
        return []
    items = []
    for it in data.get("items", []):
        try:
            it["published"] = dt.datetime.fromisoformat(it["published"])
        except (KeyError, ValueError):
            continue
        items.append(it)
    return items


def main():
    existing = load_existing()
    feed_items, feeds_ok = from_feeds()
    naver_items, naver_ok = from_naver()
    if feeds_ok == 0 and naver_ok == 0:
        print("모든 출처가 실패해 기존 파일을 그대로 둡니다.")
        return

    cutoff = NOW - dt.timedelta(days=KEEP_DAYS)
    kept = [it for it in existing if it["published"] >= cutoff]
    seen_ids = {it["id"] for it in kept}
    seen_titles = [(norm_title(it["title"]), it["published"]) for it in kept]

    added = 0
    # 공식 블로그·RSS를 먼저 넣어 같은 소식이면 원출처가 남도록 함
    for raw in sorted(feed_items, key=lambda x: x["published"]) + sorted(naver_items, key=lambda x: x["published"]):
        pub = min(raw["published"], NOW)
        if pub < cutoff:
            continue
        iid = item_id(raw["url"])
        if iid in seen_ids:
            continue
        nt = norm_title(raw["title"])
        if len(nt) < 6:
            continue
        window = dt.timedelta(hours=SIMILAR_WINDOW_H)
        if any(abs(pub - p) <= window and difflib.SequenceMatcher(None, nt, t).ratio() >= SIMILAR
               for t, p in seen_titles):
            continue
        item = {"id": iid, "title": raw["title"][:160], "url": raw["url"], "source": raw["source"],
                "published": pub, "tag": tag_of(raw["title"]), "lang": lang_of(raw["title"])}
        kept.append(item)
        seen_ids.add(iid)
        seen_titles.append((nt, pub))
        added += 1

    kept.sort(key=lambda x: x["published"], reverse=True)
    kept = kept[:KEEP_MAX]
    if [it["id"] for it in kept] == [it["id"] for it in sorted(existing, key=lambda x: x["published"], reverse=True)]:
        print("바뀐 기사가 없어 파일을 그대로 둡니다.")   # 불필요한 커밋 방지
        return
    payload = {
        "updated_at": NOW.replace(microsecond=0).isoformat(),
        "count": len(kept),
        "items": [{**it, "published": it["published"].replace(microsecond=0).isoformat()} for it in kept],
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"새 기사 {added}건 추가, 총 {len(kept)}건 저장")


if __name__ == "__main__":
    main()
