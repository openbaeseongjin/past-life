// Natural Earth 땅 (world-atlas 의 TopoJSON) → assets/geo/land.json (옛 지도책 세계지도, 설계 4장)
// 쓰는 법: node tools/make_geo.mjs <land-50m.json 경로> [나갈 파일]
//   world-atlas@2.0.2 (ISC) 의 land-50m.json = Natural Earth 1:50m land (공개 영역)
// 하는 일: TopoJSON 풀기 → 고리(ring)마다 북위 75°~남위 56° 로 자르기 → Douglas–Peucker 로 줄이기 →
//   아주 작은 섬 빼기 → 1/Q 도 격자로 양자화 → 앞 점과의 차이(delta)로 적기
// 나가는 꼴: { v, src, q, lat:[75,-56], rings:[[x0,y0,dx1,dy1,…], …] }
//   x = round((lon+180)·q), y = round((75−lat)·q). 구멍(카스피 해 같은)도 고리 하나: 안팎은 짝홀(even–odd)로 판정
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const inPath = process.argv[2];
if (!inPath) { console.error('usage: node tools/make_geo.mjs <land-50m.json> [out]'); process.exit(1); }
const outPath = process.argv[3] || resolve(here, '../assets/geo/land.json');

const N = 75, S = -56;          // 자르는 위도
const Q = 50;                   // 1/50° ≈ 2.2 km 격자
const EPS = 0.035;               // 줄이기 허용 오차 (도)
const MIN_AREA = 0.004;         // 이보다 작은 섬(도²)은 뺀다 (카리브 작은 섬들은 남는다)

const topo = JSON.parse(readFileSync(inPath, 'utf8'));
const [sx, sy] = topo.transform.scale, [tx, ty] = topo.transform.translate;
const arcs = topo.arcs.map((arc) => {   // delta 양자화 → 경위도
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
});
const arcPts = (i) => (i >= 0 ? arcs[i] : arcs[~i].slice().reverse());
function ringOf(ids) {
  const out = [];
  ids.forEach((id, k) => { const p = arcPts(id); out.push(...(k ? p.slice(1) : p)); });
  return out;
}
const rings = [];
for (const g of topo.objects.land.geometries) {
  const polys = g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : [];
  for (const poly of polys) for (const r of poly) rings.push(ringOf(r));
}

// 반평면 자르기 (Sutherland–Hodgman): keep(p) 인 쪽만, 경계에서 위도 = lim
function clip(ring, keep, lim) {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const ka = keep(a), kb = keep(b);
    if (ka) out.push(a);
    if (ka !== kb) { const f = (lim - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * f, lim]); }
  }
  return out;
}
// 날짜변경선을 건너는 고리(추코트카·피지 등): 경도를 이어 붙인 뒤 −180~180 창으로 잘라 조각마다 따로 둔다
function clipLon(ring, keep, lim) {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const ka = keep(a), kb = keep(b);
    if (ka) out.push(a);
    if (ka !== kb) { const f = (lim - a[0]) / (b[0] - a[0]); out.push([lim, a[1] + (b[1] - a[1]) * f]); }
  }
  return out;
}
function splitDateline(r) {
  const u = [r[0].slice()];
  for (let i = 1; i < r.length; i++) {
    let lon = r[i][0];
    const prev = u[i - 1][0];
    while (lon - prev > 180) lon -= 360;
    while (lon - prev < -180) lon += 360;
    u.push([lon, r[i][1]]);
  }
  if (u.every((p) => p[0] >= -180 && p[0] <= 180)) return [r];
  const pieces = [];
  for (const shift of [-360, 0, 360]) {
    let s = u.map(([x, y]) => [x + shift, y]);
    s = clipLon(s, (p) => p[0] >= -180, -180);
    s = clipLon(s, (p) => p[0] <= 180, 180);
    if (s.length >= 3) pieces.push(s);
  }
  return pieces;
}
function area(r) { let s = 0; for (let i = 0; i < r.length; i++) { const a = r[i], b = r[(i + 1) % r.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; }
function dp(pts, eps) {   // Douglas–Peucker (열린 선)
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [i, j] = stack.pop();
    const [ax, ay] = pts[i], [bx, by] = pts[j];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-12;
    let best = -1, bd = 0;
    for (let k = i + 1; k < j; k++) {
      const d = Math.abs((pts[k][0] - ax) * dy - (pts[k][1] - ay) * dx) / L;
      if (d > bd) { bd = d; best = k; }
    }
    if (bd > eps && best > 0) { keep[best] = 1; stack.push([i, best], [best, j]); }
  }
  return pts.filter((_, k) => keep[k]);
}
function simplifyRing(r, eps) {   // 닫힌 고리: 가장 먼 두 점에서 둘로 나눠 줄인다
  if (r.length < 8) return r;
  let far = 0, fd = 0;
  for (let k = 1; k < r.length; k++) { const d = Math.hypot(r[k][0] - r[0][0], r[k][1] - r[0][1]); if (d > fd) { fd = d; far = k; } }
  const a = dp(r.slice(0, far + 1), eps), b = dp([...r.slice(far), r[0]], eps);
  return [...a, ...b.slice(1, -1)];
}

const out = [];
let pts = 0;
for (let r0 of rings.flatMap((r) => splitDateline(r))) {
  let r = r0;
  if (r.length > 1 && r[0][0] === r[r.length - 1][0] && r[0][1] === r[r.length - 1][1]) r = r.slice(0, -1);
  if (!r.some((p) => p[1] > S)) continue;   // 남극
  r = clip(r, (p) => p[1] <= N, N);
  r = clip(r, (p) => p[1] >= S, S);
  if (r.length < 3 || Math.abs(area(r)) < MIN_AREA) continue;
  r = simplifyRing(r, EPS);
  // 양자화 + 겹친 점 빼기
  const q = [];
  for (const [lon, lat] of r) {
    const x = Math.round((lon + 180) * Q), y = Math.round((N - lat) * Q);
    const l = q[q.length - 1];
    if (!l || l[0] !== x || l[1] !== y) q.push([x, y]);
  }
  if (q.length < 3) continue;
  const enc = [q[0][0], q[0][1]];
  for (let k = 1; k < q.length; k++) enc.push(q[k][0] - q[k - 1][0], q[k][1] - q[k - 1][1]);
  out.push(enc); pts += q.length;
}
const json = JSON.stringify({ v: 1, src: 'Natural Earth 1:50m land (public domain) via world-atlas@2.0.2 land-50m.json; tools/make_geo.mjs', q: Q, lat: [N, S], rings: out });
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, json);
console.log(`rings ${out.length}, points ${pts}, ${(json.length / 1024).toFixed(1)} KB → ${outPath}`);
