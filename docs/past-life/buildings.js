// 마을 모양 10개와 코드로 만든 낮은 다각형 건물 (설계 8장). 'kk:' 이름은 KayKit 에서 꺼낸다
import * as THREE from 'three';

const MATS = new Map();
export function mat(color, emissive = 0) {
  const k = color + ':' + emissive;
  if (!MATS.has(k)) MATS.set(k, new THREE.MeshStandardMaterial({ color, emissive, flatShading: true, roughness: 0.92, metalness: 0 }));
  return MATS.get(k);
}
function part(geo, color, x = 0, y = 0, z = 0, emissive = 0) {
  const m = new THREE.Mesh(geo, mat(color, emissive));
  m.position.set(x, y, z);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}
// 아랫면이 y 에 닿는 기본 도형
const box = (w, h, d, c, x = 0, y = 0, z = 0) => part(new THREE.BoxGeometry(w, h, d), c, x, y + h / 2, z);
const cyl = (rt, rb, h, seg, c, x = 0, y = 0, z = 0) => part(new THREE.CylinderGeometry(rt, rb, h, seg), c, x, y + h / 2, z);
const cone = (r, h, seg, c, x = 0, y = 0, z = 0) => part(new THREE.ConeGeometry(r, h, seg), c, x, y + h / 2, z);
function ball(r, c, x = 0, y = 0, z = 0, sy = 1) { const m = part(new THREE.SphereGeometry(r, 8, 6), c, x, y + r * sy, z); m.scale.y = sy; return m; }
// 박공지붕 (삼각기둥, 용마루가 z 방향)
function prism(w, h, d, c, x = 0, y = 0, z = 0) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(0, h); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }); g.translate(0, 0, -d / 2);
  return part(g, c, x, y, z);
}
// 반원 지붕 (x 방향 길이 len)
function arch(r, len, c, x = 0, y = 0, z = 0) {
  const g = new THREE.CylinderGeometry(r, r, len, 10, 1, false, 0, Math.PI); g.rotateZ(Math.PI / 2);
  return part(g, c, x, y, z);
}
// 네모뿔 지붕
function hip(w, h, d, c, x = 0, y = 0, z = 0) {
  const g = new THREE.ConeGeometry(0.7071, h, 4); g.rotateY(Math.PI / 4); g.scale(w, 1, d); g.translate(0, h / 2, 0);
  return part(g, c, x, y, z);
}
// 창문 무늬 상자 (아파트)
const WIN = new Map();
function winBox(w, h, d, c) {
  if (!WIN.has(c)) {
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128;
    const g = cv.getContext('2d');
    g.fillStyle = '#' + c.toString(16).padStart(6, '0'); g.fillRect(0, 0, 64, 128);
    for (let y = 8; y < 120; y += 16) for (let x = 6; x < 60; x += 14) { g.fillStyle = (x * 7 + y * 3) % 5 === 0 ? '#ffd98a' : '#5b6b80'; g.fillRect(x, y, 8, 9); }
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
    WIN.set(c, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 }));
  }
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), WIN.get(c));
  m.position.y = h / 2; m.castShadow = true; m.receiveShadow = true;
  return m;
}
function rows(color, soil, h) {
  const g = new THREE.Group();
  if (soil != null) g.add(box(1.4, 0.03, 1.2, soil));
  const im = new THREE.InstancedMesh(new THREE.BoxGeometry(0.08, h, 0.08), mat(color), 60);
  const m4 = new THREE.Matrix4();
  let i = 0;
  for (let r = 0; r < 6; r++) for (let k = 0; k < 10; k++) { m4.makeTranslation(-0.6 + k * 0.133, 0.03 + h / 2, -0.5 + r * 0.2); im.setMatrixAt(i++, m4); }
  im.castShadow = true; g.add(im);
  return g;
}
// 색을 f 배 밝게/어둡게 (0xRRGGBB)
const shade = (c, f) => new THREE.Color(c).multiplyScalar(f).getHex();
const grp = (...ps) => { const g = new THREE.Group(); for (const p of ps) g.add(p); return g; };
const DARK = 0x2b2118, WOOD = 0x6b4a2f;

const BUILD = {
  hutCone: (p) => grp(cyl(0.5, 0.55, 0.3, 8, p.wall), cone(0.78, 0.85, 8, p.roof, 0, 0.26), box(0.2, 0.26, 0.04, DARK, 0, 0, 0.53)),
  roundHut: (p) => grp(cyl(0.5, 0.52, 0.48, 12, p.wall), cone(0.72, 0.62, 12, p.roof, 0, 0.44), box(0.22, 0.32, 0.04, DARK, 0, 0, 0.51)),
  granary: (p) => grp(cyl(0.05, 0.05, 0.2, 5, DARK, -0.12, 0, -0.12), cyl(0.05, 0.05, 0.2, 5, DARK, 0.12, 0, 0.12), cyl(0.28, 0.26, 0.38, 10, p.wall, 0, 0.2), cone(0.4, 0.38, 10, p.roof, 0, 0.56)),
  reedArch: (p) => grp(arch(0.48, 1.25, p.roof), box(0.04, 0.32, 0.24, DARK, 0.63)),
  mudBox: (p) => grp(box(1.0, 0.62, 0.86, p.wall), box(1.06, 0.08, 0.92, p.trim, 0, 0.62), box(0.22, 0.34, 0.04, DARK, -0.2, 0, 0.44), box(0.14, 0.12, 0.04, DARK, 0.25, 0.36, 0.44)),
  // 초가: 벽 위에 처마가 넉넉히 나온 두 겹 8각 지붕 (밑 겹은 납작하게 눌러 처마, 윗 겹은 한 톤 밝게)
  thatchHouse: (p) => {
    const c = p.thatch || p.roof, eave = cone(0.7, 0.34, 8, c, 0, 0.4), top = cone(0.44, 0.4, 8, shade(c, 1.12), 0, 0.6);
    eave.scale.z = 0.88; top.scale.z = 0.9;
    return grp(box(0.92, 0.42, 0.78, p.wall), eave, top, box(0.2, 0.3, 0.04, DARK, 0, 0, 0.4));
  },
  tileRoof: (p) => grp(box(1.05, 0.5, 0.78, p.wall), box(0.12, 0.5, 0.82, p.trim, -0.46), box(0.12, 0.5, 0.82, p.trim, 0.46), box(1.4, 0.05, 1.08, p.roof, 0, 0.5), hip(1.25, 0.42, 0.92, p.roof, 0, 0.55), box(1.0, 0.06, 0.08, p.trim, 0, 0.95), box(0.22, 0.32, 0.04, DARK, 0, 0, 0.4)),
  stiltHouse: (p) => grp(...[[-0.38, -0.32], [0.38, -0.32], [-0.38, 0.32], [0.38, 0.32]].map(([x, z]) => cyl(0.04, 0.04, 0.42, 5, DARK, x, 0, z)), box(0.92, 0.06, 0.8, p.trim, 0, 0.42), box(0.8, 0.42, 0.68, p.wall, 0, 0.48), prism(1.12, 0.6, 0.92, p.roof, 0, 0.9)),
  longhouse: (p) => grp(box(1.5, 0.32, 0.7, p.wall), arch(0.42, 1.6, p.roof, 0, 0.3), box(0.04, 0.26, 0.2, DARK, 0.76)),
  rowHouse: (p) => grp(box(0.62, 0.85, 0.72, p.wall, -0.33), box(0.62, 0.78, 0.72, p.trim, 0.33), prism(0.66, 0.34, 0.76, p.roof, -0.33, 0.85), prism(0.66, 0.32, 0.76, p.roof, 0.33, 0.78), box(0.12, 0.3, 0.12, p.wall, -0.15, 1.0, -0.1), box(0.18, 0.32, 0.04, DARK, -0.33, 0, 0.37), box(0.18, 0.32, 0.04, DARK, 0.33, 0, 0.37)),
  factory: (p) => { const g = grp(box(1.5, 0.72, 1.0, p.wall), ...[-0.5, 0, 0.5].map((x) => prism(0.5, 0.3, 1.0, p.roof, x, 0.72)), cyl(0.09, 0.12, 1.7, 8, p.wall, 0.45, 0, -0.3), cyl(0.09, 0.12, 1.4, 8, p.wall, 0.15, 0, -0.32)); g.userData.smoke = [new THREE.Vector3(0.45, 1.75, -0.3), new THREE.Vector3(0.15, 1.45, -0.32)]; return g; },
  apartment: (p) => grp(winBox(0.95, 2.1, 0.8, p.wall), box(1.0, 0.08, 0.85, p.roof, 0, 2.1)),
  campfire: () => grp(box(0.4, 0.06, 0.08, WOOD), box(0.08, 0.06, 0.4, WOOD), part(new THREE.ConeGeometry(0.13, 0.26, 6), 0xffa040, 0, 0.18, 0, 0xff6a00)),
  pine: () => grp(cyl(0.05, 0.06, 0.25, 5, WOOD), cone(0.32, 0.5, 7, 0x3f7a4a, 0, 0.2), cone(0.24, 0.42, 7, 0x4a8a55, 0, 0.5)),
  roundTree: () => grp(cyl(0.05, 0.06, 0.35, 5, WOOD), ball(0.32, 0x5c9a4f, 0, 0.28)),
  acacia: () => grp(cyl(0.04, 0.06, 0.6, 5, WOOD), ball(0.45, 0x7a9a45, 0, 0.55, 0, 0.32)),
  palm: () => {
    const g = grp();
    for (let i = 0; i < 4; i++) g.add(cyl(0.045, 0.05, 0.22, 5, 0x8a6a45, i * 0.03, i * 0.21, 0));
    for (let k = 0; k < 6; k++) {
      const arm = new THREE.Group(), leaf = part(new THREE.ConeGeometry(0.08, 0.55, 4), 0x5a9a48, 0.25, 0, 0);
      leaf.rotation.z = Math.PI / 2.4; arm.add(leaf); arm.rotation.y = (k / 6) * Math.PI * 2; arm.position.set(0.12, 0.88, 0); g.add(arm);
    }
    return g;
  },
  rock: () => grp(part(new THREE.DodecahedronGeometry(0.2), 0x9a9488, 0, 0.12, 0)),
  field: () => rows(0x9bbf5a, 0x7a5a3a, 0.06),
  maize: () => rows(0xc9c25a, 0x7a5a3a, 0.22),
  paddy: () => grp(box(1.5, 0.03, 1.3, 0x7fb8b0), rows(0x7cc25a, null, 0.08)),
  fence: () => grp(...[-0.6, -0.2, 0.2, 0.6].map((x) => box(0.05, 0.3, 0.05, WOOD, x)), box(1.3, 0.04, 0.03, WOOD, 0, 0.18), box(1.3, 0.04, 0.03, WOOD, 0, 0.08)),
  wall: () => grp(box(1.4, 0.3, 0.16, 0xb8b0a0), box(1.5, 0.06, 0.22, 0x5a6270, 0, 0.3)),
  rail: () => grp(...[-0.6, -0.3, 0, 0.3, 0.6].map((x) => box(0.08, 0.03, 0.5, 0x5a4a3a, x)), box(1.5, 0.04, 0.04, 0x8a8f99, 0, 0.03, -0.15), box(1.5, 0.04, 0.04, 0x8a8f99, 0, 0.03, 0.15)),
  lamp: () => grp(cyl(0.025, 0.03, 0.9, 6, 0x2f3238), part(new THREE.SphereGeometry(0.07, 8, 6), 0xffe0a0, 0, 0.95, 0, 0xffc060)),
  car: () => grp(box(0.6, 0.16, 0.3, 0xb84a3a, 0, 0.06), box(0.34, 0.14, 0.28, 0xd8dde3, -0.04, 0.22), ...[[-0.2, -0.15], [0.2, -0.15], [-0.2, 0.15], [0.2, 0.15]].map(([x, z]) => { const w = part(new THREE.CylinderGeometry(0.07, 0.07, 0.05, 10), 0x22252a, x, 0.07, z); w.rotation.x = Math.PI / 2; return w; })),
};

const PAL = {
  forager: { wall: 0x8a6a48, roof: 0xb48c5c, trim: WOOD, cloth: [0x8a6a48, 0x9b7b56, 0x6f5640], hat: null },
  neolithic: { wall: 0xa98b63, roof: 0xcfae72, trim: 0x7a5a3a, cloth: [0xb59a70, 0x8f7350, 0xc9b088], hat: null },
  mudbrick: { wall: 0xdcbc8c, roof: 0xc4a066, trim: 0xc29e70, cloth: [0xe8dcc0, 0x3f6a8a, 0xb4533a], hat: 'cap', hatColor: 0xf0ebe0 },
  eastwood: { wall: 0xefe6d4, roof: 0x4b5563, trim: 0x7a5a3a, thatch: 0xcfa44e, cloth: [0xf0ebe0, 0xd8d2c4, 0x5a6a8a], hat: 'cone', hatColor: 0xd8c08a },
  europe_med: { wall: 0xe8dcc4, roof: 0x9a4a3a, trim: WOOD, cloth: [0x6a7f4a, 0x8a4a3a, 0x4a5f7f, 0xc9b088], hat: 'cap', hatColor: WOOD },
  tropical: { wall: 0xb8935e, roof: 0x9a8448, thatch: 0xb89a48, trim: WOOD, cloth: [0xc94a4a, 0x3f8a7a, 0xe8c25a], hat: 'cone', hatColor: 0xd8c08a },
  african: { wall: 0xb5724a, roof: 0xcaa66b, trim: 0x8a5a3a, cloth: [0xe8a03a, 0x3f6aa8, 0xc94a4a, 0x4a8a5a], hat: null },
  american: { wall: 0xc98f62, roof: 0xb59a5e, trim: 0x8a5a3a, cloth: [0xe8dcc0, 0xc94a4a, 0x3f8a7a], hat: null },
  industrial: { wall: 0xa4553d, roof: 0x3f4048, trim: 0xb86a4a, cloth: [0x3f4a5a, 0x5a4a3f, 0x7a7f88], hat: 'cap', hatColor: 0x2f3238 },
  modern: { wall: 0xdad8d0, roof: 0x7a8088, trim: 0xc8c4bc, cloth: [0x3f6aa8, 0xd84a4a, 0x2f3238, 0xe8e2d6, 0x5aa86a], hat: null },
};
// homes[0] = 「당신」의 집, 나머지는 이웃. decor 는 가장자리 5칸
export const STYLES = {
  forager: { pal: PAL.forager, homes: ['hutCone', 'hutCone', 'hutCone', 'hutCone'], decor: ['campfire', 'pine', 'pine', 'rock', 'pine'] },
  neolithic: { pal: PAL.neolithic, homes: ['longhouse', 'hutCone', 'hutCone', 'hutCone'], decor: ['field', 'fence', 'pine', 'rock', 'roundTree'] },
  mudbrick: { pal: PAL.mudbrick, homes: ['mudBox', 'reedArch', 'mudBox', 'mudBox'], decor: ['field', 'palm', 'palm', 'kk:barrel', 'palm'] },
  eastwood: { pal: PAL.eastwood, homes: ['tileRoof', 'thatchHouse', 'thatchHouse', 'thatchHouse'], decor: ['paddy', 'roundTree', 'wall', 'kk:sack', 'roundTree'] },
  europe_med: { pal: PAL.europe_med, homes: ['kk:building_home_A_yellow', 'kk:building_home_B_yellow', 'kk:building_church_yellow', 'kk:building_market_yellow'], decor: ['field', 'kk:building_well_yellow', 'kk:tree_single_A', 'kk:building_windmill_yellow', 'kk:tree_single_B'] },
  tropical: { pal: PAL.tropical, homes: ['stiltHouse', 'stiltHouse', 'thatchHouse', 'stiltHouse'], decor: ['paddy', 'palm', 'palm', 'palm', 'roundTree'] },
  african: { pal: PAL.african, homes: ['roundHut', 'roundHut', 'granary', 'roundHut'], decor: ['field', 'acacia', 'fence', 'acacia', 'rock'] },
  american: { pal: PAL.american, homes: ['mudBox', 'longhouse', 'thatchHouse', 'mudBox'], decor: ['maize', 'roundTree', 'roundTree', 'rock', 'maize'] },
  industrial: { pal: PAL.industrial, homes: ['rowHouse', 'rowHouse', 'factory', 'rowHouse'], decor: ['rail', 'lamp', 'roundTree', 'kk:crate_A_big', 'lamp'] },
  modern: { pal: PAL.modern, homes: ['apartment', 'rowHouse', 'apartment', 'apartment'], decor: ['car', 'lamp', 'roundTree', 'roundTree', 'car'], road: true },
};

// 그해·그 지역 마을 모양 (설계 8장)
export function styleFor(year, region) {
  if (year < -8000) return 'forager';
  if (year < -3000) return 'neolithic';
  if (year >= 1950) return 'modern';
  if (year >= 1850 && ['europe', 'americas', 'east'].includes(region)) return 'industrial';
  if (year >= 1750 && region === 'europe') return 'industrial';
  if (region === 'europe') return year < -1000 ? 'neolithic' : 'europe_med';
  return { west: 'mudbrick', south: 'mudbrick', east: 'eastwood', seaoc: 'tropical', africa: 'african', americas: 'american' }[region];
}

const KK_FALLBACK = { building_home_A_yellow: 'rowHouse', building_home_B_yellow: 'thatchHouse', building_church_yellow: 'tileRoof', building_market_yellow: 'mudBox', building_well_yellow: 'rock', building_windmill_yellow: 'roundTree', tree_single_A: 'roundTree', tree_single_B: 'roundTree', barrel: 'rock', sack: 'rock', crate_A_big: 'rock' };
// KayKit 소품은 육각 한 칸에 비해 너무 작아 점처럼 보인다 → 키운다
const KK_SCALE = { barrel: 2.2, sack: 2.2, crate_A_big: 1.5 };
// 이름 하나 → 3D 조각. kit 이 없으면 비슷한 코드 도형
export function buildPiece(name, pal, kit) {
  if (name.startsWith('kk:')) {
    const k = name.slice(3);
    if (kit && kit[k]) {
      const o = kit[k].clone(true);
      o.userData.kit = true;   // geometry 를 원본과 나눠 쓴다 → 버릴 때 dispose 하지 않는다
      o.scale.multiplyScalar(KK_SCALE[k] || 1);
      o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
      return o;
    }
    return BUILD[KK_FALLBACK[k] || 'rock'](pal);
  }
  return BUILD[name](pal);
}
