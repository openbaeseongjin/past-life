// 카드 내용 (설계 7장): 한·영·길이, key, 조합마다 단계별 3장 이상, 사건·흔적 카드
import test from 'node:test';
import assert from 'node:assert/strict';
import { DECK } from '../deck.js';
import { LINES } from '../lines.js';
import { eligible, STAGES } from '../cards.js';
import { HOUSEHOLDS } from '../households.js';
import { REGIONS, AREAS } from '../places.js';
import { EVENTS } from '../events.js';
import { EVENT_CARDS } from '../cards_event.js';
import { FEARS, TALENTS, DREAMS, BONDS } from '../traces.js';
import { leftoverBraces } from '../tokens.js';
import { LOCAL_CARDS_SA } from '../cards_local_sa.js';
import { LOCAL_CARDS_EA } from '../cards_local_ea.js';
import { LOCAL_CARDS_EU } from '../cards_local_eu.js';
import { LOCAL_CARDS_AM } from '../cards_local_am.js';
import { HEIRLOOM_CARDS } from '../heirlooms.js';
import { SUCCESSION_CARDS } from '../cards_succession.js';

const STAT = ['health', 'wealth', 'family', 'happy'];
const EFFECT_RANGE = { health: 25, wealth: 25, family: 25, happy: 25, luck: 20, charm: 20, know: 20, skill: 20, status: 1 };
const textsOf = (c) => [c.title, c.text, c.note, ...c.choices.flatMap((ch) => [ch.text, ch.result, ch.chance && ch.chance.win.result, ch.chance && ch.chance.lose.result])].filter(Boolean).flatMap((o) => [o.ko, o.en]);
const LIM = { ko: { text: 90, choice: 18, result: 70, title: 16, note: 80 }, en: { text: 180, choice: 40, result: 150, title: 40, note: 160 } };
const AGE = { baby: 3, child: 9, teen: 16, adult: 30, middle: 50, old: 70 };
const YEAR = { forager: -20000, ancient: -1500, medieval: 1100, early: 1650, industrial: 1900, modern: 1990 };
const ERA = { forager: 1, ancient: 3, medieval: 7, early: 9, industrial: 11, modern: 12 };

test('카드 수와 id', () => {
  const ids = DECK.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  // 사건 카드 수는 events.test.mjs, 땅·자리 고유 카드 수는 local_*.test.mjs 가 잰다 (시뮬 2.0 작업 5·7)
  assert.equal(DECK.length, 55 + 60 + 24 + HEIRLOOM_CARDS.length + SUCCESSION_CARDS.length + EVENT_CARDS.length + LOCAL_CARDS_SA.length + LOCAL_CARDS_EA.length + LOCAL_CARDS_EU.length + LOCAL_CARDS_AM.length);
});

test('모든 글이 한·영으로 있고 길이 제한을 지킨다, key 가 바르다', () => {
  const chk = (o, kind, id) => {
    for (const l of ['ko', 'en']) {
      assert.ok(o && typeof o[l] === 'string' && o[l].length > 0, `${id} ${kind} ${l}`);
      assert.ok(o[l].length <= LIM[l][kind], `${id} ${kind} ${l} ${o[l].length}자`);
    }
  };
  for (const c of DECK) {
    chk(c.text, 'text', c.id);
    chk(c.title, 'title', c.id);
    if (c.note) chk(c.note, 'note', c.id);
    assert.ok(c.choices.length >= 2 && c.choices.length <= 3, c.id);
    for (const ch of c.choices) {
      chk(ch.text, 'choice', c.id);
      if (ch.chance) { assert.ok(ch.chance.p > 0 && ch.chance.p < 1, c.id); chk(ch.chance.win.result, 'result', c.id); chk(ch.chance.lose.result, 'result', c.id); }
      else chk(ch.result, 'result', c.id);
      for (const e of [ch.effects, ch.chance && ch.chance.win.effects, ch.chance && ch.chance.lose.effects]) for (const [k, v] of Object.entries(e || {})) assert.ok(EFFECT_RANGE[k] && Number.isFinite(v) && v !== 0 && Math.abs(v) <= EFFECT_RANGE[k] && (k !== 'status' || Number.isInteger(v)), `${c.id} ${k} ${v}`);   // 효과 키 아홉 (수치 넷 ±25 · 능력치 넷 ±20 · 신분 ±1 계단, sim2 설계 2장)
      if (ch.skill) assert.ok(TALENTS.includes(ch.skill), `${c.id} skill ${ch.skill}`);
      if (ch.risk) assert.ok(FEARS.includes(ch.risk), `${c.id} risk ${ch.risk}`);
      for (const k of [ch.dream, ch.fulfill].filter(Boolean)) assert.ok(DREAMS.includes(k), `${c.id} dream ${k}`);
      if (ch.bond) assert.ok(BONDS.includes(ch.bond.kind) && ch.bond.who && ch.bond.who.ko && ch.bond.who.en, c.id);
    }
    // 자리 글: {place} 와 말 바꿔 끼우기 자리({crop}·{coin:을} …, tokens.js WORD_KEYS)만 쓴다 (sim2 Task 6)
    for (const s of textsOf(c)) assert.ok(!leftoverBraces(s), `${c.id} 모르는 자리 ${s}`);
  }
});

test('모든 묶음·지역·성별·집안에서 단계마다 고를 카드가 3장 이상', () => {
  for (const group of Object.keys(YEAR)) for (const region of REGIONS) for (const sex of ['m', 'f']) for (const h of HOUSEHOLDS[group]) for (const stage of STAGES) {
    const area = Object.keys(AREAS).find((a) => AREAS[a].region === region);
    const ctx = { stage, age: AGE[stage], year: YEAR[group], era: ERA[group], group, region, area, coast: true, tags: h.tags, sex, flags: {}, traces: [], dream: null, stats: { health: 50, wealth: 50, family: 50, happy: 50 }, seen: [] };
    const n = DECK.filter((c) => eligible(c, ctx)).length;
    assert.ok(n >= 3, `${group} ${region} ${sex} ${h.id} ${stage}: ${n}장`);
  }
});

// Task 5: 사건이 100개를 넘으면서 카드는 일부 사건에만 붙는다 (≥50, events.test.mjs). 붙으면 하나뿐이고, 카드의 사건은 꼭 있다
test('사건마다 카드는 하나 이하, 사건 카드의 사건은 있다', () => {
  for (const e of EVENTS) assert.ok(DECK.filter((c) => c.event === e.id).length <= 1, e.id);
  for (const c of DECK.filter((x) => x.event)) assert.ok(EVENTS.some((e) => e.id === c.event), c.id);
});

test('꿈마다 심는 선택과 이루는 선택이 있다', () => {
  const choices = DECK.flatMap((c) => c.choices);
  for (const k of DREAMS) {
    assert.ok(choices.some((ch) => ch.dream === k), `dream:${k} 을 심는 선택이 없다`);
    assert.ok(choices.some((ch) => ch.fulfill === k), `fulfill:${k} 선택이 없다`);
  }
});

test('흔적마다 흔적 카드가 있다', () => {
  for (const [kind, keys] of [['fear', FEARS], ['talent', TALENTS], ['dream', DREAMS], ['bond', BONDS]]) for (const k of keys) assert.ok(DECK.some((c) => c.when && c.when.trace === `${kind}:${k}`), `${kind}:${k}`);
});

test('묶음마다 시대 카드: 어린 시절 2·청소년 2·어른 3·중년 2·노년 1', () => {
  const want = { child: 2, teen: 2, adult: 3, middle: 2, old: 1 };
  for (const g of Object.keys(YEAR)) for (const [st, n] of Object.entries(want)) assert.equal(DECK.filter((c) => c.id.startsWith('e.') && c.when.eraGroups[0] === g && c.stage === st).length, n, `${g} ${st}`);
});

test('해 조건: 1950·1960·1975·1990년에 해 범위 밖 카드·줄은 안 나오고, 현대 칸마다 카드 3장·줄 4개 이상', () => {
  const bounded = [...DECK, ...LINES].filter((c) => c.when && (c.when.minYear != null || c.when.maxYear != null));
  assert.ok(bounded.length >= 10, String(bounded.length));
  for (const year of [1950, 1960, 1975, 1990]) for (const region of REGIONS) for (const h of HOUSEHOLDS.modern) for (const stage of STAGES) for (const sex of ['m', 'f']) {
    const area = Object.keys(AREAS).find((a) => AREAS[a].region === region);
    const ctx = { stage, age: AGE[stage], year, era: 12, group: 'modern', region, area, coast: true, tags: h.tags, sex, flags: {}, traces: [], dream: null, stats: { health: 50, wealth: 50, family: 50, happy: 50 }, seen: [] };
    for (const c of bounded) if (c.when.minYear > year || c.when.maxYear < year) assert.ok(!eligible(c, ctx), `${year} ${c.id}`);
    const nc = DECK.filter((c) => eligible(c, ctx)).length, nl = LINES.filter((l) => eligible(l, ctx)).length;
    assert.ok(nc >= 3, `${year} ${region} ${h.id} ${stage} ${sex}: 카드 ${nc}장`);
    assert.ok(nl >= 4, `${year} ${region} ${h.id} ${stage} ${sex}: 줄 ${nl}개`);
  }
  // 기계 낱말(텔레비전·컴퓨터·전화·화면·냉장고·인터넷·휴대폰)이 있는 현대 카드·줄은 해 조건이 있어야 한다
  const TECH = /텔레비전|컴퓨터|전화|화면|냉장고|인터넷|휴대/;
  for (const c of [...DECK, ...LINES]) if (/^(e|l)\.mod\./.test(c.id) && TECH.test(JSON.stringify([c.text, c.choices || []]))) assert.ok(c.when.minYear, c.id);
});
