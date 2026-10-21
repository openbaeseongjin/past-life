// 작업 8: 여러 생 훑기 (tools/sweep.mjs) 를 적은 생 수로 돌려, 규칙이 되는 흠이 0 인지 본다.
//   남은 중괄호·undefined · 한국어 조사 · 영어 관사·복수·띄어쓰기 · 글 속 시대 착오 · 한 생 안의 같은 글 · 성별·나이·혼인·집안에 안 맞는 말
// 그리고 작업 8에서 고친 것들: 중세 유목 집안 · 재능 마음 덤 상한 · 불 두려움 메아리의 시대 · 콩고 고무 사인 · 병·다침 표지 · 글 꿈 · 앞 생 줄 피하기
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runMany, findFlaws, frequency, josaErrors, enErrors, koErrors, braceErrors, anachronisms } from '../tools/sweep.mjs';
import { drawBirth } from '../birth.js';
import { createLife, advance, choose, setFocus, TALENT_HAPPY_MAX } from '../life.js';
import { DECK } from '../deck.js';
import { LINES } from '../lines.js';
import { EVENTS } from '../events.js';
import { CAUSES } from '../deaths.js';
import { HERD_SHARE, HERD_GROUPS, HOUSEHOLDS } from '../households.js';
import { ECHO_LINES, echoRows } from '../memory.js';
import { holdingsOf } from '../holdings.js';
import { contextOf } from '../context.js';

const LIVES = runMany(320, { tag: 'T8-' });

test('훑기 320생: 규칙이 되는 흠이 하나도 없다 (중괄호·조사·영어·시대 착오·같은 글 반복·성별·나이·혼인·집안)', () => {
  const flaws = findFlaws(LIVES);
  const show = flaws.slice(0, 12).map((f) => `${f.rule} ${f.why}${f.detail ? ` 「${f.detail}」` : ''} · ${f.src} ${f.lang} ${f.year} ${f.area} ${f.household} ${f.sex} ${f.age}살: ${f.text.slice(0, 120)}`);
  assert.deepEqual(show, [], `흠 ${flaws.length}건`);
  assert.ok(LIVES.length === 320 && LIVES.reduce((s, l) => s + l.texts.length, 0) > 50000, '글을 충분히 그렸다');
});

test('검사기가 진짜 흠을 잡는다 (검사기가 비어 있으면 위 시험이 공짜로 통과하므로)', () => {
  assert.deepEqual(josaErrors('그해 쌀를 거뒀어요.', ['쌀']).map((x) => x[1]), ['쌀를 → 쌀을']);
  assert.deepEqual(josaErrors('보리쌀을 거뒀어요.', ['쌀']), [], '낱말 안쪽은 보지 않는다');
  const en = enErrors('You bought a apple and an pear. the the end. 1 denarii. 3 penny. the potatoes harvest');
  for (const k of ['a + 모음', 'an + 자음', '겹친 관사', '1 + 복수', '복수 + 홑꼴', '복수 명사 + harvest']) assert.ok(en.some((x) => x[0] === k), k);
  assert.ok(koErrors('밥을를 먹었어요.').includes('겹친 조사'));
  assert.ok(braceErrors('a {crop} undefined').length === 2);
  assert.deepEqual(anachronisms({ lang: 'ko', text: '라디오를 들었어요', year: 1800 }, { region: 'europe', area: 'britain' }), ['라디오 (1920 무렵부터)']);
  assert.deepEqual(anachronisms({ lang: 'en', text: 'You ate a potato', year: 1500 }, { region: 'americas', area: 'andes' }), [], '아메리카의 감자는 언제나');
});

test('너무 자주 나오는 줄: 마흔 넘게 산 생에서 한 줄이 80% 넘게 나오지 않는다 · 한 영혼 세 생에 같은 줄은 드물다', () => {
  const adult = LIVES.filter((l) => l.life.death.age >= 40);
  const c = new Map();
  for (const l of adult) for (const id of new Set(l.life.linesSeen)) c.set(id, (c.get(id) || 0) + 1);
  const top = [...c].sort((a, b) => b[1] - a[1])[0];
  assert.ok(adult.length > 60, `마흔 넘은 생 ${adult.length}`);
  assert.ok(top[1] / adult.length <= 0.8, `${top[0]} ${(top[1] / adult.length * 100).toFixed(0)}%`);
  const f = frequency(LIVES);
  assert.ok(f.cards[0].share < 0.3, `가장 잦은 카드 ${f.cards[0].id} ${(f.cards[0].share * 100).toFixed(0)}%`);
});

test('앞 생 줄 피하기: 같은 출생이라도 앞 생 줄을 avoid 로 주면 겹치는 줄이 준다', () => {
  let same = 0, avoided = 0;
  for (let i = 0; i < 40; i++) {
    const b = drawBirth(`AV${i}`);
    const run = (avoid) => { const life = createLife({ birth: b, avoid, noDeath: true, quiet: true }); for (;;) { const ev = advance(life, DECK, { lines: LINES }); if (ev.type === 'death' || life.age > 60) break; if (ev.type === 'card') choose(life, 0); } return life.linesSeen; };
    const a = run([]), x = run(a), y = run([]);
    same += y.filter((id) => a.includes(id)).length; avoided += x.filter((id) => a.includes(id)).length;
  }
  assert.ok(avoided < same * 0.6, `피한 생 겹침 ${avoided} / 그대로 ${same}`);
});

test('중세·근세 유목 땅에 가축 치는 집안이 태어나고, 그 밖 땅·시대 뽑기에는 나오지 않는다 · 살림에 천막·가축', () => {
  const seen = {};
  for (let i = 0; i < 120000; i++) {
    const b = drawBirth(`HD${i}`);
    if (b.household !== 'herd' || !HERD_GROUPS.includes(b.group)) continue;
    assert.ok(HERD_SHARE[b.area] > 0, `${b.area} ${b.year}: 유목 땅 밖 중세 목축 집안`);
    seen[b.area] = (seen[b.area] || 0) + 1;
  }
  for (const a of ['arabia', 'steppe', 'mongolia']) assert.ok(seen[a] > 0, `${a} 중세·근세 목축 생`);
  for (const g of HERD_GROUPS) assert.equal(HOUSEHOLDS[g].find((h) => h.id === 'herd').w, 0, '무게 0 (다른 땅의 뽑기를 바꾸지 않는다)');
  const ids = holdingsOf(60, contextOf(1200, 'arabia', 'herd'), 'herd').map((x) => x.id);
  assert.ok(ids.includes('beast') && ids.includes('tent'), `살림 ${ids}`);
});

test('짙어진 재능의 마음 덤은 한 생에 TALENT_HAPPY_MAX 까지', () => {
  const b = drawBirth('TALENT-1');
  const life = createLife({ birth: b, traces: [{ kind: 'talent', key: 'letters' }], noDeath: true, quiet: true });
  life.traceBoost = { 'talent:letters': 5 };
  for (;;) { setFocus(life, 'learn'); const ev = advance(life, DECK, { lines: LINES }); if (ev.type === 'death' || life.age > 70) break; if (ev.type === 'card') choose(life, 0); }
  assert.ok(life.talentHappy > 0 && life.talentHappy <= TALENT_HAPPY_MAX + 1e-9, `${life.talentHappy}`);
});

test('글 꿈을 품은 채 지식이 글 읽는 선에 닿으면 꿈도 이뤄진다', () => {
  const life = createLife({ birth: drawBirth('READ-1'), noDeath: true, quiet: true });
  life.dream = 'letters'; life.attrs.know = 59.9;
  for (let k = 0; k < 40 && !life.flags.literate; k++) { setFocus(life, 'learn'); const ev = advance(life, DECK, { lines: LINES, yearly: true }); if (ev.type === 'card') choose(life, 0); if (ev.type === 'death') break; }
  assert.ok(life.flags.literate && life.fulfilled.includes('letters') && life.dream === null);
  assert.ok(life.journal.some((j) => j.kind === 'stat' && /꿈/.test(j.text.ko)));
});

test('불 두려움 메아리: 화덕·불씨 줄은 산업 전에만, 현대에도 고를 줄이 셋 이상', () => {
  const premod = ECHO_LINES['fear:fire'].filter((r) => /화덕|불씨/.test(r.ko));
  assert.ok(premod.length >= 2 && premod.every((r) => r.when === 'premodern'));
  for (const group of ['ancient', 'industrial', 'modern']) assert.ok(echoRows('fear:fire', { group, coast: true, young: false, writing: true }).length >= 3, group);
});

test('콩고 고무 할당의 사인은 강제 노역 · 병·다침 표지는 카드에 있다', () => {
  assert.equal(EVENTS.find((e) => e.id === 'congo_rubber').cause, 'forced');
  assert.equal(CAUSES.forced.ko.length, 2);
  const ill = DECK.filter((c) => c.ill).map((c) => c.id), hurt = DECK.filter((c) => c.hurt).map((c) => c.id);
  for (const id of ['u.baby.fever', 'u.teen.sick', 'u.middle.ache', 't.fear.plague']) assert.ok(ill.includes(id), id);
  for (const id of ['h.sea.storm', 't.fear.fire', 't.fear.beast']) assert.ok(hurt.includes(id), id);
});

test('사건 카드도 when 의 나머지 조건(성별 …)을 본다', () => {
  const card = DECK.find((c) => c.event === 'covid');
  const b = drawBirth('EVSEX-1');
  const runs = (when) => {
    const deck = DECK.map((c) => (c === card ? { ...c, when } : c));
    let shown = 0;
    for (let i = 0; i < 60; i++) {
      const life = createLife({ birth: { ...drawBirth(`EVS${i}`), year: 1990, era: b.era }, noDeath: true, quiet: true });
      life.year = 1990; life.age = 0;
      for (;;) { const ev = advance(life, deck, { lines: [] }); if (ev.type === 'death' || life.year > 2024) break; if (ev.type === 'card') { if (ev.card.event === 'covid') shown++; choose(life, 0); } }
    }
    return shown;
  };
  assert.ok(runs({ minAge: 5 }) > 0, '조건 없이는 나온다');
  assert.equal(runs({ minAge: 5, maxAge: 3 }), 0, 'maxAge 가 막는다');
});
