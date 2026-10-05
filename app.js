/* =========================================================
   promme — app.js
   1) 데이터   2) 카드 렌더링   3) 시트 · 토스트
   4) 오늘의 운세   5) 탭 전환 + 리퀴드 글래스 탭바
   6) 뒤로 · 앞으로 (방문 기록)   7) 시작
   ========================================================= */

/* ================= 1) 데이터 (예시) =================
   나중에 DB(Supabase, Firebase 등)로 옮기면 이 배열 대신 fetch 결과를 쓰면 됩니다. */
const CATS = [
  { id: "all",   name: "전체",        emo: "✨" },
  { id: "sns",   name: "SNS",         emo: "💬" },
  { id: "life",  name: "라이프스타일", emo: "📝" },
  { id: "study", name: "학습",        emo: "🎓" },
  { id: "image", name: "이미지 생성",  emo: "📷" },
];

const PROMPTS = [
  { id: 1, title: "셀카 + GPT로 피규어 만들기", cat: "image", tool: "ChatGPT", saves: "1.2k", art: "🧸", bg: "linear-gradient(135deg,#ffb7c5,#ffe1a8)",
    prompt: "첨부한 사진 속 인물을 1/7 스케일의 수집용 피규어로 만들어줘.\n- 투명 아크릴 받침대 위에 서 있는 모습\n- 뒤쪽에 피규어 박스 패키지 디자인\n- 책상 위, 자연광, 실사 느낌" },
  { id: 2, title: "인스타 프로필 소개글", cat: "sns", tool: "Claude", saves: "860", art: "📸", bg: "linear-gradient(135deg,#ffd6e8,#c9b8ff)",
    prompt: "너는 20대 감성의 인스타그램 카피라이터야.\n내 정보: [전공/취미/요즘 빠진 것]\n이 정보로 프로필 소개글 5개를 만들어줘. 각 30자 이내, 이모지 1~2개, 말투는 담백하게." },
  { id: 3, title: "캐릭캐릭 체인지", cat: "image", tool: "ChatGPT", saves: "2.4k", art: "🌸", bg: "linear-gradient(135deg,#9be7c4,#ffc0d9)",
    prompt: "첨부한 사진을 2000년대 일본 애니메이션 스타일 캐릭터로 바꿔줘.\n- 큰 눈, 선명한 셀 채색\n- 배경은 학교 운동장과 하늘\n- 원래 옷 색과 헤어스타일은 유지" },
  { id: 4, title: "요즘 유행 웹툰 한 컷", cat: "sns", tool: "ChatGPT", saves: "1.7k", art: "💭", bg: "linear-gradient(135deg,#ffe2a1,#f6a77a)",
    prompt: "아래 상황을 한국 웹툰 한 컷으로 그려줘.\n상황: [내가 겪은 웃긴 일]\n- 말풍선 하나, 한국어 대사\n- 과장된 표정, 깔끔한 선화" },
  { id: 5, title: "주 3회 운동 루틴", cat: "life", tool: "Claude", saves: "640", art: "🏃", bg: "linear-gradient(135deg,#bfe8ff,#d8f5c0)",
    prompt: "너는 퍼스널 트레이너야.\n내 정보: 운동 경험 [없음/초급], 목표 [체력/근력], 가능한 시간 [하루 40분]\n주 3회, 4주짜리 루틴을 표로 만들어줘. 각 운동에 세트·횟수·쉬는 시간 포함." },
  { id: 6, title: "일주일 자취 식단표", cat: "life", tool: "Gemini", saves: "520", art: "🍱", bg: "linear-gradient(135deg,#ffe9b0,#ffc9a3)",
    prompt: "자취생용 7일 식단표를 만들어줘.\n조건: 한 끼 재료비 5천원 이내, 조리 15분 이내, 전자레인지 활용\n요일별 아침·점심·저녁을 표로, 마지막에 장보기 목록까지." },
  { id: 7, title: "시험 전날 요약 노트", cat: "study", tool: "Claude", saves: "990", art: "📚", bg: "linear-gradient(135deg,#d4d8ff,#bfeaf0)",
    prompt: "첨부한 강의 자료를 시험 전날 30분 안에 볼 수 있게 요약해줘.\n- 핵심 개념 10개, 각 2줄\n- 자주 헷갈리는 비교 3개는 표로\n- 마지막에 예상 문제 5개와 정답" },
  { id: 8, title: "발표 슬라이드 뼈대", cat: "study", tool: "ChatGPT", saves: "710", art: "🎤", bg: "linear-gradient(135deg,#ffd0b5,#e7c6ff)",
    prompt: "주제: [발표 주제], 발표 시간: 10분, 청중: 같은 과 학생\n슬라이드 8장 구성으로 각 장의 제목, 핵심 문장 1개, 넣을 시각 자료를 제안해줘." },
];

/* ================= 공통 ================= */
const $ = (s) => document.querySelector(s);
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const ORDER = ["archive", "home", "news", "wiki", "fortune"];

const state = { cat: "all", q: "", view: "grid", saved: new Set() };
let current = "home";

try { JSON.parse(localStorage.getItem("promme-saved") || "[]").forEach((id) => state.saved.add(id)); } catch (e) {}
const persistSaved = () => { try { localStorage.setItem("promme-saved", JSON.stringify([...state.saved])); } catch (e) {} };

/* ================= 2) 카드 렌더링 ================= */
const bookmarkSvg = '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z"/></svg>';
const catName = (id) => CATS.find((c) => c.id === id).name;

function cardHTML(p) {
  return `<article class="card" tabindex="0" data-id="${p.id}">
    <div class="thumb" style="background:${p.bg}">
      <div class="art" aria-hidden="true">${p.art}</div>
      <div class="cap"><span>${p.title}</span>
        <button class="save" data-save="${p.id}" aria-pressed="${state.saved.has(p.id)}" aria-label="아카이브에 저장">${bookmarkSvg}</button></div>
    </div>
    <div class="meta"><span class="list-title">${p.title}</span><span>${p.tool} · ${catName(p.cat)}</span><span>저장 ${p.saves}</span></div>
  </article>`;
}

function renderHome() {
  const q = state.q.trim().toLowerCase();
  const list = PROMPTS.filter((p) =>
    (state.cat === "all" || p.cat === state.cat) &&
    (!q || (p.title + p.prompt + p.tool).toLowerCase().includes(q)));
  $("#grid").innerHTML = list.length
    ? list.map(cardHTML).join("")
    : `<div class="empty">“${state.q}”에 맞는 프롬프트가 아직 없어요.</div>`;
  $("#grid").classList.toggle("list", state.view === "list");
}

function renderArchive() {
  const list = PROMPTS.filter((p) => state.saved.has(p.id));
  $("#archiveGrid").innerHTML = list.length
    ? list.map(cardHTML).join("")
    : `<div class="empty">아직 저장한 프롬프트가 없어요. 홈에서 카드의 북마크를 눌러보세요.</div>`;
  $("#archiveGrid").classList.toggle("list", state.view === "list");
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
  recordNav();                       // 카테고리 변경도 뒤로가기 기록에 남김
});

/* 검색 (큰 검색창 · 상단 미니 검색창 연동) */
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

/* 카드 클릭 → 상세 시트 / 북마크 → 아카이브 저장 */
function onCardClick(e) {
  const s = e.target.closest("[data-save]");
  if (s) {
    e.stopPropagation();
    const id = +s.dataset.save;
    state.saved.has(id) ? state.saved.delete(id) : state.saved.add(id);
    persistSaved();
    toast(state.saved.has(id) ? "MY 아카이브에 저장했어요" : "저장을 취소했어요");
    renderHome(); renderArchive();
    return;
  }
  const c = e.target.closest(".card");
  if (c) openSheet(PROMPTS.find((p) => p.id === +c.dataset.id));
}
["#grid", "#archiveGrid"].forEach((g) => {
  $(g).addEventListener("click", onCardClick);
  $(g).addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.classList.contains("card")) onCardClick(e); });
});

/* ================= 3) 시트 · 토스트 ================= */
let sheetPrompt = "";
function openSheet(p) {
  sheetPrompt = p.prompt;
  $("#sTitle").textContent = p.title;
  $("#sSub").textContent = `${p.tool} · ${catName(p.cat)} · 저장 ${p.saves}`;
  $("#sPrompt").textContent = p.prompt;
  const s = $("#scrim");
  s.hidden = false;
  requestAnimationFrame(() => s.classList.add("open"));
  $("#sCopy").focus();
}
function closeSheet() {
  const s = $("#scrim");
  s.classList.remove("open");
  setTimeout(() => (s.hidden = true), reduce ? 0 : 300);
}
$("#sClose").addEventListener("click", closeSheet);
$("#scrim").addEventListener("click", (e) => { if (e.target.id === "scrim") closeSheet(); });
addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#scrim").hidden) closeSheet(); });
$("#sCopy").addEventListener("click", () => {
  navigator.clipboard.writeText(sheetPrompt)
    .then(() => toast("복사했어요. AI 채팅창에 붙여넣으세요"))
    .catch(() => {
      const r = document.createRange(); r.selectNodeContents($("#sPrompt"));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      toast("텍스트를 선택했어요. 직접 복사해 주세요");
    });
});

let toastTimer;
function toast(m) {
  const t = $("#toast");
  t.textContent = m; t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}
$("#loginBtn").addEventListener("click", () => toast("로그인은 백엔드 연결 후 동작해요"));

/* 상단 미니 검색: 큰 검색창이 안 보이면 등장 */
function updateMiniSearch() {
  const hidden = current !== "home" || $("#bigSearch").getBoundingClientRect().bottom < 70;
  $("#miniSearch").classList.toggle("show", hidden);
}
addEventListener("scroll", updateMiniSearch, { passive: true });

/* ================= 4) 오늘의 운세 ================= */
(function () {
  const d = new Date(), seed = d.getFullYear() * 372 + d.getMonth() * 31 + d.getDate();
  const msgs = ["작게 시작한 일이 생각보다 멀리 가는 날이에요.", "미뤄둔 연락 하나가 좋은 소식으로 돌아와요.", "오늘은 질문을 잘하는 사람이 이겨요. 프롬프트도 마찬가지!", "정리 정돈이 행운을 불러요. 폴더 하나만 정리해봐요.", "새로운 도구를 써보기 좋은 날. 처음 써보는 AI에 도전해봐요."];
  const colors = ["버터 옐로", "피치", "민트", "라벤더", "코랄"], items = ["이어폰", "텀블러", "스티커", "노트", "향수"];
  $("#fDate").textContent = `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}`;
  $("#fMsg").textContent = msgs[seed % msgs.length];
  $("#fLucky").innerHTML = `<span>행운의 색 · ${colors[seed % 5]}</span><span>행운의 아이템 · ${items[(seed + 2) % 5]}</span>`;
  $("#fPrompt").addEventListener("click", () => openSheet(PROMPTS[seed % PROMPTS.length]));
})();

/* ================= 5) 리퀴드 글래스 탭바 ================= */
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
  const stretch = Math.min(Math.abs(sp.v) / 2600, 0.28);    // 빠를수록 가로로 늘어남
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

/* 페이지 전환: 방향에 맞춰 옆으로 미끄러지듯 */
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
    if (current !== name) return;            // 전환 중에 다른 탭을 누른 경우
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

/* 탭바 조작
   - 클릭(탭): 누른 메뉴로 바로 이동
   - 끌기: 알약이 손가락을 따라오고, 놓으면 가장 가까운 메뉴에 착 붙음 */
let drag = null;
const tabIndexAt = (clientX) => tabs.findIndex((t) => { const r = t.getBoundingClientRect(); return clientX >= r.left && clientX <= r.right; });
const nearestTab = (x) => tabs.reduce((best, t, i) => (Math.abs(t.offsetLeft - x) < Math.abs(tabs[best].offsetLeft - x) ? i : best), 0);

bar.addEventListener("pointerdown", (e) => {
  if (e.button > 0) return;
  drag = { id: e.pointerId, startX: e.clientX, moved: false, left: bar.getBoundingClientRect().left };
  bar.setPointerCapture(e.pointerId);
  bar.classList.add("pressing");
  sp.scaleT = 1.08; kick();                  // 누르면 렌즈처럼 살짝 부풀어 오름
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
  if (drag.moved) i = nearestTab(sp.target);              // 끌어서 놓은 위치
  else {                                                   // 그냥 클릭한 위치
    i = tabIndexAt(e.clientX);
    if (i < 0) i = ORDER.indexOf(current);
  }
  drag = null;
  if (e.type === "pointercancel") i = ORDER.indexOf(current);
  selectTab(ORDER[i]);
}
bar.addEventListener("pointerup", endDrag);
bar.addEventListener("pointercancel", endDrag);

/* 키보드: Enter/Space(클릭), 좌우 화살표 */
tabs.forEach((t) => t.addEventListener("click", (e) => { if (e.detail === 0) selectTab(t.dataset.tab); }));
bar.addEventListener("keydown", (e) => {
  if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
  const i = Math.max(0, Math.min(ORDER.length - 1, ORDER.indexOf(current) + (e.key === "ArrowRight" ? 1 : -1)));
  selectTab(ORDER[i]); tabs[i].focus();
});

/* 모바일: 본문을 좌우로 스와이프해도 탭 전환 */
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

/* ================= 6) 뒤로 · 앞으로 =================
   탭 이동과 카테고리 변경을 기록해 두고, 상단 화살표와
   브라우저 자체의 뒤로/앞으로 버튼 모두로 오갈 수 있게 합니다. */
const nav = { stack: [], pos: -1, browser: true, waiting: null };
const snapshot = () => ({ tab: current, cat: state.cat });

function saveNav() { try { sessionStorage.setItem("promme-nav", JSON.stringify({ stack: nav.stack, pos: nav.pos })); } catch (e) {} }
function updateArrows() {
  $("#backBtn").disabled = nav.pos <= 0;
  $("#fwdBtn").disabled = nav.pos >= nav.stack.length - 1;
}
function recordNav() {
  const s = snapshot(), last = nav.stack[nav.pos];
  if (last && last.tab === s.tab && last.cat === s.cat) return;
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
    // 브라우저 기록을 함께 움직임. 반응이 없으면(일부 미리보기 환경) 앱 안에서 직접 이동
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
  // 주소창에 #news 같은 해시를 직접 입력한 경우
  const tab = location.hash.slice(1);
  if (ORDER.includes(tab)) { selectTab(tab, { record: false }); recordNav(); }
});
$("#backBtn").addEventListener("click", () => go(-1));
$("#fwdBtn").addEventListener("click", () => go(1));

/* ================= 7) 시작 ================= */
renderHome();
renderArchive();

(function init() {
  // 새로고침해도 같은 탭 · 같은 기록에서 이어지도록
  let restored = null;
  try { restored = JSON.parse(sessionStorage.getItem("promme-nav") || "null"); } catch (e) {}
  const hs = history.state;
  const hashTab = ORDER.includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";

  if (restored && hs && hs.promme && restored.stack[hs.pos]) {
    nav.stack = restored.stack; nav.pos = hs.pos;
  } else {
    nav.stack = [{ tab: hashTab, cat: "all" }]; nav.pos = 0;
    try { history.replaceState({ promme: true, pos: 0 }, "", "#" + hashTab); } catch (e) { nav.browser = false; }
  }

  const s = nav.stack[nav.pos];
  if (s.cat !== "all") setCat(s.cat);
  if (s.tab !== "home") {
    document.querySelectorAll(".page").forEach((p) => (p.hidden = p.dataset.tab !== s.tab));
    current = s.tab;
  }
  selectTab(current, { instant: true, record: false });
  saveNav(); updateArrows();

  if (document.fonts) document.fonts.ready.then(() => placeIndicator(ORDER.indexOf(current), true));
})();
