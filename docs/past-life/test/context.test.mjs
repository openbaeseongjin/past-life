// 시대의 바람 (설계 3장): contextOf 의 모양·범위·연대 기준·사건 수정, ZONE_OF 와 lands.js 세트 표의 맞춤
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { AREAS } from '../places.js';
import { HOUSEHOLDS } from '../households.js';
import { groupOf, eraOf } from '../births.js';
import { EVENTS } from '../events.js';
import { AREA_STAGE } from '../lands.js';
import { WORD_KEYS } from '../tokens.js';
import { contextOf, cellOf, resolveAt, clearContextCache, CONTEXT_FIELDS } from '../context.js';
import { ZONE_OF, ZONES, ZONE_DATA, AREA_DATA, DISEASES, EVENT_MODS, FARM_FROM } from '../context_data.js';

const AREA_IDS = Object.keys(AREAS);
const REP_YEARS = [-9000, 300, 1200, 1650, 1900, 2000];   // 묶음마다 대표 해 (forager … modern)
const isHangulEnd = (s) => { const c = s.codePointAt(s.length - 1); return c >= 0xac00 && c <= 0xd7a3; };
const pair = (o) => o && typeof o.ko === 'string' && o.ko.length > 0 && typeof o.en === 'string' && o.en.length > 0;

test('ZONE_OF: 40개 땅마다 정해진 문화권 하나, 8개 문화권을 다 쓴다', () => {
  assert.equal(AREA_IDS.length, 40);
  assert.deepEqual(Object.keys(ZONE_OF).sort(), [...AREA_IDS].sort());
  for (const a of AREA_IDS) assert.ok(ZONES.includes(ZONE_OF[a]), `${a}: ${ZONE_OF[a]}`);
  for (const z of ZONES) assert.ok(Object.values(ZONE_OF).includes(z), `${z} 를 쓰는 땅이 없다`);
  assert.deepEqual(Object.keys(ZONE_DATA).sort(), [...ZONES].sort());
  for (const a of Object.keys(AREA_DATA)) assert.ok(AREAS[a], `덮어쓰기 땅 ${a}`);
});

// lands.js 의 문화 세트(AREA_STAGE[area][1])와 맞춘다. england 세트 = europe 문화권.
// 아메리카·동남아·오세아니아는 아직 3D 세트가 없어 lands.js 가 가까운 세트를 빌려 쓴다 → 그 12개 땅은 알려진 차이로 못 박아 둔다.
// lands.js 가 문화권 표를 ZONE_OF 에서 가져오게 바뀌면(설계 6장 「맞춤」) 이 표가 비어야 한다.
const KIT_ZONE = (kit) => (kit === 'england' ? 'europe' : kit);
const KNOWN_DIFF = {
  mesoamerica: 'mudbrick', andes: 'mudbrick', brazil: 'africa', north_america: 'steppe', la_plata: 'steppe', caribbean: 'africa',
  indonesia: 'southasia', mainland_sea: 'southasia', philippines: 'southasia', malay: 'southasia', australia: 'steppe', pacific: 'africa',
};
test('ZONE_OF 와 lands.js 의 문화 세트 표가 맞는다 (알려진 차이 12개 밖에는 모두 같다)', () => {
  const diffs = [];
  for (const a of AREA_IDS) {
    const fromLands = KIT_ZONE(AREA_STAGE[a][1]);
    if (KNOWN_DIFF[a]) {
      assert.equal(fromLands, KNOWN_DIFF[a], `${a}: lands.js 세트가 바뀌었다 (${AREA_STAGE[a][1]}) — KNOWN_DIFF 를 고친다`);
      assert.notEqual(ZONE_OF[a], fromLands, `${a}: 이제 같다 — KNOWN_DIFF 에서 뺀다`);
      diffs.push(a);
    } else assert.equal(ZONE_OF[a], fromLands, `${a}: ZONE_OF ${ZONE_OF[a]} ≠ lands.js ${AREA_STAGE[a][1]}`);
  }
  assert.equal(diffs.length, 12);
  for (const a of diffs) assert.ok(['americas', 'seaoc'].includes(ZONE_OF[a]), `${a}: 차이는 세트가 없는 문화권뿐`);
});

test('40개 땅 × 6개 묶음 × 그 묶음의 집안마다 맥락의 모든 필드가 있고 범위 안이다', () => {
  let n = 0;
  for (const area of AREA_IDS) for (const year of REP_YEARS) {
    const group = groupOf(year);
    for (const h of HOUSEHOLDS[group]) {
      const c = contextOf(year, area, h.id), at = `${area} ${year} ${h.id}`;
      n++;
      for (const f of CONTEXT_FIELDS) assert.ok(c[f] !== undefined && c[f] !== null, `${at}: ${f}`);
      assert.equal(c.zone, ZONE_OF[area], at);
      assert.equal(c.group, group, at);
      assert.equal(c.era, eraOf(year).id, at);
      // 낱말
      assert.deepEqual(Object.keys(c.words).sort(), [...WORD_KEYS].sort(), at);
      for (const k of WORD_KEYS) {
        assert.ok(pair(c.words[k]), `${at}: words.${k}`);
        assert.ok(isHangulEnd(c.words[k].ko), `${at}: words.${k} 「${c.words[k].ko}」 는 한글 음절로 끝나야 조사를 붙인다`);
        assert.ok(!/[{}]/.test(c.words[k].ko + c.words[k].en), `${at}: words.${k} 에 중괄호`);
      }
      // 신분: 그 묶음의 모든 집안
      assert.ok(pair(c.status.system), `${at}: status.system`);
      for (const hh of HOUSEHOLDS[group]) {
        const r = c.status.ranks[hh.id];
        assert.ok(pair(r), `${at}: ranks.${hh.id}`);
        assert.ok(Number.isInteger(r.rank) && r.rank >= 1 && r.rank <= 5, `${at}: ranks.${hh.id}.rank ${r.rank}`);
        assert.equal(typeof r.bound, 'boolean', `${at}: ranks.${hh.id}.bound`);
      }
      // 살림: 그 집안 품목 2개 이상, 품목마다 값·단위·이름
      const mine = c.goods.filter((g) => g.for.includes(h.id));
      assert.ok(mine.length >= 2, `${at}: 살림 품목 ${mine.length}개`);
      for (const g of c.goods) {
        assert.ok(typeof g.id === 'string' && g.value > 0 && Number.isFinite(g.value), `${at}: goods ${g.id} 값 ${g.value}`);
        assert.ok(pair(g.unit) && pair(g), `${at}: goods ${g.id} 이름·단위`);
        assert.ok(Array.isArray(g.for) && g.for.length > 0, `${at}: goods ${g.id} 집안`);
      }
      // 병·의술·전쟁·기술·경제·배움
      assert.ok(Array.isArray(c.disease.endemic), at);
      for (const d of c.disease.endemic) assert.ok(DISEASES[d], `${at}: 병 ${d}`);
      assert.ok(Number.isInteger(c.disease.medicine) && c.disease.medicine >= 0 && c.disease.medicine <= 5, `${at}: medicine ${c.disease.medicine}`);
      assert.ok(Number.isInteger(c.war.level) && c.war.level >= 0 && c.war.level <= 3, `${at}: war ${c.war.level}`);
      assert.ok(pair(c.war.name), `${at}: war.name`);
      assert.ok(Number.isInteger(c.tech.level) && c.tech.level >= 0 && c.tech.level <= 5, `${at}: tech ${c.tech.level}`);
      assert.ok(c.tech.items.length >= 2 && c.tech.items.every(pair), `${at}: tech.items`);
      assert.ok(c.econ.price > 0 && c.econ.wage > 0, `${at}: econ`);
      assert.ok(c.school >= 0 && c.school <= 1 && c.literacy >= 0 && c.literacy <= 1, `${at}: school ${c.school} literacy ${c.literacy}`);
      assert.ok(Array.isArray(c.events), at);
      assert.ok(pair(c.firstYear), `${at}: firstYear`);
    }
  }
  assert.equal(n, 40 * REP_YEARS.reduce((t, y) => t + HOUSEHOLDS[groupOf(y)].length, 0), `${n}개`);
});

test('모든 땅 × 1년 간격(1500~2026)·25년 간격(그 앞)에서도 모양이 깨지지 않는다 (기간 덮어쓰기 경계)', () => {
  const years = [];
  for (let y = -10000; y < 1500; y += 25) years.push(y);
  for (let y = 1500; y <= 2026; y++) years.push(y);
  for (const area of AREA_IDS) for (const year of years) {
    const h = HOUSEHOLDS[groupOf(year)][0].id;
    const c = contextOf(year, area, h);
    for (const k of WORD_KEYS) assert.ok(pair(c.words[k]) && isHangulEnd(c.words[k].ko), `${area} ${year}: words.${k}`);
    assert.ok(pair(c.status.ranks[h]), `${area} ${year}: ranks.${h}`);
    assert.ok(c.goods.filter((g) => g.for.includes(h)).length >= 2, `${area} ${year}: 살림`);
  }
  clearContextCache();
});

test('의술 수준이 연대 기준을 지킨다: 1796년 전 ≤2, 1870년 뒤 유럽 ≥4, 1945년부터 어디나 5', () => {
  const years = [];
  for (let y = -10000; y < 1700; y += 50) years.push(y);
  for (let y = 1700; y <= 2026; y++) years.push(y);
  for (const area of AREA_IDS) for (const year of years) {
    const m = contextOf(year, area, HOUSEHOLDS[groupOf(year)][0].id).disease.medicine;
    if (year < 1796) assert.ok(m <= 2, `${area} ${year}: ${m}`);
    if (year > 1870 && ZONE_OF[area] === 'europe') assert.ok(m >= 4, `${area} ${year}: ${m}`);
    if (year >= 1945) assert.equal(m, 5, `${area} ${year}`);
    // 표 자체도 (코드의 안전장치 없이) 1796년 전 2 이하다
    if (year < 1796) assert.ok(resolveAt(cellOf(year, area).disease.medicine, year) <= 2, `${area} ${year}: 표 값`);
  }
  clearContextCache();
});

test('사건 수정: 1347~1351 유럽은 흑사병이 돌고 품삯이 오른다, 그 뒤 100년도 품삯이 높다', () => {
  for (const area of AREA_IDS.filter((a) => ZONE_OF[a] === 'europe')) {
    for (let y = 1347; y <= 1351; y++) for (const h of ['farm', 'serve', 'craft']) {
      const c = contextOf(y, area, h);
      assert.ok(c.events.includes('blackdeath'), `${area} ${y}`);
      assert.ok(c.econ.wage > 1, `${area} ${y}: 품삯 ${c.econ.wage}`);
      assert.ok(c.disease.endemic.includes('plague'), `${area} ${y}: 흑사병`);
    }
    const before = contextOf(1340, area, 'farm');
    assert.ok(!before.disease.endemic.includes('plague'), `${area} 1340: 흑사병 전`);
    assert.equal(before.econ.wage, 1, `${area} 1340`);
    const after = contextOf(1380, area, 'farm');
    assert.ok(!after.events.includes('blackdeath') && after.econ.wage > 1, `${area} 1380: 뒤끝 품삯 ${after.econ.wage}`);
    assert.equal(contextOf(1470, area, 'farm').econ.wage, 1, `${area} 1470: 뒤끝이 끝났다`);
  }
  // 전쟁 수준은 사건이 올리고, 이름은 사건 이름이다
  const imjin = contextOf(1595, 'korea', 'farm');
  assert.equal(imjin.war.level, 3);
  assert.equal(imjin.war.name.ko, '임진왜란');
  assert.equal(contextOf(1595, 'japan', 'farm').war.level < 3, true);
  assert.equal(contextOf(1916, 'france', 'farm').war.level, 3);   // 1차 세계대전 서부 전선
  assert.equal(contextOf(1916, 'britain', 'farm').war.level, 2);
  assert.ok(contextOf(1918, 'india', 'farm').disease.endemic.includes('influenza'));
  assert.equal(contextOf(1520, 'mesoamerica', 'farm').war.name.ko, '정복 전쟁', '병 사건의 전쟁 이름은 따로');
  // EVENT_MODS 는 events.js 의 사건 id 만 쓴다
  for (const id of Object.keys(EVENT_MODS)) assert.ok(EVENTS.some((e) => e.id === id), `EVENT_MODS ${id}`);
});

test('사건에 war·econ·disease 필드가 생기면(Task 5) 그쪽을 먼저 읽는다', () => {
  const fake = { id: 'test_ctx_event', from: 1001, to: 1002, areas: ['nile'], hazard: 0, cause: null, ko: '시험 난리', en: 'Test turmoil', start: { ko: '-', en: '-' }, war: 3, econ: { price: 2, wage: 0.5 }, disease: 'cholera', after: { years: 3, econ: { wage: 1.5 } } };
  EVENTS.push(fake);
  clearContextCache();
  try {
    const c = contextOf(1001, 'nile', 'farm');
    assert.ok(c.events.includes('test_ctx_event'));
    assert.equal(c.war.level, 3);
    assert.equal(c.war.name.en, 'Test turmoil');
    assert.equal(c.econ.price, 2);
    assert.equal(c.econ.wage, 0.5);
    assert.ok(c.disease.endemic.includes('cholera'));
    assert.equal(contextOf(1004, 'nile', 'farm').econ.wage, 1.5);
    assert.equal(contextOf(1001, 'iran', 'farm').war.level, 1, '다른 땅은 그대로');
  } finally {
    EVENTS.splice(EVENTS.indexOf(fake), 1);
    clearContextCache();
  }
  assert.ok(!contextOf(1001, 'nile', 'farm').events.includes('test_ctx_event'));
});

test('설계 2.3 의 신분 예와 3.2 의 낱말이 나온다', () => {
  const rank = (y, a, h) => contextOf(y, a, h).status.ranks[h];
  assert.equal(rank(1347, 'britain', 'serve').ko, '농노');
  assert.equal(rank(1347, 'britain', 'serve').bound, true);
  assert.equal(rank(1651, 'korea', 'farm').ko, '상민');
  assert.equal(rank(1651, 'korea', 'serve').ko, '노비');
  assert.equal(rank(1651, 'korea', 'elite').ko, '양반');
  assert.equal(rank(1651, 'korea', 'elite').rank, 5);
  assert.ok(rank(1100, 'india', 'farm').ko.includes('자티'));
  assert.ok(rank(1500, 'west_africa', 'craft').ko.includes('오바의 길드'));
  assert.equal(rank(1840, 'north_america', 'serve').ko, '노예');
  assert.equal(rank(1880, 'north_america', 'serve').ko, '하인');
  assert.equal(contextOf(1347, 'britain', 'farm').words.coin.ko, '은화');   // Task 3 wealthToUnits(4, 1347 britain) 의 단위
  assert.equal(contextOf(1651, 'korea', 'farm').status.system.ko, '양천제');
  // 신분제 이름에 「바이샤」 같은 뜻이 바뀐 바르나 이름을 쓰지 않는다
  for (const a of AREA_IDS) for (const y of REP_YEARS) for (const h of HOUSEHOLDS[groupOf(y)]) {
    const r = contextOf(y, a, h.id).status.ranks[h.id];
    assert.ok(!/바이샤|수드라|크샤트리아|Vaishya|Shudra|Kshatriya/.test(r.ko + r.en), `${a} ${y} ${h.id}: ${r.ko}`);
  }
});

test('땅·시대마다 말이 다르다: 같은 해 문화권끼리, 같은 땅 시대끼리', () => {
  const sig = (c) => WORD_KEYS.map((k) => c.words[k].ko).join(',');
  for (const y of REP_YEARS.slice(1)) {
    const zones = new Map();
    for (const a of AREA_IDS) zones.set(ZONE_OF[a], sig(contextOf(y, a, 'farm')));
    const coins = new Set(AREA_IDS.map((a) => contextOf(y, a, 'farm').words.coin.ko));
    assert.ok(new Set(zones.values()).size === 8, `${y}: 문화권 8개의 낱말이 다 다르다`);
    assert.ok(coins.size >= 6, `${y}: 돈 이름 ${coins.size}가지`);
  }
  for (const a of AREA_IDS) {
    const eras = new Set(REP_YEARS.map((y) => sig(contextOf(y, a, HOUSEHOLDS[groupOf(y)][0].id))));
    const lateFarm = FARM_FROM[a] > 1200;   // 오스트레일리아(1788)·라플라타(1580): 그 전까지 고대·중세(·근세)가 같은 수렵 낱말이다
    assert.ok(eras.size >= (lateFarm ? 3 : 5), `${a}: 시대 묶음 6개 중 다른 낱말 묶음 ${eras.size}개`);
  }
  const all = new Set();
  for (const a of AREA_IDS) for (const y of REP_YEARS) all.add(sig(contextOf(y, a, HOUSEHOLDS[groupOf(y)][0].id)));
  assert.ok(all.size >= 150, `40땅 × 6묶음 = 240칸 중 다른 낱말 묶음 ${all.size}개`);
});

test('그 묶음에 없는 집안(앞 묶음에서 넘어온 생)도 신분·살림이 나온다', () => {
  for (const [y, a, h] of [[1505, 'britain', 'fish'], [1650, 'mongolia', 'herd'], [1960, 'germany', 'craft'], [1960, 'india', 'elite'], [1960, 'china', 'serve'], [-7990, 'nile', 'band'], [1200, 'japan', 'factory']]) {
    const c = contextOf(y, a, h);
    assert.ok(pair(c.status.ranks[h]), `${y} ${a} ${h}`);
    assert.ok(c.goods.filter((g) => g.for.includes(h)).length >= 2, `${y} ${a} ${h}: 살림`);
  }
  assert.equal(contextOf(1650, 'mongolia', 'herd').status.ranks.herd.ko, '목자');
  assert.equal(contextOf(1505, 'britain', 'fish').status.ranks.fish.ko, '어부');
});

test('캐시·순수: 같은 열쇠면 같은 객체, 얼려 있다. three·DOM 을 쓰지 않는다', () => {
  const a = contextOf(1651, 'korea', 'farm');
  assert.equal(contextOf(1651, 'korea', 'farm'), a);
  assert.ok(Object.isFrozen(a) && Object.isFrozen(a.words) && Object.isFrozen(a.goods) && Object.isFrozen(a.status.ranks));
  assert.throws(() => { 'use strict'; a.words.crop = null; });
  clearContextCache();
  const b = contextOf(1651, 'korea', 'farm');
  assert.notEqual(b, a);
  assert.deepEqual(b, a);
  for (const f of ['context.js', 'context_data.js', 'tokens.js']) {
    const src = readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
    assert.ok(!/from\s+['"]three|document\.|window\.|localStorage/.test(src), `${f} 는 순수 모듈`);
    assert.ok(!src.includes('\r'), `${f}: LF`);
  }
  // 모르는 땅·해도 던지지 않는다
  const odd = contextOf(NaN, 'atlantis', 'farm');
  assert.equal(odd.zone, 'europe');
  assert.ok(pair(odd.words.crop));
});

// ── 시대 착오 막기 (검토 1차) ──
// 「이 말은 이 해 앞(notBefore)·뒤(notAfter)에 나오면 안 된다」. 40개 땅 × −8000~1499(10년마다)·1500~2026(해마다)·규칙 경계 ±5년의
// 낱말·물건·살림 이름·신분제·신분·전쟁 이름·첫돌 줄을 다 훑는다.
// fields 를 주면 그 칸만 본다(words 키, 'items', 'goods', 'system', 'ranks', 'war', 'firstYear'). exact 면 같은 말일 때만. zones·areas 로 땅을 좁힌다.
// 원칙: context_data.js 에 시대가 정해진 말(칭호·물건·제도)을 새로 넣으면 여기에 규칙 한 줄을 함께 넣는다.
// 규칙마다 그 말이 허락된 때·곳에 실제로 나와야 한다(안 나오면 지키는 것이 없는 죽은 규칙). notBefore: Infinity 인 「이 땅에서는 아예 안 됨」 규칙은 다른 땅에서 나와야 한다.
const SA = ['india', 'bengal', 'indus', 'himalaya', 'lanka'];
const ANACHRONISM = [
  // 남아시아 신분제와 종교 (검토 I-1)
  { term: '바르나', notBefore: -1000, zones: ['southasia'], fields: ['system'] },
  { term: '자티', notBefore: 300, zones: ['southasia'], fields: ['system', 'ranks'] },
  { term: '라자', notBefore: -1200, fields: ['ruler'] },
  { term: '바이디야', notBefore: -500 },
  { term: '절', notBefore: -250, areas: ['lanka'], fields: ['holy', 'school'], exact: true },
  { term: '절', notBefore: -500, areas: ['india', 'bengal', 'indus', 'himalaya'], fields: ['holy', 'school'], exact: true },
  { term: '절', notBefore: 100, areas: ['china'], fields: ['holy', 'school'], exact: true },
  { term: '절', notBefore: 372, areas: ['korea'], fields: ['holy', 'school'], exact: true },
  { term: '절', notBefore: 538, areas: ['japan'], fields: ['holy', 'school'], exact: true },
  { term: '사원', notBefore: 300, zones: ['southasia'], fields: ['holy'] },
  { term: '쌀', notBefore: -2000, areas: ['india', 'bengal', 'himalaya', 'lanka'], fields: ['crop'] },
  // 동아시아 (검토 I-2·#3·#23)
  { term: '쌀', notBefore: -900, areas: ['japan'], fields: ['crop'] },
  { term: '쌀', notBefore: -1000, areas: ['korea'], fields: ['crop'] },
  { term: '신사', notBefore: 400, areas: ['japan'] },
  { term: '황제', notBefore: -221, areas: ['china'], fields: ['ruler'] },
  { term: '왕', notBefore: -1600, areas: ['china'], fields: ['ruler'], exact: true },
  { term: '고인돌', notBefore: -1500 },
  { term: '춘절', notBefore: 1914 },
  { term: '목판 인쇄', notBefore: 700 },
  { term: '활자', notBefore: 1040 },
  // 서아시아 (검토 I-2)
  { term: '수레바퀴', notBefore: -3500 },
  { term: '세켈', notBefore: -3000 },
  { term: '왕', notBefore: -3000, zones: ['mudbrick'], fields: ['ruler'], exact: true },
  { term: '파라오', notBefore: -3100 },
  { term: '신전', notBefore: -5500, zones: ['mudbrick'], fields: ['holy'], exact: true },
  { term: '서기 학교', notBefore: -3200 },
  { term: '불의 신전', notBefore: 224, areas: ['iran'] },
  { term: '모스크', notBefore: 622 },
  { term: '칼리프', notBefore: 632 },
  { term: '술탄', notBefore: 990 },
  { term: '디르함', notBefore: 640 },
  { term: '마드라사', notBefore: 900 },
  { term: '종이', notBefore: 750, zones: ['mudbrick'] },
  { term: '풍차', notBefore: 800, zones: ['mudbrick'] },
  // 금속·탈것 (검토 I-2)
  { term: '전차', notBefore: -2000 },
  { term: '복합궁', notBefore: -2000 },
  { term: '청동', notBefore: -3500, fields: ['items'] },
  { term: '청동', notBefore: -2200, zones: ['europe', 'steppe'], fields: ['items'] },
  { term: '청동', notBefore: -1600, zones: ['eastasia'], fields: ['items'] },
  { term: '청동', notBefore: -1000, areas: ['korea'], fields: ['items'] },
  { term: '청동', notBefore: -300, areas: ['japan'], fields: ['items'] },
  { term: '청동', notBefore: 600, zones: ['africa'], fields: ['items'] },
  { term: '청동', notBefore: -600, zones: ['seaoc'], fields: ['items'] },
  { term: '청동', notBefore: Infinity, zones: ['americas'], fields: ['items'] },
  { term: '청동 북', notBefore: -600 },
  { term: '철 ', notBefore: -1200, fields: ['items'] },
  { term: '철 ', notBefore: -800, zones: ['europe', 'steppe'], fields: ['items'] },
  { term: '철 ', notBefore: -600, zones: ['africa', 'seaoc'], fields: ['items'] },
  { term: '철 ', notBefore: -600, areas: ['china'], fields: ['items'] },
  { term: '철 ', notBefore: -300, areas: ['korea', 'japan'], fields: ['items'] },
  { term: '철 ', notBefore: 1800, areas: ['pacific'], fields: ['items'] },   // 쇠 연장은 19세기 교역으로 들어왔다
  { term: '아웃리거 카누', notBefore: -3000 },
  { term: '등자', notBefore: 300 },
  // 아메리카 (검토 I-5·#48)
  { term: '카카오 콩', notBefore: 250 },
  { term: '그림 글자', notBefore: -300 },
  { term: '계단밭', notBefore: -1000 },
  { term: '사탕수수', notBefore: 1800, areas: ['andes', 'la_plata'] },
  { term: '사탕수수', notBefore: 1516, areas: ['caribbean'] },
  { term: '화약', notBefore: 1700, areas: ['north_america'] },
  { term: '정복 전쟁', notBefore: Infinity, areas: ['north_america'], fields: ['war'] },
  // 아프리카 (검토 I-4, 재검토 N-1·N-4)
  { term: '실링', notBefore: Infinity, areas: ['congo'] },
  { term: '독립 국가의 시민', notBefore: Infinity, areas: ['south_africa'] },
  { term: '오바', notBefore: Infinity, areas: ['west_africa'], fields: ['ruler', 'system'] },
  { term: '오바', notBefore: 1440, notAfter: 1600, areas: ['west_africa'] },
  { term: '통행법', notAfter: 1986, areas: ['south_africa'] },
  // 재검토 N-2·N-3·N-5·N-6
  { term: '칸', notBefore: 216, zones: ['steppe'], fields: ['ruler', 'system', 'ranks'] },
  { term: '드루이드', notBefore: -600 },
  { term: '신성한 숲', notBefore: -800, zones: ['europe'] },
  { term: '바르나', notBefore: Infinity, areas: ['lanka'] },
  { term: '자티', notBefore: Infinity, areas: ['lanka'] },
  { term: '빚종', notBefore: Infinity, areas: ['pacific'] },
  // 첫돌 줄 (재검토 N-7)
  { term: '케이크', notBefore: 1870, fields: ['firstYear'] },
  { term: '사진', notBefore: 1840, fields: ['firstYear'] },
  // 유럽·세계 (검토 #36 외)
  { term: '풍차', notBefore: 1180, zones: ['europe'] },
  { term: '수도교', notBefore: -320 },
  { term: '인쇄기', notBefore: 1450 },
  { term: '화약', notBefore: 900 },
  { term: '대포', notBefore: 1300 },
  { term: '총', notBefore: 1500, fields: ['items'], exact: true },
  { term: '나침반', notBefore: 1000 },
  { term: '방적기', notBefore: 1769 },
  { term: '조면기', notBefore: 1793 },
  { term: '증기 기관', notBefore: 1700 },
  { term: '증기선', notBefore: 1807 },
  { term: '철도', notBefore: 1825 },
  { term: '전신', notBefore: 1840 },
  { term: '재봉틀', notBefore: 1850 },
  { term: '자전거', notBefore: 1860 },
  { term: '전기', notBefore: 1880 },
  { term: '전화', notBefore: 1880 },
  { term: '트럭', notBefore: 1900 },
  { term: '오토바이', notBefore: 1900 },
  { term: '자동차', notBefore: 1900 },
  { term: '라디오', notBefore: 1920 },
  { term: '냉장고', notBefore: 1920 },
  { term: '텔레비전', notBefore: 1935 },
  { term: '컴퓨터', notBefore: 1975 },
  { term: '휴대전화', notBefore: 1985 },
  { term: '인터넷', notBefore: 1990 },
  { term: '태양광', notBefore: 1990 },
  { term: '유로', notBefore: 2002 },
];
function textsOf(c) {
  const t = {};
  for (const k of WORD_KEYS) t[k] = [c.words[k].ko];
  t.items = c.tech.items.map((x) => x.ko);
  t.goods = c.goods.map((g) => g.ko);
  t.system = [c.status.system.ko];
  t.ranks = Object.values(c.status.ranks).map((r) => r.ko);
  t.war = [c.war.name.ko];
  t.firstYear = [c.firstYear.ko];
  return t;
}
const forbidden = (r, year) => year < (r.notBefore ?? -Infinity) || year > (r.notAfter ?? Infinity);
const ruleHits = (r, area) => (!r.zones || r.zones.includes(ZONE_OF[area])) && (!r.areas || r.areas.includes(area));
test('시대 착오 표: 40개 땅 × 모든 해(경계 ±5년 포함)에서 금지된 말이 하나도 없고, 규칙마다 지키는 말이 실제로 있다', () => {
  const base = [];
  for (let y = -8000; y < 1500; y += 10) base.push(y);
  for (let y = 1500; y <= 2026; y++) base.push(y);
  const bad = [];
  const seen = new Set();   // 규칙 번호: 허락된 때·곳(또는 다른 땅)에서 그 말이 나왔다
  for (const area of AREA_IDS) {
    const mine = ANACHRONISM.map((r, i) => [r, i]).filter(([r]) => ruleHits(r, area));
    const years = new Set(base);
    for (const [r] of mine) {
      if (Number.isFinite(r.notBefore)) for (let d = 1; d <= 5; d++) years.add(r.notBefore - d);
      if (Number.isFinite(r.notAfter)) for (let d = 1; d <= 5; d++) years.add(r.notAfter + d);
    }
    for (const year of years) {
      if (year < -8000 || year > 2026) continue;
      const t = textsOf(contextOf(year, area, HOUSEHOLDS[groupOf(year)][0].id));
      const joined = Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v.join('\u0001')]));
      const all = Object.values(joined).join('\u0001');
      const hitIn = (r, fields) => (r.exact ? fields.some((f) => t[f].includes(r.term)) : fields.some((f) => joined[f].includes(r.term)));
      const hit = (r) => (r.fields || r.exact ? hitIn(r, r.fields || Object.keys(t)) : all.includes(r.term));
      ANACHRONISM.forEach((r, i) => {
        const here = ruleHits(r, area);
        if (here && forbidden(r, year)) {
          if (hit(r)) bad.push(`${area} ${year}: 「${r.term}」 (${r.notBefore ?? ''}~${r.notAfter ?? ''} 밖)`);
          else if (r.fields && !seen.has(i) && hitIn(r, Object.keys(t).filter((f) => !r.fields.includes(f)))) seen.add(i);   // 같은 땅의 다른 칸에서는 허락된 말
        } else if (!seen.has(i) && (here || r.notBefore === Infinity) && hit(r)) seen.add(i);
      });
    }
  }
  clearContextCache();
  assert.deepEqual(bad.slice(0, 25), [], `${bad.length}건`);
  const dead = ANACHRONISM.filter((r, i) => !seen.has(i)).map((r) => `${r.term} ${JSON.stringify(r.areas || r.zones || '모든 땅')}`);
  assert.deepEqual(dead, [], '지키는 말이 데이터에 없는 규칙');
});

test('FARM_FROM: 40개 땅이 다 있고, 그 해 전 고대·중세·근세 묶음은 수렵 무리다', () => {
  assert.deepEqual(Object.keys(FARM_FROM).sort(), [...AREA_IDS].sort());
  for (const [a, y] of [['japan', -2000], ['australia', 1650], ['la_plata', 1200], ['congo', -3000], ['south_africa', 100], ['north_america', -3000]]) {
    const c = contextOf(y, a, HOUSEHOLDS[groupOf(y)][0].id);
    assert.equal(c.status.system.ko, '무리와 친족', `${a} ${y}`);
    assert.ok(c.tech.level <= 1 && c.disease.medicine === 0, `${a} ${y}`);
  }
  assert.equal(contextOf(-2000, 'japan', 'farm').words.crop.ko, '도토리');
  assert.equal(contextOf(-800, 'japan', 'farm').words.crop.ko, '쌀');
  assert.equal(contextOf(1650, 'australia', 'farm').words.beast.ko, '캥거루');
  assert.notEqual(contextOf(1600, 'la_plata', 'farm').status.system.ko, '무리와 친족');
});

test('검토 1차: 남아시아 신분제 계단, 세계대전 중립국, 아프리카, 북아메리카 1500~1699', () => {
  // 바르나 전 마을, 바르나(−1000~), 바르나와 자티(300~)
  for (const a of SA) {
    const old = contextOf(-2500, a, 'farm');
    assert.ok(!/바르나|자티/.test(old.status.system.ko + old.status.ranks.farm.ko), `${a} −2500`);
    assert.ok(!/자티/.test(contextOf(-500, a, 'farm').status.ranks.farm.ko), `${a} −500`);
  }
  assert.equal(contextOf(-500, 'india', 'farm').status.system.ko, '바르나');
  assert.equal(contextOf(400, 'india', 'farm').status.system.ko, '바르나와 자티');
  assert.notEqual(contextOf(-5000, 'lanka', 'farm').words.holy.ko, '절');
  assert.equal(contextOf(-100, 'lanka', 'farm').words.holy.ko, '절');
  for (const a of SA) for (const y of [300, 1200, 1650, 1900]) assert.ok(!/가장 낮은/.test(contextOf(y, a, 'serve').status.ranks.serve.ko), `${a} ${y}`);
  assert.ok(!/자티/.test(contextOf(1700, 'bengal', 'farm').status.ranks.farm.ko), '벵골 1600~ 무슬림 집안에 자티 이름 없음');
  // 세계대전: 중립국은 오르지 않고, 북아프리카 전선은 있다
  assert.equal(contextOf(1941, 'iberia', 'farm').war.level, 1);
  assert.equal(contextOf(1916, 'iberia', 'farm').war.level, 1);
  assert.equal(contextOf(1916, 'nordic', 'farm').war.level, 1);
  assert.equal(contextOf(1942, 'nordic', 'farm').war.level, 2);
  assert.equal(contextOf(1942, 'australia', 'farm').war.level, 2);
  assert.equal(contextOf(1942, 'korea', 'farm').war.level, 2);
  assert.equal(contextOf(1942, 'germany', 'farm').war.level, 3);
  assert.equal(contextOf(1942, 'maghreb', 'farm').war.level, 3);
  assert.equal(contextOf(1942, 'nile', 'farm').war.name.ko, '북아프리카 전선');
  // 아프리카
  assert.equal(contextOf(1920, 'congo', 'farm').words.coin.ko, '프랑');
  assert.equal(contextOf(1980, 'congo', 'farm').words.coin.ko, '자이르');
  assert.ok(contextOf(1930, 'east_africa', 'farm').status.system.ko.includes('독립 제국'));
  const sa = contextOf(1970, 'south_africa', 'factory');
  assert.ok(sa.status.system.ko.includes('아파르트헤이트'));
  assert.equal(sa.status.ranks.factory.bound, true);
  assert.equal(contextOf(1970, 'south_africa', 'farm').words.coin.ko, '랜드');
  assert.ok(contextOf(2000, 'south_africa', 'farm').status.system.ko.includes('민주 공화국'));
  // 북아메리카 1500~1699: 원주민 마을 (화약·사탕수수·정복 전쟁 없음), 1700~ 식민지
  const na = contextOf(1520, 'north_america', 'farm');
  assert.ok(na.tech.level <= 2 && na.war.name.ko !== '정복 전쟁');
  assert.ok(na.tech.items.every((x) => !/화약|사탕수수/.test(x.ko)));
  assert.equal(contextOf(1520, 'mesoamerica', 'farm').war.name.ko, '정복 전쟁');
  assert.equal(contextOf(1750, 'north_america', 'farm').words.holy.ko, '교회');
  // 안데스 식민 물건은 은광, 카리브 설탕 농장은 1520년 무렵부터
  assert.ok(contextOf(1650, 'andes', 'farm').tech.items.some((x) => x.ko === '은광'));
  assert.notEqual(contextOf(1510, 'caribbean', 'farm').status.ranks.farm.ko, '사탕수수 농장의 노예');
  assert.equal(contextOf(1650, 'caribbean', 'farm').status.ranks.farm.ko, '사탕수수 농장의 노예');
  // 첫돌 케이크는 1870년부터 (그 앞은 빵 줄)
  assert.ok(contextOf(1820, 'france', 'farm').firstYear.ko.includes('빵'));
  assert.ok(contextOf(1900, 'france', 'farm').firstYear.ko.includes('케이크'));
});

test('수렵 무리는 농사가 닿은 해가 지나도 무리의 낱말을 쓴다 (1800 오스트레일리아 band)', () => {
  const band = contextOf(1800, 'australia', 'band'), farm = contextOf(1800, 'australia', 'farm'), pre = contextOf(1700, 'australia', 'band');
  assert.deepEqual(band.words.crop, pre.words.crop);
  assert.notDeepEqual(band.words.crop, farm.words.crop);
});
