// 마을 짜기·꾸미기 (three 없이 도는 순수 모듈) — 1329년 잉글랜드 마을 + 세트별 요리법 (RECIPES: england · southasia).
// realscene.js 가 장면을 그릴 때, test/villageplan.test.mjs 가 Node 에서 규칙을 시험할 때 같은 코드를 쓴다.
//   makeEnv()                       → 강·길 거리 색인 + 밭 조각보 (지형·땅 그림·꾸미기가 함께 본다)
//   planVillage(seed, env)          → 집 자리 (길 따라 늘어선 집 + 집마다 뒤뜰), 외딴 농가, 장터 좌판·천막 자리
//   planDressing(rng, kit, props, layout) → 소품·가축·나무·땅 조각 자리 (realscene 의 dressVillage 가 이것을 부른다)
//   planAll(seed, env)              → { layout, dressing } (출생 시드 하나에서 둘 다)
// 모든 난수는 시드에서 나온다: 같은 시드면 같은 마을이다.
// 마을 배치 상수(강·길·교회·대장간·물레방앗간·우물·장터 빈터·풀밭·LANES·FARMS)도 여기 있다. planDressing 은 이 상수를
// 직접 읽는다 (layout 인자만으로는 재현되지 않는다: 같은 모듈의 상수와 함께 한 벌이다).
import { KIT_DIMS, KIT_POOL, KIT_DIMS_SA, KIT_POOL_SA, KIT_DIMS_EA, KIT_DIMS_EA_KR, KIT_DIMS_EA_JP, KIT_POOL_EA } from './kitdata.js';
import { FARM_FROM } from './context_data.js';

// ───────────────────────── 작은 도구 ─────────────────────────
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export function hash2(ix, iz, s = 0) { let h = (Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(s + 1, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
export function vnoise(x, z, s) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = hash2(ix, iz, s), b = hash2(ix + 1, iz, s), c = hash2(ix, iz + 1, s), d = hash2(ix + 1, iz + 1, s);
  return lerp(lerp(a, b, ux), lerp(c, d, ux), uz) * 2 - 1;
}
export function fbm(x, z, oct = 5, s = 0) { let v = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { v += a * vnoise(x * f, z * f, s + i * 7); f *= 2.03; a *= 0.5; } return v; }
export function segDist2(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
  let t = l2 ? ((px - ax) * dx + (pz - az) * dz) / l2 : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
  const ex = ax + t * dx - px, ez = az + t * dz - pz; return ex * ex + ez * ez;
}

// ── 꺾은선 → 부드러운 곡선 위 같은 간격 점 (centripetal Catmull-Rom).
// three.js CatmullRomCurve3(closed=false, 'centripetal').getSpacedPoints 와 같은 셈을 같은 순서로 한다 (호 길이 표 200칸).
function cubicCR(x0, x1, x2, x3, dt0, dt1, dt2) {
  let t1 = (x1 - x0) / dt0 - (x2 - x0) / (dt0 + dt1) + (x2 - x1) / dt1;
  let t2 = (x2 - x1) / dt1 - (x3 - x1) / (dt1 + dt2) + (x3 - x2) / dt2;
  t1 *= dt1; t2 *= dt1;
  const c0 = x1, c1 = t1, c2 = -3 * x1 + 3 * x2 - 2 * t1 - t2, c3 = 2 * x1 - 2 * x2 + t1 + t2;
  return (t) => { const tt = t * t, ttt = tt * t; return c0 + c1 * t + c2 * tt + c3 * ttt; };
}
function crPoint(P, t) {
  const l = P.length, p = (l - 1) * t;
  let i = Math.floor(p), w = p - i;
  if (w === 0 && i === l - 1) { i = l - 2; w = 1; }
  const tmp = [0, 0];   // three 는 끝 바깥 점 둘을 같은 임시 벡터에 쓴다 (점이 둘뿐일 때만 차이가 난다): 그대로 따른다
  let p0, p3;
  if (i > 0) p0 = P[i - 1]; else { tmp[0] = P[0][0] - P[1][0] + P[0][0]; tmp[1] = P[0][1] - P[1][1] + P[0][1]; p0 = tmp; }
  const p1 = P[i], p2 = P[i + 1];
  if (i + 2 < l) p3 = P[i + 2]; else { tmp[0] = P[l - 1][0] - P[l - 2][0] + P[l - 1][0]; tmp[1] = P[l - 1][1] - P[l - 2][1] + P[l - 1][1]; p3 = tmp; }
  const d2 = (a, b) => { const dx = a[0] - b[0], dz = a[1] - b[1]; return dx * dx + 0 * 0 + dz * dz; };
  let dt0 = Math.pow(d2(p0, p1), 0.25), dt1 = Math.pow(d2(p1, p2), 0.25), dt2 = Math.pow(d2(p2, p3), 0.25);
  if (dt1 < 1e-4) dt1 = 1.0;
  if (dt0 < 1e-4) dt0 = dt1;
  if (dt2 < 1e-4) dt2 = dt1;
  return [cubicCR(p0[0], p1[0], p2[0], p3[0], dt0, dt1, dt2)(w), cubicCR(p0[1], p1[1], p2[1], p3[1], dt0, dt1, dt2)(w)];
}
export function smoothLine(pts, step = 6) {
  const DIV = 200, lengths = [0];
  let last = crPoint(pts, 0), sum = 0;
  for (let k = 1; k <= DIV; k++) { const c = crPoint(pts, k / DIV); sum += Math.sqrt((c[0] - last[0]) ** 2 + 0 + (c[1] - last[1]) ** 2); lengths.push(sum); last = c; }
  const n = Math.max(2, Math.ceil(sum / step)), out = [];
  for (let d = 0; d <= n; d++) {
    const target = d / n * lengths[DIV];
    let low = 0, high = DIV, i = 0;
    while (low <= high) { i = Math.floor(low + (high - low) / 2); const cmp = lengths[i] - target; if (cmp < 0) low = i + 1; else if (cmp > 0) high = i - 1; else { high = i; break; } }
    i = high;
    const t = lengths[i] === target ? i / DIV : (i + (target - lengths[i]) / (lengths[i + 1] - lengths[i])) / DIV;
    out.push(crPoint(pts, t));
  }
  return out;
}
// 선분 공간 색인: 텍셀·정점마다 가까운 길/강까지의 거리를 빨리 찾는다
export class SegIndex {
  constructor(lines, cell = 48, margin = 64) {
    this.cell = cell; this.margin = margin; this.map = new Map(); this.segs = [];
    for (const { pts, w } of lines) for (let i = 0; i < pts.length - 1; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], k = this.segs.length;
      this.segs.push([ax, az, bx, bz, w]);
      const x0 = Math.floor((Math.min(ax, bx) - margin) / cell), x1 = Math.floor((Math.max(ax, bx) + margin) / cell);
      const z0 = Math.floor((Math.min(az, bz) - margin) / cell), z1 = Math.floor((Math.max(az, bz) + margin) / cell);
      for (let gx = x0; gx <= x1; gx++) for (let gz = z0; gz <= z1; gz++) {
        const key = gx * 100003 + gz; let a = this.map.get(key); if (!a) this.map.set(key, a = []); a.push(k);
      }
    }
  }
  // 가장 가까운 '가장자리'까지 거리 (선 중심거리 − 반폭). 멀면 margin 을 돌려준다
  edge(x, z) {
    const a = this.map.get(Math.floor(x / this.cell) * 100003 + Math.floor(z / this.cell));
    if (!a) return this.margin;
    let best = this.margin;
    for (const k of a) { const s = this.segs[k]; const d = Math.sqrt(segDist2(x, z, s[0], s[1], s[2], s[3])) - s[4] / 2; if (d < best) best = d; }
    return best;
  }
}
// 2D 돌린 상자(OBB). 세트 조각의 회전 약속(three Y 회전)과 같다: 로컬 x → (cos, −sin), 로컬 z → (sin, cos)
export function obb(x, z, rot, hx, hz) { return { x, z, c: Math.cos(rot), s: Math.sin(rot), hx, hz }; }
export function obbLocal(o, u, v) { return [o.x + u * o.c + v * o.s, o.z - u * o.s + v * o.c]; }
export function obbHas(o, x, z, pad = 0) { const dx = x - o.x, dz = z - o.z, u = dx * o.c - dz * o.s, v = dx * o.s + dz * o.c; return Math.abs(u) <= o.hx + pad && Math.abs(v) <= o.hz + pad; }
export function obbOverlap(a, b, pad = 0) {
  const axes = [[a.c, -a.s], [a.s, a.c], [b.c, -b.s], [b.s, b.c]], dx = b.x - a.x, dz = b.z - a.z;
  for (const [ax, az] of axes) {
    const ra = a.hx * Math.abs(a.c * ax - a.s * az) + a.hz * Math.abs(a.s * ax + a.c * az);
    const rb = b.hx * Math.abs(b.c * ax - b.s * az) + b.hz * Math.abs(b.s * ax + b.c * az);
    if (Math.abs(dx * ax + dz * az) > ra + rb + pad) return false;
  }
  return true;
}
export function obbRim(o, n = 4) {   // 둘레 점 (모서리 + 변 위 점)
  const pts = [];
  for (let i = 0; i <= n; i++) for (let j = 0; j <= n; j++) if (i === 0 || j === 0 || i === n || j === n) pts.push(obbLocal(o, (-1 + 2 * i / n) * o.hx, (-1 + 2 * j / n) * o.hz));
  return pts;
}
// 꺾은선 위 거리 s 의 점·방향
export function polyAt(pts, cum, s) {
  let i = 1; while (i < pts.length - 1 && cum[i] < s) i++;
  const [ax, az] = pts[i - 1], [bx, bz] = pts[i], L = cum[i] - cum[i - 1] || 1, t = Math.min(1, Math.max(0, (s - cum[i - 1]) / L));
  return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, tx: (bx - ax) / L, tz: (bz - az) / L };
}
export function polyCum(pts) { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; }
export const inRect = (r, x, z, pad = 0) => x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad;

// ───────────────────────── 마을 배치 상수 (england-1329) ─────────────────────────
export const VC = { x: 15, z: -20 };                    // 마을 중심
export const WATER_Y = -0.7;
export const RIVER_HW = 7;                              // 강 반폭 (물가 경사 포함)
export const RIVER_PTS = [[-520, -3200], [-420, -1500], [-330, -700], [-170, -260], [-100, -95], [-74, -20], [-52, 18], [-28, 48], [2, 92], [34, 190], [80, 380], [150, 700], [260, 1500], [380, 3200]];
export const RIVER = smoothLine(RIVER_PTS, 5);
export const BRIDGE = { x: -39, z: 33, dirx: 0.73, dirz: -0.68, len: 22, w: 4.4 };   // 다리 (길 방향)
export const ROADS = [
  { w: 4.2, pts: [[-260, 300], [-150, 140], [-95, 86], [-60, 51], [-39, 33], [-18, 14], [2, 2], [20, -14], [34, -48], [48, -108], [70, -200], [110, -400], [190, -800], [300, -1600], [420, -3200]] },
  { w: 3.0, pts: [[2, 2], [-22, -5], [-44, -6]] },                          // 물레방아 길
  { w: 3.0, pts: [[20, -14], [46, -26], [62, -40], [64, -50]] },             // 교회 길
  { w: 2.6, pts: [[34, -48], [8, -72], [-22, -84], [-60, -122], [-150, -230], [-300, -420]] },
  { w: 2.6, pts: [[48, -108], [120, -128], [230, -150], [420, -175], [900, -260]] },
  { w: 2.4, pts: [[-150, 140], [-230, 60], [-420, 20], [-900, -40]] },
  { w: 2.6, pts: [[-18, 14], [0, 27], [22, 33], [34, 30]] },                // 다리 어귀 → 대장간 골목 (전경 집줄)
];
// 큰 건물·빈터는 고정, 집은 LANES 를 따라 시드로 늘어선다 (planVillage).
export const CHURCH = { x: 96, z: -62, rot: 0 };        // 서쪽 끝에 탑
export const SMITHY = { x: 40, z: 22, rot: -0.45 };      // 열린 앞면이 +z(카메라 쪽)
export const MILL = { x: -53.5, z: -5, rot: 0.52 };     // 다리 위쪽 강가 (전경 왼쪽에 바퀴가 보이게)
export const WELL = { x: 10, z: -13, rot: 0.35 };       // 큰길 갈림목 공터
export const GREEN = { x: 42, z: -35, r: 10 };          // 장터 빈터: 큰길과 교회 길 사이, 교회 앞
export const CHURCHYARD = { x0: CHURCH.x - 26, x1: CHURCH.x + 26, z0: CHURCH.z - 15, z1: CHURCH.z + 16 };
export const PASTURE = { x0: 58, x1: 114, z0: 36, z1: 86 };   // 소·말 풀밭 (대장간 동남쪽, 가로대 울타리)
export const MEADOW = { x0: -4, x1: 26, z0: 36, z1: 66 };     // 다리 건너 대장간 골목 남쪽 강가 양 풀밭 (전경 오른쪽 아래)
// 집이 늘어설 길 (ROADS 의 마을 안 구간). 양쪽에 집을 대 보고, 길·강·빈터·다른 집에 걸리면 건너뛴다
export const LANES = [
  [[-24, 19], [2, 2], [20, -14]],
  [[20, -14], [34, -48], [48, -108]],
  [[2, 2], [-22, -5], [-42, -6]],
  [[20, -14], [46, -26], [62, -40]],
  [[34, -48], [8, -72], [-22, -84], [-62, -124]],
  [[48, -108], [120, -128], [176, -140]],
  [[-18, 14], [0, 27], [22, 33], [34, 30]],
];
// 마을 밖 외딴 농가 (자리 고정, 조각은 시드). rot 은 용마루 방향 (+90° 해서 놓는다)
export const FARMS = [
  { x: 102, z: -8, rot: 1.55, kind: 'barn' },
  { x: 160, z: -260, rot: 0.3, kind: 'timber' },
  { x: -210, z: -300, rot: 0.8, kind: 'stone' },
  { x: 250, z: -70, rot: 1.2, kind: 'plaster' },
  { x: -180, z: 90, rot: -0.4, kind: 'timber' },
];
// 전경(다리 남서쪽 물가와 비탈): 덤불·갈대·돌담·꽃으로 채운다 (overview 카메라가 내려다보는 앞쪽)
export const FOREGROUND = { x: -36, z: 76, r: 24 };
// 전경 시야 통로: overview 카메라와 마을 사이. 키 큰 나무는 두지 않는다 (덤불·풀·꽃·울타리는 괜찮다)
export const VIEW_CLEAR = { x0: -46, x1: 40, z0: 34, z1: 130 };
// 마당 소품으로 세는 조각 (집마다 2~5개): 장작·통·텃밭·걸상·자루·상자·연장 걸이·건초더미
export const YARD_PIECES = ['woodpile', 'barrel', 'vegetable_bed', 'bench', 'sacks', 'crate', 'tool_rack', 'haystack'];

// ───────────────────────── 요리법: 세트마다 같은 땅(강·길·밭) 위에 짓는 규칙 ─────────────────────────
// 땅(makeEnv: 강·길·밭 조각보·지형)은 세트와 상관없이 같다. 세트마다 다른 것: 집 주머니·집 간격, 정한 자리 큰 조각(fixed), 비워 둘 땅(reserved), 꾸미기.
//   england  : 1329년 잉글랜드 마을 (위 상수 그대로, 난수 차례도 그대로)
//   southasia: 남아시아 마을 — 큰 반얀 신당(마을 한가운데 갈림목)·사원·강가 가트 둘레로 흙집이 촘촘히 모이고, 골목은 좁다(집이 길에 바짝).
//              장터(바자르)는 같은 빈터, 대장간은 같은 자리(smithy_sa), 교회 언덕에는 지주의 안뜰집과 곳간. 논·두렁은 땅 모습(monsoon)이 그린다.
const fxE = Math.sin(SMITHY.rot), fzE = Math.cos(SMITHY.rot);
// 대장간 앞마당(트인 앞 = 로컬 +z 쪽 24 m)은 비운다: 화덕 불빛이 보이는 시야
const forgeYard = (x, z, pad) => { const dx = x - SMITHY.x, dz = z - SMITHY.z, a = dx * fxE + dz * fzE, c = Math.abs(dx * fzE - dz * fxE); return a > -2 - pad && a < 24 + pad && c < 9 + pad; };

// 남아시아 정한 자리 (x, z: 세계 m, rot: 조각 앞 +z 가 보는 쪽)
export const SA_SITES = {
  TEMPLE: { x: -36, z: -24, rot: Math.PI / 2 },             // 사원: 마을 서쪽, 앞(계단)이 동쪽 마을을 본다
  TEMPLE_YARD: { x0: -47, x1: -27, z0: -33, z1: -14 },       // 사원 마당 (집을 들이지 않는다)
  GHAT: { x: -56.3, z: -3.9, rot: -1.2 },                     // 가트: 물레방앗간 자리 강가, 계단이 강을 본다 (밑 계단이 물높이)
  SHRINE: { x: 6.5, z: -15.5, rot: 0.35 },                    // 큰 반얀 신당: 마을 한가운데 갈림목
  WELL: { x: -10, z: -18, rot: 0.3 },                         // 흙 우물: 신당과 사원 사이
  BIGHOUSE: { x: 92, z: -60, rot: -1.1 },                     // 지주의 안뜰집 (교회 언덕)
  GRANARY: { x: 80, z: -50, rot: -0.9 },
};
const S_ = SA_SITES;
const saFixed = [
  { role: 'church', piece: 'temple_small', ...S_.TEMPLE },
  { role: 'smithy', piece: 'smithy_sa', x: SMITHY.x, z: SMITHY.z, rot: SMITHY.rot },
  { role: 'mill', piece: 'well_step', ...S_.GHAT, base: 'water' },
  { role: 'well', piece: 'well_kuan', ...S_.WELL },
  { role: 'shrine', piece: 'shrine_tree', ...S_.SHRINE },
  { role: 'bighouse', piece: 'house_courtyard', ...S_.BIGHOUSE },
  { role: 'store', piece: 'granary', ...S_.GRANARY },
].map(({ x, z, rot, ...o }) => ({ x, z, rot, ...o }));

// 동아시아 정한 자리 (작업 2-2): 절(법당·탑·산문)은 교회 언덕 비탈 위에 남향, 마을 나무 신당은 마을 한가운데 갈림목 옆,
//   기와 큰 집(담·대문)과 곳간은 대장간 동쪽 빈 비탈, 우물은 잉글랜드 우물 자리, 개울 디딤돌은 물레방앗간 자리 (꾸미기가 놓는다)
export const EA_SITES = {
  TEMPLE: { x: 96, z: -64, rot: 0 },
  PAGODA: { x: 96, z: -46.5, rot: 0 },
  TGATE: { x: 96, z: -37.5, rot: 0 },
  TEMPLE_YARD: { x0: 84, x1: 108, z0: -73, z1: -37.5 },
  SHRINE: { x: 6, z: 14, rot: 0.3 },
  WELL: { x: 10, z: -13, rot: 0.35 },
  BIGHOUSE: { x: 70, z: 6, rot: 0 },
  BIGGATE: { x: 70, z: 13.9, rot: 0 },
  BIGYARD: { x0: 61.5, x1: 78.5, z0: -0.6, z1: 13.9 },
  GRANARY: { x: 83, z: 2, rot: 0.2 },
  STONES: { x: -56.2, z: 11.8 },
};
const E_ = EA_SITES;
const eaFixed = [
  { role: 'church', piece: 'temple_ea', ...E_.TEMPLE },
  { role: 'pagoda', piece: 'pagoda_small', ...E_.PAGODA },
  { role: 'tgate', piece: 'gate_ea', ...E_.TGATE },
  { role: 'smithy', piece: 'smithy_ea', x: SMITHY.x, z: SMITHY.z, rot: SMITHY.rot },
  { role: 'well', piece: 'well_ea', ...E_.WELL },
  { role: 'shrine', piece: 'shrine_ea', ...E_.SHRINE },
  { role: 'bighouse', piece: 'house_tile_ea', ...E_.BIGHOUSE },
  { role: 'biggate', piece: 'gate_ea', ...E_.BIGGATE },
  { role: 'store', piece: 'granary_ea', ...E_.GRANARY },
].map(({ x, z, rot, ...o }) => ({ x, z, rot, ...o }));

export const RECIPES = {
  england: {
    kit: 'england', dims: KIT_DIMS, pool: KIT_POOL,
    kindOf: (r) => (r < 0.45 ? 'timber' : r < 0.74 ? 'plaster' : 'stone'), farmKind: (k) => k,
    noGable: ['longhouse'], gableP: 0.14, gap: [2.6, 4.2], setback: [1.4, 2.6], croftK: 1,
    reserved: (x, z, pad) => Math.hypot(x - GREEN.x, z - GREEN.z) < GREEN.r + 3 + pad || inRect(CHURCHYARD, x, z, 3 + pad) || inRect(PASTURE, x, z, pad) || inRect(MEADOW, x, z, pad) || forgeYard(x, z, pad)
      || Math.hypot(x - SMITHY.x, z - SMITHY.z) < 12 + pad || Math.hypot(x - MILL.x, z - MILL.z) < 13 + pad || Math.hypot(x - WELL.x, z - WELL.z) < 5 + pad
      || Math.hypot(x - BRIDGE.x, z - BRIDGE.z) < 15 + pad,
    fixed: [
      { role: 'church', piece: 'church', x: CHURCH.x, z: CHURCH.z, rot: CHURCH.rot }, { role: 'smithy', piece: 'smithy', x: SMITHY.x, z: SMITHY.z, rot: SMITHY.rot },
      { role: 'mill', piece: 'mill', x: MILL.x, z: MILL.z, rot: MILL.rot + Math.PI / 2 }, { role: 'well', piece: 'well', x: WELL.x, z: WELL.z, rot: WELL.rot },
    ],
    stall: 'market_stall', awning: null,
    sites: { church: CHURCH, well: WELL, temple: CHURCH },
    // 내 사람 활동 자리 (realscene.js planSpots): 텃밭·걸상 소품, 장터 좌판 앞에 서기, 큰 소품 가림, 교회/사원 앞 자리, 빈터 배경, 내 살빛 범위
    activity: { bed: 'vegetable_bed', seat: 'bench', seatH: 0.45, marketFront: false, tallBlock: 0, templeFront: null, greenBg: 'church', meSkin: [0.92, 0.12] },
    hedge: null, dress: null, graveyard: true,
  },
  southasia: {
    kit: 'southasia', dims: KIT_DIMS_SA, pool: KIT_POOL_SA,
    kindOf: (r) => (r < 0.05 ? 'courtyard' : r < 0.15 ? 'town' : 'mud'), farmKind: (k) => (k === 'barn' ? 'store' : 'mud'),
    noGable: ['hut_mud_b', 'house_courtyard', 'granary', 'house_town'], gableP: 0.12, gap: [1.0, 2.2], setback: [0.4, 1.3], croftK: 0.72,
    reserved: (x, z, pad) => Math.hypot(x - GREEN.x, z - GREEN.z) < GREEN.r + 3 + pad || inRect(S_.TEMPLE_YARD, x, z, 1 + pad) || inRect(PASTURE, x, z, pad) || inRect(MEADOW, x, z, pad)
      || forgeYard(x, z, pad) || Math.hypot(x - SMITHY.x, z - SMITHY.z) < 12 + pad || Math.hypot(x - S_.GHAT.x, z - S_.GHAT.z) < 12 + pad
      || Math.hypot(x - S_.SHRINE.x, z - S_.SHRINE.z) < 10 + pad || Math.hypot(x - S_.WELL.x, z - S_.WELL.z) < 5.5 + pad || Math.hypot(x - BRIDGE.x, z - BRIDGE.z) < 15 + pad
      || Math.hypot(x - S_.BIGHOUSE.x, z - S_.BIGHOUSE.z) < 13 + pad || Math.hypot(x - S_.GRANARY.x, z - S_.GRANARY.z) < 5 + pad,
    fixed: saFixed,
    fixedFoot: saFixed.map((f) => { const [L, D] = KIT_DIMS_SA[f.piece]; return obb(f.x, f.z, f.rot, L / 2, D / 2); }),
    stall: 'market_stall_sa', awning: 'market_stall_sa',
    sites: { church: S_.TEMPLE, well: S_.WELL, temple: S_.TEMPLE, shrine: S_.SHRINE, ghat: S_.GHAT },
    // 아궁이·끈 침상, 좌판은 앞 처마가 낮아 평상 앞에 선다, 0.85 m 넘는 뒤뜰 소품은 카메라 가림, 사원 계단 앞(로컬 2.2, 8.2), 빈터 배경은 반얀 신당
    activity: { bed: 'chulha', seat: 'charpai', seatH: 0.46, marketFront: true, tallBlock: 0.85, templeFront: [2.2, 8.2], greenBg: 'shrine', meSkin: [0.86, 0.2] },
    // 밭 가장자리: 산울타리 띠 없이 두렁 나무만 (가장자리의 40%), 종은 야자·망고·바불·님
    hedge: { keep: 0.4, strips: false, pick: (r) => (r < 0.42 ? 'coconut' : r < 0.58 ? 'areca' : r < 0.8 ? 'mango' : r < 0.92 ? 'babul' : 'neem') },
    dress: planDressingSA, graveyard: false,
  },
  // 동아시아: 개울을 따라 늘어선 마을 — 비탈 위 절(법당·탑), 한가운데 마을 나무 신당, 담 두른 기와 큰 집, 집마다 뒤뜰(텃밭·장독·볏가리·감나무),
  //   나무다리 + 개울 디딤돌, 땅 그림의 논은 비탈에서 등고선 두렁(계단 논)으로 (terrace). 땅(중국·한국·일본)마다 건물 glb·담·독·사람 옷이 다르다 (recipeFor)
  eastasia: {
    kit: 'eastasia', dims: KIT_DIMS_EA, pool: KIT_POOL_EA, flavorDims: { china: KIT_DIMS_EA, korea: KIT_DIMS_EA_KR, japan: KIT_DIMS_EA_JP },
    kindOf: (r) => (r < 0.25 ? 'tile' : r < 0.37 ? 'town' : 'thatch'), farmKind: (k) => (k === 'barn' ? 'store' : 'thatch'),
    noGable: ['pit_house_ea', 'granary_ea', 'house_town_ea', 'house_tile_ea'], gableP: 0.12, gap: [2.0, 3.4], setback: [0.9, 1.9], croftK: 0.85,
    reserved: (x, z, pad) => Math.hypot(x - GREEN.x, z - GREEN.z) < GREEN.r + 3 + pad || inRect(E_.TEMPLE_YARD, x, z, 2 + pad) || inRect(PASTURE, x, z, pad)
      || inRect(MEADOW, x, z, pad) || forgeYard(x, z, pad) || Math.hypot(x - SMITHY.x, z - SMITHY.z) < 12 + pad || Math.hypot(x - E_.SHRINE.x, z - E_.SHRINE.z) < 8 + pad
      || Math.hypot(x - E_.WELL.x, z - E_.WELL.z) < 5 + pad || Math.hypot(x - BRIDGE.x, z - BRIDGE.z) < 15 + pad || inRect(E_.BIGYARD, x, z, 1.5 + pad)
      || Math.hypot(x - E_.GRANARY.x, z - E_.GRANARY.z) < 4 + pad || Math.hypot(x - E_.STONES.x, z - E_.STONES.z) < 9 + pad,
    fixed: eaFixed,
    fixedFoot: eaFixed.map((f) => { const [L, D] = KIT_DIMS_EA[f.piece]; return obb(f.x, f.z, f.rot, L / 2, D / 2); }),
    stall: 'stall_ea', awning: 'stall_ea',
    sites: { church: E_.TEMPLE, well: E_.WELL, temple: E_.TEMPLE, shrine: E_.SHRINE },
    // 텃밭 앞 쪼그려 앉기, 평상에 앉기 (높이 0.42), 좌판 뒤 장수 자리, 볏가리·장독대(0.95 m 넘는 소품)는 카메라 가림, 법당 계단 앞, 빈터 배경은 마을 나무
    activity: { bed: 'veg_bed_ea', seat: 'bench_ea', seatH: 0.42, marketFront: false, tallBlock: 0.95, templeFront: [1.6, 9.2], greenBg: 'shrine', meSkin: [0.9, 0.12] },
    // 밭 가장자리: 산울타리 띠 없이 두렁 나무만 (가장자리의 35%), 종은 감나무·소나무·느티·버들
    hedge: { keep: 0.35, strips: false, pick: (r) => (r < 0.35 ? 'persimmon' : r < 0.62 ? 'pine' : r < 0.82 ? 'zelkova' : 'willow') },
    dress: planDressingEA, graveyard: false, bridge: 'timber', terrace: 1.3, variant: 'china',
  },
};
export const recipeOf = (kit) => RECIPES[kit] || RECIPES.england;

// ───────────────────────── 시대·땅 갈래 (작업 2-1 수정 1차) ─────────────────────────
// 남아시아 세트는 지도에서 남아시아(india·bengal·indus·himalaya·lanka)와 동남아(아래 SA_FLAVOR_OF)를 함께 그리고, 고대(기원전~599년)도 그린다.
// 그래서 조각마다 「쓸 수 있는 해」를 표로 둔다 [from, to) (to 없으면 끝없음). 땅(area)·갈래(flavor)가 덮어쓸 수 있고, null 은 「이 땅·갈래에선 없음」.
//   temple_small: 나가라 돌 사원은 600년 무렵부터. 스리랑카는 어느 시대든 힌두 사원 대신 신당, 인더스는 600~999년만 (그 뒤는 흙벽돌·모스크 조각이 생길 때까지 신당),
//                 동남아는 두지 않는다. 사원이 빠진 자리에는 신당(shrine_tree + 보리수)이 선다.
//   house_town:   두 층 벽돌 읍내 집은 기원전 300년 무렵부터 (그 전 생은 흙집·안뜰집만).
//   cart_bullock: 소달구지는 맥락의 남아시아 기술 2단계(기원전 2600년, 인더스 수레 모형)부터, 동남아는 기원전 500년 무렵부터.
export const SA_FLAVOR_OF = { mainland_sea: 'seasia', indonesia: 'seasia', malay: 'seasia', philippines: 'seasia' };
// 동아시아 세트의 땅 갈래: 한국·일본은 건물 glb·사람 옷·물감이 다르다 (중국 = 바탕)
export const EA_FLAVOR_OF = { korea: 'korea', japan: 'japan' };
export const flavorOf = (kit, area) => (kit === 'southasia' && SA_FLAVOR_OF[area]) || (kit === 'eastasia' && EA_FLAVOR_OF[area]) || null;
export const PIECE_GATES = {
  southasia: {
    temple_small: { from: 600, area: { lanka: null, indus: [600, 1000] }, flavor: { seasia: null } },
    house_town: { from: -300 },
    cart_bullock: { from: -2600, flavor: { seasia: [-500, Infinity] } },
  },
  // 동아시아 (작업 2-2): 불교 절·탑은 중국 1세기(100년), 고구려·백제 372년, 일본 588년부터 (불교 공식 전래는 538, 첫 큰 절 아스카데라는 588 착공) (그 전 절 자리는 마을 사당 + 나무).
  //   기와(기와집·기와 대문)는 중국 기원전 1000년 무렵 궁·관청부터, 한국 300년, 일본 590년(아스카데라 기와 장인)부터 — 서민 기와 몫은 HOUSE_MIX 가 해마다 늘린다.
  //   가게 딸린 집: 중국 기원전 500년(전국 시장 고을), 한국 1000년(고려 개경 시전), 일본 1300년(무로마치 마치야).
  //   소달구지: 중국 기원전 1500년, 한국 0년, 일본 800년. 누렁소: 중국 −3000, 한국 −1000, 일본 400년. 물소는 중국만. 돼지는 일본에 드물다(없음).
  //   장독대는 한국 300년부터, 큰 독은 중국과 한국 300년 전·일본 1300년 전, 나무통은 일본 1300년부터.
  eastasia: {
    temple_ea: { from: 100, area: { korea: [372, Infinity], japan: [588, Infinity] } },
    pagoda_small: { from: 100, area: { korea: [372, Infinity], japan: [588, Infinity] } },
    house_tile_ea: { from: -1000, area: { korea: [300, Infinity], japan: [590, Infinity] } },
    gate_ea: { from: -1000, area: { korea: [300, Infinity], japan: [590, Infinity] } },
    house_town_ea: { from: -500, area: { korea: [1000, Infinity], japan: [1300, Infinity] } },
    cart_ea: { from: -1500, area: { korea: [0, Infinity], japan: [800, Infinity] } },
    ox_ea: { from: -3000, area: { korea: [-1000, Infinity], japan: [400, Infinity] } },
    buffalo_ea: { from: -5000, area: { korea: null, japan: null } },
    pig: { area: { japan: null } },
    jangdok: { from: 300, area: { china: null, japan: null } },
    jars_ea: { area: { korea: [-Infinity, 300], japan: [-Infinity, 1300] } },
    taru_ea: { from: 1300, area: { china: null, korea: null } },
  },
};
// 집 종류 섞기 (해 → 안뜰집·읍내 집 몫, 나머지는 흙집). 600년부터가 원래 값 (중세 인도 생의 마을은 수정 전과 같다)
export const HOUSE_MIX = { southasia: [[-Infinity, { courtyard: 0.03, town: 0 }], [-300, { courtyard: 0.04, town: 0.05 }], [600, { courtyard: 0.05, town: 0.1 }]],
  // 동아시아: 해마다 움집·기와집·가게 몫 (나머지 초가). 신석기 움집 → 땅 위 흙벽 초가, 기와는 늦게 서민에게 (기와 몫이 PIECE_GATES 보다 앞서지 않게)
  eastasia: {
    china: [[-Infinity, { pit: 0.85, tile: 0, town: 0 }], [-2000, { pit: 0.45, tile: 0, town: 0 }], [-1000, { pit: 0.25, tile: 0.04, town: 0 }],
      [-500, { pit: 0.06, tile: 0.08, town: 0.05 }], [600, { pit: 0, tile: 0.18, town: 0.1 }], [1400, { pit: 0, tile: 0.3, town: 0.12 }]],
    korea: [[-Infinity, { pit: 0.9, tile: 0, town: 0 }], [0, { pit: 0.5, tile: 0, town: 0 }], [300, { pit: 0.2, tile: 0.03, town: 0 }],
      [700, { pit: 0.02, tile: 0.06, town: 0 }], [1000, { pit: 0, tile: 0.08, town: 0.03 }], [1600, { pit: 0, tile: 0.1, town: 0.05 }]],
    japan: [[-Infinity, { pit: 1, tile: 0, town: 0 }], [-300, { pit: 0.9, tile: 0, town: 0 }], [700, { pit: 0.45, tile: 0.02, town: 0 }],
      [1100, { pit: 0.05, tile: 0.03, town: 0 }], [1300, { pit: 0.02, tile: 0.05, town: 0.06 }], [1600, { pit: 0, tile: 0.08, town: 0.1 }]],
  },
};
export function pieceAllowed(kit, piece, year, area) {
  const g = PIECE_GATES[kit] && PIECE_GATES[kit][piece]; if (!g) return true;
  const fl = flavorOf(kit, area);
  let span = [g.from ?? -Infinity, g.to ?? Infinity];
  if (fl && g.flavor && fl in g.flavor) span = g.flavor[fl];
  if (g.area && area in g.area) span = g.area[area];
  return span !== null && year >= span[0] && year < span[1];
}
const recipeMemo = new Map();
// 세트 + {해, 땅} → 마을 요리법. 거를 것이 없으면 RECIPES[kit] 그 객체를 그대로 (잉글랜드·중세 인도는 수정 전과 같은 계획)
export function recipeFor(kit, { year = 1329, area = null } = {}) {
  const base = recipeOf(kit), gates = PIECE_GATES[base.kit], mixes = HOUSE_MIX[base.kit];
  if (!gates) return base;
  const y = Number.isFinite(year) ? year : 1329;
  if (base.kit === 'eastasia') return recipeEA(base, y, area);
  const mix = mixes ? mixes.filter(([from]) => y >= from).pop()[1] : null;
  const without = Object.keys(gates).filter((p) => !pieceAllowed(base.kit, p, y, area)).sort();
  const key = base.kit + '|' + without.join(',') + '|' + (mix ? mix.courtyard + ',' + mix.town : '');
  if (!without.length && (!mix || mixes[mixes.length - 1][1] === mix)) return base;
  if (recipeMemo.has(key)) return recipeMemo.get(key);
  const swap = (f) => (without.includes(f.piece) && f.piece === 'temple_small' ? { ...f, piece: 'shrine_tree' } : f);
  const fixed = base.fixed.map(swap);
  const RC = {
    ...base, fixed, without,
    fixedFoot: fixed.map((f) => { const [L, D] = base.dims[f.piece]; return obb(f.x, f.z, f.rot, L / 2, D / 2); }),
    kindOf: mix ? (r) => (r < mix.courtyard ? 'courtyard' : r < mix.courtyard + mix.town ? 'town' : 'mud') : base.kindOf,
  };
  recipeMemo.set(key, RC);
  return RC;
}

// 동아시아 요리법: 땅 갈래(중국·한국·일본)의 건물 크기 표 + 시대 거름 + 집 섞기 + 농사 전 야영 (FARM_FROM 전: 움집·야영 화덕만, 장터·논 없음)
export const isCampYear = (area, year) => year < (FARM_FROM[area] ?? -Infinity);
function recipeEA(base, y, area) {
  const V = flavorOf('eastasia', area) || 'china', camp = isCampYear(area || 'china', y);
  const gates = PIECE_GATES.eastasia;
  const without = camp ? [...Object.keys(gates), 'house_thatch_ea', 'smithy_ea', 'well_ea', 'shrine_ea', 'granary_ea', 'stall_ea'].sort()
    : Object.keys(gates).filter((p) => !pieceAllowed('eastasia', p, y, area)).sort();
  const list = HOUSE_MIX.eastasia[V];
  const mix = camp ? { pit: 1, tile: 0, town: 0 } : list.filter(([from]) => y >= from).pop()[1];
  const key = ['eastasia', V, camp, without.join(','), mix.pit, mix.tile, mix.town].join('|');
  if (recipeMemo.has(key)) return recipeMemo.get(key);
  const dims = base.flavorDims[V], gone = new Set(without);
  const temple = !gone.has('temple_ea');
  let fixed;
  if (camp) fixed = [{ role: 'smithy', piece: 'camp_hearth', x: SMITHY.x, z: SMITHY.z, rot: SMITHY.rot }];
  else {
    fixed = [];
    for (const f of base.fixed) {
      if (f.role === 'church' && !temple) { fixed.push({ ...f, piece: 'shrine_ea' }); continue; }     // 절 전: 그 자리에 마을 사당 + 나무
      if ((f.role === 'pagoda' || f.role === 'tgate') && !temple) continue;
      if (f.role === 'biggate' && gone.has('gate_ea')) continue;
      if (f.role === 'bighouse' && gone.has('house_tile_ea')) { fixed.push({ ...f, piece: 'house_thatch_ea' }); continue; }
      fixed.push(f);
    }
  }
  const P = mix.pit, T = P + mix.tile, W = T + mix.town;
  const RC = {
    ...base, dims, fixed, without, variant: V, flavor: V === 'china' ? null : V, camp, noMarket: camp,
    fixedFoot: fixed.map((f) => { const [L, D] = dims[f.piece]; return obb(f.x, f.z, f.rot, L / 2, D / 2); }),
    kindOf: (r) => (r < P ? 'pit' : r < T ? 'tile' : r < W ? 'town' : 'thatch'),
    farmKind: camp ? () => 'pit' : base.farmKind,
    gap: camp ? [6, 14] : base.gap, croftK: camp ? 0.6 : base.croftK,
    hedge: camp ? { keep: 0.5, strips: false, pick: (r) => (r < 0.5 ? 'pine' : r < 0.8 ? 'zelkova' : 'willow') } : base.hedge,
    terrace: camp ? 0 : base.terrace,
  };
  if (!temple) RC.sites = { ...base.sites, temple: E_.TEMPLE, church: E_.TEMPLE };
  recipeMemo.set(key, RC);
  return RC;
}

// ───────────────────────── 남아시아 꾸미기 (시드) ─────────────────────────
// planDressing 과 같은 꼴을 돌려준다: { items, gardens, worn, trees, tall, bushes }
//   trees[].sp: banyan·peepal·mango·neem·babul (ez-tree) · coconut·areca·date·bamboo·banana (trees_southasia.glb)
//   items[].p : props_southasia.glb 조각 (물항아리·끈 침상·쇠똥 떡·볏짚 가리·자루·바구니·아궁이·여물통·흙 담·대나무 울·소달구지·혹소·물소·염소·닭)
export const YARD_PIECES_SA = ['water_pot', 'charpai', 'dung_cakes', 'sacks_sa', 'basket_sa', 'chulha', 'haystack_sa', 'trough_sa'];
export function planDressingSA(rng, kit, props, layout) {
  const R = rng, PD = props.dims, { roadEdge, riverEdge, fieldAt } = layout;
  const items = [], gardens = [], worn = [], trees = [], tall = [], bushes = [];
  const TAU = Math.PI * 2, rr = (a, b) => a + (b - a) * R();
  const builds = [...layout.houses, ...layout.farms].map((h) => h.foot);
  const KD = kit.dims || KIT_DIMS_SA;
  const fixedFoot = [...(layout.fixed || []).map((f) => { const [L, D] = KD[f.piece] || [4, 4]; return obb(f.x, f.z, f.rot, L / 2, D / 2); }),
    ...layout.stalls.map((q) => obb(q.x, q.z, q.rot, 1.8, 1.4)), ...layout.awnings.map((q) => obb(q.x, q.z, q.rot, 1.8, 1.4))];
  const radius = (p, s = 1) => { const d = PD[p]; return d ? Math.hypot(d[0], d[1]) / 2 * s : 0.5; };
  const TC = 8, tgrid = new Map(); let tmax = 0;
  const takenAdd = (x, z, r) => { const k = Math.floor(x / TC) * 100003 + Math.floor(z / TC); let a = tgrid.get(k); if (!a) tgrid.set(k, a = []); a.push([x, z, r]); if (r > tmax) tmax = r; };
  const takenHit = (x, z, r) => {
    const reach = (r + tmax) * 0.75, g0 = Math.floor((x - reach) / TC), g1 = Math.floor((x + reach) / TC), h0 = Math.floor((z - reach) / TC), h1 = Math.floor((z + reach) / TC);
    for (let gx = g0; gx <= g1; gx++) for (let gz = h0; gz <= h1; gz++) {
      const a = tgrid.get(gx * 100003 + gz); if (!a) continue;
      for (const [tx, tz, tr] of a) if ((x - tx) ** 2 + (z - tz) ** 2 < (r * 0.75 + tr * 0.75) ** 2) return true;
    }
    return false;
  };
  const clear = (x, z, r, own) => roadEdge(x, z) > r * 0.55 + 0.15 && riverEdge(x, z) > RIVER_HW + r * 0.5
    && !builds.some((o) => (o === own ? obbHas(o, x, z, -0.05) : obbHas(o, x, z, r * 0.6))) && !fixedFoot.some((o) => obbHas(o, x, z, r * 0.6))
    && !takenHit(x, z, r);
  const WITHOUT = new Set(kit.without || []);
  const put = (p, x, z, rot, o = {}) => {
    if (WITHOUT.has(p)) return false;      // 시대·땅 갈래로 거른 소품 (recipeFor → without)
    const s = o.s ?? 1, r = o.r ?? radius(p, s);
    if (!o.force && !clear(x, z, r, o.own)) return false;
    const it = { p, x, z, rot, s }; for (const k of ['sx', 'y', 'tint', 'yard', 'flock']) if (o[k] != null) it[k] = o[k];
    items.push(it); if (!o.notake) takenAdd(x, z, r); return true;
  };
  const fence = (p, ax, az, bx, bz, o = {}) => {
    const seg = 2.0, L = Math.hypot(bx - ax, bz - az); if (L < 1.2) return 0;
    const n = Math.max(1, Math.round(L / seg)), sx = L / (n * seg), dx = (bx - ax) / L, dz = (bz - az) / L, rot = Math.atan2(-dz, dx);
    let c = 0;
    for (let k = 0; k < n; k++) {
      if (o.gap != null && k === o.gap) continue;
      const t = (k + 0.5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (roadEdge(x, z) < 0.4 || riverEdge(x, z) < RIVER_HW + 0.6 || builds.some((b) => obbHas(b, x, z, 0.2)) || fixedFoot.some((b) => obbHas(b, x, z, 0.2))) continue;
      items.push({ p, x, z, rot, s: 1, sx }); c++;
      if (R() < 0.35) tall.push([x + rr(-0.8, 0.8) * dx, z + rr(-0.8, 0.8) * dz, rr(0.5, 1.0)]);
    }
    const m = Math.ceil(L / 3); for (let k = 0; k < m; k++) takenAdd(ax + (bx - ax) * (k + 0.5) / m, az + (bz - az) * (k + 0.5) / m, 0.4);
    return c;
  };
  const tree = (sp, x, z, s, r = 2.5, lean = [rr(-0.04, 0.04), rr(-0.04, 0.04)]) => {
    if (!clear(x, z, r) || Math.hypot(x - GREEN.x, z - GREEN.z) < GREEN.r + 2.5 || inRect(VIEW_CLEAR, x, z)) return false;
    trees.push({ sp, x, z, s, lean }); takenAdd(x, z, r); return true;
  };
  // 소 빛깔: 혹소 회백·흰·잿빛·누렁, 물소 검정, 염소 검정·밤색·흰·얼룩
  const zebuTint = () => [[1, 1, 1], [1.25, 1.22, 1.15], [0.8, 0.78, 0.76], [1.45, 1.1, 0.75], [1.15, 0.95, 0.75]][Math.floor(R() * 5)];
  const goatTint = () => [[0.25, 0.22, 0.2], [1, 1, 1], [3.6, 3.4, 3.1], [1.6, 1.15, 0.8], [0.5, 0.42, 0.36]][Math.floor(R() * 5)];
  takenAdd(S_.WELL.x - 2.6, S_.WELL.z + 1.2, 1.0); takenAdd(S_.WELL.x + 1.4, S_.WELL.z + 2.8, 1.0);    // 우물가 이야기꾼 자리
  for (const a of layout.awnings) takenAdd(a.x, a.z, 2.0);

  // ── 집마다: 앞마당(길 쪽)·뒤뜰 소품 2~5 (물항아리·끈 침상·쇠똥 떡·자루·바구니·아궁이·볏짚·여물통), 소·물소 매어 두기, 닭·염소, 흙 담·대나무 울, 바나나·야자·망고 ──
  layout.houses.forEach((h, hi) => {
    const { L, D, rot: th, foot: own } = h, loc = (u, v) => obbLocal(own, u, v);
    const c = h.croft, cl = (u, v) => obbLocal(c, u, v), cr = h.face;
    const want = 2 + Math.floor(R() * 4);
    let got = 0;
    const yard = (p, x, z, rot, o = {}) => (got < want && put(p, x, z, rot, { ...o, yard: hi }) ? (got++, true) : false);
    const sg = R() < 0.5 ? 1 : -1;
    const wishes = [
      () => { for (const v of [0, rr(-0.3, 0.3) * D]) { const [x, z] = loc(sg * (L / 2 + 0.55), v); if (yard('water_pot', x, z, R() * TAU, { own, r: 0.45 })) return; } },
      () => { for (const u of [(R() - 0.5) * Math.max(0, L - 3), 0]) { const [x, z] = loc(u, D / 2 + 1.1); if (yard('charpai', x, z, th + (R() - 0.5) * 0.4, { own, r: 0.8 })) return; } },
      () => { const [x, z] = cl(rr(-0.5, 0.5) * Math.max(0.2, c.hx - 1.2), rr(-0.5, 0.5) * Math.max(0.2, c.hz - 1.0)); yard('dung_cakes', x, z, R() * TAU, { r: 0.75 }); },
      () => { const [x, z] = loc(-sg * (L / 2 + 0.7), rr(-0.3, 0.3) * D); yard(R() < 0.5 ? 'sacks_sa' : 'basket_sa', x, z, th + R() * TAU, { own, r: 0.6 }); },
      () => { const [x, z] = cl(rr(-0.6, 0.6) * Math.max(0.2, c.hx - 1), c.hz - 1.2); yard('chulha', x, z, cr + Math.PI, { r: 0.6 }); },
      () => { if (c.hz > 3.2 && R() < 0.5) { const [x, z] = cl(rr(-0.4, 0.4) * c.hx, -c.hz + 2.0); yard('haystack_sa', x, z, R() * TAU, { s: rr(0.6, 0.8) }); } },
    ];
    for (let i = wishes.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [wishes[i], wishes[j]] = [wishes[j], wishes[i]]; }
    for (const w of wishes) { if (got >= want) break; w(); }
    for (let gv = 0; got < 2 && gv < 5; gv++) for (let gu = 0; got < 2 && gu < 7; gu++) {
      const u = (-1 + 2 * (gu + 0.5) / 7) * Math.max(0.2, c.hx - 0.6), v = (-1 + 2 * (gv + 0.5) / 5) * Math.max(0.2, c.hz - 0.5), [x, z] = cl(u, v);
      yard(gu % 2 ? 'basket_sa' : 'water_pot', x, z, R() * TAU, { r: 0.4 });
    }
    // 소·물소 (반쯤의 집): 뒤뜰이나 집 옆에 여물통과 함께
    if (R() < 0.55) {
      const buff = R() < 0.4, [x, z] = cl(rr(-0.5, 0.5) * Math.max(0.3, c.hx - 1.5), rr(-0.3, 0.3) * Math.max(0.3, c.hz - 1.2));
      if (put(buff ? 'buffalo' : 'cow_zebu', x, z, cr + Math.PI / 2 + rr(-0.6, 0.6), { r: 1.1, tint: buff ? [rr(0.9, 1.15), rr(0.9, 1.1), rr(0.9, 1.1)] : zebuTint() })) {
        const [tx, tz] = cl(Math.max(-c.hx + 0.9, Math.min(c.hx - 0.9, (x - c.x) * c.c - (z - c.z) * c.s + 1.6)), (x - c.x) * c.s + (z - c.z) * c.c - 1.1);
        put('trough_sa', tx, tz, cr, { r: 0.8 });
      }
    }
    if (R() < 0.35) { const n = 3 + Math.floor(R() * 4), [cx, cz] = cl((R() - 0.5) * c.hx, c.hz - 1.0); for (let k = 0; k < n; k++) put('chicken', cx + rr(-2, 2), cz + rr(-1.5, 1.5), R() * TAU, { r: 0.18, notake: true }); }
    if (R() < 0.25) { const n = 1 + Math.floor(R() * 3), [cx, cz] = cl((R() - 0.5) * c.hx, (R() - 0.5) * c.hz); for (let k = 0; k < n; k++) put('goat', cx + rr(-1.5, 1.5), cz + rr(-1.2, 1.2), R() * TAU, { r: 0.45, tint: goatTint() }); }
    // 앞마당 밟힌 흙 (집 앞이 길에 바짝 붙어 있다)
    worn.push(obb(...loc(0, D / 2 + 0.8), th, L / 2 + 0.3, 1.1));
    worn.push(obb(c.x, c.z, cr, Math.max(0.5, c.hx - 0.5), Math.max(0.5, c.hz - 0.5)));
    // 뒤뜰 둘레: 흙 담(안뜰을 두른 집이 많다) 또는 대나무 울
    const K = [cl(-c.hx, c.hz), cl(-c.hx, -c.hz), cl(c.hx, -c.hz), cl(c.hx, c.hz)];
    const wp = R() < 0.5 ? 'wall_mud' : 'fence_bamboo';   // 뒤뜰 울: 뒷면은 대개, 옆면은 가끔 (집이 촘촘해 이웃 울과 겹치는 곳이 많다)
    if (R() < 0.7) fence(wp, ...K[1], ...K[2], { gap: R() < 0.5 ? 1 : null });
    if (R() < 0.3) fence(wp, ...K[0], ...K[1]);
    if (R() < 0.3) fence(wp, ...K[2], ...K[3]);
    // 뒤뜰 나무: 바나나 포기·야자·망고 하나둘
    if (R() < 0.8) {
      const n = 1 + (R() < 0.4 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const [x, z] = cl((R() - 0.5) * 2 * Math.max(0, c.hx - 1.5), -c.hz + 1.4 + R() * Math.max(0.2, c.hz - 2.6));
        const q = R(), sp = q < 0.45 ? 'banana' : q < 0.75 ? 'coconut' : q < 0.9 ? 'areca' : 'mango';
        tree(sp, x, z, rr(0.8, 1.1), sp === 'mango' ? 3 : 1.3);
      }
    }
    tall.push([...cl(-c.hx + 0.5, -c.hz + 0.5), rr(0.8, 1.4)], [...cl(c.hx - 0.5, -c.hz + 0.5), rr(0.8, 1.4)]);
  });
  for (const f of layout.farms) {   // 외딴 집·곳간: 볏짚 가리, 소달구지, 쇠똥 떡
    const loc = (u, v) => obbLocal(f.foot, u, v), side = R() < 0.5 ? 1 : -1;
    if (R() < 0.8) { const [x, z] = loc(side * (f.L / 2 + 4), rr(-2, 2)); put('haystack_sa', x, z, R() * TAU, { s: rr(0.8, 1.0) }); }
    if (R() < 0.6) { const [x, z] = loc(-side * (f.L / 2 + 3.5), f.D / 2 + 2.5); put('cart_bullock', x, z, f.rot + rr(-0.5, 0.5)); }
    { const [x, z] = loc(-side * (f.L / 2 + 1.2), 0); put('dung_cakes', x, z, R() * TAU, { r: 0.8 }); }
    if (R() < 0.6) { const [x, z] = loc(side * (f.L / 2 + 2.5), -f.D / 2 - 2); put(R() < 0.5 ? 'cow_zebu' : 'buffalo', x, z, R() * TAU, { r: 1.1, tint: zebuTint() }); }
  }

  // ── 바자르 (같은 빈터): 좌판은 세트 조각 (stalls·awnings 자리), 둘레에 바구니·자루·항아리·소달구지·끈 침상 ──
  worn.push(obb(GREEN.x, GREEN.z, 0.3, GREEN.r + 1, GREEN.r - 1));
  for (let k = 0; k < 14; k++) {
    const a = R() * TAU, d = rr(3.0, 10.5), x = GREEN.x + Math.cos(a) * d, z = GREEN.z + Math.sin(a) * d, pk = ['basket_sa', 'sacks_sa', 'water_pot', 'basket_sa', 'sacks_sa', 'charpai'][k % 6];
    put(pk, x, z, pk === 'charpai' ? Math.atan2(GREEN.x - x, GREEN.z - z) : R() * TAU, { r: pk === 'charpai' ? 0.9 : 0.5 });
  }
  { const a = R() * TAU; put('cart_bullock', GREEN.x + Math.cos(a) * 11.5, GREEN.z + Math.sin(a) * 11.5, a + Math.PI / 2, { r: 2.0 }); }
  { const a = R() * TAU; put('cow_zebu', GREEN.x + Math.cos(a) * 12.5, GREEN.z + Math.sin(a) * 12.5, R() * TAU, { r: 1.2, tint: zebuTint() }); }

  // ── 대장간 마당 (로컬 앞 = +z): 물항아리·쇠똥 떡(땔감)·자루·여물통·소달구지 ──
  { const o = obb(SMITHY.x, SMITHY.z, SMITHY.rot, 3.5, 3.5), loc = (u, v) => obbLocal(o, u, v), th = SMITHY.rot;
    put('trough_sa', ...loc(5.0, 2.6), th + Math.PI / 2, { force: true });
    put('water_pot', ...loc(4.4, -1.6), 0.4, { force: true });
    put('dung_cakes', ...loc(-4.6, 0.8), 0.0, { force: true });
    put('sacks_sa', ...loc(-4.4, 2.8), th + 0.7, { force: true, s: 0.9 });
    put('cart_bullock', ...loc(7.2, 5.4), th + 0.35, { force: true });
    put('cow_zebu', ...loc(9.5, 2.2), th + 1.2, { force: true, tint: zebuTint() });
    worn.push(obb(...loc(0.5, 6.2), th, 6.5, 3.2)); }
  // ── 큰 반얀 신당 (마을 한가운데): 반얀 한 그루(신당 단 가운데), 그늘 밑 끈 침상·물항아리, 둘레 밟힌 흙 ──
  { const S = S_.SHRINE;
    trees.push({ sp: 'banyan', x: S.x, z: S.z, s: 1.25, lean: [0, 0] }); takenAdd(S.x, S.z, 4.0);
    for (const [u, v, p, rot] of [[5.0, 1.0, 'charpai', 0.4], [-4.6, 2.2, 'charpai', 2.1], [3.6, -3.8, 'water_pot', 0], [-3.4, -4.2, 'dung_cakes', 0]]) {
      const [x, z] = obbLocal(obb(S.x, S.z, S.rot, 1, 1), u, v); put(p, x, z, S.rot + rot, { r: 0.7 });
    }
    worn.push(obb(S.x, S.z, S.rot, 7.5, 7.5)); }
  // ── 우물가: 물항아리·놋 물병·여물통, 밟힌 흙 ──
  { const W = S_.WELL, o = obb(W.x, W.z, W.rot, 1.5, 1.5), loc = (u, v) => obbLocal(o, u, v);
    put('water_pot', ...loc(2.8, 0.6), 0.3, { r: 0.5 }); put('water_pot', ...loc(-2.9, -0.8), 1.4, { r: 0.5 }); put('lota', ...loc(2.3, -1.6), 0, { r: 0.2 });
    put('trough_sa', ...loc(0.0, -3.3), W.rot, { r: 0.8 });
    worn.push(obb(W.x, W.z, W.rot, 3.4, 3.4)); }
  // ── 사원 마당: 님·보리수, 흙 담 (앞 문 틈), 물항아리 ──
  { const Y = S_.TEMPLE_YARD, T = S_.TEMPLE;
    fence('wall_mud', Y.x0, Y.z0, Y.x1, Y.z0); fence('wall_mud', Y.x0, Y.z1, Y.x1, Y.z1); fence('wall_mud', Y.x0, Y.z0, Y.x0, Y.z1);
    fence('wall_mud', Y.x1, Y.z0, Y.x1, T.z - 3.2); fence('wall_mud', Y.x1, T.z + 3.2, Y.x1, Y.z1);
    for (const [x, z, sp] of [[Y.x0 + 3, Y.z0 + 3, 'peepal'], [Y.x0 + 3.5, Y.z1 - 3, 'neem'], [Y.x1 - 3, Y.z0 + 2.8, 'neem']]) { trees.push({ sp, x, z, s: rr(0.9, 1.05), lean: [0, 0] }); takenAdd(x, z, 3); }
    put('water_pot', T.x + 6.2, T.z - 2.2, 0.2, { r: 0.4 });
    if ((layout.fixed || []).some((f) => f.role === 'church' && f.piece === 'shrine_tree')) { trees.push({ sp: 'peepal', x: T.x, z: T.z, s: 1.15, lean: [0, 0] }); takenAdd(T.x, T.z, 4.0); }   // 사원 대신 신당: 보리수 밑 단
    worn.push(obb(T.x + 4, T.z, T.rot, 6, 3.5)); }
  // ── 가트: 위 단 옆 물항아리·놋 물병·옷 말리는 대나무 울 ──
  { const G = S_.GHAT, o = obb(G.x, G.z, G.rot, 1, 1), loc = (u, v) => obbLocal(o, u, v);
    put('water_pot', ...loc(3.8, -2.6), 0.2, { r: 0.4, force: true }); put('lota', ...loc(4.2, -2.0), 0, { r: 0.2, force: true });
    put('fence_bamboo', ...loc(-5.0, -3.0), G.rot + Math.PI / 2, { force: true });
    worn.push(obb(...loc(0, -4.5), G.rot, 4.5, 2.0)); }
  // ── 지주 집·곳간 둘레: 볏짚 가리 둘, 소달구지, 물소 ──
  { const B = S_.BIGHOUSE, o = obb(B.x, B.z, B.rot, 1, 1), loc = (u, v) => obbLocal(o, u, v);
    put('haystack_sa', ...loc(-10, -3), 0.3, { s: 0.95 }); put('haystack_sa', ...loc(-10.5, 2.5), 1.2, { s: 0.85 });
    put('cart_bullock', ...loc(8.5, 8.5), B.rot + 0.4); put('buffalo', ...loc(-8, 8), B.rot + 1.0, { r: 1.2, tint: [1, 1, 1] }); put('cow_zebu', ...loc(-6, 10), B.rot - 0.6, { r: 1.2, tint: zebuTint() });
    worn.push(obb(...loc(0, 8.5), B.rot, 6.5, 2.4)); }

  // ── 길가: 세워 둔 소달구지, 길가 풀섶, 야자 ──
  const lanePts = LANES.map((lp) => { const pts = smoothLine(lp, 3); return { pts, cum: polyCum(pts) }; });
  let carts = 0;
  for (let t = 0; t < 60 && carts < 4; t++) {
    const { pts, cum } = lanePts[Math.floor(R() * lanePts.length)], p = polyAt(pts, cum, 4 + R() * (cum[cum.length - 1] - 8)), side = R() < 0.5 ? 1 : -1, off = rr(3.2, 4.0);
    if (put('cart_bullock', p.x - p.tz * side * off, p.z + p.tx * side * off, Math.atan2(-p.tz, p.tx) + (R() < 0.5 ? 0 : Math.PI) + rr(-0.25, 0.25), { r: 2.0 })) carts++;
  }
  for (const { pts, cum } of lanePts) for (let s = 1; s < cum[cum.length - 1]; s += rr(2.2, 4.0)) {
    const p = polyAt(pts, cum, s), side = R() < 0.5 ? 1 : -1, off = rr(2.0, 2.8), x = p.x - p.tz * side * off, z = p.z + p.tx * side * off;
    if (roadEdge(x, z) > 0.2 && !takenHit(x, z, 0.4) && !builds.some((o) => obbHas(o, x, z, 0.3))) tall.push([x, z, rr(0.35, 0.8)]);
  }
  for (const { pts, cum } of lanePts) for (let s = 6; s < cum[cum.length - 1] - 4; s += rr(9, 18)) {   // 골목 끝·집 사이 야자
    const p = polyAt(pts, cum, s), side = R() < 0.5 ? 1 : -1, off = rr(3.5, 6.0);
    tree(R() < 0.7 ? 'coconut' : 'areca', p.x - p.tz * side * off, p.z + p.tx * side * off, rr(0.85, 1.12), 1.4, [rr(-0.08, 0.08), rr(-0.08, 0.08)]);
  }

  // ── 강가: 코코넛·빈랑 야자, 대나무 포기, 키 큰 풀 (카슈) ──
  for (let i = 1, next = 0; i < RIVER.length - 1; i++) {
    const [x0, z0] = RIVER[i]; if (Math.hypot(x0 - VC.x, z0 - VC.z) > 420) continue;
    next -= Math.hypot(RIVER[i][0] - RIVER[i - 1][0], RIVER[i][1] - RIVER[i - 1][1]); if (next > 0) continue;
    const [x1, z1] = RIVER[i + 1], L = Math.hypot(x1 - x0, z1 - z0) || 1, side = R() < 0.5 ? 1 : -1, off = RIVER_HW + rr(1.6, 4.2);
    const nx = -(z1 - z0) / L * side, nz = (x1 - x0) / L * side;
    const q = R(), sp = q < 0.5 ? 'coconut' : q < 0.7 ? 'bamboo' : q < 0.85 ? 'areca' : 'banyan';
    if (tree(sp, x0 + nx * off, z0 + nz * off, rr(0.85, 1.15), sp === 'banyan' ? 6 : 2.2, [-nz * rr(0.03, 0.1), nx * rr(0.03, 0.1)])) next = rr(12, 28);
    tall.push([x0 + nx * (RIVER_HW + rr(0.5, 2.5)), z0 + nz * (RIVER_HW + rr(0.5, 2.5)), rr(0.9, 1.8)]);
  }
  // ── 마을 둘레 나무: 망고 숲, 님, 대나무, 바불 ──
  for (let t = 0, n = 0; t < 140 && n < 14; t++) { const a = R() * TAU, d = rr(60, 150); if (tree(R() < 0.55 ? 'mango' : R() < 0.6 ? 'neem' : 'bamboo', VC.x + Math.cos(a) * d, VC.z + Math.sin(a) * d, rr(0.85, 1.15), 4)) n++; }
  for (let t = 0, n = 0; t < 120 && n < 10; t++) { const a = R() * TAU, d = rr(25, 90); if (tree(R() < 0.5 ? 'neem' : R() < 0.6 ? 'coconut' : 'banana', VC.x + Math.cos(a) * d, VC.z + Math.sin(a) * d, rr(0.8, 1.1), 3)) n++; }
  // ── 풀밭: 혹소·물소 떼 (대장간 동남쪽), 강가 풀밭에 염소 떼 ──
  { const M = PASTURE;
    put('haystack_sa', M.x1 - 7, M.z1 - 7, R() * TAU, { s: 0.85 }); put('trough_sa', M.x0 + 6, M.z0 + 5, 0.2);
    for (const [sp, n] of [['cow_zebu', 4 + Math.floor(R() * 3)], ['buffalo', 2 + Math.floor(R() * 2)]]) {
      for (let k = 0, tries = 0; k < n && tries < 50; tries++) {
        const x = rr(M.x0 + 3, M.x1 - 3), z = rr(M.z0 + 3, M.z1 - 3);
        if (riverEdge(x, z) < RIVER_HW + 4) continue;
        if (put(sp, x, z, R() * TAU, { r: 1.3, tint: sp === 'cow_zebu' ? zebuTint() : [1, 1, 1] })) k++;
      }
    }
    for (let t = 0, n = 0; t < 40 && n < 4; t++) { const x = rr(M.x0, M.x1), z = R() < 0.5 ? M.z0 - 2 : M.z1 + 2; if (tree(R() < 0.5 ? 'babul' : 'neem', x, z, rr(0.8, 1.1), 2.5)) n++; } }
  { const P = MEADOW, n = 9 + Math.floor(R() * 7), cx = (P.x0 + P.x1) / 2, cz = P.z0 + 8;
    for (let k = 0, tries = 0; k < n && tries < n * 20; tries++) {
      const x = cx + (R() + R() - 1) * 9, z = cz + (R() + R() - 1) * 6;
      if (!inRect(P, x, z, -1.5) || riverEdge(x, z) < RIVER_HW + 2.5) continue;
      if (put('goat', x, z, R() * TAU, { r: 0.45, s: rr(0.9, 1.08), tint: goatTint(), flock: 'main' })) k++;
    } }
  // ── 논·밭 가: 볏짚 가리 (서로 35 m 넘게) ──
  { const hs = [];
    for (let t = 0; t < 400 && hs.length < 9; t++) {
      const a = R() * TAU, d = rr(150, 460), x = VC.x + Math.cos(a) * d, z = VC.z + Math.sin(a) * d * 0.85, f = fieldAt(x, z);
      if (!f || (f.type !== 2 && f.type !== 4 && f.type !== 1) || f.edge < 3 || f.edge > 9 || hs.some(([hx, hz]) => Math.hypot(hx - x, hz - z) < 35)) continue;
      if (put('haystack_sa', x, z, R() * TAU, { s: rr(0.85, 1.05) })) hs.push([x, z]);
    } }
  return { items, gardens, worn, trees, tall, bushes };
}

// ───────────────────────── 동아시아 꾸미기 (시드) ─────────────────────────
// planDressing 과 같은 꼴: { items, gardens, worn, trees, tall, bushes }
//   trees[].sp: pine·zelkova·willow·persimmon·maple (ez-tree) · bamboo·bamboo_s (trees_eastasia.glb)
//   items[].p : props_eastasia.glb 조각. 땅 갈래(kit.variant)마다: 독 = 장독대(한국)·큰 독(중국)·나무통(일본), 뒤뜰 울 = 돌담(한국)·흙담(중국)·바자울(일본)
//   kit.camp (농사 전 야영): 움집 둘레 장작·바구니·절구만, 가축·수레·볏가리·장터 없음
export const YARD_PIECES_EA = ['veg_bed_ea', 'bench_ea', 'jangdok', 'jars_ea', 'taru_ea', 'woodpile_ea', 'straw_stack', 'bales_ea', 'basket_ea', 'mortar_ea', 'trough_ea'];
const EA_VARIANT = {
  china: { crock: 'jars_ea', wall: 'wall_earth_ea', fence: 'fence_ea', beast: (r) => (r < 0.5 ? 'ox_ea' : 'buffalo_ea'), pig: true },
  korea: { crock: 'jangdok', wall: 'wall_stone_ea', fence: 'fence_ea', beast: () => 'ox_ea', pig: true },
  japan: { crock: 'taru_ea', wall: 'fence_ea', fence: 'fence_ea', beast: () => 'ox_ea', pig: false },
};
export function planDressingEA(rng, kit, props, layout) {
  const R = rng, PD = props.dims, { roadEdge, riverEdge, fieldAt } = layout;
  const items = [], gardens = [], worn = [], trees = [], tall = [], bushes = [];
  const TAU = Math.PI * 2, rr = (a, b) => a + (b - a) * R();
  const VV = EA_VARIANT[kit.variant] || EA_VARIANT.china, camp = !!kit.camp;
  const builds = [...layout.houses, ...layout.farms].map((h) => h.foot);
  const KD = kit.dims || {};
  const fixedFoot = [...(layout.fixed || []).map((f) => { const [L, D] = KD[f.piece] || [4, 4]; return obb(f.x, f.z, f.rot, L / 2, D / 2); }),
    ...layout.stalls.map((q) => obb(q.x, q.z, q.rot, 1.8, 1.4)), ...layout.awnings.map((q) => obb(q.x, q.z, q.rot, 1.8, 1.4))];
  const radius = (p, s = 1) => { const d = PD[p]; return d ? Math.hypot(d[0], d[1]) / 2 * s : 0.5; };
  const TC = 8, tgrid = new Map(); let tmax = 0;
  const takenAdd = (x, z, r) => { const k = Math.floor(x / TC) * 100003 + Math.floor(z / TC); let a = tgrid.get(k); if (!a) tgrid.set(k, a = []); a.push([x, z, r]); if (r > tmax) tmax = r; };
  const takenHit = (x, z, r) => {
    const reach = (r + tmax) * 0.75, g0 = Math.floor((x - reach) / TC), g1 = Math.floor((x + reach) / TC), h0 = Math.floor((z - reach) / TC), h1 = Math.floor((z + reach) / TC);
    for (let gx = g0; gx <= g1; gx++) for (let gz = h0; gz <= h1; gz++) {
      const a = tgrid.get(gx * 100003 + gz); if (!a) continue;
      for (const [tx, tz, tr] of a) if ((x - tx) ** 2 + (z - tz) ** 2 < (r * 0.75 + tr * 0.75) ** 2) return true;
    }
    return false;
  };
  const clear = (x, z, r, own) => roadEdge(x, z) > r * 0.55 + 0.15 && riverEdge(x, z) > RIVER_HW + r * 0.5
    && !builds.some((o) => (o === own ? obbHas(o, x, z, -0.05) : obbHas(o, x, z, r * 0.6))) && !fixedFoot.some((o) => obbHas(o, x, z, r * 0.6))
    && !takenHit(x, z, r);
  const WITHOUT = new Set(kit.without || []);
  const put = (p, x, z, rot, o = {}) => {
    if (WITHOUT.has(p)) return false;      // 시대·땅 갈래로 거른 소품 (recipeFor → without)
    const s = o.s ?? 1, r = o.r ?? radius(p, s);
    if (!o.force && !clear(x, z, r, o.own)) return false;
    const it = { p, x, z, rot, s }; for (const k of ['sx', 'y', 'tint', 'yard', 'flock']) if (o[k] != null) it[k] = o[k];
    items.push(it); if (!o.notake) takenAdd(x, z, r); return true;
  };
  const fence = (p, ax, az, bx, bz, o = {}) => {
    const seg = 2.0, L = Math.hypot(bx - ax, bz - az); if (L < 1.2) return 0;
    const n = Math.max(1, Math.round(L / seg)), sx = L / (n * seg), dx = (bx - ax) / L, dz = (bz - az) / L, rot = Math.atan2(-dz, dx);
    let c = 0;
    for (let k = 0; k < n; k++) {
      if (o.gap != null && (k === o.gap || (o.gap2 != null && k === o.gap2))) continue;
      const t = (k + 0.5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (roadEdge(x, z) < 0.4 || riverEdge(x, z) < RIVER_HW + 0.6 || builds.some((b) => obbHas(b, x, z, 0.2)) || (!o.inFixed && fixedFoot.some((b) => obbHas(b, x, z, 0.2)))) continue;
      items.push({ p, x, z, rot, s: 1, sx }); c++;
      if (R() < 0.3) tall.push([x + rr(-0.8, 0.8) * dx, z + rr(-0.8, 0.8) * dz, rr(0.4, 0.9)]);
    }
    const m = Math.ceil(L / 3); for (let k = 0; k < m; k++) takenAdd(ax + (bx - ax) * (k + 0.5) / m, az + (bz - az) * (k + 0.5) / m, 0.4);
    return c;
  };
  const tree = (sp, x, z, s, r = 2.5, lean = [rr(-0.04, 0.04), rr(-0.04, 0.04)]) => {
    if (!clear(x, z, r) || Math.hypot(x - GREEN.x, z - GREEN.z) < GREEN.r + 2.5 || inRect(VIEW_CLEAR, x, z)) return false;
    trees.push({ sp, x, z, s, lean }); takenAdd(x, z, r); return true;
  };
  const oxTint = () => [[1, 1, 1], [1.15, 1.08, 0.95], [0.85, 0.8, 0.78], [1.25, 1.1, 0.85], [0.55, 0.5, 0.48]][Math.floor(R() * 5)];
  const pigTint = () => [[1, 1, 1], [1.4, 1.3, 1.25], [0.9, 0.85, 0.85]][Math.floor(R() * 3)];
  const duckTint = () => (R() < 0.6 ? [1, 1, 1] : [0.52, 0.42, 0.3]);
  takenAdd(E_.WELL.x - 2.6, E_.WELL.z + 1.2, 1.0); takenAdd(E_.WELL.x + 1.4, E_.WELL.z + 2.8, 1.0);    // 우물가 이야기꾼 자리
  for (const a of layout.awnings) takenAdd(a.x, a.z, 2.0);

  // ── 집마다: 앞마당(평상·장작·바구니), 뒤뜰(텃밭·독·볏가리·절구), 뒤뜰 울, 감나무·대 포기, 소·돼지·닭 ──
  layout.houses.forEach((h, hi) => {
    const { L, D, rot: th, foot: own } = h, loc = (u, v) => obbLocal(own, u, v);
    const c = h.croft, cl = (u, v) => obbLocal(c, u, v), cr = h.face;
    const pit = h.piece === 'pit_house_ea';
    const want = camp ? 1 + Math.floor(R() * 2) : 2 + Math.floor(R() * 4);
    let got = 0;
    const yard = (p, x, z, rot, o = {}) => (got < want && put(p, x, z, rot, { ...o, yard: hi }) ? (got++, true) : false);
    const sg = R() < 0.5 ? 1 : -1;
    const wishes = camp ? [
      () => { const [x, z] = loc(sg * (L / 2 + 0.9), rr(-0.3, 0.3) * D); yard('woodpile_ea', x, z, th + sg * Math.PI / 2, { own, r: 0.8 }); },
      () => { const [x, z] = loc(-sg * (L / 2 + 0.7), D / 2 - 0.2); yard('basket_ea', x, z, th + R() * TAU, { own, r: 0.6 }); },
      () => { const [x, z] = cl(rr(-0.4, 0.4) * c.hx, rr(-0.3, 0.3) * c.hz); yard('mortar_ea', x, z, R() * TAU, { r: 0.6 }); },
    ] : [
      () => { for (const v of [c.hz - 1.6, c.hz - 2.8, 0]) { if (v < -c.hz + 1.0) continue; const [x, z] = cl((R() - 0.5) * Math.max(0, 2 * c.hx - 3.6), v); if (yard('veg_bed_ea', x, z, cr, { r: 1.2 })) { gardens.push(obb(x, z, cr, 1.7, 0.85)); return; } } },
      () => { for (const u of [(R() - 0.5) * Math.max(0, L - 3), 0]) { const [x, z] = loc(u, D / 2 + 1.15); if (yard('bench_ea', x, z, th + (R() - 0.5) * 0.3, { own, r: 0.85 })) return; } },
      () => { const [x, z] = cl(rr(-0.5, 0.5) * Math.max(0.2, c.hx - 1.6), -c.hz + 1.1); yard(VV.crock, x, z, cr + Math.PI, { r: 1.0 }); },
      () => { const [x, z] = loc(sg * (L / 2 + 0.55), rr(-0.25, 0.15) * D); yard('woodpile_ea', x, z, th + sg * Math.PI / 2, { own, r: 0.75, s: rr(0.85, 1.0) }); },
      () => { if (c.hz > 3.0) { const [x, z] = cl(rr(-0.4, 0.4) * c.hx, rr(-0.2, 0.3) * c.hz); yard('straw_stack', x, z, R() * TAU, { s: rr(0.7, 0.9) }); } },
      () => { const [x, z] = loc(-sg * (L / 2 + 0.6), rr(-0.3, 0.3) * D); yard(R() < 0.5 ? 'bales_ea' : 'basket_ea', x, z, th + R() * TAU, { own, r: 0.7 }); },
      () => { const [x, z] = cl(rr(-0.5, 0.5) * Math.max(0.2, c.hx - 1), c.hz - 1.0); yard('mortar_ea', x, z, R() * TAU, { r: 0.65 }); },
    ];
    for (let i = wishes.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [wishes[i], wishes[j]] = [wishes[j], wishes[i]]; }
    for (const w of wishes) { if (got >= want) break; w(); }
    for (let gv = 0; got < (camp ? 1 : 2) && gv < 5; gv++) for (let gu = 0; got < (camp ? 1 : 2) && gu < 7; gu++) {
      const u = (-1 + 2 * (gu + 0.5) / 7) * Math.max(0.2, c.hx - 0.6), v = (-1 + 2 * (gv + 0.5) / 5) * Math.max(0.2, c.hz - 0.5), [x, z] = cl(u, v);
      yard(gu % 2 ? 'basket_ea' : (camp ? 'woodpile_ea' : 'bales_ea'), x, z, R() * TAU, { r: 0.5 });
    }
    worn.push(obb(...loc(0, D / 2 + 0.9), th, L / 2 + 0.2, 1.1));
    worn.push(obb(c.x, c.z, cr, Math.max(0.5, c.hx - 0.6), Math.max(0.5, c.hz - 0.6)));
    if (!camp) {
      // 소 (반쯤의 집, 뒤뜰 구유 곁) · 돼지 (몇 집) · 닭
      if (R() < 0.45) {
        const sp = VV.beast(R()), [x, z] = cl(rr(-0.5, 0.5) * Math.max(0.3, c.hx - 1.5), rr(-0.3, 0.3) * Math.max(0.3, c.hz - 1.2));
        if (put(sp, x, z, cr + Math.PI / 2 + rr(-0.6, 0.6), { r: 1.1, tint: sp === 'ox_ea' ? oxTint() : [1, 1, 1] })) {
          const [tx, tz] = cl(Math.max(-c.hx + 0.9, Math.min(c.hx - 0.9, (x - c.x) * c.c - (z - c.z) * c.s + 1.5)), (x - c.x) * c.s + (z - c.z) * c.c - 1.0);
          put('trough_ea', tx, tz, cr, { r: 0.8 });
        }
      }
      if (VV.pig && R() < 0.22) { const n = 1 + Math.floor(R() * 2), [cx, cz] = cl((R() - 0.5) * c.hx, (R() - 0.5) * c.hz); for (let k = 0; k < n; k++) put('pig', cx + rr(-1.2, 1.2), cz + rr(-1, 1), R() * TAU, { r: 0.5, tint: pigTint() }); }
      if (R() < 0.4) { const n = 3 + Math.floor(R() * 4), [cx, cz] = cl((R() - 0.5) * c.hx, c.hz - 1.0); for (let k = 0; k < n; k++) put('chicken', cx + rr(-2, 2), cz + rr(-1.5, 1.5), R() * TAU, { r: 0.18, notake: true }); }
      // 뒤뜰 울: 뒤 대개, 옆 가끔 (돌담·흙담·바자울)
      const K = [cl(-c.hx, c.hz), cl(-c.hx, -c.hz), cl(c.hx, -c.hz), cl(c.hx, c.hz)];
      const wp = R() < 0.7 ? VV.wall : VV.fence;
      if (R() < 0.6) fence(wp, ...K[1], ...K[2], { gap: R() < 0.4 ? 1 : null });
      if (R() < 0.22) fence(wp, ...K[0], ...K[1]);
      if (R() < 0.22) fence(wp, ...K[2], ...K[3]);
    }
    // 뒤뜰 나무: 감나무 하나 (대개), 집 뒤 대 포기 가끔 / 야영은 소나무·느티
    if (R() < (camp ? 0.4 : 0.75)) {
      const [x, z] = cl((R() - 0.5) * 2 * Math.max(0, c.hx - 1.8), -c.hz + 1.6 + R() * Math.max(0.2, c.hz - 3.0));
      tree(camp ? (R() < 0.6 ? 'pine' : 'zelkova') : 'persimmon', x, z, rr(0.8, 1.1), 1.6);
    }
    if (!camp && R() < 0.25) { const [x, z] = cl(rr(-0.5, 0.5) * c.hx, -c.hz - 1.2); tree('bamboo_s', x, z, rr(0.85, 1.1), 1.6); }
    tall.push([...cl(-c.hx + 0.5, -c.hz + 0.5), rr(0.7, 1.2)], [...cl(c.hx - 0.5, -c.hz + 0.5), rr(0.7, 1.2)]);
    if (pit) tall.push([...loc(sg * (L / 2 + 0.3), -D / 2 - 0.3), rr(0.6, 1.0)]);
  });
  for (const f of layout.farms) {   // 외딴 집·곳간: 볏가리, 소달구지, 장작
    const loc = (u, v) => obbLocal(f.foot, u, v), side = R() < 0.5 ? 1 : -1;
    if (camp) { const [x, z] = loc(side * (f.L / 2 + 1.2), 0); put('woodpile_ea', x, z, R() * TAU, { r: 0.8 }); continue; }
    if (R() < 0.8) { const [x, z] = loc(side * (f.L / 2 + 3.5), rr(-2, 2)); put('straw_stack', x, z, R() * TAU, { s: rr(0.85, 1.0) }); }
    if (R() < 0.6) { const [x, z] = loc(-side * (f.L / 2 + 3.2), f.D / 2 + 2.4); put('cart_ea', x, z, f.rot + rr(-0.5, 0.5)); }
    { const [x, z] = loc(-side * (f.L / 2 + 1.0), 0); put('woodpile_ea', x, z, f.rot - side * Math.PI / 2, { r: 0.8 }); }
    if (R() < 0.5) { const sp = VV.beast(R()), [x, z] = loc(side * (f.L / 2 + 2.5), -f.D / 2 - 2); put(sp, x, z, R() * TAU, { r: 1.1, tint: sp === 'ox_ea' ? oxTint() : [1, 1, 1] }); }
  }

  if (!camp) {
    // ── 장터 (같은 빈터): 좌판은 세트 조각 (stalls·awnings 자리), 둘레에 바구니·가마니·독·평상·소달구지 ──
    worn.push(obb(GREEN.x, GREEN.z, 0.3, GREEN.r + 1, GREEN.r - 1));
    for (let k = 0; k < 14; k++) {
      const a = R() * TAU, d = rr(3.0, 10.5), x = GREEN.x + Math.cos(a) * d, z = GREEN.z + Math.sin(a) * d, pk = ['basket_ea', 'bales_ea', VV.crock === 'jangdok' ? 'jars_ea' : VV.crock, 'basket_ea', 'bales_ea', 'bench_ea'][k % 6];
      put(pk, x, z, pk === 'bench_ea' ? Math.atan2(GREEN.x - x, GREEN.z - z) : R() * TAU, { r: pk === 'bench_ea' ? 0.95 : 0.6 });
    }
    { const a = R() * TAU; put('cart_ea', GREEN.x + Math.cos(a) * 11.5, GREEN.z + Math.sin(a) * 11.5, a + Math.PI / 2, { r: 2.0 }); }
    { const a = R() * TAU, sp = VV.beast(R()); put(sp, GREEN.x + Math.cos(a) * 12.5, GREEN.z + Math.sin(a) * 12.5, R() * TAU, { r: 1.2, tint: sp === 'ox_ea' ? oxTint() : [1, 1, 1] }); }
  }

  // ── 대장간 (야영은 화덕) 마당 (로컬 앞 = +z) ──
  { const o = obb(SMITHY.x, SMITHY.z, SMITHY.rot, 3.5, 3.5), loc = (u, v) => obbLocal(o, u, v), th = SMITHY.rot;
    if (camp) {
      put('woodpile_ea', ...loc(-4.4, 0.6), th - Math.PI / 2, { force: true }); put('basket_ea', ...loc(3.6, 2.2), 0.4, { force: true });
      worn.push(obb(...loc(0, 0.5), th, 4.5, 4.0));
    } else {
      put('trough_ea', ...loc(5.0, 2.6), th + Math.PI / 2, { force: true });
      put('woodpile_ea', ...loc(-4.5, 0.8), th - Math.PI / 2, { force: true });
      put('bales_ea', ...loc(4.4, -1.6), th + 0.7, { force: true, s: 0.9 });
      put('cart_ea', ...loc(7.2, 5.4), th + 0.35, { force: true });
      { const sp = VV.beast(R()); put(sp, ...loc(9.5, 2.2), th + 1.2, { force: true, tint: sp === 'ox_ea' ? oxTint() : [1, 1, 1] }); }
      worn.push(obb(...loc(0.5, 6.2), th, 6.5, 3.2));
    } }
  const fx = (role) => (layout.fixed || []).find((f) => f.role === role);
  // ── 마을 나무 신당: 큰 느티나무 (한국 당산나무·중국 사직 나무·일본 신목), 둘레 밟힌 흙, 평상 하나 ──
  for (const role of ['shrine', 'church']) {
    const S = fx(role); if (!S || S.piece !== 'shrine_ea') continue;
    trees.push({ sp: 'zelkova', x: S.x, z: S.z, s: role === 'shrine' ? 1.25 : 1.1, lean: [0, 0] }); takenAdd(S.x, S.z, 4.0);
    const [bx, bz] = obbLocal(obb(S.x, S.z, S.rot, 1, 1), 4.4, 1.5); put('bench_ea', bx, bz, S.rot + 0.5, { r: 1.0 });
    worn.push(obb(S.x, S.z, S.rot, 6.0, 6.0));
  }
  // ── 우물가: 독·바구니, 밟힌 흙 ──
  { const W = fx('well'); if (W) { const o = obb(W.x, W.z, W.rot, 1.5, 1.5), loc = (u, v) => obbLocal(o, u, v);
    put(VV.crock === 'jangdok' ? 'jars_ea' : VV.crock, ...loc(2.9, 0.6), 0.3, { r: 0.6 }); put('basket_ea', ...loc(-2.8, -1.0), 1.4, { r: 0.6 });
    worn.push(obb(W.x, W.z, W.rot, 3.0, 3.0)); } }
  // ── 절: 마당 담 (산문 자리 트임), 소나무 몇, 법당 앞 밟힌 흙 ──
  { const T = fx('church'), G = fx('tgate');
    if (T && T.piece === 'temple_ea') {
      const Y = E_.TEMPLE_YARD, wp = VV.wall === 'fence_ea' ? 'wall_earth_ea' : VV.wall;
      fence(wp, Y.x0, Y.z0, Y.x1, Y.z0, { inFixed: true }); fence(wp, Y.x0, Y.z0, Y.x0, Y.z1, { inFixed: true }); fence(wp, Y.x1, Y.z0, Y.x1, Y.z1, { inFixed: true });
      if (G) { fence(wp, Y.x0, Y.z1, G.x - 2.3, Y.z1, { inFixed: true }); fence(wp, G.x + 2.3, Y.z1, Y.x1, Y.z1, { inFixed: true }); }
      for (const [x, z] of [[Y.x0 - 4, Y.z0 + 6], [Y.x1 + 4, Y.z0 + 9], [Y.x0 - 5, Y.z1 - 6], [Y.x1 + 5, Y.z1 - 4], [Y.x0 + 3, Y.z0 - 5], [Y.x1 - 2, Y.z0 - 6]]) tree('pine', x, z, rr(0.9, 1.15), 3);
      worn.push(obb(T.x, T.z + 9, 0, 3.0, 8.5));
    } }
  // ── 기와 큰 집: 담 (대문 자리 트임), 마당 장독·볏가리·소, 대문 앞 밟힌 흙 ──
  { const B = fx('bighouse'), G = fx('biggate');
    if (B && !camp) {
      const Y = E_.BIGYARD;
      fence(VV.wall, Y.x0, Y.z0, Y.x1, Y.z0, { inFixed: true }); fence(VV.wall, Y.x0, Y.z0, Y.x0, Y.z1, { inFixed: true }); fence(VV.wall, Y.x1, Y.z0, Y.x1, Y.z1, { inFixed: true });
      const gx = G ? G.x : B.x;
      fence(VV.wall, Y.x0, Y.z1, gx - 2.0, Y.z1, { inFixed: true }); fence(VV.wall, gx + 2.0, Y.z1, Y.x1, Y.z1, { inFixed: true });
      put(VV.crock, Y.x1 - 2.4, Y.z0 + 2.0, Math.PI / 2, { r: 1.0, force: true });
      put('straw_stack', Y.x0 - 3.5, Y.z0 + 3.0, 0.3, { s: 0.95 });
      tree('persimmon', Y.x1 - 2.0, Y.z1 - 3.0, 1.05, 1.5); tree('pine', Y.x0 - 4.0, Y.z1 - 1.0, 1.0, 2.5);
      worn.push(obb(gx, Y.z1 + 2.5, 0, 2.5, 2.2));
    } }
  // ── 개울 디딤돌 (물레방앗간 자리, 물높이에 맞춰) + 빨래 돌·바구니 ──
  if (!camp) {
    let bi = 1, bd = 1e9; RIVER.forEach(([x, z], i) => { const d = Math.hypot(x - E_.STONES.x, z - E_.STONES.z); if (d < bd && i > 0 && i < RIVER.length - 1) { bd = d; bi = i; } });
    const [x0, z0] = RIVER[bi], [x1, z1] = RIVER[bi + 1], L = Math.hypot(x1 - x0, z1 - z0) || 1, tx = (x1 - x0) / L, tz = (z1 - z0) / L;
    put('stones_ea', x0, z0, Math.atan2(-tz, tx) + Math.PI / 2, { force: true, y: WATER_Y - 0.14, r: 1.0 });
    put('basket_ea', x0 - tz * 7.2, z0 + tx * 7.2, 0.3, { r: 0.6 });
  }
  // ── 길가: 세워 둔 소달구지, 길가 풀섶 ──
  const lanePts = LANES.map((lp) => { const pts = smoothLine(lp, 3); return { pts, cum: polyCum(pts) }; });
  if (!camp) {
    let carts = 0;
    for (let t = 0; t < 60 && carts < 3; t++) {
      const { pts, cum } = lanePts[Math.floor(R() * lanePts.length)], p = polyAt(pts, cum, 4 + R() * (cum[cum.length - 1] - 8)), side = R() < 0.5 ? 1 : -1, off = rr(3.2, 4.0);
      if (put('cart_ea', p.x - p.tz * side * off, p.z + p.tx * side * off, Math.atan2(-p.tz, p.tx) + (R() < 0.5 ? 0 : Math.PI) + rr(-0.25, 0.25), { r: 2.0 })) carts++;
    }
  }
  for (const { pts, cum } of lanePts) for (let s = 1; s < cum[cum.length - 1]; s += rr(2.2, 4.0)) {
    const p = polyAt(pts, cum, s), side = R() < 0.5 ? 1 : -1, off = rr(2.0, 2.8), x = p.x - p.tz * side * off, z = p.z + p.tx * side * off;
    if (roadEdge(x, z) > 0.2 && !takenHit(x, z, 0.4) && !builds.some((o) => obbHas(o, x, z, 0.3))) tall.push([x, z, rr(0.35, 0.8)]);
  }
  // ── 개울가: 버들·대숲, 억새·갈대 ──
  for (let i = 1, next = 0; i < RIVER.length - 1; i++) {
    const [x0, z0] = RIVER[i]; if (Math.hypot(x0 - VC.x, z0 - VC.z) > 420) continue;
    next -= Math.hypot(RIVER[i][0] - RIVER[i - 1][0], RIVER[i][1] - RIVER[i - 1][1]); if (next > 0) continue;
    const [x1, z1] = RIVER[i + 1], L = Math.hypot(x1 - x0, z1 - z0) || 1, side = R() < 0.5 ? 1 : -1, off = RIVER_HW + rr(1.6, 4.0);
    const nx = -(z1 - z0) / L * side, nz = (x1 - x0) / L * side;
    const sp = R() < 0.6 ? 'willow' : camp ? 'zelkova' : 'bamboo';
    if (tree(sp, x0 + nx * off, z0 + nz * off, rr(0.85, 1.15), sp === 'bamboo' ? 3.0 : 2.5, [-nz * rr(0.03, 0.1), nx * rr(0.03, 0.1)])) next = rr(14, 30);
    tall.push([x0 + nx * (RIVER_HW + rr(0.5, 2.5)), z0 + nz * (RIVER_HW + rr(0.5, 2.5)), rr(0.9, 1.8)]);
  }
  // ── 마을 둘레 나무: 소나무 숲 (뒷산), 느티·감나무, 대숲 ──
  for (let t = 0, n = 0; t < 160 && n < 16; t++) { const a = R() * TAU, d = rr(60, 160); if (tree(R() < 0.6 ? 'pine' : R() < 0.5 ? 'zelkova' : camp ? 'pine' : 'bamboo', VC.x + Math.cos(a) * d, VC.z + Math.sin(a) * d, rr(0.85, 1.15), 4)) n++; }
  for (let t = 0, n = 0; t < 120 && n < 10; t++) { const a = R() * TAU, d = rr(25, 90); if (tree(camp ? 'pine' : R() < 0.5 ? 'persimmon' : 'zelkova', VC.x + Math.cos(a) * d, VC.z + Math.sin(a) * d, rr(0.8, 1.1), 3)) n++; }
  if (!camp) {
    // ── 풀밭(대장간 동남쪽)과 강가 풀밭: 소 몇·물가 오리 떼 ──
    { const M = PASTURE;
      for (let k = 0, tries = 0; k < 3 && tries < 40; tries++) {
        const x = rr(M.x0 + 3, M.x1 - 3), z = rr(M.z0 + 3, M.z1 - 3);
        if (riverEdge(x, z) < RIVER_HW + 4) continue;
        const sp = VV.beast(R()); if (put(sp, x, z, R() * TAU, { r: 1.3, tint: sp === 'ox_ea' ? oxTint() : [1, 1, 1] })) k++;
      }
      put('straw_stack', M.x1 - 7, M.z1 - 7, R() * TAU, { s: 0.9 }); }
    const near = (cx, cz) => { let best = 0, bd = 1e9; RIVER.forEach(([x, z], i) => { const d = Math.hypot(x - cx, z - cz); if (d < bd) { bd = d; best = i; } }); return best; };
    for (const [cx, cz, di] of [[BRIDGE.x, BRIDGE.z, 5], [BRIDGE.x, BRIDGE.z, -7], [MEADOW.x0, MEADOW.z1, 0]]) {
      const i = Math.max(1, Math.min(RIVER.length - 2, near(cx, cz) + di)), [x0, z0] = RIVER[i], [x1, z1] = RIVER[i + 1], L = Math.hypot(x1 - x0, z1 - z0) || 1, flow = Math.atan2(-(z1 - z0) / L, (x1 - x0) / L);
      const n = 3 + Math.floor(R() * 4);
      for (let k = 0; k < n; k++) {
        const t = rr(-1.5, 1.5), side = rr(-2.6, 2.6), x = x0 + (x1 - x0) / L * t * 2 - (z1 - z0) / L * side, z = z0 + (z1 - z0) / L * t * 2 + (x1 - x0) / L * side;
        items.push({ p: 'duck_ea', x, z, rot: flow + (R() < 0.7 ? 0 : Math.PI) + rr(-0.6, 0.6), s: rr(0.9, 1.05), y: WATER_Y - 0.01, tint: duckTint() });
      }
    }
    // ── 논가: 볏단 걸대·볏가리 (서로 30 m 넘게) ──
    const hs = [];
    for (let t = 0; t < 400 && hs.length < 10; t++) {
      const a = R() * TAU, d = rr(150, 420), x = VC.x + Math.cos(a) * d, z = VC.z + Math.sin(a) * d * 0.85, f = fieldAt(x, z);
      if (!f || (f.type !== 2 && f.type !== 3 && f.type !== 1) || f.edge < 2.5 || f.edge > 8 || hs.some(([hx, hz]) => Math.hypot(hx - x, hz - z) < 30)) continue;
      if (put(hs.length % 2 ? 'straw_stack' : 'rice_rack', x, z, R() * TAU, { s: rr(0.9, 1.05) })) hs.push([x, z]);
    }
  }
  return { items, gardens, worn, trees, tall, bushes };
}

// ───────────────────────── 환경: 강·길 색인 + 밭 조각보 ─────────────────────────
export function makeEnv() {
  const riverIdx = new SegIndex([{ pts: smoothLine(RIVER_PTS, 14), w: 0 }], 64, 420);
  const roadLines = ROADS.map((r) => ({ pts: smoothLine(r.pts, 4), w: r.w }));
  const roadIdx = new SegIndex(roadLines, 32, 24);
  // 밭 조각보 (지터 격자 사각형)
  const FS = 118, FN = 60, FOFF = FN / 2;          // 칸 크기, 칸 수 (±3.5km)
  const gp = [];                                   // 격자점
  for (let j = 0; j <= FN; j++) { gp[j] = []; for (let i = 0; i <= FN; i++) { const x = (i - FOFF) * FS + VC.x, z = (j - FOFF) * FS + VC.z; gp[j][i] = [x + (hash2(i, j, 11) - 0.5) * 62, z + (hash2(i, j, 12) - 0.5) * 62]; } }
  const fieldType = (i, j) => {
    const cx = (gp[j][i][0] + gp[j + 1][i + 1][0]) / 2, cz = (gp[j][i][1] + gp[j + 1][i + 1][1]) / 2;
    if (Math.hypot(cx - VC.x, cz - VC.z) < 150) return 0;   // 마을 공유지 풀밭
    const r = hash2(i, j, 13);
    return r < 0.42 ? 1 : r < 0.64 ? 2 : r < 0.82 ? 3 : 4;   // 1 풀밭, 2 밀, 3 갈아엎은 밭, 4 휴경(누런 풀)
  };
  const cross = (ax, az, bx, bz, px, pz) => (bx - ax) * (pz - az) - (bz - az) * (px - ax);
  function findCell(x, z) {
    const i0 = Math.floor((x - VC.x) / FS + FOFF), j0 = Math.floor((z - VC.z) / FS + FOFF);
    for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
      const i = i0 + di, j = j0 + dj; if (i < 0 || j < 0 || i >= FN || j >= FN) continue;
      const a = gp[j][i], b = gp[j][i + 1], c = gp[j + 1][i + 1], d = gp[j + 1][i];
      // 사각형 a→b→c→d (같은 감김이면 안)
      const s1 = cross(a[0], a[1], b[0], b[1], x, z), s2 = cross(b[0], b[1], c[0], c[1], x, z), s3 = cross(c[0], c[1], d[0], d[1], x, z), s4 = cross(d[0], d[1], a[0], a[1], x, z);
      if ((s1 >= 0 && s2 >= 0 && s3 >= 0 && s4 >= 0) || (s1 <= 0 && s2 <= 0 && s3 <= 0 && s4 <= 0)) {
        const e = Math.min(Math.sqrt(segDist2(x, z, a[0], a[1], b[0], b[1])), Math.sqrt(segDist2(x, z, b[0], b[1], c[0], c[1])), Math.sqrt(segDist2(x, z, c[0], c[1], d[0], d[1])), Math.sqrt(segDist2(x, z, d[0], d[1], a[0], a[1])));
        return { i, j, edge: e };
      }
    }
    return null;
  }
  const hedgeOn = (i, j, dir) => hash2(i, j, 20 + dir) < 0.86;   // 칸 (i,j) 의 아래(0)/왼쪽(1) 변에 산울타리
  const fieldAt = (x, z) => { const c = findCell(x, z); return c ? { type: fieldType(c.i, c.j), edge: c.edge } : null; };
  return {
    riverIdx, roadIdx, roadLines, FS, FN, FOFF, gp, fieldType, findCell, hedgeOn, fieldAt,
    roadEdge: (x, z) => roadIdx.edge(x, z), riverEdge: (x, z) => riverIdx.edge(x, z),
  };
}

// ───────────────────────── 마을 짜기 (시드) ─────────────────────────
// env = makeEnv() (roadEdge·riverEdge 만 쓴다), recipe = RECIPES[세트] (없으면 잉글랜드). 돌려주는 것:
//   houses: [{ piece, kind, x, z, rot, s, L, D, foot(OBB), croft(OBB, 늘 있다), n:[x,z](집→뒤뜰), t:[x,z](길 방향), face, lane, gable, set }]
//   farms: 외딴 농가 (croft 없음), stalls: 장터 좌판 자리 2 (세트 market_stall), awnings: 천막 자리 3~5 (소품 cloth_awning)
//   fixed: 정한 자리 큰 조각 [{ role, piece, x, z, rot, base? }] (교회·대장간·물레방앗간·우물 / 사원·대장간·가트·우물·신당·큰 집·곳간)
// 잉글랜드는 요리법을 받기 전과 같은 차례로 난수를 뽑는다 (같은 시드 = 같은 마을).
export function planVillage(seed, env, recipe = RECIPES.england) {
  const RC = recipe, POOL = RC.pool, DIMS = RC.dims;
  const R = rng(Math.imul(seed, 2654435761) >>> 0);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const bags = Object.fromEntries(Object.entries(POOL).map(([k, v]) => [k, shuffle([...v])]));
  const take = (kind) => { let b = bags[kind]; if (!b.length) b = bags[kind] = shuffle([...POOL[kind]]); return b.shift(); };
  const give = (kind, p) => bags[kind].unshift(p);
  const reserved = (x, z, pad) => RC.reserved(x, z, pad);
  const boxes = [];   // 이미 쓴 땅 (집 + 뒤뜰)
  for (const f of RC.fixedFoot || []) boxes.push(f);
  const fitsHouse = (o) => obbRim(o).every(([x, z]) => env.roadEdge(x, z) > 0.8 && env.riverEdge(x, z) > RIVER_HW + 3 && !reserved(x, z, 0)) && !boxes.some((b) => obbOverlap(b, o, 1.2));
  const fitsCroft = (o) => obbRim(o, 3).every(([x, z]) => env.roadEdge(x, z) > 0.4 && env.riverEdge(x, z) > RIVER_HW + 1.5 && !reserved(x, z, -1)) && !boxes.some((b) => obbOverlap(b, o, 0.4));
  const houses = [], farms = [];
  for (const f of FARMS) {
    const piece = take(RC.farmKind(f.kind)), s = 0.95 + R() * 0.1, [L, D] = DIMS[piece], rot = f.rot + Math.PI / 2 + (R() - 0.5) * 0.06;
    const foot = obb(f.x, f.z, rot, L * s / 2, D * s / 2);
    farms.push({ piece, x: f.x, z: f.z, rot, s, L: L * s, D: D * s, foot, croft: null, kind: f.kind }); boxes.push(foot);
  }
  const [gap0, gapR] = RC.gap, [set0, setR] = RC.setback;
  LANES.forEach((lp, li) => {
    const pts = smoothLine(lp, 3), cum = polyCum(pts), total = cum[cum.length - 1];
    for (const side of [1, -1]) {
      let s = 2 + R() * 5, last = null;
      while (s < total - 5) {
        const kind = RC.kindOf(R(), li);
        let piece = take(kind);
        if (piece === last) { const k = bags[kind].findIndex((q) => q !== piece); if (k >= 0) { const q = bags[kind].splice(k, 1)[0]; give(kind, piece); piece = q; } }   // 옆집과 같은 조각은 피한다
        const sc = 0.95 + R() * 0.1, [L0, D0] = DIMS[piece], L = L0 * sc, D = D0 * sc;
        const gable = !RC.noGable.includes(piece) && R() < RC.gableP;
        const front = gable ? D : L, deep = gable ? L : D;
        const p = polyAt(pts, cum, s + front / 2), nx = -p.tz * side, nz = p.tx * side;   // n: 길 → 집
        const set = 2.2 + set0 + R() * setR;                                             // 길 가운데에서 집 앞벽까지
        const cx = p.x + nx * (set + deep / 2), cz = p.z + nz * (set + deep / 2);
        const face = Math.atan2(-nx, -nz);                                              // 세트 앞(+z)이 길을 본다
        const rot = face + (gable ? (R() < 0.5 ? 1 : -1) * Math.PI / 2 : 0) + (R() - 0.5) * 0.06;
        const foot = obb(cx, cz, rot, L / 2, D / 2);
        // 뒤뜰(croft)이 없으면 집도 세우지 않는다: 집마다 마당이 있다
        let croft = null;
        if (fitsHouse(foot)) {
          boxes.push(foot);
          for (const k of [1, 0.7, 0.45, 0.32]) {
            const cd = (9 + R() * 8) * k * RC.croftK, c = set + deep + 0.6 + cd / 2;
            const o = obb(p.x + nx * c, p.z + nz * c, face, front / 2 + 1.2, cd / 2);
            if (fitsCroft(o)) { croft = o; break; }
          }
          boxes.pop();
        }
        if (!croft) { give(kind, piece); s += 2 + R() * 3; continue; }
        boxes.push(foot, croft);
        houses.push({ piece, kind, x: cx, z: cz, rot, s: sc, L, D, foot, croft, n: [nx, nz], t: [p.tx * side, p.tz * side], face, lane: li, gable, set }); last = piece;
        s += front + gap0 + R() * gapR;
      }
    }
  });
  if (RC.noMarket) return { houses, farms, stalls: [], awnings: [], boxes, fixed: RC.fixed, kit: RC.kit };   // 동아시아 농사 전 야영: 장터 없음
  // ── 장터 (빈터 둘레 → 안쪽 순으로 자리를 찾아): 세트 좌판 2 + 천막 3~5 ──
  // 자리 후보: 반지름 7.4·6.2·4.6·2.6 m 고리 위 15° 마다 (시드로 시작 각을 돌린다) + 가운데. 앞이 빈터 가운데를 본다.
  // 길 가장자리에서 0.6 m 넘게, 이미 고른 자리와 1 m 넘게 떨어져야 한다 (다 못 채우면 간격을 0.5 m 로 줄여 한 번 더).
  const a0 = R() * Math.PI * 2, cand = [];
  for (const rad of [7.4, 6.2, 4.6, 2.6]) { const ring = []; for (let k = 0; k < 24; k++) { const a = a0 + k * Math.PI / 12, x = GREEN.x + Math.cos(a) * rad, z = GREEN.z + Math.sin(a) * rad; ring.push({ x, z, rot: Math.atan2(GREEN.x - x, GREEN.z - z) }); } cand.push(...shuffle(ring)); }
  cand.push({ x: GREEN.x, z: GREEN.z, rot: a0 });
  const wantAwn = 3 + Math.floor(R() * 3);
  const pickMarket = (gapPad) => {
    const chosen = [];
    const tryPick = (hx, hz, n) => {
      const got = [];
      for (const q of cand) {
        if (got.length >= n) break;
        const o = obb(q.x, q.z, q.rot, hx, hz);
        if (!obbRim(o, 2).every(([x, z]) => env.roadEdge(x, z) > 0.6)) continue;
        if (chosen.some((c) => obbOverlap(c.o, o, gapPad))) continue;
        const it = { ...q, o }; chosen.push(it); got.push(q);
      }
      return got;
    };
    const stalls = tryPick(1.75, 1.25, 2), awnings = tryPick(1.9, 1.7, wantAwn);
    return { stalls, awnings };
  };
  let market = pickMarket(1.0);
  if (market.awnings.length < 3 || market.stalls.length < 2) market = pickMarket(0.5);
  return { houses, farms, stalls: market.stalls, awnings: market.awnings, boxes, fixed: RC.fixed, kit: RC.kit };
}

// ───────────────────────── 마을 꾸미기 (시드) ─────────────────────────
// rng: 난수 함수 () → [0,1), kit: { dims: KIT_DIMS }(쓰지 않지만 인터페이스로 받는다), props: { dims: PROP_DIMS }(소품 바닥 크기),
// layout: planVillage 결과 + makeEnv() 의 { roadEdge, riverEdge, fieldAt }.
// 이 모듈의 배치 상수(SMITHY·MILL·CHURCH·GREEN·RIVER·BRIDGE·LANES·VC·FOREGROUND …)를 함께 읽는다.
// 돌려주는 것:
//   items:   [{ p: 소품 조각 이름, x, z, rot, s, sx?(길이 방향 늘임), y?(정한 높이, 없으면 땅), tint?: [r,g,b], yard?: 집 번호, flock?: 'main'|'far' }]
//   gardens: 텃밭 흙 자리 [OBB] (땅 그림의 흙), worn: 밟혀 드러난 흙 [OBB] (앞마당·장터·일터)
//   trees:   [{ sp: 'apple'|'willow'|'oak'|'ash'|'birch'|'hawthorn', x, z, s, lean: [기울기 x, 기울기 z] }]
//   tall:    키 큰 풀 무더기 [[x, z, 반지름]] (울타리 밑·뒤뜰 구석·물가)
//   bushes:  전경 덤불 자리 [[x, z, 크기]] (realscene 이 ez-tree 덤불로 그린다)
export function planDressing(rng, kit, props, layout) {
  const R = rng, PD = props.dims, { roadEdge, riverEdge, fieldAt } = layout;
  const items = [], gardens = [], worn = [], trees = [], tall = [], bushes = [];
  const TAU = Math.PI * 2, rr = (a, b) => a + (b - a) * R();
  const builds = [...layout.houses, ...layout.farms].map((h) => h.foot);
  const fixedFoot = [obb(SMITHY.x, SMITHY.z, SMITHY.rot, 3.7, 3.7), obb(MILL.x, MILL.z, MILL.rot + Math.PI / 2, 4.8, 4.6),
    obb(CHURCH.x, CHURCH.z, CHURCH.rot, 15.6, 6.6), obb(WELL.x, WELL.z, WELL.rot, 1.7, 1.7), ...layout.stalls.map((q) => obb(q.x, q.z, q.rot, 1.8, 1.4))];
  const radius = (p, s = 1) => { const d = PD[p]; return d ? Math.hypot(d[0], d[1]) / 2 * s : 0.5; };
  // 이미 쓴 자리 [x, z, r] 를 8 m 칸 색인에 둔다 (겹침 묻기를 빨리)
  const TC = 8, tgrid = new Map(); let tmax = 0;
  const takenAdd = (x, z, r) => { const k = Math.floor(x / TC) * 100003 + Math.floor(z / TC); let a = tgrid.get(k); if (!a) tgrid.set(k, a = []); a.push([x, z, r]); if (r > tmax) tmax = r; };
  const takenHit = (x, z, r) => {
    const reach = (r + tmax) * 0.75, g0 = Math.floor((x - reach) / TC), g1 = Math.floor((x + reach) / TC), h0 = Math.floor((z - reach) / TC), h1 = Math.floor((z + reach) / TC);
    for (let gx = g0; gx <= g1; gx++) for (let gz = h0; gz <= h1; gz++) {
      const a = tgrid.get(gx * 100003 + gz); if (!a) continue;
      for (const [tx, tz, tr] of a) if ((x - tx) ** 2 + (z - tz) ** 2 < (r * 0.75 + tr * 0.75) ** 2) return true;
    }
    return false;
  };
  // 놓을 수 있나: 길·강·건물(own 은 제 집: 벽에 붙는 소품용) 밖, 이미 놓은 것과 안 겹침
  const clear = (x, z, r, own) => roadEdge(x, z) > r * 0.55 + 0.15 && riverEdge(x, z) > RIVER_HW + r * 0.5
    && !builds.some((o) => (o === own ? obbHas(o, x, z, -0.05) : obbHas(o, x, z, r * 0.6))) && !fixedFoot.some((o) => obbHas(o, x, z, r * 0.6))
    && !takenHit(x, z, r);
  const put = (p, x, z, rot, o = {}) => {
    const s = o.s ?? 1, r = o.r ?? radius(p, s);
    if (!o.force && !clear(x, z, r, o.own)) return false;
    const it = { p, x, z, rot, s }; for (const k of ['sx', 'y', 'tint', 'yard', 'flock']) if (o[k] != null) it[k] = o[k];
    items.push(it); if (!o.notake) takenAdd(x, z, r); return true;
  };
  // 울타리·담 줄: 조각(rail 2.5 m, wattle·stone 2 m)을 이어 놓고 길이에 맞게 조금 늘인다. 길·강·건물 위는 건너뛴다
  const fence = (p, ax, az, bx, bz, o = {}) => {
    const seg = p === 'rail_fence' ? 2.5 : 2.0, L = Math.hypot(bx - ax, bz - az); if (L < 1.2) return 0;
    const n = Math.max(1, Math.round(L / seg)), sx = L / (n * seg), dx = (bx - ax) / L, dz = (bz - az) / L, rot = Math.atan2(-dz, dx);
    let c = 0;
    for (let k = 0; k < n; k++) {
      if (o.gap && k === o.gap) continue;
      const t = (k + 0.5) / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (roadEdge(x, z) < 0.4 || riverEdge(x, z) < RIVER_HW + 0.6 || builds.some((b) => obbHas(b, x, z, 0.2)) || fixedFoot.some((b) => obbHas(b, x, z, 0.2))) continue;
      items.push({ p, x, z, rot, s: 1, sx }); c++;
      if (R() < 0.45) tall.push([x + rr(-0.8, 0.8) * dx, z + rr(-0.8, 0.8) * dz, rr(0.5, 1.0)]);
    }
    const m = Math.ceil(L / 3); for (let k = 0; k < m; k++) takenAdd(ax + (bx - ax) * (k + 0.5) / m, az + (bz - az) * (k + 0.5) / m, 0.4);
    return c;
  };
  // 사람 자리(우물가 이야기꾼)는 비워 둔다
  takenAdd(6, -10, 1.0); takenAdd(4.2, -11.8, 1.0);

  // ── 장터 천막 자리를 먼저 잡는다 (집 소품이 빈터 가장자리를 먼저 차지하지 않게) ──
  for (const a of layout.awnings) takenAdd(a.x, a.z, 2.0);

  // ── 집마다: 마당 소품 2~5개 (장작·통·텃밭·걸상·자루·상자·연장 걸이·건초) + 꽃·울타리·사과나무·닭 ──
  layout.houses.forEach((h, hi) => {
    const { L, D, rot: th, foot: own } = h, loc = (u, v) => obbLocal(own, u, v);
    const c = h.croft, cl = (u, v) => obbLocal(c, u, v), cr = h.face;
    const want = 2 + Math.floor(R() * 4);   // 이 집 마당 소품 수 (2~5)
    let got = 0;
    const yard = (p, x, z, rot, o = {}) => (got < want && put(p, x, z, rot, { ...o, yard: hi }) ? (got++, true) : false);
    const sg = R() < 0.5 ? 1 : -1, gs = R() < 0.5 ? 1 : -1;
    // 바라는 것 (차례는 시드로 섞되 텃밭을 먼저 본다). 저마다 자리 후보 몇 곳을 차례로 해 본다
    const wishes = [
      () => { for (const v of [c.hz - 2.0, c.hz - 3.2, 0]) { if (v < -c.hz + 1.2) continue; for (const u of [(R() - 0.5) * Math.max(0, 2 * c.hx - 4.2), 0]) { const [x, z] = cl(u, v); if (yard('vegetable_bed', x, z, cr, { r: 1.2 })) { gardens.push(obb(x, z, cr, 1.9, 0.95)); return; } } } },
    ];
    const rest = [
      () => { for (const v of [rr(-0.25, 0.15) * D, 0]) { const [x, z] = loc(gs * (L / 2 + 0.6), v); if (yard('woodpile', x, z, th + gs * Math.PI / 2, { own, r: 0.55, s: rr(0.8, 1.0) })) return; } },
      () => { const n = 1 + Math.floor(R() * 3); for (let k = 0; k < n; k++) { const [x, z] = loc(-gs * (L / 2 + 0.42), D / 2 - 0.45 - k * 0.7); yard('barrel', x, z, R() * TAU, { own, r: 0.32, s: rr(0.9, 1.05) }); } },
      () => { for (const u of [sg * (L / 2 - 1.4 - R() * 0.8), -sg * (L / 2 - 1.6)]) { const [x, z] = loc(u, D / 2 + 0.42); if (yard('bench', x, z, th, { own, r: 0.5 })) return; } },
      () => { const [x, z] = loc((R() - 0.5) * (L - 3), -D / 2 - 0.65); yard(R() < 0.5 ? 'sacks' : 'crate', x, z, th + R() * TAU, { own, r: 0.55 }); },
      () => { if (R() < 0.5) { const [x, z] = loc((R() - 0.5) * (L - 3), -D / 2 - 0.42); yard('tool_rack', x, z, th + Math.PI, { own, r: 0.5 }); } },
      () => { if (c.hz > 4.2 && R() < 0.5) { const [x, z] = cl((R() - 0.5) * Math.max(0, 2 * c.hx - 4.2), c.hz - 4.4); if (yard('vegetable_bed', x, z, cr, { r: 1.2 })) gardens.push(obb(x, z, cr, 1.9, 0.95)); } },
      () => { if (c.hz > 5.8 && R() < 0.2) { const [x, z] = cl((R() - 0.5) * Math.max(0, c.hx - 2.4), -c.hz + 2.6); yard('haystack', x, z, R() * TAU, { s: rr(0.75, 0.9) }); } },
    ];
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }
    for (const w of [...wishes, ...rest]) { if (got >= want) break; w(); }
    // 아직 2개가 안 되면 뒤뜰 안 칸을 차례로 훑어 통·상자를 둔다 (뒤뜰은 길·강·다른 집과 겹치지 않게 잡혀 있다)
    for (let gv = 0; got < 2 && gv < 5; gv++) for (let gu = 0; got < 2 && gu < 7; gu++) {
      const u = (-1 + 2 * (gu + 0.5) / 7) * Math.max(0.2, c.hx - 0.6), v = (-1 + 2 * (gv + 0.5) / 5) * Math.max(0.2, c.hz - 0.5), [x, z] = cl(u, v);
      yard(gu % 2 ? 'crate' : 'barrel', x, z, R() * TAU, { r: 0.35 });
    }
    // 마당 소품으로 세지 않는 것: 앞 꽃밭, 앞마당 밟힌 흙, 뒤뜰 울타리·사과나무·닭, 구석 키 큰 풀
    const nf = R() < 0.6 ? 1 + (R() < 0.4 ? 1 : 0) : 0;
    for (let k = 0; k < nf; k++) { const [x, z] = loc((R() - 0.5) * (L - 2.2), D / 2 + 0.9); put('flower_patch', x, z, th + (R() - 0.5) * 0.4, { own, s: rr(0.5, 0.8), r: 0.55 }); }
    if (!h.gable) worn.push(obb(...loc(0, D / 2 + 1.0), th, L / 2 - 0.5, 1.0));
    tall.push([...loc(sg * (L / 2 + 0.3), -D / 2 - 0.3), rr(0.6, 1.1)], [...loc(-sg * (L / 2 + 0.3), -D / 2 - 0.3), rr(0.4, 0.9)]);
    const K = [cl(-c.hx, c.hz), cl(-c.hx, -c.hz), cl(c.hx, -c.hz), cl(c.hx, c.hz)];
    fence(R() < 0.35 ? 'wattle_fence' : 'rail_fence', ...K[1], ...K[2]);
    if (R() < 0.8) fence('rail_fence', ...K[0], ...K[1]);
    if (R() < 0.8) fence('rail_fence', ...K[2], ...K[3]);
    if (R() < 0.72) {
      const n = 1 + (R() < 0.35 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const [x, z] = cl((R() - 0.5) * 2 * Math.max(0, c.hx - 1.8), -c.hz + 1.8 + R() * Math.max(0.2, c.hz - 3.2));
        if (clear(x, z, 1.2) && !inRect(VIEW_CLEAR, x, z)) { trees.push({ sp: 'apple', x, z, s: rr(0.78, 1.12), lean: [rr(-0.06, 0.06), rr(-0.06, 0.06)] }); takenAdd(x, z, 1.4); }
      }
    }
    if (R() < 0.35) { const n = 3 + Math.floor(R() * 4), [cx, cz] = cl((R() - 0.5) * c.hx, c.hz - 1.2); for (let k = 0; k < n; k++) put('chicken', cx + rr(-2, 2), cz + rr(-1.5, 1.5), R() * TAU, { r: 0.18, notake: true }); }
    tall.push([...cl(-c.hx + 0.5, -c.hz + 0.5), rr(0.8, 1.4)], [...cl(c.hx - 0.5, -c.hz + 0.5), rr(0.8, 1.4)]);
  });
  for (const f of layout.farms) {   // 외딴 농가: 건초더미·수레·장작
    const loc = (u, v) => obbLocal(f.foot, u, v), side = R() < 0.5 ? 1 : -1;
    if (R() < 0.75) { const [x, z] = loc(side * (f.L / 2 + 4.5), rr(-2, 2)); put('haystack', x, z, R() * TAU, { s: rr(0.75, 0.95) }); }
    if (R() < 0.55) { const [x, z] = loc(-side * (f.L / 2 + 3), f.D / 2 + 2.5); put('cart', x, z, f.rot + rr(-0.5, 0.5)); }
    { const [x, z] = loc(-side * (f.L / 2 + 0.6), 0); put('woodpile', x, z, f.rot - side * Math.PI / 2, { own: f.foot, r: 0.5 }); }
  }

  // ── 장터 (교회 앞 빈터): 천막 + 물건, 둘레에 통·상자·자루·수레·걸상 ──
  const AWN = [[1, 1, 1], [0.95, 1.05, 1.0], [1.05, 0.95, 0.9], [0.9, 1.0, 1.08], [1.0, 0.92, 1.0]];
  layout.awnings.forEach((a, k) => {
    put('cloth_awning', a.x, a.z, a.rot, { force: true, notake: true, r: 2.0, tint: AWN[k % AWN.length] });
    items.push({ p: 'market_goods', x: a.x, z: a.z, rot: a.rot, s: 1 });
  });
  worn.push(obb(GREEN.x, GREEN.z, 0.3, GREEN.r + 1, GREEN.r - 1));
  for (let k = 0; k < 14; k++) {
    const a = R() * TAU, d = rr(3.0, 10.5), x = GREEN.x + Math.cos(a) * d, z = GREEN.z + Math.sin(a) * d, pk = ['barrel', 'barrel', 'crate', 'sacks', 'crate', 'bench'][k % 6];
    put(pk, x, z, pk === 'bench' ? Math.atan2(GREEN.x - x, GREEN.z - z) : R() * TAU, { r: pk === 'bench' ? 0.7 : 0.45 });
  }
  { const a = R() * TAU; put('cart', GREEN.x + Math.cos(a) * 11.5, GREEN.z + Math.sin(a) * 11.5, a + Math.PI / 2, { r: 1.5 }); }
  for (let k = 0; k < 3; k++) { const a = R() * TAU, d = rr(11, 14); put('flower_patch', GREEN.x + Math.cos(a) * d, GREEN.z + Math.sin(a) * d, R() * TAU, { s: rr(0.6, 0.9), r: 0.6 }); }

  // ── 대장간 마당 (대장간 로컬: 앞 = +z 트인 쪽) ──
  { const o = obb(SMITHY.x, SMITHY.z, SMITHY.rot, 3.5, 3.5), loc = (u, v) => obbLocal(o, u, v), th = SMITHY.rot;
    put('trough', ...loc(5.0, 2.6), th + Math.PI / 2, { force: true });
    put('tool_rack', ...loc(-4.45, 0.6), th - Math.PI / 2, { force: true });
    put('barrel', ...loc(4.35, -1.7), 0.4, { force: true }); put('barrel', ...loc(4.5, -0.95), 1.9, { force: true }); put('barrel', ...loc(-4.4, 2.7), 3.0, { force: true, s: 0.92 });
    put('woodpile', ...loc(0.3, -4.35), th + Math.PI, { force: true });
    put('sacks', ...loc(-4.6, 1.8), th + 0.7, { force: true, s: 0.9 });
    put('horse', ...loc(6.6, 4.4), th + 0.35, { force: true, tint: [1.0, 0.82, 0.7] });
    worn.push(obb(...loc(0.5, 6.2), th, 6.5, 3.2)); }
  // ── 물레방앗간 앞 (로컬 앞 = +z) ──
  { const th = MILL.rot + Math.PI / 2, o = obb(MILL.x, MILL.z, th, 4.6, 4.4), loc = (u, v) => obbLocal(o, u, v);
    put('sacks', ...loc(2.3, 5.6), th + 0.3); put('sacks', ...loc(-1.6, 5.9), th + 2.1, { s: 0.9 }); put('barrel', ...loc(4.6, 5.2), 0.7);
    put('cart', ...loc(6.5, 8.5), th + 0.5, { r: 1.4 });
    worn.push(obb(...loc(0.5, 6.5), th, 5.5, 2.4)); }
  // ── 우물가 ──
  { const o = obb(WELL.x, WELL.z, WELL.rot, 1.5, 1.5), loc = (u, v) => obbLocal(o, u, v);
    put('trough', ...loc(-2.9, 0.6), WELL.rot + Math.PI / 2, { r: 0.8 }); put('bench', ...loc(0.4, -2.8), WELL.rot + Math.PI, { r: 0.6 });
    put('flower_patch', ...loc(2.8, -1.6), WELL.rot, { s: 0.7, r: 0.6 }); put('barrel', ...loc(-2.4, -1.9), 0.3, { r: 0.35 });
    worn.push(obb(WELL.x, WELL.z, WELL.rot, 2.4, 2.4)); }

  // ── 길가: 세워 둔 수레, 꽃 무더기 ──
  const lanePts = LANES.map((lp) => { const pts = smoothLine(lp, 3); return { pts, cum: polyCum(pts) }; });
  let carts = 0;
  for (let t = 0; t < 60 && carts < 6; t++) {
    const { pts, cum } = lanePts[Math.floor(R() * lanePts.length)], p = polyAt(pts, cum, 4 + R() * (cum[cum.length - 1] - 8)), side = R() < 0.5 ? 1 : -1, off = rr(3.6, 4.4);
    if (put('cart', p.x - p.tz * side * off, p.z + p.tx * side * off, Math.atan2(-p.tz, p.tx) + (R() < 0.5 ? 0 : Math.PI) + rr(-0.25, 0.25), { r: 1.5 })) carts++;
  }
  for (let t = 0; t < 40; t++) {
    const { pts, cum } = lanePts[Math.floor(R() * lanePts.length)], p = polyAt(pts, cum, R() * cum[cum.length - 1]), side = R() < 0.5 ? 1 : -1, off = rr(2.6, 3.6);
    put('flower_patch', p.x - p.tz * side * off, p.z + p.tx * side * off, R() * TAU, { s: rr(0.45, 0.8), r: 0.5 });
  }
  // 길가 풀섶: 길 가장자리를 따라 키 큰 풀 (집 앞 흙과 길 사이가 맨땅으로 넓게 비지 않게)
  for (const { pts, cum } of lanePts) for (let s = 1; s < cum[cum.length - 1]; s += rr(2.2, 4.0)) {
    const p = polyAt(pts, cum, s), side = R() < 0.5 ? 1 : -1, off = rr(2.3, 3.0), x = p.x - p.tz * side * off, z = p.z + p.tx * side * off;
    if (roadEdge(x, z) > 0.2 && !takenHit(x, z, 0.4) && !builds.some((o) => obbHas(o, x, z, 0.3))) tall.push([x, z, rr(0.35, 0.8)]);
  }

  // ── 다리 둘레 물가 (전경): 키 큰 풀·꽃 무더기, 다리 건너 길가 풀섶 ──
  for (let i = 1; i < RIVER.length - 1; i++) {
    const [x0, z0] = RIVER[i]; if (Math.hypot(x0 - BRIDGE.x, z0 - BRIDGE.z) > 120) continue;
    const [x1, z1] = RIVER[i + 1], L = Math.hypot(x1 - x0, z1 - z0) || 1, nx = -(z1 - z0) / L, nz = (x1 - x0) / L;
    for (const side of [1, -1]) {
      const off = RIVER_HW + rr(0.8, 4.5), x = x0 + nx * side * off, z = z0 + nz * side * off;
      if (Math.hypot(x - BRIDGE.x, z - BRIDGE.z) < 9 || roadEdge(x, z) < 0.6) continue;
      tall.push([x, z, rr(0.8, 1.9)]);
      if (R() < 0.3) put('flower_patch', x + nx * side * 1.2, z + nz * side * 1.2, R() * TAU, { s: rr(0.6, 1.0), r: 0.6 });
    }
  }
  { const pts = smoothLine([[-39, 33], [-60, 51], [-95, 86], [-150, 140]], 3), cum = polyCum(pts);
    for (let s = 10; s < cum[cum.length - 1]; s += rr(2.5, 4.5)) {
      const p = polyAt(pts, cum, s), side = R() < 0.5 ? 1 : -1, off = rr(2.6, 4.2), x = p.x - p.tz * side * off, z = p.z + p.tx * side * off;
      tall.push([x, z, rr(0.7, 1.5)]);
      if (R() < 0.3) put('flower_patch', x, z, R() * TAU, { s: rr(0.55, 0.9), r: 0.5 });
    } }
  // ── 전경 비탈 (overview 카메라 앞, 다리 남서쪽): 덤불 무더기·키 큰 풀·꽃·막쌓은 돌담 한 줄 ──
  { const F = FOREGROUND;
    for (let t = 0, n = 0; t < 260 && n < 34; t++) {
      const a = R() * TAU, d = Math.sqrt(R()) * F.r, x = F.x + Math.cos(a) * d, z = F.z + Math.sin(a) * d;
      if (roadEdge(x, z) < 1.2 || riverEdge(x, z) < RIVER_HW + 0.8 || takenHit(x, z, 1.2)) continue;
      bushes.push([x, z, rr(0.8, 1.5)]); takenAdd(x, z, 1.0); n++;
      tall.push([x + rr(-1.5, 1.5), z + rr(-1.5, 1.5), rr(0.8, 1.8)]);
      if (R() < 0.45) put('flower_patch', x + rr(-2, 2), z + rr(-2, 2), R() * TAU, { s: rr(0.7, 1.1), r: 0.6 });
    }
    // 물가 비탈을 가르는 막쌓은 돌담 (다리 어귀에서 강을 따라 내려간다)
    fence('stone_wall', -50, 58, -40, 72); fence('stone_wall', -40, 72, -31, 90);
  }

  // ── 교회 마당 돌담 (2 m 막쌓기 조각), 남쪽에 문 틈 ──
  { const Y = CHURCHYARD, C = CHURCH;
    fence('stone_wall', Y.x0, Y.z0, Y.x1, Y.z0); fence('stone_wall', Y.x1, Y.z0, Y.x1, Y.z1); fence('stone_wall', Y.x1, Y.z1, C.x - 4, Y.z1);
    fence('stone_wall', C.x - 8, Y.z1, Y.x0, Y.z1); fence('stone_wall', Y.x0, Y.z1, Y.x0, Y.z0); }
  // 다리 건너 길가: 한쪽 돌담, 한쪽 가로대 울타리
  fence('stone_wall', -64, 57.5, -98, 92); fence('rail_fence', -57, 46, -92, 81);

  // ── 강가 양 풀밭 (다리 건너 오른쪽): 북·동쪽 가로대 울타리 + 양 떼 22~30 (무리 셋) + 물통 ──
  // 양 색: 크림색 털 대부분, 회색·누런 털 몇, 갈색 몇 (마리마다 조금씩 다르게), 몸 길이도 마리마다 0.92~1.08
  const wool = () => { const q = R(); return q < 0.72 ? [rr(0.94, 1.04), rr(0.9, 0.98), rr(0.8, 0.9)] : q < 0.86 ? [rr(0.72, 0.8), rr(0.7, 0.77), rr(0.66, 0.72)] : q < 0.95 ? [rr(0.88, 0.95), rr(0.8, 0.86), rr(0.62, 0.7)] : [0.4, 0.31, 0.23]; };
  { const P = MEADOW;
    fence('rail_fence', P.x0, P.z0, P.x1, P.z0, { gap: 2 }); fence('rail_fence', P.x1, P.z0, P.x1, P.z1);
    put('trough', P.x1 - 4, P.z0 + 4, 0.2);
    const n = 22 + Math.floor(R() * 9), cs = [0, 1, 2].map((q) => { let x = 0, z = 0; for (let t = 0; t < 40; t++) { x = rr(P.x0 + 6 + q * 6, P.x1 - 5); z = rr(P.z0 + 5, P.z0 + 12); if (riverEdge(x, z) > RIVER_HW + 9) break; } return [x, z, R() * TAU]; });   // 무리는 풀밭 북쪽(길·마을 쪽)에 모인다
    for (let k = 0, tries = 0; k < n && tries < n * 30; tries++) {
      const spread = tries < n * 8 ? 4.5 : 7.5;   // 촘촘히 못 넣으면 무리를 넓힌다
      const [cx, cz, hd] = cs[k % 3], g = () => (R() + R() + R() - 1.5) * spread, x = cx + g(), z = cz + g();
      if (!inRect(P, x, z, -1.5) || riverEdge(x, z) < RIVER_HW + 2.5) continue;
      if (put('sheep', x, z, hd + rr(-0.9, 0.9), { r: 0.55, s: rr(0.9, 1.06), sx: rr(0.92, 1.08), tint: wool(), flock: 'main' })) k++;
    } }
  // 먼 풀밭에 둘째 양 떼 (15~20)
  for (let t = 0; t < 80; t++) {
    const a = rr(-2.6, -0.5), d = rr(170, 320), cx = VC.x + Math.cos(a) * d, cz = VC.z + Math.sin(a) * d, f = fieldAt(cx, cz);
    if (!f || f.type !== 1 || f.edge < 14 || !clear(cx, cz, 8)) continue;
    const n = 15 + Math.floor(R() * 6), hd = R() * TAU;
    for (let k = 0, tries = 0; k < n && tries < 60; tries++) {
      const x = cx + (R() + R() - 1) * 9, z = cz + (R() + R() - 1) * 9, g = fieldAt(x, z);
      if (!g || g.type !== 1 || g.edge < 3) continue;
      if (put('sheep', x, z, hd + rr(-1, 1), { r: 0.55, s: rr(0.9, 1.05), tint: wool(), flock: 'far' })) k++;
    }
    break;
  }
  // ── 대장간 동남쪽 풀밭: 가로대 울타리(서쪽 문 틈) + 소 4~6, 말 2, 건초더미 ──
  { const M = PASTURE;
    fence('rail_fence', M.x0, M.z0, M.x1, M.z0); fence('rail_fence', M.x1, M.z0, M.x1, M.z1); fence('rail_fence', M.x1, M.z1, M.x0, M.z1); fence('rail_fence', M.x0, M.z1, M.x0, M.z0, { gap: 3 });
    put('haystack', M.x1 - 7, M.z1 - 7, R() * TAU, { s: 0.75 }); put('trough', M.x0 + 6, M.z0 + 5, 0.2);
    const COW = [[1, 1, 1], [1, 1, 1], [0.3, 0.27, 0.25], [1.7, 1.45, 1.1], [1.25, 0.9, 0.7]];
    for (const [sp, n] of [['cow', 4 + Math.floor(R() * 3)], ['horse', 2]]) {
      for (let k = 0, tries = 0; k < n && tries < 50; tries++) {
        const x = rr(M.x0 + 3, M.x1 - 3), z = rr(M.z0 + 3, M.z1 - 3);
        if (riverEdge(x, z) < RIVER_HW + 4) continue;
        if (put(sp, x, z, R() * TAU, { r: 1.3, tint: sp === 'cow' ? COW[Math.floor(R() * COW.length)] : (R() < 0.5 ? [1, 0.85, 0.72] : [0.55, 0.5, 0.48]) })) k++;
      }
    } }
  // ── 강 오리: 다리 아래위와 물레방앗간 아래에 무리 셋 ──
  { const near = (cx, cz) => { let best = 0, bd = 1e9; RIVER.forEach(([x, z], i) => { const d = Math.hypot(x - cx, z - cz); if (d < bd) { bd = d; best = i; } }); return best; };
    for (const [cx, cz, di] of [[BRIDGE.x, BRIDGE.z, 5], [BRIDGE.x, BRIDGE.z, -6], [MILL.x, MILL.z, 6]]) {
      const i = Math.max(1, Math.min(RIVER.length - 2, near(cx, cz) + di)), [x0, z0] = RIVER[i], [x1, z1] = RIVER[i + 1], L = Math.hypot(x1 - x0, z1 - z0) || 1, flow = Math.atan2(-(z1 - z0) / L, (x1 - x0) / L);
      const n = 3 + Math.floor(R() * 3);
      for (let k = 0; k < n; k++) {
        const t = rr(-1.5, 1.5), side = rr(-2.6, 2.6), x = x0 + (x1 - x0) / L * t * 2 - (z1 - z0) / L * side, z = z0 + (z1 - z0) / L * t * 2 + (x1 - x0) / L * side;
        items.push({ p: 'duck', x, z, rot: flow + (R() < 0.7 ? 0 : Math.PI) + rr(-0.6, 0.6), s: rr(0.9, 1.05), y: WATER_Y - 0.01, tint: R() < 0.7 ? [1, 1, 1] : [0.52, 0.42, 0.3] });
      }
    } }
  // ── 밭 가 건초더미 (밀·휴경 밭 가장자리, 서로 35 m 넘게) ──
  { const hs = [];
    for (let t = 0; t < 400 && hs.length < 9; t++) {
      const a = R() * TAU, d = rr(150, 460), x = VC.x + Math.cos(a) * d, z = VC.z + Math.sin(a) * d * 0.85, f = fieldAt(x, z);
      if (!f || (f.type !== 2 && f.type !== 4) || f.edge < 4 || f.edge > 11 || hs.some(([hx, hz]) => Math.hypot(hx - x, hz - z) < 35)) continue;
      if (put('haystack', x, z, R() * TAU, { s: rr(0.8, 1.05) })) hs.push([x, z]);
    } }

  // ── 나무 자리: 강가 버드나무, 빈터·마을 가장자리 참나무, 울타리 가 산사나무, 틈새 물푸레·자작 ──
  const tree = (sp, x, z, s, r = 2.5, lean = [rr(-0.04, 0.04), rr(-0.04, 0.04)]) => { if (!clear(x, z, r) || Math.hypot(x - GREEN.x, z - GREEN.z) < GREEN.r + 2.5 || inRect(VIEW_CLEAR, x, z)) return false; trees.push({ sp, x, z, s, lean }); takenAdd(x, z, r); return true; };
  for (let i = 1, next = 0; i < RIVER.length - 1; i++) {
    const [x0, z0] = RIVER[i]; if (Math.hypot(x0 - VC.x, z0 - VC.z) > 420) continue;
    next -= Math.hypot(RIVER[i][0] - RIVER[i - 1][0], RIVER[i][1] - RIVER[i - 1][1]); if (next > 0) continue;
    const [x1, z1] = RIVER[i + 1], L = Math.hypot(x1 - x0, z1 - z0) || 1, side = R() < 0.5 ? 1 : -1, off = RIVER_HW + rr(1.4, 3.6);
    const nx = -(z1 - z0) / L * side, nz = (x1 - x0) / L * side;
    if (tree('willow', x0 + nx * off, z0 + nz * off, rr(0.85, 1.15), 2.5, [-nz * rr(0.04, 0.1), nx * rr(0.04, 0.1)])) next = rr(18, 40);
  }
  for (let k = 0; k < 3; k++) { const a = R() * TAU, d = rr(14, 18); tree('oak', GREEN.x + Math.cos(a) * d, GREEN.z + Math.sin(a) * d, rr(0.9, 1.15), 4); }
  for (const [x, z] of [[CHURCHYARD.x0 + 4, CHURCHYARD.z0 + 4], [CHURCHYARD.x1 - 5, CHURCHYARD.z1 - 4], [CHURCHYARD.x1 - 4, CHURCHYARD.z0 + 5]]) tree(R() < 0.5 ? 'oak' : 'ash', x, z, rr(0.85, 1.05), 3);
  for (let t = 0, n = 0; t < 120 && n < 12; t++) { const a = R() * TAU, d = rr(80, 160); if (tree(R() < 0.6 ? 'oak' : 'ash', VC.x + Math.cos(a) * d, VC.z + Math.sin(a) * d, rr(0.8, 1.2), 4)) n++; }
  for (let t = 0, n = 0; t < 120 && n < 12; t++) { const a = R() * TAU, d = rr(30, 110); if (tree(R() < 0.5 ? 'ash' : 'birch', VC.x + Math.cos(a) * d, VC.z + Math.sin(a) * d, rr(0.75, 1.1), 3.2)) n++; }
  for (const Z of [PASTURE, MEADOW]) for (let t = 0, n = 0; t < 40 && n < 5; t++) {
    const e = Math.floor(R() * 4), u = R(), x = e < 2 ? Z.x0 + (Z.x1 - Z.x0) * u : (e === 2 ? Z.x0 - 1.5 : Z.x1 + 1.5), z = e < 2 ? (e === 0 ? Z.z0 - 1.5 : Z.z1 + 1.5) : Z.z0 + (Z.z1 - Z.z0) * u;
    if (tree('hawthorn', x, z, rr(0.8, 1.15), 2)) n++;
  }
  return { items, gardens, worn, trees, tall, bushes };
}

// 출생 시드 하나 → 집 자리 + 꾸미기 (꾸미기 난수는 집 짜기와 섞이지 않게 따로 뽑는다)
export function dressSeed(seed) { return (Math.imul(seed, 2246822519) ^ 0x5bd1e995) >>> 0; }
export function planAll(seed, env, kitDims, propDims, kit = 'england', ctx = {}) {
  const recipe = recipeFor(kit, ctx);
  const layout = planVillage(seed, env, recipe);
  const dress = recipe.dress || planDressing;
  const dressing = dress(rng(dressSeed(seed)), { dims: kitDims || recipe.dims, without: recipe.without, variant: recipe.variant, camp: recipe.camp }, { dims: propDims },
    { ...layout, roadEdge: env.roadEdge, riverEdge: env.riverEdge, fieldAt: env.fieldAt });
  return { layout, dressing, recipe };
}
