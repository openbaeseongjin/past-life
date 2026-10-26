// 앞 생의 흔적 (설계 5장). 시작 수치·특별 카드·성공 확률·행복에만 작게 들어간다. 뽑기·생명표·죽음 굴림은 건드리지 않는다
import { CAUSES } from './deaths.js';

export const FEARS = ['sea', 'fire', 'war', 'plague', 'hunger', 'heights', 'beast'];
export const TALENTS = ['craft', 'sea', 'letters', 'heal', 'music', 'trade', 'farm', 'fight'];
export const DREAMS = ['sea', 'letters', 'travel', 'city', 'music'];
export const BONDS = ['friend', 'rival'];
export const KIND_TEXT = { fear: ['두려움', 'Fear'], talent: ['재능', 'Talent'], dream: ['못다 한 꿈', 'Unfinished dream'], bond: ['인연', 'Bond'], karmic: ['전생의 각인', 'Karmic Imprint'] };
export const TRACE_TEXT = {
  fear: { sea: ['바다가 무섭다', 'afraid of the sea'], fire: ['불이 무섭다', 'afraid of fire'], war: ['군인이 무섭다', 'afraid of soldiers'], plague: ['아픈 사람 곁이 무섭다', 'afraid of sickness'], hunger: ['빈 그릇이 무섭다', 'afraid of an empty bowl'], heights: ['높은 곳이 무섭다', 'afraid of heights'], beast: ['짐승이 무섭다', 'afraid of wild animals'] },
  talent: { craft: ['손재주', 'clever hands'], sea: ['바다 감각', 'a feel for the sea'], letters: ['글 솜씨', 'a way with words'], heal: ['약초 지식', 'healing hands'], music: ['노래', 'a singing voice'], trade: ['셈', 'a head for numbers'], farm: ['땅 냄새', 'a nose for soil'], fight: ['싸움 감각', 'quick fists'] },
  dream: { sea: ['배를 타 보고 싶었다', 'wanted to sail'], letters: ['글을 배우고 싶었다', 'wanted to read'], travel: ['먼 곳에 가 보고 싶었다', 'wanted to see far places'], city: ['큰 도시에 살아 보고 싶었다', 'wanted to live in a city'], music: ['노래로 이름을 남기고 싶었다', 'wanted to be known for a song'] },
  bond: { friend: ['앞 생의 벗', 'a friend from before'], rival: ['앞 생의 원수', 'a rival from before'] },
  karmic: { vow: ['전생의 결단과 맹세', 'a vow from a past life'] },
};
export const traceKey = (t) => (t ? `${t.kind}:${t.key}` : null);

// 죽을 때: 사인 두려움 > 영혼의 결단 각인 > 못다 한 꿈 > 마지막 인연 > 3번 이상 연습한 재능 가운데 가장 많은 것
export function computeTraces(life) {
  const out = [];
  const fear = life.death && CAUSES[life.death.cause] && CAUSES[life.death.cause].fear;
  if (fear) out.push({ kind: 'fear', key: fear });
  if (life.willEcho) out.push({ kind: 'karmic', key: 'vow', vow: life.willEcho.entity || life.willEcho.intent, entity: life.willEcho.entity, intent: life.willEcho.intent });
  if (life.dream && !life.fulfilled.includes(life.dream)) out.push({ kind: 'dream', key: life.dream });
  if (life.bond) out.push({ kind: 'bond', key: life.bond.kind, who: life.bond.who });
  const best = Object.entries(life.skills || {}).filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1])[0];
  if (best) out.push({ kind: 'talent', key: best[0] });
  return out.slice(0, 3);
}

const has = (traces, kind, key) => traces.some((t) => t.kind === kind && t.key === key);
export const startMods = (traces) => ({ happy: traces.some((t) => t.kind === 'talent' || t.kind === 'karmic') ? 5 : 0 });
// 시작 능력치에 닿는 흔적 (sim2 설계 2.2): 재능 → 이어지는 능력치 +8, 인연 friend → 친화력 +5. 두려움·꿈·원수는 닿지 않는다
export const TALENT_ATTR = { letters: 'know', heal: 'know', craft: 'skill', farm: 'skill', sea: 'skill', fight: 'skill', music: 'charm', trade: 'charm' };
export function attrMods(traces) {
  const out = {}, add = (k, v) => { out[k] = (out[k] || 0) + v; };
  for (const t of traces || []) {
    if (t.kind === 'talent' && TALENT_ATTR[t.key]) add(TALENT_ATTR[t.key], 8);
    if (t.kind === 'bond' && t.key === 'friend') add('charm', 5);
    if (t.kind === 'karmic' && t.key === 'vow') {
      add('know', 4);
      add('skill', 4);
      add('happy', 4);
    }
  }
  return out;
}
// 모닥불에서 푸른 메아리 구슬을 고를 때마다 그 흔적이 짙어진다: boost 1당 ×1.5 (복리), 많아도 ×2.5 (boost = life.traceBoost, 열쇠는 traceKey)
// 짙어진 흔적은 갈림길 선택(choose)·카드 뽑기·올해의 패 마음에만 닿는다. 몸(health)과 죽음 굴림에는 절대 닿지 않는다
export const BOOST_STEP = 1.5, BOOST_MAX = 2.5;
export const boostMul = (n) => Math.min(BOOST_MAX, BOOST_STEP ** Math.max(0, Number.isFinite(n) ? n : 0));
const lvl = (boost, key) => { const n = Number((boost || {})[key]); return Number.isFinite(n) && n > 0 ? n : 0; };
// 짙음 표시 1~3 (●○○ → ●●○ → ●●●): 메아리를 두 번 꿰면 가득
export const traceLevel = (boost, key) => 1 + Math.min(2, lvl(boost, key));
// 덤 크기: base × (배수 − 1) → boost 0·1·2·3 이면 base 4 기준 0·2·5·6
export const echoExtra = (n, base) => Math.round(base * (boostMul(n) - 1));
// 꿈·인연 카드 뽑기 가중치 배수: ×(1 + boost), 많아도 ×3
export const traceWeight = (n) => Math.min(3, 1 + (Number.isFinite(n) && n > 0 ? n : 0));
export const chanceBonus = (choice, traces, boost = null) => (choice.skill && has(traces, 'talent', choice.skill) ? 0.15 * boostMul(lvl(boost, `talent:${choice.skill}`)) : 0);
export const riskPenalty = (choice, traces, boost = null) => (choice.risk && has(traces, 'fear', choice.risk) ? -8 * boostMul(lvl(boost, `fear:${choice.risk}`)) : 0);
// 재능 흔적이 맞는 선택에서 늘어나는 재주 (짙으면 더): 1 × 배수
export const skillGain = (choice, traces, boost = null) => (choice.skill && has(traces, 'talent', choice.skill) ? boostMul(lvl(boost, `talent:${choice.skill}`)) : 1);
// 짙어진 재능이 맞는 한 해 (일 = 집안 재주, 배우기 = 글, 쉬기 = 노래): 마음 + (배수 − 1)
export const talentYear = (skill, traces, boost = null) => (skill && has(traces, 'talent', skill) ? boostMul(lvl(boost, `talent:${skill}`)) - 1 : 0);
// 짙어진 흔적이 갈림길 선택에 더하는 덤 (마음·곁만):
//   재능: 맞는 선택에 확률이 없으면 마음 덤 (확률이 있으면 chanceBonus 가 맡는다) · 꿈: 이루는 선택의 마음 덤 · 인연: 인연 카드·인연 선택의 좋은 곁·마음에 덤
export function echoEffects(card, choice, traces, boost = null) {
  const out = {}, add = (k, v) => { if (v) out[k] = (out[k] || 0) + v; };
  if (choice.skill && !choice.chance && has(traces, 'talent', choice.skill)) add('happy', echoExtra(lvl(boost, `talent:${choice.skill}`), 4));
  if (choice.fulfill && has(traces, 'dream', choice.fulfill)) add('happy', echoExtra(lvl(boost, `dream:${choice.fulfill}`), 6));
  const w = card && card.when && card.when.trace, bond = w && w.startsWith('bond:') ? w.slice(5) : choice.bond ? choice.bond.kind : null;
  if (bond && has(traces, 'bond', bond)) {
    const n = lvl(boost, `bond:${bond}`), eff = choice.effects || {};
    for (const k of ['family', 'happy']) if (eff[k] > 0) add(k, echoExtra(n, 4));
  }
  return out;
}
// 짙어진 꿈·인연이 닿는 카드 (꿈: 그 꿈 흔적 카드·이루는 선택이 있는 카드, 인연: 그 인연 흔적 카드·그 인연을 맺는 선택이 있는 카드)
export function echoCardKey(card, boost) {
  const keys = Object.keys(boost || {}).filter((k) => lvl(boost, k) && (k.startsWith('dream:') || k.startsWith('bond:')));
  for (const k of keys) {
    const [kind, key] = k.split(':');
    if (card.when && card.when.trace === k) return k;
    if (card.choices.some((c) => (kind === 'dream' ? c.fulfill === key : c.bond && c.bond.kind === key))) return k;
  }
  return null;
}

// 카드에 붙일 「앞 생의 흔적」 표시
export function badgeFor(card, traces) {
  if (card.when && card.when.trace) return traces.find((t) => traceKey(t) === card.when.trace) || null;
  for (const c of card.choices) {
    if (c.risk && has(traces, 'fear', c.risk)) return traces.find((t) => t.kind === 'fear' && t.key === c.risk);
    if (c.skill && has(traces, 'talent', c.skill)) return traces.find((t) => t.kind === 'talent' && t.key === c.skill);
  }
  return null;
}
