import { applyHeirloom } from './heirlooms.js';
import { createDynasty, prepareSuccessor, applyDynastyPerks } from './dynasty.js';
// 연결 (설계 12장): 시작 → 탄생 장면 → 출생 기록 → 해가 저절로 흐르는 한 생 → 마지막 해 → 사망 기록 → 다음 생 / 족보
// ?seed=문자열: 그 시드로 연습 한 판 (저장 안 함) · ?auto=1: 단추·결정을 저절로 · ?fast=1: 기다림 없음
import { phaseOf } from './phase.js';
import { createUI } from './ui.js';
import { createSound } from './sound.js';
import { newSoul, finishLife, addDex, makeStore } from './soul.js';
import { drawBirth } from './birth.js';
import { createLife, advance, choose, summarize, setFocus, autoChoice } from './life.js';
import { memoryCandidates, pickMemory, seeMemories } from './memory.js';
import { beadsOf, encodeBeads } from './beads.js';
import { autoFocus } from './focus.js';
import { makePeers } from './peers.js';
import { badgeFor } from './traces.js';
import { DECK } from './deck.js';
import { LINES } from './lines.js';
import { t, traceName } from './i18n.js';

const Q = new URLSearchParams(location.search);
const robot = Q.has('auto'), fast = Q.has('fast');
let practice = Q.get('seed');
const store = makeStore();
const savedLang = store.loadLang();   // 저장된 값이 ko·en 이 아니면 (손으로 고친 값 등) 처음처럼 브라우저 말로 정한다
const S = {
  lang: savedLang === 'ko' || savedLang === 'en' ? savedLang : ((navigator.language || '').toLowerCase().startsWith('ko') ? 'ko' : 'en'), sound: store.loadSound() !== false,
  speed: store.loadSpeed(), paused: false, skipping: false, auto: false, exit: false, n: 0,
};
// 옛 「다음부터 모닥불 건너뛰기」 저장값은 이제 쓰지 않는다 (모닥불은 짧고, 고르지 않으면 저절로 지나간다)
store.clearLegacy();
const YEAR_MS = { slow: 16000, normal: 8000, fast: 3000, fastest: 1000 };   // 해시계: 1년에 걸리는 시간 (보통 8초)
document.documentElement.lang = S.lang;
const ui = createUI({ lang: S.lang, robot, fast });
// 실사 3D 무대 (realscene.js createStage: 생마다 출생 시드로 마을을 짓는다. 옛 KayKit 육각 섬 village.js 와 메서드 이름이 같다)
// three.js(CDN, 1 MB 남짓)를 뒤에서 받는다: 시작 화면은 바로 뜨고, 첫 생을 시작할 때 무대를 기다린다 (stageReady).
// WebGL 이 없거나 꺼져 있거나 three 를 못 받으면 3D 마을 없이 글로만 간다. 빈 마을은 진짜 마을과 메서드 이름이 같다 (그림은 null → 족보·나누기가 건너뛴다)
const NO_STAGE = { fast: false, preload() {}, setKit() {}, setLife() {}, setAge() {}, setFocus() {}, setCardFocus() {}, onChoice() {}, setWeather() {}, setPhase() {}, tick() {}, snapshot: () => null, setCampfire() {}, flameRise: () => Promise.resolve(), setView() {}, setQuality() {}, whenReady: () => Promise.resolve() };
let village = NO_STAGE, has3d = false;
const textOnly = (e) => {
  console.warn('한 영혼의 여정: 3D 마을을 만들지 못해 글로만 진행한다', e);
  document.getElementById('c').hidden = true;
  document.getElementById('no3d').hidden = false;
};
const stageReady = import('./realscene.js').then(({ createStage }) => {
  try { village = createStage(document.getElementById('c')); has3d = true; } catch (e) { textOnly(e); }
}, textOnly).then(() => {
  village.fast = fast;
  window.__pl.village = village; window.__pl.has3d = has3d;
  applyView();
});
const sound = createSound(() => S.sound);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// 다음 그림이 화면에 나간 뒤 (창이 가려져 그리기가 멈춰도 0.1초면 넘어간다)
const nextPaint = () => Promise.race([new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))), wait(100)]);
let cur = null;   // 지금 사는 생 { life, peers }
window.__pl = { ui, village, S, store, has3d, stageReady };
// 데스크톱은 섬을 화면 위쪽으로 올려 아래 구슬 실·패에 덜 가리게 한다 (폰은 마을 칸이 따로 있어 0)
const wideMq = matchMedia('(min-width: 901px) and (min-height: 561px)');   // ui.js·index.html 의 데스크톱 배치와 같은 조건
const applyView = () => village.setView({ lift: wideMq.matches ? 0.18 : 0 });
if (wideMq.addEventListener) wideMq.addEventListener('change', applyView); else wideMq.addListener(applyView);

const refresh = () => { if (cur) ui.update(cur.life, cur.peers, S); };
// 무대의 내 사람이 올해의 패(고르지 않았으면 가장 급한 쪽)를 따라 일·자리를 바꾼다
const showFocus = (life) => village.setFocus(life.focus || autoFocus(life.stats));
ui.setHandlers({
  play: () => { S.paused = !S.paused; refresh(); },
  speed: (id) => { if (!YEAR_MS[id]) return; S.speed = id; S.paused = false; refresh(); },
  skip: () => { S.skipping = true; S.paused = false; refresh(); },
  auto: (on) => { S.auto = on; refresh(); },
  sound: () => { S.sound = !S.sound; store.saveSound(S.sound); refresh(); },
  lang: () => { S.lang = S.lang === 'ko' ? 'en' : 'ko'; store.saveLang(S.lang); document.documentElement.lang = S.lang; ui.setLang(S.lang); refresh(); },
  settings: () => openSettings(),
  exit: () => { S.exit = true; S.paused = false; },
  focus: (id) => { if (cur) { setFocus(cur.life, id); showFocus(cur.life); refresh(); } },
});

// 설정 (시작 화면·게임 안 「더 보기」): 화질 · 해가 흐르는 기본 빠르기 · 소리 · 말 · 처음 안내 다시 보기. 게임 안에서 열면 그동안 멈춘다
async function openSettings() {
  const wasPaused = S.paused;
  S.paused = true; refresh();
  await ui.settings({
    get: () => ({ quality: store.loadQuality(), speed: S.speed, sound: S.sound, lang: S.lang, software: village.isSoftware }),
    quality: (q) => { store.saveQuality(q); village.setQuality(q); },
    speed: (v) => { S.speed = v; store.saveSpeed(v); },
    sound: () => { S.sound = !S.sound; store.saveSound(S.sound); },
    lang: () => { S.lang = S.lang === 'ko' ? 'en' : 'ko'; store.saveLang(S.lang); document.documentElement.lang = S.lang; ui.setLang(S.lang); },
    coach: () => store.saveCoach(false),
  });
  S.paused = wasPaused; refresh();
}

// 한 해 기다리기: 해시계 속도·멈춤·다음 갈림길까지를 그때그때 따른다 (다음 갈림길까지는 100배)
function yearWait() {
  if (fast) return Promise.resolve();
  return new Promise((res) => {
    let done = 0, last = performance.now();
    const step = () => {
      const now = performance.now();
      if (!S.paused) done += (now - last) * (S.skipping ? 100 : 1);
      last = now;
      if (done >= YEAR_MS[S.speed] || S.exit) return res();
      setTimeout(step, 50);
    };
    step();
  });
}

function applyInvestments(life, inv) {
  if (!inv) return;
  if (inv.luck) {
    life.attrs.luck = Math.min(100, Math.max(0, (life.attrs.luck || 50) + inv.luck * 10));
    if (inv.luck >= 3) life.tenacity = (life.tenacity || 1) + 1;
  }
  if (inv.charm) life.attrs.charm = Math.min(100, Math.max(0, (life.attrs.charm || 50) + inv.charm * 10));
  if (inv.know) {
    life.attrs.know = Math.min(100, Math.max(0, (life.attrs.know || 15) + inv.know * 8));
    if (life.attrs.know >= 60) life.flags.literate = true;
  }
  if (inv.skill) life.attrs.skill = Math.min(100, Math.max(0, (life.attrs.skill || 35) + inv.skill * 10));
  if (inv.health) {
    life.stats.health = Math.min(100, Math.max(0, (life.stats.health || 50) + inv.health * 8));
    if (inv.health >= 2) life.tenacity = (life.tenacity || 1) + 1;
    if (inv.health >= 4) life.tenacity = (life.tenacity || 1) + 1;
  }
  if (inv.wealth) life.stats.wealth = Math.min(100, Math.max(0, (life.stats.wealth || 30) + inv.wealth * 8));
}
// 한 생을 끝까지. 돌려주는 값: 'next' | 'lineage' | 'title'
async function playLife(soul) {
  let customDestiny = null;
  try {
    const raw = sessionStorage.getItem('past_life_destiny');
    if (raw) {
      customDestiny = JSON.parse(raw);
      sessionStorage.removeItem('past_life_destiny');
    }
  } catch (e) {}

  let birth = customDestiny && customDestiny.seed ? drawBirth(customDestiny.seed) : (soul ? soul.next : drawBirth(practice));
  if (!birth && customDestiny && customDestiny.seed) birth = drawBirth(customDestiny.seed);
  if (!birth) birth = drawBirth(practice);
  const prev = soul && soul.lives.length ? soul.lives[soul.lives.length - 1] : null;
  const traces = soul ? soul.traces : [];
  const n = soul ? soul.lives.length + 1 : 0;

  let chosenInvestments = customDestiny ? customDestiny.investments : null;
  let chosenHeirloom = customDestiny ? customDestiny.heirloom : null;
  if (!customDestiny && !robot && ui.destinySetup) {
    const chosen = await ui.destinySetup({ birth, n, prev, traces, soul });
    if (chosen && chosen.birth) {
      birth = chosen.birth;
      if (soul) { soul.next = birth; store.saveSoul(soul); }
    }
    if (chosen && chosen.investments) {
      chosenInvestments = chosen.investments;
    }
    if (chosen && chosen.heirloom) {
      chosenHeirloom = chosen.heirloom;
    }
  }

  const life = createLife({ birth, traces, player: true, avoid: prev && Array.isArray(prev.lines) ? prev.lines : [] });
  if (chosenInvestments) {
    applyInvestments(life, chosenInvestments);
  }
  if (chosenHeirloom) {
    applyHeirloom(life, chosenHeirloom, { buriedStash: prev && prev.buriedStash });
  }
  if (birth.dynasty) {
    applyDynastyPerks(life, birth.dynasty);
    life.journal.push({
      age: 0,
      year: birth.year,
      kind: 'dynasty',
      text: {
        ko: `[가문 계승] ${birth.dynasty.name.ko} ${birth.dynasty.gen}대 가주로서 선대의 가업과 유산 ${birth.wealth}냥을 물려받고 가문의 대를 잇습니다.`,
        en: `[Dynasty Succession] Inherited the trade and ${birth.wealth} wealth as head of generation ${birth.dynasty.gen} of ${birth.dynasty.name.en}.`,
      },
    });
  }
  const peers = makePeers(birth);
  window.__pl.life = life; window.__pl.soul = soul;
  try { if (village && village.preload) village.preload(birth); } catch (e) {}
  sound.chime();
  await ui.birthIntro({ birth, n, gap: prev ? birth.year - prev.death.year : null, traces, prev });
  // 무대 짓기(동기로 1초 남짓)는 출생 기록 종이가 한 번 그려진 뒤에: 시작을 누르면 화면이 바로 바뀌고, 짓는 동안의 멈춤은 가만히 읽는 종이 뒤에 숨는다
  const record = ui.birthRecord({ birth, n, prev, peers, traces, heirloom: chosenHeirloom });
  await nextPaint();
  await stageReady;   // 첫 생: three·무대 모듈이 아직 오는 중이면 출생 기록을 읽는 동안 기다린다
  village.setLife(birth); village.setAge(0, birth.year); village.setPhase('night');
  // 마을을 다 지을 때까지 무대 위에 작은 「마을을 짓는 중…」 (사람·건물 glb 를 받는 동안)
  ui.stageLoading(has3d);
  village.whenReady().then(() => ui.stageLoading(false), () => ui.stageLoading(false));
  await record;
  await Promise.race([village.whenReady(), wait(2000)]);
  Object.assign(S, { paused: false, skipping: false, exit: false, n });
  cur = { life, peers };
  ui.showApp(life, peers, S);
  applyView();
  village.setPhase(phaseOf(0)); showFocus(life);
  await ui.mapZoom();   // 지도가 태어난 자리로 다가가며 걷히고 무대가 드러난다 (지도가 없으면 그냥 지나간다)
  // 처음 하는 사람: 수치 판 → 올해의 패 → 갈림길과 모닥불 (건너뛸 수 있다. 한 번 보면 다시 나오지 않는다. 설정에서 다시 켠다)
  if (!robot && !store.loadCoach()) { S.paused = true; refresh(); await ui.coach(); store.saveCoach(true); S.paused = false; refresh(); }
  for (;;) {
    if (S.exit) { cur = null; return 'title'; }
    const ev = advance(life, DECK, { lines: LINES, yearly: true });
    if (life.justTenacity) {
      life.justTenacity = null;
      sound.chime();
      ui.toast(S.lang === 'ko' ? '✨ 기사회생! 죽음의 고비를 넘기고 살아남았습니다.' : '✨ Miraculous Recovery! Overcame a fatal crisis.', 3500);
    }
    village.setAge(life.age, life.year); village.setPhase(phaseOf(life.age)); showFocus(life);
    refresh();
    if (ev.type === 'death') break;
    if (ev.type === 'card') {
      S.skipping = false; refresh();
      village.setCardFocus(ev.card);
      const i = await ui.decision(ev.card, life, { badge: badgeFor(ev.card, life.traces), autoIndex: autoChoice(life, ev.card), auto: S.auto || robot });
      village.onChoice?.(ev.card, i);
      village.setCardFocus(null);
      sound.tick(); choose(life, i); refresh();
      continue;
    }
    if (ev.type === 'pause') {
      S.skipping = false; refresh();
      // 모닥불: 저녁 하늘, 마을에 불을 켜고 앞 생이 있으면 불 건너편에 푸른 불씨. 기억 구슬 하나를 꿰고, 닫히면 끄고 그 나이의 하늘로
      // 지난 모닥불 뒤로 이 생에 남은 일이 없으면 판 없이 1.2초만 불을 쬐고 지나간다
      const cands = memoryCandidates(life, prev);
      seeMemories(life, cands);   // 띄운 메아리 줄은 이 생에서 다시 나오지 않는다
      village.setPhase('dusk'); village.setCampfire(true, !!prev);
      if (!cands.length) await wait(fast ? 0 : 1200);
      else {
        const r = await ui.pause(life, { prev, cands, auto: S.auto });
        const c = cands.find((x) => x.id === r.pick);
        if (c) {
          pickMemory(life, c); sound.tick();
          // 푸른 메아리를 꿰면 그 흔적이 짙어진다: HUD 흔적 구슬의 짙음 표시가 오르고 한 번 알린다
          if (c.kind === 'echo') ui.toast(t(S.lang, 'traceDeepened', traceName(c.trace, S.lang)), { cls: 'echo', ms: 3600 });
        }
      }
      village.setCampfire(false); village.setPhase(phaseOf(life.age));
      refresh();
      continue;
    }
    village.tick();
    if (!S.skipping && !fast) sound.tick();   // 새 구슬이 꿰어지는 작은 소리
    await yearWait();
  }
  cur = null;
  // 지금(2026)까지 이어지는 생은 밤·종 대신 그 나이의 하늘과 맑은 소리로 맺는다
  if (life.death.present) { village.setPhase(phaseOf(life.age)); sound.chime(); } else { village.setPhase('night'); sound.bell(); await village.flameRise(); }   // 죽는 해: 내 사람 위로 하얀 불씨가 떠오른다
  await ui.lastYear(life);
  await wait(fast ? 0 : 700);   // 밤하늘로 바뀐 뒤 찍는다
  const thumb = village.snapshot();
  const sum = summarize(life, DECK);
  // 염주에 남길 것: 이 생의 구슬 (한 해 한 글자)과 모닥불에서 꿴 기억 구슬 (나이·메아리·한 줄)
  const memories = life.memories.map((m) => ({ age: m.age, echo: m.kind === 'echo', text: { ko: m.text.ko, en: m.text.en } }));
  if (soul) { finishLife(soul, life, { thumb, finalWealth: Math.round(life.stats.wealth), karmicEndowment: !!(life.flags && life.flags.karmic_endowment), buriedStash: !!(life.flags && life.flags.buried_stash), beads: encodeBeads(beadsOf(life)), memories, lines: life.linesSeen.slice() }); store.saveSoul(soul); store.saveDex(addDex(store.loadDex(), life)); }
  window.__pl.done = (window.__pl.done || 0) + 1;
  for (;;) {
    const r = await ui.deathRecord({ life, sum, soul, peers, dynasty: store.loadDynasty() });
    if (soul && r.note) { soul.lives[soul.lives.length - 1].note = r.note; store.saveSoul(soul); }
    if (r.act === 'share') { await ui.share(life, soul, thumb); continue; }
    if (r.act === 'dynastyTree') {
      await ui.dynastyScreen({ dynasty: store.loadDynasty(), dex: store.loadDynastyDex() });
      continue;
    }
    if (r.act === 'dynasty') {
      let curDyn = store.loadDynasty();
      if (!curDyn) curDyn = createDynasty(life);
      const succ = prepareSuccessor({ parentLife: life, dynasty: curDyn });
      store.saveDynasty(succ.dynasty);
      if (soul) {
        soul.next = succ.birth;
        store.saveSoul(soul);
      }
      return 'next';
    }
    if (r.act === 'next') {
      const curDyn = store.loadDynasty();
      if (curDyn) {
        const dex = store.loadDynastyDex() || [];
        if (!dex.some((d) => d.id === curDyn.id)) dex.push(curDyn);
        store.saveDynastyDex(dex);
        store.saveDynasty(null);
      }
    }
    return r.act;
  }
}

async function main() {
  const boot = document.getElementById('boot');
  if (boot) boot.remove();   // index.html 의 「불러오는 중…」: 우리 모듈이 섰으니 거둔다
  for (;;) {
    if (practice) { await playLife(null); practice = null; history.replaceState(null, '', location.pathname); continue; }
    let soul = store.loadSoul();
    if (Q.get('from') === 'destiny' || sessionStorage.getItem('past_life_destiny')) {
      if (!soul || soul.ended) soul = newSoul();
      history.replaceState(null, '', location.pathname);
      let next = await playLife(soul);
      while (next === 'next' && !soul.ended) next = await playLife(soul);
      if (next === 'lineage' && (await ui.lineage(soul)) === 'newsoul') store.saveSoul(newSoul());
      continue;
    }
    const act = await ui.title({
      soul, dexCount: Object.keys(store.loadDex()).length, soundOn: () => S.sound,
      onLang: (l) => { S.lang = l; store.saveLang(l); document.documentElement.lang = l; ui.setLang(l); },
      onSound: () => { S.sound = !S.sound; store.saveSound(S.sound); },
      onSettings: openSettings,
    });
    if (act === 'dex') { await ui.dex(store.loadDex()); continue; }
    if (act === 'dynasty') { await ui.dynastyScreen({ dynasty: store.loadDynasty(), dex: store.loadDynastyDex() }); continue; }
    if (act === 'lineage') { if ((await ui.lineage(soul)) === 'newsoul') store.saveSoul(newSoul()); continue; }
    if (act === 'newsoul' || !soul || soul.ended) { soul = newSoul(); store.saveSoul(soul); }
    let next = await playLife(soul);
    while (next === 'next' && !soul.ended) next = await playLife(soul);
    if (next === 'lineage' && (await ui.lineage(soul)) === 'newsoul') store.saveSoul(newSoul());
  }
}
// 어디선가 멈추면 빈 화면 대신 다시 불러오기와 저장 지우기 단추를 보인다
main().catch((e) => {
  console.error('한 영혼의 여정: 진행이 멈췄다', e);
  for (const id of ['app', 'modal', 'intro']) document.getElementById(id).hidden = true;
  const sc = document.getElementById('screen');
  sc.className = 'night'; sc.hidden = false;
  sc.innerHTML = `<div class="sheet"><h1>${t(S.lang, 'title')}</h1><p>${t(S.lang, 'stuck')}</p>
    <div class="btns"><button class="primary" data-v="reload">${t(S.lang, 'reload')}</button><button data-v="wipe">${t(S.lang, 'wipe')}</button></div></div>`;
  sc.addEventListener('click', (ev) => {
    const v = ev.target.closest('[data-v]') && ev.target.closest('[data-v]').dataset.v;
    if (v === 'wipe') store.saveSoul(null);   // 도감은 읽을 때 맞는 칸만 남기니 두고, 여정만 지운다
    if (v) location.reload();
  });
});
