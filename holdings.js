// 재산을 살림으로 (sim2 설계 2.4): 재산 점수(0~100) → 그 땅·시대 단위의 살림 2~3개. three·DOM 없는 순수 모듈 (Node 시험: test/holdings.test.mjs)
// holdingsOf(wealth, ctx, household) → [{ id, n, unit:{ko,en}, name:{ko,en}, value }]
//   ctx 는 contextOf(year, area, household). 그 집안이 가질 만한 품목(ctx.goods 의 for)을 집안마다 정한 차례(FILL_ORDER)로 앞에서 셋까지 고르고,
//   재산을 정해진 몫(셋이면 5:3:2, 둘이면 6:4)으로 나눠 품목 값(value: 한 단위가 재산 몇 점)으로 센다.
//   몫이 고정이라 재산이 늘면 품목마다 수가 줄지 않는다. 0개인 품목도 남긴다(「소 없음」) — 목록이 재산에 따라 들쭉날쭉하지 않게.
//   재산 10 이하는 「가진 것 거의 없음 · ○○ 옷 한 벌」 꼴이다.
//   돈(coin)은 그해 물가(ctx.econ.price)를 곱한다: 같은 살림이라도 값이 오른 해에는 닢 수가 많다. 땅·가축·집은 물건이라 물가를 곱하지 않는다.
// wealthToUnits(delta, ctx, household?) → { n, unit, name }: 재산 Δ → 그 땅 돈 (예 1347 잉글랜드 Δ4 → 은화 5닢, 그해 물가 1.2). 0.5 넘는 Δ 는 적어도 한 단위
//   unit 은 세는 말(닢 · pennies), name 은 돈 이름(은화 · silver pennies). 화면의 「은화 +5닢」은 둘 다 써야 한다 → wealthText 가 그 글
//   household 를 주면 holdingsOf 와 같은 값표를 쓴다 (농사 전 땅의 수렵 무리)
// wealthText(delta, ctx, lang, household?) → 「은화 +5닢」 · '+5 silver pennies' (Δ 가 0 단위면 '')
// holdingText(item, lang) · holdingsText(list, lang): 살림 한 줄 (화면은 작업 4가 그린다. 이 글은 기본꼴)
import { GOODS_TEMPLATE, GOODS_NAMES, GOODS_UNITS, GROUP_VALUES } from './context_data.js';

export const NONE_MAX = 10;
const NONE = { ko: '가진 것 거의 없음', en: 'next to nothing' };
// 집안마다 채우는 차례 (설계 2.4: 농사 땅→가축→돈 · 장인 연장·가게→돈 · 유목 가축→천막 · 공장·사무 돈→집). 수렵 무리는 돌날→가죽→조개 구슬
export const FILL_ORDER = {
  farm: ['land', 'beast', 'coin', 'home'], herd: ['beast', 'tent', 'coin', 'home', 'land'],
  fish: ['boat', 'coin', 'home'], sail: ['boat', 'coin', 'home'],
  craft: ['tools', 'shop', 'coin', 'home'], trade: ['stock', 'shop', 'coin', 'home'], shop: ['shop', 'stock', 'coin', 'home'],
  serve: ['coin', 'garb', 'home'], elite: ['land', 'home', 'beast', 'coin'],
  factory: ['coin', 'home', 'garb'], office: ['coin', 'home'], pro: ['coin', 'home'],
  band: ['tools', 'hides', 'coin'],
};
const SHARES = [null, [1], [0.6, 0.4], [0.5, 0.3, 0.2]];

// 2 유효 숫자 (100 넘는 수): 1,234,567원 → 1,200,000원. 단조롭다 (x 가 늘면 줄지 않는다)
function nice(x) {
  if (!(x > 0)) return 0;
  if (x < 100) return Math.round(x);
  const step = 10 ** (Math.floor(Math.log10(x)) - 1);
  return Math.round(x / step) * step;
}
const priceOf = (ctx) => (ctx.econ && ctx.econ.price > 0 ? ctx.econ.price : 1);

// 농사 전 땅(FARM_FROM)의 수렵 무리: contextOf 는 고대·중세 값표에서 비슷한 집안(목축)의 품목을 빌려 주지만, 사냥하는 무리는 캥거루를 기르지 않는다.
// 수렵 값표(돌날·가죽·그 땅 조개 구슬)로 바꿔 센다
function foragerGoods(ctx) {
  const w = ctx.words, v = GROUP_VALUES.forager;
  return GOODS_TEMPLATE.forager.map(([id, , fixed]) => {
    const [name, unit] = fixed ? [fixed.name, fixed.unit] : id === 'coin' ? [w.coin, w.coinUnit] : [GOODS_NAMES[id], GOODS_UNITS[id]];
    return { id, value: v[id], unit, ko: name.ko, en: name.en, for: ['band'] };
  });
}
const goodsOf = (ctx, household) => (household === 'band' && !ctx.goods.some((g) => g.id === 'hides') ? foragerGoods(ctx) : ctx.goods);

// 「○○ 옷」: 값표에 있으면 그것, 없으면 그 땅 옷감으로
function garbOf(ctx) {
  const g = ctx.goods.find((x) => x.id === 'garb');
  if (g) return g;
  const c = ctx.words.cloth;
  return { id: 'garb', value: (GROUP_VALUES[ctx.group] || {}).garb || 2, unit: GOODS_UNITS.garb, ko: `${c.ko} 옷`, en: `${c.en} clothes`, for: [] };
}

// 그 집안의 품목 (차례대로, 많아도 셋)
function pick(ctx, household) {
  const goods = goodsOf(ctx, household), own = goods.filter((g) => g.for.includes(household));
  const order = FILL_ORDER[household] || [];
  const list = [...order.map((id) => own.find((g) => g.id === id)).filter(Boolean), ...own.filter((g) => !order.includes(g.id))];
  if (list.length < 2) { const garb = garbOf(ctx); if (!list.some((g) => g.id === 'garb')) list.push(garb); }
  if (list.length < 2) { const coin = goods.find((g) => g.id === 'coin'); if (coin && !list.includes(coin)) list.push(coin); }
  return list.slice(0, 3);
}

const item = (g, n, pf) => ({ id: g.id, n, unit: { ko: g.unit.ko, en: g.unit.en }, name: { ko: g.ko, en: g.en }, value: g.id === 'coin' ? g.value / pf : g.value });

export function holdingsOf(wealth, ctx, household) {
  const w = Math.max(0, Math.min(100, Number(wealth) || 0)), pf = priceOf(ctx);
  if (w <= NONE_MAX) return [{ id: 'none', n: 0, unit: { ko: '', en: '' }, name: { ...NONE }, value: 0 }, item(garbOf(ctx), 1, pf)];
  const list = pick(ctx, household), share = SHARES[list.length];
  return list.map((g, i) => item(g, nice((w * share[i]) / (g.id === 'coin' ? g.value / pf : g.value)), pf));
}

// 재산 Δ → 그 땅 돈
export function wealthToUnits(delta, ctx, household = null) {
  const d = Number(delta) || 0, goods = goodsOf(ctx, household);
  const c = goods.find((g) => g.id === 'coin') || { value: 1, unit: ctx.words.coinUnit, ko: ctx.words.coin.ko, en: ctx.words.coin.en };
  const x = (d * priceOf(ctx)) / c.value;
  let n = Math.sign(x) * nice(Math.abs(x));
  if (n === 0 && Math.abs(d) >= 0.5) n = Math.sign(d);
  return { n: n || 0, unit: { ko: c.unit.ko, en: c.unit.en }, name: { ko: c.ko, en: c.en } };
}

// ── 글 ──
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
// 영어 단위·이름의 홑꼴 (acres → acre, pennies → penny, days' walk → day's walk). 셀 수 없는 말(mu·won·head)은 그대로
const one = (s) => s.replace(/^days' /, "day's ").replace(/ies$/, 'y').replace(/(ch|sh|x)es$/, '$1').replace(/([^s])s$/, '$1');
const many = (s) => (/s$/.test(s) ? s : /[^aeiou]y$/.test(s) ? s.slice(0, -1) + 'ies' : /(ch|sh|x)$/.test(s) ? s + 'es' : s + 's');
const COUNT = new Set(['home', 'tent', 'boat', 'shop']);   // 이름이 홑꼴 셀 수 있는 말 (cottage, ger, tent …)
const BARE = new Set(['pieces', 'coins', 'grazing grounds']);   // 단위 없이 이름만 세는 말 (6 stone blades · 2 dirhams · 3 pastures)

export function holdingText(h, lang) {
  if (h.id === 'none') return h.name[lang];
  const { n } = h, name = h.name[lang], unit = h.unit[lang];
  if (lang === 'ko') {
    if (n === 0) return `${name} 없음`;
    if (h.id === 'garb' && n === 1) return `${name} 한 ${unit}`;
    return name === unit ? `${fmt(n)}${unit}` : `${name} ${fmt(n)}${unit}`;
  }
  if (n === 0) return `no ${name}`;
  if (COUNT.has(h.id)) return `${fmt(n)} ${n === 1 ? name : many(name)}`;
  if (h.id === 'garb') return `${fmt(n)} ${n === 1 ? one(unit) : unit} of ${name.replace(/ cloth clothes$/, ' clothes')}`;   // hemp cloth clothes → hemp clothes
  if (name === unit || name.endsWith(' ' + unit) || BARE.has(unit)) {
    const last = name.split(' ').pop();
    return `${fmt(n)} ${n === 1 ? name.slice(0, name.length - last.length) + one(last) : name}`;
  }
  return `${fmt(n)} ${n === 1 ? one(unit) : unit} of ${name}`;
}
export const holdingsText = (list, lang) => list.map((h) => holdingText(h, lang)).join(' · ');

// 재산 Δ 를 그 땅 돈으로 쓴 글: 「은화 +5닢」 · '+5 silver pennies' · 「−150,000원」 · '−1 bolt of cotton cloth'. 0 단위면 ''
export function wealthText(delta, ctx, lang, household = null) {
  const u = wealthToUnits(delta, ctx, household);
  if (!u.n) return '';
  const sign = u.n > 0 ? '+' : '−', n = Math.abs(u.n), name = u.name[lang], unit = u.unit[lang];
  if (lang === 'ko') return name === unit ? `${sign}${fmt(n)}${unit}` : `${name} ${sign}${fmt(n)}${unit}`;
  return sign + holdingText({ id: 'coin', n, unit: u.unit, name: u.name, value: 0 }, 'en');
}
