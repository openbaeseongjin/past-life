// 지금까지 태어난 사람 (PRB 2022 표 1). 기준 해 사이는 인구를 따라 지수로 바뀌는 밀도로 출생 수를 나눈다 (설계 3장)
export const PRB = [   // [해, 인구, 앞 기준 해부터 출생 수]
  [-190000, 2, 0], [-50000, 2e6, 7856100000], [-8000, 5e6, 1137789769], [1, 300e6, 46025332354],
  [1200, 450e6, 26591343000], [1650, 500e6, 12782002453], [1750, 795e6, 3171931513], [1850, 1265e6, 4046240009],
  [1900, 1656e6, 2900237856], [1950, 2499e6, 3390198215], [2000, 6149e6, 6064994884], [2010, 6986e6, 1364003405],
  [2022, 7963.5e6, 1690275115],
];
export const START = PRB[0][0];
export const END = PRB[PRB.length - 1][0];
const SEG = [];
let acc = 0;
for (let i = 1; i < PRB.length; i++) {
  const [t0, p0] = PRB[i - 1], [t1, p1, n] = PRB[i];
  SEG.push({ t0, t1, n, k: Math.log(p1 / p0) / (t1 - t0), c0: acc });
  acc += n;
}
export const TOTAL = acc;

// 해 t 전에 태어난 사람 수
export function cumBirths(t) {
  if (t <= START) return 0;
  if (t >= END) return TOTAL;
  const s = SEG.find((g) => t < g.t1);
  return s.c0 + s.n * Math.expm1(s.k * (t - s.t0)) / Math.expm1(s.k * (s.t1 - s.t0));
}

// 누적 출생 수 c → 해 (cumBirths 의 역함수)
export function yearAt(c) {
  if (c <= 0) return START;
  if (c >= TOTAL) return END;
  const s = SEG.find((g) => c < g.c0 + g.n);
  return s.t0 + Math.log1p((c - s.c0) / s.n * Math.expm1(s.k * (s.t1 - s.t0))) / s.k;
}

// 해 after 다음 해부터 태어난 사람 가운데 한 명이 태어난 해 (정수). 남은 사람이 없으면 null
export function drawYear(rng, after = -Infinity) {
  const c0 = cumBirths(after + 1);
  if (c0 >= TOTAL - 1) return null;
  return Math.floor(yearAt(c0 + rng.next() * (TOTAL - c0)));
}

// 시대 12개 (도감·생명표·마을)
export const ERAS = [
  { id: 1, from: -Infinity, to: -8000, ko: '구석기', en: 'Old Stone Age' },
  { id: 2, from: -8000, to: -3000, ko: '신석기', en: 'New Stone Age' },
  { id: 3, from: -3000, to: -1000, ko: '청동기', en: 'Bronze Age' },
  { id: 4, from: -1000, to: 1, ko: '철기 시대', en: 'Iron Age' },
  { id: 5, from: 1, to: 600, ko: '고대 제국', en: 'Age of empires' },
  { id: 6, from: 600, to: 1000, ko: '중세 전기', en: 'Early Middle Ages' },
  { id: 7, from: 1000, to: 1300, ko: '중세 성기', en: 'High Middle Ages' },
  { id: 8, from: 1300, to: 1500, ko: '중세 후기', en: 'Late Middle Ages' },
  { id: 9, from: 1500, to: 1750, ko: '근세', en: 'Early modern' },
  { id: 10, from: 1750, to: 1850, ko: '산업혁명기', en: 'Industrial Revolution' },
  { id: 11, from: 1850, to: 1950, ko: '근대', en: 'Modern age' },
  { id: 12, from: 1950, to: Infinity, ko: '현대', en: 'Today' },
];
export const eraOf = (year) => ERAS.find((e) => year < e.to);

// 카드·집안·마을이 쓰는 큰 묶음 6개
export function groupOf(year) {
  if (year < -8000) return 'forager';
  if (year < 600) return 'ancient';
  if (year < 1500) return 'medieval';
  if (year < 1800) return 'early';
  if (year < 1950) return 'industrial';
  return 'modern';
}
