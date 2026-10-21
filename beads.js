// 구슬 실 계산 (화면 다시 기획 4.1·4.2): 한 해 = 구슬 한 알, 한 생 = 실 한 가닥. DOM·three 없음
import { sub } from './rng.js';
import { survivalCurve } from './lifetable.js';

// 마음 0(흐린 남청) → 4(금)
export const MOOD_COLORS = ['#5b6d8c', '#7f8fa6', '#c9b48a', '#e7b45a', '#f2c14e'];
export const moodOf = (happy) => (Number.isFinite(happy) ? Math.max(0, Math.min(4, Math.floor(happy / 20))) : 2);

// 산 해마다 { age, mood, star(갈림길), crack(사건 시작) }. 0살부터 마지막 나이까지
export function beadsOf(life) {
  const end = life.death ? life.death.age : life.age;
  const stars = new Set(life.log.map((l) => l.age));
  const cracks = new Set(life.journal.filter((j) => j.kind === 'event').map((j) => j.age));
  const out = [];
  for (let a = 0; a <= end; a++) {
    const h = life.history[Math.min(a, life.history.length - 1)];
    out.push({ age: a, mood: moodOf(h ? h.happy : 50), star: stars.has(a), crack: cracks.has(a) });
  }
  return out;
}

// 상태 0~100 → 구슬 다섯 칸 채움 (반 칸 단위)
export const pips = (v) => {
  const n = Math.round((Number.isFinite(v) ? Math.max(0, Math.min(100, v)) : 0) / 10) / 2;
  return [0, 1, 2, 3, 4].map((i) => Math.max(0, Math.min(1, n - i)));
};

// 저장용 한 해 한 글자: 마음 0~4 → '0'~'4', 별이면 'a'~'e', 금이면 'A'~'E' (둘 다면 별)
const CH = '01234', ST = 'abcde', CR = 'ABCDE';
export const BEADS_RE = /^[0-4a-eA-E]*$/;
export const encodeBeads = (beads) => beads.map((b) => (b.star ? ST : b.crack ? CR : CH)[b.mood]).join('');
export function decodeBeads(s) {
  return [...String(s || '')].map((c, age) => {
    for (const [set, star, crack] of [[CH, false, false], [ST, true, false], [CR, false, true]]) {
      const i = set.indexOf(c);
      if (i >= 0) return { age, mood: i, star, crack };
    }
    return { age, mood: 2, star: false, crack: false };   // 모르는 글자는 보통 마음
  });
}

// 백 가닥: 그해 그 땅에서 태어난 백 명을 고르게 나눈 죽는 나이. 그리는 순서는 시드로 섞는다
export function hundredThreads(shape, seed, age) {
  const S = survivalCurve(shape, 111);
  const base = Array.from({ length: 100 }, (_, i) => {
    const q = 1 - (i + 0.5) / 100;
    let a = 0;
    while (a < 110 && S[a + 1] > q) a++;
    return a;
  });
  const outlived = base.filter((L) => L < age).length;
  const r = sub(seed, 'hundred');
  const lengths = base.slice();
  for (let i = lengths.length - 1; i > 0; i--) { const j = r.int(i + 1); [lengths[i], lengths[j]] = [lengths[j], lengths[i]]; }
  let mine = 0;
  for (let i = 1; i < 100; i++) if (Math.abs(lengths[i] - age) < Math.abs(lengths[mine] - age)) mine = i;
  lengths[mine] = age;
  return { lengths, mine, outlived, reach: 100 - outlived };
}
