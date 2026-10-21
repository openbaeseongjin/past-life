// 시드 난수. 같은 (시드, 용도) = 같은 수열. 문자열 시드는 FNV-1a 해시 → mulberry32
export function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return h >>> 0;
}

export function createRng(seed) {
  let s = (typeof seed === 'string' ? hash(seed) : seed >>> 0) || 1;
  const next = () => {   // mulberry32
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (a, b) => a + (b - a) * next(),
    int: (n) => Math.floor(next() * n),
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
    // 가중치대로 하나 (가중치 합이 0이면 null)
    weighted(items, w = (x) => x.weight ?? 1) {
      let tot = 0;
      for (const it of items) tot += w(it);
      if (!(tot > 0)) return null;
      let r = next() * tot;
      for (const it of items) { r -= w(it); if (r < 0) return it; }
      return items[items.length - 1];
    },
  };
}

// (시드, 용도…)마다 따로 만든 난수: 앞에서 무엇을 뽑았든 같은 값이 나온다
export const sub = (seed, ...keys) => createRng(`${seed}|${keys.join('|')}`);

const ID_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newId(rand = Math.random) {
  let s = '';
  for (let i = 0; i < 8; i++) s += ID_CHARS[Math.floor(rand() * ID_CHARS.length)];
  return s.slice(0, 4) + '-' + s.slice(4);
}
