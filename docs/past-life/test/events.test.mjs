// 역사 사건과 사인 (설계 3.3·4·7장)
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { EVENTS, KINDS, activeEvents } from '../events.js';
import { EVENT_CARDS } from '../cards_event.js';
import { CAUSES, drawCause } from '../deaths.js';
import { REGIONS, AREAS } from '../places.js';
import { ZONE_OF, ZONES, DISEASES } from '../context_data.js';
import { contextOf, clearContextCache } from '../context.js';
import { drawBirth } from '../birth.js';
import { eraOf } from '../births.js';
import { yearHazard, shapeFor } from '../lifetable.js';
import { createRng } from '../rng.js';

// Task 5 전부터 있던 24개 (위험률 상한이 다르다: 흑사병 0.10, 접촉 0.06)
const LEGACY = ['drought42', 'bronze', 'winter536', 'justinian', 'blackdeath', 'contact', 'newcrops', 'imjin', 'thirty', 'mingqing', 'slavetrade', 'nosummer',
  'famine1876', 'ww1', 'flu1918', 'ww2', 'bengal', 'koreanwar', 'greatleap', 'writing', 'printing', 'factories', 'vaccine', 'antibiotics'];
const areasOf = (e) => new Set([...(e.areas || []), ...Object.keys(AREAS).filter((a) => (e.regions || []).includes(AREAS[a].region))]);
const zonesOf = (e) => new Set([...areasOf(e)].map((a) => ZONE_OF[a]));
const pair = (o) => !!o && typeof o.ko === 'string' && o.ko.trim().length > 0 && typeof o.en === 'string' && o.en.trim().length > 0;

test('사건 표가 바르다 (100개 이상, 해·지역·땅·사인)', () => {
  assert.ok(EVENTS.length >= 100, `사건 ${EVENTS.length}개`);
  assert.equal(new Set(EVENTS.map((e) => e.id)).size, EVENTS.length);
  for (const id of LEGACY) assert.ok(EVENTS.some((e) => e.id === id), `처음 24개: ${id}`);
  for (const e of EVENTS) {
    assert.ok(/^[a-z][a-z0-9_]*$/.test(e.id), e.id);
    assert.ok(Number.isInteger(e.from) && Number.isInteger(e.to) && e.from < e.to, `${e.id} ${e.from}~${e.to}`);
    assert.ok(e.from >= -10000 && e.to <= 2026, e.id);
    assert.ok(e.regions || e.areas, e.id);
    for (const g of e.regions || []) assert.ok(REGIONS.includes(g), `${e.id} ${g}`);
    for (const a of e.areas || []) assert.ok(AREAS[a], `${e.id} ${a}`);
    assert.ok(e.hazard === 0 || CAUSES[e.cause], e.id);
    assert.ok(e.ko && e.en, e.id);
    assert.ok(e.start && e.start.ko && e.start.en, e.id);
  }
});

test('activeEvents: 해·지역·땅으로 찾는다', () => {
  assert.ok(activeEvents(1348, 'europe', 'france').some((e) => e.id === 'blackdeath'));
  assert.ok(!activeEvents(1348, 'east', 'china').some((e) => e.id === 'blackdeath'));
  assert.ok(activeEvents(1595, 'east', 'korea').some((e) => e.id === 'imjin'));
  assert.ok(!activeEvents(1595, 'east', 'japan').some((e) => e.id === 'imjin'));
  assert.ok(activeEvents(1816, 'americas', 'north_america').some((e) => e.id === 'nosummer'));
  assert.ok(!activeEvents(1346, 'europe', 'france').some((e) => e.id === 'blackdeath'));
  assert.ok(activeEvents(1351, 'europe', 'france').some((e) => e.id === 'blackdeath'));
});

test('사인: 바닷가면 익사가, 젊은 여자면 출산이 나오고, 바다 집안은 익사가 더 잦다', () => {
  const r = createRng('cause2');
  const count = (ctx, id) => { let k = 0; for (let i = 0; i < 4000; i++) if (drawCause(r, ctx) === id) k++; return k; };
  const coast = count({ age: 30, group: 'ancient', sex: 'm', tags: ['farm'], coast: true }, 'drown');
  const sea = count({ age: 30, group: 'ancient', sex: 'm', tags: ['sea'], coast: true }, 'drown');
  assert.ok(coast > 0);
  assert.ok(sea > coast * 1.5, `${sea} vs ${coast}`);
  assert.ok(count({ age: 25, group: 'ancient', sex: 'f', tags: ['farm'], coast: false, married: true }, 'childbirth') > 0);
});

test('사인: 출산은 짝이 있거나 아이를 낳아 본 여자만 (미혼·아이 없음이면 다른 사인끼리)', () => {
  const r = createRng('cause3');
  const base = { age: 25, group: 'ancient', sex: 'f', tags: ['farm'], coast: false };
  const count = (ctx) => { let k = 0; for (let i = 0; i < 4000; i++) { const c = drawCause(r, ctx); assert.ok(CAUSES[c], c); if (c === 'childbirth') k++; } return k; };
  assert.equal(count(base), 0);
  assert.equal(count({ ...base, group: 'modern', married: false, kids: 0 }), 0);
  assert.ok(count({ ...base, married: true }) > 0);
  assert.ok(count({ ...base, kids: 2 }) > 0);
  assert.equal(count({ ...base, sex: 'm', married: true, kids: 3 }), 0);
});

test('사인과 두려움 연결 (설계 4장)', () => {
  const want = { drown: 'sea', fall: 'heights', fire: 'fire', beast: 'beast', war: 'war', plague: 'plague', hunger: 'hunger' };
  for (const [c, f] of Object.entries(want)) assert.equal(CAUSES[c].fear, f, c);
  for (const c of ['fever', 'oldage', 'cancer']) assert.equal(CAUSES[c].fear, null, c);
});

test('사인: 바닷가 아니면 물에 빠지지 않고, 남자는 출산으로 죽지 않는다', () => {
  const r = createRng('cause');
  for (let i = 0; i < 3000; i++) {
    const c = drawCause(r, { age: 30, group: 'ancient', sex: 'm', tags: ['farm'], coast: false });
    assert.notEqual(c, 'drown'); assert.notEqual(c, 'childbirth');
    assert.ok(CAUSES[c], c);
  }
});

test('사인 글은 사인마다 한·영 2줄, 두려움 key 는 정해진 것만', () => {
  const FEARS = ['sea', 'fire', 'war', 'plague', 'hunger', 'heights', 'beast'];
  for (const [id, c] of Object.entries(CAUSES)) {
    assert.equal(c.ko.length, 2, id); assert.equal(c.en.length, 2, id);
    assert.ok(c.name.ko && c.name.en, id);
    assert.ok(c.fear === null || FEARS.includes(c.fear), id);
  }
});

// ── Task 5: 사건 100개 이상 ──

test('사건 카드: 카드가 붙은 사건 50개 이상, 카드마다 사건이 있고 사건마다 카드는 하나 이하, 출처 메모가 있다', () => {
  const ids = new Set(EVENTS.map((e) => e.id));
  for (const c of EVENT_CARDS) {
    assert.ok(ids.has(c.event), `${c.id}: 없는 사건 ${c.event}`);
    assert.equal(c.id, `ev.${c.event}`, c.id);
    assert.equal(c.stage, 'child', c.id);
    assert.ok(c.when && c.when.minAge >= 5, c.id);
    assert.ok(pair(c.title) && pair(c.text) && pair(c.note), `${c.id}: 제목·글·메모 한영 짝`);
    assert.ok(c.choices.length >= 2 && c.choices.length <= 3, c.id);
    for (const ch of c.choices) {
      for (const eff of [ch.effects, ch.chance && ch.chance.win.effects, ch.chance && ch.chance.lose.effects].filter(Boolean))
        for (const [k, v] of Object.entries(eff)) assert.ok(['health', 'wealth', 'family', 'happy'].includes(k) && Number.isInteger(v) && Math.abs(v) <= 15, `${c.id} ${k} ${v}`);
    }
  }
  const withCard = new Set(EVENT_CARDS.map((c) => c.event));
  assert.equal(withCard.size, EVENT_CARDS.length, '사건 하나에 카드 둘');
  assert.ok(withCard.size >= 50, `카드가 붙은 사건 ${withCard.size}개`);
});

test('문화권마다 사건 8개 이상, 남아시아·동아시아는 15개 이상 (온 세계 사건은 빼고 센다)', () => {
  const n = Object.fromEntries(ZONES.map((z) => [z, 0]));
  for (const e of EVENTS) { const zs = zonesOf(e); if (zs.size < ZONES.length) for (const z of zs) n[z]++; }
  for (const z of ZONES) assert.ok(n[z] >= (z === 'southasia' || z === 'eastasia' ? 15 : 8), `${z}: ${n[z]}개`);
});

test('사건 종류가 고르고, 옛 시대에도 사건이 있다', () => {
  for (const e of EVENTS) assert.ok(KINDS.includes(e.kind), `${e.id}: kind ${e.kind}`);
  for (const k of KINDS) assert.ok(EVENTS.filter((e) => e.kind === k).length >= 8, `${k}: ${EVENTS.filter((e) => e.kind === k).length}개`);
  // 삶의 77%가 1500년 전이다: 고대(−8000~599)·중세(600~1499)에 걸친 사건이 넉넉해야 한다
  assert.ok(EVENTS.filter((e) => e.from < 600).length >= 25, '고대 사건');
  assert.ok(EVENTS.filter((e) => e.to >= 600 && e.from < 1500).length >= 30, '중세 사건');
  // 출생이 많은 남아시아·동아시아는 1500년 전에도
  for (const z of ['southasia', 'eastasia']) assert.ok(EVENTS.filter((e) => e.from < 1500 && zonesOf(e).has(z) && zonesOf(e).size < ZONES.length).length >= 8, z);
});

test('맥락 필드 범위: war 0~3·warAt·warName·econ 0.5~3·disease id·after', () => {
  const KEYS = ['id', 'from', 'to', 'regions', 'areas', 'hazard', 'cause', 'ko', 'en', 'start', 'kind', 'war', 'warAt', 'warName', 'econ', 'disease', 'after', 'p'];
  const lv = (v) => Number.isInteger(v) && v >= 0 && v <= 3;
  const econOk = (x, at) => {
    assert.ok(x && typeof x === 'object' && Object.keys(x).length > 0, at);
    for (const [k, v] of Object.entries(x)) assert.ok(['price', 'wage'].includes(k) && v >= 0.5 && v <= 3, `${at} ${k} ${v}`);
  };
  for (const e of EVENTS) {
    for (const k of Object.keys(e)) assert.ok(KEYS.includes(k), `${e.id}: 모르는 필드 ${k}`);
    if (e.war !== undefined) assert.ok(lv(e.war), `${e.id} war ${e.war}`);
    if (e.warAt !== undefined) {
      assert.ok(e.war !== undefined, `${e.id}: warAt 은 war 와 함께`);
      const mine = areasOf(e);
      for (const [a, v] of Object.entries(e.warAt)) assert.ok(mine.has(a) && lv(v), `${e.id} warAt ${a} ${v}`);
    }
    if (e.warName !== undefined) assert.ok(pair(e.warName) && e.war > 0, `${e.id} warName`);
    if (e.econ !== undefined) econOk(e.econ, e.id);
    if (e.disease !== undefined) {
      assert.ok(Array.isArray(e.disease) && e.disease.length > 0, `${e.id} disease 는 배열`);
      for (const d of e.disease) assert.ok(DISEASES[d], `${e.id} disease ${d}`);
    }
    if (e.after !== undefined) { assert.ok(Number.isInteger(e.after.years) && e.after.years >= 1 && e.after.years <= 150, e.id); econOk(e.after.econ, e.id); }
    if (e.p !== undefined) assert.ok(e.p > 0 && e.p <= 1, e.id);
  }
  // 위험률: 0 이상, 죽는 사건만 사인을 갖고, 새 사건은 0.05 이하 (게임용 어림)
  for (const e of EVENTS) {
    assert.ok(e.hazard >= 0 && e.hazard <= 0.1, `${e.id} ${e.hazard}`);
    assert.equal(e.hazard > 0, e.cause !== null && CAUSES[e.cause] !== undefined, `${e.id}: 위험률과 사인`);
    if (!LEGACY.includes(e.id)) assert.ok(e.hazard <= 0.05, `${e.id} ${e.hazard}`);
  }
  assert.ok(EVENTS.filter((e) => e.war >= 2).length >= 30, '전쟁 사건');
  assert.ok(EVENTS.filter((e) => e.disease).length >= 15, '유행병 사건');
  assert.ok(EVENTS.filter((e) => e.econ).length >= 50, '값·품삯 사건');
});

test('한영 짝과 시작 줄: 이름·시작 줄이 다 있고, 시작 줄 첫 문장만으로 뜻이 선다', () => {
  for (const e of EVENTS) {
    assert.ok(pair({ ko: e.ko, en: e.en }) && pair(e.start), e.id);
    assert.ok(e.ko.length <= 24 && e.en.length <= 60, `${e.id} 이름 길이`);
    assert.ok(e.start.ko.length <= 70 && e.start.en.length <= 140, `${e.id} 시작 줄 길이 ${e.start.ko.length}/${e.start.en.length}`);
    // 모닥불 기억은 시작 줄의 첫 문장을 쓴다 (memory.js clip)
    const first = e.start.ko.match(/^(.*?[.!?])(\s|$)/);
    assert.ok(first && first[1].length >= 6, `${e.id}: 시작 줄 첫 문장`);
    assert.ok(!/[{}]/.test(e.start.ko + e.start.en), e.id);
  }
});

// 실재 인물의 이름은 쓰지 않는다 (설계 4.3). 통치자는 칭호로만
const NAMES_EN = ['Ashoka', 'Asoka', 'Musa', 'Genghis', 'Chinggis', 'Temujin', 'Kublai', 'Hulagu', 'Napoleon', 'Gandhi', 'Nehru', 'Jinnah', 'Akbar', 'Babur', 'Aurangzeb',
  'Timur', 'Tamerlane', 'Hongwu', 'Zhu Yuanzhang', 'Zheng He', 'Zhang Qian', 'Bi Sheng', 'An Lushan', 'Sejong', 'Yi Sun-sin', 'Hideyoshi', 'Nobunaga', 'Ieyasu',
  'Alexander', 'Caesar', 'Hannibal', 'Charlemagne', 'Saladin', 'Mehmed', 'Cortés', 'Cortes', 'Pizarro', 'Columbus', 'da Gama', 'Marco Polo', 'Ibn Battuta',
  'Moctezuma', 'Montezuma', 'Atahualpa', 'Pachacuti', 'Mao', 'Hitler', 'Stalin', 'Lenin', 'Gutenberg', 'Jenner', 'Luther', 'Hammurabi', 'Aryabhata', 'Mahmud',
  'Qin Shi Huang', 'Justinian', 'Muhammad', 'Hong Taiji', 'Prithvi Narayan', 'Mahinda', 'Wiman', 'Injo', 'Yi Seong-gye', 'Taejo', 'Kangxi', 'Qianlong', 'Yongle', 'Lin Zexu', 'Toyotomi', 'Oda Nobunaga'];
const NAMES_KO = ['아소카', '만사 무사', '칭기즈', '테무친', '쿠빌라이', '훌라구', '나폴레옹', '간디', '네루', '아크바르', '바부르', '아우랑제브', '티무르', '주원장', '홍무제',
  '정화의', '장건', '안녹산', '세종', '이순신', '히데요시', '노부나가', '이에야스', '알렉산드로스', '카이사르', '한니발', '샤를마뉴', '살라딘', '메흐메트',
  '코르테스', '피사로', '콜럼버스', '바스쿠', '마르코 폴로', '이븐 바투타', '목테수마', '아타우알파', '파차쿠티', '마오쩌둥', '히틀러', '스탈린', '레닌',
  '구텐베르크', '제너', '루터', '함무라비', '아리아바타', '마흐무드',
  '이성계', '인조', '진시황', '정화 함대', '정화가', '알렉산더', '징기스칸', '홍타이지', '유스티니아누스', '무함마드', '프리트비', '마힌다', '위만', '태조', '강희제', '건륭제', '영락제', '임칙서', '도요토미'];
const hitsName = (s) => NAMES_EN.some((n) => new RegExp(`(^|[^A-Za-z])${n}([^A-Za-z]|$)`).test(s)) || NAMES_KO.some((n) => s.includes(n));
test('실재 인물 이름이 사건·사건 카드 글에 없다', () => {
  // 금지 표가 실제로 잡는지 먼저 본다 (「무사히」 같은 낱말은 잡지 않는다)
  assert.ok(hitsName('the reign of Ashoka') && hitsName('구텐베르크의 인쇄기') && !hitsName('Musandam') && !hitsName('무사히 돌아왔어요'));
  const texts = [];
  const walk = (v) => { if (typeof v === 'string') texts.push(v); else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x); };
  for (const e of EVENTS) walk({ ko: e.ko, en: e.en, start: e.start, warName: e.warName });
  for (const c of EVENT_CARDS) walk({ title: c.title, note: c.note, text: c.text, choices: c.choices });
  assert.deepEqual(texts.filter(hitsName), []);
});

test('출처: 모든 사건 id 가 CONTENT-SOURCES.md 「사건」 칸에 한 줄씩 있고, 새 사건 40개 이상을 웹으로 확인했다', () => {
  const md = readFileSync(new URL('../CONTENT-SOURCES.md', import.meta.url), 'utf8');
  const at = md.indexOf('\n## 사건');
  assert.ok(at >= 0, '「## 사건」 칸');
  const lines = md.slice(at).split('\n').filter((l) => l.startsWith('- ['));
  const idOf = (l) => l.slice(3).split(/[\s\]]/)[0];
  for (const e of EVENTS) assert.equal(lines.filter((l) => idOf(l) === e.id).length, 1, `${e.id} 출처 줄`);
  for (const l of lines) assert.ok(EVENTS.some((e) => e.id === idOf(l)) && l.includes(' — '), `출처 줄 모양: ${l.slice(0, 40)}`);
  const checked = lines.filter((l) => !LEGACY.includes(idOf(l)) && l.includes('확인함'));
  assert.ok(checked.length >= 40, `확인한 새 사건 ${checked.length}개`);
});

test('activeEvents·contextOf: 새 사건이 그해 그 땅에 걸리고 맥락을 바꾼다', () => {
  const has = (y, a, id) => activeEvents(y, AREAS[a].region, a).some((e) => e.id === id);
  assert.ok(has(1446, 'korea', 'hangul') && !has(1446, 'japan', 'hangul'));
  assert.ok(has(1258, 'mesopotamia', 'mongol_baghdad'));
  assert.ok(has(1770, 'bengal', 'bengal1770') && !has(1770, 'india', 'bengal1770'));
  assert.ok(has(-261, 'india', 'kalinga') && has(-240, 'indus', 'dhamma'));
  assert.ok(has(2020, 'pacific', 'covid') && has(2021, 'la_plata', 'covid'));
  assert.ok(!has(1890, 'east_africa', 'scramble'), '에티오피아(동아프리카 땅)는 분할에 넣지 않는다');
  // 병자호란: 땅이 전장, 이름은 사건 이름
  const b = contextOf(1636, 'korea', 'farm');
  assert.equal(b.war.level, 3);
  assert.equal(b.war.name.ko, '병자호란');
  // 경신 대기근: 돌림병과 곡식값
  const g = contextOf(1670, 'korea', 'farm');
  assert.ok(g.disease.endemic.includes('typhus') && g.econ.price > 1.5 && g.econ.wage < 1, JSON.stringify(g.econ));
  // 덴표 천연두 뒤 20년은 품삯이 높다
  assert.ok(contextOf(745, 'japan', 'farm').econ.wage > 1);
  assert.equal(contextOf(760, 'japan', 'farm').econ.wage, 1);
  // 잉카 정복의 전쟁 이름은 접촉 사건과 같다
  assert.equal(contextOf(1540, 'andes', 'farm').war.name.ko, '정복 전쟁');
  // 백년 전쟁: 프랑스는 전쟁(2), 브리튼은 국경 다툼(1)
  assert.equal(contextOf(1400, 'france', 'farm').war.level, 2);
  assert.equal(contextOf(1400, 'france', 'farm').war.name.ko, '백년 전쟁');
  assert.equal(contextOf(1400, 'britain', 'farm').war.level, 1);
  // 흉노: 몽골 초원은 전쟁, 중국 땅은 국경 다툼
  assert.equal(contextOf(-150, 'mongolia', 'herd').war.level, 2);
  assert.equal(contextOf(-150, 'china', 'farm').war.level, 1);
  clearContextCache();
});

// ── 수정 1차 (검토 task-5-review.md) ──

test('출처 줄의 해가 events.js 의 from~to 와 같다', () => {
  const md = readFileSync(new URL('../CONTENT-SOURCES.md', import.meta.url), 'utf8');
  const lines = md.slice(md.indexOf('\n## 사건')).split('\n').filter((l) => l.startsWith('- ['));
  const num = (x) => Number(x.replace('−', '-'));
  for (const l of lines) {
    const m = l.match(/^- \[(\w+) (−?\d+)~(−?\d+) · /);
    assert.ok(m, `출처 줄 모양: ${l.slice(0, 40)}`);
    const e = EVENTS.find((x) => x.id === m[1]);
    assert.deepEqual([num(m[2]), num(m[3])], [e.from, e.to], m[1]);
  }
});

// 사건 카드는 minAge 말고는 조건을 읽지 않는다 (life.js). 부역·징집·광산·먼 길 카드는 그 나이부터 (그 전에는 아껴 둔다)
const GROWN = ['harappa_trade', 'pyramids', 'lapita', 'qin', 'silk_road', 'yellow_turban', 'saharan_trade', 'hundred_years', 'yuan_ming', 'inca_roads', 'sengoku', 'potosi_mita', 'scramble'];
test('사건 카드가 그 나이·그해에 맞다: 어른 몫 카드는 15살부터, 짧은 일은 사건을 따로 둔다', () => {
  for (const id of GROWN) {
    const c = EVENT_CARDS.find((x) => x.event === id);
    assert.ok(c && c.when.minAge >= 15, `${id}: minAge ${c && c.when.minAge}`);
  }
  // 아이도 보는 카드에는 징집·부역·과거 같은 어른·남자 몫 선택지를 두지 않는다
  for (const c of EVENT_CARDS.filter((x) => x.when.minAge < 15 && !LEGACY.includes(x.event)))
    for (const ch of c.choices) assert.ok(!/징집|부역|창을 들|과거 공부|품을 팔/.test(ch.text.ko), `${c.id}: ${ch.text.ko}`);
  // 토지 조사(1910~1918) 카드는 강점기 전체(1910~1945)가 아니라 토지 조사 사건에 붙는다
  const ls = EVENTS.find((e) => e.id === 'korea_land_survey');
  assert.ok(ls && ls.to <= 1918);
  assert.ok(EVENT_CARDS.some((c) => c.event === 'korea_land_survey') && !EVENT_CARDS.some((c) => c.event === 'korea_colony'));
});

test('아픈 제도의 사망 줄: 제도 사건의 사인은 사고·굶주림이 아니다', () => {
  for (const e of EVENTS.filter((x) => x.kind === 'institution' && x.hazard > 0)) assert.ok(['lung', 'war', 'plague'].includes(e.cause), `${e.id}: ${e.cause}`);
  assert.equal(EVENTS.find((e) => e.id === 'potosi_mita').cause, 'lung');
  assert.equal(EVENTS.find((e) => e.id === 'congo_rubber').cause, 'war');
  // 사건 사인은 사인 표의 것만 (사망 줄은 deaths.js CAUSES[사인] 두 줄)
  for (const e of EVENTS.filter((x) => x.hazard > 0)) assert.equal(CAUSES[e.cause].ko.length, 2, e.id);
});

test('사건이 생명표를 크게 흔들지 않는다: 시드 3천 개, 사건 넣은 e0 가 사건 없는 e0 보다 0.5년 넘게 낮지 않다', () => {
  const live = EVENTS.filter((e) => e.hazard > 0);
  const byArea = {};
  for (const a of Object.keys(AREAS)) byArea[a] = live.filter((e) => areasOf(e).has(a));
  let s0 = 0, s1 = 0;
  const N = 3000;
  for (let i = 0; i < N; i++) {
    const b = drawBirth('E0-' + i);
    for (const withEv of [false, true]) {
      let S = 1, tot = 0;
      for (let a = 0; a < 119; a++) {
        const y = b.year + a;
        if (y > 2026) { tot += S * (119 - a); break; }
        let h = yearHazard(shapeFor(eraOf(y).id, b.region), a);
        if (withEv) for (const e of byArea[b.area]) if (y >= e.from && y <= e.to) h += e.hazard;
        const q = 1 - Math.exp(-h);
        tot += S * (1 - q / 2); S *= 1 - q;
      }
      if (withEv) s1 += tot; else s0 += tot;
    }
  }
  const d = (s0 - s1) / N;
  assert.ok(d >= 0 && d < 0.5, `e0 차이 ${d.toFixed(3)}년`);
});
