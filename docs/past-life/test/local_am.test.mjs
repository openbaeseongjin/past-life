// 땅·자리 고유 묶음 AM (sim2 설계 4.2, 작업 7): 아메리카 마을 · 아프리카 마을 · 아프리카 야영지 · 동남아·오세아니아 마을
// 조합마다 카드·줄 수, 문화권·자리·시대 조건, 한·영과 길이, 효과 키, 자리 글 채우기, id, 실재 인물 이름, 실제 생에서 나오는지
import test from 'node:test';
import assert from 'node:assert/strict';
import { LOCAL_CARDS_AM } from '../cards_local_am.js';
import { LOCAL_LINES_AM } from '../lines_local_am.js';
import { DECK } from '../deck.js';
import { LINES } from '../lines.js';
import { condOk, choiceOpen, STAGES } from '../cards.js';
import { AREAS } from '../places.js';
import { HOUSEHOLDS, beforeFarming } from '../households.js';
import { groupOf, eraOf } from '../births.js';
import { contextOf } from '../context.js';
import { settingOf } from '../lands.js';
import { ZONE_OF } from '../context_data.js';
import { fillTokens, hasWordTokens, leftoverBraces } from '../tokens.js';
import { TALENTS, FEARS } from '../traces.js';
import { createLife, advance, choose } from '../life.js';

// 설계 4.2 표 (이 작성자 몫): [카드, 줄]
const TABLE = { 'americas|village': [8, 10], 'africa|village': [5, 6], 'africa|camp': [4, 6], 'seaoc|village': [4, 6] };
const comboOf = (c) => `${c.when.zones[0]}|${c.when.setting}`;
const ERA_GATE = ['eraGroups', 'minYear', 'maxYear'];
const LIFE_ONLY = ['sex', 'flags', 'notFlags', 'trace', 'minAge', 'maxAge', 'stat', 'minKnow', 'maxKnow', 'minStatus', 'maxStatus', 'bound', 'war'];
const geoOf = (w) => Object.fromEntries(Object.entries(w || {}).filter(([k]) => !LIFE_ONLY.includes(k)));
const ALL = [...LOCAL_CARDS_AM, ...LOCAL_LINES_AM];

// 카드·줄의 글 조각 [어디, {ko, en}]
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

// 이 묶음이 닿는 땅 × 해 × 집안 맥락 (농사 전 땅이면 무리도). 해는 촘촘히 (−100000 ~ 2020)
const YEARS = [-100000, -75000, -60000, -40000, -27000, -15000, -9000];
for (let y = -8000; y <= 2020; y += 50) YEARS.push(y);
YEARS.push(1521, 1532, 1888, 1915, 1949, 2008, 2015);
const MY_AREAS = Object.keys(AREAS).filter((a) => ['americas', 'africa', 'seaoc'].includes(ZONE_OF[a]));
function contexts() {
  const out = [];
  for (const area of MY_AREAS) for (const year of YEARS) {
    const g = groupOf(year), hs = [...HOUSEHOLDS[g]];
    if (g !== 'forager' && beforeFarming(area, year)) hs.push(HOUSEHOLDS.forager[0]);
    for (const h of hs) {
      const group = h.id === 'band' ? 'forager' : g, world = contextOf(year, area, h.id);
      const gate = { year, era: eraOf(year).id, group, region: AREAS[area].region, area, coast: !!AREAS[area].coast, tags: h.tags, zone: world.zone, setting: settingOf(h.id, group) };
      out.push({ year, area, h: h.id, world, gate });
    }
  }
  return out;
}
const CTXS = contexts();

test('AM 묶음: 조합마다 카드·줄 수가 설계 4.2 표 이상이고, 덱과 줄 목록에 들어 있다', () => {
  for (const [combo, [nc, nl]] of Object.entries(TABLE)) {
    const c = LOCAL_CARDS_AM.filter((x) => comboOf(x) === combo).length, l = LOCAL_LINES_AM.filter((x) => comboOf(x) === combo).length;
    assert.ok(c >= nc, `${combo} 카드 ${c} < ${nc}`);
    assert.ok(l >= nl, `${combo} 줄 ${l} < ${nl}`);
  }
  for (const x of ALL) assert.ok(TABLE[comboOf(x)], `${x.id}: 이 작성자 몫이 아닌 조합 ${comboOf(x)}`);
  for (const c of LOCAL_CARDS_AM) assert.ok(DECK.includes(c), `${c.id} 덱에 없음`);
  for (const l of LOCAL_LINES_AM) assert.ok(LINES.includes(l), `${l.id} 줄 목록에 없음`);
});

test('AM 묶음: id 모양과 겹침 (덱·줄 전체에서 하나뿐)', () => {
  for (const c of LOCAL_CARDS_AM) assert.match(c.id, /^loc\.am\.(amvil|afvil|afcamp|seavil)\.[a-z]+$/, c.id);
  for (const l of LOCAL_LINES_AM) assert.match(l.id, /^l\.loc\.am\.(amvil|afvil|afcamp|seavil)\.[a-z]+$/, l.id);
  const ids = [...DECK, ...LINES].map((x) => x.id);
  for (const x of ALL) assert.equal(ids.filter((i) => i === x.id).length, 1, `${x.id} 겹침`);
  // id 의 조합 이름(loc.am.<조합>.… · l.loc.am.<조합>.…)이 조건의 문화권·자리와 맞다
  const NAME = { 'americas|village': 'amvil', 'africa|village': 'afvil', 'africa|camp': 'afcamp', 'seaoc|village': 'seavil' };
  for (const x of ALL) assert.equal(x.id.split('.')[x.id.startsWith('l.') ? 3 : 2], NAME[comboOf(x)], `${x.id}: id 의 조합 이름과 조건이 다르다`);
});

test('AM 묶음: 모든 카드·줄이 문화권 하나 + 사는 자리 + 시대 조건을 갖고, 땅은 그 문화권 안이다', () => {
  for (const x of ALL) {
    const w = x.when;
    assert.ok(w && Array.isArray(w.zones) && w.zones.length === 1, `${x.id} zones`);
    assert.ok(typeof w.setting === 'string', `${x.id} setting`);
    assert.ok(ERA_GATE.some((k) => w[k] != null), `${x.id} 시대 조건`);
    for (const a of w.areas || []) assert.equal(ZONE_OF[a], w.zones[0], `${x.id} 땅 ${a}`);
    if (w.minYear != null && w.maxYear != null) assert.ok(w.minYear < w.maxYear, `${x.id} 해 범위`);
    for (const s of [].concat(x.stage)) assert.ok(STAGES.includes(s), `${x.id} stage ${s}`);
  }
  // 동남아·오세아니아 마을은 1788년 전 오스트레일리아에 나오지 않는다 (그때는 수렵 무리)
  for (const x of ALL.filter((y) => comboOf(y) === 'seaoc|village')) {
    const hit = CTXS.find((c) => c.area === 'australia' && c.year < 1788 && condOk(geoOf(x.when), c.gate));
    assert.ok(!hit, `${x.id}: 1788년 전 오스트레일리아 ${hit && hit.year}`);
  }
});

test('AM 카드: 한·영 글과 길이, 선택지 2~3개, 효과 키와 크기, 재능·두려움 키, 병 카드 표시', () => {
  const LIM = { ko: { text: 90, choice: 18, result: 70, title: 16 }, en: { text: 180, choice: 40, result: 150, title: 40 } };
  const RANGE = { health: 25, wealth: 25, family: 25, happy: 25, luck: 20, charm: 20, know: 20, skill: 20, status: 1 };
  const chk = (o, kind, id) => { for (const l of ['ko', 'en']) { assert.ok(o && typeof o[l] === 'string' && o[l].trim(), `${id} ${kind} ${l}`); assert.ok(o[l].length <= LIM[l][kind], `${id} ${kind} ${l} ${o[l].length}자`); } };
  let gated = 0;
  for (const c of LOCAL_CARDS_AM) {
    chk(c.title, 'title', c.id); chk(c.text, 'text', c.id);
    assert.ok(c.choices.length >= 2 && c.choices.length <= 3, c.id);
    assert.ok(!c.choices[0].when, `${c.id}: 0번 선택지에는 조건을 달지 않는다`);
    for (const ch of c.choices) {
      chk(ch.text, 'choice', c.id);
      if (ch.chance) { assert.ok(ch.chance.p > 0 && ch.chance.p < 1, c.id); chk(ch.chance.win.result, 'result', c.id); chk(ch.chance.lose.result, 'result', c.id); } else chk(ch.result, 'result', c.id);
      for (const e of [ch.effects, ch.chance && ch.chance.win.effects, ch.chance && ch.chance.lose.effects]) for (const [k, v] of Object.entries(e || {})) assert.ok(RANGE[k] && v !== 0 && Math.abs(v) <= RANGE[k] && (k !== 'status' || Number.isInteger(v)), `${c.id} ${k} ${v}`);
      if (ch.skill) assert.ok(TALENTS.includes(ch.skill), `${c.id} skill ${ch.skill}`);
      if (ch.risk) assert.ok(FEARS.includes(ch.risk), `${c.id} risk ${ch.risk}`);
      if (ch.when) gated++;
      if (ch.skill === 'heal' || ch.risk === 'plague') assert.ok(c.ill, `${c.id}: 병 카드 표시`);
    }
  }
  assert.ok(gated >= 2 && gated <= 4, `선택지 조건 ${gated}개 (2~3개 쓰기로 했다)`);
  assert.ok(LOCAL_CARDS_AM.some((c) => c.ill), '병·다침 카드가 하나는 있다');
  for (const l of LOCAL_LINES_AM) {
    assert.ok(!l.choices && !l.event, l.id);
    assert.ok(l.text.ko && l.text.ko.length <= 60, `${l.id} ko ${l.text.ko.length}자`);
    assert.ok(l.text.en && l.text.en.length <= 120, `${l.id} en ${l.text.en.length}자`);
  }
});

test('AM 묶음: 자리 글 표시가 맞고, 나올 수 있는 모든 땅 × 해 × 집안 맥락에서 빈 자리가 남지 않는다', () => {
  for (const x of ALL) {
    const pieces = piecesOf(x);
    assert.equal(!!x.tokens, pieces.some(([, o]) => hasWordTokens(o.ko) || hasWordTokens(o.en)), `${x.id} tokens 표시`);
    for (const [where, o] of pieces) for (const lang of ['ko', 'en']) {
      assert.ok(!leftoverBraces(o[lang]), `${x.id} ${where} ${lang} 모르는 자리`);
      if (lang === 'en') { assert.ok(!/\bthe \{feast/i.test(o.en), `${x.id} the {feast}`); assert.ok(!/\b(a|an) \{/i.test(o.en), `${x.id} a/an {…}`); }
    }
    const geo = geoOf(x.when);
    let seen = 0;
    for (const c of CTXS) {
      if (!condOk(geo, c.gate)) continue;
      seen++;
      if (x.tokens) for (const [where, o] of pieces) for (const lang of ['ko', 'en']) {
        const s = fillTokens(o[lang], c.world, lang, true);
        assert.ok(!/[{}]/.test(s), `${x.id} ${where} ${lang} ${c.area} ${c.year} ${c.h}: ${s}`);
      }
    }
    assert.ok(seen > 0, `${x.id}: 나올 맥락이 하나도 없다`);
  }
});

// 실재 인물 이름 금지 표 (이 묶음의 땅·시대: 아메리카·사하라 이남 아프리카·동남아·오세아니아)
const NAMES = ['Moctezuma', 'Montezuma', 'Cuauhtémoc', 'Nezahualcoyotl', 'Pakal', 'Atahualpa', 'Pachacuti', 'Huayna Capac', 'Túpac Amaru', 'Tupac Amaru', 'Cortés', 'Cortes', 'Pizarro', 'Columbus',
  'Bolívar', 'Bolivar', 'Hidalgo', 'Juárez', 'Juarez', 'Zapata', 'Pancho Villa', 'Porfirio', 'Toussaint', 'Dessalines', 'Zumbi', 'Tiradentes', 'Pocahontas', 'Tecumseh', 'Sitting Bull', 'Washington', 'Lincoln',
  'Mansa Musa', 'Musa', 'Sundiata', 'Sunjata', 'Askia', 'Sonni Ali', 'Ewuare', 'Osei Tutu', 'Nzinga', 'Afonso', 'Shaka', 'Mzilikazi', 'Menelik', 'Ezana', 'Lalibela', 'Haile Selassie', 'Leopold', 'Livingstone', 'Stanley', 'Rhodes',
  'Nkrumah', 'Mandela', 'Kenyatta', 'Lumumba', 'Nyerere', 'Usman dan Fodio', 'Samori', 'Jayavarman', 'Suryavarman', 'Gajah Mada', 'Hayam Wuruk', 'Raffles', 'Magellan', 'Lapu-Lapu', 'Rizal', 'Sukarno', 'Suharto', 'Ho Chi Minh', 'Cook'];
const NAMES_KO = ['목테수마', '쿠아우테목', '네사우알코요틀', '파칼', '아타우알파', '파차쿠티', '와이나 카팍', '투팍 아마루', '코르테스', '피사로', '콜럼버스', '볼리바르', '이달고', '후아레스', '사파타', '판초 비야', '투생', '줌비', '포카혼타스',
  '만사 무사', '순디아타', '아스키아', '오세이 투투', '은징가', '샤카', '메넬리크', '에자나', '랄리벨라', '하일레 셀라시에', '레오폴드', '리빙스턴', '로즈', '은크루마', '만델라', '케냐타', '루뭄바', '니에레레', '자야바르만', '수리아바르만', '가자 마다', '하얌 우룩', '래플스', '마젤란', '라푸라푸', '리살', '수카르노', '수하르토', '호찌민', '호치민'];
const hitsName = (s) => NAMES.some((n) => new RegExp(`(^|[^A-Za-zÀ-ÿ])${n}([^A-Za-zÀ-ÿ]|$)`).test(s)) || NAMES_KO.some((n) => s.includes(n));
test('AM 묶음: 실재 인물 이름이 없다', () => {
  assert.ok(hitsName('the court of Mansa Musa') && hitsName('목테수마의 궁전') && !hitsName('무사히 돌아왔어요') && !hitsName('cooked a pot'));
  const texts = [];
  for (const x of ALL) for (const [, o] of piecesOf(x)) texts.push(o.ko, o.en);
  assert.deepEqual(texts.filter(hitsName), []);
});

// 묶는 규칙 (컨트롤러): 0번 선택지에는 when 을 달지 않는다. 시험·자동 길이 0번을 고를 때 잠겨 있으면 끝없이 돈다
test('AM 카드: 0번 선택지는 조건이 없고, 가장 불리한 생(지식 0 · 매인 몸 · 신분 1 · 평화)에서도 열려 있다', () => {
  const worst = { attrs: { know: 0, luck: 0, charm: 0, skill: 0 }, status: { rank: 1, bound: true }, war: 0, age: 0 };
  for (const c of LOCAL_CARDS_AM) {
    assert.equal(c.choices[0].when, undefined, `${c.id}: 0번 선택지에 when`);
    assert.ok(choiceOpen(c.choices[0], worst), `${c.id}: 0번 선택지가 잠긴다`);
  }
});

test('AM 선택지 조건: 매인 몸은 도시로 못 떠나고, 지식이 모자라면 매듭·저울을 못 읽는다', () => {
  const at = (id, i) => LOCAL_CARDS_AM.find((c) => c.id === id).choices[i];
  const ctx = (o) => ({ attrs: { know: 20 }, status: { rank: 2, bound: false }, ...o });
  assert.equal(choiceOpen(at('loc.am.amvil.city', 1), ctx({ status: { rank: 1, bound: true } })), false);
  assert.equal(choiceOpen(at('loc.am.amvil.city', 1), ctx({})), true);
  // 1905년 메소아메리카 농사짓는 집은 「아시엔다의 페온」(매인 몸)
  assert.equal(contextOf(1905, 'mesoamerica', 'farm').status.ranks.farm.bound, true);
  for (const id of ['loc.am.amvil.quipu', 'loc.am.seavil.spice']) {
    assert.equal(choiceOpen(at(id, 1), ctx({})), false, id);
    assert.equal(choiceOpen(at(id, 1), ctx({ attrs: { know: 45 } })), true, id);
  }
});

// 실제 엔진으로: 그 카드·줄이 맞는 땅·해·집안에서 태어난 생에 나온다 (문화권·자리는 life.js 맥락이 채운다)
// 단계의 이른 나이 (혼인 전 카드가 혼인 굴림보다 먼저 닿게)
const FIRST_AGE = { baby: 2, child: 7, teen: 14, adult: 21, middle: 45, old: 65 };
function birthFor(x) {
  const geo = geoOf(x.when), age = FIRST_AGE[[].concat(x.stage)[0]];
  // 그 나이에 조건이 맞는 첫 맥락. 태어난 해의 집안 표에도 같은 집안이 있어야 한다 (무리는 농사 전 땅이면 어느 묶음이든)
  const hit = CTXS.find((c) => condOk(geo, c.gate) && (c.h === 'band' || HOUSEHOLDS[groupOf(c.year - age)].some((y) => y.id === c.h)));
  assert.ok(hit, `${x.id}: 맥락 없음`);
  const year = hit.year - age, h = hit.h === 'band' ? HOUSEHOLDS.forager[0] : HOUSEHOLDS[groupOf(year)].find((y) => y.id === hit.h);
  return { birth: { year, era: eraOf(year).id, group: groupOf(year), region: AREAS[hit.area].region, area: hit.area, household: h.id, tags: [...h.tags], wealth: h.wealth, sex: 'f', order: 2 }, age };
}
test('AM 묶음: 카드마다 맞는 생에서 실제로 나온다 (life.js advance)', () => {
  for (const c of LOCAL_CARDS_AM) {
    const { birth, age } = birthFor(c);
    let shown = false;
    for (let s = 0; s < 30 && !shown; s++) {
      const life = createLife({ birth: { ...birth, seed: `AM-${c.id}-${s}` }, noDeath: true, quiet: true });
      life.slots = [age];
      for (let guard = 0; guard < 200; guard++) {
        const ev = advance(life, [c]);
        if (ev.type === 'death') break;
        if (ev.type === 'card') { shown = ev.card.id === c.id; choose(life, 0); break; }
      }
    }
    assert.ok(shown, `${c.id}: ${birth.area} ${birth.year} ${birth.household} 생에서 나오지 않는다`);
  }
});
test('AM 묶음: 줄마다 맞는 생에서 실제로 적힌다 (life.js advance)', () => {
  for (const l of LOCAL_LINES_AM) {
    const { birth, age } = birthFor(l);
    let shown = false;
    for (let s = 0; s < 10 && !shown; s++) {
      const life = createLife({ birth: { ...birth, seed: `AML-${l.id}-${s}` }, noDeath: true, quiet: true });
      life.slots = [];
      for (let guard = 0; guard < 200 && life.age <= age + 15; guard++) {
        const ev = advance(life, [], { lines: [l], yearly: true });
        if (ev.type === 'death') break;
        if (life.linesSeen.includes(l.id)) { shown = true; break; }
      }
    }
    assert.ok(shown, `${l.id}: ${birth.area} ${birth.year} ${birth.household} 생에 적히지 않는다`);
  }
});
