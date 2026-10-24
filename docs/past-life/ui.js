import { drawBirth } from './birth.js';
// 화면 (설계 8·12장, 화면 다시 기획 3장): 시작 → 탄생 장면 → 출생 서류 → 해가 흐르는 화면(섬 마을 + 가장자리 HUD) → 갈림길·모닥불 → 마지막 해 → 사망 서류
// 기다리는 일은 모두 Promise. robot(?auto=1)이면 단추를 저절로 누른다
import { t, fmtYear, birthLine, traceText, deathLine, causeName, focusName, birthsThatYear, fmtBig, obituary, peerLine, spanText, lifeEnd, epilogueText, ageWord } from './i18n.js';
import { renderText, memCtx, effectParts, effectText, healthWord, heartWord, ailmentLine, kinLine, lockReason, eraWind, eraCard, commonEnd, holdingsLine, MINUS } from './i18n.js';
import { REGIONS, REGION_NAME, AREAS } from './places.js';
import { ERAS, TOTAL, eraOf } from './births.js';
import { householdOf } from './households.js';
import { lifeStats, shapeFor, survivalTo, survivalCurve, yearHazard, healthMul } from './lifetable.js';
import { FOCI, focusStage, charmMul, focusYearEffects } from './focus.js';
import { beadsOf } from './beads.js';
import { drawThread } from './strand.js';
import { createWorldMap, loadLand } from './worldmap.js';
import { birthSpot } from './geo.js';
import { memoryCandidates, latestMemory } from './memory.js';
import { traceLevel, traceKey } from './traces.js';
import { contextOf } from './context.js';
import { holdingsOf } from './holdings.js';
import { openChoices, chanceOf } from './life.js';
import { DECK } from './deck.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const STAT_KEYS = ['health', 'wealth', 'family', 'happy'];
const okImg = (s) => typeof s === 'string' && s.startsWith('data:image/');
// 아이콘은 index.html 맨 위 <symbol> 을 쓴다 (몸·살림·곁·마음 / 일·배움·식구·몸·쉼)
const STAT_ICON = { health: 'i-heart', wealth: 'i-sack', family: 'i-people', happy: 'i-sun' };
// 능력치 넷 (sim2 설계 2.2) · 신분: 수치 판 둘째 칸
const ATTR_KEYS = ['charm', 'luck', 'know', 'skill'];
const ATTR_ICON = { charm: 'i-smile', luck: 'i-clover', know: 'i-book', skill: 'i-hammer' };
const DECK_BY_ID = new Map(DECK.map((c) => [c.id, c]));
const FOCUS_ICON = { work: 'i-hammer', learn: 'i-book', family: 'i-house', body: 'i-leaf', rest: 'i-moon' };
// 기억 구슬 그림 (memory.js 의 icon) → <symbol>. 메아리(ember)는 푸른 구슬 안의 불씨
const ORB_ICON = { cradle: 'i-cradle', rings: 'i-rings', flame: 'i-flame', scroll: 'i-scroll', sign: 'i-sign', ember: 'i-flame' };
// 저장된 기억 구슬 (soul.lives[i].memories) 은 손으로 고친 값일 수 있어 모양을 본다
const okMem = (m) => !!m && typeof m === 'object' && Number.isInteger(m.age) && m.age >= 0 && m.age <= 130;
const icon = (id) => `<svg class="ic" aria-hidden="true" focusable="false"><use href="#${id}"/></svg>`;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
// 넓은 화면 = 데스크톱 배치 (index.html·main.js 와 같은 조건). 좁거나 낮은 화면(가로로 눕힌 폰)은 폰 배치
const WIDE = '(min-width: 901px) and (min-height: 561px)';
const wide = () => typeof matchMedia === 'function' && matchMedia(WIDE).matches;
// 효과 → 구체적인 조각 글 (「은화 +5닢」 · 「마음 −1」, i18n effectParts). 같은 글을 title·aria-label 에도 단다
const fxHtml = (parts) => parts.map(({ key, sign, text }) => `<span class="fx ${sign === '+' ? 'up' : 'down'}" data-k="${key}">${esc(text)}</span>`).join('');
// 효과 더하기 (운에 맡김의 바탕 효과 + 잘된 갈래)
const addEff = (a, b) => { const o = { ...(a || {}) }; for (const [k, v] of Object.entries(b || {})) o[k] = (o[k] || 0) + v; return o; };
// 갈림길 길 하나의 효과 (곁이 오르면 친화력 배율, life.js choose 와 같다)
function pathEffects(life, eff) {
  const o = { ...(eff || {}) };
  if (o.family > 0) o.family *= charmMul(life.attrs && life.attrs.charm);
  return o;
}
// 이 갈림길에서 앞 생의 흔적이 닿는 길: 두려움 → risk, 재능 → skill, 못다 한 꿈 → fulfill (인연 카드는 카드 전체에 닿는다)
function traceIdx(card, tr) {
  const key = tr && { fear: 'risk', talent: 'skill', dream: 'fulfill' }[tr.kind];
  return key ? card.choices.map((c, i) => (c[key] === tr.key ? i : -1)).filter((i) => i >= 0) : [];
}

export function createUI({ lang, robot = false, fast = false }) {
  let L = lang, autoOn = false, h = {}, shown = 0, memShown = 0, cur = null;
  const app = $('app'), screen = $('screen'), modal = $('modal'), intro = $('intro'), toast = $('toast');
  const show = (el, html) => { el.innerHTML = html; el.hidden = false; el.scrollTop = 0; };   // 앞 화면의 스크롤 자리를 물려받지 않게
  const badge = (tr) => `<span class="badge">${esc(traceText(tr, L))}</span>`;
  const field = (k, v) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`;
  // root 안 [data-v] 단추를 누를 때까지. auto 가 있으면 그 단추를 곧 누른다 ('first' = 첫 단추)
  function pick(root, auto = robot ? 'first' : null) {
    return new Promise((res) => {
      const cleanup = () => { root.removeEventListener('click', on); window.removeEventListener('keydown', onKey); };
      const on = (e) => { const b = e.target.closest('[data-v]'); if (!b || !root.contains(b)) return; cleanup(); res(b.dataset.v); };
      const onKey = (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.target.matches('textarea, input')) {
          const prim = root.querySelector('button.primary[data-v]');
          if (prim) { e.preventDefault(); prim.click(); }
        }
      };
      root.addEventListener('click', on);
      window.addEventListener('keydown', onKey);
      if (auto != null) setTimeout(() => { const b = auto === 'first' ? root.querySelector('[data-v]') : root.querySelector(`[data-v="${auto}"]`); if (b) b.click(); }, fast ? 20 : 350);
    });
  }
  // 잠깐 뜨는 알림 (cls 'echo' = 푸른 흔적 알림)
  function say(msg, { ms = 2200, cls = '' } = {}) {
    toast.textContent = msg; toast.className = cls; toast.hidden = false;
    clearTimeout(say.t); say.t = setTimeout(() => (toast.hidden = true), ms);
  }
  function labels() { for (const el of document.querySelectorAll('[data-t]')) el.textContent = t(L, el.dataset.t); hudLabels(); }
  // 효과 조각 (그 생의 그해 맥락 · 집안 돈 단위)과 그 글 (마우스 툴팁·읽어 주기용): 「은화 +5닢 · 마음 −1」
  const partsOf = (life, eff) => effectParts(eff, life.ctx(), L, life.birth.household);
  const fxLine = (life, eff) => effectText(eff, life.ctx(), L, life.birth.household);
  // 갈림길 길의 힌트: 운에 맡기면 「운에 맡김 62% · 잘되면 … · 안되면 …」
  const pctOf = (life, c) => Math.round(chanceOf(life, c) * 100);
  function pathHint(life, c) {
    if (!c.chance) return fxLine(life, pathEffects(life, c.effects));
    const win = fxLine(life, pathEffects(life, addEff(c.effects, c.chance.win.effects))), lose = fxLine(life, pathEffects(life, addEff(c.effects, c.chance.lose.effects)));
    return [t(L, 'chanceX', pctOf(life, c)), win && `${t(L, 'ifWin')} ${win}`, lose && `${t(L, 'ifLose')} ${lose}`].filter(Boolean).join(' · ');
  }
  // 카드·줄·기억 글: {place}·{crop} 같은 자리를 채운다 (i18n renderText). 갈림길은 그해 맥락, 인생 기록 줄은 그 줄이 적힌 해의 맥락
  const R = (text, life, ctx = life.ctx()) => renderText(text, ctx, life.birth, L);
  const ctxAt = (life, year) => contextOf(Number.isFinite(year) ? year : life.year, life.birth.area, life.birth.household);

  // ── HUD 단추 (index.html 에 있다. 한 번만 묶는다) ──
  const dial = document.querySelector('.sundial'), cv = $('strand'), tip = $('beadTip');
  let moreOpen = false, lastState = null, focusKey = null, playKey = null, trKey = null, windKey = null, windOpen = false, statusKey = null;
  const prevVals = {};   // 수치 판 숫자 (빛나기·± 떠오르기): 's:health' · 'a:luck' …
  function setMore(open) {
    moreOpen = open;
    $('bMore').setAttribute('aria-expanded', String(open)); $('moreMenu').hidden = !open; dial.classList.toggle('open', open);
  }
  function setScroll(open) {
    $('scroll').classList.toggle('open', open);
    $('bScroll').setAttribute('aria-expanded', String(open));
    $('bScroll').querySelector('.st').textContent = t(L, open ? 'scrollClose' : 'scrollOpen');
  }
  $('bPlay').addEventListener('click', () => h.play && h.play());
  $('speeds').addEventListener('click', (e) => { const b = e.target.closest('[data-speed]'); if (b && h.speed) h.speed(b.dataset.speed); });
  $('bSkip').addEventListener('click', () => h.skip && h.skip());
  $('bAuto').addEventListener('click', () => { autoOn = !autoOn; if (h.auto) h.auto(autoOn); });
  $('bMore').addEventListener('click', () => setMore(!moreOpen));
  $('bSettings').addEventListener('click', () => { setMore(false); if (h.settings) h.settings(); });
  $('bSound').addEventListener('click', () => h.sound && h.sound());
  $('bLang').addEventListener('click', () => h.lang && h.lang());
  $('bExit').addEventListener('click', () => { setMore(false); if (h.exit) h.exit(); });
  $('bScroll').addEventListener('click', () => setScroll(!$('scroll').classList.contains('open')));
  if (typeof matchMedia === 'function') {   // 데스크톱 ↔ 폰 배치가 바뀌면 두루마리도 그 배치의 처음 모습으로 (폰에서 60svh 시트가 남지 않게)
    const mq = matchMedia(WIDE), sync = () => setScroll(mq.matches);
    if (mq.addEventListener) mq.addEventListener('change', sync); else mq.addListener(sync);
  }
  $('focusBox').addEventListener('click', (e) => { const b = e.target.closest('[data-focus]'); if (b && h.focus) h.focus(b.dataset.focus === 'auto' ? null : b.dataset.focus); });
  $('traceBeads').addEventListener('click', (e) => { const b = e.target.closest('[data-tr]'); if (b) say(b.dataset.tr); });
  document.addEventListener('click', (e) => { if (moreOpen && !dial.contains(e.target)) setMore(false); });
  // 시대의 바람 띠: 누르면 그해 맥락 카드 (올해의 일 · 전쟁 · 질병·의술 · 기술 · 경제 · 신분제 · 배움). 밖을 누르거나 Esc·닫기면 접는다
  const windBtn = $('eraWind'), windCard = $('windCard');
  function paintWindCard() {
    if (!cur) return;
    const life = cur.life, rows = eraCard(life.ctx(), L, { status: life.status });
    windCard.innerHTML = `<h3 id="windT">${esc(windBtn.querySelector('.wh').textContent)}</h3>
      <dl>${rows.map((r) => `<div data-k="${r.key}"><dt>${esc(r.label)}</dt><dd>${esc(r.text)}</dd></div>`).join('')}</dl>
      <button class="wclose" data-close>${esc(t(L, 'windClose'))}</button>`;
  }
  function setWind(open) {
    windOpen = !!open && !!cur;
    windBtn.setAttribute('aria-expanded', String(windOpen)); windCard.hidden = !windOpen;
    if (windOpen) paintWindCard();
  }
  windBtn.addEventListener('click', () => setWind(!windOpen));
  windCard.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) { setWind(false); windBtn.focus(); } });
  document.addEventListener('click', (e) => { if (windOpen && !windCard.contains(e.target) && !windBtn.contains(e.target)) setWind(false); });
  // 스페이스 = 멈춤/계속 (해가 흐르는 화면에서만, 글 칸은 빼고). Esc = ⋯ 메뉴 닫기. 1·2·3 은 갈림길이 따로 받는다
  document.addEventListener('keydown', (e) => {
    if (app.hidden || !modal.hidden || !screen.hidden || !intro.hidden) return;
    if (e.key === 'Escape' && moreOpen) { setMore(false); $('bMore').focus(); return; }
    if (e.key === 'Escape' && windOpen) { setWind(false); windBtn.focus(); return; }
    if (e.key !== ' ' && e.code !== 'Space') return;
    if (e.target.closest && e.target.closest('input, textarea, select, [contenteditable]')) return;
    e.preventDefault();
    if (!e.repeat && h.play) h.play();
  });
  // 말이 바뀌면 다시 쓰는 HUD 글 (data-t 로 못 쓰는 것: 속 표시가 있는 단추·aria)
  function hudLabels() {
    const sp = t(L, 'speedName');
    for (const b of $('speeds').querySelectorAll('[data-speed]')) b.textContent = sp[b.dataset.speed];
    dial.setAttribute('aria-label', t(L, 'sundial'));
    $('bSkip').textContent = t(L, 'skipX');
    $('bAuto').innerHTML = `<span class="sw" aria-hidden="true"></span>${esc(t(L, 'autoX'))}`;
    $('bMore').innerHTML = icon('i-dots'); $('bMore').setAttribute('aria-label', t(L, 'more')); $('bMore').title = t(L, 'more');
    $('bSettings').textContent = t(L, 'settings');
    $('bLang').textContent = t(L, 'lang'); $('bExit').textContent = t(L, 'exit');
    // 수치 판 (sim2 설계 5.1, 시안 s9): 건강·재산·곁·마음 (숫자 · 막대 · 구체적인 한 줄) / 능력치 넷 / 신분
    $('board').setAttribute('aria-label', t(L, 'boardTitle'));
    $('statBoard').innerHTML = STAT_KEYS.map((k) => `<li data-k="${k}">${icon(STAT_ICON[k])}<span class="lbl">${esc(t(L, 'statN')[k])}</span><b class="num"></b>`
      + `<span class="bar" aria-hidden="true"><i></i></span><span class="cl"></span></li>`).join('');
    $('attrRow').setAttribute('aria-label', t(L, 'attrsTitle'));
    $('attrRow').innerHTML = ATTR_KEYS.map((k) => `<span class="at" data-k="${k}">${icon(ATTR_ICON[k])}<span class="al">${esc(t(L, 'attrN')[k])}</span><b class="num"></b>${k === 'know' ? '<small class="lit"></small>' : ''}</span>`).join('');
    $('statusRow').innerHTML = `${icon('i-crown')}<span class="sl">${esc(t(L, 'statusX'))}</span><b class="sv num"></b><span class="sb"></span><span class="sr sbh"></span><span class="ss"></span>`;
    windBtn.title = t(L, 'windHint'); windKey = null; statusKey = null;
    if (windOpen) paintWindCard();
    document.querySelector('.hand').title = t(L, 'handHint');
    setScroll($('scroll').classList.contains('open'));
    playKey = null;
  }

  // 갈림길·모닥불 동안 HUD 는 손·키보드가 닿지 않게 (흐려진 #bPlay 가 스페이스를 받아 뒤에서 멈춤이 바뀌지 않게)
  const HUD_PARTS = ['.hud-who', '.wind', '.sundial', '.scroll', '.hand', '.thread'];
  function hudInert(on) { for (const sel of HUD_PARTS) { const el = app.querySelector(sel); if (el) el.inert = on; } }

  // ── 구슬 실: 그리기 · 새 구슬 꿰기(0.3초) · 누르면 그해 두루마리 줄 · 옆으로 밀기 · 동갑내기 한 줄 ──
  let beadN = -1, memN = -1, offset = 0, geo = null, freshRaf = 0, drag = null;
  // grow: 막 꿴 기억 구슬(마지막 기억)이 1배 → 1.6배로 커지는 정도 (0~1)
  function paintThread(fresh, grow = 1) {
    if (!cur) return;
    const mems = cur.life.memories || [], last = mems.length - 1;
    const mem = mems.map((m, i) => ({ age: m.age, echo: m.kind === 'echo', grow: i === last ? grow : 1 }));
    geo = drawThread(cv, { beads: beadsOf(cur.life), peers: cur.peers, age: cur.life.age, fresh, offset, mem });
    if (offset > geo.maxOffset) offset = geo.maxOffset;
  }
  function strand(animate) {
    if (!cur || app.hidden) return;
    const life = cur.life, end = life.death ? life.death.age : life.age, n = end + 1, mn = (life.memories || []).length;
    const grew = beadN >= 0 && n > beadN, memGrew = memN >= 0 && mn > memN;
    beadN = n; memN = mn;
    cancelAnimationFrame(freshRaf);
    if (animate && (grew || memGrew) && !fast && !reduced()) {   // 새 해 구슬 꿰기 0.3초 · 기억 구슬 커지기 0.6초
      const t0 = performance.now(), T = memGrew ? 600 : 300;
      const step = (now) => {
        const dt = now - t0;
        paintThread(grew ? Math.min(1, dt / 300) : 1, memGrew ? Math.min(1, dt / 600) : 1);
        if (dt < T) freshRaf = requestAnimationFrame(step);
      };
      step(t0);
    } else paintThread(1);
    let best = 0;   // 가장 빛난 해 = 가장 행복했던 나이
    for (let a = 1; a <= end && a < life.history.length; a++) if (life.history[a].happy > life.history[best].happy) best = a;
    const peerText = cur.peers.map((p) => peerLine(p, life.age, L)).join(' / ');   // 실을 누를 수 없는 키보드·읽어 주기에도 동갑내기 넷을
    cv.setAttribute('aria-label', `${t(L, 'strandTitle')} · ${t(L, 'strandAria', n, best)}${peerText ? ` · ${t(L, 'peersX')}: ${peerText}` : ''}`);
  }
  const hideTip = () => { tip.hidden = true; };
  function hit(x, y, touch) {
    if (!geo) return null;
    let best = null, bd = Infinity;
    for (const b of geo.beads) { const d = Math.hypot(x - b.x, y - b.y); if (d <= b.r * (touch ? 2.2 : 1.5) && d < bd) { bd = d; best = b; } }
    if (best) return { bead: best };
    let pp = null, pd = touch ? 7 : 4;
    for (const p of geo.peers) { const d = Math.abs(y - p.y); if (p.x2 > p.x1 && x >= p.x1 - 4 && x <= p.x2 + 4 && d <= pd) { pd = d; pp = p; } }
    return pp ? { peer: pp } : null;
  }
  function tipAt(e) {
    if (!cur) return;
    const r = cv.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, got = hit(x, y, e.pointerType === 'touch');
    if (!got) { hideTip(); return; }
    const life = cur.life, key = got.bead ? 'b' + got.bead.age : 'p' + got.peer.i;
    let ax, ay;
    if (got.bead) { ax = got.bead.x; ay = got.bead.y - got.bead.r; } else { ax = Math.min(Math.max(x, got.peer.x1), got.peer.x2); ay = got.peer.y; }
    if (tip.hidden || tip.dataset.key !== key) {
      tip.dataset.key = key;
      if (got.bead) {
        const a = got.bead.age, rows = [];
        life.journal.forEach((j, i) => { if (j.age === a) rows.push(`<p>${jMark(life, j, i)}${esc(jText(life, j))}</p>`); });
        tip.innerHTML = `<b>${esc(cap(t(L, 'age', a)))} · ${esc(fmtYear(life.birth.year + a, L))}</b>${rows.join('')}`;
      } else tip.innerHTML = `<b>${esc(t(L, 'peersX'))}</b><p>${esc(peerLine(cur.peers[got.peer.i], life.age, L))}</p>`;
    }
    tip.hidden = false;
    const W = cv.clientWidth, tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.left = Math.round(Math.max(8, Math.min(W - tw - 8, ax - tw / 2))) + 'px';
    tip.style.top = Math.round(cv.offsetTop + ay - th - 10) + 'px';
  }
  cv.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, off: offset, moved: false, id: e.pointerId };
    try { cv.setPointerCapture(e.pointerId); } catch { /* 이미 놓은 손가락 */ }   // 캔버스 밖에서 놓아도 pointerup 이 여기로 온다
  });
  cv.addEventListener('pointermove', (e) => {
    if (drag && e.pointerType === 'mouse' && e.buttons === 0) drag = null;   // 잡기를 놓친 마우스: 단추가 떨어졌으면 끌기 끝
    if (drag) {   // 옆으로 끌면 앞의 해로 민다 (drawThread 의 maxOffset 안)
      const dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 6) { drag.moved = true; hideTip(); }
      if (drag.moved) { offset = Math.max(0, Math.min(geo ? geo.maxOffset : 0, drag.off + dx)); cancelAnimationFrame(freshRaf); paintThread(1); }
      return;
    }
    if (e.pointerType === 'mouse') tipAt(e);
  });
  const release = (e) => { const d = drag; drag = null; if (d && !d.moved && e.type === 'pointerup') tipAt(e); };
  cv.addEventListener('pointerup', release); cv.addEventListener('pointercancel', release);
  cv.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !drag) hideTip(); });
  document.addEventListener('pointerdown', (e) => { if (e.target !== cv) hideTip(); }, true);
  new ResizeObserver(() => { hideTip(); strand(false); }).observe(cv);

  async function title({ soul, dexCount, onLang, onSound, soundOn, onSettings }) {
    app.hidden = true; modal.hidden = true; screen.className = 'night';
    let sure = false;
    for (;;) {
      const has = soul && soul.lives.length > 0, going = has && !soul.ended;
      show(screen, `<div class="sheet">
        <p class="eyebrow">${esc(t(L, 'oneIn'))}</p><h1>${esc(t(L, 'title'))}</h1>
        <p class="lead">${t(L, 'lead').map((x) => `<span>${esc(x)}</span>`).join('')}</p>
        <div class="btns">
          <button class="primary" data-v="start">${esc(going ? t(L, 'next', soul.lives.length + 1) : t(L, 'born'))}</button>
          ${has ? `<button data-v="lineage">${esc(t(L, 'lineage'))}</button>` : ''}
          <button data-v="dex">${esc(t(L, 'dex', dexCount))}</button>
          ${has ? `<button class="quiet" data-v="${sure ? 'newsoul' : 'ask'}">${esc(sure ? t(L, 'newSoulSure') : t(L, 'newSoul'))}</button>` : ''}
        </div>
        <div class="btns row"><button class="quiet" data-v="lang">${esc(t(L, 'lang'))}</button><button class="quiet" data-v="sound">${esc(soundOn() ? t(L, 'soundOn') : t(L, 'soundOff'))}</button>${onSettings ? `<button class="quiet" data-v="settings">${esc(t(L, 'settings'))}</button>` : ''}</div>
        <p class="credit">${esc(t(L, 'credit'))}</p></div>`);
      const v = await pick(screen);
      if (v === 'lang') { L = L === 'ko' ? 'en' : 'ko'; onLang(L); continue; }
      if (v === 'sound') { onSound(); continue; }
      if (v === 'settings') { await onSettings(); continue; }
      if (v === 'ask') { sure = true; continue; }
      screen.hidden = true;
      return v;
    }
  }

  // 탄생 장면: 영혼 2만 개 가운데 하나가 금실을 끌며 떨어진다
  // ── 옛 지도책 세계지도 (설계 2장): 탄생 지도 · 다음 생 금실 · 지도에서 무대로 확대 · 영혼의 염주 ──
  // 땅 자료(assets/geo/land.json)는 한 번만 받는다. 못 받으면 null → 탄생은 예전 별 하늘, 염주는 목록만
  let landP = null, introMap = null, introSpot = null;
  const getLand = () => (landP = landP || loadLand().catch((e) => { console.warn('한 영혼의 여정: 지도 땅 자료를 못 받아 별 하늘로 간다', e); return null; }));
  // 빨리 넘기기(?fast)와 움직임 줄이기는 지도 연출을 건너뛴다 (worldmap 이 0초로)
  const mapMotion = () => (fast || reduced() ? true : undefined);
  const spotOf = (b, land) => birthSpot(b.seed, b.area, land);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  async function atlasIntro() {
    const land = await getLand();
    if (!land) return null;
    const cv = $('souls');
    if (!introMap) { try { introMap = createWorldMap(cv, { lang: L, land, reducedMotion: mapMotion() }); } catch (e) { console.warn('한 영혼의 여정: 지도를 그리지 못했다', e); landP = Promise.resolve(null); return null; } }
    else { introMap.setLang(L); introMap.resize(); }
    return { map: introMap, land };
  }
  // 탄생: 그해 금빛 점 → 불씨가 태어난 자리에 내려앉음 (다음 생이면 앞 생 자리에서 금실) → 「이번 생의 자리」 카드. 누르거나 잠시 뒤 넘어간다
  async function birthIntro({ birth, n, gap, traces, prev = null }) {
    app.hidden = true; screen.hidden = true; modal.hidden = true;
    intro.hidden = false; intro.style.opacity = '1'; intro.classList.add('atlas');
    const at = await atlasIntro();
    if (!at) { intro.classList.remove('atlas'); return skyIntro({ birth, n, gap, traces }); }
    const { map, land } = at, spot = spotOf(birth, land);
    introSpot = spot;
    map.clear(); await map.viewTo({ u: 0.5, v: 0.5, k: 1 }, 0);
    map.setYear(birth.year);
    const it = $('introText');
    it.innerHTML = `<div class="eyebrow">${esc(t(L, 'placeTitle'))}${n > 1 ? ' · ' + esc(t(L, 'nth', n)) : ''}</div>
      <div class="big">${esc(birthLine(birth, L))}</div>
      <div class="count">${esc(t(L, 'everBorn'))} ${TOTAL.toLocaleString(L === 'ko' ? 'ko-KR' : 'en-US')}${n > 1 && gap != null ? ' · ' + esc(t(L, 'wander', gap)) : ''}</div>
      ${traces.length ? `<div class="chips" style="justify-content:center">${traces.map(badge).join('')}</div>` : ''}`;
    it.style.opacity = '0';
    let skip = false;
    const onClick = () => { skip = true; };
    intro.addEventListener('click', onClick);
    if (!fast) await wait(robot ? 150 : 700);   // 금빛 점이 먼저 떠오른다
    const from = prev && prev.birth ? spotOf(prev.birth, land) : null;
    if (!skip) await (from ? map.thread(from, spot, { ms: robot ? 900 : 2200 }) : map.birth(spot, { ms: robot ? 900 : 2600 }));
    else map.birth(spot, { ms: 0 });
    it.style.opacity = '1';
    // 카드를 읽을 시간: 누르면 바로, 아니면 잠시 뒤
    await new Promise((res) => {
      if (fast) return res();
      const tm = setTimeout(res, robot ? 400 : 3200);
      intro.addEventListener('click', () => { clearTimeout(tm); res(); }, { once: true });
    });
    intro.removeEventListener('click', onClick);
    intro.style.opacity = '0';
    await wait(fast ? 0 : reduced() ? 120 : 600);
    intro.hidden = true;
  }
  // 출생 기록 뒤: 지도가 태어난 자리로 다가가며 걷히고, 뒤에 지어 둔 무대가 드러난다 (지도가 없었으면 그냥 지나간다)
  async function mapZoom() {
    if (!introMap || !introSpot || !intro.classList.contains('atlas')) return;
    const it = $('introText');
    it.style.opacity = '0';
    intro.style.transition = 'none'; intro.style.opacity = '1'; intro.hidden = false;
    void intro.offsetWidth; intro.style.transition = '';
    introMap.resize();
    const ms = fast ? 0 : robot ? 700 : 1700;
    const z = introMap.zoomTo(introSpot, { k: 7, ms });
    await wait(ms * 0.55);
    intro.style.opacity = '0';   // 확대가 끝나 갈 무렵부터 무대 쪽으로 걷힌다 (#intro 의 opacity 전환 .8초)
    await z;
    await wait(fast ? 0 : reduced() ? 100 : 700);
    intro.hidden = true; intro.classList.remove('atlas');
  }

  // 지도를 못 쓸 때의 예전 탄생 장면: 영혼 2만 개 가운데 하나가 금실을 끌며 떨어진다
  function skyIntro({ birth, n, gap, traces }) {
    app.hidden = true; screen.hidden = true; modal.hidden = true;
    intro.hidden = false; intro.style.opacity = '1';
    const cv = $('souls'), w = (cv.width = window.innerWidth), hh = (cv.height = window.innerHeight), g = cv.getContext('2d');
    const sky = document.createElement('canvas'); sky.width = w; sky.height = hh;
    const sg = sky.getContext('2d');
    sg.fillStyle = '#121329'; sg.fillRect(0, 0, w, hh);
    for (let i = 0; i < 20000; i++) {   // 비스듬한 띠에 몰리게
      const u = Math.random(), band = (Math.random() + Math.random() + Math.random()) / 3 - 0.5, b = Math.random();
      sg.fillStyle = `rgba(255,${(200 + b * 40) | 0},150,${(0.25 + b * 0.5).toFixed(2)})`;
      sg.fillRect(u * w, hh * 0.42 + band * hh * 0.9 - (u - 0.5) * hh * 0.35, 1.2, 1.2);
    }
    const sx = w * (0.35 + Math.random() * 0.3), sy = hh * 0.1, ex = w / 2, ey = hh * 0.55;
    const it = $('introText');
    it.innerHTML = `<div class="big">${esc(t(L, 'oneIn'))}</div>
      <div class="count">${esc(t(L, 'everBorn'))} ${TOTAL.toLocaleString(L === 'ko' ? 'ko-KR' : 'en-US')}</div>
      ${n > 1 ? `<div>${esc(t(L, 'nth', n))}${gap != null ? ' · ' + esc(t(L, 'wander', gap)) : ''}</div>` : ''}
      <div>${esc(birthLine(birth, L))}</div>
      ${traces.length ? `<div class="chips" style="justify-content:center">${traces.map(badge).join('')}</div>` : ''}`;
    it.style.opacity = '0';
    const T = fast ? 1 : 2600;
    return new Promise((res) => {
      const t0 = performance.now();
      let done = false;
      const finish = () => {
        if (done) return; done = true;
        intro.removeEventListener('click', finish);
        intro.style.opacity = '0';
        setTimeout(() => { intro.hidden = true; res(); }, fast ? 0 : 800);
      };
      const step = (now) => {
        if (done) return;
        const k = Math.min(1, (now - t0) / T), e = 1 - (1 - k) ** 3, x = sx + (ex - sx) * e, y = sy + (ey - sy) * e;
        g.drawImage(sky, 0, 0);
        g.strokeStyle = 'rgba(226,182,94,.9)'; g.lineWidth = 2; g.beginPath(); g.moveTo(sx, sy); g.lineTo(x, y); g.stroke();
        const glow = g.createRadialGradient(x, y, 0, x, y, 18);
        glow.addColorStop(0, 'rgba(255,240,200,1)'); glow.addColorStop(1, 'rgba(255,200,120,0)');
        g.fillStyle = glow; g.fillRect(x - 18, y - 18, 36, 36);
        if (k >= 0.6) it.style.opacity = '1';
        if (k < 1) requestAnimationFrame(step); else setTimeout(finish, fast ? 0 : robot ? 400 : 2600);
      };
      requestAnimationFrame(step);
      intro.addEventListener('click', finish);
    });
  }

  // 운명의 제단: 출생 리롤 & 환생의 불씨 능력치 투자
  function destinySetup({ birth: initialBirth, n, prev, traces, soul }) {
    app.hidden = true; modal.hidden = true; screen.className = '';
    let curBirth = initialBirth;
    let fateHistory = [];
    let rerollsLeft = 3;
    const totalEmbers = 5;
    let investments = { luck: 0, charm: 0, know: 0, skill: 0, health: 0, wealth: 0 };
    const STAT_STEPS = { luck: 10, charm: 10, know: 8, skill: 10, health: 8, wealth: 8 };

    function render() {
      const b = curBirth;
      const sh = shapeFor(b.era, b.region), e0 = Math.round(lifeStats(sh).e0), u5 = Math.round((1 - survivalTo(sh, 5)) * 100);
      const h = householdOf(b.group, b.household);
      const yearStr = fmtYear(b.year, L);
      const eraName = eraOf(b.year)[L];
      const areaName = AREAS[b.area][L];
      const houseName = h[L];
      const roleName = t(L, 'childOf', b.order, b.sex);

      let used = 0;
      for (const k in investments) used += investments[k];
      const left = totalEmbers - used;

      const baseStats = {
        luck: 50,
        charm: 50,
        know: b.household === 'noble' || b.household === 'royal' || b.household === 'scholar' ? 30 : 15,
        skill: 40,
        health: 50,
        wealth: Math.round(b.wealth || 35)
      };

      const pipsHtml = Array.from({ length: totalEmbers }, (_, i) => `<div class="ember-pip ${i < left ? '' : 'empty'}"></div>`).join('');

      show(screen, `<article class="doc" style="max-width:760px"><header class="doc-head"><span>${esc(L === 'ko' ? '운명의 제단' : 'Altar of Destiny')}</span><span class="mono">No. ${esc(b.seed)}</span></header>
        <div class="doc-body" style="padding:22px 24px;display:grid;gap:18px">
          <p class="eyebrow">${esc(n ? t(L, 'nth', n) : t(L, 'practice'))} · ${esc(L === 'ko' ? '새 생으로 들어가기 전, 운명을 다시 굴리거나 불씨를 배분할 수 있습니다' : 'Reroll fate or invest embers before beginning your life')}</p>

          <!-- 점지된 운명 카드 -->
          <div class="card-destiny" style="background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px 20px;display:grid;gap:12px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px">
              <div>
                <h2 style="font:700 22px/1.3 var(--serif);margin:0;color:var(--ink)">${esc(yearStr)} · ${esc(eraName)} ${esc(areaName)}</h2>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
                  <span class="tag" style="background:rgba(226,182,94,.16);color:var(--gold2);border:1px solid rgba(226,182,94,.4);padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600">${esc(houseName)}</span>
                  <span class="tag" style="background:rgba(226,182,94,.16);color:var(--gold2);border:1px solid rgba(226,182,94,.4);padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600">${esc(roleName)}</span>
                  <span class="tag hazard" style="background:rgba(184,60,60,.1);color:#a42c2c;border:1px solid rgba(184,60,60,.3);padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600">${esc(L === 'ko' ? '5세 미만 사망률' : 'Under-5 mortality')} ${u5}%</span>
                  <span class="tag" style="background:rgba(226,182,94,.16);color:var(--gold2);border:1px solid rgba(226,182,94,.4);padding:2px 9px;border-radius:999px;font-size:12px;font-weight:600">${esc(L === 'ko' ? '기대수명' : 'Life expectancy')} ${e0}${esc(t(L, 'age', e0).replace(/^[0-9]+/, ''))}</span>
                </div>
              </div>
            </div>

            <!-- 리롤 컨트롤 -->
            <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(226,182,94,.1);border:1px dashed var(--gold);border-radius:10px;padding:10px 14px;flex-wrap:wrap;gap:10px">
              <div style="font-size:13px;color:var(--ink-soft)">
                ${esc(L === 'ko' ? '운명 다시 굴리기 기회' : 'Rerolls available')}: <b style="color:var(--gold2);font-size:14.5px">${rerollsLeft} / 3</b>
                <span style="display:block;font-size:11.5px;color:#8d7959">${esc(L === 'ko' ? '원하는 시대나 지역이 나올 때까지 다시 뽑을 수 있습니다.' : 'Reroll until you find your desired era or region.')}</span>
              </div>
              <div style="display:flex;gap:6px">
                <button type="button" id="btnUndo" class="quiet" ${fateHistory.length ? '' : 'disabled'} style="padding:6px 12px;font-size:12.5px">${esc(L === 'ko' ? '↩ 이전' : '↩ Undo')}</button>
                <button type="button" id="btnReroll" class="primary" ${rerollsLeft > 0 ? '' : 'disabled'} style="min-height:36px;padding:6px 14px;font:700 13.5px var(--serif);background:linear-gradient(135deg,var(--ink),#2c325e);border:1px solid var(--gold);color:var(--gold)">🎲 ${esc(L === 'ko' ? '운명 다시 굴리기' : 'Reroll Fate')}</button>
              </div>
            </div>
          </div>

          <!-- 환생의 불씨 (스탯 투자) -->
          <div style="background:#fff;border:1px solid var(--line);border-radius:14px;padding:18px 20px;display:grid;gap:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;border-bottom:1px solid var(--line);padding-bottom:12px">
              <div>
                <h3 style="font:700 18px/1.3 var(--serif);margin:0">${esc(L === 'ko' ? '환생의 불씨' : 'Embers of Rebirth')}</h3>
                <span style="font-size:12.5px;color:var(--ink-soft)">${esc(L === 'ko' ? '남은 불씨를 원하는 재능이나 생존력에 나누어 담으세요.' : 'Distribute remaining embers into attributes or survival guards.')}</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <div style="display:flex;gap:4px">${pipsHtml}</div>
                <span style="font:700 15px var(--serif);color:var(--gold2)">${left} pt</span>
              </div>
            </div>

            <!-- 프리셋 -->
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;font-size:12px">
              <span style="font-weight:600;color:var(--ink-soft)">${esc(L === 'ko' ? '추천' : 'Presets')}:</span>
              <button type="button" class="btn-preset" data-p="survive" style="padding:4px 10px;border-radius:6px;border:1px solid var(--line);background:#fff;cursor:pointer">🛡️ ${esc(L === 'ko' ? '생존형' : 'Survival')}</button>
              <button type="button" class="btn-preset" data-p="scholar" style="padding:4px 10px;border-radius:6px;border:1px solid var(--line);background:#fff;cursor:pointer">📜 ${esc(L === 'ko' ? '학자형' : 'Scholar')}</button>
              <button type="button" class="btn-preset" data-p="craft" style="padding:4px 10px;border-radius:6px;border:1px solid var(--line);background:#fff;cursor:pointer">🔨 ${esc(L === 'ko' ? '장인형' : 'Craft')}</button>
              <button type="button" class="btn-preset" data-p="reset" style="padding:4px 10px;border-radius:6px;border:1px solid var(--line);background:#fff;cursor:pointer">↺ ${esc(L === 'ko' ? '초기화' : 'Reset')}</button>
            </div>

            <!-- 스탯 그리드 -->
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:10px">
              ${renderStatRow('luck', L === 'ko' ? '🍀 행운 (Luck)' : '🍀 Luck', L === 'ko' ? '질병·사고 회피율 증가, 갈림길 위험 선택 성공률 보정' : 'Avoid accidents and boost risky choice success', baseStats.luck, investments.luck, STAT_STEPS.luck, left)}
              ${renderStatRow('charm', L === 'ko' ? '🤝 친화력 (Charm)' : '🤝 Charm', L === 'ko' ? '혼인·자녀 확률 증가, 가족·이웃 초점 시 행복 회복 상승' : 'Higher marriage & kids chance, family happiness boost', baseStats.charm, investments.charm, STAT_STEPS.charm, left)}
              ${renderStatRow('know', L === 'ko' ? '📖 지식 (Knowledge)' : '📖 Knowledge', L === 'ko' ? '배움 성장 가속, 60점 도달 시 글 읽기(문해력) 조기 해금' : 'Faster learning, early literacy unlock at 60', baseStats.know, investments.know, STAT_STEPS.know, left)}
              ${renderStatRow('skill', L === 'ko' ? '🛠️ 손재주 (Skill)' : '🛠️ Skill', L === 'ko' ? '노동 품삯 배율 증가, 장인·기술 관련 이벤트 성공률 상승' : 'Higher wage multiplier and craft event success', baseStats.skill, investments.skill, STAT_STEPS.skill, left)}
              ${renderStatRow('health', L === 'ko' ? '❤️ 강인한 숨결 (Health)' : '❤️ Vitality Guard', L === 'ko' ? '유아기(0~4세) 열병·역병 저항력 강화 (영아 사망 극복)' : 'Resist infant fevers (crucial for under-5 survival)', baseStats.health, investments.health, STAT_STEPS.health, left)}
              ${renderStatRow('wealth', L === 'ko' ? '🪙 숨겨둔 복채 (Wealth)' : '🪙 Hidden Wealth', L === 'ko' ? '가난한 집안에서 태어나도 초기 식량과 궁핍을 완화하는 비상금' : 'Extra starting savings even in poor households', baseStats.wealth, investments.wealth, STAT_STEPS.wealth, left)}
            </div>
          </div>

          <!-- 하단 시작 CTA -->
          <div class="btns" style="margin-top:4px">
            <button class="primary" data-v="go" style="min-height:50px;font:700 17px var(--serif);letter-spacing:.04em;background:linear-gradient(135deg,var(--gold),#caa049);color:#121329;border:1.5px solid #fff;border-radius:14px;box-shadow:0 6px 20px var(--gold-glow)">${esc(L === 'ko' ? '이 운명으로 삶 시작하기 ➔' : 'Begin Life with this Destiny ➔')}</button>
            <span class="hint-kbd">${esc(L === 'ko' ? 'Space 또는 Enter 키로 시작할 수 있습니다' : 'Press Space or Enter to begin')}</span>
          </div>
        </div></article>`);

      bindEvents();
    }

    function renderStatRow(k, label, desc, base, inv, step, left) {
      const added = inv * step;
      const total = Math.min(100, base + added);
      return `<div class="stat-row" data-stat="${k}" style="border:1px solid var(--line);border-radius:10px;padding:10px 14px;display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;background:#fff">
        <div style="font-weight:700;font-size:13.5px">${label}</div>
        <div style="display:flex;align-items:center;gap:6px">
          <button type="button" class="stepper-btn minus" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--line);background:var(--bg);font-weight:bold;cursor:pointer" ${inv <= 0 ? 'disabled' : ''}>−</button>
          <div style="min-width:62px;text-align:right;font-family:ui-monospace,monospace;font-size:13px">
            <span style="color:var(--ink-soft)">${base}</span>
            ${inv > 0 ? `<b style="color:#2e7d32;font-size:12px">+${added}</b>` : ''}
          </div>
          <button type="button" class="stepper-btn plus" style="width:26px;height:26px;border-radius:6px;border:1px solid var(--line);background:var(--bg);font-weight:bold;cursor:pointer" ${left <= 0 || total >= 100 ? 'disabled' : ''}>+</button>
        </div>
        <div style="grid-column:1/-1;font-size:11.5px;color:var(--ink-soft);margin-top:-4px">${desc}</div>
        <div style="grid-column:1/-1;height:5px;background:#f0ebe1;border-radius:3px;overflow:hidden;position:relative">
          <div style="height:100%;background:var(--gold2);width:${base}%;border-radius:3px"></div>
          ${inv > 0 ? `<div style="position:absolute;top:0;height:100%;background:#4caf50;left:${base}%;width:${Math.min(100 - base, added)}%;border-radius:0 3px 3px 0"></div>` : ''}
        </div>
      </div>`;
    }

    function bindEvents() {
      const btnReroll = $('btnReroll');
      if (btnReroll) {
        btnReroll.onclick = (e) => {
          e.preventDefault(); e.stopPropagation();
          if (rerollsLeft <= 0) return;
          rerollsLeft--;
          fateHistory.push(curBirth);
          const nextSeed = `${curBirth.seed}-r${3 - rerollsLeft}`;
          curBirth = drawBirth(nextSeed, prev ? prev.death.year : -Infinity) || drawBirth(nextSeed);
          render();
        };
      }
      const btnUndo = $('btnUndo');
      if (btnUndo) {
        btnUndo.onclick = (e) => {
          e.preventDefault(); e.stopPropagation();
          if (!fateHistory.length) return;
          curBirth = fateHistory.pop();
          rerollsLeft++;
          render();
        };
      }
      screen.querySelectorAll('.stat-row').forEach(row => {
        const k = row.dataset.stat;
        const plus = row.querySelector('.stepper-btn.plus');
        const minus = row.querySelector('.stepper-btn.minus');
        if (plus) {
          plus.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            let used = 0; for (const s in investments) used += investments[s];
            if (totalEmbers - used <= 0) return;
            investments[k]++;
            render();
          };
        }
        if (minus) {
          minus.onclick = (e) => {
            e.preventDefault(); e.stopPropagation();
            if (investments[k] <= 0) return;
            investments[k]--;
            render();
          };
        }
      });
      screen.querySelectorAll('.btn-preset').forEach(btn => {
        btn.onclick = (e) => {
          e.preventDefault(); e.stopPropagation();
          const p = btn.dataset.p;
          if (p === 'reset') investments = { luck: 0, charm: 0, know: 0, skill: 0, health: 0, wealth: 0 };
          else if (p === 'survive') investments = { luck: 2, charm: 1, know: 0, skill: 0, health: 2, wealth: 0 };
          else if (p === 'scholar') investments = { luck: 1, charm: 1, know: 3, skill: 0, health: 0, wealth: 0 };
          else if (p === 'craft') investments = { luck: 1, charm: 0, know: 0, skill: 3, health: 0, wealth: 1 };
          render();
        };
      });
    }

    render();

    return pick(screen).then(() => {
      screen.hidden = true;
      return { birth: curBirth, investments: { ...investments } };
    });
  }

  // 출생 기록 (서류)
  function birthRecord({ birth, n, prev, peers, traces }) {
    app.hidden = true; modal.hidden = true; screen.className = '';
    const sh = shapeFor(birth.era, birth.region), e0 = Math.round(lifeStats(sh).e0), u5 = Math.round((1 - survivalTo(sh, 5)) * 100);
    show(screen, `<article class="doc"><header class="doc-head"><span>${esc(t(L, 'birthDoc'))}</span><span class="mono">No. ${esc(birth.seed)}</span></header>
      <div class="doc-body">
        <p class="eyebrow">${esc(n ? t(L, 'nth', n) : t(L, 'practice'))}</p>
        <h2>${esc(birthLine(birth, L))}</h2>
        ${prev ? `<p>${esc(t(L, 'wander', birth.year - prev.death.year))}</p>` : ''}
        ${prev && prev.note ? `<p class="quote">${esc(t(L, 'lastWords'))} · “${esc(prev.note)}”</p>` : ''}
        ${traces.length ? `<div class="chips">${traces.map(badge).join('')}</div>` : ''}
        <dl class="fields">
          ${field(t(L, 'f_era'), eraOf(birth.year)[L])}${field(t(L, 'f_year'), fmtYear(birth.year, L))}
          ${field(t(L, 'f_place'), AREAS[birth.area][L])}${field(t(L, 'f_home'), householdOf(birth.group, birth.household)[L])}
          ${field(t(L, 'f_child'), t(L, 'childOf', birth.order, birth.sex))}${field(t(L, 'f_e0'), t(L, 'age', e0))}
          ${field(t(L, 'f_u5'), u5 + '%')}${field(t(L, 'f_births'), fmtBig(birthsThatYear(birth.year), L))}
        </dl>
        <h3>${esc(t(L, 'peersTitle'))}</h3>
        <ul class="peers">${peers.map((p) => `<li>${esc(peerLine(p, null, L))}</li>`).join('')}</ul>
        <p class="hint">${esc(t(L, 'peersHint'))}</p>
        <div class="btns"><button class="primary" data-v="go">${esc(t(L, 'start'))}</button><span class="hint-kbd">${esc(L === 'ko' ? 'Space 또는 Enter 키로 시작할 수 있습니다' : 'Press Space or Enter to begin')}</span></div>
      </div></article>`);
    screen.scrollTop = 0;
    return pick(screen).then(() => { screen.hidden = true; });
  }

  // 해가 흐르는 화면: 섬 마을 가득 + 가장자리 HUD (배지·상태 넷 / 해시계 / 두루마리 / 올해의 패 / 구슬 실)
  function showApp(life, peers, state) {
    cur = { life, peers }; shown = 0; memShown = 0; focusKey = null; trKey = null; playKey = null; beadN = -1; memN = -1; offset = 0;
    for (const k of Object.keys(prevVals)) delete prevVals[k];
    $('journal').innerHTML = '';
    hideTip(); setMore(false); setWind(false);
    screen.hidden = true; modal.hidden = true; modal.className = ''; app.classList.remove('calm', 'deciding'); hudInert(false); app.hidden = false;
    window.scrollTo(0, 0);   // 좁은 화면은 창이 스크롤된다: 새 생은 마을부터
    labels(); setScroll(wide());   // 두루마리: 데스크톱은 펼치고, 폰은 최근 두 줄만
    update(life, peers, state);
  }
  // 두루마리 줄: 머리 「17살」, 갈림길 줄은 별 구슬, 사건 시작 줄은 금 간 구슬, 모닥불에서 꿴 기억은 큰 금 구슬 (메아리는 푸른 구슬)
  const jText = (life, j) => (j.kind === 'birth' ? birthLine(life.birth, L) : j.kind === 'death' ? deathLine(life.death, L) : R(j.text[L], life, ctxAt(life, j.year)));
  const memMark = (life, j, i) => {
    const k = j.kind === 'echo' ? 'echoBead' : (life.memories || []).some((m) => m.j === i) ? 'memBead' : null;
    return k ? `<i class="mk memo${k === 'echoBead' ? ' echo' : ''}" role="img" title="${esc(t(L, k))}" aria-label="${esc(t(L, k))}"></i>` : '';
  };
  const jMark = (life, j, i) => memMark(life, j, i) + (j.kind === 'decision' ? '<i class="mk star" aria-hidden="true"></i>' : j.kind === 'event' ? '<i class="mk crack" aria-hidden="true"></i>' : '');
  function journalItem(life, j, i) {
    const li = document.createElement('li');
    li.className = 'k-' + j.kind; li.dataset.j = i;
    li.innerHTML = `<span class="ja">${esc(cap(t(L, 'age', j.age)))}</span><span class="jt">${jMark(life, j, i)}${esc(jText(life, j))}</span>`;
    return li;
  }
  function mapHtml(life, e0) {
    const end = life.death ? life.death.age : life.age;
    const n = Math.ceil(Math.max(e0 + 1, end + 1, 10) / 10) * 10;
    let s = `<div class="lmap" role="img" aria-label="${esc(t(L, 'mapTitle'))}">`;
    for (let a = 0; a < n; a++) {
      const rec = life.history[a], lived = !!rec && a <= end;
      s += `<i class="${lived ? 'on' : ''} ${a === e0 ? 'e0' : ''}" style="--o:${lived ? (0.25 + (rec.happy / 100) * 0.75).toFixed(2) : 0}"></i>`;
    }
    return s + '</div>';
  }
  // 수치 판 숫자가 2 넘게 바뀌면: 숫자가 잠깐 빛나고 그 옆에 「+3」·「−2」가 1초 떠올랐다 사라진다 (움직임 줄이기·?fast 면 하지 않는다)
  function bump(el, key, v) {
    const old = prevVals[key];
    prevVals[key] = v;
    if (old == null || Math.abs(v - old) < 2 || reduced() || fast) return;
    const num = el.querySelector('.num');
    if (num) { num.classList.remove('glow'); void num.offsetWidth; num.classList.add('glow'); }
    const prev = el.querySelector('.delta');
    if (prev) prev.remove();
    const em = document.createElement('em');
    em.className = 'delta ' + (v > old ? 'up' : 'down'); em.textContent = (v > old ? '+' : MINUS) + Math.abs(v - old); em.setAttribute('aria-hidden', 'true');
    if (num) { em.style.left = `${num.offsetLeft + num.offsetWidth + 3}px`; em.style.top = `${num.offsetTop}px`; }   // 숫자 바로 오른쪽에서 떠오른다
    el.appendChild(em);
    setTimeout(() => em.remove(), 1100);
  }
  function update(life, peers, state) {
    if (state) lastState = state;
    if (!cur || cur.life !== life) cur = { life, peers };
    const st = lastState, b = life.birth;
    // 배지
    $('lifeN').textContent = st && st.n ? t(L, 'lifeN', st.n) : t(L, 'practiceBadge');
    $('age').textContent = life.age;
    $('when').textContent = `${fmtYear(life.year, L)} · ${AREAS[b.area].short[L]}`;
    const lv = (x) => traceLevel(life.traceBoost, traceKey(x));
    const tk = L + '|' + life.traces.map((x) => `${traceKey(x)}:${lv(x)}`).join(',');
    if (tk !== trKey) {   // 앞 생의 흔적 구슬 (누르면 이름) + 짙음 표시 ●○○ (모닥불에서 푸른 메아리를 꿸 때마다 한 칸, 많아도 ●●●)
      const grew = trKey && trKey.split('|')[0] === L;
      trKey = tk;
      $('traceBeads').innerHTML = life.traces.length ? `<span>${esc(t(L, 'trace'))}</span>${life.traces.map((x) => {
        const n = lv(x), s = `${traceText(x, L)} · ${t(L, 'traceLevel', n)}`;
        return `<span class="tri${n > 1 ? ' deep' : ''}"><button class="tb" data-tr="${esc(s)}" title="${esc(s)}" aria-label="${esc(s)}"></button><span class="tlv" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span></span>`;
      }).join('')}` : '';
      if (grew && !reduced()) { const box = $('traceBeads'); box.classList.remove('pulse'); void box.offsetWidth; box.classList.add('pulse'); }   // 짙어지면 한 번 반짝
    }
    // 수치 판: 건강·재산·곁·마음 = 숫자 · 막대 · 구체적인 한 줄 (상태 낱말·앓은 일 / 그 땅 단위 살림 / 짝·아이·이웃 / 마음 낱말)
    const ctx = life.ctx();
    const lines = {
      health: [healthWord(life.stats.health, L), ailmentLine(life, DECK_BY_ID, L)].filter(Boolean).join(' · '),
      wealth: holdingsLine(holdingsOf(life.stats.wealth, ctx, b.household), L),
      family: kinLine(life, L),
      happy: heartWord(life.stats.happy, L),
    };
    for (const k of STAT_KEYS) {
      const li = $('statBoard').querySelector(`[data-k="${k}"]`), v = Math.round(life.stats[k]);
      li.querySelector('.num').textContent = v;
      li.querySelector('.bar i').style.width = `${Math.max(0, Math.min(100, life.stats[k])).toFixed(1)}%`;
      const cl = li.querySelector('.cl');
      if (cl.textContent !== lines[k]) { cl.textContent = lines[k]; cl.title = lines[k]; }
      bump(li, 's:' + k, v);
    }
    // 능력치 넷 (지식 옆에 글 앎·모름) · 신분 (묶였으면 「· 묶임」)
    for (const k of ATTR_KEYS) {
      const el = $('attrRow').querySelector(`[data-k="${k}"]`), v = Math.round(life.attrs ? life.attrs[k] : 0);
      el.querySelector('.num').textContent = v;
      bump(el, 'a:' + k, v);
    }
    const lit = $('attrRow').querySelector('.lit'), reads = !!life.flags.literate;
    lit.textContent = t(L, reads ? 'literate' : 'illiterate'); lit.classList.toggle('on', reads);
    const ss = life.status;
    if (ss) {
      const row = $('statusRow'), sk = `${ss.id}|${ss[L]}|${ss.bound}`;
      row.querySelector('.sv').textContent = ss[L];
      row.querySelector('.sb').textContent = ss.bound ? `· ${t(L, 'boundX')}` : '';
      row.querySelector('.ss').textContent = ctx.status.system ? ctx.status.system[L] : '';
      row.title = ss.bound ? t(L, 'boundHint') : '';
      row.querySelector('.sbh').textContent = ss.bound ? ` (${t(L, 'boundHint')})` : '';   // 키보드·읽어 주기에도 묶임 뜻을
      if (statusKey && statusKey.split('|')[0] !== ss.id && !reduced() && !fast) { const sv = row.querySelector('.sv'); sv.classList.remove('glow'); void sv.offsetWidth; sv.classList.add('glow'); }
      statusKey = sk;
    }
    // 시대의 바람 띠 (설계 3.3): 올해 죽을 위험은 그 사람의 그해 생명표 × 건강 배율 (life.js 죽음 굴림의 바탕)에 사건 위험률을 더한 배율
    const base = yearHazard(shapeFor(eraOf(life.year).id, b.region), life.age) * healthMul(life.stats.health);
    const wind = eraWind(ctx, L, { year: life.year, area: b.area, base }), wk = `${wind.head}|${wind.sub}`;
    if (wk !== windKey) {
      windKey = wk;
      windBtn.querySelector('.wh').textContent = wind.head; windBtn.querySelector('.ws').textContent = wind.sub;
      windBtn.classList.toggle('calm', wind.calm);
      windBtn.setAttribute('aria-label', `${t(L, 'windTitle')} · ${wind.head} · ${wind.sub} — ${t(L, 'windHint')}`);
      if (windOpen) paintWindCard();
    }
    // 올해의 패: 바뀔 때만 다시 그린다 (해마다 갈아 끼우면 키보드 포커스가 튀고 클릭이 빠진다)
    // 올해의 패: 패마다 한 해에 주는 것을 그 땅 단위로 (「은화 +5닢 · 마음 −1」, 그해 품삯·손재주·친화력·배울 기회 반영). 글이 바뀔 때만 다시 그린다
    const fs = focusStage(life.age), now = life.focus || 'auto', fx = life.age < 6 ? null : FOCI.map((id) => partsOf(life, focusYearEffects(life, id)));
    const fkey = `${life.age < 6}|${fs}|${now}|${L}|${fx ? fx.map((p) => p.map((x) => x.text).join(',')).join('/') : ''}`;
    if (fkey !== focusKey) {
      focusKey = fkey;
      const box = $('focusBox'), had = box.contains(document.activeElement) ? document.activeElement.dataset.focus : null;
      box.innerHTML = life.age < 6 ? `<p class="baby">${esc(t(L, 'handBaby'))}</p>`
        : `<div class="cards">${FOCI.map((id, i) => {
          const name = focusName(id, life.age, L), parts = fx[i], hint = parts.map((p) => p.full).join(' · ');   // 칩은 짧은 글, 툴팁·읽어 주기는 온전한 글
          return `<button class="pcard" data-focus="${id}" aria-pressed="${now === id}" title="${esc(hint)}" aria-label="${esc(hint ? `${name} · ${hint}` : name)}">${icon(FOCUS_ICON[id])}<span class="pn">${esc(name)}</span><span class="fxs" aria-hidden="true">${fxHtml(parts)}</span></button>`;
        }).join('')}</div><button class="hauto" data-focus="auto" aria-pressed="${now === 'auto'}" title="${esc(t(L, 'handHint'))}">${esc(t(L, 'handAuto'))}</button>`;
      if (had) { const el = box.querySelector(`[data-focus="${had}"]`); if (el) el.focus(); }
    }
    // 두루마리: 최근 줄이 위. 모닥불에서 이 생의 일을 꿰면 그 줄에 기억 구슬 표시를 단다
    const ol = $('journal');
    for (; shown < life.journal.length; shown++) ol.prepend(journalItem(life, life.journal[shown], shown));
    const mems = life.memories || [];
    for (; memShown < mems.length; memShown++) {
      const i = mems[memShown].j, old = Number.isInteger(i) ? ol.querySelector(`li[data-j="${i}"]`) : null;
      if (old && life.journal[i]) old.replaceWith(journalItem(life, life.journal[i], i));
    }
    strand(true);
    // 해시계
    if (st) {
      const pk = `${st.paused}|${L}`;
      if (pk !== playKey) { playKey = pk; $('bPlay').innerHTML = `${icon(st.paused ? 'i-play' : 'i-pause')}<span class="lbl">${esc(t(L, st.paused ? 'resume' : 'pause'))}</span>`; }
      for (const btn of $('speeds').querySelectorAll('[data-speed]')) btn.setAttribute('aria-pressed', String(btn.dataset.speed === st.speed));
      $('bAuto').setAttribute('aria-pressed', String(autoOn));
      $('bSkip').setAttribute('aria-pressed', String(!!st.skipping));
      $('bSound').textContent = st.sound ? t(L, 'soundOn') : t(L, 'soundOff');
    }
  }

  // 갈림길: 마을이 흐려지고 종이 카드. 맡긴 상태면 카드 테두리에 금빛이 차오른 뒤 autoIndex 길로 간다 (카드를 누르면 멈춘다)
  function decision(card, life, { badge: tr, autoIndex = 0, auto = false }) {
    const b = life.birth, marks = traceIdx(card, tr), trName = tr ? traceText(tr, L) : '', open = openChoices(life, card);
    const bead = tr ? `<i class="trace-bead" title="${esc(trName)}" aria-label="${esc(t(L, 'trace'))} · ${esc(trName)}" role="img"></i>` : '';
    hideTip(); setMore(false); setWind(false);
    app.classList.add('deciding'); hudInert(true);
    modal.className = 'cross';
    show(modal, `<div class="xcard" role="dialog" aria-modal="true" aria-labelledby="dlgT" tabindex="-1">
      <span class="emblem" aria-hidden="true">${icon('i-sign')}</span>
      <p class="xwhen">${esc(cap(ageWord(life.age, L)))} · ${esc(fmtYear(life.year, L))}</p>
      <h3 id="dlgT">${esc(t(L, 'crossTitle', R(card.title[L], life)))}</h3>
      ${tr && !marks.length ? `<p class="xtrace">${bead}${esc(trName)}</p>` : ''}
      <div class="orn" aria-hidden="true"></div>
      <p class="xtext">${esc(R(card.text[L], life))}</p>
      ${card.note ? `<p class="xnote">${esc(R(card.note[L], life))}</p>` : ''}
      <ol class="paths">${card.choices.map((c, i) => {
        const txt = R(c.text[L], life);
        if (!open[i]) {   // 잠긴 길 (choice.when 이 안 맞음): 흐리게, 까닭을 달고, 누를 수 없다 (data-v 가 없어 고르기·1·2·3 이 닿지 않는다)
          const why = lockReason(c.when, life, L);
          return `<li><button class="path locked" aria-disabled="true" data-i="${i}" title="${esc(why)}" aria-label="${esc(`${i + 1}. ${txt} — ${why}`)}"><span class="num">${i + 1}</span><span class="pt">${esc(txt)}</span><span class="pfx" aria-hidden="true"><small class="lock">${icon('i-lock')}${esc(why)}</small></span></button></li>`;
        }
        const hint = pathHint(life, c), eff = pathEffects(life, c.chance ? addEff(c.effects, c.chance.win.effects) : c.effects);
        return `<li><button class="path" data-v="${i}" data-i="${i}" title="${esc(hint)}" aria-label="${esc(`${i + 1}. ${txt}${hint ? ' — ' + hint : ''}${marks.includes(i) ? ' — ' + t(L, 'trace') : ''}`)}">${marks.includes(i) ? bead : ''}<span class="num">${i + 1}</span><span class="pt">${esc(txt)}</span><span class="pfx" aria-hidden="true">${c.chance ? `<small class="luck">${esc(t(L, 'chanceX', pctOf(life, c)))}</small>` : ''}${fxHtml(partsOf(life, eff))}</span></button></li>`;
      }).join('')}</ol>
      <div class="xfoot"><p class="xline" id="autoLine" aria-live="polite"></p><button class="xauto" id="autoBtn">${esc(t(L, 'autoX'))}</button></div>
    </div>`);
    const xc = modal.firstElementChild, WAIT = fast ? 20 : robot ? 300 : 5000;
    let timer = null, raf = 0;
    const stop = () => {
      clearTimeout(timer); timer = null; cancelAnimationFrame(raf);
      xc.classList.remove('waiting'); xc.style.setProperty('--p', '0%');
      for (const p of xc.querySelectorAll('.path.next')) p.classList.remove('next');
      $('autoLine').textContent = '';
    };
    const go = () => {
      const had = document.activeElement === $('autoBtn');
      $('autoBtn').hidden = true;
      if (had) xc.focus({ preventScroll: true });   // 숨긴 단추에 있던 포커스는 카드로 (body 로 빠지지 않게)
      $('autoLine').textContent = t(L, 'crossAuto', R(card.choices[autoIndex].text[L], life));
      const target = xc.querySelector(`[data-v="${autoIndex}"]`);
      if (target) target.classList.add('next');
      xc.classList.add('waiting');
      const t0 = performance.now();
      const step = (now) => { const k = Math.min(1, (now - t0) / WAIT); xc.style.setProperty('--p', (k * 100).toFixed(2) + '%'); if (k < 1 && timer) raf = requestAnimationFrame(step); };
      timer = setTimeout(() => { const btn = modal.querySelector(`[data-v="${autoIndex}"]`); if (btn) btn.click(); }, WAIT);
      raf = requestAnimationFrame(step);
    };
    xc.addEventListener('click', (e) => { if (timer && !e.target.closest('[data-v]')) { stop(); $('autoBtn').hidden = false; } });
    $('autoBtn').addEventListener('click', (e) => { e.stopPropagation(); autoOn = true; if (h.auto) h.auto(true); go(); });
    if (autoOn || auto) go();
    // 1·2·3 = 고르기 (Enter 는 Tab 으로 간 길). 스페이스는 멈춤 열쇠라 갈림길에서는 고르지 않는다: 기다림 중이면 멈추고 (카드를 누른 것과 같다), 아니면 그냥 둔다
    const key = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();   // 포커스된 길 단추가 스페이스로 눌리지 않게 (keydown·keyup 둘 다)
        if (e.type === 'keydown' && timer) { stop(); $('autoBtn').hidden = false; }
        return;
      }
      if (e.type !== 'keydown' || e.ctrlKey || e.altKey || e.metaKey) return;
      const k = +e.key, btn = k >= 1 && k <= card.choices.length ? modal.querySelector(`[data-v="${k - 1}"]`) : null;
      if (btn) btn.click();   // 잠긴 길은 data-v 가 없어 지나간다
    };
    document.addEventListener('keydown', key); document.addEventListener('keyup', key);
    xc.focus({ preventScroll: true });   // 첫 길이 아니라 카드에: Tab 으로 길에 가고, 1·2·3·Enter 로 고른다
    return pick(modal, null).then((v) => {
      stop(); document.removeEventListener('keydown', key); document.removeEventListener('keyup', key);
      modal.hidden = true; modal.className = ''; app.classList.remove('deciding'); hudInert(false);
      return Number(v);
    });
  }

  // 모닥불 (5·15·30·50·70살): 저녁 하늘, 마을에 불이 켜지고 (main 이 켠다) 오른쪽 종이 판에 기억 구슬 셋 (identity 설계 3.5, 시안 29 s8a·s8b)
  // 하나를 고르면 { pick: id }. 고르지 않으면 8초 뒤(영혼에게 맡겼으면 5초, robot 은 바로) 가장 최근 일이 저절로 꿰어진다. 후보가 없으면 { pick: null }
  function pause(life, { prev = null, cands = null, auto = false } = {}) {
    const list = cands || memoryCandidates(life, prev);
    if (!list.length) return Promise.resolve({ pick: null });
    const a = life.age, b = life.birth, target = latestMemory(list), hasEcho = list.some((c) => c.kind === 'echo');
    const txt = (c) => renderText(c.text[L], memCtx(b, c), b, L);
    const meta = (c) => (c.kind === 'echo' ? (c.sub && renderText(c.sub[L], memCtx(b, c), b, L)) || t(L, 'echoBead') : `${fmtYear(c.year, L)} · ${ageWord(c.age, L)}`);
    hideTip(); setMore(false); setWind(false);
    app.classList.add('calm'); hudInert(true);
    modal.className = 'camp';
    if (!wide()) window.scrollTo(0, 0);   // 폰: 위쪽 마을의 모닥불이 보이게
    show(modal, `<div class="ccard" role="dialog" aria-modal="true" aria-labelledby="pT" aria-describedby="pH" tabindex="-1">
      <span class="emblem" aria-hidden="true">${icon('i-flame')}</span>
      <h3 class="ct" id="pT">${esc(t(L, 'campTitle', a))}</h3>
      <ol class="mems">${list.map((c, i) => `<li><button class="cbead${c.kind === 'echo' ? ' echo' : ''}" data-v="${esc(c.id)}" aria-keyshortcuts="${i + 1}" aria-label="${esc(`${i + 1}. ${txt(c)} · ${meta(c)}`)}">`
        + `<span class="orb" aria-hidden="true">${icon(ORB_ICON[c.icon] || 'i-flame')}</span><span class="cbt">${esc(txt(c))}</span><span class="cbm">${esc(meta(c))}</span></button></li>`).join('')}</ol>
      <p class="chint" id="pH">${esc(t(L, 'campHint'))}${hasEcho ? `<span class="eh">${esc(t(L, 'campEchoHint'))}</span>` : ''}</p>
      <p class="cline" id="campLine" aria-live="polite"></p>
    </div>`);
    const cc = modal.firstElementChild, btns = [...cc.querySelectorAll('.cbead')], tb = btns[list.indexOf(target)] || null;
    const WAIT = robot ? (fast ? 20 : 300) : auto ? 5000 : 8000;
    let timer = null, raf = 0;
    const stop = () => {
      clearTimeout(timer); timer = null; cancelAnimationFrame(raf);
      if (tb) tb.classList.remove('next');
      cc.style.setProperty('--p', '0%'); $('campLine').textContent = '';
    };
    if (tb) {   // 저절로 꿰어질 구슬: 둘레에 금빛이 차오른다. 판(구슬 밖)을 누르거나 Tab 으로 구슬에 가면 멈춘다
      tb.classList.add('next');
      if (!robot) setTimeout(() => { if (timer) $('campLine').textContent = t(L, 'campAuto', txt(target)); }, 60);   // 낭독기가 알리게 한 틱 뒤에
      const t0 = performance.now();
      const step = (now) => { const k = Math.min(1, (now - t0) / WAIT); cc.style.setProperty('--p', (k * 100).toFixed(2) + '%'); if (k < 1 && timer) raf = requestAnimationFrame(step); };
      timer = setTimeout(() => { if (tb.isConnected) tb.click(); }, WAIT);
      raf = requestAnimationFrame(step);
    }
    cc.addEventListener('click', (e) => { if (timer && !e.target.closest('[data-v]')) stop(); });
    cc.addEventListener('focusin', (e) => { if (timer && e.target.closest('.cbead')) stop(); });   // 키보드로 구슬을 읽는 사람에게 8초는 짧다
    // 1·2·3 = 고르기. 스페이스는 멈춤 열쇠라 구슬 밖에서는 고르지 않고 기다림만 멈춘다 (갈림길과 같다)
    const key = (e) => {
      if (e.key === ' ' || e.code === 'Space') {
        if (e.target.closest && e.target.closest('.cbead')) return;
        e.preventDefault();
        if (e.type === 'keydown' && timer) stop();
        return;
      }
      if (e.type !== 'keydown' || e.ctrlKey || e.altKey || e.metaKey) return;
      const k = +e.key;
      if (k >= 1 && k <= btns.length) btns[k - 1].click();
    };
    document.addEventListener('keydown', key); document.addEventListener('keyup', key);
    cc.focus({ preventScroll: true });
    return pick(modal, null).then(async (id) => {
      stop(); document.removeEventListener('keydown', key); document.removeEventListener('keyup', key);
      const btn = btns.find((x) => x.dataset.v === id);
      cc.classList.add('done'); if (btn) btn.classList.add('picked');
      await new Promise((r) => setTimeout(r, fast || robot ? 0 : reduced() ? 150 : 650));   // 고른 구슬이 한 번 부풀고 판이 닫힌다
      modal.hidden = true; modal.className = ''; app.classList.remove('calm'); hudInert(false);
      return { pick: id };
    });
  }

  // 마지막 해 (검은 화면, 누르면 넘어간다)
  function lastYear(life) {
    const d = life.death, b = life.birth;
    modal.classList.add('dark');
    show(modal, d.present   // 지금(2026)까지 살아 멈춘 생: 죽음 말 없이
      ? `<div class="last" role="dialog" aria-modal="true"><h2>${esc(t(L, 'presentTitle', d.year, d.age))}</h2>
      <p>${esc(t(L, 'presentLine'))}</p><p class="hint">${esc(t(L, 'tapNext'))}</p></div>`
      : `<div class="last" role="dialog" aria-modal="true"><h2>${esc(t(L, 'lastYear', d.age))}</h2>
      <p>${esc(t(L, 'diedIn', AREAS[b.area].short[L]))}</p><p class="hint">${esc(t(L, 'cause'))} · ${esc(causeName(d.cause, L))}</p>
      <p>${esc(deathLine(d, L))}</p><p class="hint">${esc(t(L, 'tapNext'))}</p></div>`);
    return new Promise((res) => {
      const fin = () => { modal.removeEventListener('click', fin); modal.classList.remove('dark'); modal.hidden = true; res(); };
      modal.addEventListener('click', fin);
      if (robot) setTimeout(fin, fast ? 20 : 600);
    });
  }

  function survSvg(sh, at) {
    const S = survivalCurve(sh, 100), W = 320, H = 110, k = Math.min(100, at);
    const pts = S.map((v, a) => `${((a / 100) * W).toFixed(1)},${(H - v * H).toFixed(1)}`).join(' ');
    return `<svg class="surv" viewBox="-6 -6 ${W + 12} ${H + 26}" role="img" aria-label="${esc(t(L, 'survHint'))}">
      <line x1="0" y1="${H}" x2="${W}" y2="${H}" stroke="currentColor" stroke-opacity=".25"/>
      <polyline fill="none" stroke="currentColor" stroke-width="2" points="${pts}"/>
      <circle cx="${((k / 100) * W).toFixed(1)}" cy="${(H - S[k] * H).toFixed(1)}" r="5" fill="#e2b65e"/>
      <text x="0" y="${H + 16}" font-size="10" fill="currentColor">0</text><text x="${W - 18}" y="${H + 16}" font-size="10" fill="currentColor">100</text></svg>
      <p class="hint">${esc(t(L, 'survHint'))}</p>`;
  }

  // 사망 기록 (서류). 돌려주는 값: {act: 'next'|'lineage'|'share'|'title', note}
  function deathRecord({ life, sum, soul, peers }) {
    app.hidden = true; screen.className = '';
    const b = life.birth, d = life.death, sh = shapeFor(b.era, b.region), e0 = Math.round(lifeStats(sh).e0);
    const ended = soul && soul.ended, now = !!d.present;   // now: 지금(2026)까지 살아 멈춘 생
    // 통계 비교 줄(「…%가 당신보다 오래」·「네 사람 가운데 …명」) 대신 그 시대 이 땅 사람들의 흔한 마지막 한 줄 (설계 5.3). 맥락은 생이 끝난 해
    const common = commonEnd(contextOf(d.year, b.area, b.household), L, { area: b.area, present: now, cause: d.cause });
    const first = soul ? `<button class="primary" data-v="${ended ? 'lineage' : 'next'}">${esc(ended ? t(L, 'toLineage') : t(L, 'nextBtn'))}</button>`
      : `<button class="primary" data-v="title">${esc(t(L, 'toTitle'))}</button>`;
    const quickBtn = soul ? `<button class="quick-act" data-v="${ended ? 'lineage' : 'next'}">${esc(ended ? t(L, 'toLineage') : t(L, 'nextBtn'))} →</button>`
      : `<button class="quick-act" data-v="title">${esc(t(L, 'toTitle'))} →</button>`;
    show(screen, `<article class="doc ${now ? '' : 'death'}"><header class="doc-head"><span>${esc(t(L, now ? 'presentDoc' : 'deathDoc'))}</span><div class="head-actions"><span class="mono">No. ${esc(b.seed)}</span>${quickBtn}</div></header>
      <div class="doc-body">
        <p class="eyebrow">${esc(soul ? t(L, 'nth', soul.lives.length) : t(L, 'practice'))}</p>
        <h2>${esc(spanText(b, d, L))} · ${esc(t(L, 'age', d.age))} · ${esc(AREAS[b.area].short[L])}</h2>
        <p class="obit">${esc(obituary(life, sum, L))}</p>
        ${now ? '' : `<p>${esc(t(L, 'cause'))} · ${esc(causeName(d.cause, L))}</p>`}
        <p class="common"><b>${esc(t(L, 'commonTitle'))}</b> ${esc(common)}</p>
        <dl class="fields">${field(t(L, 'happiest'), t(L, 'age', sum.happiest))}${field(t(L, 'topFocus'), sum.topFocus ? focusName(sum.topFocus, 30, L) : '—')}
          ${field(t(L, 'partner'), sum.married ? t(L, now ? 'partnerNow' : 'partnerYes') : t(L, 'partnerNo'))}${field(t(L, 'kids'), t(L, 'kidsN', sum.kids))}</dl>
        <h3>${esc(t(L, 'mapTitle'))}</h3>${mapHtml(life, e0)}
        <h3>${esc(t(L, 'survTitle'))}</h3>${survSvg(sh, d.age)}
        <h3>${esc(t(L, 'peersTitle'))}</h3><ul class="peers">${peers.map((p) => `<li>${esc(peerLine(p, 999, L))}</li>`).join('')}</ul>
        ${soul && !now ? `<h3>${esc(t(L, 'gained'))}</h3><div class="chips">${soul.traces.length ? soul.traces.map(badge).join('') : esc(t(L, 'noneGained'))}</div>` : ''}
        ${ended ? `<p class="obit"><b>${esc(epilogueText(soul, L))}</b></p>` : ''}
        ${soul ? `<label>${esc(t(L, ended ? 'toLifeEnd' : 'toLife'))}<textarea id="toLife" maxlength="140" rows="2" placeholder="${esc(t(L, 'toLifePh'))}"></textarea></label>` : ''}
        <div class="btns">${first}<button data-v="share">${esc(t(L, 'share'))}</button>
          ${soul && !ended ? `<button data-v="lineage">${esc(t(L, 'lineage'))}</button>` : ''}${soul ? `<button class="quiet" data-v="title">${esc(t(L, 'toTitle'))}</button>` : ''}</div>
      </div></article>`);
    screen.scrollTop = 0;
    return pick(screen).then((v) => { const box = $('toLife'); const note = box ? box.value.trim() : ''; screen.hidden = true; return { act: v, note }; });
  }

  // 영혼의 염주 (설계 2장): 지도 위에 태어난 차례대로 금실과 메달 (메달 = 그 생의 마을 사진, 없으면 차례 숫자) · 해 표시
  const memsOf = (x) => (Array.isArray(x.memories) ? x.memories.filter(okMem) : []);
  const imgOf = (src) => new Promise((res) => { if (!okImg(src)) return res(null); const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = src; });
  async function rosaryMap(soul, box) {
    const land = await getLand();
    const cv = box.querySelector('canvas');
    if (!land || !cv || !box.isConnected) { box.hidden = true; return null; }
    const imgs = await Promise.all(soul.lives.map((x) => imgOf(x.thumb)));
    if (!box.isConnected) return null;
    const map = createWorldMap(cv, { lang: L, land, title: false, reducedMotion: mapMotion() });
    const lives = soul.lives.map((x, i) => ({ ...spotOf(x.birth, land), num: i + 1, img: imgs[i], label: `${fmtYear(x.birth.year, L)} · ${AREAS[x.birth.area].short[L]}` }));
    map.rosary(lives);
    return { map, lives };
  }
  // 그 생의 마지막 기억 구슬 한 줄 (족보 목록)
  function lastMemLine(x) {
    const m = memsOf(x).filter((k) => k.text && typeof k.text[L] === 'string' && k.text[L]).pop();
    return m ? `<br><span class="lmem"><i class="mk memo${m.echo ? ' echo' : ''}" aria-hidden="true"></i>「${esc(renderText(m.text[L], memCtx(x.birth, m), x.birth, L))}」</span>` : '';
  }
  function lineage(soul) {
    app.hidden = true; screen.className = 'night';
    const memCount = soul.lives.reduce((s, x) => s + memsOf(x).length, 0);
    show(screen, `<div class="sheet"><p class="eyebrow">${esc(t(L, 'livesCount', soul.lives.length))}</p><h1>${esc(t(L, 'lineageTitle'))}</h1>
      <div class="rosary-box" id="rosaryBox"><canvas role="img" aria-label="${esc(t(L, 'rosaryAria', soul.lives.length, memCount))}"></canvas></div>
      <div class="lives">${soul.lives.map((x, i) => `<div class="life">${okImg(x.thumb) ? `<img src="${x.thumb}" alt="">` : '<div></div>'}<div><b>${esc(t(L, 'nth', i + 1))}</b><br>${esc(birthLine(x.birth, L))}<br>${esc(lifeEnd(x, L))}${lastMemLine(x)}${x.note ? `<br><i>“${esc(x.note)}”</i>` : ''}${x.gained.length ? `<div class="chips">${x.gained.map(badge).join('')}</div>` : ''}</div></div>`).join('')}
      ${soul.ended ? `<div class="life"><div></div><div><b>${esc(epilogueText(soul, L))}</b></div></div>` : ''}</div>
      <div class="btns"><button class="primary" data-v="title">${esc(t(L, 'toTitle'))}</button>${soul.ended ? `<button data-v="newsoul">${esc(t(L, 'newSoul'))}</button>` : ''}</div></div>`);
    const box = $('rosaryBox');
    let rm = null, ro = null, gone = false;
    rosaryMap(soul, box).then((x) => {
      if (!x || gone) { if (x) x.map.dispose(); return; }
      rm = x;
      let w0 = box.clientWidth;   // 처음 한 번 오는 알림에 그리기 연출이 끊기지 않게, 폭이 바뀔 때만 다시 그린다
      ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => { if (box.clientWidth === w0) return; w0 = box.clientWidth; rm.map.resize(); rm.map.rosary(rm.lives, { ms: 0 }); }) : null;
      if (ro) ro.observe(box);
    });
    return pick(screen).then((v) => { gone = true; if (ro) ro.disconnect(); if (rm) rm.map.dispose(); screen.hidden = true; return v; });
  }

  function dex(cells) {
    app.hidden = true; screen.className = 'night';
    show(screen, `<div class="sheet"><h1>${esc(t(L, 'dexTitle'))}</h1><p>${esc(t(L, 'dexHint'))} · ${Object.keys(cells).length} / ${ERAS.length * REGIONS.length}</p>
      <div class="dex"><table><thead><tr><th></th>${REGIONS.map((r) => `<th>${esc(REGION_NAME[r][L])}</th>`).join('')}</tr></thead><tbody>
      ${ERAS.map((e) => `<tr><th>${esc(e[L])}</th>${REGIONS.map((r) => { const n = cells[`${e.id}|${r}`]; return `<td class="${n ? 'on' : ''}">${n || ''}</td>`; }).join('')}</tr>`).join('')}
      </tbody></table></div><div class="btns"><button class="primary" data-v="title">${esc(t(L, 'toTitle'))}</button></div></div>`);
    return pick(screen).then(() => { screen.hidden = true; });
  }

  function shareText(life, soul) {
    const b = life.birth, d = life.death;
    const end = d.present ? `${spanText(b, d, L)} · ${t(L, 'age', d.age)}` : `${t(L, 'age', d.age)} · ${causeName(d.cause, L)}`;   // 지금까지 이어지는 생은 죽음 말 없이
    return [t(L, 'title') + (soul ? ' · ' + t(L, 'nth', soul.lives.length) : ''), birthLine(b, L), end, `${t(L, 'seed')} ${b.seed}`].join('\n');
  }
  // 1080×1350 카드 그림 (웹 링크에서는 내려받기가 막혀 그림을 띄우기만 한다)
  async function shareImage(thumb, text) {
    const c = document.createElement('canvas'); c.width = 1080; c.height = 1350;
    const g = c.getContext('2d');
    g.fillStyle = '#121329'; g.fillRect(0, 0, 1080, 1350);
    if (okImg(thumb)) { const im = new Image(); im.src = thumb; await im.decode().catch(() => {}); g.drawImage(im, 40, 40, 1000, 562); }
    g.fillStyle = '#e2b65e'; g.font = '700 54px "Gowun Batang", serif'; g.fillText(t(L, 'oneIn'), 60, 700);
    g.fillStyle = '#f6efe2'; g.font = '40px "Gowun Batang", serif';
    let y = 780;
    for (const para of text.split('\n')) {
      let line = '';
      for (const word of para.split(' ')) {
        const test = line ? line + ' ' + word : word;
        if (g.measureText(test).width > 960 && line) { g.fillText(line, 60, y); y += 56; line = word; } else line = test;
      }
      g.fillText(line, 60, y); y += 64;
    }
    return c.toDataURL('image/png');
  }
  async function share(life, soul, thumb) {
    if (robot) return;
    const text = shareText(life, soul), img = await shareImage(thumb, text);
    screen.className = '';
    show(screen, `<div class="sheet"><h2>${esc(t(L, 'share'))}</h2><pre style="white-space:pre-wrap;font:inherit;margin:0">${esc(text)}</pre>
      <div class="btns"><button class="primary" data-v="copy">${esc(t(L, 'copyText'))}</button><button class="quiet" data-v="close">${esc(t(L, 'close'))}</button></div>
      <p class="credit">${esc(t(L, 'imageHint'))}</p><img src="${img}" alt="" style="max-width:100%;border-radius:12px"></div>`);
    for (;;) {
      const v = await pick(screen, null);
      if (v === 'copy') { try { await navigator.clipboard.writeText(text); say(t(L, 'copied')); } catch { say(t(L, 'copyFail')); } continue; }
      screen.hidden = true;
      return;
    }
  }

  // 무대를 짓는 동안 무대 위 작은 표시 (main.js 가 village.whenReady 로 끈다)
  function stageLoading(on) { const el = $('stageLoad'); if (el) el.hidden = !on; }

  // 설정 창 (시작 화면·게임 안 「더 보기」): 화질 · 해가 흐르는 기본 빠르기 · 소리 · 말 · 처음 안내 다시 보기. 고르면 바로 적용하고 창은 그대로 (닫기로 닫는다)
  async function settings(o) {
    const wasHidden = modal.hidden, prevCls = modal.className, prevHtml = modal.innerHTML;
    let coachMsg = false;
    const paint = () => {
      const st = o.get(), sp = t(L, 'speedName');
      const seg = (name, list, curV) => `<div class="seg" role="group">${list.map(([v, label]) => `<button data-v="${name}:${v}" aria-pressed="${v === curV}">${esc(label)}</button>`).join('')}</div>`;
      modal.className = 'settings';
      modal.innerHTML = `<div class="setsheet" role="dialog" aria-modal="true" aria-labelledby="setT"><h2 id="setT">${esc(t(L, 'setTitle'))}</h2>
        <div class="row"><b>${esc(t(L, 'setQuality'))}</b>${seg('q', [['high', t(L, 'qHigh')], ['normal', t(L, 'qNormal')]], st.quality)}<small>${esc(t(L, 'qHint'))}</small></div>
        <div class="row"><b>${esc(t(L, 'setSpeed'))}</b>${seg('sp', ['slow', 'normal', 'fast', 'fastest'].map((k) => [k, sp[k]]), st.speed)}</div>
        <div class="row"><b>${esc(t(L, 'setSound'))}</b>${seg('snd', [['on', t(L, 'soundOn')], ['off', t(L, 'soundOff')]], st.sound ? 'on' : 'off')}</div>
        <div class="row"><b>${esc(t(L, 'setLang'))}</b>${seg('lang', [['ko', '한국어'], ['en', 'English']], st.lang)}</div>
        <div class="row"><button data-v="coach">${esc(t(L, 'setCoach'))}</button>${coachMsg ? `<small role="status">${esc(t(L, 'coachAgain'))}</small>` : ''}</div>
        <div class="btns"><button class="primary" data-v="close">${esc(t(L, 'close'))}</button></div></div>`;
      modal.hidden = false;
    };
    paint();
    const first = modal.querySelector('[data-v="close"]');
    if (first) first.focus();
    for (;;) {
      const v = await new Promise((res) => {
        const on = (e) => { const b = e.target.closest('[data-v]'); if (!b || !modal.contains(b)) { if (e.target === modal) { done(); res('close'); } return; } done(); res(b.dataset.v); };
        const key = (e) => { if (e.key === 'Escape') { done(); res('close'); } };
        const done = () => { modal.removeEventListener('click', on); document.removeEventListener('keydown', key); };
        modal.addEventListener('click', on); document.addEventListener('keydown', key);
        if (robot) setTimeout(() => { done(); res('close'); }, fast ? 20 : 350);
      });
      if (v === 'close') break;
      const [k, val] = v.split(':');
      const st = o.get();
      if (k === 'q' && val !== st.quality) o.quality(val);
      if (k === 'sp') o.speed(val);
      if (k === 'snd' && (val === 'on') !== st.sound) o.sound();
      if (k === 'lang' && val !== st.lang) o.lang();
      if (k === 'coach') { o.coach(); coachMsg = true; }
      paint();
      const again = modal.querySelector(`[data-v="${v}"]`);
      if (again) again.focus();
    }
    if (wasHidden) { modal.hidden = true; modal.className = ''; modal.innerHTML = ''; } else { modal.className = prevCls; modal.innerHTML = prevHtml; }
  }

  // 처음 하는 사람을 위한 3단계 안내: 수치 판 → 올해의 패 → 갈림길과 모닥불(구슬 실). 그 자리를 밝히고 옆에 말풍선. 건너뛰기·Esc 로 끝
  function coach() {
    if (robot) return Promise.resolve();
    const steps = [() => $('board'), () => $('focusBox').closest('section'), () => $('strand').closest('footer')];
    const box = document.createElement('div');
    box.id = 'coach';
    box.innerHTML = '<div class="hole"></div><div class="bub" role="dialog" aria-modal="true" aria-labelledby="coachT"></div>';
    document.body.appendChild(box);
    hudInert(true);
    const hole = box.querySelector('.hole'), bub = box.querySelector('.bub');
    let i = 0;
    return new Promise((res) => {
      const finish = () => { window.removeEventListener('resize', place); document.removeEventListener('keydown', key); box.remove(); hudInert(false); res(); };
      function place() {
        const el = steps[i](), r = el && el.getBoundingClientRect();
        const W = window.innerWidth, H = window.innerHeight, pad = 8;
        // 화면 안으로 자른 자리 (구슬 실처럼 화면 끝까지 닿는 것도 테두리가 보이게). 크기가 없으면 밝히지 않고 가운데 말풍선만
        const box2 = r && r.width ? { l: Math.max(4, r.left - pad), t: Math.max(4, r.top - pad), r: Math.min(W - 4, r.right + pad), b: Math.min(H - 4, r.bottom + pad) } : null;
        if (box2) Object.assign(hole.style, { left: `${box2.l}px`, top: `${box2.t}px`, width: `${box2.r - box2.l}px`, height: `${box2.b - box2.t}px`, opacity: '1' });
        else hole.style.opacity = '0';
        const bw = bub.offsetWidth, bh = bub.offsetHeight;
        let x, y;
        if (r && r.width) {   // 밝힌 자리 오른쪽 → 왼쪽 → 위 → 아래 가운데 차례로 들어갈 곳
          if (r.right + 16 + bw < W - 8) { x = r.right + 16; y = r.top; } else if (r.left - 16 - bw > 8) { x = r.left - 16 - bw; y = r.top; } else if (r.top - 16 - bh > 8) { x = r.left; y = r.top - 16 - bh; } else { x = r.left; y = r.bottom + 16; }
        } else { x = (W - bw) / 2; y = (H - bh) / 2; }
        bub.style.left = `${Math.max(8, Math.min(W - bw - 8, x))}px`; bub.style.top = `${Math.max(8, Math.min(H - bh - 8, y))}px`;
      }
      function paint() {
        const c = t(L, 'coach'), n = c.length, last = i === n - 1;
        bub.innerHTML = `<h3 id="coachT">${esc(c[i].t)}</h3><p>${esc(c[i].d)}</p>
          <div class="nav"><span class="n">${esc(t(L, 'coachStep', i + 1, n))}</span>${last ? '' : `<button class="quiet" data-v="skip">${esc(t(L, 'coachSkip'))}</button>`}<button class="primary" data-v="next">${esc(last ? t(L, 'coachDone') : t(L, 'coachNext'))}</button></div>`;
        place();
        const nb = bub.querySelector('[data-v="next"]');
        if (nb) nb.focus();
      }
      const key = (e) => { if (e.key === 'Escape') finish(); };
      box.addEventListener('click', (e) => {
        const b = e.target.closest('[data-v]');
        if (!b) return;
        if (b.dataset.v === 'skip') return finish();
        if (++i >= t(L, 'coach').length) return finish();
        paint();
      });
      window.addEventListener('resize', place); document.addEventListener('keydown', key);
      paint();
    });
  }

  return {
    setHandlers: (x) => { h = x; },
    toast: say,
    setLang(l) { L = l; labels(); if (cur && !app.hidden) { shown = 0; memShown = (cur.life.memories || []).length; $('journal').innerHTML = ''; hideTip(); update(cur.life, cur.peers); } },
    title, destinySetup, birthIntro, mapZoom, birthRecord, showApp, update, decision, pause, lastYear, deathRecord, lineage, dex, share,
    settings, coach, stageLoading,
  };
}
