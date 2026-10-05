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
| `supabase.sql` | Supabase에 만들 테이블과 보안 규칙 |
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
- **프롬프트 카드**: `app.js` → `PROMPTS` 배열
- **카테고리**: `app.js` → `CATS` 배열
- **폴더 아이콘 후보**: `app.js` → `FOLDER_EMOJIS`
- **탭바 알약의 출렁임**: `app.js` → `K`(강성), `D`(감쇠)
