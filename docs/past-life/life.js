// 한 생 상태 기계 (설계 5·12장). 순수 함수: 같은 시드 + 같은 선택 = 같은 생
// 한 해의 순서: 0 사건(시작 줄·결정) → 1 정해진 나이 결정 → 2 잠시 멈춤 → 3 해 마무리(초점·되돌림·작은 일·죽음 굴림·해 넘기기)
// 결정·멈춤이 나오면 돌려주고, 다음 advance 가 같은 해 다음 순서부터 잇는다
import { sub } from './rng.js';
import { eraOf, groupOf } from './births.js';
import { shapeFor, yearHazard, healthMul } from './lifetable.js';
import { activeEvents } from './events.js';
import { drawCause } from './deaths.js';
import { pickCard, stageOf, slotAges, choiceOpen } from './cards.js';
import { AREAS } from './places.js';
import { chanceBonus, riskPenalty, startMods, echoEffects, echoCardKey, traceWeight, skillGain, talentYear, attrMods } from './traces.js';
import { autoFocus, focusStage, FOCUS_EFFECT, workSkill, ATTRS, ATTR_START, KNOW_SCHOOL, FOCUS_ATTR, clampAttr, KNOW_READ, attrShift, CRAFT_SKILLS, charmMul, focusYearEffects } from './focus.js';
import { contextOf } from './context.js';
import { statusOf, shiftStatus, refreshStatus } from './status.js';
import { settingOf } from './lands.js';

export const PAUSES = [5, 15, 30, 50, 70];
// 「지금」: 이 해를 살아서 넘기려는 생은 죽지 않고 여기서 멈춘다 (death.present). 결정성 때문에 오늘 날짜가 아닌 고정값
export const PRESENT = 2026;
const STATS = ['health', 'wealth', 'family', 'happy'];
const clamp = (x) => Math.max(0, Math.min(100, x));
const jot = (life, kind, text, extra = {}) => life.journal.push({ age: life.age, year: life.year, kind, text, ...extra });

// 그해 맥락 (context.js contextOf): life.ctx() 로 읽는다. 해가 바뀔 때만 새로 꺼낸다 (contextOf 도 캐시한다).
// 함수라 JSON·펼치기({...life})에 끼지 않게 숨긴 속성으로 둔다
function attachCtx(life) {
  let at = null, c = null;
  Object.defineProperty(life, 'ctx', {
    value: () => { if (at !== life.year) { at = life.year; c = contextOf(life.year, life.birth.area, life.birth.household); } return c; },
    enumerable: false, configurable: true, writable: true,
  });
  return life;
}
const worldOf = (life) => (life.ctx ? life.ctx() : contextOf(life.year, life.birth.area, life.birth.household));

// 시작 능력치 (sim2 설계 2.2): 시드로 고르게 + 지식은 배울 기회 (집안·시대) + 앞 생의 재능·인연
function startAttrs(birth, traces, ctx) {
  const r = sub(birth.seed, 'attrs'), m = attrMods(traces), out = {};
  for (const k of ATTRS) {
    const [lo, hi] = ATTR_START[k];
    out[k] = clampAttr(lo + r.int(hi - lo + 1) + (k === 'know' ? Math.round(KNOW_SCHOOL * ctx.school) : 0) + (m[k] || 0));
  }
  return out;
}

export function createLife({ birth, traces = [], noDeath = false, quiet = false }) {
  const r = sub(birth.seed, 'start');
  const stats = {
    health: Math.round(50 + r.range(-8, 8)),
    wealth: Math.round(clamp(birth.wealth + r.range(-8, 8))),
    family: Math.round(50 + r.range(-5, 5)),
    happy: Math.round(clamp(50 + startMods(traces).happy + r.range(-5, 5))),
  };
  const life = {
    birth, traces, noDeath, quiet, age: 0, year: birth.year, step: 0, stats, base: { wealth: birth.wealth },
    focus: null, focusYears: {}, flags: {}, kids: 0, wedWait: 0, skills: {}, dream: null, fulfilled: [], bond: null,
    slots: slotAges(birth.seed), seen: [], linesSeen: [], eventsSeen: [], eventsStarted: [], pausesDone: [],
    log: [], journal: [], history: [{ age: 0, ...stats }], pending: null, death: null,
    // 모닥불 (memory.js): 꿴 기억 구슬, 메아리로 짙어진 흔적 (traceKey → 횟수), 멈춤마다 그때의 일지 길이, 이 생에 이미 보인 메아리 줄
    memories: [], traceBoost: {}, pauseMarks: [], echoSeen: [],
  };
  attachCtx(life);
  // 능력치·신분 (sim2 설계 2.2·2.3). 생명표·죽음 굴림에는 들어가지 않는다
  life.attrs = startAttrs(birth, traces, life.ctx());
  life.status = statusOf(birth, life.ctx());
  jot(life, 'birth', null);
  return life;
}

export const setFocus = (life, id) => { life.focus = id; };
export const addNote = (life, s) => jot(life, 'note', { ko: s, en: s });
// 선택지마다 열렸는가 (choice.when, cards.js choiceOpen). 하나도 안 열렸으면(사건 카드가 그럴 수 있다) 모두 열린 것으로 본다 — 결정이 막히지 않게
export function openChoices(life, card) {
  const ctx = ctxOf(life, life.seen), open = card.choices.map((c) => choiceOpen(c, ctx));
  return open.some(Boolean) ? open : open.map(() => true);
}
// 자동 결정이 고를 선택지 (시드로 정해진다). 열린 선택지 가운데서 고른다: 다 열려 있으면 예전과 같은 수가 나온다
export function autoChoice(life, card) {
  const pool = openChoices(life, card).map((o, i) => (o ? i : -1)).filter((i) => i >= 0);
  return pool[sub(life.birth.seed, life.age, 'auto', card.id).int(pool.length)];
}

// 카드·작은 일 줄 조건의 맥락 (cards.js eligible).
// 농사 전 땅의 수렵 무리(birth.household 'band', households.js beforeFarming)는 그해 묶음이 고대·중세라도 수렵 묶음 카드를 본다 (왕·성벽·쇠붙이 카드가 안 나오게).
//   무리로 태어난 생은 평생 무리로 산다: 살다가 그 땅에 농사가 닿거나(오스트레일리아 1788) 묶음 경계(−8000)를 넘어도 수렵 묶음 그대로 (일부러)
function ctxOf(life, seen) {
  const b = life.birth, w = worldOf(life);
  return {
    stage: stageOf(life.age), age: life.age, year: life.year, era: eraOf(life.year).id, group: b.household === 'band' ? 'forager' : groupOf(life.year),
    region: b.region, area: b.area, coast: !!AREAS[b.area].coast, tags: b.tags, sex: b.sex,
    flags: { ...life.flags, kids: life.kids > 0 }, traces: life.traces, dream: life.dream, stats: life.stats, seen,
    attrs: life.attrs, status: life.status, zone: w.zone, setting: settingOf(b.household, b.group || groupOf(b.year)), war: w.war.level,
  };
}

// 첫돌 줄: 그 땅·시대의 첫돌 풍습 한 줄 (contextOf 의 firstYear, context_data.js). 예전의 「아이 중 약 ○%가 이 날을 맞았어요」 통계 줄은 뺐다 (sim2 설계 5.3)
function survivedLine(life) {
  const f = worldOf(life).firstYear;
  return f && f.ko && f.en ? { ko: f.ko, en: f.en } : { ko: '첫돌이에요. 한 해를 무사히 넘겼어요.', en: 'A first birthday. One whole year, safely through.' };
}

// 혼인과 아이: 카드(같이 살자는 사람·새 식구)는 한 생에 한 번씩이라 그것만으로는 드물다. 해마다 조용히 굴린다.
// 근대 이전은 대부분 일찍 혼인했고 현대는 조금 덜, 조금 늦게. 가족 수치가 높을수록 잦다. 카드에서 혼인을 미루면 몇 해 쉰다
// 목표 (40살까지 산 생, 자동 결정): 혼인 60~85%, 아이 50~80%
const KIN = {
  wed: [
    { ko: '한 사람과 함께 살기 시작했어요. 눈을 뜨면 곁에 누군가 있었어요.', en: 'You began to share your life with someone. When you woke, someone was beside you.' },
    { ko: '누군가와 짝을 맺었어요. 잔치는 소박했고, 다들 오래 웃었어요.', en: 'You and someone became partners. The celebration was simple, and everyone laughed a long while.' },
  ],
  first: [{ ko: '첫아이가 태어났어요. 작은 손이 당신 손가락을 꼭 쥐었어요.', en: 'Your first child was born. A tiny hand held on tight to your finger.' }],
  more: [
    { ko: '식구가 하나 더 늘었어요. 집이 조금 좁아지고, 조금 더 시끄러워졌어요.', en: 'The family grew by one. Home got a little smaller and a little louder.' },
    { ko: '또 아이가 태어났어요. 큰아이가 아기를 들여다보느라 밥도 잊었어요.', en: 'Another baby arrived. The eldest kept gazing at the newcomer and forgot to eat.' },
  ],
};
// 친화력은 굴림 확률과 곁이 오르는 양에 같은 배율 (0.8 + 친화력/250)
function kinYear(life) {
  const a = life.age, s = life.stats, modern = groupOf(life.year) === 'modern';
  const r = sub(life.birth.seed, a, 'kin');
  const fam = Math.max(0.6, Math.min(1.4, s.family / 50)), cm = charmMul(life.attrs.charm);
  if (!life.flags.married) {
    const weds = sub(life.birth.seed, 'wed').next() < (modern ? 0.65 : 0.74);   // 평생 짝 없이 사는 사람도 있다 (생마다 한 번 정한 수)
    if (weds && a >= (modern ? 20 : 16) && a < 45 && a >= life.wedWait && r.chance((modern ? 0.12 : 0.2) * fam * cm)) {
      life.flags.married = true; s.family = clamp(s.family + 6 * cm);
      jot(life, 'kin', r.pick(KIN.wed), { kin: 'wed' });
    }
  } else if (a < 45 && life.kids < 6 && r.chance((modern ? 0.09 : 0.11) * fam * (life.kids >= 2 ? 0.5 : 1) * cm)) {
    life.kids++; s.family = clamp(s.family + 4 * cm);
    jot(life, 'kin', life.kids === 1 ? KIN.first[0] : r.pick(KIN.more), { kin: life.kids === 1 ? 'first' : 'more' });
  }
}

// 해 마무리. 죽으면 true
function endYear(life, lines) {
  const a = life.age, seed = life.birth.seed, s = life.stats;
  if (a >= 6) {   // 올해의 초점
    const f = life.focus || autoFocus(s), st = focusStage(a);
    // 한 해 효과는 focus.js focusYearEffects 하나에서 (화면의 올해의 패도 같은 함수): 「일」의 재산 × 그해 품삯 × 손재주 배율, 곁 × 친화력 배율,
    // 몸(health)은 배율 없이 그대로 (생명표 맞춤). 능력치: 일 → 손재주, 가족·이웃 → 친화력, 배우기 → 지식 × 그해 배울 기회 (남은 칸에 비례)
    const fx = focusYearEffects(life, f, worldOf(life));
    for (const k of Object.keys(FOCUS_EFFECT[f][st])) s[k] = clamp(s[k] + fx[k]);
    for (const k of Object.keys(FOCUS_ATTR[f] || {})) life.attrs[k] = clampAttr(life.attrs[k] + fx[k]);
    readCheck(life);
    life.focusYears[f] = (life.focusYears[f] || 0) + 1;
    const sk = f === 'learn' ? 'letters' : f === 'work' && st !== 'child' ? workSkill(life.birth.tags) : null;
    if (sk) life.skills[sk] = (life.skills[sk] || 0) + 0.25;
    // 모닥불 메아리로 짙어진 재능이 맞는 한 해면 마음이 조금 더 (일 = 집안 재주, 배우기 = 글, 쉬기 = 노래). 몸에는 닿지 않는다
    const tk = sk || (f === 'rest' ? 'music' : null);
    if (tk) s.happy = clamp(s.happy + talentYear(tk, life.traces, life.traceBoost));
  }
  // 되돌림: 해마다 6%씩 기준값 쪽으로 (한 번의 선택이 평생 가지 않게). 재산의 기준은 태어난 집안
  for (const k of STATS) { const target = k === 'wealth' ? life.base.wealth : 50; s[k] = clamp(s[k] + (target - s[k]) * 0.06); }
  kinYear(life);
  // 작은 일 한 줄 (해마다 0.55)
  const rl = sub(seed, a, 'line');
  if (lines.length && rl.chance(0.55)) {
    const line = pickCard(lines, ctxOf(life, life.linesSeen), rl);
    if (line) { life.linesSeen.push(line.id); jot(life, 'line', line.text); }
  }
  // 죽음 굴림: 그해 달력 연도의 시대·지역 생명표 × 건강 배율 + 사건 위험률
  const base = yearHazard(shapeFor(eraOf(life.year).id, life.birth.region), a) * healthMul(s.health);
  const evs = activeEvents(life.year, life.birth.region, life.birth.area).filter((e) => e.hazard > 0);
  const extra = evs.reduce((t, e) => t + e.hazard, 0);
  const r = sub(seed, a, 'death');
  const roll = r.next();
  if (a >= 119 || (!life.noDeath && roll < 1 - Math.exp(-(base + extra)))) {
    const cause = r.next() < extra / (base + extra)
      ? r.weighted(evs, (e) => e.hazard).cause
      : drawCause(r, { age: a, group: groupOf(life.year), sex: life.birth.sex, tags: life.birth.tags, coast: !!AREAS[life.birth.area].coast, married: !!life.flags.married, kids: life.kids });
    life.death = { age: a, year: life.year, cause, line: r.int(2) };
    jot(life, 'death', null);
    return true;
  }
  if (life.year >= PRESENT) {   // 지금에 닿았다: 사인 없이 멈추고, 죽음 줄 대신 맺는 줄을 남긴다
    life.death = { age: a, year: life.year, cause: null, line: 0, present: true };
    jot(life, 'present', { ko: `${PRESENT}년, 이 생은 아직 이어지고 있어요.`, en: `${PRESENT} — this life is still going on.` });
    return true;
  }
  life.age++; life.year++; life.step = 0;
  refreshStatus(life);   // 그해 신분표의 이름·묶임으로 (예: 1866년 북아메리카 노예 → 하인)
  life.history.push({ age: life.age, ...s });
  if (life.age === 1) jot(life, 'stat', survivedLine(life));
  return false;
}

export function advance(life, deck, { lines = [], yearly = false } = {}) {
  if (life.death) return { type: 'death', death: life.death };
  if (life.pending) return { type: 'card', card: life.pending.card };
  for (let guard = 0; guard < 400; guard++) {
    const seed = life.birth.seed, a = life.age;
    if (life.step === 0) {   // 역사 사건: 시작 줄(한 생에 한 번), 결정(해마다 0.6, 다섯 살부터)
      life.step = 1;
      const r = sub(seed, a, 'event');
      const evs = activeEvents(life.year, life.birth.region, life.birth.area);
      // 시작 줄은 새 소식이라, 시작한 지 5년 넘은 사건(태어나기 한참 전에 시작한 것)은 줄 없이 넘긴다
      for (const e of evs) if (!life.eventsStarted.includes(e.id)) { life.eventsStarted.push(e.id); if (life.year - e.from <= 5) jot(life, 'event', e.start, { event: e.id }); }
      for (const e of evs) {
        if (life.eventsSeen.includes(e.id)) continue;
        const card = deck.find((c) => c.event === e.id);
        if (!card || a < ((card.when && card.when.minAge) ?? 5)) continue;   // 아직 어리면 아껴 둔다 (사건이 이어지면 다섯 살부터 나온다)
        if (!r.chance(e.p ?? 0.6)) continue;
        life.eventsSeen.push(e.id);
        life.pending = { card, kind: 'event' };
        return { type: 'card', card };
      }
    }
    if (life.step === 1) {   // 정해진 나이 결정
      life.step = 2;
      if (life.slots.includes(a)) {
        const card = pickCard(echoDeck(deck, life), ctxOf(life, life.seen), sub(seed, a, 'card'));
        if (card) { life.pending = { card, kind: 'slot' }; return { type: 'card', card }; }
      }
    }
    if (life.step === 2) {   // 잠시 멈춤 (모닥불). 그때의 일지 길이를 적어 둔다: 기억 후보는 앞 멈춤 표시부터 이 표시까지 (memory.js)
      life.step = 3;
      if (!life.quiet && PAUSES.includes(a) && !life.pausesDone.includes(a)) { life.pausesDone.push(a); life.pauseMarks.push({ age: a, j: life.journal.length }); return { type: 'pause', age: a }; }
    }
    if (endYear(life, lines)) return { type: 'death', death: life.death };
    if (yearly) return { type: 'year', age: life.age };
  }
  throw new Error('advance: 400년 넘게 돌았다');
}

// 모닥불에서 꿈·인연 메아리를 꿰었으면 그 꿈을 이루는 카드·그 인연 카드가 잘 나온다 (가중치 ×(1 + boost), 많아도 ×3).
// 짙어진 꿈·인연이 없으면 덱을 그대로 넘긴다 (같은 시드 = 예전과 같은 카드)
function echoDeck(deck, life) {
  const b = life.traceBoost || {};
  if (!Object.keys(b).some((k) => b[k] > 0 && (k.startsWith('dream:') || k.startsWith('bond:')))) return deck;
  return deck.map((c) => { const k = echoCardKey(c, b); return k ? { ...c, weight: (c.weight ?? 1) * traceWeight(b[k]) } : c; });
}

function addEffects(a, b) {
  const out = { ...a };
  for (const [k, v] of Object.entries(b || {})) out[k] = (out[k] || 0) + v;
  return out;
}

// 지식이 KNOW_READ(60) 에 닿으면 글을 읽는다 (설계 2.2): 카드의 「글을 배운다」 선택과 같은 깃발. 한 번 세우면 내리지 않는다
function readCheck(life) {
  if (life.attrs && life.attrs.know >= KNOW_READ) life.flags.literate = true;
}

// 운에 맡기는 선택의 성공 확률 (sim2 설계 2.2): p + (행운 − 50)/250 + 재능 흔적 덤 [+ 장인 재주 선택이면 (손재주 − 50)/250], 0.05~0.95.
// 확률 없는 선택은 null. 화면의 「운에 맡김 62%」도 이것
export function chanceOf(life, c) {
  if (!c || !c.chance) return null;
  const a = life.attrs || {};
  let p = c.chance.p + attrShift(a.luck) + chanceBonus(c, life.traces, life.traceBoost);
  if (CRAFT_SKILLS.includes(c.skill)) p += attrShift(a.skill);
  return Math.max(0.05, Math.min(0.95, p));
}

// 지금 결정의 i 번째 선택지를 고른다. 결과는 인생 기록에 결정 줄로 남는다
// 효과 키: health·wealth·family·happy (0~100 수치) · luck·charm·know·skill (능력치, 더하고 0~100에서 자른다) · status (신분 ±계단)
// 잠긴 선택지(choice.when 이 안 맞음)나 없는 선택지를 고르면 아무것도 하지 않고 null (결정은 그대로 남는다)
export function choose(life, i) {
  if (!life.pending) return null;   // 이미 고른 결정 (자동 결정 타이머와 클릭이 겹칠 때)
  const { card } = life.pending;
  const c = card.choices[i];
  if (!c || !openChoices(life, card)[i]) return null;
  let effects = { ...(c.effects || {}) }, result = c.result, ok;
  if (c.chance) {   // 행운이 높거나 재능 흔적이 맞으면 성공이 잦다 (모닥불 메아리로 짙어졌으면 더)
    ok = sub(life.birth.seed, life.age, 'choice', card.id, i).next() < chanceOf(life, c);
    const branch = ok ? c.chance.win : c.chance.lose;
    effects = addEffects(effects, branch.effects);
    result = branch.result;
  }
  const pen = riskPenalty(c, life.traces, life.traceBoost);
  if (pen) effects.happy = (effects.happy || 0) + pen;
  effects = addEffects(effects, echoEffects(card, c, life.traces, life.traceBoost));   // 짙어진 재능·꿈·인연의 덤 (마음·곁만)
  if (effects.family > 0) effects.family *= charmMul(life.attrs && life.attrs.charm);   // 곁이 오를 때는 친화력 배율
  for (const k of STATS) if (effects[k]) life.stats[k] = clamp(life.stats[k] + effects[k]);
  if (life.attrs) { for (const k of ATTRS) if (effects[k]) life.attrs[k] = clampAttr(life.attrs[k] + effects[k]); readCheck(life); }
  for (const f of c.set || []) life.flags[f] = true;
  for (const f of c.unset || []) delete life.flags[f];
  // 혼인 카드에서 혼인하지 않는 쪽을 고르면 몇 해는 조용한 혼인도 쉰다 (kinYear)
  if (!(c.set || []).includes('married') && card.choices.some((x) => (x.set || []).includes('married'))) life.wedWait = life.age + 4;
  if (c.kids) life.kids += c.kids;
  if (c.skill) life.skills[c.skill] = (life.skills[c.skill] || 0) + skillGain(c, life.traces, life.traceBoost);
  if (c.dream && !life.fulfilled.includes(c.dream)) life.dream = c.dream;
  if (c.fulfill) { life.fulfilled.push(c.fulfill); if (life.dream === c.fulfill) life.dream = null; }
  if (c.bond) life.bond = c.bond;
  life.seen.push(card.id);
  life.log.push({ age: life.age, year: life.year, card: card.id, choice: i, ok });
  // short: 모닥불 기억 구슬에 쓰는 한 줄 · about: 기억 구슬 그림 (혼인·아이·사건)
  const about = (c.set || []).includes('married') ? { about: 'wed' } : c.kids ? { about: 'baby' } : card.event ? { about: 'event' } : {};
  jot(life, 'decision', { ko: `${card.title.ko} · ${c.text.ko} — ${result.ko}`, en: `${card.title.en} · ${c.text.en} — ${result.en}` },
    { card: card.id, choice: i, short: { ko: `${card.title.ko} · ${c.text.ko}`, en: `${card.title.en} · ${c.text.en}` }, ...about });
  if (effects.status && life.status) shiftStatus(life, effects.status);   // 결정 줄 다음에 신분 줄
  life.history[life.history.length - 1] = { age: life.age, ...life.stats };
  life.pending = null;
  return { result, effects, ok };
}

// 요약: 수치 변화가 큰 결정 셋 (나이 순서), 가장 높은 수치, 가장 행복했던 해, 가장 오래 쓴 초점, 모닥불에서 꿴 기억 구슬
export function summarize(life, deck) {
  const byId = new Map(deck.map((c) => [c.id, c]));
  const size = (l) => { const ch = (byId.get(l.card) && byId.get(l.card).choices[l.choice]) || {}; return STATS.reduce((s, k) => s + Math.abs((ch.effects || {})[k] || 0), 0) + (ch.chance ? 5 : 0); };
  const picks = [...life.log].sort((a, b) => size(b) - size(a)).slice(0, 3).sort((a, b) => a.age - b.age);
  const best = STATS.reduce((m, k) => (life.stats[k] > life.stats[m] ? k : m), 'health');
  const happiest = life.history.reduce((m, h) => (h.happy > m.happy ? h : m), life.history[0]).age;
  const top = Object.entries(life.focusYears).sort((a, b) => b[1] - a[1])[0];
  const memories = (life.memories || []).map((m) => ({ ...m, text: { ...m.text } }));
  return { picks, best, years: life.death.age, kids: life.kids, married: !!life.flags.married, happiest, topFocus: top ? top[0] : null, focusYears: life.focusYears, memories };
}
