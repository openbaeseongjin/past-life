// 살림 (sim2 설계 2.4) + 농사 전 땅의 집안 (작업 3 덧붙임: 1788년 전 오스트레일리아 「농사짓는 집」 고침)
import test from 'node:test';
import assert from 'node:assert/strict';
import { holdingsOf, wealthToUnits, wealthText, holdingText, holdingsText, NONE_MAX } from '../holdings.js';
import { contextOf } from '../context.js';
import { HOUSEHOLDS, householdOf, beforeFarming, drawSex, drawOrder } from '../households.js';
import { sub } from '../rng.js';
import { drawPlace } from '../places.js';
import { drawBirth, birthAt } from '../birth.js';
import { FARM_FROM } from '../context_data.js';
import { stageOf } from '../lands.js';
import { validSoul } from '../soul.js';
import { birthLine } from '../i18n.js';
import { createLife, advance } from '../life.js';
import { eligible, STAGES } from '../cards.js';
import { DECK } from '../deck.js';
import { AREAS } from '../places.js';
import { groupOf } from '../births.js';

const YEARS = [-20000, -5000, -1500, 300, 800, 1347, 1600, 1880, 1990, 2020];
const ALL = [...new Set(Object.values(HOUSEHOLDS).flat().map((h) => h.id))];
const worth = (list) => list.reduce((t, h) => t + h.n * h.value, 0);
// 땅 × 해 × 그 묶음의 집안 (+ 농사 전이면 수렵 무리). borrowed: 그 묶음에 없는 집안 (앞 묶음에서 태어나 넘어온 생 — contextOf 가 빌려 준다)
function* cases({ borrowed = false, years = YEARS } = {}) {
  for (const area of Object.keys(AREAS)) for (const year of years) {
    const own = HOUSEHOLDS[groupOf(year)].map((h) => h.id);
    if (beforeFarming(area, year) && !own.includes('band')) own.push('band');
    for (const h of borrowed ? ALL.filter((x) => !own.includes(x)) : own) yield { area, year, h, ctx: contextOf(year, area, h) };
  }
}

test('결정적이고, 2~3개, 재산 0→100 에서 품목마다·총값이 줄지 않는다 (40개 땅 × 10개 해 × 집안)', () => {
  let n = 0;
  for (const { area, year, h, ctx } of cases()) {
    let prev = null;
    for (let w = 0; w <= 100; w++) {
      const list = holdingsOf(w, ctx, h), at = `${area} ${year} ${h} ${w}`;
      assert.deepEqual(holdingsOf(w, ctx, h), list, at);
      assert.ok(list.length >= 2 && list.length <= 3, `${at}: ${list.length}개`);
      for (const it of list) {
        assert.ok(Number.isInteger(it.n) && it.n >= 0, `${at} ${it.id} ${it.n}`);
        assert.ok(it.unit && typeof it.unit.ko === 'string' && typeof it.unit.en === 'string', `${at} ${it.id} unit`);
        assert.ok(it.name && it.name.ko && it.name.en, `${at} ${it.id} name`);
        assert.ok(Number.isFinite(it.value) && it.value >= 0, `${at} ${it.id} value`);
      }
      if (prev && w > NONE_MAX + 1) {
        assert.deepEqual(list.map((x) => x.id), prev.map((x) => x.id), at);
        list.forEach((x, i) => assert.ok(x.n >= prev[i].n, `${at} ${x.id} ${prev[i].n} → ${x.n}`));
      }
      if (prev) assert.ok(worth(list) >= worth(prev) - 1e-9, `${at}: 총값 ${worth(prev)} → ${worth(list)}`);
      prev = list; n++;
    }
  }
  assert.ok(n > 25000, String(n));
  // 그 묶음에 없는 집안 (묶음 경계 앞뒤 해, 재산 4점 간격)
  let m = 0;
  for (const { area, year, h, ctx } of cases({ borrowed: true, years: [300, 1499, 1500, 1799, 1800, 1949, 1950] })) {
    let prev = null;
    for (let w = 0; w <= 100; w += 4) {
      const list = holdingsOf(w, ctx, h), at = `${area} ${year} ${h} ${w}`;
      assert.ok(list.length >= 2 && list.length <= 3 && list.every((x) => Number.isInteger(x.n) && x.name.ko && x.name.en), at);
      if (prev) assert.ok(worth(list) >= worth(prev) - 1e-9, at);
      prev = list; m++;
    }
  }
  assert.ok(m > 20000, String(m));
});

test('집안마다 채우는 차례: 농사 땅 → 가축 → 돈, 유목 가축 → 천막, 장인 연장·가게 → 돈, 공장·사무 돈 → 집, 수렵 무리 돌날 → 가죽', () => {
  const ids = (y, a, h) => holdingsOf(50, contextOf(y, a, h), h).map((x) => x.id);
  assert.deepEqual(ids(1347, 'britain', 'farm'), ['land', 'beast', 'coin']);
  assert.deepEqual(ids(1651, 'korea', 'farm'), ['land', 'beast', 'coin']);
  assert.deepEqual(ids(-2000, 'mongolia', 'herd').slice(0, 2), ['beast', 'tent']);
  assert.deepEqual(ids(1500, 'west_africa', 'craft'), ['tools', 'shop', 'coin']);
  assert.deepEqual(ids(1900, 'france', 'factory').slice(0, 2), ['coin', 'home']);
  assert.deepEqual(ids(1990, 'korea', 'office'), ['coin', 'home']);
  assert.deepEqual(ids(1347, 'britain', 'serve'), ['coin', 'garb']);
  assert.deepEqual(ids(1600, 'italy', 'trade')[0], 'stock');
  assert.deepEqual(ids(-20000, 'india', 'band'), ['tools', 'hides', 'coin']);
  // 농사 전 땅의 무리는 묶음이 고대라도 수렵의 살림 (캥거루를 「기르지」 않는다)
  const aus = holdingsOf(50, contextOf(-500, 'australia', 'band'), 'band');
  assert.deepEqual(aus.map((x) => x.id), ['tools', 'hides', 'coin']);
  assert.equal(aus[0].name.ko, '돌날'); assert.equal(aus[2].name.ko, '조개 구슬');
  // 땅·시대 말로 나온다
  const serf = holdingsOf(35, contextOf(1347, 'britain', 'farm'), 'farm');
  assert.deepEqual(serf.map((x) => x.name.ko), ['밭', '소', '은화']);
  assert.deepEqual(serf.map((x) => x.unit.ko), ['에이커', '마리', '닢']);
  assert.ok(serf.every((x) => x.n > 0));
  const joseon = holdingsOf(35, contextOf(1651, 'korea', 'farm'), 'farm');
  assert.deepEqual(joseon.map((x) => x.name.ko), ['논', '소', '무명']);
  assert.equal(joseon[0].unit.ko, '마지기');
});

test('재산 10 이하는 「가진 것 거의 없음 · 옷 한 벌」 꼴', () => {
  for (const [y, a, h, cloth] of [[1347, 'britain', 'serve', '모직 옷'], [1651, 'korea', 'farm', '무명 옷'], [1990, 'korea', 'office', '면 옷'], [-20000, 'india', 'band', '가죽 옷']]) {
    const ctx = contextOf(y, a, h);
    for (const w of [0, 3, 10]) {
      const list = holdingsOf(w, ctx, h);
      assert.deepEqual(list.map((x) => [x.id, x.n]), [['none', 0], ['garb', 1]], `${y} ${a} ${h} ${w}`);
      assert.equal(list[0].name.ko, '가진 것 거의 없음');
      assert.equal(list[1].name.ko, cloth);
      assert.equal(holdingsText(list, 'ko'), `가진 것 거의 없음 · ${cloth} 한 벌`);
      assert.match(holdingsText(list, 'en'), /^next to nothing · 1 set of /);
    }
    assert.notEqual(holdingsOf(11, ctx, h)[0].id, 'none');
  }
});

test('wealthToUnits: 재산 Δ → 그 땅 돈 (1347 잉글랜드는 은화 · 닢, 그해 물가 반영, 소수 없음, 0.5 넘는 Δ 는 적어도 한 닢)', () => {
  const eng = contextOf(1347, 'britain', 'farm'), coin = eng.goods.find((g) => g.id === 'coin');
  const r = wealthToUnits(4, eng);
  assert.deepEqual(r.name, { ko: '은화', en: 'silver pennies' });
  assert.deepEqual(r.unit, { ko: '닢', en: 'pennies' });
  assert.equal(r.n, Math.round(4 * eng.econ.price / coin.value));
  assert.equal(wealthToUnits(-4, eng).n, -r.n);
  assert.equal(wealthToUnits(0, eng).n, 0);
  const jo = contextOf(1651, 'korea', 'farm');
  assert.equal(wealthToUnits(1, jo).n, 1);    // 무명 한 필은 재산 3점쯤이지만 0 으로 지우지 않는다
  assert.equal(wealthToUnits(-1, jo).n, -1);
  assert.equal(wealthToUnits(0.2, jo).n, 0);
  assert.equal(wealthToUnits(4, contextOf(1990, 'korea', 'office')).unit.ko, '원');
  // 글: 「은화 +5닢」 (돈 이름 + 부호 + 수 + 세는 말). 이름과 세는 말이 같으면 한 번만
  assert.equal(wealthText(4, eng, 'ko'), `은화 +${r.n}닢`);
  assert.equal(wealthText(-4, eng, 'en'), `−${r.n} silver pennies`);
  assert.equal(wealthText(1, jo, 'en'), '+1 bolt of cotton cloth');
  assert.equal(wealthText(3, contextOf(1990, 'korea', 'office'), 'ko'), '+150,000원');
  assert.equal(wealthText(0, eng, 'ko'), '');
  // 집안을 주면 holdingsOf 와 같은 값표 (농사 전 땅의 무리: 돌날·가죽·조개 구슬 값표의 조개 구슬)
  const aus = contextOf(1780, 'australia', 'band');
  assert.deepEqual(wealthToUnits(4, aus, 'band').name, holdingsOf(50, aus, 'band').find((x) => x.id === 'coin').name);
  for (const { ctx } of cases()) for (const d of [-9, -3, -1, 1, 3, 9]) {
    const u = wealthToUnits(d, ctx);
    assert.ok(Number.isInteger(u.n) && Math.sign(u.n) === Math.sign(d), `${d} → ${u.n}`);
    assert.ok(u.unit.ko && u.unit.en && u.name.ko && u.name.en);
  }
});

test('살림 한 줄 글: 한·영 다 있고 빈 자리·NaN 이 없다, 0개는 「없음」', () => {
  const eng = contextOf(1347, 'britain', 'farm');
  assert.equal(holdingsText(holdingsOf(35, eng, 'farm'), 'ko'), '밭 9에이커 · 소 3마리 · 은화 8닢');
  assert.equal(holdingsText(holdingsOf(35, eng, 'farm'), 'en'), '9 acres of fields · 3 head of oxen · 8 silver pennies');
  const poor = holdingsOf(12, contextOf(1990, 'korea', 'office'), 'office');
  assert.ok(poor.some((x) => x.n === 0));
  assert.match(holdingsText(poor, 'ko'), /^[0-9,]+원 · 아파트 없음$/);
  assert.match(holdingsText(poor, 'en'), /^[0-9,]+ won · no apartment$/);
  assert.equal(holdingText({ id: 'coin', n: 1500000, unit: { ko: '원', en: 'won' }, name: { ko: '원', en: 'won' }, value: 0 }, 'ko'), '1,500,000원');
  assert.equal(holdingText({ id: 'home', n: 2, unit: { ko: '채', en: 'houses' }, name: { ko: '게르', en: 'ger' }, value: 12 }, 'en'), '2 gers');
  assert.equal(holdingText({ id: 'land', n: 1, unit: { ko: '에이커', en: 'acres' }, name: { ko: '밭', en: 'fields' }, value: 2 }, 'en'), '1 acre of fields');
  assert.equal(holdingText({ id: 'coin', n: 2, unit: { ko: '닢', en: 'coins' }, name: { ko: '디르함', en: 'dirhams' }, value: 1 }, 'en'), '2 dirhams');
  assert.equal(holdingText({ id: 'land', n: 3, unit: { ko: '자리', en: 'grazing grounds' }, name: { ko: '목초지', en: 'pastures' }, value: 2 }, 'en'), '3 pastures');
  assert.equal(holdingText({ id: 'garb', n: 2, unit: { ko: '벌', en: 'sets' }, name: { ko: '삼베 옷', en: 'hemp cloth clothes' }, value: 2 }, 'en'), '2 sets of hemp clothes');
  for (const { ctx, h } of cases()) for (const w of [0, 15, 40, 75, 100]) for (const l of ['ko', 'en']) {
    const s = holdingsText(holdingsOf(w, ctx, h), l);
    assert.ok(s.length > 3 && !/undefined|NaN|\{|\}|null/.test(s), `${h} ${w} ${l}: ${s}`);
  }
});

// ── 농사·목축이 닿기 전 땅에서 태어나면 수렵 무리 (FARM_FROM) ──
test('집안: 출생 2만 개 가운데 그 땅에 농사가 닿기 전(FARM_FROM)인데 무리가 아닌 출생은 없다 · 해·땅 뽑기는 그대로', () => {
  let pre = 0, preAncient = 0;
  for (let i = 0; i < 20000; i++) {
    const b = drawBirth('ARR-' + i);
    if (b.year < (FARM_FROM[b.area] ?? -Infinity)) {
      pre++; if (b.group !== 'forager') preAncient++;
      assert.equal(b.household, 'band', `${b.seed} ${b.year} ${b.area} ${b.household}`);
      assert.deepEqual(b.tags, ['hunt']);
      assert.equal(b.wealth, householdOf('forager', 'band').wealth);
      assert.equal(stageOf(b).setting, 'camp', `${b.seed} ${b.year} ${b.area}`);
    } else if (b.group !== 'forager') assert.notEqual(b.household, 'band', b.seed);
  }
  assert.ok(preAncient > 50, `농사 전 고대·중세·근세 출생 ${preAncient}`);
  assert.ok(pre > preAncient);
  // 해·땅·성별·형제 순서는 집안과 따로 뽑는다: 각자 sub(seed, 용도) 에서 바로 뽑은 값과 같다
  const b = birthAt('AUS', -500);
  assert.equal(b.year, -500); assert.equal(b.group, 'ancient');
  for (let i = 0; i < 3000; i++) {
    const x = drawBirth('IND-' + i), p = drawPlace(sub(x.seed, 'place'), x.year);
    assert.deepEqual([x.region, x.area, x.sex, x.order], [p.region, p.area, drawSex(sub(x.seed, 'sex')), drawOrder(sub(x.seed, 'order'))], x.seed);
  }
  for (let i = 0; i < 5000; i++) {
    const x = birthAt('AU-' + i, -500);
    if (x.area !== 'australia') continue;
    assert.equal(x.household, 'band');
    assert.equal(stageOf(x).setting, 'camp');
    return;
  }
  assert.fail('기원전 500년 오스트레일리아 출생을 못 찾았다');
});

test('농사 전 무리의 생: 이름표·저장 검사·무대가 깨지지 않고, 카드는 수렵 묶음 것을 본다', () => {
  let b = null;
  for (let i = 0; !b; i++) { const x = birthAt('AUSL-' + i, -500); if (x.area === 'australia') b = x; }
  assert.equal(householdOf(b.group, b.household).id, 'band');
  assert.equal(householdOf('medieval', 'farm').id, 'farm');
  assert.equal(householdOf('medieval', 'castle'), undefined);
  assert.match(birthLine(b, 'ko'), /사냥하고 채집하는 무리/);
  assert.match(birthLine(b, 'en'), /hunter-gatherers/);
  assert.ok(validSoul({ id: 'S', lives: [], traces: [], ended: false, next: b }));
  const life = createLife({ birth: b, noDeath: true, quiet: true });
  assert.equal(life.status.ko, '무리의 한 사람');
  const seen = [];
  for (;;) { const ev = advance(life, DECK); if (ev.type === 'death' || life.age > 60) break; if (ev.type === 'card') { seen.push(ev.card); life.pending = null; life.seen.push(ev.card.id); } }
  assert.ok(seen.length > 3);
  for (const c of seen) assert.ok(!c.when || !c.when.eraGroups || c.when.eraGroups.includes('forager'), `${c.id} ${c.when && c.when.eraGroups}`);
  // 단계마다 고를 카드가 3장 이상 (고대 묶음 무리, 바닷가 땅)
  for (const stage of STAGES) {
    const ctx = { stage, age: { baby: 3, child: 9, teen: 16, adult: 30, middle: 50, old: 70 }[stage], year: -500, era: 4, group: 'forager', region: 'seaoc', area: 'australia', coast: true, tags: ['hunt'], sex: 'f', flags: {}, traces: [], dream: null, stats: { health: 50, wealth: 50, family: 50, happy: 50 }, seen: [] };
    assert.ok(DECK.filter((c) => eligible(c, ctx)).length >= 3, stage);
  }
});
