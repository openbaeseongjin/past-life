// 옛 지도책 세계지도 (설계 2·4장): 종이 질감·잉크 해안선·지형 빗금·옅은 수채 바다를 화면 밖 캔버스에 미리 그려 두고,
// 그 위에 그해 사람들의 금빛 점, 불씨 내려앉기, 다음 생으로 가는 금실, 영혼의 염주를 그린다. three.js 없이 캔버스 2D
// 무작위: 지도 꾸밈(얼룩·빗금 흔들림)은 고정 시드(createRng), 반짝임·불티 같은 순수 장식만 Math.random
import { project, MOUNTAINS, parseLand, dotsFor, LAT_N, LAT_S } from './geo.js';
import { createRng } from './rng.js';

export const MAP_COLORS = { night: '#121329', paper: '#f6efe2', ink: '#1d2140', gold: '#e2b65e', goldDeep: '#a8770a', trace: '#2a6894' };
const C = MAP_COLORS;
const SERIF = '"Gowun Batang", "Nanum Myeongjo", "Noto Serif KR", Georgia, "Times New Roman", serif';
const RATIO = 360 / (LAT_N - LAT_S);
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

export const MAP_TEXT = {
  title: { ko: '온 누리의 지도', en: 'A Map of All the World' },
  oceans: [
    { lat: 14, lon: -142, ko: '태 평 양', en: 'PACIFIC  OCEAN' },
    { lat: 4, lon: 170, ko: '태 평 양', en: 'PACIFIC  OCEAN' },
    { lat: 27, lon: -45, ko: '대 서 양', en: 'ATLANTIC  OCEAN' },
    { lat: -24, lon: -16, ko: '대 서 양', en: 'ATLANTIC  OCEAN' },
    { lat: -24, lon: 78, ko: '인 도 양', en: 'INDIAN  OCEAN' },
  ],
};

// 땅 자료 불러오기 (브라우저). 시험은 fs 로 읽어 parseLand 에 넘긴다
export async function loadLand(url = new URL('./assets/geo/land.json', import.meta.url)) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`land.json ${r.status}`);
  return parseLand(await r.json());
}

// 이어 붙일 수 있는 값 잡음 (회색, 0~255)
function noiseTile(size, cells, seed, octaves, contrast = 1) {
  const rng = createRng(seed);
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d'), img = g.createImageData(size, size), acc = new Float32Array(size * size);
  let amp = 1, tot = 0;
  for (let o = 0; o < octaves; o++) {
    const n = cells << o, lat = new Float32Array(n * n);
    for (let i = 0; i < lat.length; i++) lat[i] = rng.next();
    const cs = size / n;
    for (let y = 0; y < size; y++) {
      const gy = y / cs, y0 = Math.floor(gy) % n, y1 = (y0 + 1) % n, fy = gy - Math.floor(gy), sy = fy * fy * (3 - 2 * fy);
      for (let x = 0; x < size; x++) {
        const gx = x / cs, x0 = Math.floor(gx) % n, x1 = (x0 + 1) % n, fx = gx - Math.floor(gx), sx = fx * fx * (3 - 2 * fx);
        const a = lat[y0 * n + x0] + (lat[y0 * n + x1] - lat[y0 * n + x0]) * sx;
        const b = lat[y1 * n + x0] + (lat[y1 * n + x1] - lat[y1 * n + x0]) * sx;
        acc[y * size + x] += (a + (b - a) * sy) * amp;
      }
    }
    tot += amp; amp *= 0.55;
  }
  for (let i = 0; i < acc.length; i++) {
    const v = clamp(0.5 + (acc[i] / tot - 0.5) * contrast, 0, 1) * 255;
    img.data[4 * i] = img.data[4 * i + 1] = img.data[4 * i + 2] = v; img.data[4 * i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return cv;
}

// 빛나는 금 알갱이 그림 (점·구슬·불씨에 함께 쓴다)
function sprite(size, stops) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const g = cv.getContext('2d'), gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return cv;
}

// 지형 빛깔 (사막·숲·툰드라): [위도, 경도, 반경°, 색, 진하기]
const DESERT = '#c9a15c', GREEN = '#8f9f6a', COLD = '#b9c2c4';
const TINTS = [
  [23, 8, 13, DESERT, 0.3], [21, 26, 9, DESERT, 0.28], [23, -6, 8, DESERT, 0.28], [22, 47, 8, DESERT, 0.3], [27, 71, 3.5, DESERT, 0.2],
  [32, 58, 5, DESERT, 0.22], [39, 83, 5, DESERT, 0.25], [43, 104, 7, DESERT, 0.22], [-24, 130, 12, DESERT, 0.3], [-23, 21, 5, DESERT, 0.2],
  [-24, -69, 3, DESERT, 0.2], [34, -113, 5, DESERT, 0.2], [-45, -69, 4, DESERT, 0.15], [45, 62, 7, DESERT, 0.14],
  [-1, 22, 10, GREEN, 0.26], [-5, -62, 14, GREEN, 0.26], [13, 103, 8, GREEN, 0.2], [-1, 112, 8, GREEN, 0.22], [-5, 142, 5, GREEN, 0.2],
  [51, 14, 10, GREEN, 0.14], [40, -82, 10, GREEN, 0.15], [27, 112, 8, GREEN, 0.15], [60, 100, 18, GREEN, 0.14], [55, -95, 15, GREEN, 0.13],
  [8, -5, 6, GREEN, 0.15], [-15, -50, 8, GREEN, 0.1], [36, 138, 3, GREEN, 0.15],
  [71, 100, 25, COLD, 0.25], [70, -100, 25, COLD, 0.25], [72, -40, 12, COLD, 0.3],
];

export function createWorldMap(canvas, opts = {}) {
  const o = { lang: 'ko', land: null, title: true, dots: 520, seed: 'atlas', ...opts };
  const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
  let reduce = o.reducedMotion ?? !!(mq && mq.matches);
  const onMq = () => { if (o.reducedMotion == null) { reduce = mq.matches; kick(); } };
  mq?.addEventListener?.('change', onMq);
  const ctx = canvas.getContext('2d');
  const rngDecor = createRng('atlas-decor');
  const grain = noiseTile(256, 128, 'atlas-grain', 2, 1.3);
  const cloud = noiseTile(512, 3, 'atlas-cloud', 6, 1.45);
  const dotImg = sprite(48, [[0, 'rgba(255,248,222,1)'], [0.16, 'rgba(240,200,110,1)'], [0.3, 'rgba(198,142,30,0.95)'], [0.42, 'rgba(168,119,10,0.35)'], [0.7, 'rgba(226,182,94,0.12)'], [1, 'rgba(226,182,94,0)']]);
  const emberImg = sprite(96, [[0, 'rgba(255,252,236,1)'], [0.12, 'rgba(255,224,138,1)'], [0.26, 'rgba(236,150,40,0.95)'], [0.42, 'rgba(196,98,18,0.5)'], [0.68, 'rgba(226,140,40,0.16)'], [1, 'rgba(226,120,30,0)']]);
  const shadowImg = sprite(64, [[0, 'rgba(29,33,64,0.35)'], [0.5, 'rgba(29,33,64,0.12)'], [1, 'rgba(29,33,64,0)']]);
  const beadImg = sprite(32, [[0, 'rgba(255,246,214,1)'], [0.3, 'rgba(226,182,94,1)'], [0.7, 'rgba(168,119,10,1)'], [0.86, 'rgba(120,80,6,0.6)'], [1, 'rgba(120,80,6,0)']]);
  // 땅 고리의 경위도 상자 (확대했을 때 화면 밖 고리 건너뛰기)
  const land = o.land;
  const ringBox = land ? land.rings.map((r) => {
    let a = Infinity, b = -Infinity, c = Infinity, d = -Infinity;
    for (let i = 0; i < r.length; i += 2) { a = Math.min(a, r[i]); b = Math.max(b, r[i]); c = Math.min(c, r[i + 1]); d = Math.max(d, r[i + 1]); }
    return [a, b, c, d];
  }) : [];
  const jit = new Float32Array(4096);
  for (let i = 0; i < jit.length; i++) jit[i] = rngDecor.next() - 0.5;

  let W = 1, H = 1, dpr = 1, rect = { x: 0, y: 0, w: 1, h: 1 };
  let view = { u: 0.5, v: 0.5, k: 1 };
  let base = null, levels = null;   // levels: 확대하는 동안 미리 그려 둔 바탕들 (배율이 가장 가까운 것을 늘려 쓴다)
  let dots = new Map();   // key → { lat, lon, t0, out }
  let markers = [], threads = [], rosaryState = null, anims = [];
  let raf = 0, disposed = false;
  // 시계: 보통은 performance.now. 시험 화면에서 멈춘 시각으로 한 장면을 볼 수 있게 opts.clock 을 받는다
  const now = o.clock || (() => (typeof performance !== 'undefined' ? performance.now() : Date.now()));

  function layout() {
    dpr = Math.min(2, (typeof devicePixelRatio === 'number' ? devicePixelRatio : 1) || 1);
    const cw = canvas.clientWidth || canvas.width || 800, ch = canvas.clientHeight || canvas.height || 450;
    W = Math.max(2, Math.round(cw * dpr)); H = Math.max(2, Math.round(ch * dpr));
    canvas.width = W; canvas.height = H;
    const side = Math.max(14 * dpr, W * 0.035);
    const top = o.title ? Math.min(78 * dpr, H * 0.11) : side, bot = Math.min(40 * dpr, H * 0.06);
    let mw = W - 2 * side, mh = mw / RATIO;
    const ah = H - top - bot - 2 * side * 0.6;
    if (mh > ah) { mh = ah; mw = mh * RATIO; }
    rect = { x: (W - mw) / 2, y: top + side * 0.6 + (ah - mh) / 2, w: mw, h: mh };
  }
  // 바탕 크기에 따른 선 굵기 단위 (1480 css px 폭 기준)
  const unit = () => dpr * clamp(rect.w / (1480 * dpr), 0.5, 1.5);
  const cx0 = () => rect.x + rect.w / 2, cy0 = () => rect.y + rect.h / 2;
  function toPx(lat, lon, vw = view) {
    const p = project(lat, lon);
    return [cx0() + (p.x - vw.u) * rect.w * vw.k, cy0() + (p.y - vw.v) * rect.h * vw.k];
  }
  const uvPx = (u, v, vw) => [cx0() + (u - vw.u) * rect.w * vw.k, cy0() + (v - vw.v) * rect.h * vw.k];

  // ── 바탕 그리기 ────────────────────────────────────────────────
  function landPath(vw, jitter = 0.5) {
    const p = new Path2D();
    if (!land) return p;
    const [ax, ay] = uvPx(0, 0, vw);
    const sx = rect.w * vw.k / 360, sy = rect.h * vw.k / (LAT_N - LAT_S);
    const pad = 4;
    const lonMin = -180 + (-ax) / sx - pad, lonMax = -180 + (W - ax) / sx + pad;
    const latMax = LAT_N - (-ay) / sy + pad, latMin = LAT_N - (H - ay) / sy - pad;
    const jj = jitter * dpr;
    let gi = 0;
    land.rings.forEach((r, ri) => {
      const b = ringBox[ri];
      const n = r.length / 2;
      if (b[1] < lonMin || b[0] > lonMax || b[3] < latMin || b[2] > latMax) { gi += n; return; }
      for (let i = 0; i < n; i++, gi++) {
        const x = ax + (r[2 * i] + 180) * sx + jit[gi & 4095] * jj, y = ay + (LAT_N - r[2 * i + 1]) * sy + jit[(gi * 7 + 3) & 4095] * jj;
        if (i) p.lineTo(x, y); else p.moveTo(x, y);
      }
      p.closePath();
    });
    return p;
  }

  function paint(vw) {
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const U = unit(), zk = Math.sqrt(vw.k);
    const deco = createRng('atlas-paint');
    // 1) 종이
    const pg = g.createRadialGradient(W * 0.48, H * 0.45, 0, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    pg.addColorStop(0, '#f5ebd2'); pg.addColorStop(0.6, '#eddcb6'); pg.addColorStop(1, '#d9bf8b');
    g.fillStyle = pg; g.fillRect(0, 0, W, H);
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.1;
    const cp = g.createPattern(cloud, 'repeat'); cp.setTransform(new DOMMatrix().scale(3.4 * dpr));
    g.fillStyle = cp; g.fillRect(0, 0, W, H);
    g.restore();
    // 얼룩 (지도 좌표에 붙어 확대와 함께 움직인다)
    g.save(); g.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 16; i++) {
      const [x, y] = uvPx(deco.range(-0.08, 1.08), deco.range(-0.25, 1.25), vw);
      const r = deco.range(0.025, 0.11) * rect.w * vw.k;
      const sg = g.createRadialGradient(x, y, r * 0.2, x, y, r);
      const a = deco.range(0.04, 0.1);
      sg.addColorStop(0, `rgba(176,128,62,${a * 0.6})`); sg.addColorStop(0.85, `rgba(170,118,50,${a})`); sg.addColorStop(0.93, `rgba(150,100,40,${a * 1.6})`); sg.addColorStop(1, 'rgba(150,100,40,0)');
      g.fillStyle = sg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    for (let i = 0; i < 60; i++) {   // 여우 반점 (foxing)
      const [x, y] = uvPx(deco.next(), deco.range(-0.2, 1.2), vw);
      const r = deco.range(1.5, 6) * dpr * zk;
      g.fillStyle = `rgba(150,96,40,${deco.range(0.05, 0.16)})`;
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    g.restore();

    const [mx0, my0] = uvPx(0, 0, vw), [mx1, my1] = uvPx(1, 1, vw);
    const lp = landPath(vw, 0.55);
    const ink = (a) => `rgba(29,33,64,${a})`;
    g.save();
    g.beginPath(); g.rect(mx0, my0, mx1 - mx0, my1 - my0); g.clip();
    // 2) 바다: 옅은 수채
    const sea = g.createLinearGradient(0, my0, 0, my1);
    sea.addColorStop(0, '#d3ddd2'); sea.addColorStop(0.5, '#cbdad6'); sea.addColorStop(1, '#d2dbd0');
    g.fillStyle = sea; g.fillRect(mx0, my0, mx1 - mx0, my1 - my0);
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.24;
    const sp = g.createPattern(cloud, 'repeat');
    sp.setTransform(new DOMMatrix().translate(mx0, my0).scale(2.6 * dpr * zk));
    g.fillStyle = sp; g.fillRect(mx0, my0, mx1 - mx0, my1 - my0);
    g.restore();
    g.save(); g.globalCompositeOperation = 'multiply';
    for (let i = 0; i < 26; i++) {   // 물감 고임
      const [x, y] = uvPx(deco.next(), deco.next(), vw);
      const r = deco.range(0.03, 0.12) * rect.w * vw.k;
      const wg = g.createRadialGradient(x, y, 0, x, y, r);
      wg.addColorStop(0, 'rgba(120,160,175,0)'); wg.addColorStop(0.8, `rgba(120,160,175,${deco.range(0.05, 0.12)})`); wg.addColorStop(1, 'rgba(120,160,175,0)');
      g.fillStyle = wg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    g.restore();
    // 바닷가 짙은 물빛 (여러 번 겹쳐 흐리게)
    g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
    for (const [w, a] of [[30, 0.045], [21, 0.055], [14, 0.065], [8, 0.08], [4, 0.1]]) {
      g.lineWidth = w * U * Math.min(1.6, zk); g.strokeStyle = `rgba(42,104,148,${a})`; g.stroke(lp);
    }
    g.restore();
    // 물결 선 (water lining): 바깥에서 안쪽으로, 고리 하나씩 지우며
    const wl = document.createElement('canvas'); wl.width = W; wl.height = H;
    const w2 = wl.getContext('2d'); w2.lineJoin = 'round';
    const gap = 3.1 * U * Math.min(1.5, zk), lw = 0.75 * U;
    const ringA = [0.5, 0.24, 0.12, 0.06];
    for (let i = ringA.length; i >= 1; i--) {
      w2.globalCompositeOperation = 'source-over'; w2.globalAlpha = ringA[i - 1];
      w2.strokeStyle = C.ink; w2.lineWidth = 2 * i * gap; w2.stroke(lp);
      w2.globalCompositeOperation = 'destination-out'; w2.globalAlpha = 1;
      w2.lineWidth = 2 * i * gap - 2 * lw; w2.stroke(lp);
    }
    g.drawImage(wl, 0, 0);
    // 3) 땅
    g.fillStyle = '#f0e2bf'; g.fill(lp);
    g.save(); g.clip(lp);
    g.globalCompositeOperation = 'multiply';
    g.globalAlpha = 0.13;
    const lpat = g.createPattern(cloud, 'repeat'); lpat.setTransform(new DOMMatrix().translate(mx0 * 0.3, 0).scale(1.2 * dpr * zk));
    g.fillStyle = lpat; g.fillRect(mx0, my0, mx1 - mx0, my1 - my0);
    g.globalAlpha = 1;
    const ppd = rect.w * vw.k / 360;
    for (const [la, lo, rd, col, a] of TINTS) {
      const [x, y] = toPx(la, lo, vw), r = rd * ppd;
      const tg = g.createRadialGradient(x, y, 0, x, y, r);
      const rgb = parseInt(col.slice(1), 16);
      const c = `${rgb >> 16},${(rgb >> 8) & 255},${rgb & 255}`;
      tg.addColorStop(0, `rgba(${c},${a})`); tg.addColorStop(0.6, `rgba(${c},${a * 0.6})`); tg.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = tg; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
    // 바닷가 안쪽 따뜻한 번짐
    g.globalCompositeOperation = 'multiply';
    for (const [w, a] of [[14, 0.06], [7, 0.08], [3, 0.1]]) { g.lineWidth = w * U; g.strokeStyle = `rgba(190,150,90,${a})`; g.stroke(lp); }
    g.globalCompositeOperation = 'source-over';
    hachures(g, vw, U, zk);
    g.restore();
    // 4) 해안선 (잉크, 조금 굵기가 들쭉날쭉: 두 번 겹쳐 긋기)
    g.lineJoin = 'round';
    g.strokeStyle = ink(0.85); g.lineWidth = 1.15 * U * Math.min(1.6, 0.8 + 0.2 * zk); g.stroke(lp);
    g.strokeStyle = ink(0.25); g.lineWidth = 2.2 * U; g.stroke(lp);
    // 5) 경위선
    graticule(g, vw, U);
    oceans(g, vw, U);
    compass(g, vw, U);
    g.restore();
    // 6) 테두리 · 제목
    frame(g, vw, U);
    if (o.title) title(g, vw, U);
    // 7) 종이 결 · 섬유 · 가장자리 그을음
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.2;
    const gp = g.createPattern(grain, 'repeat'); gp.setTransform(new DOMMatrix().scale(dpr * 0.9));
    g.fillStyle = gp; g.fillRect(0, 0, W, H);
    g.globalAlpha = 1;
    for (let i = 0; i < 420; i++) {
      const x = deco.next() * W, y = deco.next() * H, l = deco.range(4, 16) * dpr, a = deco.next() * TAU;
      g.strokeStyle = deco.chance(0.5) ? `rgba(120,86,40,${deco.range(0.04, 0.1)})` : `rgba(255,250,235,${deco.range(0.08, 0.2)})`;
      g.globalCompositeOperation = g.strokeStyle.startsWith('rgba(255') ? 'source-over' : 'multiply';
      g.lineWidth = 0.6 * dpr; g.beginPath(); g.moveTo(x, y);
      g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + deco.range(-2, 2) * dpr, y + Math.sin(a) * l * 0.5 + deco.range(-2, 2) * dpr, x + Math.cos(a) * l, y + Math.sin(a) * l);
      g.stroke();
    }
    g.globalCompositeOperation = 'multiply';
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.56);
    vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(0.7, 'rgba(196,160,104,0.35)'); vg.addColorStop(1, 'rgba(110,70,30,0.85)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    const e = Math.min(W, H) * 0.035;
    for (const [x0, y0, x1, y1] of [[0, 0, e, 0], [W, 0, W - e, 0], [0, 0, 0, e], [0, H, 0, H - e]]) {
      const eg = g.createLinearGradient(x0, y0, x1, y1);
      eg.addColorStop(0, 'rgba(90,55,20,0.55)'); eg.addColorStop(1, 'rgba(90,55,20,0)');
      g.fillStyle = eg; g.fillRect(0, 0, W, H);
    }
    g.restore();
    return cv;
  }

  // 산줄기 빗금 (애벌레 빗금: 등줄기에서 양쪽으로 짧은 획, 남동쪽 그늘은 굵고 진하게)
  function hachures(g, vw, U, zk) {
    const light = [-0.7071, -0.7071];
    g.save(); g.lineCap = 'round';
    for (const m of MOUNTAINS) {
      const rng = createRng(`hach|${m.id}`);
      const raw = m.pts.map(([la, lo]) => toPx(la, lo, vw));
      // Catmull–Rom 으로 부드럽게 → 고른 간격으로 다시 찍기
      const smooth = [];
      for (let i = 0; i < raw.length - 1; i++) {
        const p0 = raw[Math.max(0, i - 1)], p1 = raw[i], p2 = raw[i + 1], p3 = raw[Math.min(raw.length - 1, i + 2)];
        for (let t = 0; t < 1; t += 0.1) {
          const t2 = t * t, t3 = t2 * t;
          smooth.push([0, 1].map((k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)));
        }
      }
      smooth.push(raw[raw.length - 1]);
      const cum = [0];
      for (let i = 1; i < smooth.length; i++) cum.push(cum[i - 1] + Math.hypot(smooth[i][0] - smooth[i - 1][0], smooth[i][1] - smooth[i - 1][1]));
      const len = cum[cum.length - 1];
      if (len < 2) continue;
      const lo = Math.min(...smooth.map((p) => p[0])), hi = Math.max(...smooth.map((p) => p[0]));
      const lo2 = Math.min(...smooth.map((p) => p[1])), hi2 = Math.max(...smooth.map((p) => p[1]));
      if (hi < -60 || lo > W + 60 || hi2 < -60 || lo2 > H + 60) continue;
      const scale = U * Math.min(2.4, zk);
      const step = 2.3 * scale;
      // 산줄기 밑 엷은 갈색 바림
      g.strokeStyle = 'rgba(139,104,58,0.07)'; g.lineJoin = 'round';
      for (const w of [7, 4.5, 2.5]) {
        g.lineWidth = (w + 3 * m.h) * scale; g.beginPath();
        smooth.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
      }
      let j = 0;
      for (let s = step * 0.5; s < len; s += step * (0.85 + 0.3 * rng.next())) {
        while (j < cum.length - 2 && cum[j + 1] < s) j++;
        const f = (s - cum[j]) / (cum[j + 1] - cum[j] || 1);
        const a = smooth[j], b = smooth[j + 1];
        const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
        let tx = b[0] - a[0], ty = b[1] - a[1];
        const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
        const nx = -ty, ny = tx;
        const prof = Math.pow(Math.sin(Math.PI * clamp(s / len, 0.02, 0.98)), 0.55);
        for (const side of [1, -1]) {
          const shade = (nx * side * light[0] + ny * side * light[1]) < 0;   // 빛을 등진 쪽
          const L = (2.6 + 2.4 * m.h) * scale * prof * (0.65 + 0.7 * rng.next());
          const bend = (rng.next() - 0.5) * 0.5;
          const ex = x + (nx * side + tx * bend) * L, ey = y + (ny * side + ty * bend) * L;
          g.strokeStyle = `rgba(52,40,34,${shade ? 0.66 : 0.36})`;
          g.lineWidth = (shade ? 0.95 : 0.55) * U * (1 + 0.15 * m.h);
          g.beginPath(); g.moveTo(x + nx * side * 0.6 * scale, y + ny * side * 0.6 * scale); g.lineTo(ex, ey); g.stroke();
          if (m.h >= 2 && rng.chance(0.55)) {   // 바깥 줄 (기슭)
            const L2 = L * (0.5 + 0.4 * rng.next());
            g.strokeStyle = `rgba(52,40,34,${shade ? 0.42 : 0.22})`; g.lineWidth = 0.5 * U;
            g.beginPath(); g.moveTo(ex + nx * side * 1.2 * scale, ey + ny * side * 1.2 * scale); g.lineTo(ex + nx * side * L2, ey + ny * side * L2); g.stroke();
          }
        }
      }
    }
    g.restore();
  }

  function graticule(g, vw, U) {
    g.save();
    g.lineWidth = 0.6 * U; g.strokeStyle = 'rgba(29,33,64,0.13)';
    for (let lon = -165; lon <= 165; lon += 15) {
      const [x, y0] = toPx(LAT_N, lon, vw), [, y1] = toPx(LAT_S, lon, vw);
      g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y1); g.stroke();
    }
    for (let lat = -45; lat <= 75; lat += 15) {
      if (lat === 0) continue;
      const [x0, y] = toPx(lat, -180, vw), [x1] = toPx(lat, 180, vw);
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    }
    const line = (lat, col, w, dash) => {
      const [x0, y] = toPx(lat, -180, vw), [x1] = toPx(lat, 180, vw);
      g.strokeStyle = col; g.lineWidth = w * U; g.setLineDash(dash.map((d) => d * U));
      g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke();
    };
    line(0, 'rgba(29,33,64,0.38)', 0.9, []);
    line(23.44, 'rgba(150,62,40,0.35)', 0.8, [7, 4]);
    line(-23.44, 'rgba(150,62,40,0.35)', 0.8, [7, 4]);
    line(66.56, 'rgba(42,104,148,0.35)', 0.8, [2, 4]);
    g.setLineDash([]);
    g.restore();
  }

  function oceans(g, vw, U) {
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(29,33,64,0.5)';
    for (const oc of MAP_TEXT.oceans) {
      const [x, y] = toPx(oc.lat, oc.lon, vw);
      if (x < -200 || x > W + 200 || y < -50 || y > H + 50) continue;
      const fs = (o.lang === 'ko' ? 17 : 13) * U * Math.min(1.8, Math.sqrt(vw.k));
      g.font = `italic ${fs}px ${SERIF}`;
      if ('letterSpacing' in g) g.letterSpacing = `${(o.lang === 'ko' ? 4 : 3) * U}px`;
      g.fillText(oc[o.lang] || oc.en, x, y);
    }
    g.restore();
  }

  // 나침반 장미 (남태평양)
  function compass(g, vw, U) {
    const [x, y] = toPx(-38, -126, vw);
    const R = 46 * U * Math.min(2, Math.sqrt(vw.k));
    if (x < -R * 2 || x > W + R * 2 || y < -R * 2 || y > H + R * 2) return;
    g.save(); g.translate(x, y);
    g.strokeStyle = 'rgba(29,33,64,0.7)'; g.lineWidth = 0.8 * U;
    g.fillStyle = 'rgba(246,239,226,0.55)';
    g.beginPath(); g.arc(0, 0, R * 0.98, 0, TAU); g.fill(); g.stroke();
    g.beginPath(); g.arc(0, 0, R * 0.88, 0, TAU); g.stroke();
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * TAU, l = i % 8 === 0 ? 0.14 : i % 2 === 0 ? 0.08 : 0.05;
      g.beginPath(); g.moveTo(Math.cos(a) * R * 0.88, Math.sin(a) * R * 0.88); g.lineTo(Math.cos(a) * R * (0.88 + l * 0.7), Math.sin(a) * R * (0.88 + l * 0.7)); g.stroke();
    }
    // 바람 장미 32방 → 8방 큰 꼭지 + 8방 작은 꼭지
    const point = (a, len, wid, dark, gold) => {
      const c = Math.cos(a), s = Math.sin(a), px = -s, py = c;
      const tip = [c * len, s * len], l = [c * wid * 1.1 + px * wid, s * wid * 1.1 + py * wid], r = [c * wid * 1.1 - px * wid, s * wid * 1.1 - py * wid];
      g.beginPath(); g.moveTo(0, 0); g.lineTo(...l); g.lineTo(...tip); g.closePath();
      g.fillStyle = gold ? C.goldDeep : dark; g.fill(); g.stroke();
      g.beginPath(); g.moveTo(0, 0); g.lineTo(...r); g.lineTo(...tip); g.closePath();
      g.fillStyle = gold ? C.gold : 'rgba(246,239,226,0.95)'; g.fill(); g.stroke();
    };
    for (let i = 0; i < 8; i++) point((i / 8) * TAU + TAU / 16, R * 0.5, R * 0.06, 'rgba(29,33,64,0.55)', false);
    for (let i = 0; i < 4; i++) point((i / 4) * TAU + TAU / 8, R * 0.66, R * 0.09, 'rgba(29,33,64,0.8)', false);
    for (let i = 0; i < 4; i++) point((i / 4) * TAU - TAU / 4, R * 0.9, R * 0.12, C.ink, i === 0);
    g.fillStyle = C.gold; g.beginPath(); g.arc(0, 0, R * 0.06, 0, TAU); g.fill(); g.stroke();
    g.fillStyle = C.ink; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = `700 ${R * 0.26}px ${SERIF}`;
    g.fillText('N', 0, -R * 1.06);
    g.restore();
  }

  function frame(g, vw, U) {
    const [x0, y0] = uvPx(0, 0, vw), [x1, y1] = uvPx(1, 1, vw);
    const b = 7 * U;
    g.save();
    g.strokeStyle = C.ink; g.lineWidth = 0.9 * U; g.strokeRect(x0, y0, x1 - x0, y1 - y0);
    // 도(度) 눈금 띠: 10°마다 잉크·종이 번갈아
    const sx = (x1 - x0) / 360, sy = (y1 - y0) / (LAT_N - LAT_S);
    for (let lon = -180, k = 0; lon < 180; lon += 10, k++) {
      g.fillStyle = k % 2 ? 'rgba(29,33,64,0.85)' : 'rgba(246,239,226,0.9)';
      g.fillRect(x0 + (lon + 180) * sx, y0 - b, 10 * sx, b);
      g.fillRect(x0 + (lon + 180) * sx, y1, 10 * sx, b);
    }
    for (let lat = LAT_N, k = 0; lat > LAT_S; lat -= 10, k++) {
      const h = Math.min(10, lat - LAT_S) * sy;
      g.fillStyle = k % 2 ? 'rgba(29,33,64,0.85)' : 'rgba(246,239,226,0.9)';
      g.fillRect(x0 - b, y0 + (LAT_N - lat) * sy, b, h);
      g.fillRect(x1, y0 + (LAT_N - lat) * sy, b, h);
    }
    g.lineWidth = 0.7 * U; g.strokeRect(x0 - b, y0 - b, x1 - x0 + 2 * b, y1 - y0 + 2 * b);
    g.lineWidth = 2.2 * U; g.strokeRect(x0 - b - 4 * U, y0 - b - 4 * U, x1 - x0 + 2 * b + 8 * U, y1 - y0 + 2 * b + 8 * U);
    // 도 숫자
    g.fillStyle = 'rgba(29,33,64,0.7)'; g.font = `${9 * U}px ${SERIF}`;
    g.textAlign = 'center'; g.textBaseline = 'top';
    for (let lon = -150; lon <= 150; lon += 30) g.fillText(`${Math.abs(lon)}°`, x0 + (lon + 180) * sx, y1 + b + 6 * U);
    g.textAlign = 'right'; g.textBaseline = 'middle';
    for (let lat = 60; lat >= -45; lat -= 15) g.fillText(`${Math.abs(lat)}°`, x0 - b - 7 * U, y0 + (LAT_N - lat) * sy);
    g.restore();
  }

  function title(g, vw, U) {
    const [x0, y0] = uvPx(0, 0, vw), [x1] = uvPx(1, 0, vw);
    const cx = (x0 + x1) / 2, y = y0 - 7 * U - 4 * U - Math.min(30 * U, (y0 - 0) * 0.42);
    const main = MAP_TEXT.title[o.lang] || MAP_TEXT.title.en, other = MAP_TEXT.title[o.lang === 'ko' ? 'en' : 'ko'];
    g.save(); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = C.ink;
    const fs = 26 * U;
    g.font = `700 ${fs}px ${SERIF}`;
    if ('letterSpacing' in g) g.letterSpacing = `${6 * U}px`;
    g.fillText(main, cx, y);
    const tw = g.measureText(main).width;
    if ('letterSpacing' in g) g.letterSpacing = `${2 * U}px`;
    g.font = `italic ${11 * U}px ${SERIF}`; g.fillStyle = 'rgba(29,33,64,0.7)';
    g.fillText(other, cx, y + fs * 0.85);
    // 양옆 꾸밈선과 마름모
    g.strokeStyle = 'rgba(29,33,64,0.7)'; g.lineWidth = 0.8 * U;
    for (const s of [-1, 1]) {
      const a = cx + s * (tw / 2 + 18 * U), b = cx + s * (tw / 2 + 150 * U);
      g.beginPath(); g.moveTo(a, y); g.lineTo(b, y); g.stroke();
      g.beginPath(); g.moveTo(a, y - 3 * U); g.lineTo(a + s * 90 * U, y - 3 * U); g.stroke();
      g.fillStyle = C.goldDeep;
      g.beginPath(); g.moveTo(a - s * 7 * U, y - 4 * U); g.lineTo(a - s * 3 * U, y); g.lineTo(a - s * 7 * U, y + 4 * U); g.lineTo(a - s * 11 * U, y); g.closePath(); g.fill();
      g.beginPath(); g.arc(b, y, 2 * U, 0, TAU); g.fillStyle = C.ink; g.fill();
    }
    g.restore();
  }

  // ── 위에 얹는 것들 ─────────────────────────────────────────────
  function baseFor(vw) {
    if (!levels) return { img: base.img, v: base.view };
    let best = null;
    for (const L of levels) if (L.view.k <= vw.k * 1.0001 && (!best || L.view.k > best.view.k)) best = L;
    best = best || levels[0];
    return { img: best.img, v: best.view };
  }
  function drawImgAt(img, from, to, alpha = 1) {
    const s = to.k / from.k;
    const dx = cx0() + (from.u - to.u) * rect.w * to.k - cx0() * s;
    const dy = cy0() + (from.v - to.v) * rect.h * to.k - cy0() * s;
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, dx, dy, W * s, H * s);
    ctx.globalAlpha = 1;
  }
  const S = () => unit();

  function drawDots(t) {
    const U = S(), sz = 11 * U;
    for (const [key, d] of dots) {
      let a = clamp((t - d.t0) / 700, 0, 1);
      if (d.out) { a = 1 - clamp((t - d.out) / 600, 0, 1); if (a <= 0) { dots.delete(key); continue; } }
      if (reduce) a = d.out ? 0 : 1;
      if (a <= 0) continue;
      const [x, y] = toPx(d.lat, d.lon);
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) continue;
      const tw = reduce ? 1 : 0.78 + 0.22 * Math.sin(t / 600 * d.sp + d.ph);
      const s = sz * (0.85 + 0.3 * tw);
      ctx.globalAlpha = a * (0.75 + 0.25 * tw);
      ctx.drawImage(dotImg, x - s / 2, y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
  }

  function curve(A, B) {   // 휘어진 금실: 위쪽으로 부푼 2차 곡선
    const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy);
    if (d < 2) {   // 같은 자리: 작은 고리
      const r = 18 * S();
      return Array.from({ length: 40 }, (_, i) => { const a = (i / 39) * TAU - Math.PI / 2; return [A[0] + Math.cos(a) * r * 0.7, A[1] - r * 0.7 + Math.sin(a) * r * 0.7 + r * 0.7]; });
    }
    let px = -dy / d, py = dx / d;
    if (py > 0) { px = -px; py = -py; }
    const bulge = Math.min(d * 0.32, H * 0.28) + 12 * S();
    const cx = (A[0] + B[0]) / 2 + px * bulge, cy = (A[1] + B[1]) / 2 + py * bulge;
    const n = Math.max(30, Math.round(d / (3 * dpr)));
    return Array.from({ length: n + 1 }, (_, i) => {
      const t = i / n, u = 1 - t;
      return [u * u * A[0] + 2 * u * t * cx + t * t * B[0], u * u * A[1] + 2 * u * t * cy + t * t * B[1]];
    });
  }
  // 곡선을 f(0~1)까지 긋고 구슬을 꿴다. 구슬 자리는 길이를 따라 고른 간격
  function drawString(pts, f, { beads = true, width = 1, glowEnd = false } = {}) {
    const U = S();
    const cum = [0];
    for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const len = cum[cum.length - 1], upto = len * clamp(f, 0, 1);
    const path = new Path2D();
    let end = pts[0];
    path.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i++) {
      if (cum[i] <= upto) { path.lineTo(...pts[i]); end = pts[i]; continue; }
      const g = (upto - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      end = [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * g, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * g];
      path.lineTo(...end);
      break;
    }
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(29,33,64,0.28)'; ctx.lineWidth = 4.2 * U * width; ctx.stroke(path);
    ctx.strokeStyle = C.goldDeep; ctx.lineWidth = 2.6 * U * width; ctx.stroke(path);
    ctx.strokeStyle = C.gold; ctx.lineWidth = 1.3 * U * width; ctx.stroke(path);
    ctx.restore();
    if (beads) {
      const gap = 17 * U, r = 7.2 * U;
      let i = 0;
      for (let s = gap; s < len - gap * 0.5; s += gap) {
        if (s > upto) break;
        while (i < cum.length - 2 && cum[i + 1] < s) i++;
        const g = (s - cum[i]) / (cum[i + 1] - cum[i] || 1);
        const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * g, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * g;
        const pop = clamp((upto - s) / (gap * 1.5), 0, 1);
        const rr = r * (0.6 + 0.4 * easeOut(pop));
        ctx.drawImage(beadImg, x - rr, y - rr, rr * 2, rr * 2);
      }
    }
    if (glowEnd && f < 1) { const s = 34 * U; ctx.drawImage(emberImg, end[0] - s / 2, end[1] - s / 2, s, s); }
    return end;
  }

  function drawMarker(m, t) {
    const U = S(), [x, y] = toPx(m.lat, m.lon);
    const pulse = reduce ? 0.5 : (Math.sin((t - m.t0) / 520) + 1) / 2;
    ctx.save();
    ctx.drawImage(shadowImg, x - 16 * U, y - 16 * U, 32 * U, 32 * U);
    ctx.strokeStyle = `rgba(168,119,10,${0.35 + 0.35 * pulse})`; ctx.lineWidth = 1.4 * U;
    ctx.beginPath(); ctx.arc(x, y, (9 + 3 * pulse) * U, 0, TAU); ctx.stroke();
    ctx.strokeStyle = 'rgba(29,33,64,0.55)'; ctx.lineWidth = 0.8 * U;
    ctx.beginPath(); ctx.arc(x, y, (13 + 3 * pulse) * U, 0, TAU); ctx.stroke();
    const s = (30 + 6 * pulse) * U;
    ctx.drawImage(emberImg, x - s / 2, y - s / 2, s, s);
    ctx.fillStyle = C.gold; ctx.strokeStyle = C.ink; ctx.lineWidth = 0.9 * U;
    ctx.beginPath(); ctx.arc(x, y, 3.6 * U, 0, TAU); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function medalPositions(lives) {
    const U = S(), R = 15 * U, out = [];
    lives.forEach((l, i) => {
      let [x, y] = toPx(l.lat, l.lon), k = 0;
      while (out.some((p) => Math.hypot(p[0] - x, p[1] - y) < R * 2.3) && k < 40) {
        const a = i * 2.39996 + k * 0.9, rr = R * (1.3 + k * 0.35);
        [x, y] = toPx(l.lat, l.lon); x += Math.cos(a) * rr; y += Math.sin(a) * rr; k++;
      }
      out.push([x, y]);
    });
    return out;
  }
  function drawMedal(x, y, i, life, a, placed = []) {
    const U = S(), R = 15 * U * (0.5 + 0.5 * easeOut(a));
    ctx.save(); ctx.globalAlpha = clamp(a * 1.5, 0, 1);
    const [ox, oy] = toPx(life.lat, life.lon);
    if (Math.hypot(ox - x, oy - y) > 2) {   // 자리에서 밀려났으면 가는 잉크 끈
      ctx.strokeStyle = 'rgba(29,33,64,0.5)'; ctx.lineWidth = 0.8 * U; ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(x, y); ctx.stroke();
      ctx.fillStyle = C.goldDeep; ctx.beginPath(); ctx.arc(ox, oy, 2.2 * U, 0, TAU); ctx.fill();
    }
    ctx.drawImage(emberImg, x - R * 2.2, y - R * 2.2, R * 4.4, R * 4.4);
    const rim = ctx.createLinearGradient(x - R, y - R, x + R, y + R);
    rim.addColorStop(0, '#fff1c4'); rim.addColorStop(0.45, C.gold); rim.addColorStop(1, C.goldDeep);
    ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(29,33,64,0.7)'; ctx.lineWidth = 0.9 * U; ctx.stroke();
    ctx.save(); ctx.beginPath(); ctx.arc(x, y, R * 0.78, 0, TAU); ctx.clip();
    if (life.img) ctx.drawImage(life.img, x - R * 0.78, y - R * 0.78, R * 1.56, R * 1.56);
    else {
      const ig = ctx.createRadialGradient(x - R * 0.3, y - R * 0.3, 0, x, y, R);
      ig.addColorStop(0, '#3a3f6e'); ig.addColorStop(1, C.ink);
      ctx.fillStyle = ig; ctx.fillRect(x - R, y - R, 2 * R, 2 * R);
      ctx.fillStyle = C.gold; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = `700 ${R * 0.95}px ${SERIF}`; ctx.fillText(String(life.num ?? i + 1), x, y + R * 0.05);
    }
    ctx.restore();
    if (life.label && a > 0.5) {
      ctx.font = `600 ${10.5 * U}px ${SERIF}`;
      const tw = ctx.measureText(life.label).width, pad = 5 * U, h = 15 * U, bw = tw + 2 * pad, Rf = 15 * U;
      // 아래 → 위 → 오른쪽 → 왼쪽 → 더 아래: 앞서 놓은 이름표·메달과 겹치지 않는 첫 자리
      const cand = [[x - bw / 2, y + Rf + 4 * U], [x - bw / 2, y - Rf - 4 * U - h], [x + Rf + 5 * U, y - h / 2], [x - Rf - 5 * U - bw, y - h / 2],
        [x - bw / 2, y + Rf + 8 * U + h], [x - bw / 2, y - Rf - 8 * U - 2 * h]].map(([cx, cy]) => [clamp(cx, 4, W - bw - 4), clamp(cy, 4, H - h - 4)]);
      const hit = ([cx, cy]) => placed.some((r) => cx < r[0] + r[2] && cx + bw > r[0] && cy < r[1] + r[3] && cy + h > r[1]);
      const [lx, ly] = cand.find((c) => !hit(c)) || cand[0];
      placed.push([lx, ly, bw, h]);
      ctx.fillStyle = 'rgba(246,239,226,0.92)'; ctx.strokeStyle = 'rgba(168,119,10,0.85)'; ctx.lineWidth = 0.8 * U;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(lx, ly, tw + 2 * pad, h, 3 * U) : ctx.rect(lx, ly, tw + 2 * pad, h); ctx.fill(); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(life.label, lx + pad, ly + h / 2 + 0.5 * U);
    }
    ctx.restore();
  }

  function drawRosary(t) {
    const r = rosaryState; if (!r) return;
    const n = r.lives.length; if (!n) return;
    const f = reduce ? 1 : clamp((t - r.t0) / r.ms, 0, 1);
    const pos = medalPositions(r.lives);
    const segF = f * Math.max(1, n - 1);
    for (let i = 0; i < n - 1; i++) {
      const sf = clamp(segF - i, 0, 1);
      if (sf <= 0) break;
      drawString(curve(pos[i], pos[i + 1]), easeIO(sf), { beads: true, width: 0.9, glowEnd: true });
    }
    const R = 15 * S(), placed = pos.map(([x, y]) => [x - R, y - R, 2 * R, 2 * R]);   // 메달 자리는 이름표가 비켜 간다
    for (let i = 0; i < n; i++) {
      const a = clamp((segF - (i - 0.35)) / 0.35, 0, 1);
      if (i === 0 || a > 0) drawMedal(pos[i][0], pos[i][1], i, r.lives[i], i === 0 ? clamp(f * 6, 0, 1) : a, placed);
    }
  }

  function render() {
    const t = now();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!base) base = { img: paint(view), view: { ...view } };
    const b = baseFor(view);
    drawImgAt(b.img, b.v, view);
    drawDots(t);
    for (const th of threads) drawString(curve(toPx(th.from.lat, th.from.lon), toPx(th.to.lat, th.to.lon)), 1);
    drawRosary(t);
    for (const m of markers) drawMarker(m, t);
    for (const a of anims.slice()) {
      const f = reduce ? 1 : clamp((t - a.t0) / a.ms, 0, 1);
      a.draw(f, t);
      if (f >= 1) { anims.splice(anims.indexOf(a), 1); a.end?.(); a.resolve(); }
    }
  }
  const living = () => anims.length || (!reduce && (dots.size || markers.length || (rosaryState && now() - rosaryState.t0 < rosaryState.ms + 100)));
  function loop() {
    raf = 0;
    if (disposed || (canvas && (canvas.parentElement?.hidden || !canvas.clientWidth))) return;
    render();
    if (living()) raf = requestAnimationFrame(loop);
  }
  function kick() { if (!raf && !disposed) raf = requestAnimationFrame(loop); }
  function animate(ms, draw, end) {
    return new Promise((resolve) => { anims.push({ t0: now(), ms: reduce ? 0 : ms, draw, end, resolve }); kick(); });
  }

  // ── 바깥에 내놓는 것 ───────────────────────────────────────────
  const api = {
    get view() { return { ...view }; },
    get reducedMotion() { return reduce; },
    toPx: (spot) => { const [x, y] = toPx(spot.lat, spot.lon); return { x: x / dpr, y: y / dpr }; },
    drawBase() { base = { img: paint(view), view: { ...view } }; levels = null; kick(); return base.img; },
    setLang(lang) { o.lang = lang; api.drawBase(); },
    // 그해 사람들이 살던 곳: 금빛 점 (geo.js dotsFor)
    setYear(year, { n = o.dots, seed = o.seed } = {}) {
      const next = dotsFor(year, n, seed, land), keep = new Set(), t = now();
      for (const d of next) {
        const key = `${d.area}|${d.i}`; keep.add(key);
        const old = dots.get(key);
        if (old && !old.out) continue;
        const r = createRng(key);
        dots.set(key, { lat: d.lat, lon: d.lon, t0: t + r.next() * 300, out: 0, sp: 0.6 + r.next() * 0.9, ph: r.next() * TAU });
      }
      for (const [key, d] of dots) if (!keep.has(key) && !d.out) d.out = t;
      kick();
      return next.length;
    },
    clearDots() { dots.clear(); kick(); },
    // 불씨 내려앉기 → 빛 고리 → 자리 표시
    birth(spot, { ms = 2600 } = {}) {
      const sparks = Array.from({ length: 22 }, () => ({ a: Math.random() * TAU, v: 0.4 + Math.random(), d: Math.random() * 0.25 }));
      const side = Math.random() < 0.5 ? -1 : 1;
      return animate(ms, (f, t) => {
        const U = S(), [x, y] = toPx(spot.lat, spot.lon);
        const fall = 0.72;
        const sx = clamp(x + side * W * 0.1, 30 * U, W - 30 * U), sy = Math.max(-20 * U, y - H * 0.5);
        const pathAt = (q) => {
          const e = easeIO(q), u = 1 - e, cx = sx + side * W * 0.04, cy = y - H * 0.08;
          const sway = Math.sin(q * 9) * 6 * U * (1 - q);
          return [u * u * sx + 2 * u * e * cx + e * e * x + sway, u * u * sy + 2 * u * e * cy + e * e * y];
        };
        if (f < fall) {
          const q = f / fall;
          const sh = (10 + 26 * q) * U;   // 내려앉을 자리에 짙어지는 그림자
          ctx.globalAlpha = 0.3 + 0.7 * q;
          ctx.drawImage(shadowImg, x - sh, y - sh * 0.6, sh * 2, sh * 1.2);
          for (let k = 14; k >= 1; k--) {   // 꼬리
            const qq = q - k * 0.012; if (qq < 0) continue;
            const [px, py] = pathAt(qq), s = (22 - k) * U * 0.9;
            ctx.globalAlpha = 0.5 * (1 - k / 15);
            ctx.drawImage(emberImg, px - s / 2, py - s / 2, s, s);
          }
          ctx.globalAlpha = 1;
          const [px, py] = pathAt(q), s = (54 + 8 * Math.sin(t / 70)) * U;
          ctx.drawImage(emberImg, px - s / 2, py - s / 2, s, s);
        } else {
          const e = (f - fall) / (1 - fall);
          ctx.save();
          for (const [delay, rmax, col] of [[0, 54, '226,182,94'], [0.18, 34, '168,119,10']]) {
            const g = clamp((e - delay) / (1 - delay), 0, 1); if (g <= 0) continue;
            ctx.strokeStyle = `rgba(${col},${0.9 * (1 - g)})`; ctx.lineWidth = (3 - 2 * g) * U;
            ctx.beginPath(); ctx.arc(x, y, (6 + rmax * easeOut(g)) * U, 0, TAU); ctx.stroke();
          }
          for (const sp of sparks) {
            const g = clamp((e - sp.d) / 0.6, 0, 1); if (g <= 0 || g >= 1) continue;
            const r = (8 + 40 * sp.v * easeOut(g)) * U, s = 8 * U * (1 - g);
            ctx.globalAlpha = 1 - g;
            ctx.drawImage(emberImg, x + Math.cos(sp.a) * r - s / 2, y + Math.sin(sp.a) * r - s / 2 - 10 * U * g, s, s);
          }
          ctx.globalAlpha = 1;
          const s = (60 * (1 - e) + 30) * U;
          ctx.drawImage(emberImg, x - s / 2, y - s / 2, s, s);
          ctx.restore();
        }
      }, () => { markers.push({ lat: spot.lat, lon: spot.lon, t0: now() }); });
    },
    // 매듭에서 다음 탄생지까지 휘어진 금실 (구슬이 차례로 꿰인다)
    thread(from, to, { ms = 2000, keep = true } = {}) {
      return animate(ms, (f) => {
        const end = drawString(curve(toPx(from.lat, from.lon), toPx(to.lat, to.lon)), easeIO(f), { glowEnd: true });
        if (f > 0.92) {
          const g = (f - 0.92) / 0.08, U = S();
          ctx.strokeStyle = `rgba(226,182,94,${1 - g})`; ctx.lineWidth = 2 * U;
          ctx.beginPath(); ctx.arc(end[0], end[1], (6 + 26 * g) * U, 0, TAU); ctx.stroke();
        }
      }, () => {
        if (keep) threads.push({ from, to });
        markers = markers.filter((m) => !(m.lat === from.lat && m.lon === from.lon));
        markers.push({ lat: to.lat, lon: to.lon, t0: now() });
      });
    },
    // 영혼의 염주: lives = [{ lat, lon, label, num?, img? }] 태어난 차례대로
    rosary(lives, { ms = 900 * Math.max(1, lives.length - 1) } = {}) {
      threads = []; markers = [];
      rosaryState = { lives: lives.map((l) => ({ ...l })), t0: now(), ms: reduce ? 0 : ms };
      kick();
      return new Promise((res) => (reduce ? res() : setTimeout(res, ms + 50)));
    },
    // 그 자리로 다가가기 (지도 → 3D 무대). k = 배율
    zoomTo(spot, { k = 6, ms = 1600 } = {}) {
      const p = project(spot.lat, spot.lon);
      return api.viewTo({ u: p.x, v: p.y, k }, ms);
    },
    resetView(ms = 1200) { return api.viewTo({ u: 0.5, v: 0.5, k: 1 }, ms); },
    viewTo(target, ms = 1600) {
      const from = { ...view }, to = { ...target };
      const at = (e) => {
        const k = from.k * Math.pow(to.k / from.k, e);
        // 배율이 바뀌는 동안 목표가 화면에서 곧게 다가오도록 (k 에 맞춘 보간)
        const w = from.k === to.k ? e : (1 / from.k - 1 / k) / (1 / from.k - 1 / to.k);
        return { u: from.u + (to.u - from.u) * w, v: from.v + (to.v - from.v) * w, k };
      };
      if (reduce || ms <= 0) { view = to; base = { img: paint(view), view: { ...view } }; levels = null; kick(); return Promise.resolve(); }
      levels = [{ img: base.img, view: base.view }];
      const steps = Math.max(1, Math.ceil(Math.abs(Math.log2(to.k / from.k)) / 1.2));
      for (let i = 1; i < steps; i++) { const v = at(i / steps); levels.push({ img: paint(v), view: v }); }
      const finalImg = paint(to);
      levels.push({ img: finalImg, view: { ...to } });
      return animate(ms, (f) => { view = at(easeIO(f)); }, () => {
        view = { ...to };
        base = { img: finalImg, view: { ...to } }; levels = null;
      });
    },
    clear() { threads = []; markers = []; rosaryState = null; anims.forEach((a) => a.resolve()); anims = []; kick(); },
    resize() { layout(); base = { img: paint(view), view: { ...view } }; levels = null; kick(); },
    render,
    dispose() {
      disposed = true; if (raf) cancelAnimationFrame(raf); raf = 0;
      mq?.removeEventListener?.('change', onMq);
      anims.forEach((a) => a.resolve()); anims = []; dots.clear(); base = null; levels = null;
    },
  };
  layout();
  api.drawBase();
  return api;
}
