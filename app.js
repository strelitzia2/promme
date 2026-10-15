/* =========================================================
   promme — app.js
   1) 데이터            2) 아카이브 저장소 (이 기기 / Supabase)
   3) 홈 카드            4) MY 아카이브 화면
   5) 시트 공통 · 프롬프트 · 폴더 고르기 · 폴더 편집
   6) 날아가는 모션      7) 로그인 (Supabase)  7.5) 프롬프트 공유 · 관리자
   8) 오늘의 운세        9) 탭바 · 페이지 전환
   10) 뒤로 · 앞으로     11) 시작
   ========================================================= */

/* ================= 1) 데이터 (예시) =================
   img: AI로 만든 실제 그림 경로. 예) "images/1.webp"
   비워두거나 파일이 없으면 이모지(art)가 대신 보입니다. */
const CATS = [
  { id: "all",   name: "전체",        emo: "✨" },
  { id: "sns",   name: "SNS",         emo: "💬" },
  { id: "life",  name: "라이프스타일", emo: "📝" },
  { id: "study", name: "학습",        emo: "🎓" },
  { id: "image", name: "이미지 생성",  emo: "📷" },
];

const PROMPTS = [
  { id: 1, title: "셀카 + GPT로 피규어 만들기", cat: "image", tool: "ChatGPT", saves: "1.2k", art: "🧸", img: "images/1.webp", bg: "linear-gradient(135deg,#ffb7c5,#ffe1a8)",
    prompt: "첨부한 사진 속 인물을 1/7 스케일의 수집용 피규어로 만들어줘.\n- 투명 아크릴 받침대 위에 서 있는 모습\n- 뒤쪽에 피규어 박스 패키지 디자인\n- 책상 위, 자연광, 실사 느낌" },
  { id: 2, title: "인스타 프로필 소개글", cat: "sns", tool: "Claude", saves: "860", art: "📸", img: "", bg: "linear-gradient(135deg,#ffd6e8,#c9b8ff)",
    prompt: "너는 20대 감성의 인스타그램 카피라이터야.\n내 정보: [전공/취미/요즘 빠진 것]\n이 정보로 프로필 소개글 5개를 만들어줘. 각 30자 이내, 이모지 1~2개, 말투는 담백하게." },
  { id: 3, title: "캐릭캐릭 체인지", cat: "image", tool: "ChatGPT", saves: "2.4k", art: "🌸", img: "", bg: "linear-gradient(135deg,#9be7c4,#ffc0d9)",
    prompt: "첨부한 사진을 2000년대 일본 애니메이션 스타일 캐릭터로 바꿔줘.\n- 큰 눈, 선명한 셀 채색\n- 배경은 학교 운동장과 하늘\n- 원래 옷 색과 헤어스타일은 유지" },
  { id: 4, title: "요즘 유행 웹툰 한 컷", cat: "sns", tool: "ChatGPT", saves: "1.7k", art: "💭", img: "images/4.webp", bg: "linear-gradient(135deg,#ffe2a1,#f6a77a)",
    prompt: "아래 상황을 한국 웹툰 한 컷으로 그려줘.\n상황: [내가 겪은 웃긴 일]\n- 말풍선 하나, 한국어 대사\n- 과장된 표정, 깔끔한 선화" },
  { id: 5, title: "주 3회 운동 루틴", cat: "life", tool: "Claude", saves: "640", art: "🏃", img: "", bg: "linear-gradient(135deg,#bfe8ff,#d8f5c0)",
    prompt: "너는 퍼스널 트레이너야.\n내 정보: 운동 경험 [없음/초급], 목표 [체력/근력], 가능한 시간 [하루 40분]\n주 3회, 4주짜리 루틴을 표로 만들어줘. 각 운동에 세트·횟수·쉬는 시간 포함." },
  { id: 6, title: "일주일 자취 식단표", cat: "life", tool: "Gemini", saves: "520", art: "🍱", img: "", bg: "linear-gradient(135deg,#ffe9b0,#ffc9a3)",
    prompt: "자취생용 7일 식단표를 만들어줘.\n조건: 한 끼 재료비 5천원 이내, 조리 15분 이내, 전자레인지 활용\n요일별 아침·점심·저녁을 표로, 마지막에 장보기 목록까지." },
  { id: 7, title: "시험 전날 요약 노트", cat: "study", tool: "Claude", saves: "990", art: "📚", img: "", bg: "linear-gradient(135deg,#d4d8ff,#bfeaf0)",
    prompt: "첨부한 강의 자료를 시험 전날 30분 안에 볼 수 있게 요약해줘.\n- 핵심 개념 10개, 각 2줄\n- 자주 헷갈리는 비교 3개는 표로\n- 마지막에 예상 문제 5개와 정답" },
  { id: 8, title: "발표 슬라이드 뼈대", cat: "study", tool: "ChatGPT", saves: "710", art: "🎤", img: "", bg: "linear-gradient(135deg,#ffd0b5,#e7c6ff)",
    prompt: "주제: [발표 주제], 발표 시간: 10분, 청중: 같은 과 학생\n슬라이드 8장 구성으로 각 장의 제목, 핵심 문장 1개, 넣을 시각 자료를 제안해줘." },
];

PROMPTS.forEach((p, i) => { p.theme = i; p.status = "approved"; p.author = null; p.authorId = null; });

/* 카드 배경: 사용자가 올린 글은 색을 직접 쓰지 않고 이 8가지 중 번호로만 고름 */
const THEMES = PROMPTS.map((p) => p.bg);
/* 사용자 글에 쓸 수 있는 아이콘 (DB에서도 같은 목록만 허용) */
const PROMPT_EMOJIS = ["✨", "🧸", "📸", "🌸", "💭", "🏃", "🍱", "📚", "🎤", "🎨", "💡", "🎬", "🎧", "💼", "🗺️", "🧪"];
const TOOLS = ["ChatGPT", "Claude", "Gemini", "Perplexity", "Midjourney", "Copilot"];
const FOLDER_EMOJIS = ["📁", "✨", "🔖", "💡", "🎨", "📸", "📚", "🍱", "💪", "💼", "🌙", "🎧"];

/* ================= 공통 ================= */
const $ = (s) => document.querySelector(s);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ORDER = ["archive", "home", "news", "wiki", "fortune"];
const EASE = "cubic-bezier(.32,.72,0,1)";        // 부드럽게 감속 (iOS 시트 느낌)
const EASE_BOUNCE = "cubic-bezier(.34,1.25,.5,1)"; // 살짝 튕기며 멈춤
const byId = (id) => PROMPTS.find((p) => p.id === id);
const catName = (id) => (CATS.find((c) => c.id === id) || { name: "기타" }).name;
const bgOf = (p) => THEMES[p.theme] || THEMES[0];
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const newId = () => (crypto.randomUUID ? crypto.randomUUID()
  : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = (Math.random() * 16) | 0; return (c === "x" ? r : (r & 3) | 8).toString(16); }));

const state = { cat: "all", q: "", view: "grid" };
let current = "home";        // 현재 탭
let archiveView = null;      // null = 폴더 목록, "all" = 전체, 그 외 = 폴더 id

/* ================= 2) 아카이브 저장소 =================
   로그아웃 상태: 이 기기(localStorage)에 저장
   로그인 상태: Supabase(folders, saves 테이블)에 저장 */
const CFG = window.PROMME_CONFIG || {};
const sb = CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase && window.supabase.createClient
  ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey)
  : null;
let user = null;

const store = { folders: [], saves: [] };   // saves: { prompt_id, folder_id, created_at }
const LOCAL_KEY = "promme-archive-v2";

function loadLocal() {
  store.folders = []; store.saves = [];
  try {
    const d = JSON.parse(localStorage.getItem(LOCAL_KEY) || "null");
    if (d) { store.folders = d.folders || []; store.saves = d.saves || []; return; }
    // 이전 버전(북마크만 있던 시절) 데이터 옮기기
    const old = JSON.parse(localStorage.getItem("promme-saved") || "[]");
    if (old.length) {
      const f = { id: newId(), name: "저장한 프롬프트", emoji: "✨", created_at: new Date().toISOString() };
      store.folders.push(f);
      old.forEach((pid) => store.saves.push({ prompt_id: pid, folder_id: f.id, created_at: new Date().toISOString() }));
      saveLocal();
      localStorage.removeItem("promme-saved");
    }
  } catch (e) {}
}
function saveLocal() {
  if (user) return;
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(store)); } catch (e) {}
}
async function remote(run) {
  if (!user || !sb) return;
  const { error } = await run();
  if (error) {
    console.error(error);
    toast("서버에 저장하지 못했어요. 잠시 후 다시 시도해 주세요");
    await pullRemote();
  }
}

const saveOf = (pid) => store.saves.find((s) => s.prompt_id === pid);
const folderOf = (fid) => store.folders.find((f) => f.id === fid);
const savesIn = (fid) => store.saves.filter((s) => fid === "all" || s.folder_id === fid)
  .sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));

function createFolder(name, emoji) {
  const f = { id: newId(), name: name.trim().slice(0, 20), emoji, created_at: new Date().toISOString() };
  store.folders.push(f);
  saveLocal();
  remote(() => sb.from("folders").insert({ id: f.id, name: f.name, emoji: f.emoji, user_id: user.id }));
  return f;
}
function updateFolder(fid, name, emoji) {
  const f = folderOf(fid); if (!f) return;
  f.name = name.trim().slice(0, 20); f.emoji = emoji;
  saveLocal();
  remote(() => sb.from("folders").update({ name: f.name, emoji: f.emoji }).eq("id", fid));
}
function deleteFolder(fid) {
  store.folders = store.folders.filter((f) => f.id !== fid);
  store.saves = store.saves.filter((s) => s.folder_id !== fid);
  saveLocal();
  remote(() => sb.from("folders").delete().eq("id", fid));   // 담긴 항목은 DB에서 함께 삭제(cascade)
}
function savePrompt(pid, fid) {
  store.saves = store.saves.filter((s) => s.prompt_id !== pid);
  store.saves.push({ prompt_id: pid, folder_id: fid, created_at: new Date().toISOString() });
  saveLocal();
  remote(() => sb.from("saves").upsert({ prompt_id: pid, folder_id: fid, user_id: user.id }, { onConflict: "user_id,prompt_id" }));
}
function unsavePrompt(pid) {
  store.saves = store.saves.filter((s) => s.prompt_id !== pid);
  saveLocal();
  remote(() => sb.from("saves").delete().eq("prompt_id", pid));
}

async function pullRemote() {
  if (!user || !sb) return;
  const [f, s] = await Promise.all([
    sb.from("folders").select("id,name,emoji,created_at").order("created_at"),
    sb.from("saves").select("prompt_id,folder_id,created_at"),
  ]);
  if (f.error || s.error) { console.error(f.error || s.error); toast("아카이브를 불러오지 못했어요"); return; }
  store.folders = f.data; store.saves = s.data;
  renderAll();
}
/* 로그인 직전까지 이 기기에 모아둔 폴더를 계정으로 옮김 */
async function mergeLocalIntoRemote() {
  let local = null;
  try { local = JSON.parse(localStorage.getItem(LOCAL_KEY) || "null"); } catch (e) {}
  if (!local || !local.folders || !local.folders.length) return;
  const r1 = await sb.from("folders").upsert(
    local.folders.map((f) => ({ id: f.id, name: f.name, emoji: f.emoji, user_id: user.id })), { onConflict: "id" });
  if (r1.error) { console.error(r1.error); return; }
  if (local.saves && local.saves.length) {
    const r2 = await sb.from("saves").upsert(
      local.saves.map((s) => ({ prompt_id: s.prompt_id, folder_id: s.folder_id, user_id: user.id })), { onConflict: "user_id,prompt_id" });
    if (r2.error) { console.error(r2.error); return; }
  }
  try { localStorage.removeItem(LOCAL_KEY); } catch (e) {}
  toast("이 기기에 담아둔 폴더를 계정으로 옮겼어요");
}

/* ================= 3) 홈 카드 ================= */
const bookmarkSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z"/></svg>';

/* 썸네일 안쪽: 이모지 + (있으면) 실제 이미지. 이미지가 뜨면 이모지는 숨김 */
function artInner(p) {
  return `<div class="art" aria-hidden="true">${esc(p.art)}</div>` +
    (p.img ? `<img class="shot" src="${esc(p.img)}" alt="" loading="lazy" decoding="async" onload="this.parentNode.classList.add('has-img')" onerror="this.remove()">` : "");
}

function cardHTML(p) {
  const s = saveOf(p.id), f = s && folderOf(s.folder_id);
  return `<article class="card" tabindex="0" data-id="${p.id}">
    <div class="thumb" style="background:${bgOf(p)}">
      ${artInner(p)}
      <div class="cap"><span>${esc(p.title)}</span>
        <button class="save" data-save="${p.id}" aria-pressed="${!!s}" aria-label="${s ? `‘${esc(f ? f.name : "")}’ 폴더에 담김` : "폴더에 담기"}">${bookmarkSvg}</button></div>
    </div>
    <div class="meta"><span class="list-title">${esc(p.title)}</span><span>${esc(p.tool)} · ${catName(p.cat)}</span>${p.author ? `<span class="by">@${esc(p.author)}</span>` : p.saves ? `<span>저장 ${esc(p.saves)}</span>` : "<span></span>"}</div>
  </article>`;
}

function renderHome() {
  const q = state.q.trim().toLowerCase();
  const list = PROMPTS.filter((p) => p.status === "approved" &&
    (state.cat === "all" || p.cat === state.cat) &&
    (!q || (p.title + p.prompt + p.tool + (p.author || "")).toLowerCase().includes(q)));
  $("#grid").innerHTML = list.length
    ? list.map(cardHTML).join("")
    : `<div class="empty">“${esc(state.q)}”에 맞는 프롬프트가 아직 없어요.</div>`;
  $("#grid").classList.toggle("list", state.view === "list");
}

/* 카테고리 칩 */
$("#chips").innerHTML = CATS.map((c) =>
  `<button class="chip pill" data-cat="${c.id}" aria-pressed="${c.id === state.cat}"><span class="emo">${c.emo}</span>${c.name}</button>`).join("");
function setCat(cat) {
  state.cat = cat;
  document.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c.dataset.cat === cat));
  renderHome();
}
$("#chips").addEventListener("click", (e) => {
  const b = e.target.closest(".chip");
  if (!b || b.dataset.cat === state.cat) return;
  flip($("#grid"), () => setCat(b.dataset.cat));
  recordNav();
});

/* 카드 재배치 애니메이션 (FLIP)
   바뀌기 전 위치를 기억했다가, 바뀐 뒤 그 자리에서 새 자리로 미끄러지게 함.
   새로 나타나는 카드는 아래에서 살짝 떠오름. */
function flip(container, mutate) {
  if (reduce || !container || !container.animate) { mutate(); return; }
  const before = new Map([...container.querySelectorAll(".card[data-id]")].map((el) => [el.dataset.id, el.getBoundingClientRect()]));
  mutate();
  let fresh = 0;
  container.querySelectorAll(".card[data-id]").forEach((el) => {
    const b = before.get(el.dataset.id), a = el.getBoundingClientRect();
    if (b) {
      const dx = b.left - a.left, dy = b.top - a.top, sx = b.width / a.width, sy = b.height / a.height;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < 0.01 && Math.abs(sy - 1) < 0.01) return;
      el.animate(
        [{ transformOrigin: "top left", transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
         { transformOrigin: "top left", transform: "none" }],
        { duration: 620, easing: EASE });
    } else {
      el.animate([{ opacity: 0, transform: "translateY(18px) scale(.96)" }, { opacity: 1, transform: "none" }],
        { duration: 520, delay: Math.min(fresh++, 8) * 35, easing: EASE, fill: "backwards" });
    }
  });
}

/* 검색 */
function syncSearch(v) { state.q = v; $("#searchInput").value = v; $("#miniInput").value = v; renderHome(); }
$("#searchInput").addEventListener("input", (e) => syncSearch(e.target.value));
$("#miniInput").addEventListener("input", (e) => { syncSearch(e.target.value); if (current !== "home") selectTab("home"); });

/* 보기 방식 */
["#viewGrid", "#viewList"].forEach((sel) => $(sel).addEventListener("click", () => {
  state.view = sel === "#viewList" ? "list" : "grid";
  $("#viewGrid").setAttribute("aria-pressed", state.view === "grid");
  $("#viewList").setAttribute("aria-pressed", state.view === "list");
  moveSlideInd($(".seg"));
  const box = current === "archive" ? $("#archiveRoot") : $("#grid");
  flip(box, () => { renderHome(); renderArchive(); });
}));

/* 카드 클릭 → 상세 / 북마크 → 폴더 고르기 */
function onCardClick(e) {
  const s = e.target.closest("[data-save]");
  if (s) {
    e.stopPropagation();
    openPicker(+s.dataset.save, s.closest(".thumb"));
    return;
  }
  const c = e.target.closest(".card");
  if (c) openPrompt(byId(+c.dataset.id));
}
["#grid", "#archiveRoot"].forEach((g) => {
  $(g).addEventListener("click", onCardClick);
  $(g).addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.classList.contains("card")) onCardClick(e); });
});

/* ================= 4) MY 아카이브 화면 ================= */
function tileHTML(p) {
  return `<div class="tile" style="background:${bgOf(p)}">${esc(p.art)}${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy" onerror="this.remove()">` : ""}</div>`;
}
function collageHTML(fid, emoji) {
  const items = savesIn(fid).slice(0, 4).map((s) => byId(s.prompt_id)).filter(Boolean);
  if (!items.length) return `<div class="collage empty">${emoji}</div>`;
  return `<div class="collage n${items.length}">${items.map(tileHTML).join("")}</div>`;
}
function folderCardHTML(fid, name, emoji) {
  const n = savesIn(fid).length;
  return `<button class="folder" data-folder="${fid}">
    ${collageHTML(fid, emoji)}
    <div class="folder-meta"><span aria-hidden="true">${emoji}</span><span class="fn">${esc(name)}</span><span class="fc">${n}개</span></div>
  </button>`;
}

function renderArchive() {
  const root = $("#archiveRoot");
  if (archiveView && archiveView !== "all" && !folderOf(archiveView)) archiveView = null;   // 삭제된 폴더

  if (archiveView === null) {
    const total = store.saves.length;
    const head = `<div class="arc-head">
        <div><h2>MY 아카이브</h2><p class="lede">${user ? "계정에 저장 중" : "이 기기에 저장 중"} · 프롬프트 ${total}개 · 폴더 ${store.folders.length}개</p></div>
        <button class="btn" data-act="new-folder">+ 새 폴더</button>
      </div>`;
    if (!store.folders.length) {
      root.innerHTML = head + `<div class="arc-empty"><span class="big">🗂️</span>
        아직 폴더가 없어요.<br>홈에서 카드의 북마크를 누르면 나만의 폴더를 만들어 담을 수 있어요.
        ${!user ? `<br><br><button class="btn soft" data-act="login">로그인하고 어디서나 보기</button>` : ""}</div>`;
      return;
    }
    root.innerHTML = head + `<div class="folders">
      ${total ? folderCardHTML("all", "전체", "🗂️") : ""}
      ${store.folders.map((f) => folderCardHTML(f.id, f.name, f.emoji)).join("")}
      <button class="folder add" data-act="new-folder"><div class="collage empty">＋</div><div class="folder-meta"><span class="fn">새 폴더</span></div></button>
    </div>`;
    return;
  }

  const isAll = archiveView === "all";
  const f = isAll ? { name: "전체", emoji: "🗂️" } : folderOf(archiveView);
  const items = savesIn(archiveView).map((s) => byId(s.prompt_id)).filter(Boolean);
  root.innerHTML = `<div class="arc-head">
      <div class="folder-title">
        <span class="big-emo" aria-hidden="true">${f.emoji}</span>
        <div style="min-width:0"><h2>${esc(f.name)}</h2><p class="lede">${items.length}개 담김</p></div>
      </div>
      <div class="folder-tools">
        <button class="back-chip" data-act="folders"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>폴더 목록</button>
        ${isAll ? "" : `<button class="back-chip" data-act="edit-folder">편집</button>`}
      </div>
    </div>
    ${items.length
      ? `<div class="grid ${state.view === "list" ? "list" : ""}">${items.map(cardHTML).join("")}</div>`
      : `<div class="arc-empty"><span class="big">${f.emoji}</span>아직 비어 있어요.<br>홈에서 북마크를 눌러 이 폴더를 고르면 여기에 들어와요.</div>`}`;
}

$("#archiveRoot").addEventListener("click", (e) => {
  const fo = e.target.closest("[data-folder]");
  if (fo) { openFolder(fo.dataset.folder); return; }
  const act = e.target.closest("[data-act]");
  if (!act) return;
  const a = act.dataset.act;
  if (a === "new-folder") openFolderForm(null);
  if (a === "edit-folder") openFolderForm(archiveView);
  if (a === "folders") openFolder(null);
  if (a === "login") openAuth();
});
function openFolder(fid) {
  if (archiveView === fid) return;
  const deeper = fid !== null;          // 폴더 안으로 들어가면 오른쪽에서, 나오면 왼쪽에서
  archiveView = fid;
  slideIn($("#archiveRoot"), deeper ? 1 : -1, renderArchive);
  scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  recordNav();
}
/* 내용을 바꾼 뒤 옆에서 부드럽게 밀려 들어오게 */
function slideIn(el, dir, mutate) {
  mutate();
  if (reduce || !el.animate) return;
  el.animate([{ opacity: 0, transform: `translateX(${dir * 36}px)` }, { opacity: 1, transform: "none" }],
    { duration: 560, easing: EASE });
}

/* 선택 표시 알약을 해당 버튼 아래로 미끄러뜨림 (보기 방식, 로그인/회원가입) */
function moveSlideInd(group, instant) {
  if (!group) return;
  let ind = group.querySelector(".slide-ind");
  if (!ind) { ind = document.createElement("span"); ind.className = "slide-ind"; group.prepend(ind); instant = true; }
  const on = group.querySelector('[aria-pressed="true"]');
  if (!on || !on.offsetWidth) return;
  if (instant) ind.style.transition = "none";
  ind.style.width = on.offsetWidth + "px";
  ind.style.transform = `translateX(${on.offsetLeft}px)`;
  if (instant) { ind.offsetWidth; ind.style.transition = ""; }
}

function renderBadge(pop) {
  const b = $("#archiveBadge"), n = store.saves.length;
  b.hidden = n === 0;
  b.textContent = n > 99 ? "99+" : n;
  if (pop && n && !reduce) b.animate([{ transform: "scale(.4)" }, { transform: "scale(1.35)" }, { transform: "scale(1)" }], { duration: 420, easing: "cubic-bezier(.22,1.4,.36,1)" });
}
let flying = 0;
function renderAll() {
  renderHome();
  renderArchive();
  if (!flying) renderBadge(false);
  renderAuthButton();
}

/* ================= 5) 시트 공통 ================= */
function openModal(id) {
  const s = $(id), sheet = s.querySelector(".sheet");
  sheet.style.transform = "";
  s.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => s.classList.add("open")));   // 두 프레임 뒤: 시작 위치가 그려진 다음 올라오게
}
function closeModal(id) {
  const s = $(id);
  s.classList.remove("open");
  s.querySelector(".sheet").style.transform = "";
  setTimeout(() => { if (!s.classList.contains("open")) s.hidden = true; }, reduce ? 0 : 460);
}

/* 시트 손잡이: 아래로 끌면 따라 내려오고, 충분히 내리거나 빠르게 튕기면 닫힘 */
document.querySelectorAll(".scrim .sheet").forEach((sheet) => {
  const grab = document.createElement("button");
  grab.type = "button"; grab.className = "sheet-grab"; grab.setAttribute("aria-label", "아래로 끌어서 닫기");
  sheet.prepend(grab);
  let start = null;
  grab.addEventListener("pointerdown", (e) => {
    start = { y: e.clientY, t: performance.now(), dy: 0 };
    grab.setPointerCapture(e.pointerId);
    sheet.classList.add("dragging");
  });
  grab.addEventListener("pointermove", (e) => {
    if (!start) return;
    const dy = e.clientY - start.y;
    start.dy = dy > 0 ? dy : dy / 6;               // 위로는 고무줄처럼 조금만
    sheet.style.transform = `translateY(${start.dy}px)`;
  });
  const end = () => {
    if (!start) return;
    const v = start.dy / Math.max(1, performance.now() - start.t);   // px/ms
    sheet.classList.remove("dragging");
    const scrimId = "#" + sheet.closest(".scrim").id;
    if (start.dy > 110 || (v > 0.6 && start.dy > 20)) closeModal(scrimId);
    else sheet.style.transform = "";             // 제자리로 부드럽게 복귀
    start = null;
  };
  grab.addEventListener("pointerup", end);
  grab.addEventListener("pointercancel", end);
});
document.addEventListener("click", (e) => {
  const c = e.target.closest("[data-close]");
  if (c) { closeModal("#" + c.closest(".scrim").id); return; }
  if (e.target.classList && e.target.classList.contains("scrim")) closeModal("#" + e.target.id);
});
addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  const open = [...document.querySelectorAll(".scrim.open")].pop();
  if (open) closeModal("#" + open.id);
});

/* --- 프롬프트 상세 --- */
let sheetP = null;
function openPrompt(p) {
  sheetP = p;
  $("#sTitle").textContent = p.title;
  $("#sSub").textContent = [p.tool, catName(p.cat), p.author ? `@${p.author}` : p.saves ? `저장 ${p.saves}` : ""].filter(Boolean).join(" · ");
  $("#sEdit").hidden = !me.admin;
  $("#sPrompt").textContent = p.prompt;
  const s = saveOf(p.id), f = s && folderOf(s.folder_id);
  $("#sSave").textContent = f ? `${f.emoji} ${f.name}에 담김` : "폴더에 담기";
  openModal("#promptScrim");
  $("#sCopy").focus();
}
$("#sCopy").addEventListener("click", () => {
  navigator.clipboard.writeText(sheetP.prompt)
    .then(() => toast("복사했어요. AI 채팅창에 붙여넣으세요"))
    .catch(() => {
      const r = document.createRange(); r.selectNodeContents($("#sPrompt"));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      toast("텍스트를 선택했어요. 직접 복사해 주세요");
    });
});
$("#sSave").addEventListener("click", () => {
  closeModal("#promptScrim");
  const card = document.querySelector(`.page:not([hidden]) .card[data-id="${sheetP.id}"] .thumb`);
  openPicker(sheetP.id, card);
});

/* --- 폴더 고르기 --- */
const picker = { pid: null, origin: null, emoji: "📁" };
function emojiPickHTML(selected) {
  return FOLDER_EMOJIS.map((em) => `<button type="button" role="radio" aria-checked="${em === selected}" data-emo="${em}">${em}</button>`).join("");
}
function bindEmojiPick(el, onPick) {
  el.addEventListener("click", (e) => {
    const b = e.target.closest("[data-emo]"); if (!b) return;
    el.querySelectorAll("[data-emo]").forEach((x) => x.setAttribute("aria-checked", x === b));
    onPick(b.dataset.emo);
  });
}
function openPicker(pid, originEl) {
  const p = byId(pid), s = saveOf(pid);
  picker.pid = pid; picker.origin = originEl; picker.emoji = "📁";
  $("#pkThumb").style.background = bgOf(p);
  $("#pkThumb").innerHTML = esc(p.art) + (p.img ? `<img src="${esc(p.img)}" alt="" onerror="this.remove()">` : "");
  $("#pkTitle").textContent = s ? "다른 폴더로 옮길까요?" : "어느 폴더에 담을까요?";
  $("#pkSub").textContent = p.title;
  $("#pkList").innerHTML = store.folders.length
    ? store.folders.map((f) => `<button class="frow" data-pick="${f.id}" aria-current="${!!s && s.folder_id === f.id}">
        <span class="femo">${f.emoji}</span><span class="fname">${esc(f.name)}</span><span class="fcount">${savesIn(f.id).length}개</span></button>`).join("")
    : `<p class="label" style="margin:0">아직 폴더가 없어요. 아래에서 첫 폴더를 만들어 보세요.</p>`;
  $("#pkEmoji").innerHTML = emojiPickHTML(picker.emoji);
  $("#pkName").value = "";
  $("#pkUnsave").hidden = !s;
  openModal("#pickerScrim");
}
bindEmojiPick($("#pkEmoji"), (em) => (picker.emoji = em));

function commitSave(fid) {
  const pid = picker.pid, p = byId(pid);
  const rect = picker.origin && picker.origin.isConnected ? picker.origin.getBoundingClientRect() : null;
  const already = saveOf(pid) && saveOf(pid).folder_id === fid;
  closeModal("#pickerScrim");
  if (already) return;
  savePrompt(pid, fid);
  const f = folderOf(fid);
  flying++;
  renderAll();
  flyToArchive(rect, p, () => { flying--; renderBadge(true); toast(`${f.emoji} ${f.name}에 담았어요`); });
}
$("#pkList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-pick]");
  if (b) commitSave(b.dataset.pick);
});
$("#pkNew").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#pkName").value.trim();
  if (!name) { $("#pkName").focus(); return; }
  const f = createFolder(name, picker.emoji);
  commitSave(f.id);
});
$("#pkUnsave").addEventListener("click", () => {
  unsavePrompt(picker.pid);
  closeModal("#pickerScrim");
  renderAll();
  toast("저장을 취소했어요");
});

/* --- 폴더 만들기 · 편집 --- */
const ff = { fid: null, emoji: "📁", confirm: false };
function openFolderForm(fid) {
  const f = fid && folderOf(fid);
  ff.fid = f ? fid : null; ff.emoji = f ? f.emoji : "📁"; ff.confirm = false;
  $("#ffTitle").textContent = f ? "폴더 편집" : "새 폴더";
  $("#ffSubmit").textContent = f ? "저장" : "만들기";
  $("#ffName").value = f ? f.name : "";
  $("#ffEmoji").innerHTML = emojiPickHTML(ff.emoji);
  const del = $("#ffDelete");
  del.hidden = !f; del.classList.remove("confirm"); del.textContent = "폴더 삭제";
  openModal("#folderScrim");
  setTimeout(() => $("#ffName").focus(), 50);
}
bindEmojiPick($("#ffEmoji"), (em) => (ff.emoji = em));
$("#ffForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#ffName").value.trim();
  if (!name) return;
  if (ff.fid) { updateFolder(ff.fid, name, ff.emoji); toast("폴더를 고쳤어요"); }
  else { const f = createFolder(name, ff.emoji); toast(`${f.emoji} ${f.name} 폴더를 만들었어요`); }
  closeModal("#folderScrim");
  renderAll();
});
$("#ffDelete").addEventListener("click", () => {
  const del = $("#ffDelete");
  if (!ff.confirm) {   // 실수 방지: 한 번 더 누르면 삭제
    ff.confirm = true;
    const n = savesIn(ff.fid).length;
    del.classList.add("confirm");
    del.textContent = n ? `안의 ${n}개까지 삭제할까요?` : "정말 삭제할까요?";
    return;
  }
  deleteFolder(ff.fid);
  closeModal("#folderScrim");
  archiveView = null;
  renderAll();
  recordNav();
  toast("폴더를 삭제했어요");
});

/* ================= 6) 날아가는 모션 =================
   카드 썸네일 복제본이 포물선을 그리며 작아지면서
   하단 'MY 아카이브' 탭으로 쏙 들어감 → 탭이 통통 튀고 배지 숫자가 올라감 */
function bumpArchiveTab() {
  const t = tabs[ORDER.indexOf("archive")];
  if (reduce) return;
  t.animate([{ transform: "scale(1)" }, { transform: "scale(1.22) translateY(-3px)" }, { transform: "scale(.94)" }, { transform: "scale(1)" }],
    { duration: 560, easing: "ease-out" });
  const r = t.querySelector("svg").getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 7; i++) {       // 반짝이 가루
    const s = document.createElement("i");
    s.className = "spark";
    s.style.left = cx - 4 + "px"; s.style.top = cy - 4 + "px";
    document.body.appendChild(s);
    const a = (Math.PI * 2 * i) / 7 - Math.PI / 2, d = 26 + Math.random() * 14;
    s.animate([{ transform: "translate(0,0) scale(1)", opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) scale(.2)`, opacity: 0 }],
      { duration: 520, easing: "cubic-bezier(.2,.8,.3,1)" }).onfinish = () => s.remove();
  }
}
function flyToArchive(rect, p, done) {
  const target = tabs[ORDER.indexOf("archive")].querySelector("svg").getBoundingClientRect();
  if (reduce || !rect || !document.body.animate) { bumpArchiveTab(); done(); return; }

  const el = document.createElement("div");
  el.className = "flyer";
  el.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;background:${bgOf(p)}`;
  el.innerHTML = `<div class="art">${esc(p.art)}</div>` + (p.img ? `<img src="${esc(p.img)}" alt="" onerror="this.remove()">` : "");
  document.body.appendChild(el);

  const x0 = rect.left + rect.width / 2, y0 = rect.top + rect.height / 2;
  const x2 = target.left + target.width / 2, y2 = target.top + target.height / 2;
  const x1 = x0 + (x2 - x0) * 0.25, y1 = Math.min(y0, y2) - Math.max(140, rect.height);   // 위로 솟았다 떨어지는 곡선
  const endScale = 26 / Math.max(rect.width, rect.height);
  const N = 30, frames = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const bx = u * u * x0 + 2 * u * t * x1 + t * t * x2;
    const by = u * u * y0 + 2 * u * t * y1 + t * t * y2;
    const lift = 1 + 0.08 * Math.sin(Math.PI * Math.min(t * 3, 1));          // 처음에 살짝 들어올림
    const s = (1 + (endScale - 1) * Math.pow(t, 1.3)) * lift;
    const rot = -16 * Math.sin(Math.PI * t);
    frames.push({
      offset: t,
      transform: `translate(${bx - x0}px, ${by - y0}px) scale(${s}) rotate(${rot}deg)`,
      borderRadius: `${20 + 30 * t}%`,
      opacity: t < 0.85 ? 1 : 1 - (t - 0.85) / 0.15 * 0.7,
    });
  }
  el.animate(frames, { duration: 820, easing: "cubic-bezier(.45,0,.2,1)" }).onfinish = () => {
    el.remove();
    bumpArchiveTab();
    done();
  };
}

/* ================= 7) 로그인 (Supabase) ================= */
let authMode = "login";
function setAuthMode(m) {
  authMode = m;
  document.querySelectorAll(".mode-tabs [data-mode]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.mode === m));
  $("#authSubmit").textContent = m === "login" ? "로그인" : "회원가입";
  $("#authPw").autocomplete = m === "login" ? "current-password" : "new-password";
  setAuthMsg("");
  moveSlideInd($(".mode-tabs"));
}
function setAuthMsg(t, ok) { const m = $("#authMsg"); m.textContent = t; m.classList.toggle("ok", !!ok); }
function openAuth() {
  setAuthMode("login");
  $("#authNotice").hidden = !!sb;
  [...$("#authForm").elements].forEach((el) => (el.disabled = !sb));
  $("#oauthBox").hidden = !(sb && CFG.google);
  openModal("#authScrim");
  requestAnimationFrame(() => moveSlideInd($(".mode-tabs"), true));
  if (sb) setTimeout(() => $("#authEmail").focus({ preventScroll: true }), 120);
}
document.querySelectorAll(".mode-tabs [data-mode]").forEach((b) => b.addEventListener("click", () => setAuthMode(b.dataset.mode)));

function authErrorText(err) {
  const m = (err && err.message) || "";
  if (/Invalid login credentials/i.test(m)) return "이메일이나 비밀번호가 맞지 않아요.";
  if (/already registered|already exists/i.test(m)) return "이미 가입된 이메일이에요. 로그인해 주세요.";
  if (/Email not confirmed/i.test(m)) return "메일함에서 가입 확인 링크를 먼저 눌러주세요.";
  if (/Password should be/i.test(m)) return "비밀번호는 6자 이상이어야 해요.";
  if (/rate limit|too many/i.test(m)) return "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.";
  if (/valid email|invalid format/i.test(m)) return "이메일 주소를 다시 확인해 주세요.";
  return "잠시 문제가 생겼어요. 다시 시도해 주세요.";
}
$("#authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!sb) return;
  const email = $("#authEmail").value.trim(), password = $("#authPw").value;
  const btn = $("#authSubmit");
  btn.disabled = true; setAuthMsg("");
  try {
    if (authMode === "login") {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      closeModal("#authScrim");
      $("#authPw").value = "";
    } else {
      const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: location.origin + location.pathname } });
      if (error) throw error;
      if (data.session) { closeModal("#authScrim"); toast("가입을 환영해요!"); }
      else setAuthMsg("확인 메일을 보냈어요. 메일의 링크를 누르면 가입이 끝나요.", true);
      $("#authPw").value = "";
    }
  } catch (err) {
    setAuthMsg(authErrorText(err));
  } finally {
    btn.disabled = false;
  }
});
$("#googleBtn").addEventListener("click", () => {
  if (sb) sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
});

function renderAuthButton() {
  const btn = $("#loginBtn"), av = $("#loginAvatar");
  if (user) {
    const ch = (user.email || "?").charAt(0).toUpperCase();
    av.className = "avatar on"; av.textContent = ch;
    $("#loginLabel").textContent = "내 계정";
    btn.classList.add("signed");
  } else {
    av.className = "avatar";
    av.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="10" r="3"/><path d="M6.5 18.5a6.5 6.5 0 0 1 11 0"/></svg>';
    $("#loginLabel").textContent = "로그인";
    btn.classList.remove("signed");
  }
  const pend = me.admin ? pendingCount() : 0;
  $("#adminBadge").hidden = !pend;
  $("#adminBadge").textContent = pend > 99 ? "99+" : pend;
}
$("#loginBtn").addEventListener("click", () => {
  if (!user) { openAuth(); return; }
  renderAccount();
  openModal("#accountScrim");
});
$("#acArchive").addEventListener("click", () => { closeModal("#accountScrim"); selectTab("archive"); });
$("#acLogout").addEventListener("click", async () => {
  closeModal("#accountScrim");
  await sb.auth.signOut();
  toast("로그아웃했어요");
});

let sessionUserId;
async function handleSession(session) {
  const nu = (session && session.user) || null;
  if ((nu && nu.id) === sessionUserId) return;
  sessionUserId = nu && nu.id;
  user = nu;
  renderAuthButton();
  await loadMe();
  await loadPrompts();
  if (user) {
    await mergeLocalIntoRemote();
    await pullRemote();
  } else {
    loadLocal();
    renderAll();
  }
  if (news.raw.length) applyNews();
}
if (sb) {
  // 콜백 안에서 바로 Supabase를 다시 부르면 멈출 수 있어서 한 박자 뒤에 처리
  sb.auth.onAuthStateChange((_event, session) => { setTimeout(() => handleSession(session), 0); });
}

/* 상단 미니 검색 */
function updateMiniSearch() {
  const hidden = current !== "home" || $("#bigSearch").getBoundingClientRect().bottom < 70;
  $("#miniSearch").classList.toggle("show", hidden);
}
addEventListener("scroll", updateMiniSearch, { passive: true });

let toastTimer;
function toast(m) {
  const t = $("#toast");
  t.textContent = m; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1900);
}

/* ================= 7.5) 프롬프트 공유 · 관리자 =================
   - 로그인한 사람: 홈에 프롬프트를 올림 → '승인 대기'
   - 관리자: 승인하면 그 즉시 홈에 공개 / 수정 · 숨김 · 삭제 / 뉴스 제목·분류 수정, 숨기기
   - 누가 관리자인지, 무엇을 바꿀 수 있는지는 Supabase(RLS)가 서버에서 판단함.
     화면의 관리자 메뉴는 보여주기만 할 뿐, 일반 사용자가 억지로 열어도 저장되지 않음
   - 사용자가 쓴 글자는 모두 esc() 또는 textContent로만 화면에 넣음 */
const me = { nick: null, admin: false };
const NICK_RE = /^[0-9A-Za-z가-힣_]{2,16}$/;
const STATUS = { pending: "검토 중", approved: "공개", rejected: "반려", hidden: "숨김" };
const STATUS_HINT = { pending: "관리자가 확인하고 있어요", approved: "홈에 공개됐어요", rejected: "공개되지 않았어요", hidden: "관리자가 잠시 숨겼어요" };
const stOf = (p) => (STATUS[p.status] ? p.status : "pending");
const pendingCount = () => PROMPTS.filter((p) => p.status === "pending").length;
const mine = () => (user ? PROMPTS.filter((p) => p.authorId === user.id) : []);

function dbErrorText(err) {
  const m = (err && err.message) || "";
  if (/too_many_pending/.test(m)) return "검토를 기다리는 글이 이미 5개예요. 승인된 뒤에 더 올려 주세요.";
  if (err && err.code === "23505") return "이미 누가 쓰고 있는 닉네임이에요.";
  if (err && err.code === "23514") return "입력한 내용을 다시 확인해 주세요.";
  if (err && err.code === "42501" || /row-level security|permission denied/i.test(m)) return "권한이 없어요. 다시 로그인해 주세요.";
  if (/JWT|session/i.test(m)) return "로그인이 만료됐어요. 다시 로그인해 주세요.";
  return "잠시 문제가 생겼어요. 다시 시도해 주세요.";
}

/* --- 불러오기 --- */
function rowToPrompt(r) {
  return {
    id: r.id, title: r.title, cat: r.cat, tool: r.tool, prompt: r.body,
    art: r.art, theme: r.theme, img: r.img || "", saves: r.saves_label || "",
    status: r.status, reject: r.reject_reason || "", created: r.created_at,
    authorId: r.author_id, author: (r.author && r.author.nickname) || null,
  };
}
let promptsFromDb = false;
async function loadPrompts() {
  if (!sb) return;
  const { data, error } = await sb.from("prompts")
    .select("id,title,cat,tool,body,art,theme,img,saves_label,status,reject_reason,created_at,author_id,author:profiles(nickname)")
    .order("created_at", { ascending: false }).order("id");
  if (error) { console.warn("prompts", error.message); return; }   // 표를 아직 안 만들었으면 기본 예시 그대로
  if (!data.length && !promptsFromDb) return;
  promptsFromDb = true;
  $("#shareRow").hidden = false;   // 서버 표가 준비된 뒤에만 공유 버튼을 보여 줌
  PROMPTS.splice(0, PROMPTS.length, ...data.map(rowToPrompt));
  if (current === "home" && !flying) flip($("#grid"), renderAll); else renderAll();
  if (!$("#accountScrim").hidden && user) renderAccount();
  if (admOpen()) renderAdmin();
}
async function loadMe() {
  me.nick = null; me.admin = false;
  if (!user || !sb) return;
  const [p, a] = await Promise.all([
    sb.from("profiles").select("nickname").eq("id", user.id).maybeSingle(),
    sb.rpc("is_admin"),
  ]);
  if (p.data) me.nick = p.data.nickname;
  me.admin = a.data === true;
}
async function saveNick(nick) {
  if (!NICK_RE.test(nick)) return "닉네임은 한글·영문·숫자·_ 2~16자로 정해 주세요.";
  if (nick === me.nick) return null;
  const { error } = me.nick
    ? await sb.from("profiles").update({ nickname: nick }).eq("id", user.id)
    : await sb.from("profiles").insert({ id: user.id, nickname: nick });
  if (error) return dbErrorText(error);
  me.nick = nick;
  PROMPTS.forEach((p) => { if (p.authorId === user.id) p.author = nick; });
  return null;
}

/* --- 내 계정 시트: 닉네임 · 내가 올린 글 · 관리자 입구 --- */
function thumbHTML(p) { return `<span class="mine-thumb" style="background:${bgOf(p)}" aria-hidden="true">${esc(p.art)}</span>`; }
function renderAccount() {
  $("#acAvatar").textContent = (user.email || "?").charAt(0).toUpperCase();
  $("#acEmail").textContent = user.email || "";
  $("#acStats").textContent = `프롬프트 ${store.saves.length}개 · 폴더 ${store.folders.length}개 저장 중`;
  $("#acNick").textContent = me.nick ? `@${me.nick}` : "아직 없어요";
  $("#acNickEdit").textContent = me.nick ? "바꾸기" : "정하기";
  $("#nickForm").hidden = true;
  $("#nickMsg").textContent = "";
  const list = mine();
  $("#acMine").innerHTML = list.length ? list.map((p) => `<div class="mine-row">
      ${thumbHTML(p)}
      <span class="mine-text"><b>${esc(p.title)}</b><small>${p.status === "rejected" && p.reject ? `반려 사유 · ${esc(p.reject)}` : STATUS_HINT[stOf(p)]}</small></span>
      <span class="st st-${stOf(p)}">${STATUS[stOf(p)]}</span>
      <button class="link-btn danger" type="button" data-del-mine="${p.id}">삭제</button>
    </div>`).join("")
    : `<p class="ac-empty">아직 올린 프롬프트가 없어요. 나만 알던 프롬프트를 공유해 보세요.</p>`;
  $("#acAdmin").hidden = !me.admin;
  const n = pendingCount();
  $("#acAdminCount").hidden = !(me.admin && n);
  $("#acAdminCount").textContent = n;
}
$("#acNickEdit").addEventListener("click", () => {
  $("#nickForm").hidden = false;
  $("#nickInput").value = me.nick || "";
  $("#nickInput").focus();
});
$("#nickForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = $("#nickForm button");
  btn.disabled = true;
  const err = await saveNick($("#nickInput").value.trim());
  btn.disabled = false;
  if (err) { $("#nickMsg").textContent = err; return; }
  renderAccount(); renderAll();
  toast("닉네임을 저장했어요");
});
$("#acMine").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-del-mine]");
  if (!b) return;
  if (!b.classList.contains("confirm")) { b.classList.add("confirm"); b.textContent = "정말 삭제?"; return; }
  b.disabled = true;
  const { error } = await sb.from("prompts").delete().eq("id", +b.dataset.delMine);
  if (error) { toast(dbErrorText(error)); b.disabled = false; return; }
  toast("삭제했어요");
  await loadPrompts();
  renderAccount();
});
$("#acShare").addEventListener("click", () => { closeModal("#accountScrim"); openSubmit(); });
$("#acAdmin").addEventListener("click", () => { closeModal("#accountScrim"); openAdmin(); });

/* --- 올리기 · (관리자) 수정 시트 --- */
const sub = { edit: null, art: "✨", theme: 0, del: false, back: false };
$("#subCat").innerHTML = CATS.filter((c) => c.id !== "all").map((c) => `<option value="${c.id}">${c.emo} ${c.name}</option>`).join("");
$("#subTool").innerHTML = TOOLS.map((t) => `<option value="${t}">${t}</option>`).join("") + `<option value="__other">기타 (직접 적기)</option>`;
$("#subArt").innerHTML = PROMPT_EMOJIS.map((em) => `<button type="button" role="radio" aria-checked="false" data-art="${em}">${em}</button>`).join("");
$("#subTheme").innerHTML = THEMES.map((bg, i) => `<button type="button" role="radio" aria-checked="false" aria-label="카드 색 ${i + 1}" data-theme="${i}" style="background:${bg}"></button>`).join("");

function syncSubPreview() {
  $("#subPrev").style.background = THEMES[sub.theme];
  $("#subPrevArt").textContent = sub.art;
  $("#subPrevTitle").textContent = $("#subTitle").value.trim() || "제목을 적어 주세요";
  $("#subArt").querySelectorAll("[data-art]").forEach((b) => b.setAttribute("aria-checked", b.dataset.art === sub.art));
  $("#subTheme").querySelectorAll("[data-theme]").forEach((b) => b.setAttribute("aria-checked", +b.dataset.theme === sub.theme));
  $("#subTitleCount").textContent = `${$("#subTitle").value.length} / 40`;
  $("#subCount").textContent = `${$("#subBody").value.length} / 2000`;
  $("#subToolOtherWrap").hidden = $("#subTool").value !== "__other";
}
$("#subArt").addEventListener("click", (e) => { const b = e.target.closest("[data-art]"); if (b) { sub.art = b.dataset.art; syncSubPreview(); } });
$("#subTheme").addEventListener("click", (e) => { const b = e.target.closest("[data-theme]"); if (b) { sub.theme = +b.dataset.theme; syncSubPreview(); } });
["#subTitle", "#subBody"].forEach((s) => $(s).addEventListener("input", syncSubPreview));
$("#subForm").addEventListener("input", () => { $("#subMsg").textContent = ""; });
$("#subTool").addEventListener("change", () => { syncSubPreview(); if ($("#subTool").value === "__other") $("#subToolOther").focus(); });

function openSubmit(p, back) {
  if (!sb) { toast("로그인 서버가 연결되지 않았어요"); return; }
  if (!user) { toast("로그인하면 내 프롬프트를 공유할 수 있어요"); openAuth(); return; }
  const editing = !!p && me.admin;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  sub.edit = editing ? p.id : null; sub.del = false; sub.back = !!back;
  sub.art = editing && PROMPT_EMOJIS.includes(p.art) ? p.art : editing ? "✨" : pick(PROMPT_EMOJIS);
  sub.theme = editing ? (THEMES[p.theme] ? p.theme : 0) : Math.floor(Math.random() * THEMES.length);
  $("#subHead").textContent = editing ? "프롬프트 수정" : "내 프롬프트 공유하기";
  $("#subLede").textContent = editing ? `#${p.id}${p.author ? ` · @${p.author}` : " · promme 기본"} · 저장하면 바로 반영돼요`
    : me.admin ? "관리자 계정이라 올리면 바로 홈에 공개돼요."
    : "관리자가 확인한 뒤 홈에 공개돼요. 사진 첨부는 곧 열릴 예정이에요.";
  $("#subNickWrap").hidden = !!me.nick || editing;   // 수정할 때는 닉네임이 필요 없음
  $("#subNick").value = "";
  $("#subTitle").value = editing ? p.title : "";
  $("#subCat").value = editing ? p.cat : state.cat !== "all" ? state.cat : "sns";
  const known = editing && TOOLS.includes(p.tool);
  $("#subTool").value = !editing ? "ChatGPT" : known ? p.tool : "__other";
  $("#subToolOther").value = editing && !known ? p.tool : "";
  $("#subBody").value = editing ? p.prompt : "";
  $("#subStatusWrap").hidden = !editing;
  if (editing) $("#subStatus").value = stOf(p);
  $("#subSubmit").textContent = editing ? "저장" : me.admin ? "바로 공개하기" : "검토 요청 보내기";
  const del = $("#subDelete");
  del.hidden = !editing; del.classList.remove("confirm"); del.textContent = "삭제";
  $("#subMsg").textContent = "";
  syncSubPreview();
  openModal("#submitScrim");
  ["#subArt", "#subTheme"].forEach((sel) => {   // 휴대폰에서 옆으로 넘기는 줄: 고른 것이 보이게
    const box = $(sel), on = box.querySelector('[aria-checked="true"]');
    box.scrollLeft = on ? on.offsetLeft - box.offsetLeft - box.clientWidth / 2 + on.offsetWidth / 2 : 0;
  });
  setTimeout(() => ($("#subNickWrap").hidden ? $("#subTitle") : $("#subNick")).focus({ preventScroll: true }), 120);
}
function afterSubmit(msg) {
  closeModal("#submitScrim");
  toast(msg);
  if (sub.back) setTimeout(() => openAdmin(), 200);
}
$("#subForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const msg = (t, focus) => { $("#subMsg").textContent = t; if (focus) $(focus).focus(); };
  const title = $("#subTitle").value.trim(), body = $("#subBody").value.trim(), cat = $("#subCat").value;
  const tool = ($("#subTool").value === "__other" ? $("#subToolOther").value : $("#subTool").value).trim().slice(0, 20);
  const needNick = !$("#subNickWrap").hidden;
  if (needNick && !NICK_RE.test($("#subNick").value.trim())) return msg("닉네임은 한글·영문·숫자·_ 2~16자로 정해 주세요.", "#subNick");
  if (title.length < 2) return msg("제목을 2자 이상 적어 주세요.", "#subTitle");
  if (!tool) return msg("추천 AI 이름을 적어 주세요.", "#subToolOther");
  if (body.length < 10) return msg("프롬프트를 10자 이상 적어 주세요.", "#subBody");
  const btn = $("#subSubmit");
  btn.disabled = true; msg("");
  try {
    if (needNick) {
      const err = await saveNick($("#subNick").value.trim());
      if (err) return msg(err, "#subNick");
      $("#subNickWrap").hidden = true;
    }
    const row = { title, cat, tool, body, art: sub.art, theme: sub.theme };
    if (sub.edit) {
      const { data, error } = await sb.from("prompts").update({ ...row, status: $("#subStatus").value }).eq("id", sub.edit).select("id");
      if (error) return msg(dbErrorText(error));
      if (!data || !data.length) return msg("권한이 없어서 저장하지 못했어요.");
      afterSubmit("고쳤어요. 홈에 바로 반영돼요");
    } else {
      const { error } = await sb.from("prompts").insert(me.admin ? { ...row, status: "approved" } : row);
      if (error) return msg(dbErrorText(error));
      afterSubmit(me.admin ? "홈에 바로 공개했어요" : "검토 요청을 보냈어요. 승인되면 홈에 올라가요");
    }
    await loadPrompts();
  } finally {
    btn.disabled = false;
  }
});
$("#subDelete").addEventListener("click", async () => {
  const del = $("#subDelete");
  if (!sub.del) { sub.del = true; del.classList.add("confirm"); del.textContent = "정말 삭제할까요?"; return; }
  del.disabled = true;
  const { error } = await sb.from("prompts").delete().eq("id", sub.edit);
  del.disabled = false;
  if (error) { $("#subMsg").textContent = dbErrorText(error); return; }
  afterSubmit("삭제했어요");
  await loadPrompts();
});
$("#shareBtn").addEventListener("click", () => openSubmit());
$("#sEdit").addEventListener("click", () => { closeModal("#promptScrim"); openSubmit(sheetP); });

/* --- 관리자 시트 --- */
const ATABS = ["queue", "prompts", "news"];
const adm = { tab: "queue", q: "", nq: "", rejecting: null, confirmDel: null, editNews: null, limit: 40 };
const admOpen = () => !$("#adminScrim").hidden;
function openAdmin(tab) {
  if (!me.admin) return;
  if (tab) adm.tab = tab;
  adm.rejecting = adm.confirmDel = adm.editNews = null;
  openModal("#adminScrim");
  setAdminTab(adm.tab, true);
  requestAnimationFrame(() => moveSlideInd($("#adTabs"), true));
  loadPrompts();   // 방금 들어온 글까지 새로
}
function setAdminTab(t, instant) {
  const dir = Math.sign(ATABS.indexOf(t) - ATABS.indexOf(adm.tab));
  adm.tab = t;
  $("#adTabs").querySelectorAll("[data-atab]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.atab === t));
  if (instant) renderAdmin(); else slideIn($("#adminBody"), dir, renderAdmin);
  moveSlideInd($("#adTabs"), instant);
}
function renderAdmin() {
  const n = pendingCount();
  $("#adTabs [data-atab=queue]").textContent = n ? `승인 대기 ${n}` : "승인 대기";
  moveSlideInd($("#adTabs"), true);
  const body = $("#adminBody");
  if (adm.tab === "queue") body.innerHTML = adminQueueHTML();
  else if (adm.tab === "prompts") body.innerHTML = adminSearchHTML(adm.q, "제목 · 내용 · 닉네임 검색") + `<div id="adList">${adminPromptListHTML()}</div>`;
  else body.innerHTML = `<p class="ad-note">뉴스는 3시간마다 새로 모이지만, 여기서 고친 제목·분류와 숨김은 계속 유지돼요.</p>`
    + adminSearchHTML(adm.nq, "기사 제목 · 출처 검색") + `<div id="adList">${adminNewsListHTML()}</div>`;
}
function adminSearchHTML(v, ph) {
  return `<div class="ad-tools"><input type="search" id="adSearch" value="${esc(v)}" placeholder="${ph}" aria-label="${ph}"></div>`;
}
function adminQueueHTML() {
  const list = PROMPTS.filter((p) => p.status === "pending").sort((a, b) => (a.created || "").localeCompare(b.created || ""));
  if (!list.length) return `<div class="arc-empty"><span class="big">🎉</span>검토할 프롬프트가 없어요.</div>`;
  return `<p class="ad-note">오래 기다린 글부터 보여요. 승인하면 그 즉시 홈에 공개돼요.</p>` + list.map((p) => `
    <article class="ad-card" data-pid="${p.id}">
      <div class="ad-card-head">
        ${thumbHTML(p)}
        <div class="mine-text"><b>${esc(p.title)}</b><small>${p.author ? "@" + esc(p.author) : "작성자 없음"} · ${esc(p.tool)} · ${catName(p.cat)} · ${relTime(p.created)}</small></div>
      </div>
      <pre class="ad-body">${esc(p.prompt)}</pre>
      ${adm.rejecting === p.id ? `
      <form class="ad-reject" data-reject="${p.id}">
        <input name="reason" maxlength="200" placeholder="반려 사유 (작성자에게 보여요 · 비워도 돼요)" aria-label="반려 사유">
        <div class="ad-actions">
          <button class="btn danger-ghost confirm" type="submit">반려하기</button>
          <button class="btn ghost" type="button" data-a="reject-cancel">취소</button>
        </div>
      </form>` : `
      <div class="ad-actions">
        <button class="btn" type="button" data-a="approve">승인 · 공개</button>
        <button class="btn ghost" type="button" data-a="reject">반려</button>
        <button class="btn ghost" type="button" data-a="edit">수정</button>
      </div>`}
    </article>`).join("");
}
function adminPromptListHTML() {
  const q = adm.q.trim().toLowerCase();
  const list = PROMPTS.filter((p) => p.status !== "pending" && (!q || (p.title + p.prompt + (p.author || "")).toLowerCase().includes(q)));
  if (!list.length) return `<div class="arc-empty">찾는 프롬프트가 없어요.</div>`;
  return list.map((p) => {
    const on = p.status === "approved", conf = adm.confirmDel === p.id;
    return `<div class="ad-row" data-pid="${p.id}">
      ${thumbHTML(p)}
      <span class="mine-text"><b>${esc(p.title)}</b><small>#${p.id} · ${p.author ? "@" + esc(p.author) : "promme 기본"} · ${catName(p.cat)}${p.status === "rejected" && p.reject ? ` · 사유: ${esc(p.reject)}` : ""}</small></span>
      <span class="st st-${stOf(p)}">${STATUS[stOf(p)]}</span>
      <span class="ad-row-actions">
        <button class="link-btn" type="button" data-a="edit">수정</button>
        <button class="link-btn" type="button" data-a="${on ? "hide" : "show"}">${on ? "숨기기" : "공개"}</button>
        <button class="link-btn danger${conf ? " confirm" : ""}" type="button" data-a="delete">${conf ? "정말 삭제?" : "삭제"}</button>
      </span>
    </div>`;
  }).join("");
}
function adminNewsListHTML() {
  const q = adm.nq.trim().toLowerCase();
  const all = news.raw.map((raw) => ({ raw, v: newsView(raw), o: news.ov.get(raw.id) }))
    .filter(({ raw, v }) => !q || (v.title + " " + raw.title + " " + raw.source).toLowerCase().includes(q));
  if (!all.length) return `<div class="arc-empty">${news.raw.length ? "찾는 기사가 없어요." : "불러온 기사가 없어요."}</div>`;
  const shown = all.slice(0, adm.limit);
  return shown.map(({ raw, v, o }) => {
    const edited = o && (o.title || o.tag);
    if (adm.editNews === raw.id) return `
      <form class="ad-news-edit" data-nid="${esc(raw.id)}">
        <input name="title" maxlength="160" value="${esc(v.title)}" aria-label="기사 제목">
        <div class="ad-actions">
          <select name="tag" aria-label="분류">${NEWS_TAGS.slice(1).map((t) => `<option value="${t}"${t === v.tag ? " selected" : ""}>${t}</option>`).join("")}</select>
          <button class="btn" type="submit">저장</button>
          <button class="btn ghost" type="button" data-a="news-cancel">취소</button>
          ${edited ? `<button class="btn ghost" type="button" data-a="news-reset">원래대로</button>` : ""}
        </div>
        <small class="ad-orig">원래 제목 · ${esc(raw.title)}</small>
      </form>`;
    return `<div class="ad-row${v.hidden ? " is-hidden" : ""}" data-nid="${esc(raw.id)}">
      <span class="ntag t-${v.tag}">${v.tag}</span>
      <span class="mine-text"><b>${esc(v.title)}</b><small>${esc(raw.source)} · ${relTime(raw.published)}${edited ? " · 수정됨" : ""}${v.hidden ? " · 숨김" : ""}</small></span>
      <span class="ad-row-actions">
        <a class="link-btn" href="${esc(raw.url)}" target="_blank" rel="noopener noreferrer">원문</a>
        <button class="link-btn" type="button" data-a="news-edit">수정</button>
        <button class="link-btn" type="button" data-a="${v.hidden ? "news-show" : "news-hide"}">${v.hidden ? "보이기" : "숨기기"}</button>
      </span>
    </div>`;
  }).join("") + (all.length > shown.length ? `<button class="btn ghost full" type="button" data-a="news-more">더 보기 · ${all.length - shown.length}개 남음</button>` : "");
}

async function setStatus(pid, status, okMsg, extra) {
  const { data, error } = await sb.from("prompts").update({ status, ...(extra || {}) }).eq("id", pid).select("id");
  if (error || !data || !data.length) { toast(error ? dbErrorText(error) : "권한이 없어요"); return; }
  toast(okMsg);
  await loadPrompts();
}
async function saveNewsOv(id, patch, okMsg) {
  const cur = news.ov.get(id) || { hidden: false, title: null, tag: null };
  const row = { news_id: id, hidden: !!cur.hidden, title: cur.title || null, tag: cur.tag || null, ...patch, updated_at: new Date().toISOString() };
  const { error } = await sb.from("news_overrides").upsert(row, { onConflict: "news_id" });
  if (error) { toast(dbErrorText(error)); return false; }
  news.ov.set(id, row);
  applyNews();
  toast(okMsg);
  return true;
}

$("#adTabs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-atab]");
  if (!b || b.dataset.atab === adm.tab) return;
  adm.rejecting = adm.confirmDel = adm.editNews = null;
  setAdminTab(b.dataset.atab);
});
$("#adminBody").addEventListener("input", (e) => {
  if (e.target.id !== "adSearch") return;
  if (adm.tab === "news") { adm.nq = e.target.value; adm.limit = 40; $("#adList").innerHTML = adminNewsListHTML(); }
  else { adm.q = e.target.value; adm.confirmDel = null; $("#adList").innerHTML = adminPromptListHTML(); }
});
$("#adminBody").addEventListener("click", async (e) => {
  const b = e.target.closest("[data-a]");
  if (!b) return;
  const a = b.dataset.a;
  const pEl = b.closest("[data-pid]"), nEl = b.closest("[data-nid]");
  const pid = pEl ? +pEl.dataset.pid : null, nid = nEl ? nEl.dataset.nid : null;
  const busy = () => { b.disabled = true; };
  if (a !== "delete") adm.confirmDel = null;

  if (a === "approve") { busy(); await setStatus(pid, "approved", "승인했어요. 홈에 바로 올라갔어요"); }
  else if (a === "reject") { adm.rejecting = pid; renderAdmin(); const f = $(`[data-reject="${pid}"] input`); if (f) f.focus(); }
  else if (a === "reject-cancel") { adm.rejecting = null; renderAdmin(); }
  else if (a === "edit") { const p = byId(pid); if (p) { closeModal("#adminScrim"); openSubmit(p, true); } }
  else if (a === "hide") { busy(); await setStatus(pid, "hidden", "홈에서 숨겼어요"); }
  else if (a === "show") { busy(); await setStatus(pid, "approved", "다시 공개했어요"); }
  else if (a === "delete") {
    if (adm.confirmDel !== pid) { adm.confirmDel = pid; $("#adList").innerHTML = adminPromptListHTML(); return; }
    busy();
    const { error } = await sb.from("prompts").delete().eq("id", pid);
    adm.confirmDel = null;
    if (error) { toast(dbErrorText(error)); renderAdmin(); return; }
    toast("삭제했어요");
    await loadPrompts();
  }
  else if (a === "news-edit") { adm.editNews = nid; $("#adList").innerHTML = adminNewsListHTML(); const f = $(`form[data-nid="${nid}"] input`); if (f) { f.focus(); f.select(); } }
  else if (a === "news-cancel") { adm.editNews = null; $("#adList").innerHTML = adminNewsListHTML(); }
  else if (a === "news-reset") { busy(); if (await saveNewsOv(nid, { title: null, tag: null }, "원래 제목·분류로 되돌렸어요")) adm.editNews = null; applyNews(); }
  else if (a === "news-hide") { busy(); await saveNewsOv(nid, { hidden: true }, "기사를 숨겼어요"); }
  else if (a === "news-show") { busy(); await saveNewsOv(nid, { hidden: false }, "기사를 다시 보이게 했어요"); }
  else if (a === "news-more") { adm.limit += 40; $("#adList").innerHTML = adminNewsListHTML(); }
});
$("#adminBody").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, btn = f.querySelector('[type="submit"]');
  if (f.dataset.reject) {
    btn.disabled = true;
    const reason = f.elements.reason.value.trim().slice(0, 200);
    adm.rejecting = null;
    await setStatus(+f.dataset.reject, "rejected", "반려했어요. 작성자의 내 계정에 사유가 보여요", { reject_reason: reason || null });
    if (admOpen()) renderAdmin();
    return;
  }
  if (f.dataset.nid) {
    const raw = news.raw.find((it) => it.id === f.dataset.nid);
    if (!raw) return;
    const t = f.elements.title.value.trim(), tag = f.elements.tag.value;
    if (t.length < 2) { toast("제목을 2자 이상 적어 주세요"); return; }
    btn.disabled = true;
    const ok = await saveNewsOv(raw.id, { title: t === raw.title ? null : t.slice(0, 160), tag: tag === raw.tag ? null : tag }, "기사 제목·분류를 고쳤어요");
    if (ok) { adm.editNews = null; applyNews(); } else btn.disabled = false;
  }
});

/* ================= 8) 오늘의 운세 ================= */
(function () {
  const d = new Date(), seed = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
  const msgs = ["작게 시작한 일이 생각보다 멀리 가는 날이에요.", "미뤄둔 연락 하나가 좋은 소식으로 돌아와요.", "오늘은 질문을 잘하는 사람이 이겨요. 프롬프트도 마찬가지!", "정리 정돈이 행운을 불러요. 폴더 하나만 정리해봐요.", "새로운 도구를 써보기 좋은 날. 처음 써보는 AI에 도전해봐요."];
  const colors = ["버터 옐로", "피치", "민트", "라벤더", "코랄"], items = ["이어폰", "텀블러", "스티커", "노트", "향수"];
  $("#fDate").textContent = `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
  $("#fMsg").textContent = msgs[seed % msgs.length];
  $("#fLucky").innerHTML = `<span>행운의 색 · ${colors[seed % 5]}</span><span>행운의 아이템 · ${items[(seed + 2) % 5]}</span>`;
  $("#fPrompt").addEventListener("click", () => {
    const pool = PROMPTS.filter((p) => p.status === "approved");
    if (pool.length) openPrompt(pool[seed % pool.length]);
  });
})();

/* ================= 9) 리퀴드 글래스 탭바 ================= */
const bar = $("#tabbar"), ind = $("#indicator"), tabs = [...bar.querySelectorAll(".tab")];

/* 스프링 물리: 알약 위치(x)가 목표(target)로 탄성 있게 이동 */
const sp = { x: 0, v: 0, target: 0, scale: 1, scaleT: 1, raf: 0 };
const K = 300;   // 강성 — 클수록 빠르게 따라감
const D = 26;    // 감쇠 — 작을수록 더 출렁임
const tabRect = (i) => ({ x: tabs[i].offsetLeft, w: tabs[i].offsetWidth });

function setTransform(x, sx, sy) { ind.style.transform = `translateX(${x}px) scale(${sx},${sy})`; }
function frame() {
  const dt = 1 / 60;
  const a = K * (sp.target - sp.x) - D * sp.v;
  sp.v += a * dt; sp.x += sp.v * dt;
  sp.scale += (sp.scaleT - sp.scale) * 0.25;
  const stretch = Math.min(Math.abs(sp.v) / 2600, 0.28);
  setTransform(sp.x, (1 + stretch) * sp.scale, (1 - stretch * 0.45) * sp.scale);
  const done = Math.abs(sp.target - sp.x) < 0.3 && Math.abs(sp.v) < 4 && Math.abs(sp.scaleT - sp.scale) < 0.002;
  if (done) { sp.x = sp.target; sp.v = 0; sp.scale = sp.scaleT; setTransform(sp.x, sp.scale, sp.scale); sp.raf = 0; return; }
  sp.raf = requestAnimationFrame(frame);
}
function kick() {
  if (reduce) { sp.x = sp.target; sp.scale = sp.scaleT; setTransform(sp.x, sp.scale, sp.scale); return; }
  if (!sp.raf) sp.raf = requestAnimationFrame(frame);
}
function placeIndicator(i, instant) {
  const r = tabRect(i);
  ind.style.width = r.w + "px";
  sp.target = r.x;
  if (instant) { sp.x = r.x; sp.v = 0; setTransform(r.x, sp.scale, sp.scale); } else kick();
}

/* 페이지 전환 */
function selectTab(name, opts = {}) {
  const record = opts.record !== false;
  const ni = ORDER.indexOf(name), oi = ORDER.indexOf(current);
  tabs.forEach((t, i) => { t.classList.toggle("active", i === ni); t.setAttribute("aria-selected", i === ni); });
  placeIndicator(ni, opts.instant);

  if (name === current) {
    if (!opts.instant) scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    updateMiniSearch();
    return;
  }
  const from = $(`#page-${current}`), to = $(`#page-${name}`), dir = ni > oi ? 1 : -1;
  current = name;
  updateMiniSearch();
  if (record) recordNav();
  if (name === "wiki") requestAnimationFrame(() => syncWikiModes());

  if (reduce || opts.instant || !to.animate) {
    document.querySelectorAll(".page").forEach((p) => {
      p.getAnimations().forEach((a) => a.cancel());
      p.classList.remove("leaving"); p.style.top = "";
      p.hidden = p.dataset.tab !== current;
    });
    scrollTo(0, 0);
    return;
  }

  /* 나가는 페이지와 들어오는 페이지를 동시에 움직여 한 장의 화면이 밀려나듯 전환.
     나가는 페이지는 스크롤 위치 그대로 겹쳐 둔 채 옆으로 빠져나감 */
  const y = scrollY;
  [from, to].forEach((p) => p.getAnimations().forEach((a) => a.cancel()));
  to.classList.remove("leaving"); to.style.top = "";
  from.classList.add("leaving");
  from.style.top = `${-y}px`;
  to.hidden = false;
  scrollTo(0, 0);
  updateMiniSearch();

  const out = from.animate(
    [{ transform: "translateX(0) scale(1)", opacity: 1 },
     { transform: `translateX(${-dir * 18}%) scale(.98)`, opacity: 0, offset: 0.5 },
     { transform: `translateX(${-dir * 32}%) scale(.97)`, opacity: 0 }],
    { duration: 620, easing: EASE });
  out.onfinish = out.oncancel = () => {
    from.classList.remove("leaving"); from.style.top = "";
    from.hidden = from.dataset.tab !== current;
  };
  to.animate(
    [{ transform: `translateX(${dir * 38}%)`, opacity: 0 },
     { transform: "translateX(0)", opacity: 1 }],
    { duration: 680, easing: EASE });
}

/* 탭바: 클릭하면 바로 이동, 끌면 알약이 따라오다 가까운 메뉴에 붙음 */
let drag = null;
const tabIndexAt = (clientX) => tabs.findIndex((t) => { const r = t.getBoundingClientRect(); return clientX >= r.left && clientX <= r.right; });
const nearestTab = (x) => tabs.reduce((best, t, i) => (Math.abs(t.offsetLeft - x) < Math.abs(tabs[best].offsetLeft - x) ? i : best), 0);

bar.addEventListener("pointerdown", (e) => {
  if (e.button > 0) return;
  drag = { id: e.pointerId, startX: e.clientX, moved: false, left: bar.getBoundingClientRect().left };
  bar.setPointerCapture(e.pointerId);
  bar.classList.add("pressing");
  sp.scaleT = 1.08; kick();
});
bar.addEventListener("pointermove", (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  if (Math.abs(e.clientX - drag.startX) > 8) drag.moved = true;
  if (!drag.moved) return;
  const w = ind.offsetWidth, min = tabRect(0).x, max = tabRect(tabs.length - 1).x;
  sp.target = Math.max(min, Math.min(max, e.clientX - drag.left - w / 2));
  kick();
  const hi = nearestTab(sp.target);
  tabs.forEach((t, i) => t.classList.toggle("hover", i === hi));
});
function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  bar.classList.remove("pressing");
  sp.scaleT = 1;
  tabs.forEach((t) => t.classList.remove("hover"));
  let i;
  if (drag.moved) i = nearestTab(sp.target);
  else { i = tabIndexAt(e.clientX); if (i < 0) i = ORDER.indexOf(current); }
  drag = null;
  if (e.type === "pointercancel") i = ORDER.indexOf(current);
  selectTab(ORDER[i]);
}
bar.addEventListener("pointerup", endDrag);
bar.addEventListener("pointercancel", endDrag);

tabs.forEach((t) => t.addEventListener("click", (e) => { if (e.detail === 0) selectTab(t.dataset.tab); }));
bar.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  const i = Math.max(0, Math.min(ORDER.length - 1, ORDER.indexOf(current) + (e.key === "ArrowRight" ? 1 : -1)));
  selectTab(ORDER[i]); tabs[i].focus();
});

/* 모바일: 본문 좌우 스와이프로 탭 전환 */
let swipe = null;
$("#main").addEventListener("touchstart", (e) => { const t = e.touches[0]; swipe = { x: t.clientX, y: t.clientY }; }, { passive: true });
$("#main").addEventListener("touchend", (e) => {
  if (!swipe) return;
  const t = e.changedTouches[0], dx = t.clientX - swipe.x, dy = t.clientY - swipe.y;
  swipe = null;
  if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) {
    const i = Math.max(0, Math.min(ORDER.length - 1, ORDER.indexOf(current) + (dx < 0 ? 1 : -1)));
    selectTab(ORDER[i]);
  }
}, { passive: true });

const syncWikiModes = () => { const wm = $("#wikiRoot .wiki-modes"); if (wm) moveSlideInd(wm, true); };
addEventListener("resize", () => { placeIndicator(ORDER.indexOf(current), true); moveSlideInd($(".seg"), true); syncWikiModes(); });

/* ================= 9.5) AI 성능 위키백과 =================
   데이터: wiki-data.js (ai_wiki_csv v2에서 생성)
   화면: 앱으로 쓰기 / API로 쓰기 / 성능 비교 / 모델 상세 */
const W = window.PROMME_WIKI || null;
const wiki = { mode: "app", cat: "all", ent: null, freeOnly: false, unit: "token", saleOnly: false, freeApi: false, sort: "out" };
const wikiKey = () => `${wiki.mode}|${wiki.cat}|${wiki.ent || ""}`;
const WIKI_CHIPS = ["all", "writing", "coding", "image", "video", "research", "translation", "music", "tts", "agents"];
const PROVIDER_TINT = { OpenAI: "rgb(210,236,222)", Anthropic: "rgb(250,218,196)", Google: "rgb(208,224,250)", GitHub: "rgb(226,222,240)", DeepL: "rgb(208,226,240)", Perplexity: "rgb(206,236,234)", Cursor: "rgb(232,232,226)", Midjourney: "rgb(240,222,236)" };
const PROVIDER_DOT = { OpenAI: "rgb(15,100,90)", Anthropic: "rgb(196,98,28)", Google: "rgb(40,80,180)" };
const UNIT_GROUPS = {
  token: { label: "글 · 토큰", units: ["USD_per_1M_tokens"] },
  image: { label: "이미지 · 장당", units: ["USD_per_image"] },
  video: { label: "영상 · 초·클립당", units: ["USD_per_second", "USD_per_clip"] },
  voice: { label: "음성 · 분·시간당", units: ["USD_per_minute", "USD_per_hour"] },
};
const UNIT_KO = { USD_per_image: "장당", USD_per_second: "초당", USD_per_clip: "클립당", USD_per_minute: "분당", USD_per_hour: "시간당", USD_per_song: "곡당" };

const wEnt = (id) => (W && W.ents[id]) || null;
const wCats = (id) => (W && W.ec[id]) || [];
const wCatKo = (id) => (W ? (W.cats.find((c) => c[0] === id) || [id, id])[1] : id);
const inCat = (id) => wiki.cat === "all" || wCats(id).includes(wiki.cat);
const money = (n, cur = "USD") => {
  const whole = Math.abs(n - Math.round(n)) < 1e-9;
  const cents = Math.abs(n * 100 - Math.round(n * 100)) < 1e-9;
  const s = whole ? String(Math.round(n)) : cents ? n.toFixed(2) : String(+n.toFixed(4));
  return (cur === "EUR" ? "€" : "$") + s;
};
/* 날짜는 모두 UTC 기준 (CSV의 시각이 UTC) */
const ymd = (iso) => { const d = new Date(iso); const y = d.getUTCFullYear() !== new Date().getUTCFullYear() ? `${d.getUTCFullYear()}. ` : ""; return `${y}${d.getUTCMonth() + 1}/${d.getUTCDate()}`; };
const lastDay = (iso) => ymd(new Date(Date.parse(iso) - 1).toISOString());   // 배타적 상한의 전날
const fullDate = (iso) => { const [y, m, d] = iso.slice(0, 10).split("-"); return `${y}. ${+m}. ${+d}`; };
const MONO = { chatgpt: "G", claudeapp: "C", geminiapp: "G", ghcopilot: "GH", deepl: "D", perplexity: "P", cursor: "Cu", midjourney: "M", gemini4argon: "G4" };
const monoOf = (name, id) => MONO[id] || name.replace(/[^A-Za-z0-9가-힣]/g, "").slice(0, 1).toUpperCase();
const dots = (t) => String(t || "").replace(/;\s*/g, " · ");
const planName = (n) => n.replace(/ (annual|monthly)$/i, "");
const tintOf = (e) => PROVIDER_TINT[e.p] || "rgb(236,230,210)";
const isSecondary = (ver) => ver === "secondary_source";
const srcLabel = (u) => { try { const x = new URL(u); const seg = x.pathname.split("/").filter(Boolean).pop(); return seg ? seg.replace(/[-_]/g, " ").slice(0, 28) : x.hostname.replace(/^www\./, ""); } catch (e) { return ""; } };
const isThird = (ver) => /third_party/.test(ver || "");

/* 지금 시각에 유효한 가격인지 (valid_from 이상, valid_until 미만) */
function activeAt(p, now = Date.now()) {
  if (p.f && Date.parse(p.f) > now) return false;
  if (p.to && Date.parse(p.to) <= now) return false;
  return true;
}
const TYPE_RANK = { promotion: 0, scheduled: 1, standard: 2, list: 3 };
/* 토큰 가격 한 줄: 입력·출력 대표값 + 다음 가격 + 참고 */
function tokenSummary(eid) {
  const rows = W.prices.filter((p) => p.e === eid && p.u === "USD_per_1M_tokens");
  if (!rows.length) return null;
  const now = Date.now();
  const main = (p) => p.tier !== "long" && !/cache hit|audio|peak;|^peak/.test(p.cond || "") || /off_peak/.test(p.cond || "");
  const pick = (comp, list) => list.filter((p) => p.c === comp && main(p))
    .sort((a, b) => (TYPE_RANK[a.pt] ?? 9) - (TYPE_RANK[b.pt] ?? 9))[0];
  const act = rows.filter((p) => activeAt(p, now));
  const inp = pick("input", act), out = pick("output", act);
  if (!inp || !out) return null;
  const notes = [];
  const fut = rows.filter((p) => p.f && Date.parse(p.f) > now && main(p));
  const fi = pick("input", fut), fo = pick("output", fut);
  let next = "";
  if (fi && fo) next = `${ymd(fi.f)}부터 ${money(fi.a)} / ${money(fo.a)}`;
  else if (out.pt === "promotion") {
    const li = pick("input", act.filter((p) => p.pt === "list")), lo = pick("output", act.filter((p) => p.pt === "list"));
    if (li && lo) next = `정가 ${money(li.a)} / ${money(lo.a)}` + (out.to ? "" : " · 종료일 미표기");
  }
  const longI = act.find((p) => p.c === "input" && p.tier === "long"), longO = act.find((p) => p.c === "output" && p.tier === "long");
  if (longI && longO) notes.push(`긴 입력 ${money(longI.a)} / ${money(longO.a)}`);
  const peakI = act.find((p) => p.c === "input" && /^peak|cache miss; peak/.test(p.cond || "")), peakO = act.find((p) => p.c === "output" && /^peak/.test(p.cond || ""));
  if (peakI && peakO) notes.push(`피크 시간 ${money(peakI.a)} / ${money(peakO.a)}`);
  const sale = out.pt === "promotion";
  return { inp, out, sale, until: out.to, next, notes };
}
function freeOf(eid) { return W.free.filter((f) => f.e === eid); }
function apiFreeLabel(eid) {
  const f = freeOf(eid);
  if (f.some((x) => x.t === "api_free_tier")) return "있음";
  if (f.some((x) => x.t === "not_available")) return "없음";
  const e = wEnt(eid);
  if (e && e.p === "Z.AI") return "구형 모델만";
  return "—";
}
const ctxKo = (n) => (n ? (n >= 10000 ? `${(n / 10000).toLocaleString("ko-KR")}만` : n) : "");
/* 개인용 월 결제 플랜 (팀·좌석당 제외) */
function personalPlans(eid) {
  const ps = W.plans.filter((p) => p.e === eid && !/좌석당|사용자당/.test(p.cond || ""));
  const monthly = ps.filter((p) => p.per === "monthly");
  const list = (monthly.length ? monthly : ps).slice().sort((a, b) => a.m - b.m);
  return list;
}
const badge = (txt, kind) => `<span class="wbadge ${kind || ""}">${esc(txt)}</span>`;
const srcBadge = (ver) => isSecondary(ver) ? badge("2차 자료", "warn") : isThird(ver) ? badge("제3자 값 · 재확인 중", "warn") : badge("공식", "ok");

/* ---------- 공통 머리 ---------- */
function wikiHead() {
  const modes = [["app", "앱으로 쓰기"], ["api", "API로 쓰기"], ["perf", "성능 비교"]];
  return `<div class="wiki-hero">
      <p class="eyebrow">AI 성능 위키백과</p>
      <h2 class="wiki-title">${wiki.mode === "api" ? "API 가격표" : wiki.mode === "perf" ? "똑똑할수록 비쌀까?" : "무료로 어디까지, 돈 내면 얼마?"}</h2>
      <p class="lede">${wiki.mode === "api" ? "직접 서비스를 만들 때 내는 사용량 요금이에요. 앱 구독료와는 따로 계산돼요."
        : wiki.mode === "perf" ? "대표 언어모델을 제3자 평가 지수와 평가 1회 비용으로 놓았어요. 왼쪽 위로 갈수록 싸고 똑똑해요."
        : "AI 서비스의 무료 혜택, 구독 가격, 성능을 한 곳에서 비교해요. 모든 값에 출처와 확인 날짜가 붙어 있어요."}</p>
      <p class="wiki-asof">마지막 확인 ${fullDate(W.asOf)} · 공식 페이지 기준</p>
    </div>
    <div class="wiki-bar">
      <div class="wiki-modes pill" role="group" aria-label="보는 방식">
        ${modes.map(([m, t]) => `<button data-wmode="${m}" aria-pressed="${wiki.mode === m}">${t}</button>`).join("")}
      </div>
      ${wiki.mode === "app" ? `<label class="wcheck"><input type="checkbox" data-wtoggle="freeOnly" ${wiki.freeOnly ? "checked" : ""}>무료로 쓸 수 있는 것만</label>` : ""}
    </div>
    ${wiki.mode === "perf" ? "" : `<div class="wiki-chips" role="group" aria-label="분야">
      ${WIKI_CHIPS.map((c) => `<button class="chip pill" data-wcat="${c}" aria-pressed="${wiki.cat === c}">${c === "all" ? "전체" : esc(wCatKo(c))}</button>`).join("")}
    </div>`}`;
}

/* ---------- 앱으로 쓰기 ---------- */
function wikiApp() {
  const cards = W.free.filter((f) => (f.t === "app_free_plan" || f.t === "api_free_tier") && (!f.e || inCat(f.e)));
  // API 무료 등급은 한 장으로 묶음
  const apiFree = cards.filter((f) => f.t === "api_free_tier");
  const appFree = cards.filter((f) => f.t === "app_free_plan");
  const cardHTML = (f) => {
    const e = wEnt(f.e) || { n: f.n, p: f.p };
    const plans = personalPlans(f.e);
    const paid = plans[0] ? `${planName(plans[0].n)} ${money(plans[0].m, plans[0].cur)}` : "—";
    return `<button class="wcard free-card" data-went="${esc(f.e)}">
      <span class="wc-top"><span class="mono" style="background:${tintOf(e)}">${esc(monoOf(e.n, f.e))}</span>${isSecondary(f.ver) ? badge("2차 자료", "warn") : badge("무료", "ok")}</span>
      <span class="wc-name">${esc(f.e ? `${e.n.replace(/ \(.*\)$/, "").replace(/ (Translator|앱)$/, "")} 무료` : f.n)}</span>
      <span class="wc-sub">${esc(dots(f.m))}</span>
      <span class="wc-lim">${esc(dots(f.lim))}</span>
      <span class="wc-foot"><span>유료는</span><b>${esc(paid)}</b></span>
    </button>`;
  };
  let apiCard = "";
  if (apiFree.length) {
    const first = tokenSummary(apiFree[0].e);
    apiCard = `<button class="wcard free-card" data-wmode-go="api">
      <span class="wc-top"><span class="mono" style="background:${PROVIDER_TINT.Google}">Gm</span>${badge("개발자용", "dev")}</span>
      <span class="wc-name">Gemini API 무료 등급</span>
      <span class="wc-sub">${esc(apiFree.map((f) => wEnt(f.e).n.replace("Gemini ", "")).join(" · "))}</span>
      <span class="wc-lim">${esc(apiFree[0].lim)}</span>
      <span class="wc-foot"><span>유료는</span><b>${first ? money(first.inp.a) + " / 1M 토큰" : "—"}</b></span>
    </button>`;
  }
  const appEnts = Object.keys(W.ents).filter((id) => W.ents[id].t === "application" && W.plans.some((p) => p.e === id) && inCat(id))
    .filter((id) => !wiki.freeOnly || freeOf(id).some((f) => f.t === "app_free_plan"));
  const FIRST = ["chatgpt", "claudeapp", "geminiapp", "perplexity", "midjourney", "cursor", "ghcopilot", "deepl"];
  const rank = (id) => (FIRST.includes(id) ? FIRST.indexOf(id) : 99);
  const rows = appEnts.filter((id) => personalPlans(id).length).sort((a, b) => rank(a) - rank(b)).map((id) => {
    const e = wEnt(id), ps = personalPlans(id), fr = freeOf(id);
    const freeTxt = fr.some((f) => f.t === "app_free_plan") ? "있음" : fr.some((f) => f.t === "not_listed") ? "언급 없음" : "—";
    const ver = ps.some((p) => isSecondary(p.ver)) ? "secondary_source" : "official_documented";
    return `<tr>
      <td><button class="wlink" data-went="${esc(id)}">${esc(e.n)}</button></td>
      <td>${freeTxt}</td>
      <td class="plan-list">${ps.map((p) => `<span>${esc(planName(p.n))} <b>${money(p.m, p.cur)}${/시작 가격|From/.test(p.cond || "") ? "~" : ""}</b>${p.per === "annual" ? "<small>(연간 결제 월 환산)</small>" : ""}</span>`).join("")}</td>
      <td>${srcBadge(ver)}</td>
    </tr>`;
  }).join("");
  const nCards = appFree.length + (apiFree.length ? 1 : 0);
  return `<section class="wsec">
      <div class="wsec-head"><h3>무료로 시작하기</h3><span>무료 혜택 ${nCards}개 · 가장 싼 유료 플랜과 함께</span></div>
      ${nCards ? `<div class="free-grid">${appFree.map(cardHTML).join("")}${apiCard}</div>` : `<div class="arc-empty">이 분야에는 아직 무료 혜택 정보가 없어요.</div>`}
    </section>
    <section class="wsec">
      <div class="wsec-head"><h3>구독 가격 한눈에</h3><span>미국 달러 기준 · 세금 별도 · 개인 플랜</span></div>
      ${rows ? `<div class="tablewrap wtable"><table>
        <thead><tr><th>서비스</th><th>무료</th><th>개인 플랜 (월)</th><th>출처</th></tr></thead>
        <tbody>${rows}</tbody></table></div>` : `<div class="arc-empty">조건에 맞는 서비스가 없어요.</div>`}
      <p class="wnote">원화 가격은 앱스토어 결제 금액을 모아 추가할 예정이에요. ‘2차 자료’는 공식 페이지에 금액이 보이지 않아 기사 두 곳에서 확인한 값이에요.</p>
    </section>
    ${wikiNotice()}`;
}
function wikiNotice() {
  return `<section class="wcard wnotice">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#aa5a19" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5h.01"/></svg>
      <div><b>가격은 자주 바뀌어요</b><span>할인 중인 가격은 종료일을 함께 보여주고, 종료일이 지나면 자동으로 다음 가격으로 바뀌어요.</span></div>
    </section>`;
}

/* ---------- API로 쓰기 ---------- */
function wikiApi() {
  const g = UNIT_GROUPS[wiki.unit];
  const unitBar = `<div class="wiki-units" role="group" aria-label="단위">${Object.entries(UNIT_GROUPS).map(([k, v]) =>
    `<button class="chip pill" data-wunit="${k}" aria-pressed="${wiki.unit === k}">${v.label}</button>`).join("")}</div>`;
  let body = "";
  if (wiki.unit === "token") {
    let list = Object.keys(W.ents).filter((id) => inCat(id)).map((id) => ({ id, s: tokenSummary(id) })).filter((x) => x.s);
    if (wiki.saleOnly) list = list.filter((x) => x.s.sale);
    if (wiki.freeApi) list = list.filter((x) => apiFreeLabel(x.id) === "있음");
    list.sort((a, b) => wiki.sort === "in" ? a.s.inp.a - b.s.inp.a : wiki.sort === "co" ? wEnt(a.id).p.localeCompare(wEnt(b.id).p) : a.s.out.a - b.s.out.a);
    const rows = list.map(({ id, s }) => {
      const e = wEnt(id);
      const st = s.sale ? badge(s.until ? `할인 중 · ${lastDay(s.until)}까지` : "할인 중", "warn") : badge("정가", "");
      const sub = [s.next, ...s.notes].filter(Boolean).join(" · ");
      return `<tr>
        <td><button class="wlink" data-went="${esc(id)}">${esc(e.n)}</button></td>
        <td class="muted">${esc(e.p)}</td>
        <td class="num">${money(s.inp.a)}</td>
        <td class="num"><b>${money(s.out.a)}</b></td>
        <td>${st}${sub ? `<small class="sub">${esc(sub)}</small>` : ""}</td>
        <td>${apiFreeLabel(id)}</td>
        <td class="nowrap">${e.ctx ? ctxKo(+e.ctx) : "확인 중"}</td>
      </tr>`;
    }).join("");
    body = `<div class="wfilters">
        <label class="wcheck"><input type="checkbox" data-wtoggle="saleOnly" ${wiki.saleOnly ? "checked" : ""}>할인 중만</label>
        <label class="wcheck"><input type="checkbox" data-wtoggle="freeApi" ${wiki.freeApi ? "checked" : ""}>무료 등급 있음</label>
        <label class="wsort">정렬 <select data-wsort>
          <option value="out" ${wiki.sort === "out" ? "selected" : ""}>출력 가격 낮은 순</option>
          <option value="in" ${wiki.sort === "in" ? "selected" : ""}>입력 가격 낮은 순</option>
          <option value="co" ${wiki.sort === "co" ? "selected" : ""}>회사별</option></select></label>
      </div>
      ${rows ? `<div class="tablewrap wtable"><table>
        <caption>USD, 100만 토큰당 · 오늘 기준 현재 가격</caption>
        <thead><tr><th>모델</th><th>회사</th><th class="num">입력</th><th class="num">출력</th><th>지금 가격</th><th>무료 등급</th><th>문맥 길이</th></tr></thead>
        <tbody>${rows}</tbody></table></div>` : `<div class="arc-empty">조건에 맞는 모델이 없어요.</div>`}
      <div class="wtips">
        <div class="wcard"><b>입력 · 출력이 뭐예요?</b><span>입력은 내가 보낸 글, 출력은 AI가 쓴 답의 양이에요. 보통 출력이 더 비싸요.</span></div>
        <div class="wcard"><b>시간대에 따라 다른 가격</b><span>DeepSeek는 평일 피크 시간(한국 오전 10시~오후 1시, 오후 3~7시)에 두 배예요. 표는 비피크 가격이에요.</span></div>
        <div class="wcard"><b>긴 글은 더 비쌀 수 있어요</b><span>일부 모델은 긴 입력에서 단가가 올라가요. 모델 이름을 누르면 구간별 가격이 보여요.</span></div>
      </div>`;
  } else {
    const rows = W.prices.filter((p) => g.units.includes(p.u) && activeAt(p) && inCat(p.e)).map((p) => {
      const e = wEnt(p.e);
      return `<tr><td><button class="wlink" data-went="${esc(p.e)}">${esc(e.n)}</button></td><td class="muted">${esc(e.p)}</td>
        <td class="num"><b>${money(p.a, p.cur)}</b> <small>${UNIT_KO[p.u] || ""}</small></td><td>${esc(p.cond || "")}</td></tr>`;
    }).join("");
    body = rows ? `<div class="tablewrap wtable"><table><caption>USD · 오늘 기준 현재 가격</caption>
      <thead><tr><th>모델</th><th>회사</th><th class="num">가격</th><th>조건</th></tr></thead><tbody>${rows}</tbody></table></div>`
      : `<div class="arc-empty">이 분야·단위에는 아직 가격 정보가 없어요.</div>`;
  }
  return `<section class="wsec">${unitBar}${body}</section>`;
}

/* ---------- 성능 비교 ---------- */
function wikiPerf() {
  const pts = W.perf.filter((p) => p.idx != null && p.cost != null);
  const Wd = 720, H = 400, padL = 48, padB = 44, padT = 14, padR = 150;
  const px = (c) => padL + (Math.log10(c) + 2) / 3 * Wd;
  const py = (v) => padT + H - v / 60 * H;
  const grid = [0, 20, 40, 60].map((v) => `<line x1="${padL}" x2="${padL + Wd}" y1="${py(v)}" y2="${py(v)}" class="gl"/><text x="${padL - 8}" y="${py(v) + 4}" text-anchor="end">${v}</text>`).join("")
    + [0.01, 0.1, 1, 10].map((c) => `<line y1="${padT}" y2="${padT + H}" x1="${px(c)}" x2="${px(c)}" class="gl"/><text x="${px(c)}" y="${padT + H + 18}" text-anchor="middle">$${c}</text>`).join("");
  // 이름표가 겹치지 않게 간단히 위아래로 비킴
  const placed = [];
  const dots = pts.slice().sort((a, b) => b.idx - a.idx).map((p) => {
    const e = wEnt(p.e), x = px(p.cost), y = py(p.idx), col = PROVIDER_DOT[e.p] || "rgb(160,150,130)";
    const left = x > padL + Wd - 120;
    let ly = y + 4;
    for (let k = 0; k < 6 && placed.some((q) => Math.abs(q.y - ly) < 13 && Math.abs(q.x - x) < 120); k++) ly += 13;
    placed.push({ x, y: ly });
    return `<g class="pt" data-went="${esc(p.e)}" tabindex="0" role="button" aria-label="${esc(e.n)}: 지수 ${p.idx}, 평가 1회 $${p.cost}">
      <circle cx="${x}" cy="${y}" r="7" fill="${col}" stroke="#fffde6" stroke-width="2"/>
      <text x="${left ? x - 11 : x + 11}" y="${ly}" text-anchor="${left ? "end" : "start"}">${esc(e.n)}</text></g>`;
  }).join("");
  const best = pts.reduce((a, b) => (b.idx > a.idx ? b : a));
  const cheap50 = pts.filter((p) => p.idx >= 50).reduce((a, b) => (b.cost < a.cost ? b : a));
  const cheapHalf = pts.filter((p) => p.cost < 0.5).reduce((a, b) => (b.idx > a.idx ? b : a));
  const leg = [["OpenAI", PROVIDER_DOT.OpenAI], ["Anthropic", PROVIDER_DOT.Anthropic], ["Google", PROVIDER_DOT.Google], ["그 외", "rgb(160,150,130)"]];
  const s = W.src.s63;
  return `<div class="perf-wrap">
    <figure class="wcard perf-fig">
      <div class="perf-head"><figcaption>언어모델: AA 지능 지수 대비 평가 비용</figcaption>${badge("제3자 값 · 재확인 중", "warn")}</div>
      <div class="perf-leg">${leg.map(([n, c]) => `<span><i style="background:${c}"></i>${n}</span>`).join("")}</div>
      <div class="perf-scroll"><svg viewBox="0 0 ${padL + Wd + padR} ${padT + H + padB + 20}" role="img" aria-label="${pts.length}개 언어모델의 AA 지능 지수와 평가 1회 비용 산점도">
        ${grid}
        <text x="${padL + Wd / 2}" y="${padT + H + padB + 10}" text-anchor="middle" class="ax">평가 1회 비용 (USD, 로그 눈금) · 왼쪽일수록 쌈</text>
        ${dots}
      </svg></div>
      <p class="wnote">점을 누르면 모델 상세로 가요. 세로축은 AA 지능 지수(위일수록 높음)예요.</p>
    </figure>
    <aside class="perf-side">
      <div class="wcard"><b>이렇게 읽어요</b><span>위로 갈수록 여러 시험의 종합 점수가 높고, 왼쪽으로 갈수록 같은 시험을 치르는 데 돈이 덜 들어요. 가로축은 10배씩 커지는 눈금이에요.</span></div>
      <div class="wcard"><b>눈에 띄는 점</b>
        <span>가장 높은 점수: <b>${esc(wEnt(best.e).n)}</b> ${best.idx}</span>
        <span>지수 50 이상 중 가장 쌈: <b>${esc(wEnt(cheap50.e).n)}</b> $${cheap50.cost}</span>
        <span>0.5달러 미만 중 가장 높음: <b>${esc(wEnt(cheapHalf.e).n)}</b> ${cheapHalf.idx}</span></div>
      <div class="wcard"><b>알아둘 점</b><span>${esc(s.p)}가 매긴 값이에요(${fullDate(s.d)} 확인). 모델마다 측정한 추론 강도(max·high 등)가 달라요. 평가 1회 비용은 실제 내 사용 요금과 달라요.</span>
        <a href="${esc(s.u)}" target="_blank" rel="noopener">원본 리더보드 보기</a></div>
    </aside>
  </div>`;
}

/* ---------- 모델 상세 ---------- */
function wikiDetail(id) {
  const e = wEnt(id);
  if (!e) return `<div class="arc-empty">정보를 찾을 수 없어요.</div>`;
  const now = Date.now();
  const typeKo = { model: "모델", model_family: "모델 계열", application: "앱·서비스", platform: "모델 제공 플랫폼" }[e.t] || e.t;
  const s = tokenSummary(id);
  const badges = [];
  if (e.st === "preview") badges.push(badge("프리뷰", "dev"));
  if (s && s.sale) badges.push(badge("할인 중", "warn"));
  const fr = freeOf(id);
  if (fr.some((f) => f.t === "app_free_plan" || f.t === "api_free_tier")) badges.push(badge("무료로 쓸 수 있음", "ok"));
  if (fr.some((f) => f.t === "not_available")) badges.push(badge("무료 등급 없음", ""));
  // 가격 블록
  let priceBlock = "";
  if (s) {
    const fut = W.prices.filter((p) => p.e === id && p.u === "USD_per_1M_tokens" && p.f && Date.parse(p.f) > now);
    const fi = fut.find((p) => p.c === "input"), fo = fut.find((p) => p.c === "output");
    priceBlock = `<section class="wcard wsec-card"><div class="wsec-head"><h3>API 가격</h3><span>USD, 100만 토큰당</span></div>
      <div class="price-steps">
        <div class="pstep now"><span class="wbadge ${s.sale ? "warn strong" : ""}">${s.sale && s.until ? `지금 · ${lastDay(s.until)}까지` : "지금"}</span>
          <div class="pnums"><div><small>입력</small><b>${money(s.inp.a)}</b></div><div><small>출력</small><b>${money(s.out.a)}</b></div></div></div>
        ${fi && fo ? `<div class="pstep"><span class="wbadge">${ymd(fi.f)}부터</span>
          <div class="pnums"><div><small>입력</small><b>${money(fi.a)}</b></div><div><small>출력</small><b>${money(fo.a)}</b></div></div></div>` : ""}
      </div>
      ${[s.next && !(fi && fo) ? s.next : "", ...s.notes].filter(Boolean).map((t) => `<p class="wnote">${esc(t)}</p>`).join("")}
    </section>`;
  }
  const other = W.prices.filter((p) => p.e === id && p.u !== "USD_per_1M_tokens" && activeAt(p));
  if (other.length) {
    priceBlock += `<section class="wcard wsec-card"><div class="wsec-head"><h3>가격</h3><span>오늘 기준</span></div>
      ${other.map((p) => `<div class="drow"><span>${esc(p.cond || p.c)}</span><b>${money(p.a, p.cur)}${p.u === "percent" ? "%" : ""} <small>${UNIT_KO[p.u] || esc(p.u.replace(/^USD_per_/, "/ "))}</small></b></div>`).join("")}
    </section>`;
  }
  // 앱 플랜·무료
  const plans = W.plans.filter((p) => p.e === id);
  let appBlock = "";
  if (plans.length || fr.length) {
    appBlock = `<section class="wcard wsec-card"><div class="wsec-head"><h3>${e.t === "application" ? "무료 · 구독 플랜" : "무료 혜택"}</h3></div>
      ${fr.map((f) => `<div class="drow col"><span class="dname">${esc(f.n)} ${f.t === "not_available" ? badge("없음", "") : f.t === "not_listed" ? badge("언급 없음", "") : badge("무료", "ok")}</span>
        <small>${esc([f.m, f.lim, f.reset && `초기화: ${f.reset}`, f.r].filter(Boolean).map(dots).join(" · "))}</small></div>`).join("")}
      ${plans.map((p) => `<div class="drow"><span>${esc(planName(p.n))}${p.per === "annual" ? " <small>(연간 결제)</small>" : ""}${p.use ? `<small class="block">${esc(p.use)}</small>` : ""}</span>
        <b>${money(p.m, p.cur)}<small>/월</small></b></div>`).join("")}
    </section>`;
  }
  // 앱으로 쓰려면 (다른 앱의 플랜 조건에 이 모델이 들어 있는 경우)
  const via = e.t !== "application" ? W.plans.filter((p) => p.e !== id && (p.cond || "").includes(e.n)) : [];
  if (via.length) {
    const host = wEnt(via[0].e);
    const hostFree = freeOf(via[0].e).find((f) => f.t === "app_free_plan");
    appBlock += `<section class="wcard wsec-card"><div class="wsec-head"><h3>앱으로 쓰려면</h3><span>${esc(host.n)}</span></div>
      ${hostFree ? `<div class="drow"><span class="dname">${esc(host.n.replace(/ \(.*\)$/, ""))} 무료 ${badge("미포함", "")}</span><small>${esc(dots(hostFree.m))}만</small></div>` : ""}
      ${via.map((p) => `<div class="drow"><span class="dname">${esc(planName(p.n))} ${badge("포함", "ok")}</span><b>${money(p.m, p.cur)}<small>/월</small></b></div>`).join("")}
    </section>`;
  }
  // 성능
  const pf = W.perf.find((p) => p.e === id);
  let perfBlock = "";
  if (pf && pf.idx != null) {
    const same = W.perf.filter((p) => p.e !== id && p.idx === pf.idx && p.cost != null);
    perfBlock = `<section class="wcard wsec-card"><div class="wsec-head"><h3>성능</h3>${badge("제3자 값 · 재확인 중", "warn")}</div>
      <div class="pnums big"><div><small>AA 지능 지수${pf.var ? ` (${esc(pf.var)})` : ""}</small><b>${pf.idx}</b></div>${pf.cost != null ? `<div><small>평가 1회 비용</small><b>$${pf.cost}</b></div>` : ""}</div>
      ${same.length && pf.cost != null ? `<p class="wnote">같은 지수 ${pf.idx}인 ${same.map((p) => `<b>${esc(wEnt(p.e).n)}</b>($${p.cost})`).join(", ")}${same.every((p) => p.cost > pf.cost) ? "보다 평가 비용이 낮아요." : "와 비교해 보세요."}</p>` : ""}
      <button class="wlink" data-wmode-go="perf">그래프에서 다른 모델과 비교하기</button>
    </section>`;
  }
  // 사양 · 출처
  const spec = [["종류", typeKo], ["문맥 길이", e.ctx ? `${ctxKo(+e.ctx)} 토큰` : "확인 중"],
    e.tp ? ["파라미터", `${e.tp}B${e.ap ? ` (활성 ${e.ap}B)` : ""}`] : null, e.lic ? ["라이선스", e.lic] : null,
    ["한국어 지원", e.ko || "확인 중"]].filter(Boolean);
  const srcIds = new Set([e.src, ...(e.spec ? e.spec.split(";") : []), ...W.prices.filter((p) => p.e === id).map((p) => p.s),
    ...plans.map((p) => p.s), ...fr.map((f) => f.s), ...(pf ? [pf.s] : [])].filter(Boolean));
  const srcs = [...srcIds].map((k) => W.src[k]).filter(Boolean);
  return `<div class="wdetail">
    <button class="back-chip" data-wback><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>위키로</button>
    <div class="d-head">
      <span class="mono big" style="background:${tintOf(e)}">${esc(monoOf(e.n, id))}</span>
      <div><p class="eyebrow">${esc(e.p)} · ${esc(typeKo)}</p><h2 class="wiki-title">${esc(e.n)}</h2><div class="d-badges">${badges.join("")}</div></div>
    </div>
    ${e.note ? `<p class="lede">${esc(dots(e.note))}</p>` : ""}
    <div class="d-cols">
      <div class="d-main">${priceBlock}${appBlock}${perfBlock}${!priceBlock && !appBlock && !perfBlock ? `<div class="wcard wsec-card"><p class="wnote">아직 가격·성능 정보를 모으는 중이에요.</p></div>` : ""}</div>
      <aside class="d-side">
        <section class="wcard wsec-card"><h3>사양</h3>${spec.map(([k, v]) => `<div class="kv"><small>${k}</small><b class="${/확인 중/.test(v) ? "pending" : ""}">${esc(v)}</b></div>`).join("")}
          <div class="kv"><small>쓰기 좋은 분야</small><div class="d-badges">${wCats(id).map((c) => `<span class="wbadge cat">${esc(wCatKo(c))}</span>`).join("")}</div></div>
        </section>
        <section class="wcard wsec-card"><h3>출처</h3>${srcs.map((x) => `<div class="kv"><a href="${esc(x.u)}" target="_blank" rel="noopener">${esc(x.p)} · ${esc(srcLabel(x.u))}</a><small>${x.t === "official" ? "공식" : x.t === "secondary" ? "2차 자료" : "제3자"} · ${fullDate(x.d)} 확인</small></div>`).join("")}</section>
      </aside>
    </div>
  </div>`;
}

function renderWiki() {
  const root = $("#wikiRoot");
  if (!root) return;
  if (!W) { root.innerHTML = `<div class="arc-empty">위키 데이터를 불러오지 못했어요.</div>`; return; }
  root.innerHTML = wiki.ent ? wikiDetail(wiki.ent)
    : wikiHead() + (wiki.mode === "api" ? wikiApi() : wiki.mode === "perf" ? wikiPerf() : wikiApp());
  const modes = root.querySelector(".wiki-modes");
  if (modes) moveSlideInd(modes, true);
}
function wikiGo(patch, dir) {
  const before = wikiKey();
  Object.assign(wiki, patch);
  if (wikiKey() === before) { renderWiki(); return; }
  if (dir !== undefined) {
    slideIn($("#wikiRoot"), dir, renderWiki);
    if (dir) scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  } else renderWiki();
  recordNav();
}
$("#wikiRoot").addEventListener("click", (e) => {
  const t = e.target;
  const ent = t.closest("[data-went]");
  if (ent && ent.dataset.went) { wikiGo({ ent: ent.dataset.went }, 1); return; }
  if (t.closest("[data-wback]")) { wikiGo({ ent: null }, -1); return; }
  const go = t.closest("[data-wmode-go]");
  if (go) { wikiGo({ mode: go.dataset.wmodeGo, ent: null, cat: go.dataset.wmodeGo === "perf" ? "all" : wiki.cat }, 1); return; }
  const m = t.closest("[data-wmode]");
  if (m && m.dataset.wmode !== wiki.mode) {
    const order = ["app", "api", "perf"];
    const modes = $("#wikiRoot .wiki-modes");
    modes.querySelectorAll("[data-wmode]").forEach((b) => b.setAttribute("aria-pressed", b === m));
    moveSlideInd(modes);
    const dir = order.indexOf(m.dataset.wmode) > order.indexOf(wiki.mode) ? 1 : -1;
    setTimeout(() => wikiGo({ mode: m.dataset.wmode }, dir), reduce ? 0 : 180);
    return;
  }
  const c = t.closest("[data-wcat]");
  if (c && c.dataset.wcat !== wiki.cat) { wikiGo({ cat: c.dataset.wcat }, 0); return; }
  const u = t.closest("[data-wunit]");
  if (u) { wiki.unit = u.dataset.wunit; renderWiki(); }
});
$("#wikiRoot").addEventListener("change", (e) => {
  const tg = e.target.dataset.wtoggle;
  if (tg) { wiki[tg] = e.target.checked; renderWiki(); return; }
  if (e.target.matches("[data-wsort]")) { wiki.sort = e.target.value; renderWiki(); }
});
$("#wikiRoot").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.target.matches("g.pt")) wikiGo({ ent: e.target.dataset.went }, 1);
});

/* ================= 9.7) AI 최신 NEWS =================
   GitHub Actions가 3시간마다 갱신하는 data/news.json을 읽어
   홈 상단 제목 배너(티커)와 NEWS 탭 목록을 그림. 제목은 모두 textContent로만 넣음(외부 문자열) */
const NEWS_TAGS = ["전체", "출시", "보안", "할인", "소식"];
const news = { raw: [], items: [], ov: new Map(), tag: "전체", updated: null, failed: false };

function relTime(iso) {
  const t = Date.parse(iso);
  if (!t) return "";
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 60) return `${m || 1}분 전`;
  if (m < 1440) return `${Math.round(m / 60)}시간 전`;
  if (m < 10080) return `${Math.round(m / 1440)}일 전`;
  const d = new Date(t);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function safeUrl(u) {
  try { const x = new URL(u); return /^https?:$/.test(x.protocol) ? x.href : null; } catch (e) { return null; }
}
function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}
function newsLink(it, cls, hidden) {
  const a = el("a", cls);
  a.href = it.url; a.target = "_blank"; a.rel = "noopener noreferrer";
  if (hidden) { a.tabIndex = -1; a.setAttribute("aria-hidden", "true"); }
  a.append(el("span", `ntag t-${it.tag}`, it.tag), el("span", "ntitle", it.title));
  const meta = el("span", "nmeta", `${it.source} · ${relTime(it.published)}`);
  a.append(meta);
  return a;
}

function renderNewsList() {
  const list = $("#newsList");
  list.replaceChildren();
  if (news.failed) { list.append(el("div", "arc-empty", "소식을 불러오지 못했어요. 잠시 후 다시 확인해 주세요.")); return; }
  const items = news.items.filter((it) => news.tag === "전체" || it.tag === news.tag);
  if (!items.length) {
    list.append(el("div", "arc-empty", news.items.length ? "이 분류의 소식이 아직 없어요." : "첫 소식을 모으는 중이에요. 곧 채워져요."));
    return;
  }
  items.forEach((it) => {
    const row = newsLink(it, "news-row wcard");
    if (it.lang === "en") row.querySelector(".nmeta").append(el("span", "nlang", "EN"));
    list.append(row);
  });
}
function renderNewsChips() {
  const box = $("#newsChips");
  box.replaceChildren(...NEWS_TAGS.map((t) => {
    const b = el("button", "chip pill", t === "전체" ? `전체 ${news.items.length}` : t);
    b.dataset.ntag = t;
    b.setAttribute("aria-pressed", news.tag === t);
    return b;
  }));
}
function renderNewsAsOf() {
  const p = $("#newsAsOf");
  if (!news.updated) { p.textContent = ""; return; }
  const d = new Date(news.updated);
  const hh = String(d.getHours()).padStart(2, "0"), mm = String(d.getMinutes()).padStart(2, "0");
  p.textContent = `마지막 수집 ${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()} ${hh}:${mm} · ${news.items.length}건 · 3시간마다 자동 갱신`;
}
function renderTicker() {
  const box = $("#newsTicker"), track = $("#ntTrack");
  const top = news.items.slice(0, 12);
  if (!top.length) { box.hidden = true; return; }
  track.replaceChildren(
    ...top.map((it) => newsLink(it, "nt-item")),
    ...top.map((it) => newsLink(it, "nt-item", true)),   // 이어 붙여서 끊김 없이 흐르게
  );
  track.style.setProperty("--nt-dur", `${Math.max(30, top.length * 7)}s`);
  box.hidden = false;
}
function renderNews() { renderNewsChips(); renderNewsAsOf(); renderNewsList(); renderTicker(); }

/* 관리자가 고친 제목·분류, 숨긴 기사 (Supabase news_overrides) */
async function loadNewsOverrides() {
  if (!sb) return;
  const { data, error } = await sb.from("news_overrides").select("news_id,hidden,title,tag");
  if (error) { console.warn("news_overrides", error.message); return; }
  news.ov = new Map(data.map((o) => [o.news_id, o]));
}
function newsView(it) {
  const o = news.ov.get(it.id);
  if (!o) return it;
  return { ...it, title: o.title || it.title, tag: NEWS_TAGS.includes(o.tag) ? o.tag : it.tag, hidden: !!o.hidden };
}
function applyNews() {
  news.items = news.raw.map(newsView).filter((it) => !it.hidden);
  renderNews();
  if (admOpen() && adm.tab === "news") renderAdmin();
}

async function loadNews() {
  try {
    const [res] = await Promise.all([
      fetch(`data/news.json?v=${Math.floor(Date.now() / 600000)}`, { cache: "no-cache" }),
      loadNewsOverrides(),
    ]);
    if (!res.ok) throw new Error(res.status);
    const data = await res.json();
    news.raw = (data.items || []).map((it) => ({ ...it, url: safeUrl(it.url) }))
      .filter((it) => it.url && it.title && NEWS_TAGS.includes(it.tag));
    news.updated = data.updated_at;
    news.failed = false;
  } catch (e) {
    console.warn("news.json", e);
    news.failed = true;
  }
  applyNews();
}
$("#newsChips").addEventListener("click", (e) => {
  const b = e.target.closest("[data-ntag]");
  if (!b || b.dataset.ntag === news.tag) return;
  news.tag = b.dataset.ntag;
  $("#newsChips").querySelectorAll("[data-ntag]").forEach((x) => x.setAttribute("aria-pressed", x === b));
  slideIn($("#newsList"), 0, renderNewsList);
});
$("#ntLabel").addEventListener("click", () => selectTab("news"));
loadNews();
setInterval(() => { if (!document.hidden) loadNews(); }, 15 * 60 * 1000);   // 열어 둔 채로 있어도 15분마다 새로 읽음

/* ================= 10) 뒤로 · 앞으로 =================
   탭 이동, 카테고리, 아카이브 폴더 이동을 기록 */
const nav = { stack: [], pos: -1, browser: true, waiting: null };
const snapshot = () => ({ tab: current, cat: state.cat, folder: archiveView, wiki: wikiKey() });
const same = (a, b) => a && b && a.tab === b.tab && a.cat === b.cat && a.folder === b.folder && (a.wiki || "app|all|") === (b.wiki || "app|all|");
function setWikiKey(k) {
  const [mode, cat, ent] = (k || "app|all|").split("|");
  wiki.mode = mode || "app"; wiki.cat = cat || "all"; wiki.ent = ent || null;
}

function saveNav() { try { sessionStorage.setItem("promme-nav", JSON.stringify({ stack: nav.stack, pos: nav.pos })); } catch (e) {} }
function updateArrows() {
  $("#backBtn").disabled = nav.pos <= 0;
  $("#fwdBtn").disabled = nav.pos >= nav.stack.length - 1;
}
function recordNav() {
  const s = snapshot();
  if (same(nav.stack[nav.pos], s)) return;
  nav.stack = nav.stack.slice(0, nav.pos + 1);
  nav.stack.push(s);
  nav.pos = nav.stack.length - 1;
  if (nav.browser) {
    try { history.pushState({ promme: true, pos: nav.pos }, "", "#" + s.tab); }
    catch (e) { nav.browser = false; }
  }
  saveNav(); updateArrows();
}
function applyNav(s) {
  if (s.cat !== state.cat) setCat(s.cat);
  const folder = s.folder === undefined ? null : s.folder;
  if (folder !== archiveView) {
    const dir = folder === null ? -1 : 1;
    archiveView = folder;
    if (current === "archive" && s.tab === "archive") slideIn($("#archiveRoot"), dir, renderArchive);
    else renderArchive();
  }
  const wk = s.wiki || "app|all|";
  if (wk !== wikiKey()) {
    const hadEnt = !!wiki.ent;
    setWikiKey(wk);
    const dir = wiki.ent ? 1 : hadEnt ? -1 : 0;
    if (current === "wiki" && s.tab === "wiki") slideIn($("#wikiRoot"), dir, renderWiki);
    else renderWiki();
  }
  selectTab(s.tab, { record: false });
}
function moveTo(pos) {
  nav.pos = pos;
  applyNav(nav.stack[pos]);
  saveNav(); updateArrows();
}
function go(delta) {
  const target = nav.pos + delta;
  if (target < 0 || target >= nav.stack.length) return;
  if (nav.browser) {
    nav.waiting = setTimeout(() => { nav.browser = false; moveTo(target); }, 350);
    history.go(delta);
  } else {
    moveTo(target);
  }
}
addEventListener("popstate", (e) => {
  clearTimeout(nav.waiting);
  const st = e.state;
  if (st && st.promme && nav.stack[st.pos]) { moveTo(st.pos); return; }
  const tab = location.hash.slice(1);
  if (ORDER.includes(tab)) { selectTab(tab, { record: false }); recordNav(); }
});
$("#backBtn").addEventListener("click", () => go(-1));
$("#fwdBtn").addEventListener("click", () => go(1));

/* ================= 11) 시작 ================= */
loadLocal();
renderAll();

(function init() {
  let restored = null;
  try { restored = JSON.parse(sessionStorage.getItem("promme-nav") || "null"); } catch (e) {}
  const hs = history.state;
  const hashTab = ORDER.includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";

  if (restored && hs && hs.promme && restored.stack[hs.pos]) {
    nav.stack = restored.stack; nav.pos = hs.pos;
  } else {
    nav.stack = [{ tab: hashTab, cat: "all", folder: null, wiki: "app|all|" }]; nav.pos = 0;
    try { history.replaceState({ promme: true, pos: 0 }, "", "#" + hashTab); } catch (e) { nav.browser = false; }
  }

  const s = nav.stack[nav.pos];
  if (s.cat !== "all") setCat(s.cat);
  archiveView = s.folder === undefined ? null : s.folder;
  renderArchive();
  setWikiKey(s.wiki);
  renderWiki();
  if (s.tab !== "home") {
    document.querySelectorAll(".page").forEach((p) => (p.hidden = p.dataset.tab !== s.tab));
    current = s.tab;
  }
  selectTab(current, { instant: true, record: false });
  saveNav(); updateArrows();

  moveSlideInd($(".seg"), true);
  if (document.fonts) document.fonts.ready.then(() => { placeIndicator(ORDER.indexOf(current), true); moveSlideInd($(".seg"), true); const wm = $("#wikiRoot .wiki-modes"); if (wm) moveSlideInd(wm, true); });
})();
