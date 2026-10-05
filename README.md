# promme

AI 최상의 결과물을 위한 프롬프트 모음 웹 서비스 (UI 프로토타입)

## 파일 구성

| 파일 | 역할 |
| --- | --- |
| `index.html` | 화면 구조 (상단 바, 홈, 탭별 페이지, 하단 탭바) |
| `style.css` | 디자인. 맨 위 `:root`에 색상 · 둥글기 변수가 모여 있음 |
| `app.js` | 동작. 프롬프트 데이터, 검색 · 필터, 탭 전환, 뒤로/앞으로 |

## GitHub Pages로 올리기

1. GitHub에서 **New repository** → 이름 `promme` → Public → Create
2. 저장소 화면에서 **Add file → Upload files** → `index.html`, `style.css`, `app.js`, `README.md` 를 끌어다 놓고 **Commit changes**
3. **Settings → Pages** → Source를 `Deploy from a branch`, Branch를 `main` / `/ (root)` 로 두고 **Save**
4. 1~2분 뒤 `https://<내 아이디>.github.io/promme/` 에서 열림

파일을 고친 뒤 다시 업로드하면 몇 분 안에 사이트에 반영됩니다.

## 내 컴퓨터에서 미리 보기

`index.html` 을 더블클릭해도 열리지만, 실제와 똑같이 보려면 폴더에서 아래 명령을 실행하고 http://localhost:8000 에 접속하세요.

```bash
python3 -m http.server 8000
```

## 자주 바꿀 곳

- **배경색**: `style.css` → `--bg: rgb(249, 238, 209)`
- **프롬프트 카드**: `app.js` → `PROMPTS` 배열에 항목 추가
- **카테고리**: `app.js` → `CATS` 배열
- **탭바 알약의 출렁임**: `app.js` → `K`(강성), `D`(감쇠)
