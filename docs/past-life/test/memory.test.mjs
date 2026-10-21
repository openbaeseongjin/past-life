// 모닥불 기억 구슬 + 앞 생의 메아리 (identity 설계 3.5, sim2 작업 1)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, advance, choose, summarize } from '../life.js';
import { memoryCandidates, pickMemory, latestMemory, seeMemories, echoRows, echoContext, ECHO_LINES, ECHO_FALLBACK, MEMORY_SCORE } from '../memory.js';
import { chanceBonus, riskPenalty, boostMul, traceKey, traceLevel, traceWeight, echoEffects, echoCardKey, skillGain, talentYear, FEARS, TALENTS, DREAMS, BONDS } from '../traces.js';
import { newSoul, finishLife, validSoul, makeStore } from '../soul.js';
import { obituary } from '../i18n.js';
import { beadsOf, encodeBeads } from '../beads.js';
import { GROUPS } from '../households.js';
import { DECK } from '../deck.js';
import { LINES } from '../lines.js';

const BIRTH = { seed: 'MEM-T', year: 1300, era: 8, group: 'medieval', region: 'europe', area: 'britain', household: 'farm', tags: ['farm'], wealth: 35, sex: 'f', order: 2 };
const PREV = {
  birth: { seed: 'PREV', year: 1240, era: 8, group: 'medieval', region: 'east', area: 'japan', household: 'fish', tags: ['sea'], wealth: 35, sex: 'm', order: 1 },
  death: { age: 44, year: 1284, cause: 'drown', line: 0 }, traces: [], gained: [{ kind: 'fear', key: 'sea' }, { kind: 'talent', key: 'sea' }],
};
const OWN = Object.keys(MEMORY_SCORE);

// 한 생을 끝까지 (갈림길은 0번 길). 모닥불마다 atPause(life, age) — 그 안에서 기억을 고를 수 있다
function live(birth, { prev = null, atPause = null } = {}) {
  const life = createLife({ birth, traces: prev ? prev.gained : [], noDeath: true });
  const seen = [];
  for (;;) {
    const ev = advance(life, DECK, { lines: LINES });
    if (ev.type === 'death') break;
    if (ev.type === 'card') { choose(life, 0); continue; }
    if (ev.type === 'pause') {
      const cands = memoryCandidates(life, prev);
      seeMemories(life, cands);   // main 과 같이: 띄운 메아리 줄은 이 생에서 「보인 줄」
      seen.push({ age: ev.age, cands });
      if (atPause) atPause(life, ev.age, cands);
      else if (cands.length) pickMemory(life, latestMemory(cands));
    }
  }
  return { life, seen };
}
// 손으로 만든 생: 앞 멈춤(15살) 표시 j=from, 이번 멈춤(30살) 표시 j=끝
function fake(kinds, { seed = 'F', from = 0 } = {}) {
  const journal = kinds.map((kind, i) => ({ age: 16 + i, year: 1316 + i, kind, text: { ko: `${kind} 줄 ${i}입니다.`, en: `${kind} line ${i}.` } }));
  return { birth: { ...BIRTH, seed }, age: 30, year: 1330, traces: [], journal, memories: [], traceBoost: {},
    pauseMarks: [{ age: 15, j: from }, { age: 30, j: journal.length }] };
}

test('(a) 후보는 지난 멈춤 뒤 일지(식구 일·사건·갈림길 결정·작은 일 줄)에서만 나온다', () => {
  let n = 0;
  for (let s = 0; s < 30; s++) {
    let from = 0;
    live({ ...BIRTH, seed: 'A-' + s }, { prev: PREV, atPause: (life, age, cands) => {
      const to = life.journal.length;
      assert.equal(life.pauseMarks[life.pauseMarks.length - 1].j, to);
      for (const c of cands.filter((x) => x.kind === 'life')) {
        const e = life.journal[c.j];
        assert.ok(c.j >= from && c.j < to, `${s}@${age}: j ${c.j} 가 [${from}, ${to}) 밖`);
        assert.ok(OWN.includes(e.kind), e.kind);
        assert.equal(c.age, e.age); assert.equal(c.year, e.year); assert.equal(c.jkind, e.kind);
        assert.ok(c.text.ko && c.text.en && !/[.]$/.test(c.text.ko), JSON.stringify(c.text));
        assert.ok(['cradle', 'rings', 'flame', 'scroll', 'sign'].includes(c.icon), c.icon);
        n++;
      }
      if (cands.length) pickMemory(life, cands[cands.length - 1]);   // 메아리를 꿰면 두루마리에 echo 줄이 생긴다 → 다음 모닥불 후보에는 안 나온다
      from = to;
    } });
  }
  assert.ok(n > 150, String(n));
});

test('(b) 서로 다른 kind 를 먼저 고른다 (점수 3·1, 이미 뽑은 kind −2)', () => {
  for (let s = 0; s < 60; s++) {
    // 식구 일 셋 + 작은 일 둘: 식구 일 → 작은 일 → 식구 일 (작은 일 둘은 함께 나오지 않는다)
    const a = memoryCandidates(fake(['kin', 'line', 'kin', 'line', 'kin'], { seed: 'B1-' + s }));
    assert.deepEqual(a.map((c) => c.jkind).sort(), ['kin', 'kin', 'line']);
    // 셋 다 다르면 셋 다 나온다
    const b = memoryCandidates(fake(['kin', 'kin', 'line', 'decision', 'kin', 'line', 'event'], { seed: 'B2-' + s }));
    assert.equal(new Set(b.map((c) => c.jkind)).size, 3);
    assert.ok(!b.some((c) => c.jkind === 'line'), 'kin·decision·event 셋이 있으면 작은 일 줄(1점)은 뒤로');
  }
  // 실제 생: 나온 kind 의 가짓수 = min(후보 수, 그 범위에 있던 kind 가짓수)
  for (let s = 0; s < 20; s++) {
    live({ ...BIRTH, seed: 'B-' + s }, { atPause: (life, age, cands) => {
      const marks = life.pauseMarks, from = marks.length > 1 ? marks[marks.length - 2].j : 0;
      const kinds = new Set(life.journal.slice(from).filter((e) => OWN.includes(e.kind)).map((e) => e.kind));
      assert.equal(new Set(cands.map((c) => c.jkind)).size, Math.min(cands.length, kinds.size), `${s}@${age}`);
      if (cands.length) pickMemory(life, latestMemory(cands));
    } });
  }
});

test('(c) 같은 시드면 같은 후보 (앞 생이 있어도), 같은 고름이면 같은 생', () => {
  for (const seed of ['C-1', 'C-2', 'C-3']) {
    const a = live({ ...BIRTH, seed }, { prev: PREV }), b = live({ ...BIRTH, seed }, { prev: PREV });
    assert.deepEqual(a.seen, b.seen);
    assert.deepEqual(a.life.journal, b.life.journal);
    assert.deepEqual(a.life.memories, b.life.memories);
    assert.deepEqual(a.life.death, b.life.death);
  }
  // 다른 시드는 대개 다른 후보
  const x = live({ ...BIRTH, seed: 'C-x' }).seen.map((p) => p.cands.map((c) => c.id).join()), y = live({ ...BIRTH, seed: 'C-y' }).seen.map((p) => p.cands.map((c) => c.id).join());
  assert.notDeepEqual(x, y);
});

test('(d) 앞 생이 있고 흔적이 있으면 마지막(셋이면 3번째)이 푸른 메아리, 출처는 「앞 생의 메아리 · 앞 생 땅의 집안」', () => {
  let three = 0;
  for (let s = 0; s < 20; s++) {
    const { seen } = live({ ...BIRTH, seed: 'D-' + s }, { prev: PREV });
    for (const { cands } of seen) {
      if (!cands.length) continue;
      const echo = cands[cands.length - 1];
      assert.equal(echo.kind, 'echo');
      assert.equal(cands.filter((c) => c.kind === 'echo').length, 1);
      assert.ok(cands.length <= 3);
      if (cands.length === 3) { three++; assert.equal(cands[2].kind, 'echo'); }
      assert.ok(PREV.gained.some((t) => traceKey(t) === echo.trace), echo.trace);
      assert.equal(echo.sub.ko, '앞 생의 메아리 · 일본 열도의 고기잡이 집');
      assert.equal(echo.sub.en, 'Echo of a past life · a fishing family in Japan');
      assert.equal(echo.icon, 'ember');
      const [key, i] = echo.line.split('#');
      if (key === 'prev') assert.ok(ECHO_FALLBACK[+i], echo.line);
      else { assert.equal(key, echo.trace); assert.equal(ECHO_LINES[key][+i].ko, echo.text.ko); assert.equal(ECHO_LINES[key][+i].en, echo.text.en); }
    }
  }
  assert.ok(three > 20, String(three));
  // 흔적 둘이면 모닥불마다 돌아가며 나온다 · 바닷가 땅(브리튼)이면 뭍 줄은 안 나온다
  const { seen } = live({ ...BIRTH, seed: 'D-rot' }, { prev: PREV });
  const keys = seen.filter((p) => p.cands.length).map((p) => p.cands[p.cands.length - 1].trace);
  assert.ok(new Set(keys).size === 2, keys.join());
  for (const c of seen.flatMap((p) => p.cands).filter((x) => x.kind === 'echo' && !x.line.startsWith('prev'))) {
    const row = ECHO_LINES[c.trace][+c.line.split('#')[1]];
    assert.ok(![].concat(row.when || []).includes('inland'), c.text.ko);
  }
});

test('(g) 한 생 안에서 같은 메아리 줄이 되풀이되지 않는다: 영혼 300개 여정에서 ≤ 5% (줄이 떨어지면 앞 생 땅·집안 줄, 그다음은 메아리 없음)', () => {
  let shown = 0, repeat = 0, lives = 0, skipped = 0, fallback = 0;
  for (let s = 0; s < 300; s++) {
    const soul = newSoul('REP-' + s);
    for (let k = 0; k < 6 && !soul.ended; k++) {
      const prev = soul.lives.length ? soul.lives[soul.lives.length - 1] : null;
      const life = createLife({ birth: soul.next, traces: soul.traces });
      const lines = [];
      for (;;) {
        const ev = advance(life, DECK, { lines: LINES });
        if (ev.type === 'death') break;
        if (ev.type === 'card') { choose(life, 0); continue; }
        if (ev.type === 'pause') {
          const c = memoryCandidates(life, prev);
          seeMemories(life, c);
          const echo = c.find((x) => x.kind === 'echo');
          if (echo) { lines.push(echo.line); if (echo.line.startsWith('prev')) fallback++; } else if (prev && prev.gained.length && c.length) skipped++;
          if (c.length) pickMemory(life, echo && ev.age === 15 ? echo : latestMemory(c));   // 15살에는 메아리를 꿴다 (짙어지는 길도 지나게)
        }
      }
      if (lines.length) { lives++; shown += lines.length; repeat += lines.length - new Set(lines).size; }
      finishLife(soul, life, {});
    }
  }
  assert.ok(lives > 100 && shown > 300, `${lives} ${shown}`);
  assert.ok(repeat / shown <= 0.05, `되풀이 ${repeat}/${shown}`);
  assert.ok(skipped / shown <= 0.05, `메아리 없이 지나간 모닥불 ${skipped}`);
});

test('(h) 메아리 줄이 다 떨어지면 앞 생 땅·집안 줄 → 그것도 다 보였으면 메아리 없이 이 생의 일 셋', () => {
  const life = fake(['kin', 'line', 'decision', 'line', 'kin']);
  const prev = { ...PREV, gained: [{ kind: 'bond', key: 'friend' }] };
  life.echoSeen = ECHO_LINES['bond:friend'].map((_, i) => `bond:friend#${i}`);
  const a = memoryCandidates(life, prev), e = a[a.length - 1];
  assert.equal(e.kind, 'echo'); assert.ok(e.line.startsWith('prev#'), e.line); assert.equal(e.trace, 'bond:friend');
  assert.ok(/일본 열도|고기잡이 집/.test(e.text.ko) && /Japan|fishing family/.test(e.text.en), e.text.ko);
  life.echoSeen.push(...ECHO_FALLBACK.map((_, i) => `prev#${i}`));
  const b = memoryCandidates(life, prev);
  assert.equal(b.length, 3); assert.ok(b.every((c) => c.kind === 'life'));
  // 앞 생과 같은 땅에서 태어났으면 「{그 땅}의 바람 냄새」 같은 먼 땅 줄은 쓰지 않는다
  const same = fake(['kin', 'line']); same.birth = { ...same.birth, area: 'japan' };
  same.echoSeen = ECHO_LINES['bond:friend'].map((_, i) => `bond:friend#${i}`);
  for (let s = 0; s < 30; s++) {
    same.birth.seed = 'SAME-' + s;
    const c = memoryCandidates(same, prev).pop();
    assert.ok(!ECHO_FALLBACK[+c.line.split('#')[1]].far, c.text.ko);
  }
});

test('(e) 첫 생이면 (앞 생이 없거나 흔적이 없으면) 메아리가 없다', () => {
  for (let s = 0; s < 10; s++) {
    for (const prev of [null, { ...PREV, gained: [] }]) {
      const { seen } = live({ ...BIRTH, seed: 'E-' + s }, { prev });
      for (const { cands } of seen) {
        assert.ok(cands.every((c) => c.kind === 'life'));
        assert.ok(cands.length <= 3);
      }
      assert.ok(seen.some((p) => p.cands.length === 3));
    }
  }
});

test('(f) 지난 멈춤 뒤 일지가 비면 0개 (모닥불은 조용히 지나간다, 앞 생이 있어도)', () => {
  const life = fake(['birth', 'stat', 'note', 'echo', 'death']);
  assert.deepEqual(memoryCandidates(life, null), []);
  assert.deepEqual(memoryCandidates(life, PREV), []);
  // 앞 멈춤 표시 앞의 일은 세지 않는다
  const old = fake(['kin', 'line', 'event'], { from: 3 });
  assert.deepEqual(memoryCandidates(old, PREV), []);
  assert.equal(latestMemory([]), null);
});

test('pickMemory: 이 생의 일은 기억으로 · 메아리는 traceBoost +1 과 두루마리 echo 줄 · summarize 에 들어간다', () => {
  const life = createLife({ birth: BIRTH, traces: PREV.gained, noDeath: true });
  let cands = null;
  for (let guard = 0; !cands; guard++) {
    assert.ok(guard < 500);
    const ev = advance(life, DECK, { lines: LINES });
    assert.notEqual(ev.type, 'death');
    if (ev.type === 'card') choose(life, 0);
    if (ev.type === 'pause') { const c = memoryCandidates(life, PREV); if (c.length >= 2) cands = c; }
  }
  const own = latestMemory(cands), echo = cands[cands.length - 1];
  assert.equal(own, cands.filter((c) => c.kind === 'life').reduce((m, c) => (c.j > m.j ? c : m)));
  const m1 = pickMemory(life, own);
  assert.equal(m1.j, own.j); assert.equal(m1.age, own.age); assert.deepEqual(life.traceBoost, {});
  const n = life.journal.length, m2 = pickMemory(life, echo);
  assert.equal(m2.trace, echo.trace);
  assert.deepEqual(life.traceBoost, { [echo.trace]: 1 });
  assert.equal(life.journal.length, n + 1);
  const j = life.journal[n];
  assert.equal(j.kind, 'echo'); assert.equal(j.age, life.age); assert.ok(j.text.ko.endsWith('.') && j.text.en.endsWith('.'));
  assert.ok(life.echoSeen.includes(echo.line));
  pickMemory(life, echo);
  assert.equal(life.traceBoost[echo.trace], 2);
  assert.equal(pickMemory(life, null), null);
  while (advance(life, [], {}).type !== 'death');
  const sum = summarize(life, DECK);
  assert.equal(sum.memories.length, 3);
  assert.deepEqual(sum.memories.map((m) => m.kind), ['life', 'echo', 'echo']);
});

test('흔적 짙어짐: boost 1당 ×1.5, 많아도 ×2.5 · 맞는 흔적에만 · 갈림길 choose 에 들어간다', () => {
  assert.deepEqual([0, 1, 2, 3, 9].map(boostMul), [1, 1.5, 2.25, 2.5, 2.5]);
  assert.equal(boostMul(undefined), 1); assert.equal(boostMul(-2), 1);
  const tr = [{ kind: 'talent', key: 'craft' }, { kind: 'fear', key: 'sea' }];
  assert.equal(chanceBonus({ skill: 'craft' }, tr), 0.15);
  assert.ok(Math.abs(chanceBonus({ skill: 'craft' }, tr, { 'talent:craft': 1 }) - 0.225) < 1e-9);
  assert.equal(chanceBonus({ skill: 'craft' }, tr, { 'talent:craft': 5 }), 0.375);
  assert.equal(chanceBonus({ skill: 'craft' }, tr, { 'fear:sea': 5 }), 0.15);
  assert.equal(chanceBonus({ skill: 'trade' }, tr, { 'talent:trade': 5 }), 0);   // 흔적이 없으면 짙어질 것도 없다
  assert.equal(riskPenalty({ risk: 'sea' }, tr, { 'fear:sea': 1 }), -12);
  assert.equal(riskPenalty({ risk: 'sea' }, tr, { 'fear:sea': 4 }), -20);
  assert.equal(riskPenalty({ risk: 'sea' }, tr, null), -8);
  // choose: 두려움 메아리를 한 번 꿴 생은 그 선택에 마음 −12
  const T = { ko: '글', en: 'text' };
  const card = { id: 'z', stage: 'child', title: T, text: T, choices: [{ text: T, result: T, risk: 'sea', effects: { happy: 0 } }, { text: T, result: T }] };
  const life = createLife({ birth: BIRTH, traces: [{ kind: 'fear', key: 'sea' }] });
  life.traceBoost['fear:sea'] = 1;
  life.pending = { card, kind: 'slot' };
  assert.equal(choose(life, 0).effects.happy, -12);
});

test('메아리 줄 표: 흔적 22가지 모두 · 어느 땅·시대·나이에도 고를 줄이 셋 이상 · 한·영 짝 · 「처음」은 어릴 때만', () => {
  let total = 0;
  const ctxs = [];
  for (const area of ['britain', 'mongolia', 'pacific', 'china']) for (const year of [-20000, -500, 300, 1200, 1600, 1880, 1990]) for (const age of [5, 30, 70]) ctxs.push(echoContext({ birth: { area }, year, age }));
  assert.ok(ctxs.some((c) => c.writing) && ctxs.some((c) => !c.writing) && ctxs.some((c) => c.coast) && ctxs.some((c) => !c.coast));
  for (const [kind, keys] of [['fear', FEARS], ['talent', TALENTS], ['dream', DREAMS], ['bond', BONDS]]) {
    for (const key of keys) {
      const k = `${kind}:${key}`, rows = ECHO_LINES[k];
      for (const r of rows) {
        assert.ok(typeof r.ko === 'string' && r.ko.length >= 8 && r.ko.length <= 40, r.ko);
        assert.ok(typeof r.en === 'string' && r.en.length >= 10 && r.en.length <= 90, r.en);
        assert.ok(!/당신/.test(r.ko) && !/[.]$/.test(r.ko) && !/[.]$/.test(r.en), r.ko);
        if (/^처음 (본|쥔) (바다|연장|글자)/.test(r.ko)) assert.ok([].concat(r.when).includes('young'), `「처음」 줄은 5·15살만: ${r.ko}`);
      }
      total += rows.length;
      for (const c of ctxs) assert.ok(echoRows(k, c).length >= 3, `${k} ${JSON.stringify(c)}`);
    }
  }
  assert.ok(total >= 66, String(total));
  assert.equal(Object.keys(ECHO_LINES).length, FEARS.length + TALENTS.length + DREAMS.length + BONDS.length);
  // 글자가 없던 땅·때 (채집 무리, 1500년 태평양 섬)에는 글자 줄이, 채집 무리에는 지붕 줄이 안 나온다
  for (const c of [echoContext({ birth: { area: 'pacific' }, year: 1500, age: 30 }), echoContext({ birth: { area: 'britain' }, year: -20000, age: 30 })]) {
    assert.ok(!c.writing);
    for (const k of ['talent:letters', 'dream:letters']) assert.ok(echoRows(k, c).every((x) => !/글자|글 읽는/.test(x.row.ko)), k);
  }
  assert.ok(echoRows('fear:heights', echoContext({ birth: { area: 'britain' }, year: -20000, age: 30 })).every((x) => !/지붕/.test(x.row.ko)));
  // 「처음 본 바다」는 서른 살 모닥불에는 안 나온다
  assert.ok(echoRows('talent:sea', echoContext({ birth: { area: 'britain' }, year: 1300, age: 30 })).every((x) => !/^처음/.test(x.row.ko)));
  for (const f of ECHO_FALLBACK) assert.ok(f.ko('일본 열도', '고기잡이 집').length > 8 && f.en('Japan', 'a fishing family').length > 10);
});

// ── 짙어진 흔적의 효과 (모닥불에서 푸른 메아리를 꿴 생). 몸·죽음 굴림에는 닿지 않는다 ──
const T = { ko: '글', en: 'text' };
const tcard = (id, choices, when) => ({ id, stage: 'adult', title: T, text: T, when, choices: choices.map((c) => ({ text: T, result: T, ...c })) });
const NS = [0, 1, 2, 3, 9];

test('흔적 짙어짐: boost 1당 ×1.5, 많아도 ×2.5 · 짙음 표시 1~3 · 꿈·인연 카드 가중치 ×(1+boost) 많아도 ×3', () => {
  assert.deepEqual(NS.map(boostMul), [1, 1.5, 2.25, 2.5, 2.5]);
  assert.equal(boostMul(undefined), 1); assert.equal(boostMul(-2), 1);
  assert.deepEqual(NS.map((n) => traceLevel({ 'fear:sea': n }, 'fear:sea')), [1, 2, 3, 3, 3]);
  assert.equal(traceLevel(null, 'fear:sea'), 1);
  assert.deepEqual(NS.map(traceWeight), [1, 2, 3, 3, 3]);
});

test('짙어진 두려움: 지금처럼 맞는 선택의 마음 감소만 커진다 (−8 → −12 → −18 → −20)', () => {
  const tr = [{ kind: 'fear', key: 'sea' }];
  assert.deepEqual(NS.map((n) => riskPenalty({ risk: 'sea' }, tr, { 'fear:sea': n })), [-8, -12, -18, -20, -20]);
  assert.deepEqual(echoEffects(tcard('f', [{ risk: 'sea' }]), { risk: 'sea' }, tr, { 'fear:sea': 3 }), {});
  const card = tcard('z', [{ risk: 'sea', effects: { happy: 0 } }, {}]);
  const life = createLife({ birth: BIRTH, traces: tr });
  life.traceBoost['fear:sea'] = 1; life.pending = { card, kind: 'slot' };
  assert.equal(choose(life, 0).effects.happy, -12);
});

test('짙어진 재능: 확률 선택은 성공이 잦고, 확률 없는 선택은 마음 덤 · 재주가 더 늘고 · 맞는 올해의 패에 마음이 조금 더 (모두 상한)', () => {
  const tr = [{ kind: 'talent', key: 'craft' }], b = (n) => ({ 'talent:craft': n });
  assert.deepEqual(NS.map((n) => Math.round(chanceBonus({ skill: 'craft' }, tr, b(n)) * 10000) / 10000), [0.15, 0.225, 0.3375, 0.375, 0.375]);
  const plain = tcard('tc', [{ skill: 'craft', effects: { wealth: 8 } }]);
  assert.deepEqual(NS.map((n) => echoEffects(plain, plain.choices[0], tr, b(n)).happy || 0), [0, 2, 5, 6, 6]);
  assert.deepEqual(NS.map((n) => skillGain({ skill: 'craft' }, tr, b(n))), [1, 1.5, 2.25, 2.5, 2.5]);
  assert.deepEqual(NS.map((n) => talentYear('craft', tr, b(n))), [0, 0.5, 1.25, 1.5, 1.5]);
  assert.equal(talentYear('music', tr, { 'talent:music': 3 }), 0);   // 그 재능 흔적이 없으면 없다
  // choose: 확률 선택 성공률이 오른다 (시드 400개)
  const lucky = tcard('ch', [{ skill: 'craft', chance: { p: 0.5, win: { result: T }, lose: { result: T } } }]);
  const rate = (n) => { let ok = 0; for (let i = 0; i < 400; i++) { const life = createLife({ birth: { ...BIRTH, seed: 'TC-' + i }, traces: tr }); life.traceBoost = b(n); life.pending = { card: lucky, kind: 'slot' }; if (choose(life, 0).ok) ok++; } return ok / 400; };
  assert.ok(rate(3) > rate(0) + 0.12, `${rate(3)} vs ${rate(0)}`);
  // 올해의 패: 장인 집안이 「일」을 이어 가면, 짙어진 손재주로 마음이 더 높다 (몸은 그대로)
  const yearLife = (n) => { const life = createLife({ birth: { ...BIRTH, seed: 'TY', household: 'craft', tags: ['craft'] }, traces: tr, noDeath: true, quiet: true }); life.traceBoost = b(n); life.focus = 'work'; while (life.age < 30) advance(life, [], { yearly: true }); return life; };
  const y0 = yearLife(0), y2 = yearLife(2);
  assert.ok(y2.history[30].happy > y0.history[30].happy + 3, `${y2.history[30].happy} vs ${y0.history[30].happy}`);
  assert.deepEqual(y2.history.map((h) => h.health), y0.history.map((h) => h.health));
});

test('짙어진 꿈: 그 꿈을 이루는 카드가 더 잘 나오고, 이루면 마음 덤이 크다 (상한)', () => {
  const tr = [{ kind: 'dream', key: 'travel' }], b = (n) => ({ 'dream:travel': n });
  const card = DECK.find((c) => c.id === 't.dream.travel'), go = card.choices.find((c) => c.fulfill === 'travel');
  assert.deepEqual(NS.map((n) => echoEffects(card, go, tr, b(n)).happy || 0), [0, 3, 8, 9, 9]);
  assert.equal(echoCardKey(card, b(1)), 'dream:travel');
  assert.ok(DECK.filter((c) => echoCardKey(c, b(1))).length >= 5);   // 흔적 카드 + 이루는 선택이 있는 누구나·시대 카드
  assert.equal(echoCardKey(DECK.find((c) => c.id === 't.bond.friend'), b(1)), null);
  assert.equal(echoCardKey(card, b(0)), null);
  // 이루는 카드가 한 생(60살까지)에 나온 수 (시드 300개): 짙으면 더 많다
  const count = (n) => {
    let k = 0;
    for (let i = 0; i < 300; i++) {
      const life = createLife({ birth: { ...BIRTH, seed: 'DR-' + i }, traces: tr, noDeath: true, quiet: true });
      life.traceBoost = b(n);
      for (;;) { const ev = advance(life, DECK); if (ev.type === 'death' || life.age > 60) break; if (ev.type === 'card') { if (ev.card.choices.some((c) => c.fulfill === 'travel')) k++; choose(life, 0); } }
    }
    return k;
  };
  const c0 = count(0), c2 = count(2);
  assert.ok(c2 > c0 * 1.15, `${c2} vs ${c0}`);
});

test('짙어진 인연: 그 인연 카드가 더 잘 나오고, 그 카드·인연 선택의 좋은 곁·마음이 커진다 (상한, 나쁜 쪽은 그대로)', () => {
  const tr = [{ kind: 'bond', key: 'friend' }, { kind: 'bond', key: 'rival' }];
  const friend = DECK.find((c) => c.id === 't.bond.friend'), rival = DECK.find((c) => c.id === 't.bond.rival'), kid = DECK.find((c) => c.id === 'u.child.friend');
  assert.deepEqual(NS.map((n) => echoEffects(friend, friend.choices[0], tr, { 'bond:friend': n })), [{}, { family: 2, happy: 2 }, { family: 5, happy: 5 }, { family: 6, happy: 6 }, { family: 6, happy: 6 }]);
  assert.deepEqual(echoEffects(friend, friend.choices[1], tr, { 'bond:friend': 3 }), {});   // 그냥 지나친다 (마음 −2) 는 그대로
  assert.deepEqual(echoEffects(rival, rival.choices[0], tr, { 'bond:rival': 1 }), { happy: 2 });
  assert.deepEqual(echoEffects(kid, kid.choices[0], tr, { 'bond:friend': 1 }), { happy: 2 });
  assert.equal(echoCardKey(kid, { 'bond:friend': 1 }), 'bond:friend');
  // 인연 카드가 스물두 살까지 나온 생 (시드 300개): 짙으면 더 많다
  const seenBy = (n) => {
    let k = 0;
    for (let i = 0; i < 300; i++) {
      const life = createLife({ birth: { ...BIRTH, seed: 'BO-' + i }, traces: [tr[0]], noDeath: true, quiet: true });
      life.traceBoost = { 'bond:friend': n };
      for (;;) { const ev = advance(life, DECK); if (ev.type === 'death' || life.age > 22) break; if (ev.type === 'card') choose(life, 0); }
      if (life.seen.includes('t.bond.friend')) k++;
    }
    return k;
  };
  const s0 = seenBy(0), s2 = seenBy(2);
  assert.ok(s2 > s0 * 1.15, `${s2} vs ${s0}`);
});

test('22가지 흔적 모두: 짙어지면 실제 덱에 달라지는 것이 있다 · 덤은 마음·곁뿐 · 죽음 굴림은 그대로', () => {
  for (const [kind, keys] of [['fear', FEARS], ['talent', TALENTS], ['dream', DREAMS], ['bond', BONDS]]) for (const key of keys) {
    const k = `${kind}:${key}`, tr = [{ kind, key }], b1 = { [k]: 1 };
    const touch = DECK.some((card) => echoCardKey(card, b1) || card.choices.some((c) =>
      (c.chance && chanceBonus(c, tr, b1) !== chanceBonus(c, tr)) || riskPenalty(c, tr, b1) !== riskPenalty(c, tr)
      || Object.keys(echoEffects(card, c, tr, b1)).length || skillGain(c, tr, b1) !== skillGain(c, tr)));
    assert.ok(touch, k);
  }
  const all = [...FEARS.map((key) => ({ kind: 'fear', key })), ...TALENTS.map((key) => ({ kind: 'talent', key })), ...DREAMS.map((key) => ({ kind: 'dream', key })), ...BONDS.map((key) => ({ kind: 'bond', key }))];
  const big = Object.fromEntries(all.map((t) => [traceKey(t), 9]));
  for (const card of DECK) for (const c of card.choices) for (const k of Object.keys(echoEffects(card, c, all, big))) assert.ok(k === 'happy' || k === 'family', `${card.id}: ${k}`);
  // 카드 없이 해만 흐르는 생: 모든 흔적이 가득 짙어도 죽는 해·사인·몸이 같다 (올해의 패 덤은 마음뿐)
  for (let i = 0; i < 60; i++) {
    const run = (boost) => { const life = createLife({ birth: { ...BIRTH, seed: 'DEATH-' + i }, traces: all.filter((t) => t.kind === 'talent') }); life.traceBoost = boost; life.focus = ['work', 'learn', 'rest'][i % 3]; while (!life.death) advance(life, [], { yearly: true }); return life; };
    const a = run({}), z = run(big);
    assert.deepEqual(z.death, a.death); assert.deepEqual(z.history.map((h) => h.health), a.history.map((h) => h.health));
  }
});

test('빈틈: 다섯 살 전에 끝난 생은 모닥불·기억이 없다 · 저장(구슬·기억)이 validSoul 을 지난다 · 지금까지 이어진 생의 부고 · 옛 저장값 지우기', () => {
  let short = null;
  for (let i = 0; !short && i < 300; i++) { const life = createLife({ birth: { ...BIRTH, seed: 'SHORT-' + i, year: 1300 } }); while (advance(life, DECK, { lines: LINES }).type !== 'death'); if (life.death.age < 5) short = life; }
  assert.ok(short); assert.deepEqual(short.pauseMarks, []); assert.deepEqual(short.memories, []); assert.deepEqual(summarize(short, DECK).memories, []);
  // 기억이 있는 생을 끝내고 저장했다가 다시 읽는다
  const soul = newSoul('SAVE-1');
  const { life } = live(soul.next, {});
  const memories = life.memories.map((m) => ({ age: m.age, echo: m.kind === 'echo', text: { ...m.text } }));
  assert.ok(memories.length);
  finishLife(soul, life, { beads: encodeBeads(beadsOf(life)), memories });
  assert.ok(validSoul(soul));
  const mem = new Map([['pl.pauses', 'false']]), ls = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)), removeItem: (k) => mem.delete(k) };
  const store = makeStore(ls);
  assert.ok(store.saveSoul(soul));
  store.clearLegacy();
  assert.ok(!mem.has('pl.pauses'));
  assert.deepEqual(store.loadSoul().lives[0].memories, memories);
  makeStore(null).clearLegacy();   // 저장소가 없어도 조용히
  // 2026년까지 이어진 생: 마지막 기억 줄 다음에 「이 생은 지금도 이어지고 있어요」
  const now = { birth: { year: 1995, area: 'korea', group: 'modern', household: 'office', order: 1, sex: 'f' }, death: { age: 31, year: 2026, cause: null, line: 0, present: true }, flags: {}, skills: {}, focusYears: {} };
  assert.match(obituary(now, { married: false, kids: 0, memories: [{ age: 15, kind: 'life', text: { ko: '첫 월급을 받았어요', en: 'You got your first pay' } }] }, 'ko'),
    /기억은 이랬어요\. 「첫 월급을 받았어요」 2026년, 31살\. 이 생은 지금도 이어지고 있어요\.$/);
});
