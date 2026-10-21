// 시대의 바람 (설계 3장): contextOf(year, area, household) → 그해 그 땅 그 집안이 사는 세상의 모습. three·DOM 없는 순수 모듈 (Node 시험: test/context.test.mjs)
// 합치는 순서
//   1 문화권 기본값 (context_data.js ZONE_DATA[zone][group], 묶음 순서대로 물려받은 칸 + 그 묶음의 기본 신분)
//   2 문화권 기간 덮어쓰기 (ZONE_DATA[zone].spans, 그해에 걸린 것)
//   3 땅 덮어쓰기 (AREA_DATA[area].all → [group] → spans)
//   3½ 농사·목축이 아직 닿지 않은 땅(FARM_FROM)이면 수렵 무리의 낱말: 그 문화권 수렵 칸 → PRE_FARM → AREA_DATA[area].preFarm
//   4 그해 사건 (events.js 의 war·econ·disease 필드가 있으면 그것, 없으면 EVENT_MODS) + 끝난 사건의 뒤끝(after)
// 결과는 (year, area, household) 열쇠로 캐시하고 얼려서 돌려준다. 같은 열쇠면 같은 객체다.
// status.ranks 는 그 묶음 집안(households.js HOUSEHOLDS[group])만 담고, 인자로 받은 집안이 그 묶음에 없으면 빌린 이름을 하나 더 넣는다.
//   설계 3.1 처럼 13개 집안을 다 늘어놓지 않으므로, 뒤 코드는 반드시 ranks[그 생의 household] 로만 읽는다 (다른 키를 훑지 않는다).
// 의술 수준은 연대 기준을 넘지 않는다: 1796년 전은 2 이하, 1945년부터는 어디나 5 (설계 3.2). 유럽의 1870년 뒤 4 이상은 표가 지킨다(시험).
import { groupOf, eraOf } from './births.js';
import { AREAS } from './places.js';
import { HOUSEHOLDS } from './households.js';
import { EVENTS, activeEvents } from './events.js';
import { ZONE_OF, ZONE_DATA, AREA_DATA, EVENT_MODS, GENERIC_RANKS, HH_FALLBACK, HH_SCHOOL, GOODS_TEMPLATE, GOODS_NAMES, GOODS_UNITS, GROUP_VALUES, WAR_NAMES, FARM_FROM, PRE_FARM } from './context_data.js';

export const GROUPS = ['forager', 'ancient', 'medieval', 'early', 'industrial', 'modern'];
export const CONTEXT_FIELDS = ['zone', 'group', 'era', 'words', 'status', 'goods', 'disease', 'war', 'tech', 'econ', 'school', 'literacy', 'events', 'firstYear'];

const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const clone = (v) => (Array.isArray(v) ? v.map(clone) : isObj(v) ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, clone(x)])) : v);
function freeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) freeze(v); }
  return o;
}

// 병 목록은 endemic(바꿈) · add(더함) · remove(뺌)로 덮는다. 나머지는 객체끼리 깊이 합치고, 배열·수·계단은 통째로 바꾼다
function mergeInto(base, patch) {
  for (const [k, v] of Object.entries(patch || {})) {
    if (k === 'disease') {
      const d = base.disease || (base.disease = { endemic: [], medicine: 0 });
      if (v.endemic) d.endemic = [...v.endemic];
      if (v.add) for (const x of v.add) if (!d.endemic.includes(x)) d.endemic.push(x);
      if (v.remove) d.endemic = d.endemic.filter((x) => !v.remove.includes(x));
      if (v.medicine !== undefined) d.medicine = clone(v.medicine);
    } else if (isObj(v) && isObj(base[k])) mergeInto(base[k], v);
    else base[k] = clone(v);
  }
  return base;
}

// 수 하나 또는 [[해부터, 값], …] 계단 → 그해 값
export function resolveAt(v, year) {
  if (!Array.isArray(v)) return v;
  let out = v[0][1];
  for (const [y, x] of v) if (year >= y) out = x;
  return out;
}
const clampInt = (x, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(x) || 0)));
const clamp01 = (x) => Math.max(0, Math.min(1, Number(x) || 0));
const r2 = (x) => Math.round(x * 100) / 100;

// 문화권 × 묶음 칸 (모듈을 읽을 때 한 번)
const CELLS = {};
for (const zone of Object.keys(ZONE_DATA)) {
  CELLS[zone] = {};
  let prev = null;
  for (const g of GROUPS) {
    const cell = g === 'forager' ? {} : clone(prev || {});
    mergeInto(cell, { status: { ranks: GENERIC_RANKS[g] } });
    mergeInto(cell, ZONE_DATA[zone][g]);
    CELLS[zone][g] = cell;
    if (g !== 'forager') prev = cell;
  }
}

const inSpan = (s, year, group) =>
  (group !== 'forager' || (s.groups && s.groups.includes('forager'))) &&
  (!s.groups || s.groups.includes(group)) && year >= (s.from ?? -Infinity) && year <= (s.to ?? Infinity);

// 살림 값표: 묶음의 틀 + 그 칸의 낱말·값
function buildGoods(c, group) {
  const w = c.words, val = { ...GROUP_VALUES[group], ...(c.values || {}) }, names = c.names || {};
  const fromWords = {
    land: [w.land, w.landUnit], beast: [w.beast, GOODS_UNITS.beast], coin: [w.coin, w.coinUnit], home: [w.home, GOODS_UNITS.home],
    garb: [{ ko: `${w.cloth.ko} 옷`, en: `${w.cloth.en} clothes` }, GOODS_UNITS.garb],
  };
  return GOODS_TEMPLATE[group].map(([id, forList, fixed]) => {
    const [name, unit] = fixed ? [fixed.name, fixed.unit] : fromWords[id] || [names[id] || GOODS_NAMES[id], GOODS_UNITS[id]];
    return { id, value: val[id], unit: { ko: unit.ko, en: unit.en }, ko: name.ko, en: name.en, for: [...forList] };
  });
}

// 그 땅·묶음·그해에 걸린 기간까지 합친 칸 (얼린 것, 같은 기간 조합이면 공유)
const BASE = new Map();
// band = 농사가 닿기 전에 태어난 수렵 무리. 그 생은 농사가 닿은 해가 지나도 무리의 낱말을 쓴다
function baseCell(zone, area, group, year, band = false) {
  const zs = ZONE_DATA[zone].spans || [], A = area ? AREA_DATA[area] : null, as = (A && A.spans) || [];
  const preFarm = group !== 'forager' && (band || (area != null && year < (FARM_FROM[area] ?? -Infinity)));
  const key = `${zone}|${area}|${group}|${preFarm}|${zs.map((s, i) => (inSpan(s, year, group) ? i : '')).join(',')}|${as.map((s, i) => (inSpan(s, year, group) ? i : '')).join(',')}`;
  let c = BASE.get(key);
  if (c) return c;
  c = clone(CELLS[zone][group]);
  for (const s of zs) if (inSpan(s, year, group)) mergeInto(c, s.set);
  if (A) {
    if (group !== 'forager' && A.all) mergeInto(c, A.all);
    if (A[group]) mergeInto(c, A[group]);
    for (const s of as) if (inSpan(s, year, group)) mergeInto(c, s.set);
  }
  // 농사·목축 전의 땅: 고대·중세·근세 묶음이라도 수렵 무리 (일본 조몬, 1788년 전 오스트레일리아, 1580년 전 팜파스 …)
  if (preFarm) {
    const f = CELLS[zone].forager;
    mergeInto(c, { words: f.words, tech: { items: f.tech.items } });
    mergeInto(c, PRE_FARM);
    if (A && A.preFarm) mergeInto(c, A.preFarm);
  }
  // 그 묶음 집안의 신분만 남긴다
  const ranks = {};
  for (const h of HOUSEHOLDS[group]) ranks[h.id] = c.status.ranks[h.id];
  c.status = { system: c.status.system, ranks };
  c.goods = buildGoods(c, group);
  c.war = { level: c.war ? c.war.level : 0, name: c.war ? c.war.name : null };
  freeze(c);
  BASE.set(key, c);
  return c;
}

// 그해 그 땅의 칸 (사건·연대 기준 전, 계단 값은 계단 그대로). 다른 모듈·시험이 표를 들여다볼 때
export const zoneOf = (area) => ZONE_OF[area] || 'europe';
export const cellOf = (year, area) => baseCell(zoneOf(area), AREAS[area] ? area : null, groupOf(year), year);

// 사건 하나의 수정값: events.js 필드가 먼저, 없으면 EVENT_MODS
function modsOf(e) {
  const m = EVENT_MODS[e.id] || {};
  const war = e.war ?? m.war;
  return {
    war: war && typeof war === 'object' ? war.level : war,
    warAt: e.warAt ?? m.warAt,
    warName: e.warName ?? m.warName,
    econ: e.econ ?? m.econ,
    disease: [].concat(e.disease ?? m.disease ?? []),
    after: e.after ?? m.after,
  };
}
const hits = (e, region, area) => (e.regions && e.regions.includes(region)) || (e.areas && e.areas.includes(area));

// 집안이 그 묶음에 없으면(앞 묶음에서 넘어온 생): 신분은 같은 문화권의 가장 가까운 묶음에서 그 집안 이름을 찾고, 살림은 비슷한 집안을 빌린다
function borrow(household, have) {
  for (const h of HH_FALLBACK[household] || []) if (have(h)) return h;
  return null;
}
function nearestRank(zone, group, household) {
  const gi = GROUPS.indexOf(group);
  for (let d = 0; d < GROUPS.length; d++) {
    for (const g of [GROUPS[gi - d], GROUPS[gi + d]]) {
      if (!g || (g === 'forager') !== (household === 'band')) continue;
      const r = CELLS[zone][g].status.ranks[household];
      if (r) return r;
    }
  }
  return null;
}

const CACHE = new Map();
const CACHE_MAX = 50000;
export const clearContextCache = () => { CACHE.clear(); BASE.clear(); };

const TENT_RE = /tent|ger\b|yurt|camp/i, TENT_HOME = Object.freeze({ ko: '천막', en: 'tent' });
export function contextOf(year, area, household) {
  const y = Number.isFinite(year) ? Math.floor(year) : 1329;
  const a = AREAS[area] ? area : null;
  const key = `${y}|${a}|${household}`;
  const hit = CACHE.get(key);
  if (hit) return hit;

  const zone = zoneOf(a), group = groupOf(y);
  const base = baseCell(zone, a, group, y, household === 'band');
  const region = a ? AREAS[a].region : null;
  const evs = a ? activeEvents(y, region, a) : [];

  // 신분: 그 묶음에 없는 집안이면 빌린 집안의 이름으로
  let ranks = base.status.ranks, goods = base.goods;
  if (household && !ranks[household]) {
    const like = borrow(household, (h) => !!ranks[h]);
    const own = nearestRank(zone, group, household);
    ranks = { ...ranks, [household]: own || (like ? ranks[like] : { ko: '평범한 집', en: 'ordinary household', rank: 2, bound: false }) };
    const owner = borrow(household, (h) => goods.some((g) => g.for.includes(h))) || 'farm';
    goods = goods.map((g) => (g.for.includes(owner) ? { ...g, for: [...g.for, household] } : g));
  }

  // 사건: 전쟁 수준은 가장 센 것, 값·품삯은 곱, 유행병은 더한다.
  //   warAt[땅] 이 0(또는 그 땅의 기본 수준보다 낮음)이면 그 사건은 이 땅의 전쟁 수준·이름을 바꾸지 않는다 (중립국: 스페인·스웨덴 …).
  //   사건은 수준을 올리기만 하고 내리지는 않는다.
  let war = { level: clampInt(resolveAt(base.war.level, y), 0, 3), name: base.war.name };
  let price = 1, wage = 1;
  const endemic = [...base.disease.endemic];
  for (const e of evs) {
    const m = modsOf(e);
    const lv = m.warAt && m.warAt[a] != null ? m.warAt[a] : m.war;
    if (lv != null && lv >= war.level && lv > 0) war = { level: clampInt(lv, 0, 3), name: m.warName || { ko: e.ko, en: e.en } };
    if (m.econ) { price *= m.econ.price ?? 1; wage *= m.econ.wage ?? 1; }
    for (const d of m.disease) if (!endemic.includes(d)) endemic.push(d);
  }
  if (a) for (const e of EVENTS) {   // 끝난 사건의 뒤끝 (예: 흑사병 뒤 품삯)
    const af = modsOf(e).after;
    if (af && af.econ && y > e.to && y <= e.to + af.years && hits(e, region, a)) { price *= af.econ.price ?? 1; wage *= af.econ.wage ?? 1; }
  }
  if (!war.name) war.name = WAR_NAMES[war.level];

  let medicine = clampInt(resolveAt(base.disease.medicine, y), 0, 5);
  if (y < 1796) medicine = Math.min(medicine, 2);
  if (y >= 1945) medicine = 5;

  // 가축 치는 집은 천막에 산다 (작업 8: 중세 아라비아 목자가 「흙벽돌 집」에서 울던 것). 그 땅 낱말이 이미 천막(게르·유르트)이면 그대로
  const words = household === 'herd' && !TENT_RE.test(base.words.home.en) ? { ...base.words, home: TENT_HOME } : base.words;
  const ctx = {
    zone, group, era: eraOf(y).id,
    words,
    status: { system: base.status.system, ranks },
    goods,
    disease: { endemic, medicine },
    war,
    tech: { level: clampInt(resolveAt(base.tech.level, y), 0, 5), items: base.tech.items },
    econ: { price: r2(price), wage: r2(wage) },
    school: r2(Math.min(1, clamp01(resolveAt(base.school, y)) * (HH_SCHOOL[household] ?? 1))),
    literacy: r2(clamp01(resolveAt(base.literacy, y))),
    events: evs.map((e) => e.id),
    firstYear: base.firstYear,
  };
  freeze(ctx);
  if (CACHE.size >= CACHE_MAX) CACHE.clear();
  CACHE.set(key, ctx);
  return ctx;
}
