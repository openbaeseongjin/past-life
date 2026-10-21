// 작은 일 줄 (설계 12장)
import test from 'node:test';
import assert from 'node:assert/strict';
import { LINES, PAUSE_Q } from '../lines.js';
import { eligible, STAGES } from '../cards.js';
import { HOUSEHOLDS } from '../households.js';
import { REGIONS, AREAS } from '../places.js';
import { PAUSES } from '../life.js';
import { leftoverBraces } from '../tokens.js';

const AGE = { baby: 3, child: 9, teen: 16, adult: 30, middle: 50, old: 70 };
const YEAR = { forager: -20000, ancient: -1500, medieval: 1100, early: 1650, industrial: 1900, modern: 1990 };
const ERA = { forager: 1, ancient: 3, medieval: 7, early: 9, industrial: 11, modern: 12 };

test('줄 수, id, 한·영, 길이', () => {
  assert.ok(LINES.length >= 136, String(LINES.length));
  const ids = LINES.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const l of LINES) {
    assert.ok(l.id.startsWith('l.'), l.id);
    assert.ok(!l.choices && !l.event, l.id);
    assert.ok(l.text.ko && l.text.ko.length <= 60, `${l.id} ko ${l.text.ko.length}자`);
    assert.ok(l.text.en && l.text.en.length <= 120, `${l.id} en ${l.text.en.length}자`);
    // 자리 글: {place} 와 말 바꿔 끼우기 자리({crop}·{coin:을} …, tokens.js WORD_KEYS)만 (sim2 Task 6)
    for (const s of [l.text.ko, l.text.en]) assert.ok(!leftoverBraces(s), `${l.id} 모르는 자리 ${s}`);
  }
});

test('모든 묶음·지역·집안·단계에서 줄이 4개 이상', () => {
  for (const group of Object.keys(YEAR)) for (const region of REGIONS) for (const h of HOUSEHOLDS[group]) for (const stage of STAGES) {
    const area = Object.keys(AREAS).find((a) => AREAS[a].region === region);
    const ctx = { stage, age: AGE[stage], year: YEAR[group], era: ERA[group], group, region, area, coast: true, tags: h.tags, sex: 'f', flags: {}, traces: [], dream: null, stats: { health: 50, wealth: 50, family: 50, happy: 50 }, seen: [] };
    const n = LINES.filter((l) => eligible(l, ctx)).length;
    assert.ok(n >= 4, `${group} ${region} ${h.id} ${stage}: ${n}줄`);
  }
});

test('잠시 멈춤 질문이 다섯 나이에 다 있다', () => {
  for (const a of PAUSES) assert.ok(PAUSE_Q[a] && PAUSE_Q[a].ko && PAUSE_Q[a].en, String(a));
});
