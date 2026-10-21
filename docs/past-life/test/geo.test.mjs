// 옛 지도책 세계지도의 지리 표 (설계 4장): 40개 땅의 대표 위치·반경, 태어난 자리, 금빛 점, 산줄기
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { GEO, partsOf, parseLand, project, unproject, birthSpot, dotsFor, areaWeights, distKm, MOUNTAINS, LAT_N, LAT_S } from '../geo.js';
import { AREAS, REGIONS, regionShare } from '../places.js';

const LAND_URL = new URL('../assets/geo/land.json', import.meta.url);
const land = parseLand(JSON.parse(readFileSync(LAND_URL, 'utf8')));
const IDS = Object.keys(AREAS);

test('땅 자료: 작고(300 KB 아래) 바다·땅 판정이 맞다', () => {
  assert.ok(statSync(LAND_URL).size < 300 * 1024);
  for (const [lat, lon] of [[48.9, 2.3], [35.7, 139.7], [-23.5, -46.6], [30, 31.2], [-33.9, 151.2], [39.96, -83], [64, 100], [66, 62]]) assert.ok(land.contains(lat, lon), `땅 ${lat},${lon}`);
  for (const [lat, lon] of [[30, -40], [0, -150], [-30, 80], [42, 51], [35, 18], [55, -40]]) assert.ok(!land.contains(lat, lon), `바다 ${lat},${lon}`);
  assert.ok(!land.contains(80, 0) && !land.contains(-70, 0), '자른 위도 밖은 땅 아님');
});

test('40개 땅 모두 GEO 가 있고 대표 위치는 범위 안, 땅 위', () => {
  assert.equal(IDS.length, 40);
  assert.deepEqual(Object.keys(GEO).sort(), [...IDS].sort());
  for (const a of IDS) {
    const g = GEO[a];
    assert.ok(g.lat <= LAT_N && g.lat >= LAT_S && g.lon >= -180 && g.lon <= 180, a);
    assert.ok(g.r > 0 && g.r < 6000, `${a} r`);
    assert.ok(land.contains(g.lat, g.lon), `${a} 대표 위치가 바다`);
    for (const p of partsOf(a)) {
      assert.ok(p.r > 0 && (p.w ?? 1) > 0, `${a} part`);
      assert.ok(distKm(g, p) <= g.r, `${a} 부분 동그라미 중심이 대표 반경 밖`);
    }
  }
});

test('project: 등장방형 [0,1], 끝과 가운데', () => {
  assert.deepEqual(project(LAT_N, -180), { x: 0, y: 0 });
  assert.deepEqual(project(LAT_S, 180), { x: 1, y: 1 });
  const c = project(0, 0);
  assert.equal(c.x, 0.5);
  assert.ok(Math.abs(c.y - 75 / 131) < 1e-12);
  for (let i = 0; i < 50; i++) {
    const lat = LAT_S + (i / 49) * (LAT_N - LAT_S), lon = -180 + (i * 7.3) % 360;
    const p = project(lat, lon);
    assert.ok(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1);
    const q = unproject(p.x, p.y);
    assert.ok(Math.abs(q.lat - lat) < 1e-9 && Math.abs(q.lon - lon) < 1e-9);
  }
});

test('태어난 자리: 같은 시드 = 같은 자리, 땅 위, 그 땅 동그라미 안', () => {
  for (const a of IDS) {
    const parts = partsOf(a);
    const seen = new Set();
    for (let s = 0; s < 40; s++) {
      const seed = `T${s}-${a}`;
      const p = birthSpot(seed, a, land);
      assert.deepEqual(birthSpot(seed, a, land), p, '결정적');
      assert.ok(land.contains(p.lat, p.lon), `${a} ${seed} 바다`);
      assert.ok(parts.some((c) => distKm(c, p) <= c.r + 1) || (p.lat === GEO[a].lat && p.lon === GEO[a].lon), `${a} ${seed} 동그라미 밖`);
      assert.ok(distKm(GEO[a], p) <= GEO[a].r + 1, `${a} 대표 반경 밖`);
      seen.add(`${p.lat.toFixed(3)},${p.lon.toFixed(3)}`);
    }
    assert.ok(seen.size >= 30, `${a}: 자리가 고루 퍼진다 (${seen.size})`);
  }
});

test('금빛 점: 개수·결정성·땅 위, 지역 비율을 따른다 (1500·1950)', () => {
  for (const year of [1500, 1950]) {
    const n = 1000, dots = dotsFor(year, n, 'atlas', land);
    assert.equal(dots.length, n);
    assert.deepEqual(dotsFor(year, n, 'atlas', land), dots);
    for (const d of dots) assert.ok(land.contains(d.lat, d.lon), `${d.area} 점이 바다`);
    for (const g of REGIONS) {
      const got = dots.filter((d) => d.region === g).length / n;
      assert.ok(Math.abs(got - regionShare(g, year)) < 0.01, `${year} ${g}: ${got} vs ${regionShare(g, year)}`);
    }
  }
  const w = areaWeights(1500);
  assert.ok(Math.abs(Object.values(w).reduce((s, x) => s + x, 0) - 1) < 1e-9);
  // 사람이 아직 닿지 않은 땅에는 점이 없다 (카리브는 기원전 4000년 무렵부터)
  assert.equal(dotsFor(-6000, 500, 'atlas', land).filter((d) => d.area === 'caribbean').length, 0);
  // 해가 바뀌어도 같은 땅의 i 번째 점은 그 자리에 남는다
  const a = dotsFor(1500, 600, 's', land), b = dotsFor(1600, 600, 's', land);
  const key = (d) => `${d.area}|${d.i}`, mb = new Map(b.map((d) => [key(d), d]));
  const both = a.filter((d) => mb.has(key(d)));
  assert.ok(both.length > 300);
  for (const d of both) assert.deepEqual([d.lat, d.lon], [mb.get(key(d)).lat, mb.get(key(d)).lon]);
});

test('산줄기: 이름 짝, 점 2개 이상, 범위 안, 대부분 땅 위', () => {
  assert.ok(MOUNTAINS.length >= 20);
  const ids = new Set();
  for (const m of MOUNTAINS) {
    assert.ok(!ids.has(m.id), m.id); ids.add(m.id);
    assert.ok(m.name.ko && m.name.en, m.id);
    assert.ok([1, 2, 3].includes(m.h), m.id);
    assert.ok(m.pts.length >= 2, m.id);
    for (const [lat, lon] of m.pts) assert.ok(lat <= LAT_N && lat >= LAT_S && lon >= -180 && lon <= 180, m.id);
    const on = m.pts.filter(([lat, lon]) => land.contains(lat, lon)).length;
    assert.ok(on / m.pts.length >= 0.75, `${m.id}: 땅 위 ${on}/${m.pts.length}`);
  }
  for (const need of ['himalaya', 'hindukush', 'tianshan', 'altai', 'zagros', 'caucasus', 'taurus', 'alps', 'pyrenees', 'carpathians', 'urals', 'atlas', 'ethiopia', 'drakensberg', 'rockies', 'madre_occ', 'andes', 'appalachians', 'dividing', 'japan_alps']) assert.ok(ids.has(need), need);
});
