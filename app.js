/* =========================================================
   경험정리 · app.js  (프로토타입 · 클라이언트 전용 · localStorage)
   섹션: hero달력 · 대시보드 · 경험아카이브 · AI워크숍 · 기업분석 · 자소서빌더
   ※ AI 파트는 데모(키워드/템플릿). transform/match 함수만 LLM 호출로 교체 가능.
   ========================================================= */
(function () {
  "use strict";

  /* ---------- 유틸 ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const uid = () => Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

  const KEYS = { exp: "exp3.experiences", comp: "exp3.companies", seeded: "exp3.seeded" };
  const load = (k, fb) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch { return fb; } };
  const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
  const store = { experiences: load(KEYS.exp, []), companies: load(KEYS.comp, []) };
  const persist = () => { save(KEYS.exp, store.experiences); save(KEYS.comp, store.companies); };

  const COMPETENCIES = ["문제해결", "협업", "데이터분석", "소통", "리더십", "기획"];
  const JOB_LABEL = { tech: "기술/엔지니어링", pm: "기획/사업관리", mkt: "마케팅", design: "디자인", general: "일반" };
  const isOrganized = (e) => !!(e.star && e.star.s && e.star.t && e.star.a && e.star.r);
  const catColor = (c) => `var(--cat-${c}, var(--primary))`;

  /* ---------- 카테고리 아이콘 (인라인 SVG) ---------- */
  const SVG = (inner) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
  const CATEGORY_ICON = {
    "프로젝트": SVG('<path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/>'),
    "인턴": SVG('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'),
    "대외활동": SVG('<circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>'),
    "공모전": SVG('<circle cx="12" cy="8" r="6"/><path d="M8.2 13.9 7 23l5-3 5 3-1.2-9.1"/>'),
    "동아리": SVG('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>'),
    "학생회": SVG('<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>'),
    "아르바이트": SVG('<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>'),
  };
  const iconFor = (c) => CATEGORY_ICON[c] || SVG('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>');

  /* ---------- 카테고리별 STAR 예시 ---------- */
  const STAR_EXAMPLE = {
    "프로젝트": { s: "3인 팀 캡스톤 프로젝트에서 백엔드를 맡음", t: "출시 2주 전 API 응답 지연 해결 필요", a: "쿼리 인덱싱·캐싱 도입, 부하 테스트 진행", r: "응답 속도 40% 개선, 기한 내 출시" },
    "인턴": { s: "마케팅팀 인턴으로 합류", t: "SNS 채널 참여율 개선 필요", a: "콘텐츠 캘린더 도입·주간 리뷰 운영", r: "3개월 만에 참여율 30% 상승" },
    "대외활동": { s: "글로벌 서포터즈로 활동", t: "행사 참여율 저조 문제", a: "타깃별 홍보 채널 재설계", r: "참여 인원 2배 증가" },
    "공모전": { s: "데이터 분석 공모전 참가", t: "교통 혼잡 예측 모델 필요", a: "회귀 모델 구축·변수 튜닝", r: "정확도 85% 달성, 우수상 수상" },
    "동아리": { s: "5인 창업 동아리 팀장", t: "아이디어 실행 속도 저하", a: "역할 분담·주간 스프린트 도입", r: "3개월 내 MVP 완성" },
    "학생회": { s: "학과 학생회 기획부원", t: "신입생 행사 만족도 개선", a: "설문 기반 프로그램 재설계", r: "만족도 4.2→4.7 상승" },
    "아르바이트": { s: "카페 매니저 보조 근무", t: "피크타임 대기 시간 과다", a: "주문 동선·업무 순서 표준화", r: "평균 대기 시간 25% 단축" },
  };
  const exampleFor = (c) => STAR_EXAMPLE[c] || { s: "어떤 상황이었는지", t: "무엇을 해내야 했는지", a: "구체적으로 어떻게 행동했는지", r: "정량적 결과(예: __% 개선)" };

  /* ========================================================= 시드 ========================================================= */
  function seedIfEmpty() {
    if (localStorage.getItem(KEYS.seeded)) return;
    store.experiences = [
      { id: uid(), title: "OO기업 하계 인턴", category: "인턴", period: "2025.07–08", summary: "마케팅팀 SNS 채널 운영 개선", tags: ["협업", "기획", "데이터분석"],
        star: { s: "마케팅팀 인턴으로 합류", t: "SNS 채널 참여율 개선 필요", a: "콘텐츠 캘린더 도입, 주간 리뷰 운영", r: "3개월 만에 참여율 30% 상승" } },
      { id: uid(), title: "데이터 분석 공모전 우수상", category: "공모전", period: "2024.11", summary: "공공데이터로 교통 혼잡 예측", tags: ["데이터분석", "문제해결"],
        star: { s: "공공데이터 활용 공모전 참가", t: "출근길 교통 혼잡 예측 모델 필요", a: "회귀 모델 구축 및 변수 튜닝", r: "예측 정확도 85% 달성, 우수상 수상" } },
      { id: uid(), title: "종합설계 캡스톤 프로젝트", category: "프로젝트", period: "2025.03–06", summary: "IoT 팀 프로젝트, 데이터 파이프라인 담당", tags: ["문제해결", "협업"], star: { s: "", t: "", a: "", r: "" } },
      { id: uid(), title: "교내 창업 동아리 팀장", category: "동아리", period: "2024", summary: "5인 팀 리딩 및 아이디어 기획", tags: ["리더십", "기획"], star: { s: "", t: "", a: "", r: "" } },
    ];
    store.companies = [
      { id: uid(), name: "OO전자", job: "pm", deadline: "2026-07-10", limit: "1000",
        research: { mission: "기술로 더 나은 일상을", values: "도전, 소통, 전문성", bm: "프리미엄 가전·반도체로 B2C·B2B 매출 창출", market: "국내 1위·글로벌 3위 / 경쟁사 대비 R&D 강점", finance: "흑자 지속, 최근 AI가전·반도체 R&D에 집중 투자", jd: "제품 기획: 시장조사·로드맵 수립·유관부서 협업", kpi: "출시 일정 준수율, 시장 점유율, 신제품 매출 기여", skills: "데이터 분석, 시장조사, 정보처리기사", news: "AI 가전 신규 라인업 발표, 유럽 시장 MOU 체결", trend: "ESG 경영·온디바이스 AI 확대" },
        questions: [
          { id: uid(), text: "공동의 목표를 달성하기 위해 노력했던 경험을 기술하시오.", answer: "", limit: "1000" },
          { id: uid(), text: "지원 동기와 입사 후 포부를 서술하시오.", answer: "", limit: "800" },
        ] },
      { id: uid(), name: "△△은행", job: "general", deadline: "2026-07-05", limit: "500",
        research: { mission: "", values: "신뢰, 전문성", bm: "", market: "", finance: "", jd: "", kpi: "고객 만족도, 상품 판매 실적", skills: "", news: "", trend: "디지털 전환 추진" },
        questions: [ { id: uid(), text: "본인의 직무 역량과 강점을 서술하시오.", answer: "", limit: "500" } ] },
    ];
    persist();
    localStorage.setItem(KEYS.seeded, "1");
  }

  /* ========================================================= 공용: D-Day ========================================================= */
  function ddayInfo(deadline) {
    if (!deadline) return null;
    const d = new Date(deadline + "T00:00:00");
    if (isNaN(d.getTime())) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / 86400000);
    return { diff, label: diff === 0 ? "D-DAY" : diff > 0 ? "D-" + diff : "D+" + Math.abs(diff), cls: diff < 0 ? "over" : diff <= 3 ? "soon" : "" };
  }

  /* ========================================================= 히어로 달력 ========================================================= */
  let calRef = null;
  function renderCalendar() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (!calRef) calRef = { y: today.getFullYear(), m: today.getMonth() };
    const { y, m } = calRef;
    const startDow = new Date(y, m, 1).getDay();
    const days = new Date(y, m + 1, 0).getDate();

    const marks = {};
    store.companies.forEach((c) => {
      if (!c.deadline) return;
      const d = new Date(c.deadline + "T00:00:00");
      if (!isNaN(d.getTime()) && d.getFullYear() === y && d.getMonth() === m) (marks[d.getDate()] = marks[d.getDate()] || []).push(c);
    });

    $("#cal-title").textContent = `${y}년 ${m + 1}월`;
    let cells = ["일", "월", "화", "수", "목", "금", "토"].map((w) => `<span class="cal-dow">${w}</span>`).join("");
    for (let i = 0; i < startDow; i++) cells += `<span class="cal-cell empty"></span>`;
    for (let d = 1; d <= days; d++) {
      const isToday = new Date(y, m, d).getTime() === today.getTime();
      const has = marks[d];
      cells += `<span class="cal-cell${isToday ? " today" : ""}${has ? " has" : ""}"${has ? ` data-day="${d}"` : ""}>${d}${has ? '<i class="cal-dot"></i>' : ""}</span>`;
    }
    $("#cal-grid").innerHTML = cells;

    const upcoming = store.companies.map((c) => ({ c, dd: ddayInfo(c.deadline) })).filter((x) => x.dd).sort((a, b) => a.dd.diff - b.dd.diff);
    const next = upcoming.find((x) => x.dd.diff >= 0) || upcoming[0];
    $("#cal-status").innerHTML = `준비 중인 지원 <b>${store.companies.length}</b>곳` + (next ? ` · 가장 가까운 마감 <b>${esc(next.c.name)} ${next.dd.label}</b>` : " · 등록된 마감 없음");

    $$("#cal-grid [data-day]").forEach((el) => el.addEventListener("click", () => {
      const c = marks[el.dataset.day][0];
      setActiveCompany(c.id);
      $("#application-canvas").scrollIntoView({ behavior: "smooth" });
    }));
  }
  $("#cal-prev").addEventListener("click", () => { if (--calRef.m < 0) { calRef.m = 11; calRef.y--; } renderCalendar(); });
  $("#cal-next").addEventListener("click", () => { if (++calRef.m > 11) { calRef.m = 0; calRef.y++; } renderCalendar(); });

  /* ========================================================= 대시보드 ========================================================= */
  function competencyCounts() {
    const c = Object.fromEntries(COMPETENCIES.map((k) => [k, 0]));
    store.experiences.forEach((e) => (e.tags || []).forEach((t) => { if (t in c) c[t]++; }));
    return c;
  }
  function renderSpider() {
    const counts = competencyCounts();
    const max = Math.max(1, ...Object.values(counts));
    const n = COMPETENCIES.length, cx = 130, cy = 130, R = 82;
    const ang = (i) => (-90 + i * (360 / n)) * Math.PI / 180;
    const pt = (i, r) => [cx + Math.cos(ang(i)) * R * r, cy + Math.sin(ang(i)) * R * r];
    let grid = "";
    [0.25, 0.5, 0.75, 1].forEach((r) => { grid += `<polygon points="${COMPETENCIES.map((_, i) => pt(i, r).map((v) => v.toFixed(1)).join(",")).join(" ")}" class="spider-grid"/>`; });
    let axes = ""; COMPETENCIES.forEach((_, i) => { const [x, y] = pt(i, 1); axes += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="spider-axis"/>`; });
    const data = COMPETENCIES.map((c, i) => pt(i, Math.max(0.06, counts[c] / max)).map((v) => v.toFixed(1)).join(",")).join(" ");
    let labels = ""; COMPETENCIES.forEach((c, i) => { const [x, y] = pt(i, 1.24); labels += `<text x="${x.toFixed(1)}" y="${(y + 4).toFixed(1)}" class="spider-label" text-anchor="middle">${c}</text>`; });
    $("#spider-chart").innerHTML = `<svg viewBox="0 0 260 260" class="spider">${grid}${axes}<polygon points="${data}" class="spider-data"/>${labels}</svg>`;
    $("#competency-bars").innerHTML = COMPETENCIES.map((c) => {
      const v = counts[c], w = Math.round((v / max) * 100);
      return `<div class="comp-bar-row"><span class="cb-name">${c}</span><span class="comp-bar-track"><span class="comp-bar-fill" style="width:${w}%"></span></span><span class="cb-val">${v}</span></div>`;
    }).join("");
  }
  function renderNudges() {
    const box = $("#nudge-list");
    const todo = store.experiences.filter((e) => !isOrganized(e));
    if (!todo.length) { box.innerHTML = `<div class="nudge"><span class="n-dot"></span><div class="n-body">모든 경험을 STAR로 정리했어요. 정말 잘하고 있어요!</div></div>`; return; }
    box.innerHTML = todo.slice(0, 3).map((e) =>
      `<div class="nudge"><span class="n-dot"></span><div class="n-body"><b>${esc(e.title)}</b> 경험을 아직 STAR로 정리하지 않았어요. 잊기 전에 박제해 볼까요?<div class="n-act"><button class="btn btn-sm btn-point" data-nudge="${e.id}">STAR로 정리하기</button></div></div></div>`).join("");
    $$("[data-nudge]", box).forEach((b) => b.addEventListener("click", () => { selectExperience(b.dataset.nudge); $("#experience-archive").scrollIntoView({ behavior: "smooth" }); }));
  }
  function renderDday() {
    const box = $("#dday-list");
    const items = store.companies.flatMap((c) => { const dd = ddayInfo(c.deadline); return dd ? [{ c, dd }] : []; }).sort((a, b) => a.dd.diff - b.dd.diff);
    if (!items.length) { box.innerHTML = `<div class="empty-note">마감일이 있는 자소서가 없어요. 기업분석에서 기업과 마감일을 추가해 보세요.</div>`; return; }
    box.innerHTML = items.map(({ c, dd }) =>
      `<div class="dday" data-co="${c.id}"><span class="dd-badge ${dd.cls}">${dd.label}</span><div class="dd-info"><div class="dd-company">${esc(c.name)}</div><div class="dd-q">문항 ${c.questions.length}개 · ${JOB_LABEL[c.job] || ""}</div></div></div>`).join("");
    $$("[data-co]", box).forEach((el) => el.addEventListener("click", () => { setActiveCompany(el.dataset.co); $("#application-canvas").scrollIntoView({ behavior: "smooth" }); }));
  }
  function renderDashboard() { renderSpider(); renderNudges(); renderDday(); }

  /* ========================================================= 경험 아카이브 ========================================================= */
  let selectedTags = [], activeFilter = null, selectedExpId = null, archiveView = "list";

  function renderTagPicker() {
    const box = $("#exp-tag-picker");
    box.innerHTML = COMPETENCIES.map((t) => `<button type="button" class="tag-chip ${selectedTags.includes(t) ? "is-on" : ""}" data-tag="${t}">${t}</button>`).join("");
    $$("[data-tag]", box).forEach((b) => b.addEventListener("click", () => {
      const t = b.dataset.tag;
      if (selectedTags.includes(t)) selectedTags = selectedTags.filter((x) => x !== t);
      else if (selectedTags.length < 3) selectedTags.push(t);
      renderTagPicker();
    }));
  }
  function renderTagFilter() {
    const box = $("#tag-filter");
    const used = new Set(); store.experiences.forEach((e) => (e.tags || []).forEach((t) => used.add(t)));
    const tags = COMPETENCIES.filter((t) => used.has(t));
    box.innerHTML = `<button class="tag-chip ${activeFilter === null ? "is-on" : ""}" data-f="__all">전체</button>` + tags.map((t) => `<button class="tag-chip ${activeFilter === t ? "is-on" : ""}" data-f="${t}">${t}</button>`).join("");
    $$("[data-f]", box).forEach((b) => b.addEventListener("click", () => { activeFilter = b.dataset.f === "__all" ? null : b.dataset.f; renderTimeline(); }));
  }
  function tlCardHTML(e, opts = {}) {
    const done = isOrganized(e), color = catColor(e.category);
    const tags = (e.tags || []).map((t) => `<span class="mini-tag">${esc(t)}</span>`).join("");
    const cls = ["tl-card", opts.recommend ? "rec" : "", opts.selectable && e.id === selectedExpId ? "is-selected" : ""].filter(Boolean).join(" ");
    return `<div class="${cls}"${opts.draggable ? ' draggable="true"' : ""} data-exp="${e.id}" style="border-left-color:${color}">
      <span class="rec-badge">추천</span>
      <div class="tl-body">
        <span class="tl-ico" style="background:${color}">${iconFor(e.category)}</span>
        <div class="tl-main">
          <div class="tl-top"><span class="tl-cat" style="background:${color}">${esc(e.category || "")}</span><span class="tl-state ${done ? "done" : "todo"}">${done ? "STAR 완료" : "정리 필요"}</span></div>
          <div class="tl-title">${esc(e.title)}</div>
          <div class="tl-meta">${esc(e.period || "기간 미입력")}</div>
          ${e.summary ? `<div class="tl-summary">${esc(e.summary)}</div>` : ""}
          ${tags ? `<div class="tl-tags">${tags}</div>` : ""}
        </div>
      </div></div>`;
  }
  const yearOf = (p) => { const m = String(p || "").match(/\d{4}/); return m ? +m[0] : 0; };
  function renderTimeline() {
    renderTagFilter();
    const feed = $("#timeline-feed");
    let list = store.experiences.slice();
    if (activeFilter) list = list.filter((e) => (e.tags || []).includes(activeFilter));
    if (!list.length) { feed.innerHTML = `<div class="empty-note">${activeFilter ? "해당 태그의 경험이 없어요." : "아직 경험이 없어요. 위에서 첫 경험을 추가해 보세요."}</div>`; return; }

    if (archiveView === "period") {
      list.sort((a, b) => yearOf(b.period) - yearOf(a.period));
      let html = "", curYear = null;
      list.forEach((e) => {
        const yr = yearOf(e.period) || "기간 미상";
        if (yr !== curYear) { curYear = yr; html += `<div class="tl-group-head">${yr === "기간 미상" ? yr : yr + "년"}</div>`; }
        html += tlCardHTML(e, { selectable: true });
      });
      feed.innerHTML = html;
    } else {
      feed.innerHTML = list.map((e) => tlCardHTML(e, { selectable: true })).join("");
    }
    $$("[data-exp]", feed).forEach((el) => el.addEventListener("click", () => selectExperience(el.dataset.exp)));
  }
  function selectExperience(id) { selectedExpId = id; renderTimeline(); renderStarBuilder(); }

  function renderStarBuilder() {
    const box = $("#star-builder");
    const e = store.experiences.find((x) => x.id === selectedExpId);
    if (!e) { box.innerHTML = `<div class="star-empty"><span class="se-icon">✎</span>왼쪽 타임라인에서 경험을 선택하면<br/>여기서 STAR로 정리할 수 있어요.</div>`; return; }
    const st = e.star || (e.star = { s: "", t: "", a: "", r: "" });
    const ex = exampleFor(e.category);
    const showExample = !isOrganized(e);
    const field = (k, badge, label, ph, guide) => `<div class="star-field"><label><span class="star-badge ${k}">${badge}</span>${label}</label><textarea data-star="${k}" rows="2" placeholder="${ph}">${esc(st[k] || "")}</textarea>${guide ? `<div class="star-guide">${guide}</div>` : ""}</div>`;
    box.innerHTML = `
      <div class="sb-title">${esc(e.title)}</div>
      <div class="sb-meta">${esc(e.category || "")} · ${esc(e.period || "기간 미입력")}</div>
      ${showExample ? `<div class="star-example"><span class="se-t">✨ ${esc(e.category || "")} 경험 STAR 예시</span>
        <span class="se-line">S) ${esc(ex.s)} · T) ${esc(ex.t)} · A) ${esc(ex.a)} · R) ${esc(ex.r)}</span>
        <div><button class="btn btn-sm btn-point" id="sb-fill">이 예시로 채우기</button></div></div>` : ""}
      ${field("s", "S", "상황 (Situation)", "어떤 상황이었나요?")}
      ${field("t", "T", "과제 (Task)", "무엇을 해내야 했나요?")}
      ${field("a", "A", "행동 (Action)", "구체적으로 어떻게 행동했나요?")}
      ${field("r", "R", "결과 (Result)", "어떤 결과·배움이 있었나요?", "숫자나 정량적 지표(예: 비용 10% 절감, 기간 2주 단축)를 포함해 보세요.")}
      <div class="sb-foot"><button class="btn btn-danger btn-sm" id="sb-delete">삭제</button><div class="spacer"></div><button class="btn btn-primary" id="sb-save">저장</button></div>`;

    if (showExample) $("#sb-fill").addEventListener("click", () => {
      $$("[data-star]", box).forEach((ta) => { if (!ta.value.trim()) ta.value = ex[ta.dataset.star]; });
    });
    $("#sb-save").addEventListener("click", () => {
      $$("[data-star]", box).forEach((ta) => { e.star[ta.dataset.star] = ta.value.trim(); });
      persist(); renderTimeline(); renderStarBuilder(); renderDashboard(); renderCanvasExpList();
      flash($("#sb-save"), "저장됨 ✓");
    });
    $("#sb-delete").addEventListener("click", () => {
      if (!confirm("이 경험을 삭제할까요?")) return;
      store.experiences = store.experiences.filter((x) => x.id !== e.id); selectedExpId = null; persist();
      renderTimeline(); renderStarBuilder(); renderDashboard(); renderCanvasExpList();
    });
  }

  $("#view-toggle").addEventListener("click", (ev) => {
    const b = ev.target.closest(".vt-btn"); if (!b) return;
    archiveView = b.dataset.view;
    $$(".vt-btn", $("#view-toggle")).forEach((x) => x.classList.toggle("is-active", x === b));
    renderTimeline();
  });
  $("#exp-add-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const title = $("#exp-title").value.trim(); if (!title) return $("#exp-title").focus();
    const e = { id: uid(), title, category: $("#exp-category").value, period: $("#exp-period").value.trim(), summary: $("#exp-summary").value.trim(), tags: selectedTags.slice(), star: { s: "", t: "", a: "", r: "" } };
    store.experiences.unshift(e); persist();
    ev.target.reset(); selectedTags = [];
    renderTagPicker(); renderDashboard(); renderCanvasExpList(); selectExperience(e.id);
    $("#star-builder").scrollIntoView({ behavior: "smooth", block: "nearest" });
  });

  /* ========================================================= AI 워크숍 (그대로 · 데모) ========================================================= */
  function transformSentence(text, job) {
    const base = text.trim().replace(/[.。]\s*$/, "");
    const focus = { tech: "기술적 문제 해결 관점에서", pm: "자원 관리와 성과 관점에서", mkt: "고객·성장 관점에서", design: "사용자 경험 관점에서", general: "직무 역량 관점에서" }[job] || "직무 역량 관점에서";
    return [
      { label: "실무자 톤 (프로세스 강조)", text: `${focus}, ${base ? base + "는 경험을 바탕으로 " : ""}팀 내 주기적인 피드백 프로세스를 구축하여 협업 시너지를 극대화했습니다.` },
      { label: "성과 강조 (정량화 유도)", text: `${base || "해당 활동"}을 주도하며 명확한 목표를 설정하고 실행해, 정량적 성과(예: 지표 __% 개선)를 달성했습니다. ← 실제 수치로 채워 보세요.` },
      { label: "간결 버전", text: `${base || "협업 경험"}을 통해 소통과 실행력을 입증했습니다.` },
    ];
  }
  function renderWorkshop() {
    const text = $("#ws-input").value, out = $("#workshop-output");
    if (!text.trim()) { out.innerHTML = `<div class="empty-note">위에 초안을 입력하고 '문장 변환'을 눌러 보세요.</div>`; return; }
    out.innerHTML = transformSentence(text, $("#ws-job").value).map((v, i) =>
      `<div class="ws-card"><span class="ws-label">${esc(v.label)}</span><div class="ws-text" id="wsv-${i}">${esc(v.text)}</div><button class="btn btn-ghost btn-sm" data-copy="wsv-${i}">복사</button></div>`).join("");
    $$("[data-copy]", out).forEach((b) => b.addEventListener("click", () => { navigator.clipboard && navigator.clipboard.writeText($("#" + b.dataset.copy).textContent); flash(b, "복사됨 ✓"); }));
  }
  $("#ws-run").addEventListener("click", renderWorkshop);

  /* ========================================================= 기업/문항 공용 ========================================================= */
  let activeCompanyId = null, lastAnswerEl = null;
  const activeCompany = () => store.companies.find((c) => c.id === activeCompanyId);

  const KW2COMP = [
    { comp: "협업", kw: ["협업", "공동", "함께", "팀", "협력"] },
    { comp: "문제해결", kw: ["문제", "해결", "개선", "트러블", "위기", "극복", "어려"] },
    { comp: "데이터분석", kw: ["데이터", "분석", "지표", "수치", "통계"] },
    { comp: "소통", kw: ["소통", "설득", "의견", "갈등", "고객"] },
    { comp: "리더십", kw: ["리더", "주도", "이끌", "팀장", "책임"] },
    { comp: "기획", kw: ["기획", "전략", "설계", "아이디어", "계획"] },
  ];
  const questionComps = (q) => KW2COMP.filter((r) => r.kw.some((k) => (q || "").includes(k))).map((r) => r.comp);

  function companyTabsHTML(activeCls) {
    if (!store.companies.length) return `<div class="empty-note">아직 등록한 기업이 없어요. 기업분석에서 기업을 추가해 보세요.</div>`;
    if (!activeCompany()) activeCompanyId = store.companies[0].id;
    return store.companies.map((c) => `<button class="app-tab ${c.id === activeCompanyId ? "is-active" : ""}" data-co="${c.id}">${esc(c.name)}<span class="at-sub">· ${JOB_LABEL[c.job] || ""}</span></button>`).join("");
  }
  function wireCompanyTabs(box) { $$("[data-co]", box).forEach((b) => b.addEventListener("click", () => setActiveCompany(b.dataset.co))); }
  function setActiveCompany(id) { activeCompanyId = id; renderResearch(); renderCanvas(); }

  /* ========================================================= 기업분석 ========================================================= */
  $("#company-add-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const name = $("#co-name").value.trim(); if (!name) return $("#co-name").focus();
    const c = { id: uid(), name, job: $("#co-job").value, deadline: $("#co-deadline").value.trim(), limit: $("#co-limit").value.replace(/[^0-9]/g, ""),
      research: { mission: "", values: "", bm: "", market: "", finance: "", jd: "", kpi: "", skills: "", news: "", trend: "" }, questions: [] };
    store.companies.push(c); persist(); ev.target.reset();
    activeCompanyId = c.id;
    renderResearch(); renderCanvas(); renderCalendar(); renderDday();
  });

  function renderResearch() {
    const tabs = $("#research-tabs"); tabs.innerHTML = companyTabsHTML(); wireCompanyTabs(tabs);
    const body = $("#research-body"); body.className = "research-body";
    const c = activeCompany();
    if (!c) { body.innerHTML = `<div class="empty-note">기업을 추가하면 여기서 DNA·사업/시장/재무·직무 KPI·이슈를 정리할 수 있어요.</div>`; return; }
    const r = c.research;
    const ta = (k, ph) => `<textarea data-rs="${k}" rows="2" placeholder="${ph}">${esc(r[k] || "")}</textarea>`;
    const inp = (k, ph) => `<input type="text" data-rs="${k}" placeholder="${ph}" value="${esc(r[k] || "")}" />`;

    // 인재상 태그 → 경험 매칭
    const ideals = (r.values || "").split(",").map((s) => s.trim()).filter(Boolean);
    const recs = store.experiences.filter((e) => (e.tags || []).some((t) => ideals.some((v) => v.includes(t) || t.includes(v))));
    const matchHTML = ideals.length
      ? `<div class="rs-match">인재상 ${ideals.map((v) => "#" + esc(v)).join(" ")} → ` + (recs.length ? `추천 경험: <b>${recs.map((e) => esc(e.title)).join(", ")}</b>` : "매칭되는 경험이 아직 없어요. 관련 태그의 경험을 쌓아 보세요.") + `</div>`
      : "";

    body.innerHTML = `
      <div class="rs-group">
        <h4><span class="rs-num">1</span>기업의 기본 DNA <span class="hint">자소서 방향타</span></h4>
        <p class="rs-help">지원동기·입사 후 포부·인재상 부합 여부의 기준이 되는 데이터예요.</p>
        <div class="rs-fields">
          <div class="field field-wide"><label>미션 / 비전</label>${ta("mission", "기업이 존재하는 이유와 나아가려는 방향")}</div>
          <div class="field field-wide"><label>핵심 가치 / 인재상 <span class="hint">쉼표로 구분 (예: 도전, 소통)</span></label>${inp("values", "도전, 소통, 전문성")}</div>
        </div>
        ${matchHTML}
      </div>
      <div class="rs-group">
        <h4><span class="rs-num">2</span>사업 · 시장 · 재무 <span class="hint">논리력 강화</span></h4>
        <p class="rs-help">"이 회사 최고예요" 대신 실무자 관점의 논리를 펼치기 위한 요소예요. (DART/AI 3줄 요약으로 확장 예정)</p>
        <div class="rs-fields">
          <div class="field field-wide"><label>핵심 비즈니스 모델(BM)</label>${ta("bm", "무엇으로 누구에게 돈을 버는가 (주력 제품/서비스·주요 고객사)")}</div>
          <div class="field"><label>시장 내 위치 / 경쟁사</label>${ta("market", "업계 순위·경쟁사 대비 강점/약점")}</div>
          <div class="field"><label>재무 상태 / 투자 동향</label>${ta("finance", "흑자/적자·최근 집중 투자 영역(R&D·신사업 등)")}</div>
        </div>
      </div>
      <div class="rs-group">
        <h4><span class="rs-num">3</span>직무 분석 & KPI <span class="hint">직무 역량 어필</span></h4>
        <p class="rs-help">"열심히"가 아니라 "이 지표를 개선하겠습니다"를 쓰기 위한 정보예요. KPI는 쉼표로 구분하면 자소서 빌더에서 단어장으로 떠요.</p>
        <div class="rs-fields">
          <div class="field field-wide"><label>직무 기술서(JD)</label>${ta("jd", "해당 직무의 일상 업무 프로세스")}</div>
          <div class="field"><label>핵심 성과 지표(KPI) <span class="hint">쉼표 구분</span></label>${inp("kpi", "공정 효율성 % 향상, 예산 절감률")}</div>
          <div class="field"><label>필요 역량 / 스킬</label>${ta("skills", "우대 자격증·툴·기술")}</div>
        </div>
      </div>
      <div class="rs-group">
        <h4><span class="rs-num">4</span>이슈 & 트렌드 <span class="hint">관심도 증명</span></h4>
        <p class="rs-help">면접·포부 항목에서 강력한 '시의성 있는 데이터'예요. (기업별 실시간 뉴스 카드로 확장 예정)</p>
        <div class="rs-fields">
          <div class="field field-wide"><label>최근 1개년 주요 뉴스</label>${ta("news", "신사업 런칭·MOU·수상 실적 등")}</div>
          <div class="field field-wide"><label>메가 트렌드와의 결합</label>${ta("trend", "ESG·디지털 트랜스포메이션 적용 사례 등")}</div>
        </div>
      </div>
      <div class="rs-save-row"><button class="btn btn-primary" id="rs-save">기업분석 저장</button></div>`;

    $("#rs-save").addEventListener("click", () => {
      $$("[data-rs]", body).forEach((el) => { c.research[el.dataset.rs] = el.value.trim(); });
      persist(); renderResearch(); renderCanvas();
      flash($("#rs-save"), "저장됨 ✓");
    });
  }

  /* ========================================================= 자소서 빌더 ========================================================= */
  function composeDraft(e) {
    const st = e.star || {};
    if (st.s || st.t || st.a || st.r) return [`[${e.title}]`, st.s && `상황) ${st.s}`, st.t && `과제) ${st.t}`, st.a && `행동) ${st.a}`, st.r && `결과) ${st.r}`].filter(Boolean).join("\n");
    return `[${e.title}] ${e.summary || ""}`.trim();
  }
  function renderCanvasExpList() {
    const box = $("#canvas-exp-list"); if (!box) return;
    const c = activeCompany();
    const recComps = c ? [...new Set(c.questions.flatMap((q) => questionComps(q.text)))] : [];
    if (!store.experiences.length) { box.innerHTML = `<div class="empty-note">경험 아카이브에서 경험을 먼저 추가해 주세요.</div>`; return; }
    const list = store.experiences.slice().sort((a, b) => (b.tags || []).some((t) => recComps.includes(t)) - (a.tags || []).some((t) => recComps.includes(t)));
    box.innerHTML = list.map((e) => tlCardHTML(e, { draggable: true, recommend: (e.tags || []).some((t) => recComps.includes(t)) })).join("");
    $$("[data-exp]", box).forEach((el) => {
      el.addEventListener("dragstart", (ev) => { ev.dataTransfer.setData("text/plain", el.dataset.exp); el.classList.add("dragging"); });
      el.addEventListener("dragend", () => el.classList.remove("dragging"));
    });
  }
  function renderWordbank() {
    const box = $("#kpi-wordbank"); const c = activeCompany();
    const kpis = c ? (c.research.kpi || "").split(",").map((s) => s.trim()).filter(Boolean) : [];
    if (!kpis.length) { box.innerHTML = `<div class="wb-title">KPI 단어장 <span class="hint">기업분석 3번에 KPI를 쉼표로 입력하면 여기에 떠요</span></div>`; return; }
    box.innerHTML = `<div class="wb-title">KPI 단어장 <span class="hint">클릭하면 방금 쓰던 답변 칸에 삽입돼요</span></div><div class="wb-chips">${kpis.map((k) => `<button class="wb-chip" data-kpi="${esc(k)}">${esc(k)}</button>`).join("")}</div>`;
    $$("[data-kpi]", box).forEach((b) => b.addEventListener("click", () => {
      if (!lastAnswerEl) return;
      const v = b.dataset.kpi, s = lastAnswerEl.selectionStart || lastAnswerEl.value.length;
      lastAnswerEl.value = lastAnswerEl.value.slice(0, s) + v + lastAnswerEl.value.slice(s);
      lastAnswerEl.dispatchEvent(new Event("input"));
      lastAnswerEl.focus();
    }));
  }
  function renderCanvasQuestions() {
    const box = $("#canvas-questions"); const c = activeCompany();
    if (!c) { box.innerHTML = `<div class="empty-note">기업을 추가하면 여기서 문항에 답을 작성할 수 있어요.</div>`; return; }
    if (!c.questions.length) { box.innerHTML = `<div class="empty-note">${esc(c.name)}에 등록된 문항이 없어요. 위에서 문항을 추가해 보세요.</div>`; return; }
    box.innerHTML = c.questions.map((q) => {
      const rec = questionComps(q.text);
      const lim = q.limit || c.limit || "";
      return `<div class="cq-card" data-q="${q.id}">
        <div class="cq-head"><div class="cq-q">Q. ${esc(q.text)}</div><button class="link-btn" data-delq="${q.id}">삭제</button></div>
        <div class="cq-rec">${rec.length ? "추천 경험 태그: " + rec.map((r) => "#" + r).join(" ") : "왼쪽 경험을 자유롭게 드래그해 보세요."}</div>
        <textarea class="cq-answer" data-ans="${q.id}" spellcheck="true" placeholder="왼쪽 경험 카드를 여기로 드래그하면 STAR 초안이 채워집니다.">${esc(q.answer || "")}</textarea>
        <div class="cq-bar"><span class="cq-count" data-count="${q.id}"></span>
          <button class="btn btn-ghost btn-sm" data-short="${q.id}">요약</button>
          <button class="btn btn-ghost btn-sm" data-expand="${q.id}">확장</button>
        </div></div>`;
    }).join("");

    c.questions.forEach((q) => {
      const ta = box.querySelector(`[data-ans="${q.id}"]`);
      const countEl = box.querySelector(`[data-count="${q.id}"]`);
      const lim = Number(q.limit || c.limit) || 0;
      const upd = () => { countEl.textContent = `${ta.value.length}자${lim ? " / " + lim + "자" : ""}`; countEl.classList.toggle("over", lim && ta.value.length > lim); };
      upd();
      ta.addEventListener("focus", () => { lastAnswerEl = ta; });
      ta.addEventListener("input", () => { q.answer = ta.value; upd(); });
      ta.addEventListener("blur", () => persist());
      ta.addEventListener("dragover", (ev) => { ev.preventDefault(); ta.classList.add("dropping"); });
      ta.addEventListener("dragleave", () => ta.classList.remove("dropping"));
      ta.addEventListener("drop", (ev) => {
        ev.preventDefault(); ta.classList.remove("dropping");
        const e = store.experiences.find((x) => x.id === ev.dataTransfer.getData("text/plain")); if (!e) return;
        const chunk = composeDraft(e);
        ta.value = ta.value ? ta.value.replace(/\s*$/, "") + "\n\n" + chunk : chunk;
        q.answer = ta.value; upd(); persist(); lastAnswerEl = ta;
      });
      box.querySelector(`[data-short="${q.id}"]`).addEventListener("click", () => {
        const l = lim || Math.max(50, Math.floor(ta.value.length * 0.7));
        let t = ta.value.replace(/\n{2,}/g, "\n").replace(/[ \t]{2,}/g, " ").trim();
        if (t.length > l) t = t.slice(0, l).replace(/\s+\S*$/, "") + " …";
        ta.value = t; q.answer = t; upd(); persist();
      });
      box.querySelector(`[data-expand="${q.id}"]`).addEventListener("click", () => {
        ta.value = ta.value.replace(/\s*$/, "") + " 이 경험에서 얻은 역량을 귀사의 직무에서도 지속적으로 발휘하겠습니다.";
        q.answer = ta.value; upd(); persist();
      });
    });
    $$("[data-delq]", box).forEach((b) => b.addEventListener("click", () => {
      c.questions = c.questions.filter((x) => x.id !== b.dataset.delq); persist(); renderCanvasQuestions(); renderDday();
    }));
  }
  function renderCanvas() {
    const tabs = $("#canvas-tabs"); tabs.innerHTML = companyTabsHTML(); wireCompanyTabs(tabs);
    // 기업분석 탭 활성 표시도 동기화
    const rt = $("#research-tabs"); if (rt) { rt.innerHTML = companyTabsHTML(); wireCompanyTabs(rt); }
    renderWordbank(); renderCanvasExpList(); renderCanvasQuestions();
  }
  $("#question-add-form").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const c = activeCompany();
    if (!c) { alert("먼저 기업분석에서 기업을 추가해 주세요."); return; }
    const text = $("#q-text").value.trim(); if (!text) return $("#q-text").focus();
    c.questions.push({ id: uid(), text, answer: "", limit: $("#q-limit").value.replace(/[^0-9]/g, "") });
    persist(); ev.target.reset(); renderCanvasQuestions(); renderDday();
  });

  /* ---------- 저장 피드백 ---------- */
  function flash(btn, msg) { if (!btn) return; const o = btn.textContent; btn.textContent = msg; btn.disabled = true; setTimeout(() => { btn.textContent = o; btn.disabled = false; }, 1100); }

  /* ========================================================= 초기 렌더 ========================================================= */
  seedIfEmpty();
  renderCalendar();
  renderDashboard();
  renderTagPicker();
  renderTimeline();
  renderStarBuilder();
  renderWorkshop();
  renderResearch();
  renderCanvas();
})();
