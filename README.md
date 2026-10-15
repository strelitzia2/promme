# promme

AI 최상의 결과물을 위한 프롬프트 모음 웹 서비스 (UI 프로토타입)

사이트: https://strelitzia2.github.io/promme/

## 파일 구성

| 파일 | 역할 |
| --- | --- |
| `index.html` | 화면 구조 (상단 바, 홈, 탭별 페이지, 하단 탭바, 시트들) |
| `style.css` | 디자인. 맨 위 `:root`에 색상 · 둥글기 변수가 모여 있음 |
| `app.js` | 동작. 프롬프트 데이터, 검색, MY 아카이브 폴더, 날아가는 모션, 로그인, 뒤로/앞으로 |
| `config.js` | Supabase 연결 정보 (URL, anon 키) |
| `supabase.sql` | Supabase에 만들 테이블과 보안 규칙 (1단계: MY 아카이브) |
| `supabase-2-admin.sql` | 2단계: 최고 관리자 · 관리자 · 사용자 프롬프트 공유 · 뉴스 관리 |
| `images/` | 카드에 쓸 AI 이미지 (선택) |

## 로그인 켜기 (Supabase, 무료)

1. https://supabase.com 에서 가입 → **New project** (지역은 Northeast Asia (Seoul) 추천)
2. 왼쪽 **SQL Editor** → `supabase.sql` 내용을 붙여넣고 **Run**
3. **Authentication → URL Configuration**
   - Site URL: `https://strelitzia2.github.io/promme/`
   - Redirect URLs에도 같은 주소 추가
4. **Project Settings → API** 에서 `Project URL` 과 `anon public` 키를 복사해 `config.js` 에 넣기
   - `service_role` 키는 절대 넣지 마세요.
5. (선택) Google 로그인: **Authentication → Providers → Google** 켜고 `config.js` 의 `google: true`

로그인 전에는 MY 아카이브가 이 기기(브라우저)에만 저장되고, 로그인하면 그동안 모은 폴더가 계정으로 옮겨집니다.

## 카드 이미지 바꾸기

1. AI로 만든 그림을 `images/1.webp` 처럼 프롬프트 번호로 저장해 `images` 폴더에 올리기 (png, jpg도 가능)
2. `app.js` 의 `PROMPTS` 에서 해당 항목의 `img: ""` 를 `img: "images/1.webp"` 로 바꾸기

이미지가 없거나 경로가 틀리면 이모지가 대신 보입니다. 가로 800px 정도의 webp를 추천합니다.

## 내 컴퓨터에서 미리 보기

```bash
python3 -m http.server 8000
```
실행 후 http://localhost:8000 접속

## 자주 바꿀 곳

- **배경색**: `style.css` → `--bg: rgb(249, 238, 209)`
- **프롬프트 카드**: Supabase `prompts` 표 (관리자 페이지에서 수정). `app.js`의 `PROMPTS`는 서버에 못 붙을 때 보이는 예비 목록
- **카테고리**: `app.js` → `CATS` 배열
- **폴더 아이콘 후보**: `app.js` → `FOLDER_EMOJIS`
- **탭바 알약의 출렁임**: `app.js` → `K`(강성), `D`(감쇠)

## AI 성능 위키백과 데이터

- 위키 화면은 `wiki-data.js`(window.PROMME_WIKI)를 읽어서 그립니다.
- `wiki-data.js`는 `ai_wiki_csv` v2(조사 기준일 2026-10-14)에서 자동 생성한 파일입니다. 값을 고칠 때는 CSV를 고친 뒤 다시 생성하세요.
- 가격은 오늘 날짜 기준으로 `valid_from ≤ 지금 < valid_until`인 행만 "현재 가격"으로 보여 주고, 할인 종료 후 가격은 "다음 가격"으로 함께 표시합니다.
- 출처가 `secondary_source`(2차 자료)이거나 제3자 값이면 화면에 배지로 표시합니다.

## 관리자 · 프롬프트 공유

1. Supabase **SQL Editor**에서 `supabase-2-admin.sql` 맨 아래 `ADMIN_EMAIL_HERE`를 본인 이메일로 바꾸고 전체 실행 → 그 계정이 **최고 관리자**
   - 그 이메일로 promme에 먼저 회원가입되어 있어야 합니다. 여러 번 실행해도 안전합니다
   - 저장소가 공개라 이메일을 바꾼 파일은 GitHub에 올리지 마세요 (SQL Editor에서만 바꾸기)
2. 역할
   | 역할 | 할 수 있는 일 | 지정 방법 |
   | --- | --- | --- |
   | 최고 관리자 | 관리자가 하는 모든 일 + 관리자 추가 · 해제 | SQL Editor에서만 |
   | 관리자 | 승인 · 반려, 프롬프트 수정 · 숨김 · 삭제, 뉴스 관리 | 최고 관리자가 사이트의 **관리자 페이지 → 관리자** 탭에서 이메일로 추가 |
   - 최고 관리자는 화면에서 해제할 수 없습니다(실수 · 계정 탈취 방지). 바꾸려면 SQL 파일 맨 아래 참고 줄을 사용
3. 흐름
   - 로그인한 사람 → 홈 **＋ 내 프롬프트 공유하기** → 닉네임(처음 한 번) · 제목 · 분류 · 추천 AI · 아이콘 · 카드 색 · 본문 → '승인 대기'
   - 관리자 → 우측 상단 **내 계정 → 관리자 페이지** → 승인하면 그 즉시 홈에 공개 (AI·배포 필요 없음)
   - 반려 사유는 작성자의 '내 계정'에 보이고, 대기 글은 1인 5개까지
4. 관리자 페이지에서 할 수 있는 일
   - 승인 대기: 승인 · 반려(사유) · 수정
   - 프롬프트: 수정 · 숨기기/다시 공개 · 삭제 (기본 8개 포함)
   - 뉴스: 제목 · 분류 고치기, 숨기기 (Actions가 다시 수집해도 유지 — `news_overrides` 표)
   - 관리자(최고 관리자만): 가입 이메일로 관리자 추가, 권한 해제
5. 권한은 서버(Supabase RLS)가 판단합니다. 화면을 조작해도 관리자가 아니면 저장되지 않습니다.
