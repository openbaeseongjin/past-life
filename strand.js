// 2D 그림 (화면 다시 기획 4.5): 구슬 실 · 동갑내기 실 · 매듭 · 백 가닥 (염주·탄생은 worldmap.js 지도)
// 모두 그리기만 한다 (DOM·상태 없음). 돌려주는 좌표는 CSS 픽셀이고 누르기 판정에 쓴다
import { MOOD_COLORS, decodeBeads } from './beads.js';

const GOLD = '#e2b65e', GOLD_D = '#a8770a', GOLD_L = '#fff1c4', THREAD = '#b8904a', PEER = 'rgba(222,214,194,.62)';
const TAU = Math.PI * 2, GAP = 2.45;   // 구슬 사이 = 반지름 × GAP (사이로 실이 조금 보인다)
export const MEM_SCALE = 1.6;   // 모닥불에서 꿴 기억 구슬은 1.6배 (identity 설계 3.5)
const TRACE = '142,195,234';    // 메아리 기억 구슬의 푸른 둘레 (--trace-l)

// 기억 구슬 나이 → { echo, grow }. 저장값을 그대로 받아도 깨지지 않게 (정수 나이만)
function memMap(mem) {
  const out = new Map();
  for (const m of Array.isArray(mem) ? mem : []) {
    if (!m || !Number.isInteger(m.age) || m.age < 0) continue;
    const was = out.get(m.age), grow = Number.isFinite(m.grow) ? clamp(m.grow, 0, 1) : 1;
    out.set(m.age, { echo: !!m.echo || !!(was && was.echo), grow: Math.max(grow, was ? was.grow : 0) });
  }
  return out;
}
// 기억 구슬: 둘레 빛(금, 메아리는 푸름) + 큰 구슬 + 가는 테
function memBead(g, x, y, r, b, echo) {
  // 메아리는 어두운 바탕에서 금 구슬만큼 눈에 띄게 둘레 빛을 더 짙고 넓게
  const c = echo ? TRACE : '255,214,130', hr = echo ? 2.1 : 1.75;
  g.save();
  const halo = g.createRadialGradient(x, y, r * 0.8, x, y, r * hr);
  halo.addColorStop(0, `rgba(${c},${echo ? 0.9 : 0.55})`); halo.addColorStop(1, `rgba(${c},0)`);
  g.fillStyle = halo; g.beginPath(); g.arc(x, y, r * hr, 0, TAU); g.fill();
  g.restore();
  bead(g, x, y, r, b, echo ? 0 : 0.55);
  g.save(); g.strokeStyle = echo ? `rgba(${TRACE},1)` : 'rgba(255,233,170,.9)'; g.lineWidth = Math.max(1, r * (echo ? 0.16 : 0.11));
  if (echo) { g.shadowColor = `rgba(${TRACE},1)`; g.shadowBlur = r * 0.8; }
  g.beginPath(); g.arc(x, y, r + g.lineWidth * 0.9, 0, TAU); g.stroke(); g.restore();
}
const FONT = '"IBM Plex Sans KR", system-ui, sans-serif';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// CSS 크기 × 픽셀 비율(최대 2)로 맞추고 지운다.
// 화면 밖 캔버스(문서에 없음·숨김·OffscreenCanvas: CSS 크기 0)는 제 픽셀 크기를 그대로 쓴다 (비율 1, 크기를 바꾸지 않음. 공유 그림용 900×360 은 900×360)
export function fit(cv) {
  const shown = cv.clientWidth > 0 && cv.clientHeight > 0;
  const r = shown ? Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1) : 1;
  const w = shown ? cv.clientWidth : cv.width || 1, h = shown ? cv.clientHeight : cv.height || 1;
  const W = Math.round(w * r), H = Math.round(h * r);
  if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
  const g = cv.getContext('2d');
  g.setTransform(r, 0, 0, r, 0, 0); g.clearRect(0, 0, w, h);
  g.globalAlpha = 1; g.shadowBlur = 0; g.shadowColor = 'transparent'; g.setLineDash([]);
  return { g, w, h };
}

function shade(hex, k, a = 1) {   // k<0 어둡게, k>0 밝게
  const n = parseInt(hex.slice(1), 16), f = (c) => clamp(Math.round(k < 0 ? c * (1 + k) : c + (255 - c) * k), 0, 255);
  return `rgba(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)},${a})`;
}
// 네 갈래 반짝이 (별 구슬)
function sparkle(g, x, y, s) {
  g.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 2, b = a + Math.PI / 2, m = a + Math.PI / 4;
    if (!i) g.moveTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
    g.quadraticCurveTo(x + Math.cos(m) * s * 0.17, y + Math.sin(m) * s * 0.17, x + Math.cos(b) * s, y + Math.sin(b) * s);
  }
  g.closePath();
}
const CRACK = [[-0.66, -0.3], [-0.22, 0.04], [0.04, -0.2], [0.3, 0.12], [0.66, 0.34]];

// 구슬 한 알: 유리알 (빛이 왼쪽 위에서 들어와 오른쪽 아래에 고인다) + 별 · 금. glow 0~1 은 금빛 둘레
export function bead(g, x, y, r, b, glow = 0) {
  const mood = MOOD_COLORS[b.mood] ? b.mood : 2, c = MOOD_COLORS[mood];
  g.save();
  if (glow) { g.shadowColor = `rgba(255,206,112,${0.95 * glow})`; g.shadowBlur = r * 1.9 * glow; }
  else if (r >= 4) { g.shadowColor = 'rgba(6,6,22,.45)'; g.shadowBlur = r * 0.6; g.shadowOffsetY = r * 0.22; }
  // 몸: 가운데는 비치고(뒤의 실이 보인다) 가장자리로 갈수록 짙어진다
  const body = g.createRadialGradient(x, y, 0, x, y, r);
  body.addColorStop(0, shade(c, 0.2, 0.42)); body.addColorStop(0.62, shade(c, 0, 0.66)); body.addColorStop(0.9, shade(c, -0.3, 0.9)); body.addColorStop(1, shade(c, -0.55, 0.97));
  g.fillStyle = body; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
  g.restore();
  g.save();
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.clip();
  g.lineCap = 'round'; g.lineJoin = 'round';
  // 속빛: 왼쪽 위에서 든 빛이 오른쪽 아래에 고인다. 마음이 밝을수록 더 빛난다
  const cx = x + r * 0.26, cy = y + r * 0.36, ca = g.createRadialGradient(cx, cy, 0, cx, cy, r * 0.75);
  ca.addColorStop(0, shade(c, 0.78, 0.5 + mood * 0.1)); ca.addColorStop(0.5, shade(c, 0.4, 0.22 + mood * 0.04)); ca.addColorStop(1, shade(c, 0.3, 0));
  g.fillStyle = ca; g.fillRect(x - r, y - r, r * 2, r * 2);
  if (b.crack) {   // 어두운 갈색 금 한 줄 (아래에 깨진 면의 빛)
    const path = (dy) => { g.beginPath(); CRACK.forEach(([px, py], i) => (i ? g.lineTo : g.moveTo).call(g, x + px * r, y + py * r + dy)); g.moveTo(x - 0.22 * r, y + 0.04 * r + dy); g.lineTo(x - 0.1 * r, y + 0.42 * r + dy); };
    path(r * 0.09); g.strokeStyle = 'rgba(255,238,205,.45)'; g.lineWidth = Math.max(0.6, r * 0.07); g.stroke();
    path(0); g.strokeStyle = 'rgba(46,22,10,.94)'; g.lineWidth = Math.max(1, r * 0.13); g.stroke();
  }
  if (b.star) {
    g.save(); g.shadowColor = 'rgba(255,250,222,.95)'; g.shadowBlur = Math.max(2, r * 0.7);
    sparkle(g, x, y, r * 0.66); g.fillStyle = '#fffbea'; g.fill(); g.restore();
  }
  if (r >= 4) {   // 안쪽 아래 테 (굴절 빛)
    g.strokeStyle = shade(c, 0.85, 0.5); g.lineWidth = r * 0.1;
    g.beginPath(); g.arc(x, y, r * 0.84, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
  }
  // 겉면 반짝이: 넓고 흐린 빛 + 작고 또렷한 빛
  const hx = x - r * 0.38, hy = y - r * 0.42, hl = g.createRadialGradient(hx, hy, 0, hx, hy, r * 0.55);
  hl.addColorStop(0, 'rgba(255,255,255,.55)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hl; g.beginPath(); g.ellipse(hx, hy, r * 0.52, r * 0.36, -0.7, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.ellipse(hx + r * 0.02, hy, r * 0.22, r * 0.13, -0.7, 0, TAU); g.fill();
  if (r >= 6) { g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.arc(x + r * 0.5, y + r * 0.46, r * 0.07, 0, TAU); g.fill(); }
  g.restore();
  g.strokeStyle = shade(c, -0.62, 0.75); g.lineWidth = Math.max(0.7, r * 0.07);
  g.beginPath(); g.arc(x, y, r - g.lineWidth / 2, 0, TAU); g.stroke();
}

// 꼰 금실: path() 가 그린 길을 세 번 긋는다 (그림자 · 실 · 꼬임 빛)
function cord(g, path, w) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  path(); g.strokeStyle = 'rgba(30,20,6,.5)'; g.lineWidth = w + 1.4; g.stroke();
  g.strokeStyle = THREAD; g.lineWidth = w; g.stroke();
  g.setLineDash([w * 0.9, w * 1.2]); g.strokeStyle = 'rgba(255,228,164,.6)'; g.lineWidth = w * 0.5; g.stroke();
  g.restore();
}
// 금 구슬 하나 (매듭 가운데·막대 끝)
function goldBall(g, x, y, r) {
  const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r);
  gr.addColorStop(0, GOLD_L); gr.addColorStop(0.45, GOLD); gr.addColorStop(1, GOLD_D);
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}
// 꽃 매듭: 금 고리 넷 + 가운데 금 구슬 (생과 생 사이, 생의 끝)
function flowerKnot(g, x, y, s, ang = 0) {
  g.save(); g.translate(x, y); g.rotate(ang);
  for (const [col, lw] of [['rgba(30,20,6,.55)', s * 0.34], [GOLD, s * 0.2]]) {
    g.strokeStyle = col; g.lineWidth = Math.max(0.8, lw);
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + (i * Math.PI) / 2; g.beginPath(); g.ellipse(Math.cos(a) * s * 0.62, Math.sin(a) * s * 0.62, s * 0.5, s * 0.3, a, 0, TAU); g.stroke(); }
  }
  goldBall(g, 0, 0, s * 0.5);
  g.restore();
}
// 동갑내기가 떠난 자리의 작은 매듭: 매듭 알 + 짧은 두 끝
function tie(g, x, y, s) {
  g.save(); g.lineCap = 'round'; g.strokeStyle = GOLD; g.lineWidth = 1;
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + s * 0.7, y + s * 1.5); g.moveTo(x, y); g.lineTo(x + s * 1.4, y + s * 0.9); g.stroke();
  goldBall(g, x, y, s * 0.75);
  g.restore();
}
function label(g, txt, x, y, size = 9.5, a = 0.72) {
  g.save(); g.font = `600 ${size}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.shadowColor = 'rgba(8,8,26,.85)'; g.shadowBlur = 3; g.fillStyle = `rgba(246,239,226,${a})`;
  g.fillText(txt, x, y); g.restore();
}

// 해가 흐르는 화면 아래: 동갑내기 실 네 가닥 + 구슬 실. 구슬은 오른쪽 끝(최근)에 맞추고, 넘치면 offset 만큼 옆으로 민다
// mem: 모닥불에서 꿴 기억 구슬 [{ age, echo, grow(0~1, 커지는 움직임) }] → 그 나이 구슬을 1.6배로, 이웃 구슬 위에 그린다
export function drawThread(cv, { beads, peers = [], age, fresh = 1, offset = 0, mem = [] }) {
  const { g, w, h } = fit(cv);
  const n = beads.length, pad = 16, now = Number.isFinite(age) ? age : n - 1;
  const r = clamp((w - pad * 2) / (Math.max(n, 12) * GAP), 5, 12), gap = r * GAP;   // 지름 10px 아래로는 줄이지 않는다
  const maxOffset = Math.max(0, Math.ceil((n - 1) * gap + 2 * r - (w - pad * 2)));
  const off = clamp(offset || 0, 0, maxOffset);
  const xOf = (i) => w - pad - r - (n - 1 - i) * gap + off;
  const lab = h >= 96 ? 13 : 0;   // 10년마다 나이 글씨 자리
  const y = Math.round(h - r - 8 - lab);
  // 동갑내기: 나와 같이 자라고, 떠난 나이에서 매듭
  const outP = [];
  peers.forEach((p, i) => {
    const d = p.death || {}, py = Math.round(y - r - 9 - i * 7) + 0.5;
    const gone = !d.present && Number.isFinite(d.age) && d.age < now;
    const end = clamp(Math.min(now, Number.isFinite(d.age) ? d.age : now), 0, Math.max(0, n - 1));
    // 누르기 판정 좌표는 캔버스 안으로 자른다 (밀어서 실 끝이 화면 밖이면 x1 = x2 = 가장자리). 매듭·점은 실제 끝이 보일 때만
    const ex = xOf(end), x1 = clamp(xOf(0), 0, w), x2 = clamp(ex, x1, w);
    if (x2 > x1) { g.strokeStyle = PEER; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x1, py); g.lineTo(x2, py); g.stroke(); }
    if (ex >= -4 && ex <= w + 4) {
      if (gone) tie(g, ex, py, 3.2);
      else { g.fillStyle = 'rgba(240,234,218,.9)'; g.beginPath(); g.arc(ex, py, 1.9, 0, TAU); g.fill(); }
    }
    outP.push({ x1, x2, y: py, i });
  });
  cord(g, () => { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); }, 2.4);
  // 구슬 (마지막 알은 금빛 둘레, fresh<1 이면 오른쪽에서 미끄러져 들어와 꿰어진다). 기억 구슬은 나중에 크게
  const out = [], mm = memMap(mem), late = [];
  for (let i = 0; i < n; i++) {
    let x = xOf(i), rr = r, alpha = 1;
    if (x < -r * 3 || x > w + r * 3) continue;
    if (i === n - 1 && fresh < 1) {
      const e = 1 - Math.pow(1 - clamp(fresh, 0, 1), 3);
      x += (1 - e) * gap * 1.6; rr = r * (0.35 + 0.65 * e); alpha = 0.25 + 0.75 * e;
    }
    const m = mm.get(beads[i].age);
    if (m) {
      const e = 1 - Math.pow(1 - m.grow, 3);
      rr *= 1 + (MEM_SCALE - 1) * e;
      late.push({ i, x, rr, alpha, echo: m.echo });
    } else {
      g.save(); g.globalAlpha = alpha;
      bead(g, x, y, rr, beads[i], i === n - 1 ? 0.9 : 0);
      g.restore();
    }
    if (lab && beads[i].age > 0 && beads[i].age % 10 === 0) label(g, String(beads[i].age), x, y + Math.max(r + 9, rr + 7));
    out.push({ x, y, r: rr, age: beads[i].age, mem: !!m });
  }
  for (const L of late) { g.save(); g.globalAlpha = L.alpha; memBead(g, L.x, y, L.rr, beads[L.i], L.echo); g.restore(); }
  return { beads: out, peers: outP, maxOffset };
}

// 매듭 화면: 호로 놓인 이 생의 구슬과 끝 매듭 (open 이면 매듭 없이 열린 끝이 빛난다). 구슬은 매듭 쪽으로 모인다
export function drawKnot(cv, beads, { open = false } = {}) {
  const { g, w, h } = fit(cv);
  // 비스듬히 내려다본 목걸이: 타원 호. 뒤(위)에서 시작해 왼쪽·앞(아래)을 돌아 오른쪽 매듭에서 끝난다. 뒤는 작게, 앞은 크게
  const ox = w * 0.46, oy = h * 0.5, rx = w * 0.42, ry = h * 0.35, A0 = -Math.PI * 0.58, A1 = -Math.PI * 1.97;
  const sc = (a) => 0.7 + 0.42 * (1 + Math.sin(a)) / 2;
  const N = 200, pts = [], scs = [], len = [0];   // 길이 표: 원근을 푼 길이(u)로 구슬을 고르게 놓는다
  for (let i = 0; i <= N; i++) {
    const a = A0 + ((A1 - A0) * i) / N;
    pts.push([ox + Math.cos(a) * rx, oy + Math.sin(a) * ry]); scs.push(sc(a));
    if (i) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) / ((scs[i] + scs[i - 1]) / 2));
  }
  const U = len[N];
  const at = (u) => {
    u = clamp(u, 0, U); let i = 1;
    while (i < N && len[i] < u) i++;
    const f = (u - len[i - 1]) / (len[i] - len[i - 1] || 1), m = (k) => pts[i - 1][k] + (pts[i][k] - pts[i - 1][k]) * f;
    return [m(0), m(1), scs[i - 1] + (scs[i] - scs[i - 1]) * f];
  };
  const ks = clamp(Math.min(w, h) * 0.045, 6, 13);
  cord(g, () => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); }, clamp(h * 0.009, 2, 3.2));
  const n = Math.max(1, beads.length), endPad = (open ? ks * 1.2 : ks * 1.6) / scs[N];
  const r = clamp((U * 0.95 - endPad) / (n * GAP), 2.5, 13), gap = Math.min(r * GAP, (U - endPad - 2 * r) / Math.max(1, n - 1));
  beads.forEach((b, i) => { const [x, y, s] = at(U - endPad - r - (beads.length - 1 - i) * gap); bead(g, x, y, r * s, b); });
  const [ex, ey] = pts[N], [tx, ty] = pts[N - 3], ang = Math.atan2(ey - ty, ex - tx);
  if (open) {   // 열린 끝: 빛 한 점
    g.save();
    const halo = g.createRadialGradient(ex, ey, 0, ex, ey, ks * 2.4);
    halo.addColorStop(0, 'rgba(255,243,200,.85)'); halo.addColorStop(0.35, 'rgba(255,220,140,.35)'); halo.addColorStop(1, 'rgba(255,220,140,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(ex, ey, ks * 2.4, 0, TAU); g.fill();
    g.shadowColor = GOLD; g.shadowBlur = 14; g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(ex, ey, 3.2, 0, TAU); g.fill();
    g.restore();
    return;
  }
  // 닫힌 끝: 늘어진 술 두 가닥 + 꽃 매듭
  for (const d of [-1, 1]) {
    const fx = ex + d * ks * 0.75, fy = ey + ks * 2.6;
    cord(g, () => { g.beginPath(); g.moveTo(ex, ey); g.quadraticCurveTo(ex + d * ks * 0.15, ey + ks * 1.4, fx, fy); }, clamp(ks * 0.2, 1.4, 2.6));
    g.save(); g.strokeStyle = 'rgba(226,182,94,.85)'; g.lineWidth = 0.8;
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx + k * ks * 0.11, fy + ks * 1.05); g.stroke(); }
    g.restore();
    goldBall(g, fx, fy, ks * 0.24);
  }
  flowerKnot(g, ex, ey, ks, ang);
}

// 백 가닥: 위 막대에 매단 실 백 개, 길이 = 산 햇수 (가장 긴 실에 맞춰 줄인다), 내 실은 금색
export function drawHundred(cv, { lengths, mine }) {
  const { g, w, h } = fit(cv);
  const max = Math.max(100, ...lengths), top = 16, x0 = 14, x1 = w - 28;
  const step = (x1 - x0) / Math.max(1, lengths.length - 1), k = (h - top - 14) / max;
  g.save();   // 20년마다 희미한 눈금
  g.setLineDash([2, 4]); g.strokeStyle = 'rgba(225,222,240,.12)'; g.lineWidth = 1;
  for (let a = 20; a <= max; a += 20) { const y = Math.round(top + a * k) + 0.5; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y); g.stroke(); }
  g.restore();
  for (let a = 20; a <= max; a += 20) label(g, String(a), x1 + 15, top + a * k, 8.5, 0.4);
  const thread = (i, me) => {
    const x = x0 + i * step, y = top + 3 + Math.max(2, lengths[i] * k);
    g.save();
    if (me) { g.shadowColor = 'rgba(255,206,112,.8)'; g.shadowBlur = 8; }
    g.strokeStyle = me ? GOLD : 'rgba(225,222,240,.42)'; g.lineWidth = me ? 2.2 : 1;
    g.beginPath(); g.moveTo(x, top); g.lineTo(x, y); g.stroke();
    g.restore();
    if (me) bead(g, x, y + 3, 4.4, { mood: 4, star: false, crack: false }, 0.8);
    else { g.fillStyle = 'rgba(232,234,252,.78)'; g.beginPath(); g.arc(x, y + 1.2, 1.7, 0, TAU); g.fill(); }
  };
  lengths.forEach((_, i) => { if (i !== mine) thread(i, false); });
  // 막대 (금 막대 + 양 끝 금 구슬)
  const rod = g.createLinearGradient(0, top - 2.5, 0, top + 2.5);
  rod.addColorStop(0, GOLD_L); rod.addColorStop(0.5, GOLD); rod.addColorStop(1, GOLD_D);
  g.fillStyle = rod; g.fillRect(x0 - 8, top - 2, x1 - x0 + 16, 4);
  goldBall(g, x0 - 9, top, 3.6); goldBall(g, x1 + 9, top, 3.6);
  if (mine >= 0 && mine < lengths.length) thread(mine, true);
}


// 영혼의 염주(고리)와 탄생 하늘은 옛 지도책 세계지도(worldmap.js: rosary · birth)로 바꿨다 (클라우드 2026-10-21)
