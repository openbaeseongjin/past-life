// 레파토리 목표 수치 (시뮬 2.0 설계 4.4, 작업 7). 시드 2,000개(작업 8에서 600 → 계획서대로), 자동 결정
// 「같은 카드」는 그 생의 그해 맥락으로 채운 카드 본문이 같은 것으로 센다 — 말 바꿈 카드는 땅·시대마다 다른 글이 된다
import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, advance, choose, autoChoice, openChoices } from '../life.js';
import { DECK } from '../deck.js';
import { LINES } from '../lines.js';
import { drawBirth } from '../birth.js';
import { ZONE_OF } from '../context_data.js';
import { contextOf } from '../context.js';
import { fillTokens } from '../tokens.js';

const N = 2000;
const gated = (c) => { const w = c.when || {}; return !!(w.eraGroups || w.eras || w.regions || w.areas || w.tags || w.minYear != null || w.maxYear != null || w.zones || w.setting || c.event || w.trace); };
const hh = (b) => (b.household && b.household.id) || b.household;
const runs = [];
for (let s = 1; s <= N; s++) {
  const birth = drawBirth(s); const life = createLife({ birth, quiet: true }); const cards = [];
  for (let g = 0; g < 300; g++) {
    const ev = advance(life, DECK, { lines: LINES });
    if (ev.type === 'death') break;
    if (ev.type === 'card') {
      cards.push({ c: ev.card, year: life.year });
      const open = openChoices(life, ev.card); let i = autoChoice(life, ev.card); if (open && !open[i]) i = open.findIndex(Boolean);
      choose(life, i);
    }
  }
  runs.push({ birth, zone: ZONE_OF[birth.area], cards });
}

test('공통 카드(조건도 말 바꿈도 없음) 비율 ≤ 20%', () => {
  let shown = 0, generic = 0;
  for (const r of runs) for (const { c } of r.cards) { shown++; if (!gated(c) && !c.tokens) generic++; }
  assert.ok(generic / shown <= 0.2, `${(100 * generic / shown).toFixed(1)}%`);
});

test('다른 문화권·500년 넘게 떨어진 두 생이 같은 카드 글을 보는 비율 ≤ 8%', () => {
  const body = runs.map((r) => new Set(r.cards.map(({ c, year }) => fillTokens(c.text.ko, contextOf(year, r.birth.area, hh(r.birth)), 'ko'))));
  let ov = 0, n = 0;
  for (let i = 0; i < runs.length; i++) for (let j = i + 1; j < runs.length; j++) {
    const a = runs[i], b = runs[j];
    if (a.zone === b.zone || Math.abs(a.birth.year - b.birth.year) < 500 || !body[i].size || !body[j].size) continue;
    let c = 0; for (const x of body[i]) if (body[j].has(x)) c++;
    ov += c / Math.min(body[i].size, body[j].size); n++;
  }
  assert.ok(n > 1000);
  assert.ok(ov / n <= 0.08, `${(100 * ov / n).toFixed(1)}%`);
});

test('작은 일 줄: 조건이나 말 바꿈이 있는 줄 ≥ 70% (덱 기준)', () => {
  const ok = LINES.filter((l) => gated(l) || l.tokens).length;
  assert.ok(ok / LINES.length >= 0.7, `${(100 * ok / LINES.length).toFixed(1)}%`);
});

test('땅·자리 고유 카드가 실제로 나온다 (본 카드의 8% 이상)', () => {
  let shown = 0, local = 0;
  for (const r of runs) for (const { c } of r.cards) { shown++; if (c.id.startsWith('loc.')) local++; }
  assert.ok(local / shown >= 0.08, `${(100 * local / shown).toFixed(1)}%`);
});

test('어느 카드도 0번 선택지에 조건이 없다 (자동·시험 경로가 잠긴 선택지에서 돌지 않게)', () => {
  for (const c of DECK) assert.ok(!(c.choices[0] && c.choices[0].when), c.id);
});

test('선택지 글 조건은 전근대 생도 닿을 수 있는 문턱이다 (minKnow ≤ 30, 배우기를 꾸준히 하면 25~34)', () => {
  for (const c of DECK) for (const ch of c.choices) if (ch.when && ch.when.minKnow != null) assert.ok(ch.when.minKnow <= 30, `${c.id} minKnow ${ch.when.minKnow}`);
});
