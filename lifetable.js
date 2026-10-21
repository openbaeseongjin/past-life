// 생명표: Siler 위험률 h(a)=a1·e^(−b1·a)+a2+a3·e^(b3·a) (설계 4장)
// 근대 이전(PRE)·현대(MOD) 두 기준 모양의 로그를 t로 보간하고, 목표 e0 에 맞는 t 를 이분법으로 찾는다
import { REGIONS } from './places.js';

export const PRE = { a1: 0.48478, b1: 1.0, a2: 0.007645, a3: 0.000603, b3: 0.075 };    // 첫돌 전 27% · 15세 전 46% · e0 28.5
export const MOD = { a1: 0.0120934, b1: 3.0, a2: 0.0001594, a3: 0.0000173, b3: 0.10 };  // 첫돌 전 0.4% · 15세 전 0.7% · e0 80
const KEYS = ['a1', 'b1', 'a2', 'a3', 'b3'];
// 목표 출생 시 기대수명: 시대(1~12) × 지역(REGIONS 순서). 근거는 설계 4장 표
const PREMODERN = [28.5, 28.5, 28.5, 28.5, 28.5, 28.5, 28.5];
export const E0 = {
  1: PREMODERN, 2: PREMODERN, 3: PREMODERN, 4: PREMODERN, 5: PREMODERN, 6: PREMODERN, 7: PREMODERN, 8: PREMODERN, 9: PREMODERN,
  10: [27.5, 27.5, 27.5, 34.3, 26.4, 34.8, 27.5],
  11: [28.0, 28.0, 28.0, 42.7, 26.4, 41.0, 28.0],
  12: [68.3, 58.2, 62.2, 72.4, 51.5, 70.2, 62.5],
};

export function shape(t) {
  const p = {};
  for (const k of KEYS) p[k] = Math.exp(Math.log(PRE[k]) * (1 - t) + Math.log(MOD[k]) * t);
  return p;
}

// 나이 a 에서 a+1 까지 적분한 위험 (해석적)
export function yearHazard(p, a) {
  return p.a1 / p.b1 * (Math.exp(-p.b1 * a) - Math.exp(-p.b1 * (a + 1))) + p.a2 + p.a3 / p.b3 * (Math.exp(p.b3 * (a + 1)) - Math.exp(p.b3 * a));
}

export function lifeStats(p) {
  let S = 1, e0 = 0, q1 = 0, S15 = 0;
  for (let a = 0; a < 120; a++) {
    const q = a === 119 ? 1 : 1 - Math.exp(-yearHazard(p, a));
    e0 += S * (1 - q / 2);
    S *= 1 - q;
    if (a === 0) q1 = 1 - S;
    if (a === 14) S15 = S;
  }
  return { e0, q1, q15: 1 - S15 };
}

// 목표 e0 에 맞는 모양 (e0 는 t 에 따라 커진다)
function fitShape(e0) {
  let lo = -0.3, hi = 1.2;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (lifeStats(shape(m)).e0 < e0) lo = m; else hi = m; }
  return shape((lo + hi) / 2);
}
const CACHE = new Map();
export function shapeFor(era, region) {
  const key = era + '|' + region;
  if (!CACHE.has(key)) CACHE.set(key, fitShape(E0[era][REGIONS.indexOf(region)]));
  return CACHE.get(key);
}

// 건강 배율: 건강 50 이면 1 (설계 12장: 해마다 초점이 쌓여도 지나치지 않게 0.6~2.0)
export const healthMul = (health) => Math.min(2.0, Math.max(0.6, Math.exp((50 - health) / 70)));

// 나이 age 까지 살아남을 확률, 0~max 살 곡선
export function survivalTo(p, age) {
  let S = 1;
  for (let a = 0; a < age; a++) S *= a >= 119 ? 0 : Math.exp(-yearHazard(p, a));
  return S;
}
export const survivalCurve = (p, max = 100) => Array.from({ length: max + 1 }, (_, a) => survivalTo(p, a));

// 나이 age 를 넘기지 못할 확률 (그해 달력 연도의 시대·지역, 건강, 사건 위험률)
export function deathChance({ age, era, region, health = 50, extra = 0 }) {
  if (age >= 119) return 1;
  return 1 - Math.exp(-(yearHazard(shapeFor(era, region), age) * healthMul(health) + extra));
}
