// 영혼과 여정 (설계 6장)
import test from 'node:test';
import assert from 'node:assert/strict';
import { newSoul, finishLife, addDex, makeStore, NOW, validSoul } from '../soul.js';
import { createLife, advance } from '../life.js';

function live(birth, traces) {
  const life = createLife({ birth, traces });
  while (advance(life, []).type !== 'death');
  return life;
}
function journey(id) {
  const soul = newSoul(id);
  while (!soul.ended) finishLife(soul, live(soul.next, soul.traces));
  return soul;
}

test('새 영혼은 첫 탄생을 갖고 있다', () => {
  const s = newSoul('TEST-SOUL');
  assert.equal(s.next.seed, 'TEST-SOUL-1');
  assert.equal(s.lives.length, 0);
  assert.equal(s.ended, false);
});

test('다음 생은 앞 생이 죽은 뒤에 태어나고, 2000년 이후면 여정이 끝난다', () => {
  for (let i = 0; i < 50; i++) {
    const s = journey('J-' + i);
    for (let k = 1; k < s.lives.length; k++) assert.ok(s.lives[k].birth.year > s.lives[k - 1].death.year);
    const last = s.lives[s.lives.length - 1];
    assert.ok(last.death.year >= NOW || s.next === null || s.next.year >= NOW);
    assert.ok(s.lives.slice(0, -1).every((l) => l.death.year < NOW));
  }
});

test('여정 길이: 400 영혼 평균 2~4생 (설계 6장: 약 3생)', () => {
  let tot = 0;
  for (let i = 0; i < 400; i++) tot += journey('L-' + i).lives.length;
  assert.ok(tot / 400 >= 2 && tot / 400 <= 4, String(tot / 400));
});

test('죽을 때 흔적이 다음 생으로 넘어간다', () => {
  const s = newSoul('T-TRACE');
  const life = live(s.next, []);
  life.death.cause = 'drown';
  finishLife(s, life);
  assert.deepEqual(s.traces[0], { kind: 'fear', key: 'sea' });
  assert.deepEqual(s.lives[0].gained, s.traces);
});

test('도감은 시대|지역 칸을 센다', () => {
  const d = addDex(addDex({}, { birth: { year: 1347, region: 'europe' } }), { birth: { year: 1400, region: 'europe' } });
  assert.deepEqual(d, { '8|europe': 2 });
});

test('저장: localStorage 가 없거나 막혀도 죽지 않는다', () => {
  const bad = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  const st = makeStore(bad);
  assert.equal(st.loadSoul(), null);
  assert.equal(st.saveSoul({}), false);
  assert.deepEqual(makeStore(undefined).loadDex(), {});
  const mem = new Map();
  const ok = makeStore({ getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) });
  const soul = journey('STORE-A');
  ok.saveSoul(soul);
  assert.deepEqual(ok.loadSoul(), JSON.parse(JSON.stringify(soul)));
  ok.saveSound(false);
  assert.equal(ok.loadSound(), false);
  mem.set('pl.dex.v1', 'null');
  assert.deepEqual(ok.loadDex(), {});
});

test('깨졌거나 모양이 다른 저장값은 경고만 남기고 버린다 (도감은 맞는 칸만 남긴다)', () => {
  const mem = new Map();
  const st = makeStore({ getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) });
  const warn = console.warn;
  let warned = 0;
  console.warn = () => { warned++; };
  try {
    const good = JSON.parse(JSON.stringify(journey('STORE-B')));
    const fresh = JSON.parse(JSON.stringify(newSoul('STORE-C')));
    const bad = [
      '{bad', 'undefined', '[1,2]', '"soul"', '42', 'true',                       // 깨진 JSON · 객체 아님
      JSON.stringify({ id: 'X' }),                                                // 옛 모양 (필드 없음)
      JSON.stringify({ ...fresh, lives: 'x' }), JSON.stringify({ ...fresh, id: 5 }), JSON.stringify({ ...fresh, ended: 'no' }),
      JSON.stringify({ ...fresh, traces: [{ kind: 'fear', key: 'ghosts' }] }),
      JSON.stringify({ ...fresh, next: { ...fresh.next, area: 'atlantis' } }),   // 이름을 바꾼 땅
      JSON.stringify({ ...fresh, next: null }),                                   // 다음 탄생 없이 안 끝남
      JSON.stringify({ ...good, lives: [{ ...good.lives[0], death: { ...good.lives[0].death, cause: 'meteor' } }] }),
      JSON.stringify({ ...good, lives: [{ ...good.lives[0], birth: { ...good.lives[0].birth, household: 'castle' } }] }),
    ];
    for (const v of bad) {
      mem.set('pl.soul.v1', v);
      warned = 0;
      assert.equal(st.loadSoul(), null, v.slice(0, 60));
      assert.equal(warned, 1, v.slice(0, 60));
    }
    mem.set('pl.soul.v1', JSON.stringify(good));
    assert.deepEqual(st.loadSoul(), good);
    mem.set('pl.soul.v1', JSON.stringify(fresh));
    assert.deepEqual(st.loadSoul(), fresh);
    // 도감: 맞는 칸만, 객체가 아니면 빈 도감
    mem.set('pl.dex.v1', JSON.stringify({ '8|europe': 2, '13|europe': 1, '3|mars': 1, '4|east': -1, '5|south': 'x', toString: 3, '12|africa': 1 }));
    warned = 0;
    assert.deepEqual(st.loadDex(), { '8|europe': 2, '12|africa': 1 });
    assert.equal(warned, 1);
    for (const v of ['{bad', '[1]', '7']) { mem.set('pl.dex.v1', v); assert.deepEqual(st.loadDex(), {}); }
    mem.set('pl.dex.v1', JSON.stringify({ '8|europe': 2 }));
    warned = 0;
    assert.deepEqual(st.loadDex(), { '8|europe': 2 });
    assert.equal(warned, 0);
  } finally {
    console.warn = warn;
  }
});

test('localStorage 를 꺼내기만 해도 오류가 나는 곳에서도 죽지 않는다', () => {
  const d = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
  try {
    const st = makeStore();
    assert.equal(st.loadSoul(), null);
    assert.equal(st.saveDex({}), false);
  } finally {
    if (d) Object.defineProperty(globalThis, 'localStorage', d); else delete globalThis.localStorage;
  }
});

test('지금(2026)까지 살아 멈춘 생은 여정을 끝내고, 저장 검사도 통과한다', () => {
  const s = newSoul('NOW-SOUL');
  const life = createLife({ birth: { ...s.next, year: 1990, era: 12, group: 'modern', household: 'office', tags: ['office'] }, noDeath: true });
  while (advance(life, []).type !== 'death');
  assert.equal(life.death.present, true);
  finishLife(s, life);
  assert.equal(s.ended, true);
  assert.equal(s.next, null);
  assert.ok(validSoul(JSON.parse(JSON.stringify(s))));
  // 사인이 없는데 present 가 아니면 깨진 저장이다
  const broken = JSON.parse(JSON.stringify(s));
  delete broken.lives[0].death.present;
  assert.equal(validSoul(broken), false);
});

test('validSoul: 생의 구슬 문자열은 정해진 글자만', () => {
  const s = newSoul('B-1');
  const life = createLife({ birth: s.next, traces: [] });
  while (advance(life, []).type !== 'death');
  finishLife(s, life, { beads: '01234abcdeABCDE' });
  assert.ok(validSoul(JSON.parse(JSON.stringify(s))));
  s.lives[0].beads = '01x';
  assert.ok(!validSoul(JSON.parse(JSON.stringify(s))));
  s.lives[0].beads = '1'.repeat(122);
  assert.ok(!validSoul(JSON.parse(JSON.stringify(s))));
  delete s.lives[0].beads;
  assert.ok(validSoul(JSON.parse(JSON.stringify(s))));
});
