// 땅·자리 고유 카드·줄 (시뮬 2.0 설계 4.2, 작업 7 · 유럽 + 서아시아·북아프리카 몫: cards_local_eu.js · lines_local_eu.js)
//   - 다섯 조합(유럽 마을·거리·큰 집, 서아시아·북아프리카 마을, 서아시아 야영지)마다 카드·줄 수가 설계 4.2 표 이상
//   - 모든 카드·줄에 문화권(zones) + 사는 자리(setting) + 시대 조건, 땅(areas)은 그 문화권 안
//   - 한·영 글이 다 있고 길이·효과 범위를 지킨다. 나올 수 있는 모든 땅 × 해 × 집안 맥락에서 자리 글이 빈틈없이 채워진다
//   - id 가 겹치지 않고, 실재 인물 이름이 없고, 병 카드에 ill 표지, 선택지 when 이 몇 번 쓰였고, 큰 집은 귀족 쪽·하인 쪽이 다 있다
//   - 실제로 놀아 보면(시드 생, 자동 결정) 이 조합에 태어난 생 대부분이 고유 카드·줄을 만난다
import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_CARDS_EU } from '../cards_local_eu.js';
import { LOCAL_LINES_EU } from '../lines_local_eu.js';
import { DECK } from '../deck.js';
import { LINES } from '../lines.js';
import { condOk, eligible } from '../cards.js';
import { AREAS } from '../places.js';
import { HOUSEHOLDS, beforeFarming } from '../households.js';
import { groupOf, eraOf } from '../births.js';
import { contextOf } from '../context.js';
import { ZONE_OF } from '../context_data.js';
import { settingOf, SETTINGS } from '../lands.js';
import { fillTokens, hasWordTokens, leftoverBraces } from '../tokens.js';
import { FEARS, TALENTS, DREAMS, BONDS } from '../traces.js';
import { drawBirth } from '../birth.js';
import { createLife, advance, choose, autoChoice } from '../life.js';

const CARDS = LOCAL_CARDS_EU, LINES_EU = LOCAL_LINES_EU, ALL = [...CARDS, ...LINES_EU];

// 설계 4.2 표 (카드 / 줄)
const COMBOS = {
  'eu.village': { name: '유럽 마을', cards: 8, lines: 10 },
  'eu.street': { name: '유럽 거리', cards: 4, lines: 6 },
  'eu.estate': { name: '유럽 큰 집', cards: 4, lines: 6 },
  'mb.village': { name: '서아시아·북아프리카 마을', cards: 8, lines: 10 },
  'mb.camp': { name: '서아시아 야영지', cards: 4, lines: 6 },
};
// 카드·줄 → 조합 열쇠 (zones + setting 으로). 다섯 조합 밖이면 null
function comboOf(c) {
  const w = c.when || {}, z = w.zones || [], s = w.setting;
  if (z.length === 1 && z[0] === 'europe' && ['village', 'street', 'estate'].includes(s)) return `eu.${s}`;
  if (z.length === 1 && z[0] === 'mudbrick' && s === 'village') return 'mb.village';
  if (z.length && z.every((x) => x === 'mudbrick' || x === 'steppe') && s === 'camp') return 'mb.camp';
  return null;
}

const ZONES_OK = new Set(Object.values(ZONE_OF));
const STAGE_AGE = { baby: 3, child: 9, teen: 16, adult: 30, middle: 50, old: 70 };
const stagesOf = (c) => [].concat(c.stage);
const LIFE_ONLY = ['sex', 'flags', 'notFlags', 'trace', 'minAge', 'maxAge', 'stat', 'minKnow', 'maxKnow', 'minStatus', 'maxStatus', 'bound', 'war'];
const geoOf = (w) => Object.fromEntries(Object.entries(w || {}).filter(([k]) => !LIFE_ONLY.includes(k)));

// 글 조각 [어디, {ko, en}]
function piecesOf(c) {
  const out = [];
  const add = (where, o) => { if (o) out.push([where, o]); };
  add('title', c.title); add('text', c.text); add('note', c.note);
  (c.choices || []).forEach((ch, i) => {
    add(`choice${i}`, ch.text);
    if (ch.chance) { add(`choice${i}.win`, ch.chance.win.result); add(`choice${i}.lose`, ch.chance.lose.result); } else add(`choice${i}.result`, ch.result);
  });
  return out;
}

// 맥락 목록: 내 문화권 땅 × 해 × 그 묶음의 집안 (농사 전 땅이면 수렵 무리도). gate 는 cards.js condOk 가 보는 모양
const YEARS = [-100000, -60000, -20000, -12500, -10000, -9000, -7200, -6000, -5000, -4000, -3000, -2500, -2000, -1500, -1000, -700, -500, -400, -300, -100, 1,
  100, 200, 300, 400, 500, 650, 800, 900, 1000, 1100, 1200, 1300, 1360, 1400, 1450, 1500, 1550, 1600, 1650, 1700, 1750, 1800, 1850, 1880, 1900, 1940, 1960, 1975, 1990, 2010];
const MY_AREAS = Object.keys(AREAS).filter((a) => ['europe', 'mudbrick', 'steppe'].includes(ZONE_OF[a]));
const CTXS = (() => {
  const out = [];
  for (const area of MY_AREAS) for (const year of YEARS) {
    const g = groupOf(year), hs = [...HOUSEHOLDS[g]];
    if (g !== 'forager' && beforeFarming(area, year)) hs.push(HOUSEHOLDS.forager[0]);
    for (const h of hs) {
      if (g !== 'forager' && h.id !== 'band' && beforeFarming(area, year)) continue;   // 농사 전 땅에는 무리만 태어난다
      const group = h.id === 'band' ? 'forager' : g, world = contextOf(year, area, h.id);
      const gate = { year, era: eraOf(year).id, group, region: AREAS[area].region, area, coast: !!AREAS[area].coast, tags: h.tags, zone: world.zone, setting: settingOf(h.id, group) };
      out.push({ year, area, h: h.id, world, gate });
    }
  }
  return out;
})();

test('id: loc.eu.· / l.loc.eu. 로 시작하고 덱·줄 전체에서 겹치지 않는다', () => {
  for (const c of CARDS) assert.ok(/^loc\.eu\.[a-z]+\.[a-z0-9_]+$/.test(c.id), c.id);
  for (const l of LINES_EU) assert.ok(/^l\.loc\.eu\.[a-z]+\.[a-z0-9_]+$/.test(l.id), l.id);
  const ids = ALL.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length, '내 카드·줄 안에서 겹침');
  for (const c of CARDS) assert.equal(DECK.filter((x) => x.id === c.id).length, 1, `덱에 한 번: ${c.id}`);
  for (const l of LINES_EU) assert.equal(LINES.filter((x) => x.id === l.id).length, 1, `줄 모음에 한 번: ${l.id}`);
});

test('조합마다 카드·줄 수가 설계 4.2 표 이상 (유럽 마을 8/10 · 거리 4/6 · 큰 집 4/6 · 서아시아 마을 8/10 · 야영지 4/6)', () => {
  const n = Object.fromEntries(Object.keys(COMBOS).map((k) => [k, { cards: 0, lines: 0 }]));
  for (const c of CARDS) { const k = comboOf(c); assert.ok(k, `조합 밖 카드 ${c.id}`); n[k].cards++; }
  for (const l of LINES_EU) { const k = comboOf(l); assert.ok(k, `조합 밖 줄 ${l.id}`); n[k].lines++; }
  for (const [k, want] of Object.entries(COMBOS)) {
    assert.ok(n[k].cards >= want.cards, `${want.name} 카드 ${n[k].cards} < ${want.cards}`);
    assert.ok(n[k].lines >= want.lines, `${want.name} 줄 ${n[k].lines} < ${want.lines}`);
  }
});

test('모든 카드·줄에 문화권 + 사는 자리 + 시대 조건, 땅은 그 문화권 안, 큰 집 카드·줄은 귀족 쪽이나 하인 쪽', () => {
  for (const c of ALL) {
    const w = c.when || {};
    assert.ok(Array.isArray(w.zones) && w.zones.length && w.zones.every((z) => ZONES_OK.has(z)), `${c.id} zones`);
    assert.ok(SETTINGS.includes(w.setting), `${c.id} setting`);
    assert.ok(w.eraGroups || w.minYear != null || w.maxYear != null, `${c.id} 시대 조건`);
    if (w.areas) for (const a of w.areas) assert.ok(AREAS[a] && w.zones.includes(ZONE_OF[a]), `${c.id} 땅 ${a} 가 ${w.zones} 밖`);
    if (w.setting === 'estate') assert.ok(w.tags && w.tags.length === 1 && ['elite', 'serve'].includes(w.tags[0]), `${c.id} 큰 집은 elite 나 serve 한쪽`);
    if (w.minYear != null && w.maxYear != null) assert.ok(w.minYear < w.maxYear, `${c.id} 해 범위`);
  }
  // 같은 집의 앞마당과 뒤뜰: 카드·줄 모두 양쪽이 있다
  for (const list of [CARDS, LINES_EU]) for (const side of ['elite', 'serve']) {
    assert.ok(list.some((c) => comboOf(c) === 'eu.estate' && c.when.tags[0] === side), `큰 집 ${side} 쪽`);
  }
});

test('글: 한·영 짝, 길이 제한, 선택지 2~3개, 효과 키·범위, 흔적 키', () => {
  const LIM = { ko: { text: 90, choice: 18, result: 70, title: 16 }, en: { text: 180, choice: 40, result: 150, title: 40 } };
  const RANGE = { health: 25, wealth: 25, family: 25, happy: 25, luck: 20, charm: 20, know: 20, skill: 20, status: 1 };
  const chk = (o, kind, id) => {
    for (const l of ['ko', 'en']) {
      assert.ok(o && typeof o[l] === 'string' && o[l].trim().length > 0, `${id} ${kind} ${l}`);
      assert.ok(o[l].length <= LIM[l][kind], `${id} ${kind} ${l} ${o[l].length}자: ${o[l]}`);
    }
  };
  for (const c of CARDS) {
    chk(c.title, 'title', c.id); chk(c.text, 'text', c.id);
    assert.ok(c.choices.length >= 2 && c.choices.length <= 3, c.id);
    for (const ch of c.choices) {
      chk(ch.text, 'choice', c.id);
      if (ch.chance) { assert.ok(ch.chance.p > 0 && ch.chance.p < 1, c.id); chk(ch.chance.win.result, 'result', c.id); chk(ch.chance.lose.result, 'result', c.id); }
      else chk(ch.result, 'result', c.id);
      for (const e of [ch.effects, ch.chance && ch.chance.win.effects, ch.chance && ch.chance.lose.effects]) for (const [k, v] of Object.entries(e || {})) {
        assert.ok(RANGE[k] && Number.isFinite(v) && v !== 0 && Math.abs(v) <= RANGE[k] && (k !== 'status' || Number.isInteger(v)), `${c.id} ${k} ${v}`);
      }
      if (ch.skill) assert.ok(TALENTS.includes(ch.skill), `${c.id} skill`);
      if (ch.risk) assert.ok(FEARS.includes(ch.risk), `${c.id} risk`);
      for (const k of [ch.dream, ch.fulfill].filter(Boolean)) assert.ok(DREAMS.includes(k), `${c.id} dream ${k}`);
      if (ch.bond) assert.ok(BONDS.includes(ch.bond.kind) && ch.bond.who.ko && ch.bond.who.en, c.id);
    }
  }
  for (const l of LINES_EU) {
    assert.ok(!l.choices && !l.event, l.id);
    assert.ok(l.text.ko && l.text.ko.length <= 60, `${l.id} ko ${l.text.ko.length}자`);
    assert.ok(l.text.en && l.text.en.length <= 120, `${l.id} en ${l.text.en.length}자`);
  }
  // 새 효과 키(능력치·신분)는 아껴 쓴다: 선택지 효과의 3분의 1 이하
  const effs = CARDS.flatMap((c) => c.choices.flatMap((ch) => [ch.effects, ch.chance && ch.chance.win.effects, ch.chance && ch.chance.lose.effects].filter(Boolean)));
  const withNew = effs.filter((e) => ['luck', 'charm', 'know', 'skill', 'status'].some((k) => e[k])).length;
  assert.ok(withNew > 0 && withNew <= effs.length / 3, `새 효과 키 ${withNew}/${effs.length}`);
});

test('나올 수 있는 모든 땅 × 해 × 집안 맥락에서 자리 글이 다 채워지고, 단계마다 실제로 나올 수 있다', () => {
  assert.ok(CTXS.length > 1000, `${CTXS.length}개 맥락`);
  let filled = 0;
  for (const c of ALL) {
    const pieces = piecesOf(c);
    for (const [where, o] of pieces) for (const lang of ['ko', 'en']) assert.ok(!leftoverBraces(o[lang]), `${c.id} ${where} ${lang} 모르는 자리`);
    const geo = geoOf(c.when);
    const hits = CTXS.filter((x) => condOk(geo, x.gate));
    assert.ok(hits.length > 0, `${c.id}: 나올 맥락이 없다`);
    for (const x of hits) for (const [where, o] of pieces) for (const lang of ['ko', 'en']) {
      const s = fillTokens(o[lang], x.world, lang, true);
      assert.ok(!/[{}]/.test(s), `${c.id} ${where} ${lang} ${x.area} ${x.year} ${x.h}: ${s}`);
      filled++;
    }
    // 실제 생 맥락(나이·능력치·신분 포함)에서 그 카드·줄이 적어도 한 단계에서 고를 수 있다
    const x = hits[0];
    const ok = stagesOf(c).some((stage) => eligible(c, {
      ...x.gate, stage, age: STAGE_AGE[stage], sex: 'f', flags: {}, traces: [], dream: null, stats: { health: 50, wealth: 50, family: 50, happy: 50 }, seen: [],
      attrs: { luck: 50, charm: 50, know: 70, skill: 50 }, status: { ...x.world.status.ranks[x.h], id: x.h }, war: x.world.war.level,
    }));
    assert.ok(ok, `${c.id}: 어느 단계에서도 고를 수 없다`);
  }
  assert.ok(filled > 1000, `채운 글 ${filled}`);
});

test('자리가 있으면 tokens: true, 표시가 있으면 자리가 있다. 영어 {feast} 앞 the · a/an 뒤 자리 · 한국어 맨 조사가 없다', () => {
  const BARE = /\{[A-Za-z]+\}(?:은|는|이|가|을|를|과|와|으로|로|이나|나|이랑|랑|이라|라|이라고|라고|이에요|예요)(?![가-힣])/;
  for (const c of ALL) {
    const has = piecesOf(c).some(([, o]) => hasWordTokens(o.ko) || hasWordTokens(o.en));
    assert.equal(!!c.tokens, has, `${c.id} tokens 표시`);
    for (const [where, o] of piecesOf(c)) {
      assert.ok(!/\bthe \{feast/i.test(o.en) && !/\b(a|an) \{/i.test(o.en), `${c.id} ${where}: ${o.en}`);
      assert.ok(!BARE.test(o.ko), `${c.id} ${where}: 맨 조사 ${o.ko}`);
    }
  }
  assert.ok(ALL.filter((c) => c.tokens).length >= 8, '말 바꿈 자리를 쓴 카드·줄이 여럿');
});

// 실재 인물 이름 (events.test.mjs 의 금지 표 + 유럽·서아시아·북아프리카에서 나올 만한 이름). 통치자는 칭호만, 성인 이름을 딴 병명도 쓰지 않는다
const NAMES_EN = ['Ashoka', 'Musa', 'Genghis', 'Chinggis', 'Temujin', 'Kublai', 'Hulagu', 'Napoleon', 'Gandhi', 'Akbar', 'Timur', 'Tamerlane',
  'Alexander', 'Caesar', 'Hannibal', 'Charlemagne', 'Saladin', 'Mehmed', 'Columbus', 'da Gama', 'Marco Polo', 'Ibn Battuta', 'Hitler', 'Stalin', 'Lenin',
  'Gutenberg', 'Jenner', 'Luther', 'Hammurabi', 'Mahmud', 'Justinian', 'Muhammad',
  'Augustus', 'Nero', 'Constantine', 'Cyrus', 'Darius', 'Xerxes', 'Ramesses', 'Ramses', 'Cleopatra', 'Tutankhamun', 'Suleiman', 'Harun', 'Elizabeth', 'Victoria',
  'Henry', 'Edward', 'Louis', 'Catherine', 'Ivan', 'Nasser', 'Sadat', 'Atatürk', 'Ataturk', 'Khomeini', 'Abbas', 'Nebuchadnezzar', 'Sargon', 'Anthony', 'Antony',
  'Osman', 'Orhan', 'Mansa', 'Cicero', 'Spartacus', 'Vercingetorix', 'Boudica', 'Herodotus', 'Bricriu'];
const NAMES_KO = ['아소카', '만사 무사', '칭기즈', '쿠빌라이', '훌라구', '나폴레옹', '간디', '아크바르', '티무르', '알렉산드로스', '알렉산더', '카이사르', '한니발', '샤를마뉴',
  '살라딘', '메흐메트', '콜럼버스', '마르코 폴로', '이븐 바투타', '히틀러', '스탈린', '레닌', '구텐베르크', '루터', '함무라비', '마흐무드', '유스티니아누스', '무함마드',
  '아우구스투스', '콘스탄티누스', '키루스', '다리우스', '크세르크세스', '람세스', '클레오파트라', '투탕카멘', '쉴레이만', '술레이만', '하룬', '엘리자베스', '빅토리아',
  '헨리', '나세르', '사다트', '아타튀르크', '호메이니', '압바스', '네부카드네자르', '사르곤', '안토니우스', '오스만 1세', '키케로', '스파르타쿠스', '베르킨게토릭스', '부디카', '헤로도토스'];
const hitsName = (s) => NAMES_EN.some((n) => new RegExp(`(^|[^A-Za-z])${n}([^A-Za-z]|$)`).test(s)) || NAMES_KO.some((n) => s.includes(n));
test('실재 인물 이름이 글에 없다', () => {
  assert.ok(hitsName('the reign of Darius') && hitsName('람세스의 무덤') && !hitsName('Ivanhoe road') && !hitsName('무사히 돌아왔어요'));
  const texts = [];
  const walk = (v) => { if (typeof v === 'string') texts.push(v); else if (v && typeof v === 'object') for (const x of Object.values(v)) walk(x); };
  for (const c of CARDS) walk({ title: c.title, text: c.text, note: c.note, choices: c.choices });
  for (const l of LINES_EU) walk(l.text);
  assert.deepEqual(texts.filter(hitsName), []);
});

test('병 카드에 ill 표지, 선택지 when 은 몇 번(첫 선택지는 늘 열림), 큰 집·야영지는 집안 표지로 갈린다', () => {
  const ILL = ['loc.eu.village.fire', 'loc.eu.wvillage.eyes'];
  for (const id of ILL) assert.equal(CARDS.find((c) => c.id === id).ill, true, id);
  for (const c of CARDS) if (c.choices.some((x) => x.risk === 'plague' || x.skill === 'heal')) assert.ok(c.ill, `${c.id} 병 선택이면 ill`);
  const gated = CARDS.flatMap((c) => c.choices.filter((x) => x.when).map((x) => [c.id, x.when]));
  assert.ok(gated.length >= 2 && gated.length <= 5, `선택지 when ${gated.length}개`);
  assert.ok(gated.some(([, w]) => w.minKnow >= 20), '글을 알아야 열리는 선택');   // 문턱은 25 안팎 (작업 7 검토)
  for (const c of CARDS) assert.ok(c.choices.filter((x) => !x.when).length >= 2 || c.choices.length === 2, `${c.id}: 열린 선택지가 넉넉하다`);
  // 가축 치는 집 카드·줄은 herd 표지 (수렵 무리와 갈린다), 수렵 무리 카드·줄은 forager 묶음
  for (const c of ALL.filter((x) => comboOf(x) === 'mb.camp')) {
    const w = c.when;
    assert.ok((w.tags && w.tags.includes('herd')) || (w.eraGroups && w.eraGroups.every((g) => g === 'forager')), `${c.id}: 무리인지 가축 치는 집인지`);
  }
});

// 묶인 규칙 (조정자 2026-10-21): 0번 선택지에는 when 을 달지 않는다. 늘 0번을 고르는 시험·자동 경로(memory.test 의 live 등)가
// 잠긴 0번에서 choose → null 을 되풀이하며 끝없이 돈다. 조건은 1번 뒤 선택지에만
test('0번 선택지에는 when 이 없다 (늘 열려 있다)', () => {
  for (const c of CARDS) assert.ok(c.choices[0] && !c.choices[0].when, `${c.id}: 0번 선택지에 when`);
});

test('시대 나눔: 조합마다 1500년 전에 나올 카드가 절반 넘고, 근세 뒤에 나올 카드·줄도 있다 (야영지 빼고)', () => {
  for (const k of Object.keys(COMBOS)) {
    const cards = CARDS.filter((c) => comboOf(c) === k), all = ALL.filter((c) => comboOf(c) === k);
    const early = cards.filter((c) => CTXS.some((x) => x.year < 1500 && condOk(geoOf(c.when), x.gate)));
    assert.ok(early.length * 2 > cards.length, `${k}: 1500년 전 카드 ${early.length}/${cards.length}`);
    if (k !== 'mb.camp') assert.ok(all.some((c) => CTXS.some((x) => x.year >= 1800 && condOk(geoOf(c.when), x.gate))), `${k}: 1800년 뒤 카드·줄`);
  }
});

// 실제로 놀아 보기: 시드에서 이 다섯 조합에 태어난 생을 모아 자동 결정으로 끝까지. 스무 살을 넘긴 생 대부분이 고유 카드·줄을 만난다
test('시드 생 (자동 결정): 이 조합에 태어나 스무 살을 넘긴 생의 70% 넘게가 고유 카드·줄을 만나고, 조합마다 그런 생이 있다', () => {
  const mine = new Set(ALL.map((c) => c.id));
  const combo = (b) => {
    const z = ZONE_OF[b.area], s = settingOf(b.household, b.group);
    if (z === 'europe' && ['village', 'street', 'estate'].includes(s)) return `eu.${s}`;
    if (z === 'mudbrick' && s === 'village') return 'mb.village';
    if ((z === 'mudbrick' || z === 'steppe') && s === 'camp') return 'mb.camp';
    return null;
  };
  const per = {};
  let lives = 0, met = 0;
  for (let i = 0; lives < 400 && i < 20000; i++) {
    const b = drawBirth('LEU-' + i), k = combo(b);
    if (!k) continue;
    const life = createLife({ birth: b, traces: [], quiet: true });
    for (let guard = 0; guard < 3000; guard++) {
      const ev = advance(life, DECK, { lines: LINES });
      if (ev.type === 'death') break;
      if (ev.type === 'card') assert.ok(choose(life, autoChoice(life, ev.card)), `${b.seed} ${ev.card.id}: 고를 수 없다`);
    }
    if (life.death.age < 20) continue;
    lives++;
    const hit = life.seen.some((id) => mine.has(id)) || life.linesSeen.some((id) => mine.has(id));
    met += hit;
    per[k] = per[k] || { n: 0, hit: 0 };
    per[k].n++; per[k].hit += hit;
  }
  assert.ok(lives >= 200, `생 ${lives}`);
  assert.ok(met / lives > 0.7, `고유 카드·줄을 만난 생 ${met}/${lives}`);
  for (const k of Object.keys(COMBOS)) assert.ok(per[k] && per[k].hit > 0, `${k}: ${JSON.stringify(per[k])}`);
});
