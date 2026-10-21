// 카드 고르기 (설계 5장): 정해진 나이 13칸, 조건에 맞는 카드 가운데 가중치대로
import { sub } from './rng.js';
import { traceKey } from './traces.js';

export const STAGES = ['baby', 'child', 'teen', 'adult', 'middle', 'old'];
export const stageOf = (age) => (age < 5 ? 'baby' : age < 13 ? 'child' : age < 20 ? 'teen' : age < 40 ? 'adult' : age < 60 ? 'middle' : 'old');

export const SLOTS = [3, 7, 11, 14, 17, 21, 26, 32, 40, 48, 56, 65, 75];
// 시드로 ±1 흔든다 (첫 칸은 2~4)
export function slotAges(seed) {
  const r = sub(seed, 'slots');
  return SLOTS.map((a, i) => (i === 0 ? 2 + r.int(3) : a + r.int(3) - 1));
}

// when 조건 (설계 7장 카드 모양, 작은 일 줄도 같다): eraGroups · eras · regions · areas · coast · tags(하나라도) · sex · flags · notFlags · trace ·
// minAge · maxAge · stat · minYear · maxYear (그해 달력 연도. 물건·풍습이 퍼진 해부터만 — 예: 일터 컴퓨터는 1985년부터)
// sim2 (설계 2.2·2.3·3.2·4.2, life.js ctxOf 가 넘긴다): minKnow · maxKnow (지식) · minStatus · maxStatus (신분 순위 1~5) · bound (true 매인 몸만 / false 매이지 않은 사람만) ·
//   war (그해 전쟁 수준이 이 값 이상) · setting (사는 자리 하나 또는 여럿, lands.js SETTINGS) · zones (문화권, context_data.js ZONES).
//   맥락에 그 값이 없으면(옛 모양 맥락) 새 조건이 붙은 카드는 나오지 않는다
// 선택지에도 같은 when 을 달 수 있다 (choice.when, 설계 2.2 「minKnow 가 선택지를 연다」 · 2.3 「매인 몸이면 떠나기 선택지가 막힌다」):
//   choiceOpen 이 false 인 선택지는 잠긴다 (life.js openChoices · autoChoice · choose). 열린 선택지가 하나도 없는 카드는 나오지 않는다
export function eligible(card, ctx) {
  if (card.event) return false;   // 사건 카드는 life.js 가 사건 id 로 따로 꺼낸다
  const stages = Array.isArray(card.stage) ? card.stage : [card.stage];
  if (!stages.includes(ctx.stage)) return false;
  if (ctx.seen.includes(card.id)) return false;
  if (card.when && !condOk(card.when, ctx)) return false;
  return !card.choices || card.choices.some((c) => choiceOpen(c, ctx));   // 작은 일 줄은 선택지가 없다
}
export const choiceOpen = (choice, ctx) => !choice.when || condOk(choice.when, ctx);

// when 조건 하나하나 (카드·선택지·작은 일 줄이 같이 쓴다)
export function condOk(w, ctx) {
  if (w.eraGroups && !w.eraGroups.includes(ctx.group)) return false;
  if (w.eras && !w.eras.includes(ctx.era)) return false;
  if (w.regions && !w.regions.includes(ctx.region)) return false;
  if (w.areas && !w.areas.includes(ctx.area)) return false;
  if (w.coast && !ctx.coast) return false;
  if (w.tags && !w.tags.some((t) => ctx.tags.includes(t))) return false;
  if (w.sex && w.sex !== ctx.sex) return false;
  if (w.flags && !w.flags.every((f) => ctx.flags[f])) return false;
  if (w.notFlags && w.notFlags.some((f) => ctx.flags[f])) return false;
  if (w.trace && !ctx.traces.some((t) => traceKey(t) === w.trace)) return false;
  if (w.minAge != null && ctx.age < w.minAge) return false;
  if (w.maxAge != null && ctx.age > w.maxAge) return false;
  if (w.minYear != null && ctx.year < w.minYear) return false;
  if (w.maxYear != null && ctx.year > w.maxYear) return false;
  if (w.stat) for (const [k, [lo, hi]] of Object.entries(w.stat)) if (ctx.stats[k] < lo || ctx.stats[k] > hi) return false;
  const know = ctx.attrs ? ctx.attrs.know : NaN, rank = ctx.status ? ctx.status.rank : NaN;
  if (w.minKnow != null && !(know >= w.minKnow)) return false;
  if (w.maxKnow != null && !(know <= w.maxKnow)) return false;
  if (w.minStatus != null && !(rank >= w.minStatus)) return false;
  if (w.maxStatus != null && !(rank <= w.maxStatus)) return false;
  if (w.bound != null && (!ctx.status || !!ctx.status.bound !== !!w.bound)) return false;
  if (w.war != null && !(ctx.war >= w.war)) return false;
  if (w.setting != null && ![].concat(w.setting).includes(ctx.setting)) return false;
  if (w.zones && !w.zones.includes(ctx.zone)) return false;
  return true;
}

// 가중치: 기본 1 (card.weight), 시대·지역·땅·집안(문화권·사는 자리 포함)이 정해진 카드 ×2, 흔적 카드 ×3
function weightOf(card) {
  const w = card.when || {};
  let k = card.weight ?? 1;
  if (w.eraGroups || w.eras || w.regions || w.areas || w.tags || w.zones || w.setting) k *= 2;
  if (w.trace) k *= 3;
  return k;
}
export function pickCard(deck, ctx, rng) {
  return rng.weighted(deck.filter((c) => eligible(c, ctx)), weightOf);
}
