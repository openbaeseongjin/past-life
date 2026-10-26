// 옛 지도책 세계지도의 지리 표 (설계 4장). DOM 없음: 시험(node)과 화면이 함께 쓴다
// - GEO: places.js 의 40개 땅마다 대표 위치 { lat, lon } (땅 위)와 반경 r (km, 대원 거리).
//   parts 가 있으면 r 은 그 동그라미들을 모두 감싸는 반경으로 계산되고, 태어난 자리·금빛 점은 그 동그라미들(가중치 w)에서 뽑는다 (나일처럼 좁은 강가, 섬 여럿인 땅).
//   parts 가 없으면 { lat, lon, r } 동그라미 하나.
// - 등장방형 펼침: 북위 75° ~ 남위 56°, 경도 −180 ~ 180 → x, y ∈ [0, 1]
// - 땅 판정: assets/geo/land.json (Natural Earth 1:50m, tools/make_geo.mjs) 을 parseLand 로 풀어 넘긴다
// - 모든 무작위는 시드에서: birthSpot = sub(seed, 'geo'), 금빛 점 = sub(seed, 'dot', 땅, 번호)
import { sub } from './rng.js';
import { REGIONS, AREAS, regionShare, areaShare, settled, ARRIVE } from './places.js';
import { AREA_SHARE } from './world.js';

export const LAT_N = 75, LAT_S = -56;
export const KM_PER_DEG = 111.32;

// 경위도 → [0,1] 평면 (등장방형)
export function project(lat, lon) {
  return { x: (lon + 180) / 360, y: (LAT_N - lat) / (LAT_N - LAT_S) };
}
export function unproject(x, y) {
  return { lat: LAT_N - y * (LAT_N - LAT_S), lon: x * 360 - 180 };
}
// 두 점 사이 거리 (km, 대원)
export function distKm(a, b) {
  const R = 6371, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

// [위도, 경도, 반경 km, 가중치]
const P = (lat, lon, r, w = 1) => ({ lat, lon, r, w });
export const GEO = {
  china: { lat: 33, lon: 112, parts: [P(36, 115, 480, 4), P(31, 118, 330, 3), P(30.5, 105, 300, 2), P(24.5, 113, 430, 2), P(34.5, 108.5, 280, 1)] },
  japan: { lat: 36, lon: 138.5, parts: [P(35.2, 136.6, 230, 3), P(36.2, 139.6, 200, 2), P(33, 131, 170, 1), P(34.5, 133.5, 150, 1), P(38.8, 140.8, 230, 1)] },
  korea: { lat: 37, lon: 127.5, r: 280 },
  mongolia: { lat: 47, lon: 104, r: 600 },
  india: { lat: 22, lon: 79, parts: [P(26.5, 80.5, 430, 3), P(18, 77, 480, 2), P(12, 78, 330, 2), P(22.5, 72.5, 230, 1)] },
  bengal: { lat: 23.8, lon: 90, r: 220 },
  indus: { lat: 30.5, lon: 71.5, parts: [P(30.8, 72.5, 330, 3), P(26, 68.5, 230, 1), P(34.5, 68.5, 280, 1)] },
  himalaya: { lat: 28.2, lon: 84, parts: [P(28.6, 82, 120, 1), P(27.8, 84.5, 120, 2), P(27.3, 86.9, 100, 1), P(27.4, 90.4, 80, 0.5)] },
  lanka: { lat: 7.8, lon: 80.7, r: 110 },
  anatolia: { lat: 39, lon: 33, r: 450 },
  iran: { lat: 32.5, lon: 53.5, r: 600 },
  nile: { lat: 27, lon: 31, parts: [P(30.5, 31.1, 100, 4), P(28.6, 30.8, 50, 2), P(26.2, 32.4, 50, 2), P(24.4, 32.9, 40, 1), P(18.5, 31.6, 60, 1), P(15.4, 32.6, 110, 1)] },
  mesopotamia: { lat: 33.5, lon: 43, parts: [P(32.8, 44.6, 280, 3), P(36, 38.5, 230, 2), P(32.5, 35.6, 140, 2)] },
  arabia: { lat: 23, lon: 46, parts: [P(15, 44.5, 230, 3), P(21.5, 40, 230, 2), P(24.7, 46.7, 230, 1), P(23, 57.5, 170, 1)] },
  maghreb: { lat: 34.5, lon: 2, parts: [P(33.5, -6, 280, 2), P(35.8, 3, 230, 2), P(35.6, 9.8, 160, 2), P(32.3, 13.5, 120, 1)] },
  steppe: { lat: 42, lon: 64, parts: [P(40.5, 66, 380, 2), P(43, 76, 280, 1), P(48, 68, 550, 1)] },
  east_europe: { lat: 52, lon: 32, parts: [P(49.5, 31, 430, 2), P(55.5, 38, 430, 2), P(52, 20, 280, 1), P(53.5, 27.5, 230, 1)] },
  france: { lat: 46.8, lon: 2.5, r: 380 },
  italy: { lat: 42.5, lon: 12.8, parts: [P(44.8, 10.5, 180, 2), P(42, 12.8, 160, 2), P(40.6, 16, 180, 1), P(37.5, 14.2, 110, 1)] },
  germany: { lat: 50.5, lon: 11, parts: [P(51, 10, 330, 3), P(47.9, 14.5, 180, 1), P(49.8, 15.5, 160, 1)] },
  iberia: { lat: 40, lon: -4, r: 500 },
  britain: { lat: 52.6, lon: -1.6, parts: [P(52.6, -1.6, 280, 3), P(56.3, -4, 140, 1), P(53.2, -8, 160, 1)] },
  nordic: { lat: 60, lon: 15, parts: [P(59.3, 15, 330, 2), P(56, 9.8, 140, 1), P(61, 9, 230, 1), P(62, 25, 230, 1)] },
  balkans: { lat: 43, lon: 22, parts: [P(44, 21, 330, 3), P(39.3, 22, 180, 1), P(45.6, 24.5, 230, 1)] },
  west_africa: { lat: 9.5, lon: 5, parts: [P(9, 7.5, 480, 3), P(7.5, -1.5, 280, 2), P(13, -5, 380, 1), P(13.5, -15, 180, 1)] },
  east_africa: { lat: 3, lon: 37.5, parts: [P(9, 39, 330, 2), P(0, 37, 280, 2), P(-6, 35, 380, 1), P(1, 32.5, 180, 1)] },
  congo: { lat: -2, lon: 22, parts: [P(-3, 21, 650, 2), P(-5, 15, 230, 1), P(-11, 27, 280, 1)] },
  south_africa: { lat: -24, lon: 28, parts: [P(-28, 27, 430, 2), P(-18.5, 30, 330, 1), P(-14, 34, 230, 1), P(-33.5, 24, 230, 1)] },
  mesoamerica: { lat: 19, lon: -99, parts: [P(19.5, -99.5, 280, 3), P(17, -91, 230, 2), P(14, -88, 230, 1), P(20.5, -89, 140, 1)] },
  andes: { lat: -10, lon: -76, parts: [P(-12, -75, 380, 2), P(-17, -67, 330, 1), P(4.5, -74.5, 330, 1), P(-1, -78.5, 180, 1), P(-33, -70.8, 180, 0.5)] },
  brazil: { lat: -12, lon: -45, parts: [P(-8, -37, 330, 2), P(-20.5, -44, 430, 3), P(-28, -52, 280, 1), P(-3, -60, 430, 0.5)] },
  north_america: { lat: 39, lon: -92, parts: [P(40, -80, 550, 3), P(41, -92, 550, 2), P(33, -97, 480, 1), P(37, -120, 330, 1), P(45.5, -75, 280, 1), P(52, -110, 480, 0.3)] },
  la_plata: { lat: -33, lon: -60, parts: [P(-34, -61, 380, 3), P(-32.8, -56, 180, 1), P(-27, -64.5, 280, 1)] },
  caribbean: { lat: 22.2, lon: -79.8, parts: [P(22.2, -79.8, 330, 3), P(18.9, -72, 230, 3), P(18.15, -77.3, 90, 1), P(18.2, -66.5, 70, 1), P(14.5, -61.3, 250, 0.5)] },
  indonesia: { lat: -7.3, lon: 110.5, parts: [P(-7.3, 110, 430, 4), P(0, 102, 430, 2), P(-1, 114, 430, 1), P(-2, 120.5, 330, 1), P(-8.6, 116.5, 230, 1)] },
  mainland_sea: { lat: 16, lon: 101, parts: [P(15, 100.5, 330, 2), P(21, 105.8, 180, 2), P(10.5, 105.8, 180, 1), P(20, 96, 430, 2), P(12.5, 104.5, 180, 1)] },
  philippines: { lat: 15.5, lon: 121, parts: [P(15.5, 121, 230, 3), P(10.6, 122.6, 180, 2), P(7.5, 125, 230, 1)] },
  malay: { lat: 4, lon: 102, r: 250 },
  australia: { lat: -30, lon: 145, parts: [P(-34, 147, 480, 3), P(-28, 152, 280, 1), P(-32, 117, 280, 1), P(-20, 135, 850, 1), P(-39, 175.5, 280, 1), P(-43.5, 171, 230, 0.5)] },
  pacific: { lat: -6, lon: 145, parts: [P(-6, 145, 480, 4), P(-17.8, 178, 110, 1), P(-9.5, 160, 180, 0.5), P(-13.8, -172.1, 120, 0.3)] },
};
// parts 가 있는 땅의 r 은 부분 동그라미를 모두 감싸는 반경 (km)으로 계산해 둔다
for (const g of Object.values(GEO)) if (g.parts) g.r = Math.ceil(Math.max(...g.parts.map((p) => distKm(g, p) + p.r)));
export const partsOf = (area) => GEO[area].parts || [{ lat: GEO[area].lat, lon: GEO[area].lon, r: GEO[area].r, w: 1 }];

// 땅 (land.json) 풀기 → { rings, contains(lat, lon) }. 짝홀 판정, 위도 1° 띠마다 변을 모아 둔다
export function parseLand(json) {
  const q = json.q, N = json.lat[0];
  const rings = json.rings.map((enc) => {
    const n = enc.length / 2, a = new Float64Array(enc.length);
    let x = 0, y = 0;
    for (let i = 0; i < n; i++) {
      x += enc[2 * i]; y += enc[2 * i + 1];
      a[2 * i] = x / q - 180; a[2 * i + 1] = N - y / q;   // [lon, lat]
    }
    return a;
  });
  const BAND = 1, rows = new Map();
  rings.forEach((r, ri) => {
    const n = r.length / 2;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n, la = r[2 * i + 1], lb = r[2 * j + 1];
      const lo = Math.floor(Math.min(la, lb) / BAND), hi = Math.floor(Math.max(la, lb) / BAND);
      for (let b = lo; b <= hi; b++) { if (!rows.has(b)) rows.set(b, []); rows.get(b).push(ri, i); }
    }
  });
  function contains(lat, lon) {
    if (!(lat <= N && lat >= json.lat[1])) return false;
    const list = rows.get(Math.floor(lat / BAND));
    if (!list) return false;
    let inside = false;
    for (let k = 0; k < list.length; k += 2) {
      const r = rings[list[k]], n = r.length / 2, i = list[k + 1], j = (i + 1) % n;
      const xi = r[2 * i], yi = r[2 * i + 1], xj = r[2 * j], yj = r[2 * j + 1];
      if ((yi > lat) !== (yj > lat) && lon < xi + (lat - yi) * (xj - xi) / (yj - yi)) inside = !inside;
    }
    return inside;
  }
  return { rings, contains };
}

// 동그라미 (lat, lon, r km) 안 고른 점 하나
function inDisk(rng, c) {
  const d = c.r * Math.sqrt(rng.next()), a = rng.next() * Math.PI * 2;
  const lat = c.lat + (d * Math.sin(a)) / KM_PER_DEG;
  const lon = c.lon + (d * Math.cos(a)) / (KM_PER_DEG * Math.max(0.2, Math.cos(c.lat * Math.PI / 180)));
  return { lat, lon: ((lon + 540) % 360) - 180 };
}
// 땅 위 점 하나: 동그라미를 가중치로 고르고 그 안에서 땅에 닿을 때까지 (못 찾으면 대표 위치)
function spotIn(rng, area, land, tries = 120) {
  const parts = partsOf(area);
  for (let t = 0; t < tries; t++) {
    const c = rng.weighted(parts, (p) => p.w ?? 1);
    const s = inDisk(rng, c);
    if (!land || land.contains(s.lat, s.lon)) return { ...s, area, part: parts.indexOf(c) };
  }
  return { lat: GEO[area].lat, lon: GEO[area].lon, area, part: -1 };
}

// 태어난 자리: 같은 시드 = 같은 자리
export function birthSpot(seed, area, land) {
  return spotIn(sub(seed, 'geo'), area, land);
}

// 그해 사람이 살던 곳에 금빛 점 n개 (지역 비율 × 땅 비율, 아직 사람이 닿지 않은 땅은 뺀다).
// 점 i 는 sub(seed, 'dot', 땅, i) 로 자리가 정해져, 해가 바뀌면 개수만 달라지고 같은 점은 그 자리에 남는다
export function areaWeights(year) {
  const w = {};
  for (const g of REGIONS) {
    if (year < (ARRIVE[g] ?? -Infinity)) continue;
    for (const a of Object.keys(AREA_SHARE[g])) if (settled(g, a, year)) w[a] = regionShare(g, year) * areaShare(g, a, year);
  }
  const tot = Object.values(w).reduce((s, x) => s + x, 0) || 1;
  for (const a in w) w[a] /= tot;
  return w;
}
export function dotsFor(year, n, seed, land) {
  const w = areaWeights(year);
  // 큰 나머지 방식으로 정수 개수 (순서는 이름 순: 결정적)
  const ids = Object.keys(w).sort();
  const cnt = {}, rem = [];
  let used = 0;
  for (const a of ids) { const x = w[a] * n; cnt[a] = Math.floor(x); used += cnt[a]; rem.push([x - cnt[a], a]); }
  rem.sort((p, q) => q[0] - p[0] || (p[1] < q[1] ? -1 : 1));
  for (let k = 0; k < n - used; k++) cnt[rem[k % rem.length][1]]++;
  const out = [];
  for (const a of ids) for (let i = 0; i < cnt[a]; i++) {
    const s = spotIn(sub(seed, 'dot', a, i), a, land, 60);
    out.push({ ...s, region: AREAS[a].region, i });
  }
  return out;
}

// 큰 산줄기 (Natural Earth 땅에는 높이가 없어 손으로 그은 등줄기). 빗금은 이 선을 따라 그린다
// pts: [위도, 경도] … · h: 높이 느낌 1~3
const M = (id, ko, en, h, pts) => ({ id, name: { ko, en }, h, pts });
export const MOUNTAINS = [
  M('himalaya', '히말라야', 'Himalaya', 3, [[35.8, 74.5], [34, 77], [31.2, 79], [29.8, 81.5], [28.6, 84], [28, 87], [27.9, 89], [27.9, 91.5], [28.3, 94.5], [28.8, 97]]),
  M('karakoram', '카라코람·쿤룬', 'Karakoram & Kunlun', 3, [[36.2, 75], [36, 78], [35.8, 82], [36.2, 86], [36.3, 90], [35.5, 95], [34.6, 99]]),
  M('pamir', '파미르', 'Pamirs', 3, [[39.3, 72], [38.4, 73.3], [37.4, 74.8]]),
  M('hindukush', '힌두쿠시', 'Hindu Kush', 2, [[36.5, 71.5], [35.5, 69], [34.8, 67], [34.4, 64]]),
  M('tianshan', '톈산', 'Tian Shan', 2, [[41.5, 70], [42, 74], [42.3, 78], [43, 82], [43.3, 86], [43, 90], [43, 94]]),
  M('altai', '알타이', 'Altai', 2, [[52, 85], [50, 88], [48.5, 90.5], [46.5, 94], [45, 97]]),
  M('sayan', '사얀', 'Sayan', 1, [[52.2, 91], [51.8, 96], [51.6, 101]]),
  M('khingan', '싱안링', 'Khingan', 1, [[53, 121.5], [49, 120.5], [45, 119.5], [42.5, 118.5]]),
  M('qinling', '친링', 'Qinling', 1, [[34, 104.5], [33.8, 108], [33.4, 111.5]]),
  M('hengduan', '헝돤', 'Hengduan', 2, [[33, 99], [30, 99.5], [27, 99.2], [24, 98.5]]),
  M('zagros', '자그로스', 'Zagros', 2, [[37.5, 44.5], [35, 46.5], [33, 48], [31, 50.5], [29, 52.5], [27.6, 55], [27.2, 56.6]]),
  M('alborz', '엘부르즈', 'Alborz', 2, [[37.5, 48.8], [36.2, 51], [36.4, 54], [37.2, 57]]),
  M('caucasus', '캅카스', 'Caucasus', 3, [[43.6, 40], [43.1, 43], [42.4, 45.5], [41.4, 48.4]]),
  M('taurus', '토로스', 'Taurus', 2, [[37, 30], [36.9, 33], [37.6, 36], [38.2, 38.5], [38.6, 41]]),
  M('hejaz', '히자즈·아시르', 'Hejaz & Asir', 1, [[28, 35.6], [24.5, 38.6], [20.5, 41], [17, 43.3], [14.5, 44]]),
  M('alps', '알프스', 'Alps', 3, [[44.2, 7.2], [45.5, 7], [46.3, 8], [46.5, 10], [47, 12], [47.3, 14], [47.6, 15.8]]),
  M('pyrenees', '피레네', 'Pyrenees', 2, [[42.9, -1.5], [42.7, 0.5], [42.5, 2.4]]),
  M('apennines', '아펜니노', 'Apennines', 1, [[44.3, 9.5], [43.6, 12], [42.2, 13.5], [40.6, 15.5], [39.1, 16.3]]),
  M('carpathians', '카르파티아', 'Carpathians', 2, [[49.3, 19], [49.1, 22], [48, 24.5], [46.6, 25.8], [45.5, 25], [45.3, 22.5]]),
  M('dinaric', '디나르·핀도스', 'Dinarides & Pindus', 1, [[45.5, 15], [44, 17], [42.6, 19.5], [41, 20.6], [39.5, 21.3]]),
  M('scandes', '스칸디나비아 산맥', 'Scandinavian Mountains', 2, [[59, 7], [61, 8.5], [63, 12], [66, 14.5], [68.5, 18.5]]),
  M('urals', '우랄', 'Urals', 1, [[68.5, 66], [66, 62], [62, 59.2], [59, 59], [56, 58.8], [53, 58.5], [51.5, 58.2]]),
  M('atlas', '아틀라스', 'Atlas', 2, [[30.8, -9.2], [32, -6], [33.5, -3], [34.8, 0], [35.5, 3], [36.2, 6], [35.6, 8.8]]),
  M('ethiopia', '에티오피아 고원', 'Ethiopian Highlands', 2, [[14.2, 38.5], [11.5, 39.4], [9, 38.8], [7, 38], [7.5, 40]]),
  M('rift', '동아프리카 고원', 'East African Rift', 1, [[1, 36], [-1, 36.8], [-3.1, 37.4], [-8.5, 35.5], [-10, 34]]),
  M('drakensberg', '드라켄즈버그', 'Drakensberg', 2, [[-27.5, 30.4], [-29, 29.3], [-30.5, 28.3], [-31.6, 27], [-32.6, 24.5], [-33.4, 21], [-33.6, 19.6]]),
  M('madagascar', '마다가스카르 고원', 'Malagasy Highlands', 1, [[-13, 49], [-18, 47.5], [-22, 46.8], [-24.5, 46.5]]),
  M('ghats', '서고츠', 'Western Ghats', 1, [[21, 73.7], [17, 73.8], [13, 75], [10, 77], [8.6, 77.3]]),
  M('rockies', '로키', 'Rocky Mountains', 3, [[62, -130], [58, -125], [54, -119], [50, -115], [47, -112.5], [44, -110], [41, -106.5], [38, -106], [35, -106]]),
  M('cascades', '시에라네바다·캐스케이드', 'Sierra Nevada & Cascades', 2, [[49, -121.5], [46, -121.7], [43, -122], [40.5, -121.6], [38.4, -120], [36, -118.4]]),
  M('appalachians', '애팔래치아', 'Appalachians', 1, [[34, -84.5], [36, -82.5], [38, -80], [40.5, -77.5], [42.5, -74.4], [44.5, -71.5], [46.5, -69]]),
  M('madre_occ', '서시에라마드레', 'Sierra Madre Occidental', 2, [[31, -108.5], [28, -107], [25, -105.5], [22, -104], [19.8, -102]]),
  M('madre_or', '동시에라마드레', 'Sierra Madre Oriental', 1, [[27, -100.6], [24, -99.6], [21, -98.8], [19, -97.3]]),
  M('madre_sur', '남시에라마드레', 'Sierra Madre del Sur', 1, [[18.5, -102.5], [17.6, -100], [16.8, -97], [16.5, -93], [15, -91]]),
  M('andes', '안데스', 'Andes', 3, [[10.5, -72], [7, -72.6], [4, -75.6], [0, -78.2], [-4, -79], [-8, -77.6], [-12, -75.5], [-15.5, -71], [-19, -68.5], [-23, -67.5], [-27, -68.5], [-31, -70], [-35, -70.3], [-39, -71], [-43, -71.8], [-47, -72.6], [-50.5, -73], [-53.5, -71.5]]),
  M('serra', '세하두마르', 'Serra do Mar', 1, [[-15, -41.5], [-19, -42.5], [-22.4, -44], [-24.2, -47.5], [-26.5, -49.5]]),
  M('dividing', '그레이트디바이딩', 'Great Dividing Range', 2, [[-15, 145], [-18, 145.6], [-22, 148], [-26, 151], [-29, 152], [-32, 150.5], [-35, 148.8], [-37, 147.5], [-37.4, 144.5]]),
  M('nz_alps', '서던알프스', 'Southern Alps', 2, [[-41.2, 172.8], [-43, 171], [-44.8, 168.6]]),
  M('japan_alps', '일본 알프스', 'Japanese Alps', 2, [[33.6, 132.6], [35, 135], [36.3, 137.6], [37.5, 139.5], [39, 140.6], [40.5, 140.8]]),
  M('taiwan', '타이완 산맥', 'Taiwan ranges', 1, [[24.8, 121.4], [23, 120.9]]),
  M('barisan', '바리산', 'Barisan', 1, [[4, 96.5], [1, 99.2], [-2, 101.6], [-5, 104.5]]),
  M('papua', '뉴기니 고원', 'New Guinea Highlands', 2, [[-3.8, 137.5], [-4.6, 140.5], [-5.8, 143.5], [-6.6, 146]]),
];
