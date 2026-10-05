/* =========================================================
   promme — app.js
   1) 데이터            2) 아카이브 저장소 (이 기기 / Supabase)
   3) 홈 카드            4) MY 아카이브 화면
   5) 시트 공통 · 프롬프트 · 폴더 고르기 · 폴더 편집
   6) 날아가는 모션      7) 로그인 (Supabase)
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
  { id: 1, title: "셀카 + GPT로 피규어 만들기", cat: "image", tool: "ChatGPT", saves: "1.2k", art: "🧸", img: "", bg: "linear-gradient(135deg,#ffb7c5,#ffe1a8)",
    prompt: "첨부한 사진 속 인물을 1/7 스케일의 수집용 피규어로 만들어줘.\n- 투명 아크릴 받침대 위에 서 있는 모습\n- 뒤쪽에 피규어 박스 패키지 디자인\n- 책상 위, 자연광, 실사 느낌" },
  { id: 2, title: "인스타 프로필 소개글", cat: "sns", tool: "Claude", saves: "860", art: "📸", img: "", bg: "linear-gradient(135deg,#ffd6e8,#c9b8ff)",
    prompt: "너는 20대 감성의 인스타그램 카피라이터야.\n내 정보: [전공/취미/요즘 빠진 것]\n이 정보로 프로필 소개글 5개를 만들어줘. 각 30자 이내, 이모지 1~2개, 말투는 담백하게." },
  { id: 3, title: "캐릭캐릭 체인지", cat: "image", tool: "ChatGPT", saves: "2.4k", art: "🌸", img: "", bg: "linear-gradient(135deg,#9be7c4,#ffc0d9)",
    prompt: "첨부한 사진을 2000년대 일본 애니메이션 스타일 캐릭터로 바꿔줘.\n- 큰 눈, 선명한 셀 채색\n- 배경은 학교 운동장과 하늘\n- 원래 옷 색과 헤어스타일은 유지" },
  { id: 4, title: "요즘 유행 웹툰 한 컷", cat: "sns", tool: "ChatGPT", saves: "1.7k", art: "💭", img: "", bg: "linear-gradient(135deg,#ffe2a1,#f6a77a)",
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

const FOLDER_EMOJIS = ["📁", "✨", "🔖", "💡", "🎨", "📸", "📚", "🍱", "💪", "💼", "🌙", "🎧"];

/* ================= 공통 ================= */
const $ = (s) => document.querySelector(s);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ORDER = ["archive", "home", "news", "wiki", "fortune"];
const byId = (id) => PROMPTS.find((p) => p.id === id);
const catName = (id) => CATS.find((c) => c.id === id).name;
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
  return `<div class="art" aria-hidden="true">${p.art}</div>` +
    (p.img ? `<img class="shot" src="${esc(p.img)}" alt="" loading="lazy" decoding="async" onload="this.parentNode.classList.add('has-img')" onerror="this.remove()">` : "");
}

function cardHTML(p) {
  const s = saveOf(p.id), f = s && folderOf(s.folder_id);
  return `<article class="card" tabindex="0" data-id="${p.id}">
    <div class="thumb" style="background:${p.bg}">
      ${artInner(p)}
      <div class="cap"><span>${esc(p.title)}</span>
        <button class="save" data-save="${p.id}" aria-pressed="${!!s}" aria-label="${s ? `‘${esc(f ? f.name : "")}’ 폴더에 담김` : "폴더에 담기"}">${bookmarkSvg}</button></div>
    </div>
    <div class="meta"><span class="list-title">${esc(p.title)}</span><span>${p.tool} · ${catName(p.cat)}</span><span>저장 ${p.saves}</span></div>
  </article>`;
}

function renderHome() {
  const q = state.q.trim().toLowerCase();
  const list = PROMPTS.filter((p) =>
    (state.cat === "all" || p.cat === state.cat) &&
    (!q || (p.title + p.prompt + p.tool).toLowerCase().includes(q)));
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
  setCat(b.dataset.cat);
  recordNav();
});

/* 검색 */
function syncSearch(v) { state.q = v; $("#searchInput").value = v; $("#miniInput").value = v; renderHome(); }
$("#searchInput").addEventListener("input", (e) => syncSearch(e.target.value));
$("#miniInput").addEventListener("input", (e) => { syncSearch(e.target.value); if (current !== "home") selectTab("home"); });

/* 보기 방식 */
["#viewGrid", "#viewList"].forEach((sel) => $(sel).addEventListener("click", () => {
  state.view = sel === "#viewList" ? "list" : "grid";
  $("#viewGrid").setAttribute("aria-pressed", state.view === "grid");
  $("#viewList").setAttribute("aria-pressed", state.view === "list");
  renderHome(); renderArchive();
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
  return `<div class="tile" style="background:${p.bg}">${p.art}${p.img ? `<img src="${esc(p.img)}" alt="" loading="lazy" onerror="this.remove()">` : ""}</div>`;
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
  archiveView = fid;
  renderArchive();
  scrollTo(0, 0);
  recordNav();
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
  const s = $(id);
  s.hidden = false;
  requestAnimationFrame(() => s.classList.add("open"));
}
function closeModal(id) {
  const s = $(id);
  s.classList.remove("open");
  setTimeout(() => { if (!s.classList.contains("open")) s.hidden = true; }, reduce ? 0 : 300);
}
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
  $("#sSub").textContent = `${p.tool} · ${catName(p.cat)} · 저장 ${p.saves}`;
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
  $("#pkThumb").style.background = p.bg;
  $("#pkThumb").innerHTML = p.art + (p.img ? `<img src="${esc(p.img)}" alt="" onerror="this.remove()">` : "");
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
  el.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;background:${p.bg}`;
  el.innerHTML = `<div class="art">${p.art}</div>` + (p.img ? `<img src="${esc(p.img)}" alt="" onerror="this.remove()">` : "");
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
}
function setAuthMsg(t, ok) { const m = $("#authMsg"); m.textContent = t; m.classList.toggle("ok", !!ok); }
function openAuth() {
  setAuthMode("login");
  $("#authNotice").hidden = !!sb;
  [...$("#authForm").elements].forEach((el) => (el.disabled = !sb));
  $("#oauthBox").hidden = !(sb && CFG.google);
  openModal("#authScrim");
  if (sb) setTimeout(() => $("#authEmail").focus(), 50);
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
}
$("#loginBtn").addEventListener("click", () => {
  if (!user) { openAuth(); return; }
  $("#acAvatar").textContent = (user.email || "?").charAt(0).toUpperCase();
  $("#acEmail").textContent = user.email || "";
  $("#acStats").textContent = `프롬프트 ${store.saves.length}개 · 폴더 ${store.folders.length}개 저장 중`;
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
  if (user) {
    await mergeLocalIntoRemote();
    await pullRemote();
  } else {
    loadLocal();
    renderAll();
  }
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

/* ================= 8) 오늘의 운세 ================= */
(function () {
  const d = new Date(), seed = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
  const msgs = ["작게 시작한 일이 생각보다 멀리 가는 날이에요.", "미뤄둔 연락 하나가 좋은 소식으로 돌아와요.", "오늘은 질문을 잘하는 사람이 이겨요. 프롬프트도 마찬가지!", "정리 정돈이 행운을 불러요. 폴더 하나만 정리해봐요.", "새로운 도구를 써보기 좋은 날. 처음 써보는 AI에 도전해봐요."];
  const colors = ["버터 옐로", "피치", "민트", "라벤더", "코랄"], items = ["이어폰", "텀블러", "스티커", "노트", "향수"];
  $("#fDate").textContent = `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
  $("#fMsg").textContent = msgs[seed % msgs.length];
  $("#fLucky").innerHTML = `<span>행운의 색 · ${colors[seed % 5]}</span><span>행운의 아이템 · ${items[(seed + 2) % 5]}</span>`;
  $("#fPrompt").addEventListener("click", () => openPrompt(PROMPTS[seed % PROMPTS.length]));
})();

/* ================= 9) 리퀴드 글래스 탭바 ================= */
const bar = $("#tabbar"), ind = $("#indicator"), tabs = [...bar.querySelectorAll(".tab")];

/* 스프링 물리: 알약 위치(x)가 목표(target)로 탄성 있게 이동 */
const sp = { x: 0, v: 0, target: 0, scale: 1, scaleT: 1, raf: 0 };
const K = 420;   // 강성 — 클수록 빠르게 따라감
const D = 30;    // 감쇠 — 작을수록 더 출렁임
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

  if (reduce || opts.instant || !to.animate) {
    document.querySelectorAll(".page").forEach((p) => (p.hidden = p.dataset.tab !== current));
    scrollTo(0, 0);
    return;
  }
  from.animate(
    [{ transform: "translateX(0)", opacity: 1, filter: "blur(0)" },
     { transform: `translateX(${-dir * 18}%)`, opacity: 0, filter: "blur(6px)" }],
    { duration: 240, easing: "ease-in" }
  ).onfinish = () => {
    if (current !== name) return;
    document.querySelectorAll(".page").forEach((p) => (p.hidden = p.dataset.tab !== current));
    scrollTo(0, 0);
    updateMiniSearch();
    to.animate(
      [{ transform: `translateX(${dir * 22}%)`, opacity: 0, filter: "blur(6px)" },
       { transform: "translateX(0)", opacity: 1, filter: "blur(0)" }],
      { duration: 520, easing: "cubic-bezier(.22,1,.36,1)" }
    );
  };
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

addEventListener("resize", () => placeIndicator(ORDER.indexOf(current), true));

/* ================= 10) 뒤로 · 앞으로 =================
   탭 이동, 카테고리, 아카이브 폴더 이동을 기록 */
const nav = { stack: [], pos: -1, browser: true, waiting: null };
const snapshot = () => ({ tab: current, cat: state.cat, folder: archiveView });
const same = (a, b) => a && b && a.tab === b.tab && a.cat === b.cat && a.folder === b.folder;

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
  if (folder !== archiveView) { archiveView = folder; renderArchive(); }
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
    nav.stack = [{ tab: hashTab, cat: "all", folder: null }]; nav.pos = 0;
    try { history.replaceState({ promme: true, pos: 0 }, "", "#" + hashTab); } catch (e) { nav.browser = false; }
  }

  const s = nav.stack[nav.pos];
  if (s.cat !== "all") setCat(s.cat);
  archiveView = s.folder === undefined ? null : s.folder;
  renderArchive();
  if (s.tab !== "home") {
    document.querySelectorAll(".page").forEach((p) => (p.hidden = p.dataset.tab !== s.tab));
    current = s.tab;
  }
  selectTab(current, { instant: true, record: false });
  saveNav(); updateArrows();

  if (document.fonts) document.fonts.ready.then(() => placeIndicator(ORDER.indexOf(current), true));
})();
