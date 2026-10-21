// 능력치·신분 (sim2 설계 2.2·2.3): 시작 범위 · 흔적 · 올해의 패 성장 · 확률 보정 · 0~100 · 새 효과 키와 조건 · 생명표 맞춤은 그대로
import test from 'node:test';
import assert from 'node:assert/strict';
import { createLife, advance, choose, chanceOf, autoChoice, openChoices } from '../life.js';
import { ATTRS, ATTR_START, KNOW_SCHOOL, FOCUS_ATTR, ATTR_ROOM, KNOW_READ, attrGain, luckShift, charmMul, skillMul } from '../focus.js';
import { attrMods, TALENTS, FEARS, DREAMS } from '../traces.js';
import { statusOf, shiftStatus, refreshStatus } from '../status.js';
import { contextOf } from '../context.js';
import { eligible, choiceOpen } from '../cards.js';
import { drawBirth } from '../birth.js';
import { householdOf } from '../households.js';
import { AREAS } from '../places.js';
import { eraOf, groupOf } from '../births.js';
import { LINES } from '../lines.js';
import { DECK } from '../deck.js';

const T = { ko: '글', en: 'text' };
// 손으로 만든 탄생 (해·땅·집안을 고른다)
const born = (seed, year, area, household) => {
  const group = groupOf(year), h = householdOf(group, household);
  return { seed, year, era: eraOf(year).id, group, region: AREAS[area].region, area, household, tags: [...h.tags], wealth: h.wealth, sex: 'f', order: 1 };
};
const SERF = born('SERF', 1347, 'britain', 'serve');
const OFFICE = born('OFFICE', 1990, 'korea', 'office');
// 해만 흘려 보낸다 (카드 없음)
const years = (life, n, focus) => { if (focus) life.focus = focus; const end = life.age + n; while (life.age < end && !life.death) advance(life, [], { yearly: true }); return life; };

test('시작 능력치: 행운 20~80 · 친화력 25~75 · 지식 5~20 + 배울 기회 · 손재주 20~60 (시드마다 고르게)', () => {
  assert.deepEqual(ATTRS, ['luck', 'charm', 'know', 'skill']);
  const seen = Object.fromEntries(ATTRS.map((k) => [k, []]));
  const school = contextOf(SERF.year, SERF.area, SERF.household).school;
  for (let i = 0; i < 2000; i++) {
    const life = createLife({ birth: { ...SERF, seed: 'AT-' + i } });
    for (const k of ATTRS) { assert.ok(Number.isInteger(life.attrs[k]), k); seen[k].push(life.attrs[k]); }
  }
  for (const k of ['luck', 'charm', 'skill']) {
    const [lo, hi] = ATTR_START[k], v = seen[k];
    assert.ok(Math.min(...v) >= lo && Math.max(...v) <= hi, `${k} ${Math.min(...v)}~${Math.max(...v)}`);
    assert.ok(Math.min(...v) <= lo + 2 && Math.max(...v) >= hi - 2, `${k} 범위를 고르게 쓴다`);
  }
  const [klo, khi] = ATTR_START.know, bonus = Math.round(KNOW_SCHOOL * school);
  assert.ok(Math.min(...seen.know) >= klo + bonus && Math.max(...seen.know) <= khi + bonus, `know ${Math.min(...seen.know)}~${Math.max(...seen.know)}`);
  // 배울 기회가 큰 집안·시대(1990 한국 회사원 집)는 지식이 위에서 시작한다
  const ctx = contextOf(OFFICE.year, OFFICE.area, OFFICE.household);
  assert.equal(ctx.school, 1);
  const k2 = Array.from({ length: 400 }, (_, i) => createLife({ birth: { ...OFFICE, seed: 'AK-' + i } }).attrs.know);
  assert.ok(Math.min(...k2) >= klo + KNOW_SCHOOL && Math.max(...k2) <= khi + KNOW_SCHOOL, `${Math.min(...k2)}~${Math.max(...k2)}`);
  // 같은 시드 = 같은 능력치
  assert.deepEqual(createLife({ birth: SERF }).attrs, createLife({ birth: SERF }).attrs);
});

test('앞 생의 흔적: 재능 +8 (글·약초 → 지식, 손·땅·바다·싸움 → 손재주, 노래·셈 → 친화력), 인연 friend 친화력 +5, 두려움·꿈은 그대로', () => {
  const MAP = { letters: 'know', heal: 'know', craft: 'skill', farm: 'skill', sea: 'skill', fight: 'skill', music: 'charm', trade: 'charm' };
  assert.deepEqual(Object.keys(MAP).sort(), [...TALENTS].sort());
  const base = createLife({ birth: SERF }).attrs;
  for (const key of TALENTS) {
    assert.deepEqual(attrMods([{ kind: 'talent', key }]), { [MAP[key]]: 8 });
    const a = createLife({ birth: SERF, traces: [{ kind: 'talent', key }] }).attrs;
    for (const k of ATTRS) assert.equal(a[k], base[k] + (k === MAP[key] ? 8 : 0), `${key} ${k}`);
  }
  const f = createLife({ birth: SERF, traces: [{ kind: 'bond', key: 'friend', who: T }] }).attrs;
  assert.deepEqual(f, { ...base, charm: base.charm + 5 });
  assert.deepEqual(attrMods([{ kind: 'bond', key: 'rival', who: T }]), {});
  for (const key of FEARS) assert.deepEqual(attrMods([{ kind: 'fear', key }]), {});
  for (const key of DREAMS) assert.deepEqual(attrMods([{ kind: 'dream', key }]), {});
  // 셋이 겹치면 더한다 (재능 + 인연)
  assert.deepEqual(attrMods([{ kind: 'talent', key: 'music' }, { kind: 'bond', key: 'friend', who: T }]), { charm: 13 });
});

test('「배우기」 10해: 지식이 그해 맥락의 배울 기회(school)에 비례해 오른다 · 「일」은 손재주, 「가족·이웃」은 친화력 (남은 칸에 비례해 줄어든다)', () => {
  // 한 해 오름 = 기본량 × (100 − 지금 값) / 60. 배우기의 기본량은 2.5 × 그해 school
  assert.equal(ATTR_ROOM, 60);
  assert.equal(attrGain(1.5, 40), 1.5); assert.equal(attrGain(1.5, 100), 0); assert.equal(attrGain(1.5, 10), 2.25);
  const learn = (b) => {
    const life = createLife({ birth: b, noDeath: true, quiet: true });
    years(life, 6);
    const k0 = life.attrs.know, y0 = life.year;
    years(life, 10, 'learn');
    let x = k0, flat = 0;
    for (let y = y0; y < y0 + 10; y++) { const s = contextOf(y, b.area, b.household).school; x += attrGain(FOCUS_ATTR.learn.know * s, x); flat += FOCUS_ATTR.learn.know * s; }
    return { gain: life.attrs.know - k0, want: x - k0, flat, k0 };
  };
  const a = learn(OFFICE), z = learn(SERF);
  assert.ok(Math.abs(a.gain - a.want) < 1e-9 && Math.abs(z.gain - z.want) < 1e-9, `${a.gain}/${a.want} ${z.gain}/${z.want}`);
  assert.ok(a.gain > 15 && a.gain < 30, String(a.gain));   // 배울 기회 1 → 10해에 +2.5 안팎씩 (평평한 식이면 +25)
  assert.ok(z.gain < 2 && z.gain > 0, String(z.gain));     // 1347년 농노는 배울 데가 거의 없다
  // 배울 기회에 비례: 같은 지식에서 한 해 배우면 오르는 양의 비는 그해 school 의 비와 같다
  const one = (b) => { const life = createLife({ birth: b, noDeath: true, quiet: true }); years(life, 6); life.attrs.know = 30; const s = life.ctx().school; years(life, 1, 'learn'); return { g: life.attrs.know - 30, s }; };
  const o1 = one(OFFICE), s1 = one(SERF);
  assert.ok(Math.abs(o1.g / s1.g - o1.s / s1.s) < 1e-9, `${o1.g}/${s1.g} vs ${o1.s}/${s1.s}`);
  assert.ok(Math.abs(o1.g - 2.5 * o1.s * 70 / 60) < 1e-9, String(o1.g));
  // 일 · 가족·이웃: 기본량 1.5, 남은 칸에 비례
  for (const [focus, k] of [['work', 'skill'], ['family', 'charm']]) {
    const life = createLife({ birth: SERF, noDeath: true, quiet: true });
    years(life, 6);
    let x = life.attrs[k];
    years(life, 10, focus);
    for (let i = 0; i < 10; i++) x += attrGain(FOCUS_ATTR[focus][k], x);
    assert.ok(Math.abs(life.attrs[k] - x) < 1e-9, `${focus} → ${life.attrs[k]} vs ${x}`);
  }
  // 몸 돌보기·쉬기는 능력치를 바꾸지 않는다, 여섯 살 전에도
  const life = createLife({ birth: SERF, noDeath: true, quiet: true }), a0 = { ...life.attrs };
  years(life, 6, 'learn');
  assert.deepEqual(life.attrs, a0);
  years(life, 5, 'body'); years(life, 5, 'rest');
  assert.deepEqual(life.attrs, a0);
});

test('행운: 운에 맡기는 확률에 (행운 − 50)/250 (±0.2) · 흔적 덤과 함께 0.05~0.95로 자른다', () => {
  for (let l = 0; l <= 100; l++) assert.ok(Math.abs(luckShift(l)) <= 0.2 + 1e-12, String(l));
  assert.equal(luckShift(50), 0); assert.equal(luckShift(100), 0.2); assert.equal(luckShift(0), -0.2);
  assert.equal(luckShift(-40), -0.2); assert.equal(luckShift(300), 0.2);   // 범위 밖 값도 ±0.2 안
  const ch = (p, skill) => ({ text: T, skill, chance: { p, win: { result: T }, lose: { result: T } } });
  const at = (luck, traces = [], skill = 50) => { const life = createLife({ birth: SERF, traces }); life.attrs.luck = luck; life.attrs.skill = skill; return life; };
  assert.ok(Math.abs(chanceOf(at(80), ch(0.5)) - 0.62) < 1e-9);
  assert.ok(Math.abs(chanceOf(at(20), ch(0.5)) - 0.38) < 1e-9);
  assert.equal(chanceOf(at(0), ch(0.1)), 0.05);
  assert.equal(chanceOf(at(100), ch(0.9)), 0.95);
  assert.ok(Math.abs(chanceOf(at(50, [{ kind: 'talent', key: 'craft' }]), ch(0.5, 'craft')) - 0.65) < 1e-9);   // 재능 흔적 +0.15
  assert.equal(chanceOf(at(100, [{ kind: 'talent', key: 'craft' }]), ch(0.7, 'craft')), 0.95);
  assert.equal(chanceOf(at(50), { text: T }), null);   // 확률 없는 선택
  // 손재주: 장인 재주(craft)가 걸린 운에 맡기는 선택에만 (손재주 − 50)/250 (설계 2.2 「장인·대장장이 카드의 성공 확률」)
  assert.ok(Math.abs(chanceOf(at(50, [], 100), ch(0.5, 'craft')) - 0.7) < 1e-9);
  assert.ok(Math.abs(chanceOf(at(50, [], 0), ch(0.5, 'craft')) - 0.3) < 1e-9);
  for (const sk of ['sea', 'farm', 'letters', undefined]) assert.equal(chanceOf(at(50, [], 100), ch(0.5, sk)), 0.5, String(sk));
  assert.equal(chanceOf(at(100, [{ kind: 'talent', key: 'craft' }], 100), ch(0.5, 'craft')), 0.95);   // 0.5 + 0.2 + 0.15 + 0.2 → 0.95 에서 자른다
  // choose 의 실제 성공률이 따라온다 (시드 600개)
  const card = { id: 'luck', stage: 'adult', title: T, text: T, choices: [ch(0.5), { text: T, result: T }] };
  const rate = (luck) => { let ok = 0; for (let i = 0; i < 600; i++) { const life = createLife({ birth: { ...SERF, seed: 'LK-' + i } }); life.attrs.luck = luck; life.pending = { card, kind: 'slot' }; if (choose(life, 0).ok) ok++; } return ok / 600; };
  const hi = rate(100), lo = rate(0);
  assert.ok(Math.abs(hi - 0.7) < 0.06 && Math.abs(lo - 0.3) < 0.06, `${hi} ${lo}`);
});

test('새 효과 키: 행운·친화력·지식·손재주는 더하고 0~100에서 자른다, 신분은 한 계단씩 · 인생 기록에 남는다', () => {
  const card = (effects) => ({ id: 'fx', stage: 'adult', title: { ko: '제목', en: 'Title' }, text: T, choices: [{ text: T, result: T, effects }, { text: T, result: T }] });
  const life = createLife({ birth: SERF });
  const a0 = { ...life.attrs };
  life.pending = { card: card({ luck: 3, charm: -4, know: 5, skill: 2, wealth: 1 }), kind: 'slot' };
  const res = choose(life, 0);
  assert.deepEqual(life.attrs, { luck: a0.luck + 3, charm: a0.charm - 4, know: a0.know + 5, skill: a0.skill + 2 });
  assert.equal(res.effects.know, 5);
  life.pending = { card: card({ luck: 500, charm: -500, know: 999, skill: -999 }), kind: 'slot' };
  choose(life, 0);
  assert.deepEqual(life.attrs, { luck: 100, charm: 0, know: 100, skill: 0 });
  // 확률 선택의 갈래 효과에도 능력치 키가 들어간다
  const sure = { id: 'sure', stage: 'adult', title: T, text: T, choices: [{ text: T, chance: { p: 0.95, win: { result: T, effects: { know: -30 } }, lose: { result: T, effects: { know: -30 } } } }, { text: T, result: T }] };
  life.pending = { card: sure, kind: 'slot' };
  choose(life, 0);
  assert.equal(life.attrs.know, 70);
  // 신분: 농노(1) → 한 계단 위, 기록 한 줄 (한·영)
  const s0 = life.status, n = life.journal.length;
  assert.equal(s0.ko, '농노');
  life.pending = { card: card({ status: 1 }), kind: 'slot' };
  choose(life, 0);
  assert.ok(life.status.rank > s0.rank, JSON.stringify(life.status));
  const line = life.journal.filter((j, i) => i >= n && j.kind === 'status');
  assert.equal(line.length, 1);
  assert.ok(line[0].text.ko.includes('농노') && line[0].text.ko.includes(life.status.ko), line[0].text.ko);
  assert.ok(line[0].text.en.includes('serf') && line[0].text.en.includes(life.status.en), line[0].text.en);
  assert.deepEqual(line[0].status, { from: s0.id, to: life.status.id, d: 1 });
  life.pending = { card: card({ status: -1 }), kind: 'slot' };
  choose(life, 0);
  assert.equal(life.status.ko, '농노');
});

test('친화력: 혼인·아이 굴림과 곁이 오르는 양에 0.8 + 친화력/250 · 손재주: 「일」의 재산에 0.8 + 손재주/250 × 그해 품삯', () => {
  assert.equal(charmMul(50), 1); assert.equal(charmMul(0), 0.8); assert.equal(charmMul(100), 1.2);
  assert.equal(skillMul(50), 1); assert.equal(skillMul(100), 1.2);
  // 한 해 「일」: 재산 = 자르기(w + 3 × 품삯 × 배율) 뒤 되돌림 6%. 1347년 흑사병 해는 품삯이 오른다
  const b = { ...SERF, year: 1320 };
  for (const skill of [0, 50, 100]) {
    const life = createLife({ birth: b, noDeath: true, quiet: true });
    years(life, 27);
    assert.equal(life.year, 1347);
    life.attrs.skill = skill; life.focus = 'work';
    const w0 = life.stats.wealth, wage = life.ctx().econ.wage;
    assert.ok(wage > 1, String(wage));
    years(life, 1);
    let w = Math.min(100, w0 + 3 * wage * skillMul(skill));
    w += (life.base.wealth - w) * 0.06;
    assert.ok(Math.abs(life.stats.wealth - w) < 1e-9, `${skill}: ${life.stats.wealth} vs ${w}`);
  }
  // 한 해 「가족·이웃」: 곁 +3 × 친화력 배율
  for (const charm of [0, 100]) {
    const life = createLife({ birth: b, noDeath: true, quiet: true });
    years(life, 50);
    life.attrs.charm = charm; life.focus = 'family';
    const f0 = life.stats.family, kids = life.kids, wed = life.flags.married;
    years(life, 1);
    if (life.kids !== kids || life.flags.married !== wed) continue;   // 그해 식구가 늘면 건너뛴다 (50살이라 드물다)
    let f = Math.min(100, f0 + 3 * charmMul(charm));
    f += (50 - f) * 0.06;
    assert.ok(Math.abs(life.stats.family - f) < 1e-9, `${charm}: ${life.stats.family} vs ${f}`);
  }
  // 혼인: 친화력이 높으면 일찍·자주 (시드 400개, 25살까지)
  const wed = (charm) => { let n = 0; for (let i = 0; i < 400; i++) { const life = createLife({ birth: { ...b, seed: 'CW-' + i }, noDeath: true, quiet: true }); life.attrs.charm = charm; years(life, 25); if (life.flags.married) n++; } return n / 400; };
  const hi = wed(100), lo = wed(0);
  assert.ok(hi > lo + 0.03, `${hi} vs ${lo}`);
  // 갈림길에서 곁이 오르면 같은 배율, 내려가면 그대로
  const card = { id: 'fam', stage: 'adult', title: T, text: T, choices: [{ text: T, result: T, effects: { family: 10 } }, { text: T, result: T, effects: { family: -10 } }] };
  const life = createLife({ birth: SERF }); life.attrs.charm = 100; life.stats.family = 50;
  life.pending = { card, kind: 'slot' };
  assert.ok(Math.abs(choose(life, 0).effects.family - 12) < 1e-9);
  assert.ok(Math.abs(life.stats.family - 62) < 1e-9);
  life.pending = { card, kind: 'slot' };
  assert.equal(choose(life, 1).effects.family, -10);
});

test('0~100을 넘지 않는다: 한평생 배우기·일·가족만 해도, 흔적이 다 겹쳐도', () => {
  const tr = [{ kind: 'talent', key: 'letters' }, { kind: 'bond', key: 'friend', who: T }];
  for (const [focus, b] of [['learn', OFFICE], ['work', OFFICE], ['family', OFFICE], ['work', SERF], ['family', SERF], ['learn', SERF]]) {
    const life = createLife({ birth: b, traces: tr, noDeath: true, quiet: true });
    life.focus = focus;
    while (!life.death) { advance(life, [], { yearly: true }); for (const k of ATTRS) assert.ok(life.attrs[k] >= 0 && life.attrs[k] <= 100, `${focus} ${k} ${life.attrs[k]}`); }
  }
});

test('생명표 맞춤은 그대로: 같은 시드면 능력치·신분을 어떻게 바꿔도 몸과 죽는 나이가 같다', () => {
  const runs = [
    (l) => l,
    (l) => { for (const k of ATTRS) l.attrs[k] = 0; return l; },
    (l) => { for (const k of ATTRS) l.attrs[k] = 100; return l; },
  ];
  for (let i = 0; i < 80; i++) {
    const b = drawBirth('CAL-' + i);
    const out = runs.map((tweak) => {
      const life = tweak(createLife({ birth: b, quiet: true }));
      life.focus = ['work', 'learn', 'family', 'body', 'rest', null][i % 6];
      while (advance(life, [], { lines: LINES }).type !== 'death');
      return life;
    });
    for (const z of out.slice(1)) {
      assert.equal(z.death.age, out[0].death.age, `${b.seed}`);
      assert.equal(z.death.year, out[0].death.year);
      assert.deepEqual(z.history.map((h) => h.health), out[0].history.map((h) => h.health));
    }
  }
});

test('eligible 새 조건: minKnow·maxKnow·minStatus·maxStatus·bound·war(최소 수준)·setting·zones (맥락에 없으면 막힌다)', () => {
  const card = (when) => ({ id: 'w', stage: 'adult', when, text: T, choices: [{ text: T, result: T }, { text: T, result: T }] });
  const ctx = (over = {}) => ({ stage: 'adult', age: 30, year: 1347, era: 8, group: 'medieval', region: 'europe', area: 'britain', coast: true, tags: ['serve'], sex: 'f', flags: {}, traces: [], dream: null,
    stats: { health: 50, wealth: 50, family: 50, happy: 50 }, seen: [], attrs: { luck: 50, charm: 50, know: 40, skill: 50 }, status: { id: 'serve', rank: 1, ko: '농노', en: 'serf', bound: true },
    zone: 'europe', setting: 'estate', war: 1, ...over });
  const yes = (when, over) => assert.ok(eligible(card(when), ctx(over)), JSON.stringify(when));
  const no = (when, over) => assert.ok(!eligible(card(when), ctx(over)), JSON.stringify(when));
  yes({ minKnow: 40 }); no({ minKnow: 41 }); yes({ maxKnow: 40 }); no({ maxKnow: 39 });
  yes({ minStatus: 1 }); no({ minStatus: 2 }); yes({ maxStatus: 1 }); no({ maxStatus: 0 });
  yes({ bound: true }); no({ bound: false }); yes({ bound: false }, { status: { id: 'farm', rank: 2, ko: '농민', en: 'peasant', bound: false } });
  yes({ war: 1 }); yes({ war: 0 }); no({ war: 2 }); yes({ war: 3 }, { war: 3 });
  yes({ setting: 'estate' }); yes({ setting: ['village', 'estate'] }); no({ setting: 'village' });
  yes({ zones: ['europe', 'africa'] }); no({ zones: ['eastasia'] });
  // 맥락에 그 값이 없으면(옛 맥락) 새 조건은 막히고, 옛 조건은 그대로
  const old = { attrs: undefined, status: undefined, zone: undefined, setting: undefined, war: undefined };
  for (const w of [{ minKnow: 0 }, { maxKnow: 100 }, { minStatus: 1 }, { maxStatus: 5 }, { bound: false }, { war: 0 }, { setting: 'estate' }, { zones: ['europe'] }]) no(w, old);
  yes({ regions: ['europe'], tags: ['serve'], minYear: 1300 }, old);
  yes(undefined, old);
});

test('ctxOf 가 능력치·신분·문화권·자리·전쟁 수준을 카드에 넘긴다 (농노 → 큰 집의 매인 몸 카드, 조선 농민은 아니다)', () => {
  const only = { id: 'only.serf', stage: ['child', 'teen', 'adult', 'middle', 'old'], when: { zones: ['europe'], setting: 'estate', bound: true, maxStatus: 1, maxKnow: 60, war: 1 }, title: T, text: T, choices: [{ text: T, result: T }, { text: T, result: T }] };
  const play = (b) => { const life = createLife({ birth: b, noDeath: true, quiet: true }); for (;;) { const ev = advance(life, [only]); if (ev.type === 'death' || life.age > 30) break; if (ev.type === 'card') return ev.card.id; } return null; };
  assert.equal(play({ ...SERF, year: 1330 }), 'only.serf');
  assert.equal(play(born('JOSEON', 1651, 'korea', 'farm')), null);
});

test('life.ctx(): 그해 맥락 (contextOf 와 같은 객체), 해가 바뀌면 따라가고, 생 객체를 JSON 으로 옮겨도 끼지 않는다', () => {
  const life = createLife({ birth: SERF, noDeath: true, quiet: true });
  assert.equal(life.ctx(), contextOf(1347, 'britain', 'serve'));
  assert.equal(life.ctx(), life.ctx());
  years(life, 3);
  assert.equal(life.ctx(), contextOf(1350, 'britain', 'serve'));
  assert.ok(!('ctx' in JSON.parse(JSON.stringify(life))));
  assert.ok(!Object.keys(life).includes('ctx'));
});

test('신분 (설계 2.3): 시대·땅의 신분제에서 집안으로 고른다 · 한 계단 오르내림은 그 묶음의 사다리 안에서', () => {
  const st = (y, area, h) => statusOf(born('S', y, area, h), contextOf(y, area, h));
  assert.deepEqual(st(1347, 'britain', 'serve'), { id: 'serve', rank: 1, ko: '농노', en: 'serf', bound: true });
  assert.equal(st(1651, 'korea', 'farm').ko, '상민');
  assert.equal(st(1651, 'korea', 'serve').ko, '노비');
  assert.equal(st(1651, 'korea', 'elite').ko, '양반');
  assert.equal(st(1500, 'west_africa', 'craft').ko, '장인 · 오바의 길드');
  assert.equal(st(1840, 'north_america', 'serve').ko, '노예');
  assert.equal(st(1100, 'india', 'farm').ko, '농민 집(자티)');
  assert.equal(st(1100, 'bengal', 'farm').ko, '농민 집(자티)');
  assert.equal(createLife({ birth: SERF }).status.ko, '농노');
  // 조선의 사다리: 노비(1) → 상민(2) → 양반(5) — 한 계단은 다음 순위
  const life = createLife({ birth: born('JS', 1651, 'korea', 'serve'), noDeath: true, quiet: true });
  assert.equal(shiftStatus(life, -1), false);   // 맨 아래에서는 더 내려가지 않는다 (기록도 없다)
  assert.equal(life.journal.filter((j) => j.kind === 'status').length, 0);
  assert.equal(shiftStatus(life, 1), true);  assert.equal(life.status.ko, '상민'); assert.equal(life.status.bound, false);
  assert.equal(life.status.id, 'farm');   // 같은 순위가 여럿이면 묶음 집안 차례의 첫째
  assert.equal(shiftStatus(life, 1), true);  assert.equal(life.status.ko, '양반'); assert.equal(life.status.rank, 5);
  assert.equal(shiftStatus(life, 1), false); assert.equal(life.status.ko, '양반');
  assert.equal(shiftStatus(life, -2), true); assert.equal(life.status.ko, '노비');
  const lines = life.journal.filter((j) => j.kind === 'status');
  assert.equal(lines.length, 3);
  assert.deepEqual(lines.map((j) => j.status.d), [1, 1, -2]);
  // 끝에 닿으면 움직인 만큼만 적는다 (노비 +5 → 양반, 두 계단)
  assert.equal(shiftStatus(life, 5), true); assert.equal(life.status.ko, '양반');
  assert.equal(life.journal[life.journal.length - 1].status.d, 2);
  for (const j of lines) assert.ok(j.text.ko.length > 5 && j.text.en.length > 5 && !/undefined/.test(j.text.ko + j.text.en), j.text.ko);
  // 같은 순위면 태어난 집안을 먼저 (장인 집에서 태어나 한 계단 내려갔다 올라오면 다시 장인)
  const c = createLife({ birth: born('JC', 1651, 'korea', 'craft'), noDeath: true, quiet: true });
  shiftStatus(c, -1); assert.equal(c.status.ko, '노비');
  shiftStatus(c, 1); assert.equal(c.status.id, 'craft');
  // 해가 바뀌어 그 묶음의 이름이 바뀌면 따라간다 (사다리 자리 id 는 그대로)
  const s = createLife({ birth: born('US', 1855, 'north_america', 'serve'), noDeath: true, quiet: true });
  assert.equal(s.status.ko, '노예'); assert.equal(s.status.bound, true);
  years(s, 15);
  const now = contextOf(s.year, 'north_america', 'serve').status.ranks.serve;
  assert.deepEqual(s.status, { id: 'serve', rank: now.rank, ko: now.ko, en: now.en, bound: now.bound });
  assert.equal(s.status.ko, '하인'); assert.equal(s.status.bound, false);   // 1866년부터 해방
  s.status = { id: 'nobody', rank: 2, ko: 'x', en: 'x', bound: false };
  assert.ok(typeof s.ctx === 'function');
  assert.deepEqual(refreshStatus(s), { id: 'nobody', rank: 2, ko: 'x', en: 'x', bound: false });   // 그해 신분표에 없는 자리는 그대로
  years(s, 1);
  assert.equal(s.status.ko, 'x');
});

test('줄어드는 성장 (수정 1차): 자동 결정 생의 손재주는 40살 중앙값 55~85, 60살에 95 넘는 생은 15% 미만 · 시작값 차이가 남는다', () => {
  const at = { 40: [], 60: [] }, start = [];
  for (let i = 0; i < 1500; i++) {
    const life = createLife({ birth: drawBirth('SAT-' + i), quiet: true });
    const s0 = life.attrs.skill, got = new Set();
    for (;;) {
      const ev = advance(life, DECK, { lines: LINES, yearly: true });
      if (ev.type === 'death' || life.age > 60) break;
      if (ev.type === 'card') choose(life, autoChoice(life, ev.card));
      if (at[life.age] && !got.has(life.age)) { got.add(life.age); at[life.age].push(life.attrs.skill); if (life.age === 60) start.push([s0, life.attrs.skill]); }
    }
  }
  const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
  assert.ok(at[40].length > 300 && at[60].length > 100, `${at[40].length} ${at[60].length}`);
  assert.ok(med(at[40]) >= 55 && med(at[40]) <= 85, `40살 중앙값 ${med(at[40])}`);
  const hi = at[60].filter((x) => x >= 95).length / at[60].length;
  assert.ok(hi < 0.15, `60살 ≥95 ${hi}`);
  // 시작이 낮았던 생과 높았던 생이 60살에도 갈린다
  const lo = start.filter(([a]) => a <= 30).map(([, b]) => b), up = start.filter(([a]) => a >= 50).map(([, b]) => b);
  assert.ok(lo.length > 5 && up.length > 5 && med(up) > med(lo) + 3, `${med(lo)} vs ${med(up)}`);
});

test('지식 60이면 글을 읽는다 (flags.literate): 해마다 배우기로 닿아도, 카드 효과로 닿아도 · 한 번 세우면 그대로', () => {
  assert.equal(KNOW_READ, 60);
  const life = createLife({ birth: OFFICE, noDeath: true, quiet: true });
  assert.ok(!life.flags.literate);
  years(life, 6);
  life.attrs.know = 58; life.focus = 'learn';
  while (life.attrs.know < 60) { assert.ok(!life.flags.literate, String(life.attrs.know)); years(life, 1); }
  assert.equal(life.flags.literate, true);
  const card = { id: 'k', stage: 'adult', title: T, text: T, choices: [{ text: T, result: T, effects: { know: 60 } }, { text: T, result: T, effects: { know: -50 } }] };
  const b = createLife({ birth: SERF });
  b.pending = { card, kind: 'slot' }; choose(b, 0);
  assert.equal(b.flags.literate, true);
  b.pending = { card, kind: 'slot' }; choose(b, 1);
  assert.equal(b.flags.literate, true);   // 잊어도 읽는 법은 남는다
  assert.ok(!createLife({ birth: SERF }).flags.literate);
});

test('선택지 단위 when (설계 2.2·2.3): 잠긴 선택지는 자동 결정이 안 고르고, choose 는 null · 다 잠긴 카드는 안 나온다', () => {
  const C = (when) => ({ text: T, result: T, when });
  const card = { id: 'lock', stage: ['child', 'teen', 'adult', 'middle', 'old'], title: T, text: T, choices: [C({ bound: false }), C({ minKnow: 90 }), C()] };
  const life = createLife({ birth: SERF, noDeath: true, quiet: true });   // 농노: 매인 몸, 지식 90 아님
  years(life, 20);
  assert.deepEqual(openChoices(life, card), [false, false, true]);
  for (let i = 0; i < 30; i++) { life.age = 20 + i; assert.equal(autoChoice(life, card), 2); }
  life.age = 20;
  life.pending = { card, kind: 'slot' };
  assert.equal(choose(life, 0), null); assert.ok(life.pending, '잠긴 선택지는 결정을 끝내지 않는다');
  assert.equal(choose(life, 7), null);
  assert.ok(choose(life, 2)); assert.equal(life.pending, null);
  // 다 열려 있으면 자동 결정은 예전 수 그대로 (sub(seed, age, 'auto', id).int(선택지 수))
  const free = { ...card, id: 'free', choices: [C(), C(), C()] };
  for (let i = 0; i < 30; i++) {
    const l = createLife({ birth: { ...SERF, seed: 'AC-' + i } });
    assert.deepEqual(openChoices(l, free), [true, true, true]);
    assert.ok([0, 1, 2].includes(autoChoice(l, free)));
  }
  // 다 잠긴 사건 카드도 막히지 않는다 (모두 열린 것으로)
  const shut = { id: 'shut', event: 'x', stage: 'adult', title: T, text: T, choices: [C({ minKnow: 99 }), C({ minKnow: 99 })] };
  assert.deepEqual(openChoices(life, shut), [true, true]);
  // eligible: 열린 선택지가 하나도 없는 카드는 나오지 않는다. choiceOpen 은 카드 when 과 같은 조건
  const ctx = { stage: 'adult', age: 30, year: 1347, era: 8, group: 'medieval', region: 'europe', area: 'britain', coast: true, tags: ['serve'], sex: 'f', flags: {}, traces: [], dream: null,
    stats: { health: 50, wealth: 50, family: 50, happy: 50 }, seen: [], attrs: { luck: 50, charm: 50, know: 40, skill: 50 }, status: { id: 'serve', rank: 1, ko: '농노', en: 'serf', bound: true }, zone: 'europe', setting: 'estate', war: 1 };
  assert.ok(!eligible({ id: 'z', stage: 'adult', text: T, choices: [C({ bound: false }), C({ minKnow: 41 })] }, ctx));
  assert.ok(eligible({ id: 'z', stage: 'adult', text: T, choices: [C({ bound: false }), C({ minKnow: 40 })] }, ctx));
  assert.ok(choiceOpen(C({ zones: ['europe'], war: 1 }), ctx) && !choiceOpen(C({ zones: ['africa'] }), ctx) && choiceOpen(C(), ctx));
  assert.ok(eligible({ id: 'line', stage: 'adult', text: T }, ctx));   // 작은 일 줄 (선택지 없음)
});
