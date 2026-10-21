// 한 생 (설계 5·12장): 사건 → 나이 결정 → 잠시 멈춤 → 해 마무리(초점·되돌림·작은 일·죽음 굴림)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, advance, choose, summarize, setFocus, addNote, autoChoice, PAUSES, PRESENT } from '../life.js';
import { CAUSES } from '../deaths.js';
import { contextOf } from '../context.js';

const T = { ko: '글', en: 'text' };
const mk = (id, stage) => ({ id, stage, title: T, text: T, choices: [
  { text: T, result: T, effects: { happy: 2 }, skill: 'craft' },
  { text: T, result: T, effects: { health: -5, wealth: 6 }, risk: 'sea' },
] });
const STAGES = ['baby', 'child', 'teen', 'adult', 'middle', 'old'];
const DECK = STAGES.flatMap((s) => [1, 2, 3, 4].map((i) => mk(`${s}${i}`, s)));
const LINES = STAGES.flatMap((s) => Array.from({ length: 30 }, (_, i) => ({ id: `l.${s}.${i}`, stage: s, text: { ko: `${s}${i}`, en: `${s}${i}` } })));
const EV = { id: 'ev.bd', event: 'blackdeath', title: T, when: { minAge: 0 }, text: T, choices: [{ text: T, result: T }, { text: T, result: T }] };
const BIRTH = { seed: 'LIFE-T', year: 1900, era: 11, group: 'industrial', region: 'europe', area: 'france', household: 'farm', tags: ['farm'], wealth: 35, sex: 'f', order: 2 };

function play(birth, opts = {}) {
  const life = createLife({ birth, traces: opts.traces || [], noDeath: opts.noDeath, quiet: opts.quiet });
  if (opts.focus) setFocus(life, opts.focus);
  const cards = [], pauses = [];
  let years = 0;
  for (;;) {
    const ev = advance(life, opts.deck || DECK, { lines: opts.lines || [], yearly: !!opts.yearly });
    if (ev.type === 'death') break;
    if (ev.type === 'pause') { pauses.push(ev.age); continue; }
    if (ev.type === 'year') { years++; continue; }
    cards.push(ev.card.id);
    choose(life, opts.pick ? opts.pick(ev.card) : 0);
  }
  return { life, cards, pauses, years };
}

test('같은 시드 + 같은 선택 = 같은 생 (인생 기록까지)', () => {
  const a = play(BIRTH, { lines: LINES }), b = play(BIRTH, { lines: LINES });
  assert.deepEqual(a.cards, b.cards);
  assert.deepEqual(a.life.death, b.life.death);
  assert.deepEqual(a.life.stats, b.life.stats);
  assert.deepEqual(a.life.journal, b.life.journal);
});

test('끝까지 살면 나이 결정 13번, 잠시 멈춤 5번, 119세에 끝', () => {
  const { life, cards, pauses } = play(BIRTH, { noDeath: true });
  assert.equal(cards.length, 13);
  assert.deepEqual(pauses, PAUSES);
  assert.equal(life.death.age, 119);
  assert.equal(life.history.length, 120);
  assert.equal(life.journal[0].kind, 'birth');
  assert.equal(life.journal[life.journal.length - 1].kind, 'death');
});

test('다섯 살 전에 시작한 사건도 이어지면 다섯 살부터 결정이 나온다', () => {
  const EV5 = { id: 'ev.bd5', event: 'blackdeath', title: T, text: T, choices: [{ text: T, result: T }, { text: T, result: T }] };   // minAge 기본 5
  let seen = 0;
  for (let i = 0; i < 20; i++) {
    const { cards } = play({ ...BIRTH, seed: 'BD5-' + i, year: 1345, era: 8, group: 'medieval' }, { noDeath: true, deck: [...DECK, EV5] });
    if (cards.includes('ev.bd5')) seen++;
  }
  assert.ok(seen >= 12, String(seen));   // 5·6살 두 해에 0.6씩
});

test('같은 해에 결정과 잠시 멈춤이 겹치면 결정이 먼저다', () => {
  let both = 0;
  for (let i = 0; i < 40; i++) {
    const life = createLife({ birth: { ...BIRTH, seed: 'ORD-' + i }, noDeath: true });
    const seq = [];
    for (;;) {
      const ev = advance(life, DECK);
      if (ev.type === 'death') break;
      seq.push([ev.type, life.age]);
      if (ev.type === 'card') choose(life, 0);
    }
    for (const a of PAUSES) {
      const c = seq.findIndex(([t, g]) => t === 'card' && g === a), p = seq.findIndex(([t, g]) => t === 'pause' && g === a);
      if (c >= 0 && p >= 0) { both++; assert.ok(c < p, `${i}: ${a}`); }
    }
  }
  assert.ok(both > 0);
});

test('사건 기간에 죽으면 사건의 사인이 나올 수 있다', () => {
  let plague = 0;
  for (let i = 0; i < 300; i++) {
    const { life } = play({ ...BIRTH, seed: 'PL-' + i, year: 1320, era: 7, group: 'medieval' }, { deck: [] });
    if (life.death.cause === 'plague' && life.death.year >= 1347 && life.death.year <= 1351) plague++;
  }
  assert.ok(plague > 0);
});

test('quiet 이면 잠시 멈춤이 없다', () => {
  assert.deepEqual(play(BIRTH, { noDeath: true, quiet: true }).pauses, []);
});

test('yearly 면 해마다 한 번씩 멈춘다', () => {
  const { life, years } = play(BIRTH, { noDeath: true, yearly: true });
  assert.equal(years, life.death.age);
});

test('흑사병 때 유럽에서 살면 시작 줄이 한 번, 결정이 거의 늘 나온다', () => {
  let seen = 0;
  for (let i = 0; i < 20; i++) {
    const { cards, life } = play({ ...BIRTH, seed: 'BD-' + i, year: 1330, era: 8, group: 'medieval' }, { noDeath: true, deck: [...DECK, EV] });
    if (cards.includes('ev.bd')) seen++;
    assert.equal(life.journal.filter((j) => j.kind === 'event' && j.text.en.includes('Black Death')).length, 1);
  }
  assert.ok(seen >= 17, String(seen));
});

test('올해의 초점: 몸 돌보기를 이어 가면 건강이 높아지고, 안 고르면 저절로 정해진다', () => {
  const body = play(BIRTH, { noDeath: true, focus: 'body' }).life;
  assert.equal(body.focusYears.body, 114);   // 6~119살
  assert.ok(body.history[60].health > 65, String(body.history[60].health));
  const auto = play(BIRTH, { noDeath: true }).life;
  assert.ok(auto.focusYears.work > 0);
  assert.ok(Math.abs(auto.history[60].health - 50) < 15, String(auto.history[60].health));
});

test('작은 일: 해마다 0.55쯤, 같은 줄은 다시 안 나온다, 첫돌에 그 땅·시대 풍습 줄', () => {
  const { life } = play(BIRTH, { noDeath: true, lines: LINES });
  const n = life.journal.filter((j) => j.kind === 'line').length;
  assert.ok(n / 119 > 0.4 && n / 119 < 0.7, String(n));
  assert.equal(new Set(life.linesSeen).size, life.linesSeen.length);
  const st = life.journal.find((j) => j.kind === 'stat');
  assert.equal(st.age, 1);
  assert.deepEqual(st.text, { ...contextOf(BIRTH.year + 1, BIRTH.area, BIRTH.household).firstYear });   // 통계 줄(약 ○%) 대신 그 땅·시대 첫돌 풍습 줄 (sim2 설계 5.3)
  assert.ok(!/%/.test(st.text.ko + st.text.en), st.text.ko);
});

test('choose 가 수치·플래그·아이·연습·꿈·인연과 결정 줄을 남긴다', () => {
  const card = { id: 'x', stage: 'child', title: { ko: '제목', en: 'Title' }, text: T, choices: [
    { text: { ko: '고름', en: 'pick' }, result: { ko: '결과', en: 'result' }, effects: { wealth: 10 }, set: ['married'], kids: 1, skill: 'craft', dream: 'sea', bond: { kind: 'friend', who: T } },
    { text: T, result: T },
  ] };
  const life = createLife({ birth: BIRTH });
  life.pending = { card, kind: 'slot' };
  const w0 = life.stats.wealth;
  const res = choose(life, 0);
  assert.equal(life.stats.wealth, Math.min(100, w0 + 10));
  assert.ok(life.flags.married);
  assert.equal(life.kids, 1);
  assert.equal(life.skills.craft, 1);
  assert.equal(life.dream, 'sea');
  assert.equal(life.bond.kind, 'friend');
  assert.deepEqual(res.result, { ko: '결과', en: 'result' });
  assert.equal(life.pending, null);
  assert.ok(life.seen.includes('x'));
  const j = life.journal[life.journal.length - 1];
  assert.equal(j.kind, 'decision');
  assert.equal(j.text.ko, '제목 · 고름 — 결과');
});

test('혼인·아이: 카드가 없어도 해마다 조용히 생기고 인생 기록에 남는다, 미루면 몇 해 쉰다', () => {
  let n = 0, wed = 0, kid = 0, lines = 0;
  for (let i = 0; i < 400; i++) {
    const life = createLife({ birth: { ...BIRTH, seed: 'KIN-' + i, year: 1500, era: 9, group: 'early' }, noDeath: true, quiet: true });
    while (life.age < 41) advance(life, [], { yearly: true });
    n++; if (life.flags.married) wed++; if (life.kids) kid++;
    lines += life.journal.filter((j) => j.kind === 'kin' && j.text.ko && j.text.en).length;
    if (life.kids) assert.ok(life.flags.married, 'kids without a partner');
  }
  assert.ok(wed / n >= 0.6 && wed / n <= 0.9, `혼인 ${wed / n}`);
  assert.ok(kid / n >= 0.5 && kid / n <= 0.85, `아이 ${kid / n}`);
  assert.ok(lines >= wed + kid);
  // 혼인 카드에서 「아직은 혼자」를 고르면 4년 동안 조용한 혼인이 없다
  const card = { id: 'm', stage: 'adult', title: T, text: T, choices: [{ text: T, result: T, set: ['married'] }, { text: T, result: T }] };
  for (let i = 0; i < 60; i++) {
    const life = createLife({ birth: { ...BIRTH, seed: 'WAIT-' + i, year: 1500, era: 9, group: 'early' }, noDeath: true, quiet: true });
    while (life.age < 20) advance(life, [], { yearly: true });
    if (life.flags.married) continue;
    life.pending = { card, kind: 'slot' };
    choose(life, 1);
    assert.equal(life.wedWait, 24);
    while (life.age < 24) { advance(life, [], { yearly: true }); assert.ok(!life.flags.married, `${i} ${life.age}`); }
  }
});

test('fulfill 은 꿈을 지운다', () => {
  const card = { id: 'y', stage: 'child', title: T, text: T, choices: [{ text: T, result: T, fulfill: 'sea' }, { text: T, result: T }] };
  const life = createLife({ birth: BIRTH });
  life.dream = 'sea';
  life.pending = { card, kind: 'slot' };
  choose(life, 0);
  assert.equal(life.dream, null);
  assert.deepEqual(life.fulfilled, ['sea']);
});

test('두려움 흔적이 걸린 선택은 행복 −8 을 더한다', () => {
  const card = { id: 'z', stage: 'child', title: T, text: T, choices: [{ text: T, result: T, risk: 'sea', effects: { happy: 0 } }, { text: T, result: T }] };
  const life = createLife({ birth: BIRTH, traces: [{ kind: 'fear', key: 'sea' }] });
  life.pending = { card, kind: 'slot' };
  const h0 = life.stats.happy;
  const res = choose(life, 0);
  assert.equal(res.effects.happy, -8);
  assert.equal(life.stats.happy, Math.max(0, h0 - 8));
});

test('chance: 성공·실패 결과 중 하나, 재능이 있으면 성공이 잦다', () => {
  const card = { id: 'c', stage: 'child', title: T, text: T, choices: [{ text: T, skill: 'craft', chance: { p: 0.5, win: { effects: { wealth: 5 }, result: { ko: '성공', en: 'win' } }, lose: { result: { ko: '실패', en: 'lose' } } } }, { text: T, result: T }] };
  const rate = (traces) => {
    let ok = 0;
    for (let i = 0; i < 400; i++) { const life = createLife({ birth: { ...BIRTH, seed: 'CH-' + i }, traces }); life.pending = { card, kind: 'slot' }; if (choose(life, 0).ok) ok++; }
    return ok / 400;
  };
  const plain = rate([]), talented = rate([{ kind: 'talent', key: 'craft' }]);
  assert.ok(Math.abs(plain - 0.5) < 0.08, String(plain));
  assert.ok(talented > plain + 0.08, `${talented} vs ${plain}`);
});

test('사인은 늘 사인 표 안에 있고, 근대 이전 15세 전 사망은 40~53%', () => {
  let early = 0;
  for (let i = 0; i < 1000; i++) {
    const { life } = play({ ...BIRTH, seed: 'PM-' + i, year: 1300, era: 8, group: 'medieval', region: 'east', area: 'china' }, { deck: [] });
    assert.ok(CAUSES[life.death.cause], life.death.cause);
    if (life.death.age < 15) early++;
  }
  assert.ok(early / 1000 >= 0.40 && early / 1000 <= 0.53, String(early / 1000));
});

test('summarize: 효과가 큰 결정 셋을 나이 순서로, 가장 행복했던 해, 가장 오래 쓴 초점', () => {
  const { life } = play(BIRTH, { noDeath: true, pick: (c) => (c.id.endsWith('2') ? 1 : 0) });
  const s = summarize(life, DECK);
  assert.equal(s.picks.length, 3);
  assert.ok(s.picks[0].age <= s.picks[1].age && s.picks[1].age <= s.picks[2].age);
  assert.ok(['health', 'wealth', 'family', 'happy'].includes(s.best));
  assert.equal(s.years, 119);
  assert.ok(Number.isInteger(s.happiest));
  assert.equal(typeof s.topFocus, 'string');
});

test('addNote 와 autoChoice', () => {
  const life = createLife({ birth: BIRTH });
  addNote(life, '한 줄');
  assert.deepEqual(life.journal[life.journal.length - 1].text, { ko: '한 줄', en: '한 줄' });
  const card = mk('auto1', 'baby');
  const i = autoChoice(life, card);
  assert.ok(i === 0 || i === 1);
  assert.equal(autoChoice(life, card), i);
});

test('지금(2026)까지 살아 있으면 죽지 않고 거기서 멈춘다: 맺는 줄, 죽음 줄 없음, 2026년 뒤는 없다', () => {
  assert.equal(PRESENT, 2026);
  const { life, cards } = play({ ...BIRTH, seed: 'NOWSTOP', year: 1990, era: 12, group: 'modern' }, { noDeath: true, lines: LINES, yearly: true });
  assert.deepEqual(life.death, { age: 36, year: 2026, cause: null, line: 0, present: true });
  assert.equal(life.year, 2026);
  const last = life.journal[life.journal.length - 1];
  assert.equal(last.kind, 'present');
  assert.equal(last.text.ko, '2026년, 이 생은 아직 이어지고 있어요.');
  assert.equal(last.text.en, '2026 — this life is still going on.');
  assert.ok(last.text.ko.length <= 60 && last.text.en.length <= 120);
  assert.ok(!life.journal.some((j) => j.kind === 'death'));
  assert.ok(life.journal.every((j) => j.year <= 2026));
  assert.equal(life.history[life.history.length - 1].age, 36);
  assert.ok(cards.length > 0);
  assert.equal(summarize(life, DECK).years, 36);
  assert.deepEqual(advance(life, DECK), { type: 'death', death: life.death });   // 끝난 생은 그대로
  // 보통 생도 2026년을 넘기지 않는다 (2026년의 죽음 굴림은 한다)
  for (let i = 0; i < 200; i++) {
    const { life: l } = play({ ...BIRTH, seed: 'NOW-' + i, year: 1960, era: 12, group: 'modern' }, { deck: [] });
    assert.ok(l.death.year <= 2026 && l.year <= 2026, String(l.death.year));
    if (l.death.present) assert.equal(l.death.cause, null); else assert.ok(CAUSES[l.death.cause]);
  }
});
