// 실사풍 삶 무대 (look prototype) — 1329년 잉글랜드 마을 한 장면.
// createRealScene(canvas, { era, region, timeOfDay, view, post, ao, bloom, seed, kit, kitUrl, propsUrl, peopleUrl, people, treeNear })
//   kit: 'england'(기본) · 'southasia' — 세트 묶음(kitdata.js KIT_SETS)과 마을 요리법(villageplan.js RECIPES)을 함께 고른다 (건물·소품·나무·사람 glb, 크기 표, 정한 자리)
//   → { ready, setTime(h), setView(name), spawnPeople(rng, count), setPost(on, {ao, bloom}), setOrbit(on), setEnv(i), setKitAO({direct, map}),
//       snapshot(), bench(n), rafStats(), info(), dispose() }
//   사람: spawnPeople(rng, count) 이 시드 난수로 변형·동작·자리·경로를 골라 세운다 (peopleplan.js 규칙, realpeople.js 그리기). 처음엔 출생 시드로 한 번 부른다.
//   시점: overview(목표 그림 구도) · street · forge(=dusk) · high · church · market · pasture
// loadKit(url) → Promise<{ pieces: Map(이름 → Object3D), scene }> : 세트 glb (같은 주소는 캐시, 원본은 읽기 전용)
// planVillage(seed, env) → 집 자리(길 따라 늘어선 집 + 뒤뜰), dressVillage(rng, kit, props, layout) → 소품·가축·나무 자리 (둘 다 시드로 정해진다).
//   규칙 몸체와 마을 배치 상수는 three 없는 villageplan.js 에 있다 (Node 시험 test/villageplan.test.mjs).
// 땅 모습: opts.land (lands.js LAND_LOOK: temperate·dry·monsoon·steppe·cold·tropical) 이 잉글랜드 바탕 위에 풀·흙·밭(논)·나무·하늘 습도를 덮는다.
// 화질: opts.quality 'high'(기본) | 'normal' (AO 끔, 그림자 해상도 반, 먼 나무 덜·빌보드 더). opts.renderer 를 주면 그 그리개를 함께 쓴다 (dispose 가 지우지 않는다).
//
// 게임 무대: createStage(canvas) → village.js 와 같은 API { fast, setKit, setLife(birth), setAge(age, year), setPhase(name), tick(), snapshot(),
//   setCampfire(on, ghost), flameRise(), setView({lift}), setQuality(q), info() }. 생마다 출생 시드로 장면을 새로 짓고(앞 장면은 풀어 준다),
//   그리개·세트 glb·사람 glb·텍스처는 생 사이에 함께 쓴다. phaseOf(age) 도 여기서 낸다 (나이 → 하루의 때).
//
// 구성: PRESETS(시대×지역별 하늘·안개·색·나무 종) + 마을 배치(villageplan.js) + 세트 둘.
//   건물(집·교회·대장간·물레방앗간·우물·좌판)은 Blender 세트 kits/england.glb (tools/blender/kit_england.py),
//   소품·가축(수레·통·장작·울타리·돌담·천막·텃밭·양·소·말·닭·오리 …)은 kits/props_england.glb (tools/blender/kit_props.py).
//   크기 표는 kitdata.js. 다리·비석은 코드 도형이다. 지금은 'england-1329' 하나만 채워져 있다.
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { Water } from 'three/addons/objects/Water.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { Pass } from 'three/addons/postprocessing/Pass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { KIT_DIMS, PROP_DIMS, KIT_SETS, TREES_SA, BUSHES_SA, TREE_GLB_SA, TREES_EA, BUSHES_EA, TREE_GLB_EA } from './kitdata.js';
import { lerp, smooth, rng, hash2, fbm, obb, obbLocal, obbHas, VC, WATER_Y, RIVER_HW, RIVER, BRIDGE, CHURCH, CHURCHYARD, SMITHY, MILL, WELL, GREEN, LANES, VIEW_CLEAR, inRect, smoothLine, polyCum, polyAt, makeEnv, planVillage, planDressing, recipeFor, flavorOf, dressSeed } from './villageplan.js';
import { planPeople, peopleSeed, PEOPLE_DEFAULT, paletteOf, dressVariant } from './peopleplan.js';
import { createPeople, touchPeople, sweepPeople, peopleCacheSize, preloadPeople } from './realpeople.js';
import { stageOf, stageSeed, builtKit, sceneKitOf, LAND_LOOK, morphologyOf } from './lands.js';
import { t as tr } from './i18n.js';

const EZTREE = '@dgreenheck/ez-tree';   // importmap 이름 (look-real.html·index.html: ez-tree 1.1.0 build/ez-tree.es.js)
const ASSET = new URL('./assets/real/', import.meta.url).href;

// 생의 시간 = 하루의 시간 (설계 3.1): 새벽(0~12) → 아침(13~29) → 한낮(30~49) → 오후(50~64) → 해질녘(65~)
// 나이 → 하루의 때 · 하루의 때 → 시각은 phase.js (three 없이 main.js 가 먼저 쓴다)
import { phaseOf as phaseOfAge, PHASE_TIME as PHASE_HOURS } from './phase.js';
export const phaseOf = phaseOfAge, PHASE_TIME = PHASE_HOURS;

// ───────────────────────── 시대×지역 프리셋 ─────────────────────────
export const PRESETS = {
  'england-1329': {
    sunrise: 4.5, sunset: 19.5, maxElev: 58, azRise: 50, azSet: 310,   // 한여름 남잉글랜드 (태양시)
    sky: { turbidity: 2.6, rayleigh: 1.9, mie: 0.0032, mieG: 0.82 },
    fog: { density: 0.00027, heightFalloff: 1 / 600 },
    clouds: { cover: 0.54, scale: 1 / 2600 },
    grass: [0.72, 0.92, 0.5], wheat: [1.3, 1.06, 0.55],
    leafTint: 0x9fb06a, hedgeColor: [0.11, 0.16, 0.055],
    // 나무 종: ez-tree 프리셋 + 고친 값(opt). sp = 마을 꾸미기 규칙의 종 이름, droop = 가지 끝 늘어뜨림(버드나무), h = 키(m)
    trees: [
      { sp: 'oak', preset: 'Oak Medium', seed: 11, h: 13, opt: { leaves: { count: 18, size: 3.3 } } },
      { sp: 'oak', preset: 'Oak Large', seed: 23, h: 17, opt: { leaves: { count: 16, size: 3.4 } } },
      { sp: 'ash', preset: 'Ash Medium', seed: 37, h: 15, opt: { leaves: { count: 18, size: 3.7 } }, tint: 0x98ad66 },
      { sp: 'willow', preset: 'Ash Medium', seed: 53, h: 10, droop: 2.2, tint: 0xb2c488, barkTint: [0.7, 0.68, 0.62],
        opt: { bark: { type: 'willow' }, branch: { angle: { 1: 30, 2: 40, 3: 40 }, children: { 0: 9, 1: 4, 2: 3 }, length: { 0: 30, 1: 24, 2: 10, 3: 5 } }, leaves: { type: 'ash', count: 22, size: 2.4, angle: 25 } } },
      { sp: 'birch', preset: 'Aspen Medium', seed: 41, h: 14, tint: 0x78a062, barkTint: [0.9, 0.88, 0.84], opt: { branch: { children: { 0: 14, 1: 4 } }, leaves: { count: 22, size: 2.8 } } },
      { sp: 'hawthorn', preset: 'Oak Small', seed: 63, h: 6, tint: 0x7f9852, opt: { branch: { gnarliness: { 0: 0.2, 1: 0.2, 2: 0.25 }, children: { 0: 7, 1: 3, 2: 3 } }, leaves: { count: 20, size: 2.0 } } },
      { sp: 'apple', preset: 'Oak Small', seed: 77, h: 5.2, tint: 0xb4cc7a,
        opt: { branch: { angle: { 1: 62, 2: 50 }, length: { 0: 18, 1: 10, 2: 9, 3: 6 }, children: { 0: 7, 1: 3, 2: 3 }, gnarliness: { 1: 0.15, 2: 0.2 } }, leaves: { count: 18, size: 2.4 } } },
    ],
    bushes: [
      { preset: 'Bush 1', seed: 5, h: 2.4, bush: true, tint: 0x86985a }, { preset: 'Bush 2', seed: 9, h: 3.2, bush: true, tint: 0x7a8f50 }, { preset: 'Bush 3', seed: 13, h: 1.7, bush: true, tint: 0x91a060 },
    ],
  },
};
// 남아시아 세트: 하늘·빛은 잉글랜드 바탕(땅 모습이 덮는다), 나무는 반얀·보리수·망고·님·바불(ez-tree) + 야자·대나무·바나나(trees_southasia.glb)
//   glb 나무: { glb: 조각 이름 } — 줄기(palm_bark·bark·bamboo) = 가지, frond = 잎으로 받아 ez-tree 나무와 같은 틀(가까이 InstancedMesh, 멀리 빌보드)로 그린다.
//   banyan 은 ez-tree 몸 + trees_southasia.glb 의 banyan_roots(공기뿌리)를 가지 지오메트리에 합친다.
const SA_GLB = ASSET + 'kits/trees_southasia.glb';
PRESETS.southasia = {
  ...PRESETS['england-1329'], leafTint: 0x7f9d55,
  trees: [
    ...TREES_SA.map((d) => ({ ...d, ...(d.roots ? { rootsUrl: SA_GLB } : {}) })),
    ...TREE_GLB_SA.map((d, k) => ({ ...d, url: SA_GLB, seed: k + 1 })),
  ],
  bushes: [...BUSHES_SA, { glb: 'grass_tall', url: SA_GLB, bush: true, seed: 6 }, { glb: 'banana', url: SA_GLB, bush: true, seed: 7, s: 0.7 }],
};
// 동아시아 세트 (작업 2-2): 나무는 소나무·느티·버들·감나무(잎 그림에 감)·단풍(ez-tree) + 대숲·작은 대 포기(trees_eastasia.glb), 덤불 + 억새·갈대
const EA_GLB = ASSET + 'kits/trees_eastasia.glb';
PRESETS.eastasia = {
  ...PRESETS['england-1329'], leafTint: 0x7c9a52,
  trees: [...TREES_EA, ...TREE_GLB_EA.map((d, k) => ({ ...d, url: EA_GLB, seed: k + 1 }))],
  bushes: [...BUSHES_EA, { glb: 'grass_silver', url: EA_GLB, bush: true, seed: 6 }, { glb: 'reed_ea', url: EA_GLB, bush: true, seed: 7 }],
};
// 서아시아·흙벽돌 세트: 대추야자·올리브(trees_mudbrick.glb), 사막 덤불·오아시스 갈대
const MB_GLB = ASSET + 'kits/trees_mudbrick.glb';
PRESETS.mudbrick = {
  ...PRESETS['england-1329'], leafTint: 0x8a9955,
  trees: [
    { sp: 'palm_date_tall', glb: 'palm_date_tall', url: MB_GLB, seed: 1 },
    { sp: 'palm_date_medium', glb: 'palm_date_medium', url: MB_GLB, seed: 2 },
    { sp: 'olive_tree_mb', glb: 'olive_tree_mb', url: MB_GLB, seed: 3 },
  ],
  bushes: [
    { sp: 'bush_desert_mb', glb: 'bush_desert_mb', url: MB_GLB, bush: true, seed: 4 },
    { sp: 'reed_oasis', glb: 'reed_oasis', url: MB_GLB, bush: true, seed: 5 },
  ],
};
function presetKey(era, region, kit) { return PRESETS[kit] ? kit : 'england-1329'; }   // 다른 시대·지역은 아직 없음 → 세트마다 하나 (세트 이름의 프리셋, 없으면 잉글랜드)

// 땅 모습 (lands.js LAND_LOOK) 을 잉글랜드 바탕 위에 덮는다. 빠진 값은 바탕 그대로 (temperate = 바탕)
const LAND_BASE = { soil: [1, 1, 1], dry: 0, bare: 0, paddy: 0, trees: 1, mix: null, leaf: [1, 1, 1], hedges: 1, tufts: 1, flowers: 1, tuft: [1, 1, 1] };
function landPreset(base, land) {
  const L = { ...LAND_BASE, ...(LAND_LOOK[land] || {}) };
  const mul = (a, b) => a.map((v, i) => v * b[i]);
  const P = { ...base, sky: { ...base.sky, ...(L.sky || {}) }, fog: { ...base.fog }, clouds: { ...base.clouds } };
  if (L.grass) P.grass = L.grass;
  if (L.wheat) P.wheat = L.wheat;
  if (L.hedge) P.hedgeColor = L.hedge;
  if (L.fog) P.fog.density = L.fog;
  if (L.clouds) P.clouds.cover = L.clouds;
  if (L.maxElev) P.maxElev = L.maxElev;
  const tint = (hex) => { const c = new THREE.Color(hex); return c.setRGB(...mul([c.r, c.g, c.b], L.leaf)).getHex(); };
  P.leafTint = tint(base.leafTint);
  P.trees = base.trees.map((d) => (d.tint != null ? { ...d, tint: tint(d.tint) } : d));
  P.bushes = (base.bushes || []).map((d) => (d.tint != null ? { ...d, tint: tint(d.tint) } : d));
  P.land = L;
  return P;
}
// 화질 단계: 높음 = 지금 장면 그대로, 보통 = AO 끔 · 그림자 지도 2048 · 가까운 나무 반경 줄임(빌보드로) · 먼 숲 덜
const QUALITY = {
  high: { ao: true, shadow: 4096, treeNear: 210, forest: 1 },
  normal: { ao: false, shadow: 2048, treeNear: 150, forest: 0.6 },
};

// 텍스처는 그리개마다 한 번만 받는다 (게임에서 생이 바뀌어 장면을 다시 지어도 같은 텍스처를 쓴다)
const texCaches = new WeakMap();
// 시드와 상관없는 무거운 계산 (지형 정점, 먼 땅 그림, 강·길·밭 색인): 골격별로 한 번 만들어 장면 사이에 함께 쓴다
const SHARED = { envs: new Map(), fars: new Map(), terrains: new Map() };
const sharedEnv = (morph = 'england') => {
  let e = SHARED.envs.get(morph);
  if (!e) SHARED.envs.set(morph, e = makeEnv(morph));
  return e;
};

// ───────────────────────── 마을 짜기·꾸미기 (villageplan.js, three 없는 순수 모듈) ─────────────────────────
// 집 자리 planVillage(seed, env) 와 소품·가축·나무 자리 규칙은 villageplan.js 에 있다 (Node 시험: test/villageplan.test.mjs).
export { planVillage };
// 마을 꾸미기 규칙: rng, kit({ dims }), props({ dims }), layout(planVillage 결과 + makeEnv() 의 roadEdge·riverEdge·fieldAt)
// → { items, gardens, worn, trees, tall, bushes } (자리만. 소품 InstancedMesh 는 createRealScene 의 buildProps 가 이 결과로 짓는다)
export function dressVillage(rng, kit, props, layout) { return planDressing(rng, kit, props, layout); }

// ───────────────────────── 건물 세트 (Blender: tools/blender/kit_england.py → kits/england.glb) ─────────────────────────
// 조각 좌표: 바닥 가운데가 원점, 앞(문·트인 쪽) = 로컬 +z, 긴 축(용마루) = 로컬 x.
// 조각 크기 표 KIT_DIMS 와 고르기 주머니 KIT_POOL 은 kitdata.js (Blender 가 내보낸 kits/england.dims.json 과 시험으로 맞춘다).
const KIT_URL = ASSET + 'kits/england.glb';
// 장면 빛에 맞춘 재료 색 보정 (세트 텍스처에 곱한다)
const KIT_TINT = {
  plaster_lime: [1.18, 1.12, 1.02], wattle: [1.05, 1.0, 0.94], thatch: [1.08, 1.02, 0.94], stone_rubble: [1.02, 1.0, 0.97],
  stone_ashlar: [1.04, 1.02, 0.98], timber_dark: [1.0, 1.0, 1.0], slate: [1.4, 1.34, 1.24],
};
const kitCache = new Map();
// ── GPU 자원 캐시 정리 (수정 1차 I-3) ──
// 세트 glb(kitCache: 텍스처·지오메트리)와 나무 세트(treeCaches: 땅 × 세트마다 빌보드 굽기 타깃 2장 + 나무 지오메트리·재질), 사람 glb(realpeople.js)는
// 장면 사이에 함께 쓰지만 땅·세트가 바뀔수록 쌓였다. 장면을 지을 때마다 세대(GEN)를 올리고 그 장면이 쓸 항목에 세대를 적은 뒤,
// 지금·바로 앞 장면이 쓰지 않은 항목을 풀어 지운다 (다시 필요하면 다시 만든다). 게임은 새 장면을 다 지은 뒤 앞 장면을 푸므로 동시에 사는 장면은 둘까지다.
let GEN = 0;
const kitGen = new Map();          // 세트 glb 주소 → 마지막으로 쓴 세대
const CACHE = { freed: 0 };
function disposeObj3(root) {
  const seen = new Set();
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry?.dispose();
    for (const m of [].concat(o.material || [])) {
      if (seen.has(m)) continue; seen.add(m);
      for (const k of Object.keys(m)) if (m[k] && m[k].isTexture) m[k].dispose();
      m.dispose();
    }
  });
}
function disposeTreeKit(TK) {   // ez-tree 텍스처는 ez-tree 가 함께 쓰므로 두고, glb 나무 텍스처는 세트 glb 와 함께 풀린다
  for (const k of [...TK.trees, ...TK.bushes]) { k.bGeo.dispose(); k.lGeo.dispose(); k.bark.dispose(); k.leaf.dispose(); k.depth.dispose(); }
  TK.bake.albRT.dispose(); TK.bake.nrmRT.dispose();
}
function treeMapOf(renderer) { let m = treeCaches.get(renderer); if (!m) { treeCaches.set(renderer, m = new Map()); m.gen = new Map(); } return m; }
function sweepCaches(renderer) {
  const keep = GEN - 1;
  for (const [url, p] of [...kitCache]) if ((kitGen.get(url) ?? -1) < keep) { kitCache.delete(url); kitGen.delete(url); CACHE.freed++; p.then((k) => disposeObj3(k.scene)).catch(() => {}); }
  const m = treeMapOf(renderer);
  for (const [key, p] of [...m]) if ((m.gen.get(key) ?? -1) < keep) { m.delete(key); m.gen.delete(key); CACHE.freed++; p.then(disposeTreeKit).catch(() => {}); }
  CACHE.freed += sweepPeople(keep);
}
const cacheInfo = (renderer) => ({ gen: GEN, kits: kitCache.size, trees: treeMapOf(renderer).size, people: peopleCacheSize(), freed: CACHE.freed });
// 세트 glb 를 한 번만 불러 { pieces: Map(이름 → Object3D), scene } 로 돌려준다 (같은 주소는 캐시).
// pieces 의 Object3D·지오메트리·재질은 장면들이 함께 보는 **읽기 전용 원본**이다: 고치지 말고 복제해서 쓴다
// (createRealScene 은 지오메트리를 풀어 새로 만들고, 재질은 장면마다 clone 한 뒤 색·안개·발광을 붙인다).
export function loadKit(url) {
  if (kitCache.has(url)) return kitCache.get(url);
  const p = (async () => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.loadAsync(url);
    gltf.scene.updateMatrixWorld(true);
    const pieces = new Map();
    for (const o of gltf.scene.children) pieces.set(o.name, o);
    return { pieces, scene: gltf.scene };
  })();
  kitCache.set(url, p);
  p.catch(() => kitCache.delete(url));
  return p;
}
export function preloadAssets(birth) {
  try {
    if (!birth) return;
    const stage = stageOf(birth);
    const kitName = sceneKitOf(stage);
    const KIT = KIT_SETS[kitName] ? kitName : 'england';
    const KS = KIT_SETS[KIT];
    if (!KS) return;
    const FL = flavorOf(KIT, stage.variant), FLV = (FL && KS.flavors && KS.flavors[FL]) || null;
    const kitUrl = ASSET + 'kits/' + ((FLV && FLV.kit) || KS.kit) + '.glb';
    const propsUrl = ASSET + 'kits/' + KS.props + '.glb';
    const people = (FLV && FLV.people) || KS.people;
    const peopleUrl = ASSET + 'people/' + people + '.glb';
    loadKit(kitUrl);
    loadKit(propsUrl);
    if (KS.trees) loadKit(ASSET + 'kits/' + KS.trees + '.glb');
    preloadPeople(peopleUrl, ASSET + 'people/anims.glb');
  } catch (e) {}
}
// 양자화된(정수) 속성을 Float32 로 풀어 새 지오메트리로 (행렬을 곱해 합치려고)
// 다음 일거리로 넘긴다 (세트·나무를 캐시에서 바로 받아도 짓기를 여러 덩어리로 나눠, 한 번에 오래 멈추지 않게)
const nextTask = () => new Promise((r) => setTimeout(r, 0));
// 세트 조각마다 한 번만 풀어 둔다 (캐시된 세트 원본은 읽기 전용이라 결과도 장면 사이에 함께 쓸 수 있다. 쓸 때는 clone)
const floatGeos = new WeakMap();
function floatGeoOf(src) { let g = floatGeos.get(src); if (!g) floatGeos.set(src, g = toFloatGeo(src)); return g; }
function toFloatGeo(src) {
  const g = new THREE.BufferGeometry();
  for (const name of ['position', 'normal', 'uv', 'uv1']) {
    const a = src.attributes[name]; if (!a) continue;
    const n = a.count, k = a.itemSize, out = new Float32Array(n * k), get = [a.getX, a.getY, a.getZ, a.getW];
    for (let i = 0; i < n; i++) for (let j = 0; j < k; j++) out[i * k + j] = get[j].call(a, i);
    g.setAttribute(name, new THREE.BufferAttribute(out, k));
  }
  g.setIndex(new THREE.BufferAttribute(Uint32Array.from(src.index.array), 1));
  return g;
}
const isUnder = (o, name) => { for (let p = o; p; p = p.parent) if (p.name === name) return true; return false; };

// ───────────────────────── 안개 (높이 + 해 쪽 산란) ─────────────────────────
// three 의 안개 조각을 바꿔 끼운다: 거리·높이에 따라 짙어지고, 해 쪽을 볼 때 해 색이 섞인다 (대기 원근)
const FOGU = {
  uFogSunDir: { value: new THREE.Vector3(0, 1, 0) },
  uFogSunCol: { value: new THREE.Color(1, 1, 1) },
  uFogH: { value: new THREE.Vector3(1 / 380, 0, 0) },   // x: 높이 감쇠, y: 기준 높이, z: 카메라 높이
  uFogSunK: { value: new THREE.Vector2(6, 1) },         // 해 쪽 산란: x 거듭제곱(작을수록 넓다), y 세기 (아침·해질녘에 넓고 세게)
};
let fogPatched = false;
function patchFog() {
  if (fogPatched) return; fogPatched = true;
  THREE.ShaderChunk.fog_pars_vertex = `#ifdef USE_FOG
  varying float vFogDepth; varying vec3 vFogWorldDir;
#endif`;
  THREE.ShaderChunk.fog_vertex = `#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogWorldDir = transpose( mat3( viewMatrix ) ) * mvPosition.xyz;
#endif`;
  THREE.ShaderChunk.fog_pars_fragment = `#ifdef USE_FOG
  uniform vec3 fogColor; varying float vFogDepth; varying vec3 vFogWorldDir;
  uniform vec3 uFogSunDir; uniform vec3 uFogSunCol; uniform vec3 uFogH; uniform vec2 uFogSunK;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear; uniform float fogFar;
  #endif
#endif`;
  THREE.ShaderChunk.fog_fragment = `#ifdef USE_FOG
  {
  #ifdef FOG_EXP2
    float fdist = length( vFogWorldDir );
    vec3 fdir = vFogWorldDir / max( fdist, 1e-3 );
    float hb = max( uFogH.x, 1e-5 );
    float dy = vFogWorldDir.y;
    float f0 = exp( - hb * max( uFogH.z - uFogH.y, 0.0 ) );
    float integ = abs( hb * dy ) > 1e-3 ? ( 1.0 - exp( - hb * dy ) ) / ( hb * dy ) : 1.0;
    float fogFactor = 1.0 - exp( - fogDensity * fdist * f0 * integ * ( 0.55 + fdist / 2000.0 ) );
    float sunAmt = min( pow( max( dot( fdir, uFogSunDir ), 0.0 ), max( uFogSunK.x, 1.0 ) ) * uFogSunK.y, 1.0 );
    vec3 fcol = mix( fogColor, uFogSunCol, sunAmt );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
    vec3 fcol = fogColor;
  #endif
    gl_FragColor.rgb = mix( gl_FragColor.rgb, fcol, fogFactor );
  }
#endif`;
}
// 재질마다 안개 유니폼을 꽂는다 (onBeforeCompile 사슬)
function fogify(mat, key) {
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => { Object.assign(sh.uniforms, FOGU); if (prev && prev !== THREE.Material.prototype.onBeforeCompile) prev.call(mat, sh, r); };
  if (key) mat.customProgramCacheKey = () => key;
  return mat;
}

// ───────────────────────── 텍스처 ─────────────────────────
function makeTexLoader(renderer) {
  const loader = new THREE.TextureLoader();
  const aniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  let cache = texCaches.get(renderer);
  if (!cache) texCaches.set(renderer, cache = new Map());
  return (file, srgb = true) => {
    if (cache.has(file)) return cache.get(file);
    const t = loader.load(ASSET + 'tex/' + file);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = aniso;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    cache.set(file, t); return t;
  };
}
// 캔버스로 만드는 작은 텍스처들
function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
function macroNoiseTex() {   // 지형 큰 얼룩용 (반복 숨김), RGBA 각각 다른 잡음
  const N = 256, d = new Uint8Array(N * N * 4);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = (j * N + i) * 4;
    // 타일되게: 주기 잡음 (원 위의 좌표)
    const u = i / N * Math.PI * 2, v = j / N * Math.PI * 2;
    const f = (s, fr) => fbm(Math.cos(u) * fr + 50, Math.sin(u) * fr + Math.cos(v) * fr * 0.7 + Math.sin(v) * fr * 0.7, 4, s);
    d[k] = (f(1, 2.0) * 0.5 + 0.5) * 255; d[k + 1] = (f(2, 3.3) * 0.5 + 0.5) * 255; d[k + 2] = (f(3, 5.1) * 0.5 + 0.5) * 255; d[k + 3] = 255;
  }
  const t = new THREE.DataTexture(d, N, N); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true; t.needsUpdate = true; return t;
}
// 풀포기 그림: 뿌리는 가운데 좁은 곳에 모이고, 잎끝은 바깥으로 퍼지며 가운데가 가장 높다 (둥근 포기 꼴).
// 카드 밑변 전체에 잎이 서 있지 않아 「네모 도장」 가장자리가 생기지 않는다. 밑동 색은 땅 풀색에 가깝게.
function grassBladeTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); const r = rng(5);
    for (let i = 0; i < 120; i++) {
      const u = (r() + r() + r()) / 3 - 0.5;                                   // 뿌리 자리 (가운데에 몰림)
      const x0 = w / 2 + u * w * 0.4, lean = (r() - 0.5) * 0.5 + u * 1.7;     // 바깥쪽 잎은 바깥으로 눕는다
      const hgt = h * (0.28 + 0.62 * Math.max(0, 1 - Math.abs(u) * 1.7) * (0.55 + 0.45 * r()));
      const top = h - hgt, x1 = x0 + lean * w * 0.3, bw = 1.2 + r() * 1.8;
      const gr = g.createLinearGradient(0, h, 0, top), k = r();
      gr.addColorStop(0, `rgb(${62 + k * 14},${80 + k * 16},${32 + k * 8})`);
      gr.addColorStop(0.45, `rgb(${92 + k * 36},${116 + k * 32},${42 + k * 18})`);
      gr.addColorStop(1, `rgb(${150 + k * 50},${160 + k * 40},${82 + k * 30})`);
      g.fillStyle = gr;
      g.beginPath(); g.moveTo(x0 - bw, h); g.quadraticCurveTo(x0 + (x1 - x0) * 0.25, (h + top) / 2, x1, top); g.lineTo(x0 + bw, h); g.fill();
    }
  });
}
// 들꽃 포기: 가는 줄기·잎 몇 개 + 끝에 꽃송이 (흰·노랑·분홍·보라·파랑·빨강 섞임)
function flowerTex() {
  return canvasTex(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h); const r = rng(9);
    const COLS = [[238, 236, 222], [246, 206, 58], [232, 136, 162], [150, 104, 196], [112, 140, 222], [206, 52, 40], [244, 240, 228]];
    for (let i = 0; i < 26; i++) {
      const x = 14 + r() * (w - 28), top = h * (0.12 + r() * 0.42), lean = (r() - 0.5) * 30, k = r();
      g.strokeStyle = `rgb(${52 + k * 30},${78 + k * 30},${28 + k * 12})`; g.lineWidth = 1.4 + r() * 1.2;
      g.beginPath(); g.moveTo(x, h); g.quadraticCurveTo(x + lean * 0.3, (h + top) / 2, x + lean, top); g.stroke();
      for (let l = 0; l < 2; l++) {   // 잎
        const ly = h - (h - top) * (0.2 + r() * 0.4), lx = x + lean * (1 - (ly - top) / (h - top)) * 0.6, d = r() < 0.5 ? -1 : 1;
        g.fillStyle = `rgb(${60 + k * 30},${92 + k * 30},${34 + k * 14})`;
        g.beginPath(); g.ellipse(lx + d * 7, ly - 3, 9, 3, d * 0.5, 0, Math.PI * 2); g.fill();
      }
      const c = COLS[Math.floor(r() * COLS.length)], rad = 4 + r() * 6;
      for (let p = 0; p < 6; p++) {   // 꽃잎
        const a = p / 6 * Math.PI * 2; g.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        g.beginPath(); g.ellipse(x + lean + Math.cos(a) * rad * 0.6, top + Math.sin(a) * rad * 0.45, rad * 0.55, rad * 0.32, a, 0, Math.PI * 2); g.fill();
      }
      g.fillStyle = 'rgb(214,170,40)'; g.beginPath(); g.arc(x + lean, top, rad * 0.25, 0, Math.PI * 2); g.fill();
    }
  });
}
function smokeTex() {
  return canvasTex(64, 64, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.22)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
}

// ───────────────────────── 지오메트리 도구 ─────────────────────────
// 미터 단위 UV 상자 (면마다 실제 크기 / tile)
function boxGeo(w, h, d, tile = 2, off = [0, 0]) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0] / tile + off[0], uv.getY(i) * dims[f][1] / tile + off[1]); }
  return g;
}
const _q = new THREE.Quaternion(), _v1 = new THREE.Vector3(), _v2 = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);

// ───────────────────────── 나무 세트 (ez-tree 만들기 + 먼 나무 빌보드 굽기): 그리개 × 땅 모습마다 한 번 ─────────────────────────
// 시드와 상관없다 (종·모양·색은 땅 모습 프리셋에서만). 게임에서 생이 바뀌어도 다시 만들지 않는다 (만들기·굽기가 생마다 수백 ms).
// 지오메트리는 userData.shared, 재질·빌보드 타깃은 장면 disposables 에 넣지 않는다.
const TREEU = { uTime: { value: 0 }, uSunCol: { value: new THREE.Color(1, 1, 1) }, uAmb: { value: new THREE.Color(0.3, 0.33, 0.38) } };
const treeCaches = new WeakMap();
const waterCaches = new WeakMap();   // 그리개 → Water (장면 사이에 함께 쓴다)
const deepSet = (a, b) => { for (const k in b) { if (b[k] && typeof b[k] === 'object') { a[k] ??= {}; deepSet(a[k], b[k]); } else a[k] = b[k]; } return a; };
// 가지 끝을 늘어뜨린다 (버드나무): 줄기에서 멀수록, 높을수록 많이 내린다
function droopGeo(g, amt, top) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const r = Math.hypot(p.getX(i), p.getZ(i)) / top, h = p.getY(i) / top;
    p.setY(i, Math.max(0.03 * top, p.getY(i) - amt * top * Math.pow(Math.max(0, r - 0.05), 1.6) * (0.4 + 0.6 * h)));
  }
  p.needsUpdate = true;
}
// 나무 잎 재질 (ez-tree·glb 나무가 함께 쓴다): 알파 깎기 양면 + 바람 흔들림 + 해 쪽에서 볼 때 비침
function leafMaterial(map, tint) {
      const leaf = fogify(new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, side: THREE.DoubleSide, color: new THREE.Color(tint), roughness: 0.85 }), 'leaf');
      leaf.onBeforeCompile = ((prev) => (sh, r) => {
        prev(sh, r); sh.uniforms.uTime = TREEU.uTime; sh.uniforms.uSunCol = TREEU.uSunCol; sh.uniforms.uLeafSun = FOGU.uFogSunDir;
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime; varying vec3 vLW;')
          .replace('#include <begin_vertex>', `#include <begin_vertex>
            #ifdef USE_INSTANCING
              float ph = instanceMatrix[3].x * 0.13 + instanceMatrix[3].z * 0.11;
            #else
              float ph = 0.0;
            #endif
            float sw = clamp(position.y / 12.0, 0.0, 1.0);
            transformed += vec3(sin(uTime * 1.1 + ph + position.y * 0.4), 0.0, cos(uTime * 0.9 + ph + position.x * 0.4)) * 0.07 * sw;`)
          .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvLW = (modelMatrix * vec4(transformed,1.0)).xyz;');
        sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', ''))
          .replace('#include <common>', '#include <common>\nuniform vec3 uSunCol; uniform vec3 uLeafSun; varying vec3 vLW;')
          .replace('#include <opaque_fragment>', `{ vec3 vd = normalize(vLW - cameraPosition); float bl = pow(max(dot(vd, uLeafSun), 0.0), 3.0);
              outgoingLight += diffuseColor.rgb * uSunCol * bl * 0.55; }
            #include <opaque_fragment>`);
      })(leaf.onBeforeCompile);
  return leaf;
}
// glb 조각 → 재료별 Float 지오메트리 (bark: frond 가 아닌 것, leaf: frond) · 크기 배수 s
async function glbGeos(url, name, s = 1) {
  const src = await loadKit(url);
  const root = src.pieces.get(name); if (!root) throw new Error('나무 세트에 조각이 없다: ' + name);
  const out = { bark: [], leaf: [], barkMat: null, leafMat: null };
  root.traverse((o) => {
    if (!o.isMesh) return;
    const g = floatGeoOf(o.geometry).clone(); if (g.attributes.uv1) g.deleteAttribute('uv1');
    g.applyMatrix4(o.matrixWorld); if (s !== 1) g.scale(s, s, s);
    if (o.material.name === 'frond') { out.leaf.push(g); out.leafMat = o.material; } else { out.bark.push(g); out.barkMat = out.barkMat || o.material; }
  });
  return out;
}
// glb 나무 하나 → ez-tree 나무와 같은 꼴 { def, bGeo, lGeo, bark, leaf, depth }
async function glbTree(def, P) {
  const G = await glbGeos(def.url, def.glb, def.s || 1);
  let bGeo;
  if (G.bark.length) bGeo = mergeGeometries(G.bark);
  else { bGeo = new THREE.BufferGeometry(); bGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0], 3)); bGeo.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0], 3)); bGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0], 2)); bGeo.setIndex([0, 1, 2]); }
  const lGeo = mergeGeometries(G.leaf);
  const bm = G.barkMat, lm = G.leafMat;
  const bark = fogify(new THREE.MeshStandardMaterial({ map: bm ? bm.map : null, normalMap: bm ? bm.normalMap : null, color: new THREE.Color(...(def.barkTint || [1, 1, 1])), roughness: 0.95 }));
  const lc = (P.land && P.land.leaf) || [1, 1, 1], leaf = leafMaterial(lm.map, def.tint ?? new THREE.Color(lc[0], lc[1], lc[2]).getHex());
  const depth = new THREE.MeshDepthMaterial({ map: lm.map, alphaTest: 0.5, depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
  bGeo.userData.shared = lGeo.userData.shared = true;
  return { def, bGeo, lGeo, bark, leaf, depth };
}
function treeKit(renderer, landKey, P) {
  const m = treeMapOf(renderer);
  if (m.has(landKey)) return m.get(landKey);
  const p = (async () => {
    const ez = await import(EZTREE);
    const kit = [];
    const waitTex = async (list) => { for (let k = 0; k < 100 && list.some((t) => t && !(t.image && (t.image.complete ?? true) && (t.image.width ?? 1) > 0)); k++) await new Promise((r) => setTimeout(r, 50)); };
    for (const def of [...P.trees, ...(P.bushes || [])]) {
      if (def.glb) { try { kit.push(await glbTree(def, P)); } catch (e) { console.warn('한 영혼의 여정 무대: glb 나무를 못 불러 그 종만 뺀다', def.glb, e); } continue; }
      const t = new ez.Tree(); t.loadPreset(def.preset); t.options.seed = def.seed;
      if (def.opt) deepSet(t.options, def.opt);
      t.generate();
      t.updateMatrixWorld(true);
      if (def.droop) { const top = new THREE.Box3().setFromObject(t).max.y; droopGeo(t.branchesMesh.geometry, def.droop, top); droopGeo(t.leavesMesh.geometry, def.droop, top); }
      const bb = new THREE.Box3().setFromObject(t), s = def.h / (bb.max.y - bb.min.y);
      let bGeo = t.branchesMesh.geometry.clone(); bGeo.scale(s, s, s);
      if (def.roots) {   // 반얀: 공기뿌리(trees_southasia.glb, 키 14 m 나무에 맞춘 것)를 가지 지오메트리에 합친다 (같은 껍질 재질·같은 빌보드). 못 읽으면 뿌리 없이
        try {
          const rg = await glbGeos(def.rootsUrl, def.roots, def.h / 14);
          const bare = new THREE.BufferGeometry(); for (const k of ['position', 'normal', 'uv']) bare.setAttribute(k, bGeo.attributes[k]); bare.setIndex(bGeo.index);
          bGeo = mergeGeometries([bare, ...rg.bark]);
        } catch (e) { console.warn('한 영혼의 여정 무대: 반얀 공기뿌리를 못 불러 뿌리 없이', e); }
      }
      const lGeo = t.leavesMesh.geometry.clone(); lGeo.scale(s, s, s);
      lGeo.computeBoundingBox(); const cc = new THREE.Vector3(); lGeo.boundingBox.getCenter(cc); cc.y -= (lGeo.boundingBox.max.y - lGeo.boundingBox.min.y) * 0.15;
      const lp = lGeo.attributes.position, ln = lGeo.attributes.normal, tmp = new THREE.Vector3(), nn = new THREE.Vector3();
      for (let i = 0; i < lp.count; i++) { tmp.fromBufferAttribute(lp, i).sub(cc).normalize(); nn.fromBufferAttribute(ln, i); nn.lerp(tmp, 0.8).normalize(); ln.setXYZ(i, nn.x, nn.y, nn.z); }
      const bm = t.branchesMesh.material, lm = t.leavesMesh.material;
      if (def.leafTex) {   // 잎 그림을 바꿔 끼운다 (감나무: 잎 + 주황 감, docs/past-life/tools/make_leaf_tex.py). 못 읽으면 ez-tree 잎 그대로
        try { const lt = await new THREE.TextureLoader().loadAsync(ASSET + 'tex/' + def.leafTex); lt.colorSpace = THREE.SRGBColorSpace; lm.map = lt; }
        catch (e) { console.warn('한 영혼의 여정 무대: 잎 그림을 못 불러 ez-tree 잎으로', def.leafTex, e); }
      }
      await waitTex([bm.map, bm.normalMap, bm.aoMap, bm.roughnessMap, lm.map]);
      const bark = fogify(new THREE.MeshStandardMaterial({ map: bm.map, normalMap: bm.normalMap, aoMap: bm.aoMap, roughnessMap: bm.roughnessMap, color: new THREE.Color(...(def.barkTint || [0.75, 0.72, 0.68])), roughness: 1 }));
      const leaf = leafMaterial(lm.map, def.tint ?? P.leafTint);
      const depth = new THREE.MeshDepthMaterial({ map: lm.map, alphaTest: 0.5, depthPacking: THREE.RGBADepthPacking, side: THREE.DoubleSide });
      kit.push({ def, bGeo, lGeo, bark, leaf, depth });
      bGeo.userData.shared = lGeo.userData.shared = true;   // 장면 dispose 가 지우지 않는다
      t.branchesMesh.geometry.dispose(); t.leavesMesh.geometry.dispose();
    }
    const trees = kit.filter((k) => !k.def.bush), bushes = kit.filter((k) => k.def.bush);
    // ── 먼 나무 빌보드 굽기: 변형마다 8방향 × (색, 나무 좌표 노멀) 256² 칸 ──
    const CELL = 256, DIRS = 8, NV = trees.length;
    const rtOpt = { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter };
    const albRT = new THREE.WebGLRenderTarget(CELL * DIRS, CELL * NV, { ...rtOpt, type: THREE.HalfFloatType });
    const nrmRT = new THREE.WebGLRenderTarget(CELL * DIRS, CELL * NV, { ...rtOpt, type: THREE.UnsignedByteType });
    const bScene = new THREE.Scene();
    const nrmMat = (map) => new THREE.ShaderMaterial({
      uniforms: { map: { value: map }, useMap: { value: map ? 1 : 0 } }, side: THREE.DoubleSide,
      vertexShader: 'varying vec3 vN; varying vec2 vUv; void main(){ vN = normal; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D map; uniform float useMap; varying vec3 vN; varying vec2 vUv; void main(){ if (useMap > 0.5 && texture2D(map, vUv).a < 0.5) discard; gl_FragColor = vec4(normalize(vN) * 0.5 + 0.5, 1.0); }',
    });
    const prevClear = renderer.getClearColor(new THREE.Color()), prevAlpha = renderer.getClearAlpha();
    renderer.setClearColor(0x000000, 0);
    for (const rt of [albRT, nrmRT]) { renderer.setRenderTarget(rt); renderer.clear(); }
    const sizes = [];
    trees.forEach((k, vi) => {
      const alb = [new THREE.Mesh(k.bGeo, new THREE.MeshBasicMaterial({ map: k.bark.map, color: k.bark.color })), new THREE.Mesh(k.lGeo, new THREE.MeshBasicMaterial({ map: k.leaf.map, alphaTest: 0.5, side: THREE.DoubleSide, color: k.leaf.color }))];
      const nrm = [new THREE.Mesh(k.bGeo, nrmMat(null)), new THREE.Mesh(k.lGeo, nrmMat(k.leaf.map))];
      const g = new THREE.Group(); bScene.add(g);
      const bb = new THREE.Box3(); for (const m of alb) bb.expandByObject(m);
      const rad = Math.max(-bb.min.x, bb.max.x, -bb.min.z, bb.max.z), S = Math.max(2 * rad, bb.max.y - bb.min.y) * 1.06, y0 = bb.min.y - S * 0.02;
      const cam = new THREE.OrthographicCamera(-S / 2, S / 2, S, 0, 0.1, 400); cam.position.set(0, y0, 200); cam.lookAt(0, y0, 0);
      for (let d = 0; d < DIRS; d++) {
        g.rotation.y = -d * Math.PI * 2 / DIRS;
        for (const [rt, set] of [[albRT, alb], [nrmRT, nrm]]) {
          g.clear(); g.add(...set);
          rt.viewport.set(d * CELL, vi * CELL, CELL, CELL); rt.scissor.set(d * CELL, vi * CELL, CELL, CELL); rt.scissorTest = true;
          renderer.setRenderTarget(rt); renderer.render(bScene, cam);
        }
      }
      sizes.push([S, y0]);
      g.clear(); bScene.remove(g); for (const m of [...alb, ...nrm]) m.material.dispose();
    });
    for (const rt of [albRT, nrmRT]) rt.scissorTest = false;
    renderer.setRenderTarget(null); renderer.setClearColor(prevClear, prevAlpha);
    return { trees, bushes, bake: { albRT, nrmRT, sizes, NV } };
  })();
  m.set(landKey, p);
  p.catch(() => m.delete(landKey));
  return p;
}

// ───────────────────────── 본체 ─────────────────────────
export function createRealScene(canvas, opts = {}) {
  patchFog();
  // 세트 묶음 (kitdata.js KIT_SETS) + 마을 요리법 (villageplan.js RECIPES): 건물·소품·나무·사람 glb, 크기 표, 정한 자리
  // 요리법은 세트 + {태어난 해(opts.era), 땅(opts.area)} 로 (villageplan.js recipeFor: 시대·땅에 맞지 않는 조각을 거른다). 갈래(flavor)는 같은 세트 안의 다른 사람 옷·물감 (동남아)
  const KIT = KIT_SETS[opts.kit] ? opts.kit : 'england', KS = KIT_SETS[KIT], RC = recipeFor(KIT, { year: opts.era, area: opts.area, setting: opts.setting }), KD = RC.dims || KS.dims, PD = KS.propDims;
  const FL = flavorOf(KIT, opts.area), FLV = (FL && KS.flavors && KS.flavors[FL]) || null, PEOPLE = (FLV && FLV.people) || KS.people;
  const peopleUrl = opts.peopleUrl || ASSET + 'people/' + PEOPLE + '.glb';
  // 동아시아 갈래(한국·일본)는 건물 glb 가 따로다 (같은 조각 이름, 크기 표는 요리법 RC.dims)
  const KIT_URL_S = opts.kitUrl || ASSET + 'kits/' + ((FLV && FLV.kit) || KS.kit) + '.glb', PROPS_URL_S = opts.propsUrl || ASSET + 'kits/' + KS.props + '.glb';
  const TREE_KEY = (opts.land || 'temperate') + '|' + KIT;
  const P = landPreset(PRESETS[presetKey(opts.era, opts.region, KIT)], opts.land), LD = P.land;
  const QL = QUALITY[opts.quality] || QUALITY.normal;
  const state = { time: opts.timeOfDay ?? 7, post: opts.post ?? true, ao: opts.ao ?? QL.ao, bloom: opts.bloom ?? true, orbit: false, disposed: false, view: opts.view || 'overview', quality: QUALITY[opts.quality] ? opts.quality : 'normal' };
  const quality = state.quality;

  const ownRenderer = !opts.renderer;
  const renderer = opts.renderer || new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.setPixelRatio(Math.min(opts.pixelRatio ?? window.devicePixelRatio ?? 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.6;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;           // 그림자는 몇 프레임에 한 번 (정적 장면 + 작은 사람들)
  const SHADOW_EVERY = opts.shadowEvery ?? (quality === 'normal' ? 6 : 3);
  let frameNo = 0;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xbfd0e0, P.fog.density);
  FOGU.uFogH.value.x = P.fog.heightFalloff;
  const camera = new THREE.PerspectiveCamera(33, 16 / 9, 0.5, 30000);
  camera.layers.enable(1);                       // 1번 층: 풀포기 (물 반사에서는 뺀다)
  // 이 장면이 쓸 캐시 항목에 세대를 적고, 지금·앞 장면이 쓰지 않은 것을 푼다 (I-3)
  { const g = ++GEN;
    for (const u of [KIT_URL_S, PROPS_URL_S, KS.trees ? ASSET + 'kits/' + KS.trees + '.glb' : null]) if (u) kitGen.set(u, g);
    treeMapOf(renderer).gen.set(TREE_KEY, g);
    touchPeople(peopleUrl, ASSET + 'people/anims.glb', g);
    sweepCaches(renderer); }
  const tex = makeTexLoader(renderer);
  const disposables = [];
  const updaters = [];                           // (dt, t) => void
  const R = rng(1329);
  state.envI = opts.envIntensity ?? 0.6;
  const applyEnvI = () => scene.traverse((o) => { if (o.material && o.material.isMeshStandardMaterial) o.material.envMapIntensity = state.envI; });
  renderer.info.autoReset = false;

  // ── 하늘 · 해 · 빛 ──
  const SKYU = { uSkyGain: { value: 0.72 }, uSkySat: { value: 1.45 } };
  const tuneSky = (m) => {
    Object.assign(m.uniforms, SKYU);
    m.fragmentShader = m.fragmentShader.replace('uniform vec3 up;', 'uniform vec3 up; uniform float uSkyGain; uniform float uSkySat;')
      .replace('gl_FragColor = vec4( retColor, 1.0 );', 'float sl = dot(retColor, vec3(0.2126, 0.7152, 0.0722)); retColor = max(mix(vec3(sl), retColor, uSkySat), 0.0) * uSkyGain; gl_FragColor = vec4( retColor, 1.0 );');
  };
  const sky = new Sky(); sky.scale.setScalar(20000); sky.renderOrder = -2; tuneSky(sky.material); scene.add(sky);
  const su = sky.material.uniforms;
  su.turbidity.value = P.sky.turbidity; su.rayleigh.value = P.sky.rayleigh; su.mieCoefficient.value = P.sky.mie; su.mieDirectionalG.value = P.sky.mieG;
  const skyScene = new THREE.Scene(); const sky2 = new Sky(); sky2.scale.setScalar(1000); tuneSky(sky2.material); skyScene.add(sky2);
  for (const k of ['turbidity', 'rayleigh', 'mieCoefficient', 'mieDirectionalG']) sky2.material.uniforms[k].value = su[k].value;
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT = null;

  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(QL.shadow, QL.shadow);
  const sc = sun.shadow.camera; sc.left = -150; sc.right = 150; sc.top = 150; sc.bottom = -150; sc.near = 10; sc.far = 1400;
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.04;
  sun.target.position.set(VC.x, 0, VC.z);
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(0xbcd2ee, 0x5a5232, 0.25); scene.add(hemi);
  const sunDir = new THREE.Vector3();

  // ── 구름 (하늘 돔 위 반투명 층) ──
  const cloudMat = new THREE.ShaderMaterial({
    uniforms: { uSun: { value: sunDir }, uLit: { value: new THREE.Color(1, 1, 1) }, uShade: { value: new THREE.Color(0.6, 0.65, 0.75) }, uCover: { value: P.clouds.cover }, uScale: { value: P.clouds.scale }, uTime: { value: 0 } },
    vertexShader: `varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; gl_Position.z = gl_Position.w; }`,
    fragmentShader: `uniform vec3 uSun; uniform vec3 uLit; uniform vec3 uShade; uniform float uCover; uniform float uScale; uniform float uTime; varying vec3 vW;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
      float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      float fb(vec2 p){ float v=0., a=.5; for(int i=0;i<6;i++){ v+=a*n(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return v; }
      void main(){
        vec3 d = normalize(vW - cameraPosition);
        if (d.y < 0.005) discard;
        vec2 p = d.xz / (d.y + 0.08) * 2400. * uScale + vec2(uTime * 0.004, uTime * 0.0015);
        float c = fb(p);
        float dens = smoothstep(uCover, uCover + 0.28, c);
        if (dens < 0.01) discard;
        float c2 = fb(p + uSun.xz * 0.35);
        float lit = clamp(0.55 + (c - c2) * 3.2, 0.0, 1.0);
        float silver = pow(max(dot(d, uSun), 0.), 10.) * 0.8;
        vec3 col = mix(uShade, uLit, lit) + uLit * silver;
        float a = dens * smoothstep(0.004, 0.06, d.y) * 0.95;
        gl_FragColor = vec4(col, a);
      }`,
    transparent: true, depthWrite: false, side: THREE.BackSide, fog: false,
  });
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(15000, 48, 24), cloudMat); clouds.renderOrder = -1; scene.add(clouds);
  disposables.push(cloudMat, clouds.geometry);

  // ── 지형 높이 ── (강·길 거리 색인과 밭 조각보는 villageplan.makeEnv: 꾸미기 규칙·Node 시험과 같은 것)
  const TB = performance.now(), times = {};
  const morph = morphologyOf({ kit: KIT, era: opts.era, setting: opts.setting, area: opts.area });
  const ENV = sharedEnv(morph);
  const { riverIdx, roadIdx, roadLines, FS, FN, FOFF, gp, fieldType, findCell, hedgeOn, fieldAt, cellType, cellTint, cellAng } = ENV;
  function baseHeight(x, z) {
    const d = Math.hypot(x - VC.x, z - VC.z);
    let h = 0.9 + 0.9 * fbm(x / 60, z / 60, 3, 4);
    const open = smooth(110, 520, d);
    h += open * (12 * (fbm(x / 330, z / 330, 5, 1) + 0.5) + 4 * fbm(x / 120, z / 120, 4, 2));          // 둘레 구릉
    h += smooth(250, 1500, d) * 125 * (0.55 + 0.8 * fbm(x / 780, z / 780, 4, 3));                     // 골짜기 벽 언덕
    h += smooth(-200, -2200, z) * 80;                                                                  // 마을 뒤(북쪽)로 오르막
    const u = (x + 39) * 0.82 - (z - 33) * 0.58;                                                       // 다리 → 교회 쪽 거리
    h += 13 * smooth(40, 240, u) * (1 - smooth(260, 520, d));                                        // 마을이 강에서 교회 쪽으로 완만히 오르는 비탈 (전경에서 마을이 화면을 더 채운다)
    h += smooth(1800, 6000, d) * 420 * (fbm(x / 2300, z / 2300, 4, 9) + 0.55);                        // 먼 산줄기
    return Math.max(h, 0.35);
  }
  function heightAt(x, z) {
    let h = baseHeight(x, z);
    const dr = riverIdx.edge(x, z);                 // 강 중심선까지 (w=0)
    const riverHw = ENV.riverHw || RIVER_HW;
    const bank = dr < riverHw ? lerp(-2.4, -0.1, (dr / riverHw) ** 2) : -0.1 + (dr - riverHw) * 0.1 + Math.max(0, dr - 60) ** 2 * 0.0025;
    if (dr < 419 && bank < h) h = bank;
    const dRoad = roadIdx.edge(x, z);
    if (dRoad < 1.5) h -= 0.12 * (1 - Math.max(0, dRoad) / 1.5);
    return h;
  }

  // ── 마을 짜기 + 꾸미기 (시드): 집은 길 따라 늘어서고, 소품·가축·나무 자리는 규칙으로 ──
  const seed = opts.seed ?? 1329;
  const T_LAYOUT = performance.now();
  const layout = planVillage(seed, ENV, RC);
  const dressing = (RC.dress || dressVillage)(rng(dressSeed(seed)), { dims: KD, without: RC.without }, { dims: PD }, { ...layout, roadEdge: ENV.roadEdge, riverEdge: ENV.riverEdge, fieldAt });
  const layoutMs = performance.now() - T_LAYOUT;
  // 땅 그림용 조각(텃밭 흙·밟힌 흙)을 8 m 칸에 넣어 둔다
  const patchGrid = new Map();
  for (const [kind, list] of [['garden', dressing.gardens], ['worn', dressing.worn]]) for (const o of list) {
    const ex = Math.abs(o.hx * o.c) + Math.abs(o.hz * o.s), ez = Math.abs(o.hx * o.s) + Math.abs(o.hz * o.c);
    for (let gx = Math.floor((o.x - ex - 1) / 8); gx <= Math.floor((o.x + ex + 1) / 8); gx++) for (let gz = Math.floor((o.z - ez - 1) / 8); gz <= Math.floor((o.z + ez + 1) / 8); gz++) {
      const k = gx * 100003 + gz; let a = patchGrid.get(k); if (!a) patchGrid.set(k, a = []); a.push([kind, o]);
    }
  }
  // 텍셀 하나의 밭 정보 → splat(RGB: 흙·밀·길) + info(R: 고랑 각도, G: 밭 색 변화, B: 산울타리 그늘)
  function sampleGround(x, z, out) {
    const dRoad = roadIdx.edge(x, z), dRiv = riverIdx.edge(x, z);
    let soil = 0, wheat = 0, path = 0, ang = 0, tint = 0.5, hedge = 0;
    const cell = findCell(x, z);
    if (cell) {
      const idx = cell.j * FN + cell.i;
      const ty = cellType ? cellType[idx] : fieldType(cell.i, cell.j);
      tint = cellTint ? cellTint[idx] : hash2(cell.i, cell.j, 14);
      ang = cellAng ? cellAng[idx] : 0;
      const inner = smooth(2.5, 6, cell.edge);       // 밭 가장자리는 풀 (두렁)
      if (ty === 2) wheat = inner; else if (ty === 3) soil = inner; else if (ty === 4) { wheat = 0.35 * inner; tint = 0.1 + tint * 0.2; }
      if (ty !== 0) hedge = 1 - smooth(1.5, 6.5, cell.edge);
    }
    let wornAmt = 0;
    if (out.gardens) {   // 텃밭 흙(고랑 방향 = 두둑 방향), 앞마당·장터·일터의 밟힌 흙
      const a = patchGrid.get(Math.floor(x / 8) * 100003 + Math.floor(z / 8));
      if (a) for (const [kind, o] of a) {
        const dx = x - o.x, dz = z - o.z, u = dx * o.c - dz * o.s, v = dx * o.s + dz * o.c;
        const e = Math.min(o.hx - Math.abs(u), o.hz - Math.abs(v)); if (e < -1.2) continue;
        if (kind === 'garden') { soil = Math.max(soil, smooth(-0.6, 0.5, e) * 0.95); ang = ((Math.atan2(-o.s, o.c) / Math.PI) + 4.5) % 1; }
        else wornAmt = Math.max(wornAmt, smooth(-1.2, 1.2, e + 0.9 * fbm(x / 3, z / 3, 2, 5)));
      }
    }
    const riverMeadow = smooth(14, 30, dRiv);
    soil *= riverMeadow; wheat *= riverMeadow; hedge *= smooth(10, 16, dRiv);
    path = Math.max(1 - smooth(-0.6, 0.9, dRoad), wornAmt * 0.6);
    hedge *= 1 - path;
    out[0] = soil * 255; out[1] = wheat * 255; out[2] = path * 255; out[3] = ang * 255; out[4] = tint * 255; out[5] = hedge * 255;
  }
  function splatData(cx, cz, size, N) {
    const a = new Uint8Array(N * N * 4), b = new Uint8Array(N * N * 4), o = [0, 0, 0, 0, 0, 0]; o.gardens = size < 1000;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = cx - size / 2 + (i + 0.5) / N * size, z = cz - size / 2 + (j + 0.5) / N * size;
      sampleGround(x, z, o); const k = (j * N + i) * 4;
      a[k] = o[0]; a[k + 1] = o[1]; a[k + 2] = o[2]; a[k + 3] = 255; b[k] = o[3]; b[k + 1] = o[4]; b[k + 2] = o[5]; b[k + 3] = 255;
    }
    return { a, b, N, cx, cz, size };
  }
  function splatTex({ a, b, N, cx, cz, size }) {
    const mk = (d, lin) => { const t = new THREE.DataTexture(d, N, N); t.magFilter = THREE.LinearFilter; t.minFilter = lin ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter; t.generateMipmaps = lin; t.needsUpdate = true; return t; };
    return { splat: mk(a, true), info: mk(b, false), rect: new THREE.Vector4(cx - size / 2, cz - size / 2, size, 0) };
  }
  const buildSplat = (cx, cz, size, N) => splatTex(splatData(cx, cz, size, N));
  const T0 = performance.now();
  const nearN = quality === 'normal' ? 384 : 512;
  const near = buildSplat(VC.x, VC.z, 700, nearN);
  // 먼 땅 그림(7 km)은 시드와 상관없다 (텃밭·밟힌 흙은 가까운 그림에만): 골격마다 한 번 만든 값을 생 사이에 함께 쓴다
  let farData = SHARED.fars.get(morph);
  if (!farData) SHARED.fars.set(morph, farData = splatData(VC.x, VC.z, 7000, 512));
  const far = splatTex(farData);
  const splatMs = performance.now() - T0;
  disposables.push(near.splat, near.info, far.splat, far.info);

  // ── 지형 메시 (가운데가 촘촘한 격자) ──
  const TL = 9000, TN = 460;
  function buildTerrainGeo() {
    // 지형 높이는 시드와 상관없다: 골격별로 정점·노멀·색인을 한 번 만들어 생 사이에 함께 쓴다 (지오메트리는 장면마다 새로, 배열만 나눔)
    const cachedT = SHARED.terrains.get(morph);
    if (cachedT) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(cachedT.pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(cachedT.nrm, 3)); g.setIndex(new THREE.BufferAttribute(cachedT.idx, 1)); return g; }
    const warp = (s) => TL * (0.034 * s + 0.966 * s * s * s * s * s);
    const xs = []; for (let i = 0; i <= TN; i++) xs.push(warp(-1 + 2 * i / TN));
    const pos = new Float32Array((TN + 1) * (TN + 1) * 3);
    for (let j = 0; j <= TN; j++) for (let i = 0; i <= TN; i++) {
      const x = VC.x + xs[i], z = VC.z + xs[j], k = (j * (TN + 1) + i) * 3;
      pos[k] = x; pos[k + 1] = heightAt(x, z); pos[k + 2] = z;
    }
    const idx = new Uint32Array(TN * TN * 6); let n = 0;
    for (let j = 0; j < TN; j++) for (let i = 0; i < TN; i++) {
      const a = j * (TN + 1) + i, b = a + 1, c = a + TN + 1, d = c + 1;
      idx[n++] = a; idx[n++] = c; idx[n++] = b; idx[n++] = b; idx[n++] = c; idx[n++] = d;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1)); g.computeVertexNormals();
    SHARED.terrains.set(morph, { pos, idx, nrm: g.attributes.normal.array });
    return g;
  }
  times.splat = Math.round(splatMs);
  const TT = performance.now();
  const terrainGeo = buildTerrainGeo(); disposables.push(terrainGeo);
  times.terrain = Math.round(performance.now() - TT);
  const macro = macroNoiseTex(); disposables.push(macro);
  const terrainMat = fogify(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 }), 'terrain');
  const TU = {
    tGrass: { value: tex('leafy_grass_diff_1k.jpg') }, tGrassN: { value: tex('leafy_grass_nor_gl_1k.jpg', false) },
    tSoil: { value: tex('farm_soil_diff_1k.jpg') }, tSoilN: { value: tex('farm_soil_nor_gl_1k.jpg', false) },
    tWheat: { value: tex('withered_grass_diff_1k.jpg') }, tPath: { value: tex('brown_mud_dry_diff_1k.jpg') }, tPathN: { value: tex('brown_mud_dry_nor_gl_1k.jpg', false) },
    tRiver: { value: tex('river_small_rocks_diff_1k.jpg') }, tMacro: { value: macro },
    tSplatN: { value: near.splat }, tInfoN: { value: near.info }, uRectN: { value: near.rect },
    tSplatF: { value: far.splat }, tInfoF: { value: far.info }, uRectF: { value: far.rect },
    uGrassTint: { value: new THREE.Vector3(...P.grass) }, uWheatTint: { value: new THREE.Vector3(...P.wheat) }, uHedge: { value: new THREE.Vector3(...P.hedgeColor) },
    uWater: { value: WATER_Y },
    // 땅 모습: 마른 풀 양 · 맨흙 얼룩 양 · 논(물 댄 밭) · 흙 색
    uLand: { value: new THREE.Vector3(LD.dry, LD.bare, RC.camp ? 0 : LD.paddy) }, uSoilTint: { value: new THREE.Vector3(...LD.soil) },
    // 동아시아: 비탈의 논을 등고선 두렁(층 높이 uTerrace m)으로 갈라 계단 논으로 · 농사 전 야영은 밭·논을 풀밭으로 (uCrops 0)
    uTerrace: { value: RC.terrace || 0 }, uCrops: { value: RC.camp ? 0 : 1 },
  };
  terrainMat.onBeforeCompile = ((prev) => (sh, r) => {
    prev(sh, r); Object.assign(sh.uniforms, TU);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vWP;
      uniform sampler2D tGrass, tGrassN, tSoil, tSoilN, tWheat, tPath, tPathN, tRiver, tMacro, tSplatN, tInfoN, tSplatF, tInfoF;
      uniform vec4 uRectN, uRectF; uniform vec3 uGrassTint, uWheatTint, uHedge, uLand, uSoilTint; uniform float uWater, uTerrace, uCrops;
      vec4 gSplat; vec4 gInfo; float gWet; float gPaddy;
      void groundSample(vec2 wp) {
        vec2 nu = (wp - uRectN.xy) / uRectN.z, fu = (wp - uRectF.xy) / uRectF.z;
        float inN = smoothstep(0.0, 0.04, nu.x) * smoothstep(1.0, 0.96, nu.x) * smoothstep(0.0, 0.04, nu.y) * smoothstep(1.0, 0.96, nu.y);
        float inF = smoothstep(0.0, 0.03, fu.x) * smoothstep(1.0, 0.97, fu.x) * smoothstep(0.0, 0.03, fu.y) * smoothstep(1.0, 0.97, fu.y);
        vec4 sN = texture2D(tSplatN, nu), sF = texture2D(tSplatF, fu);
        vec4 iN = texture2D(tInfoN, nu), iF = texture2D(tInfoF, fu);
        gSplat = mix(sF * inF, sN, inN);
        gInfo = mix(mix(vec4(0.0, 0.5, 0.0, 1.0), iF, inF), iN, inN);
      }`)
      .replace('#include <map_fragment>', `
      vec2 wp = vWP.xz;
      groundSample(wp);
      gSplat.rg *= uCrops;
      vec4 mac = texture2D(tMacro, wp / 420.0); vec4 mac2 = texture2D(tMacro, wp / 61.0);
      float dist = length(vWP - cameraPosition);
      vec3 g1 = texture2D(tGrass, wp / 4.5).rgb;
      vec3 g2 = texture2D(tGrass, mat2(0.8,-0.6,0.6,0.8) * wp / 13.0).rgb;
      vec3 grass = mix(g1, g2, smoothstep(0.35, 0.65, mac2.r));
      grass = mix(grass, vec3(dot(grass, vec3(0.33))) * vec3(0.95, 1.0, 0.7), 0.15);
      grass *= uGrassTint * mix(vec3(0.82, 0.95, 0.72), vec3(1.12, 1.06, 0.82), gInfo.g) * (0.82 + 0.36 * mac.r);
      // 잔디 얼룩: 마른 누런 자리, 짙고 무성한 자리, 잔 클로버 점 (한 가지 색 잔디로 보이지 않게)
      { float dryP = smoothstep(0.56, 0.8, texture2D(tMacro, wp / 37.0).b), lushP = smoothstep(0.58, 0.84, texture2D(tMacro, wp / 17.0 + 0.37).r);
        vec3 dryG = texture2D(tWheat, wp / 2.7).rgb * uWheatTint * 0.8;
        grass = mix(grass, mix(grass * vec3(1.1, 1.03, 0.72), dryG, 0.35), dryP * 0.6);
        grass = mix(grass, grass * vec3(0.74, 0.9, 0.7), lushP * 0.55);
        grass *= 0.9 + 0.2 * texture2D(tMacro, wp / 3.1).g; }
      vec3 path = texture2D(tPath, wp / 3.2).rgb * vec3(1.0, 0.94, 0.84);
      // 땅 모습: 마른 땅·초원은 풀이 마른 풀빛으로, 군데군데 맨흙 (uLand.x 마름, uLand.y 맨흙)
      if (uLand.x + uLand.y > 0.0) {
        vec3 dryAll = texture2D(tWheat, wp / 3.3).rgb * uWheatTint * (0.66 + 0.3 * mac.b);
        grass = mix(grass, dryAll, uLand.x * (0.75 + 0.25 * mac2.r));
        float bareP = smoothstep(0.42, 0.72, texture2D(tMacro, wp / 23.0 + 0.11).g * 0.7 + mac.r * 0.3);
        grass = mix(grass, path * uSoilTint * vec3(1.06, 0.98, 0.86), uLand.y * bareP);
      }
      float ang = gInfo.r * 3.14159; vec2 fdir = vec2(cos(ang), sin(ang));
      float rowc = dot(wp, fdir);
      float furrow = 0.5 + 0.5 * sin(rowc * 6.2832 / 0.95);
      float rowFade = 1.0 - smoothstep(60.0, 260.0, dist);
      vec3 soil = texture2D(tSoil, wp / 3.5).rgb * vec3(1.05, 0.92, 0.82) * uSoilTint * mix(1.0, 0.72 + 0.4 * furrow, rowFade);
      vec3 wheat = texture2D(tWheat, wp / 3.0).rgb * uWheatTint * (0.86 + 0.28 * mac2.g);
      wheat *= mix(1.0, 0.86 + 0.2 * (0.5 + 0.5 * sin(rowc * 6.2832 / 0.35)), rowFade * 0.6);
      // 논 (uLand.z): 밀밭 자리는 다 자란 벼(물이 조금 비침), 갈아엎은 밭 자리는 물 위에 줄지어 꽂은 모 (물을 댄 논). 물은 거칠기를 낮춰 하늘을 비춘다
      gPaddy = 0.0;
      if (uLand.z > 0.0) {
        // 모: 고랑 방향 줄(0.3 m) 위에 포기(0.22 m 간격)를 점점이 꽂은 꼴. 포기는 둥글고 가장자리가 부드럽다 (줄무늬처럼 이어 보이지 않게).
        // 포기가 화소보다 작아지는 거리에서는 평균 덮임으로 바꿔 물결무늬(모아레)가 생기지 않게 한다
        vec2 rq = vec2(rowc, dot(wp, vec2(-fdir.y, fdir.x))) / vec2(0.27, 0.21);
        rq.y += 0.5 * mod(floor(rq.x), 2.0);                                             // 줄마다 반 칸 엇갈려 꽂는다
        vec2 rqi = floor(rq), rqf = fract(rq) - 0.5;
        vec2 rjit = vec2(texture2D(tMacro, rqi * 0.071 + 0.13).r, texture2D(tMacro, rqi * 0.093 + 0.57).g) - 0.5;
        vec2 dv = (rqf + rjit * 0.5) * vec2(1.0, 1.2);
        float rd = length(dv), ta = atan(dv.y, dv.x + 1e-4);
        // 포기는 둥근 판이 아니라 잎이 뻗은 다발: 각도마다 반지름이 들쭉날쭉 (포기마다 다른 위상), 가운데(물에 잠긴 밑동)는 어둡게
        float star = 0.66 + 0.34 * sin(ta * 7.0 + rjit.x * 37.0) * sin(ta * 3.0 + rjit.y * 23.0 + 1.3);
        float hillR = (0.14 + 0.17 * texture2D(tMacro, rqi * 0.113 + 0.4).g) * star;
        float clump = (1.0 - smoothstep(hillR - 0.07, hillR + 0.05, rd)) * step(0.24, texture2D(tMacro, rqi * 0.057 + 0.2).b);
        float tuftShade = 0.72 + 0.4 * smoothstep(0.0, hillR + 0.02, rd);
        clump *= 0.45 + 0.55 * smoothstep(0.25, 0.6, texture2D(tMacro, wp / 7.0 + 0.3).r);   // 잘 자란 데·덜 자란 데 (큰 얼룩)
        float rAA = clamp(1.6 - length(fwidth(rq)) * 2.2, 0.0, 1.0);
        clump = mix(0.22, clump, rAA);
        tuftShade = mix(0.95, tuftShade, rAA);
        vec3 water = vec3(0.11, 0.14, 0.13) * (0.85 + 0.3 * mac.g);
        vec3 riceG = vec3(0.3, 0.46, 0.14) * (0.75 + 0.5 * mac2.b) * (0.6 + 0.9 * texture2D(tGrass, wp / 1.6).g);
        float grown = mix(0.8 + 0.12 * mac2.g, max(clump, 0.62), rowFade * 0.6);     // 다 자란 벼: 거의 덮는다
        float young = mix(0.22 + 0.1 * mac2.g, clump * 0.9, rowFade);                 // 모: 포기 사이로 물
        wheat = mix(wheat, mix(water, riceG * vec3(1.1, 1.05, 0.9), grown), uLand.z);
        soil = mix(soil, mix(water * vec3(1.15, 1.1, 1.0), riceG * 1.15 * mix(1.0, tuftShade, rowFade), young), uLand.z);
        gPaddy = uLand.z * (gSplat.g * (1.0 - grown) + gSplat.r * (1.0 - young));
      }
      // 계단 논 (동아시아): 비탈의 논을 등고선(층 높이 uTerrace)마다 풀 덮인 두렁으로 가르고, 층마다 물·벼 빛을 조금씩 달리 한다.
      //   두렁 폭 0.45 m 를 땅 기울기로 층 단위로 바꿔 그린다 (평지는 두렁이 없다). 화소보다 촘촘해지는 먼 곳은 평균 덮임으로.
      float terr = 0.0;
      if (uTerrace > 0.0 && uLand.z > 0.0) {
        float fieldW = clamp(gSplat.r + gSplat.g, 0.0, 1.0);
        mat2 J = mat2(dFdx(wp), dFdy(wp));
        vec2 grad = inverse(transpose(J) + mat2(1e-6)) * vec2(dFdx(vWP.y), dFdy(vWP.y));
        float slope = clamp(length(grad), 0.0, 1.5);
        float lev = vWP.y / uTerrace, fl = fract(lev), aa = fwidth(lev) + 1e-4;
        float wl = 0.45 * slope / uTerrace;
        float lineAmt = (1.0 - smoothstep(wl, wl + aa * 1.5, fl)) * smoothstep(0.02, 0.06, slope);
        lineAmt = mix(lineAmt, min(wl * 1.2, 0.6) * smoothstep(0.02, 0.06, slope), smoothstep(0.25, 0.6, aa));
        terr = lineAmt * fieldW;
        float lvTint = fract(sin(floor(lev) * 12.9898 + floor(wp.x / 37.0) * 7.31) * 43758.5453);
        vec3 lvMul = mix(vec3(0.9, 0.96, 0.92), vec3(1.08, 1.04, 0.94), lvTint);
        soil *= mix(vec3(1.0), lvMul, fieldW * smoothstep(0.02, 0.05, slope));
        wheat *= mix(vec3(1.0), lvMul, fieldW * smoothstep(0.02, 0.05, slope));
      }
      // 논두렁: 밭 가장자리(산울타리 그늘 값이 큰 곳)를 흙 둑으로 (논 땅에서만), 둑 위는 물빛이 없다
      float bund = max(uLand.z * smoothstep(0.9, 0.985, gInfo.b) * (1.0 - gSplat.b), terr);
      gPaddy *= 1.0 - bund;
      vec3 col = grass;
      col = mix(col, soil, gSplat.r);
      col = mix(col, wheat, gSplat.g);
      col = mix(col, path, gSplat.b);
      col = mix(col, uHedge * (0.8 + 0.4 * mac2.b), gInfo.b * 0.85 * (1.0 - 0.75 * uLand.z));
      col = mix(col, path * vec3(0.98, 0.9, 0.78) * (0.85 + 0.3 * mac2.g) * mix(vec3(1.0), uGrassTint * vec3(0.8, 0.9, 0.7), 0.25 * smoothstep(0.4, 0.8, mac2.b)), bund);
      gWet = smoothstep(-0.05, uWater - 0.25, vWP.y);
      vec3 bed = texture2D(tRiver, wp / 3.0).rgb * vec3(0.62, 0.6, 0.52);
      col = mix(col, bed, gWet);
      // 먼 곳은 큰 얼룩만 (텍스처 반복이 보이지 않게)
      col = mix(col, col * (0.85 + 0.3 * mac.g), smoothstep(400.0, 2500.0, dist));
      diffuseColor.rgb *= col;`)
      .replace('#include <roughnessmap_fragment>', `float roughnessFactor = roughness; roughnessFactor = mix(roughnessFactor, 0.45, gWet * 0.8); roughnessFactor = mix(roughnessFactor, 0.22, clamp(gPaddy, 0.0, 1.0));`)
      .replace('#include <normal_fragment_maps>', `{
        vec3 nG = texture2D(tGrassN, wp / 4.5).xyz * 2.0 - 1.0;
        vec3 nS = texture2D(tSoilN, wp / 3.5).xyz * 2.0 - 1.0;
        vec3 nP = texture2D(tPathN, wp / 3.2).xyz * 2.0 - 1.0;
        vec3 nt = mix(mix(nG, nS, gSplat.r), nP, gSplat.b);
        float ns = (1.0 - smoothstep(30.0, 300.0, dist)) * 0.9 * (1.0 - clamp(gPaddy, 0.0, 1.0));
        vec3 tW = (viewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz, bW = (viewMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz;
        normal = normalize(normal + (tW * nt.x - bW * nt.y) * ns);
      }`);
  })(terrainMat.onBeforeCompile);
  const terrain = new THREE.Mesh(terrainGeo, terrainMat); terrain.receiveShadow = true; scene.add(terrain);
  disposables.push(terrainMat);

  // ── 강물 (평면 반사) ──
  // three 의 Water 는 반사 렌더 타깃을 숨겨 두어 풀 수 없다 → 그리개마다 하나를 만들어 장면 사이에 옮겨 단다 (생마다 새로 만들면 타깃이 샌다)
  let water = waterCaches.get(renderer);
  if (!water) {
    water = new Water(new THREE.PlaneGeometry(9000, 9000), {
      textureWidth: 768, textureHeight: 768, waterNormals: tex('waternormals.jpg', false), sunDirection: new THREE.Vector3(0, 1, 0), sunColor: 0xffffff,
      waterColor: 0x0d1c16, distortionScale: 1.1, fog: true, alpha: 1,
    });
    Object.assign(water.material.uniforms, FOGU);
    water.material.uniforms.size.value = 3.5;
    water.material.fragmentShader = water.material.fragmentShader.replace('vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight', 'vec3( 0.015, 0.02, 0.018 ) + reflectionSample * 0.62 + reflectionSample * specularLight * 0.5');
    water.rotation.x = -Math.PI / 2; water.position.y = WATER_Y;
    water.geometry.userData.shared = true;
    waterCaches.set(renderer, water);
  }
  scene.add(water);

  // ── 재질 ──
  const mats = {};
  function std(key, p, tint) { const m = fogify(new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.92, metalness: 0 }, p))); if (tint) m.color.setRGB(...tint); mats[key] = m; disposables.push(m); return m; }
  std('stone', { map: tex('rustic_stone_wall_diff_1k.jpg'), normalMap: tex('rustic_stone_wall_nor_gl_1k.jpg', false), aoMap: tex('rustic_stone_wall_arm_1k.jpg', false), roughnessMap: tex('rustic_stone_wall_arm_1k.jpg', false) }, [0.95, 0.9, 0.82]);
  std('church', { map: tex('castle_wall_slates_diff_1k.jpg'), normalMap: tex('castle_wall_slates_nor_gl_1k.jpg', false), aoMap: tex('castle_wall_slates_arm_1k.jpg', false), roughnessMap: tex('castle_wall_slates_arm_1k.jpg', false) }, [1.08, 1.02, 0.9]);
  std('deck', { map: tex('brown_mud_dry_diff_1k.jpg'), normalMap: tex('brown_mud_dry_nor_gl_1k.jpg', false), roughness: 0.95 }, [0.92, 0.86, 0.78]);
  mats.stone.normalScale.set(1.2, 1.2);

  // ── 다리·울타리·묘지 같은 코드 도형: 재질별로 모았다가 한 번에 합친다 ──
  const bins = {};
  const add = (key, geo, matrix) => { if (matrix) geo.applyMatrix4(matrix); (bins[key] ||= []).push(geo.index ? geo.toNonIndexed() : geo); };
  // 나무·풀 놓지 않을 자리 [x,z,r]: 더할 때마다 16 m 칸 색인에도 바로 넣는다 (occAdd 만 쓴다, 묻기는 occHit)
  const occGrid = new Map();
  function occAdd(x, z, r) {
    const o = [x, z, r], e = r + 4;
    for (let gx = Math.floor((x - e) / 16); gx <= Math.floor((x + e) / 16); gx++) for (let gz = Math.floor((z - e) / 16); gz <= Math.floor((z + e) / 16); gz++) { const k = gx * 100003 + gz; let a = occGrid.get(k); if (!a) occGrid.set(k, a = []); a.push(o); }
  }
  function occHit(x, z, pad = 0) {
    const a = occGrid.get(Math.floor(x / 16) * 100003 + Math.floor(z / 16)); if (!a) return false;
    for (const [ox, oz, or] of a) { const rr = or + pad; if (rr > 0 && (x - ox) ** 2 + (z - oz) ** 2 < rr * rr) return true; }
    return false;
  }
  const _yAxis = new THREE.Vector3(0, 1, 0);
  function placeMatrix(x, z, rot, y) { return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(_yAxis, rot), new THREE.Vector3(1, 1, 1)); }

  // ── 건물 자리 (세트 조각): 땅 높이·행렬은 지금 정하고, 메시는 세트를 불러온 뒤 붙인다 ──
  const placements = [];
  function place(piece, x, z, rot, s = 1, fixedBase = null) {
    const [L, D] = KD[piece] || PD[piece] || [4, 4], c = Math.cos(rot), sn = Math.sin(rot);
    let lo = Infinity, hi = -Infinity;
    for (const [u, v] of [[-L / 2, -D / 2], [L / 2, -D / 2], [L / 2, D / 2], [-L / 2, D / 2], [0, 0], [0, -D / 2], [0, D / 2]]) {
      const h = heightAt(x + (u * c + v * sn) * s, z + (-u * sn + v * c) * s); lo = Math.min(lo, h); hi = Math.max(hi, h);
    }
    const base = fixedBase ?? lo + Math.min(0.2, (hi - lo) * 0.5) - 0.03;   // 낮은 쪽은 기단이 땅속으로 이어진다 (가트는 밑 계단을 물높이에)
    const M = new THREE.Matrix4().compose(new THREE.Vector3(x, base, z), new THREE.Quaternion().setFromAxisAngle(_yAxis, rot), new THREE.Vector3(s, s, s));
    const p = { piece, x, z, rot, s, base, M }; placements.push(p);
    occAdd(x, z, Math.hypot(L, D) / 2 * s + 1.5);
    return p;
  }
  // 집·외딴 농가: planVillage 가 정한 자리·방향(세트 앞 +z 가 길을 본다)
  for (const h of [...layout.houses, ...layout.farms]) place(h.piece, h.x, h.z, h.rot, h.s);
  // 정한 자리 큰 조각 (요리법): 잉글랜드 교회·대장간·물레방앗간·우물 / 남아시아 사원·대장간·가트·우물·신당·큰 집·곳간
  const fixedP = {};
  for (const f of RC.fixed) { const pl = place(f.piece, f.x, f.z, f.rot, 1, f.base === 'water' ? WATER_Y + 1.95 : null); pl.role = f.role; fixedP[f.role] = pl; }
  const smithy = fixedP.smithy, millP = fixedP.mill && fixedP.mill.piece === 'mill' ? fixedP.mill : null;
  layout.stalls.forEach((st, k) => place(RC.stall, st.x, st.z, st.rot, 0.97 + 0.03 * k));
  if (RC.awning) layout.awnings.forEach((a, k) => place(RC.awning, a.x, a.z, a.rot, 0.95 + 0.04 * (k % 3)));   // 남아시아: 천막 자리에도 좌판 조각
  occAdd(GREEN.x, GREEN.z, GREEN.r + 1);   // 장터 빈터: 나무·덤불·풀포기 없이 밟힌 땅
  // 큰 소품 자리도 풀·나무를 비운다
  for (const it of dressing.items) { const d = PD[it.p]; if (d && d[0] * d[1] * it.s * it.s > 2.5 && !/fence|wall/.test(it.p)) occAdd(it.x, it.z, Math.hypot(d[0], d[1]) / 2 * it.s * 0.8); }

  // 대장간 화덕 불빛: 처음엔 세트 값으로 어림, 세트가 오면 smithy_forge 자리로 옮긴다 (빛 개수가 안 바뀌어 셰이더를 다시 짜지 않는다)
  const forgeLight = new THREE.PointLight(0xff7a30, 40, 16, 2);
  let forgeBase = 40;            // 시각이 정하는 기준 세기 (깜박임은 이 둘레에서만)
  if (smithy && smithy.M) { forgeLight.position.set(-1.25, 1.5, -1.4).applyMatrix4(smithy.M); } else { forgeBase = 0; forgeLight.intensity = 0; }
  scene.add(forgeLight);

  // 묘지 비석 (교회 둘레, 코드 도형). 돌담은 소품 세트 stone_wall 조각 (dressVillage)
  function buildGraveyard() {
    const C = CHURCH, yard = CHURCHYARD;
    const rr = rng(77);
    for (let n = 0; n < 46; n++) {
      const x = lerp(yard.x0 + 2, yard.x1 - 2, rr()), z = lerp(yard.z0 + 2, yard.z1 - 2, rr());
      if (Math.abs(x - C.x) < 20 && Math.abs(z - C.z) < 9) continue;
      const g = boxGeo(0.55, 0.9 + rr() * 0.4, 0.14, 1);
      g.rotateZ((rr() - 0.5) * 0.15); g.rotateX((rr() - 0.5) * 0.2); g.rotateY(Math.PI / 2 + (rr() - 0.5) * 0.3);
      g.translate(x, heightAt(x, z) + 0.3, z); add('church', g);
    }
  }
  if (RC.graveyard) buildGraveyard();

  // 돌다리 (아치 하나)
  function buildBridge() {
    const B = BRIDGE, L = B.len, top = 2.8;
    const shape = new THREE.Shape();
    const yb = heightAt(B.x - B.dirx * L / 2, B.z - B.dirz * L / 2), ye = heightAt(B.x + B.dirx * L / 2, B.z + B.dirz * L / 2);
    shape.moveTo(-L / 2, Math.min(yb, 0) - 0.4); shape.lineTo(-L / 2 + 4.5, top); shape.lineTo(L / 2 - 4.5, top); shape.lineTo(L / 2, Math.min(ye, 0) - 0.4);
    shape.lineTo(L / 2, -3); shape.lineTo(-L / 2, -3); shape.closePath();
    const arch = new THREE.Path(); const span = 10.4, spring = WATER_Y - 0.9, crown = 1.9;
    const rad = (span * span / 4 + (crown - spring) ** 2) / (2 * (crown - spring)), cy = crown - rad;
    const a0 = Math.asin((span / 2) / rad);
    arch.moveTo(span / 2, -2.85);
    arch.lineTo(span / 2, cy + rad * Math.cos(a0));
    arch.absarc(0, cy, rad, Math.PI / 2 - a0, Math.PI / 2 + a0, false);
    arch.lineTo(-span / 2, -2.85); arch.closePath();
    shape.holes.push(arch);
    const g = new THREE.ExtrudeGeometry(shape, { depth: B.w, bevelEnabled: false, curveSegments: 18 });
    g.translate(0, 0, -B.w / 2);
    { const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.4, uv.getY(i) / 2.4); }
    // 다리 위 길(윗면·비탈)은 흙길 재질로 나눈다 (돌 상자로 보이지 않게)
    const gn = g.index ? g.toNonIndexed() : g, gp = gn.attributes.position, gnr = gn.attributes.normal, deckT = [], restT = [];
    for (let t = 0; t < gp.count; t += 3) ((gnr.getY(t) > 0.72 && gp.getY(t) > 0.3 && gp.getY(t + 1) > 0.3 && gp.getY(t + 2) > 0.3) ? deckT : restT).push(t);
    const pickTris = (ts) => { const ng = new THREE.BufferGeometry(); for (const a of ['position', 'normal', 'uv']) { const src = gn.attributes[a], k = src.itemSize, arr = new Float32Array(ts.length * 3 * k); ts.forEach((t, j) => arr.set(src.array.subarray(t * k, (t + 3) * k), j * 3 * k)); ng.setAttribute(a, new THREE.BufferAttribute(arr, k)); } return ng; };
    const list = [['stone', pickTris(restT)], ['deck', pickTris(deckT)]];
    for (const sz of [-1, 1]) {   // 난간
      const ps = new THREE.Shape(); ps.moveTo(-L / 2 + 0.8, Math.min(yb, 0) + 0.3); ps.lineTo(-L / 2 + 4.5, top + 0.9); ps.lineTo(L / 2 - 4.5, top + 0.9); ps.lineTo(L / 2 - 0.8, Math.min(ye, 0) + 0.3); ps.lineTo(L / 2 - 0.8, Math.min(ye, 0) - 0.4); ps.lineTo(L / 2 - 4.5, top - 0.1); ps.lineTo(-L / 2 + 4.5, top - 0.1); ps.lineTo(-L / 2 + 0.8, Math.min(yb, 0) - 0.4); ps.closePath();
      const pg = new THREE.ExtrudeGeometry(ps, { depth: 0.4, bevelEnabled: false }); pg.translate(0, 0, sz > 0 ? B.w / 2 - 0.4 : -B.w / 2);
      { const uv = pg.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 2.4, uv.getY(i) / 2.4); }
      list.push(['stone', pg]);
    }
    const rot = Math.atan2(-B.dirz, B.dirx);   // 로컬 x → 길 방향
    const M = placeMatrix(B.x, B.z, rot, 0);
    for (const [k, gg] of list) add(k, gg, M);
    occAdd(B.x, B.z, 12);
  }
  // 나무다리 (동아시아): 강 바닥에 박은 말뚝 넷 쌍 + 멍에 + 장선 둘 + 가로 깐 널 + 낮은 난간, 양끝 짧은 경사
  const BRT = { top: 0 };
  function buildBridgeTimber() {
    const B = BRIDGE, L = B.len, Wd = RC.camp ? 1.4 : 3.0;
    const yb = heightAt(B.x - B.dirx * L / 2, B.z - B.dirz * L / 2), ye = heightAt(B.x + B.dirx * L / 2, B.z + B.dirz * L / 2);
    const top = Math.max(yb, ye, WATER_Y + 1.45) + 0.15; BRT.top = top; BRT.yb = yb; BRT.ye = ye;
    std('bridgeWood', { map: tex('old_planks_02_diff_1k.jpg'), normalMap: tex('old_planks_02_nor_gl_1k.jpg', false), roughness: 0.9 }, [0.72, 0.64, 0.54]);
    const geo = [];
    const d0 = -L / 2 + 1.6, d1 = L / 2 - 1.6, n = Math.round((d1 - d0) / 0.32);
    if (RC.camp) {   // 농사 전 야영: 널·난간 없이 통나무 셋을 나란히 걸친 외나무다리
      for (const [z, r] of [[-0.46, 0.2], [0, 0.23], [0.46, 0.2]]) { const c = new THREE.CylinderGeometry(r, r * 1.12, d1 - d0 + 0.6, 9); c.rotateZ(Math.PI / 2); c.translate(0, top - r, z); geo.push(c); }
    } else {
      for (let k = 0; k < n; k++) { const g = boxGeo(0.29, 0.07, Wd, 1.2); g.translate(d0 + (k + 0.5) * (d1 - d0) / n, top - 0.035, 0); g.rotateX(0); geo.push(g); }
      for (const z of [-1.15, 1.15]) { const g = boxGeo(d1 - d0, 0.22, 0.18, 1.6); g.translate(0, top - 0.18, z); geo.push(g); }
    }
    for (const x of [-6.2, -2.1, 2.1, 6.2]) {
      for (const z of RC.camp ? [-0.75, 0.75] : [-1.3, 1.3]) { const c = new THREE.CylinderGeometry(0.14, 0.17, top + 3.2, 8); c.translate(x, (top - 3.2) / 2 - 0.05, z); geo.push(c); }
      const g = boxGeo(0.24, 0.22, Wd + 0.5, 1.2); g.translate(x, top - 0.36, 0); geo.push(g);
    }
    for (const z of RC.camp ? [] : [-1.45, 1.45]) {
      for (let x = d0; x <= d1 + 1e-6; x += (d1 - d0) / 8) { const g = boxGeo(0.1, 0.9, 0.1, 1.0); g.translate(x, top + 0.45, z); geo.push(g); }
      const g = boxGeo(d1 - d0, 0.08, 0.1, 1.6); g.translate(0, top + 0.86, z); geo.push(g);
    }
    for (const [sx, ys] of [[-1, yb], [1, ye]]) {   // 끝 경사 널 (땅 → 다리 위)
      const run = 2.1, drop = top - Math.min(ys, top), ang = Math.atan2(drop, run), len = Math.hypot(run, drop) + 0.2;
      const g = boxGeo(len, 0.1, Wd, 1.2); g.rotateZ(sx * -ang); g.translate(sx * (d1 + run / 2 - 0.05), (top + Math.min(ys, top)) / 2 - 0.05, 0); geo.push(g);
    }
    const M = placeMatrix(B.x, B.z, Math.atan2(-B.dirz, B.dirx), 0);
    for (const g of geo) add('bridgeWood', g.index ? g : g, M);
    occAdd(B.x, B.z, 12);
  }
  if (ENV.bridge === null) {
    // 다리 없음 (외나무다리/징검다리 또는 열린 평원)
  } else if (RC.bridge === 'timber') buildBridgeTimber(); else buildBridge();


  // 재질별 합치기
  const buildingMeshes = [];
  for (const [k, list] of Object.entries(bins)) {
    for (const g of list) { if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2)); if (!g.attributes.normal) g.computeVertexNormals(); }
    const merged = mergeGeometries(list.map((g) => { const n = new THREE.BufferGeometry(); for (const a of ['position', 'normal', 'uv']) n.setAttribute(a, g.attributes[a]); return n; }));
    const m = new THREE.Mesh(merged, mats[k]); m.castShadow = k !== 'window'; m.receiveShadow = true; scene.add(m); buildingMeshes.push(m); disposables.push(merged);
  }

  // ── 산울타리 (밭 경계를 따라 둥근 띠) ──
  const hedgeMat = fogify(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }), 'hedge');
  hedgeMat.onBeforeCompile = ((prev) => (sh, r) => {
    prev(sh, r);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vHW;').replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvHW = (modelMatrix * vec4(transformed,1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vHW;
      float hh(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
      float n3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
        return mix(mix(mix(hh(i),hh(i+vec3(1,0,0)),f.x),mix(hh(i+vec3(0,1,0)),hh(i+vec3(1,1,0)),f.x),f.y), mix(mix(hh(i+vec3(0,0,1)),hh(i+vec3(1,0,1)),f.x),mix(hh(i+vec3(0,1,1)),hh(i+vec3(1,1,1)),f.x),f.y), f.z); }`)
      .replace('#include <map_fragment>', `float lf = n3(vHW * 2.3) * 0.6 + n3(vHW * 7.1) * 0.4; diffuseColor.rgb *= 0.65 + 0.7 * lf;`)
      .replace('#include <normal_fragment_maps>', `{ vec3 e = vec3(0.35,0.,0.); float c = n3(vHW*2.3); vec3 gw = vec3(n3(vHW*2.3+e.xyy)-c, n3(vHW*2.3+e.yxy)-c, n3(vHW*2.3+e.yyx)-c) * 2.4;
        normal = normalize(normal + (viewMatrix * vec4(gw, 0.0)).xyz); }`);
  })(hedgeMat.onBeforeCompile);
  disposables.push(hedgeMat);
  const hedgeTreeSpots = [];
  function buildHedges() {
    const pos = [], col = [], idx = [];
    const PRO = [[-1, 0], [-0.95, 0.45], [-0.6, 0.85], [0, 1], [0.6, 0.85], [0.95, 0.45], [1, 0]];   // 단면
    const hc = P.hedgeColor;
    const addStrip = (ax, az, bx, bz, seed) => {
      const L = Math.hypot(bx - ax, bz - az); if (L < 6) return;
      const dx = (bx - ax) / L, dz = (bz - az) / L, nx = -dz, nz = dx;
      const n = Math.max(2, Math.ceil(L / 2.2)), base = pos.length / 3;
      const r = rng(seed);
      const H0 = 2.4 + r() * 1.4, W0 = 1.5 + r() * 1.0;
      for (let k = 0; k <= n; k++) {
        const t = k / n, x = ax + (bx - ax) * t, z = az + (bz - az) * t;
        const wob = fbm(x / 6, z / 6, 2, seed % 97), hgt = H0 * (0.8 + 0.4 * wob) * Math.min(1, Math.min(t, 1 - t) * L / 2.5 + 0.25), wid = W0 * (0.85 + 0.3 * wob);
        const y = heightAt(x, z) - 0.15;
        for (const [px, py] of PRO) {
          pos.push(x + nx * px * wid, y + py * hgt, z + nz * px * wid);
          const v = 0.75 + 0.5 * hash2(k, Math.round(px * 7), seed);
          col.push(hc[0] * v * (0.9 + 0.2 * py), hc[1] * v, hc[2] * v);
        }
      }
      const m = PRO.length;
      for (let k = 0; k < n; k++) for (let q = 0; q < m - 1; q++) { const a = base + k * m + q, b = a + m; idx.push(a, b, a + 1, a + 1, b, b + 1); }
    };
    let edges = 0;
    for (let j = 0; j < FN; j++) for (let i = 0; i < FN; i++) for (const dir of [0, 1]) {
      const a = gp[j][i], b = dir === 0 ? gp[j][i + 1] : gp[j + 1][i];
      const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, dc = Math.hypot(mx - VC.x, mz - VC.z);
      if (dc > 1500 || !hedgeOn(i, j, dir)) continue;
      if (RC.hedge ? hash2(i, j, 91 + dir) > RC.hedge.keep : LD.hedges < 1 && hash2(i, j, 91 + dir) > LD.hedges) continue;   // 요리법 두렁(남아시아: 띠 없이 두렁 나무만) · 아니면 땅 모습(마른 땅·초원·논은 산울타리가 드물다)
      const t1 = fieldType(i, j), t2 = dir === 0 ? (j > 0 ? fieldType(i, j - 1) : 1) : (i > 0 ? fieldType(i - 1, j) : 1);
      if (t1 === 0 && t2 === 0) continue;
      // 길·강·건물에 걸리면 그 부분은 끊는다
      const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3); let runStart = null;
      for (let k = 0; k <= n; k++) {
        const t = k / n, x = lerp(a[0], b[0], t), z = lerp(a[1], b[1], t);
        const blocked = k === n || roadIdx.edge(x, z) < 2.5 || riverIdx.edge(x, z) < RIVER_HW + 5 || occHit(x, z) || hash2(Math.floor(x / 9), Math.floor(z / 9), 31) < 0.05;
        if (!blocked && runStart === null) runStart = [x, z];
        if (blocked && runStart) { if (!RC.hedge || RC.hedge.strips) { addStrip(runStart[0], runStart[1], x, z, i * 131 + j * 7 + dir); edges++; } runStart = null; }
      }
      // 산울타리 나무 자리
      const r = rng(i * 991 + j * 37 + dir);
      // 산울타리 나무는 한두세 그루씩 무리 지어 (줄지어 선 점박이가 아니라 덩어리로)
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]); let s = 4 + r() * 14; const dense = r() < 0.5;
      while (s < L - 4) {
        const n = 1 + (r() < 0.5 ? 1 + (r() < 0.4 ? 1 : 0) : 0);
        for (let q = 0; q < n; q++) {
          const ss = s + q * (3.5 + r() * 3); if (ss > L - 3) break;
          const x = lerp(a[0], b[0], ss / L) + (r() - 0.5) * 2.4, z = lerp(a[1], b[1], ss / L) + (r() - 0.5) * 2.4;
          if (roadIdx.edge(x, z) > 5 && riverIdx.edge(x, z) > RIVER_HW + 4) hedgeTreeSpots.push([x, z, r()]);
        }
        s += dense ? 8 + r() * 12 : 18 + r() * 34;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, hedgeMat); m.castShadow = true; m.receiveShadow = true; scene.add(m); disposables.push(g);
    return { mesh: m, edges, tris: idx.length / 3 };
  }
  let tq = performance.now();
  const hedges = buildHedges(); times.hedges = Math.round(performance.now() - tq); tq = performance.now();

  // ── 풀포기 (마을 둘레, 1번 층) ──
  function buildGrass() {
    const blade = grassBladeTex(); disposables.push(blade);
    const q = [];
    for (let k = 0; k < 3; k++) { const p = new THREE.PlaneGeometry(1, 1); p.translate(0, 0.5, 0); p.rotateY(k * Math.PI / 3); q.push(p); }
    const geo = mergeGeometries(q); const nrm = geo.attributes.normal; for (let i = 0; i < nrm.count; i++) nrm.setXYZ(i, 0, 1, 0);
    const mat = fogify(new THREE.MeshStandardMaterial({ map: blade, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 1, color: new THREE.Color(0.95 * LD.tuft[0], 1.0 * LD.tuft[1], 0.7 * LD.tuft[2]) }), 'grass');
    const GU = { uTime: { value: 0 } };
    mat.onBeforeCompile = ((prev) => (sh, r) => { prev(sh, r); sh.uniforms.uTime = GU.uTime;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].z * 0.23;
          transformed.x += sin(uTime * 1.7 + ph) * 0.08 * uv.y; transformed.z += cos(uTime * 1.3 + ph) * 0.06 * uv.y;`);
      sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace('normal *= faceDirection;', ''));
    })(mat.onBeforeCompile);
    const isNormal = quality === 'normal';
    const baseTarget = isNormal ? 45000 : 75000;
    const BASE = Math.round(baseTarget * Math.min(1.3, LD.tufts)), COUNT = BASE + (isNormal ? 15000 : 25000);
    const scaleMul = isNormal ? 1.35 : 1.25;
    const im = new THREE.InstancedMesh(geo, mat, COUNT), r = rng(4), m4 = new THREE.Matrix4(), c = new THREE.Color();
    let n = 0, tries = 0, maxTries = BASE * 3;
    while (n < BASE && tries < maxTries) {
      tries++;
      // 절반 남짓은 마을·풀밭 가까이(95 m 안)에 촘촘히
      const ang = r() * Math.PI * 2, rad = r() < 0.55 ? Math.sqrt(r()) * 95 : Math.sqrt(r()) * 190, x = VC.x - 30 + Math.cos(ang) * rad * 1.15, z = VC.z + 40 + Math.sin(ang) * rad;
      if (riverIdx.edge(x, z) < RIVER_HW - 0.5) continue;
      if (roadIdx.edge(x, z) < 0.6) continue;
      if (occHit(x, z, -2)) continue;
      const cell = findCell(x, z); if (cell && (cellType ? cellType[cell.j * FN + cell.i] : fieldType(cell.i, cell.j)) === 3 && cell.edge > 5) continue;
      // 풀 밀도를 잡음으로 묶는다: 고르게 흩어진 점박이 대신 덤불진 곳과 성긴 곳
      const dens = 0.5 + 0.5 * fbm(x / 13, z / 13, 3, 21);
      if (r() > 0.25 + 0.75 * smooth(0.3, 0.7, dens)) continue;
      const s = (0.13 + r() * 0.22) * (0.75 + 0.6 * dens) * scaleMul;   // 작고 촘촘한 포기 (뭉친 곳은 크게)
      m4.compose(_v1.set(x, heightAt(x, z) - 0.04, z), _q.setFromAxisAngle(_v2.set(0, 1, 0), r() * 6.28), _s.set(s * 1.3, s, s * 1.3));
      im.setMatrixAt(n, m4); c.setRGB(0.85 + r() * 0.25, 0.9 + r() * 0.2, 0.75 + r() * 0.25); im.setColorAt(n, c); n++;
    }
    // 키 큰 풀 무더기: 울타리 밑·담 밑·뒤뜰 구석·집 뒤 (dressVillage 의 tall)
    for (const [cx, cz, cr] of dressing.tall) {
      const k = Math.round(10 + cr * 22);
      for (let q = 0; q < k && n < COUNT; q++) {
        const a = r() * Math.PI * 2, d = Math.sqrt(r()) * cr, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d;
        if (roadIdx.edge(x, z) < 0.3) continue;
        const s = (0.5 + r() * 0.45) * (1 - 0.35 * d / cr) * scaleMul;
        m4.compose(_v1.set(x, heightAt(x, z) - 0.04, z), _q.setFromAxisAngle(_v2.set(0, 1, 0), r() * 6.28), _s.set(s * 1.1, s * 1.45, s * 1.1));
        im.setMatrixAt(n, m4); c.setRGB(0.88 + r() * 0.3, 0.86 + r() * 0.2, 0.55 + r() * 0.25); im.setColorAt(n, c); n++;
      }
    }
    im.count = n; im.receiveShadow = true; im.layers.set(1); scene.add(im);
    // 들꽃 포기: 키 큰 풀 무더기 둘레와 풀밭 군데군데 (잡음이 높은 곳에 무리 지어)
    const ftex = flowerTex(); disposables.push(ftex);
    const fmat = mat.clone(); fmat.map = ftex; fmat.color = new THREE.Color(1, 1, 1); fmat.onBeforeCompile = mat.onBeforeCompile; fmat.customProgramCacheKey = mat.customProgramCacheKey; disposables.push(fmat);
    const FC = Math.max(200, Math.round((isNormal ? 8000 : 14000) * LD.flowers)), fl = new THREE.InstancedMesh(geo, fmat, FC); let fn = 0;
    const flower = (x, z, s) => { if (fn >= FC || riverIdx.edge(x, z) < RIVER_HW || roadIdx.edge(x, z) < 0.4) return;
      m4.compose(_v1.set(x, heightAt(x, z) - 0.03, z), _q.setFromAxisAngle(_v2.set(0, 1, 0), r() * 6.28), _s.set(s * 1.1, s, s * 1.1)); fl.setMatrixAt(fn++, m4); };
    for (const [cx, cz, cr] of dressing.tall) if (r() < 0.55) for (let q = 0, k = 4 + Math.floor(r() * 9); q < k; q++) { const a = r() * 6.28, d = cr * (0.6 + r() * 0.8); flower(cx + Math.cos(a) * d, cz + Math.sin(a) * d, 0.32 + r() * 0.3); }
    for (let t = 0; t < 15000 && fn < FC; t++) {
      const ang = r() * Math.PI * 2, rad = Math.sqrt(r()) * 200, x = VC.x - 30 + Math.cos(ang) * rad * 1.15, z = VC.z + 40 + Math.sin(ang) * rad;
      if (fbm(x / 22, z / 22, 2, 33) < 0.18 || occHit(x, z, -1)) continue;
      const cell = findCell(x, z); if (cell && (cellType ? cellType[cell.j * FN + cell.i] : fieldType(cell.i, cell.j)) > 1 && cell.edge > 5) continue;
      flower(x, z, 0.26 + r() * 0.26);
    }
    fl.count = fn; fl.receiveShadow = true; fl.layers.set(1); scene.add(fl);
    // 갈대: 물가를 따라 키 큰 포기
    const reedN = isNormal ? 3500 : 5000, reeds = new THREE.InstancedMesh(geo, mat, reedN); let rn = 0;
    for (let k = 0; k < RIVER.length - 1 && rn < reedN; k++) {
      const [x0, z0] = RIVER[k]; if (Math.hypot(x0 - VC.x, z0 - VC.z) > 650) continue;
      const [x1, z1] = RIVER[k + 1], Lg = Math.hypot(x1 - x0, z1 - z0) || 1;
      for (let q = 0; q < 9 && rn < reedN; q++) {
        if (r() < 0.35) continue;
        const side = r() < 0.5 ? -1 : 1, off = RIVER_HW * (0.78 + r() * 0.3), t = r();
        const x = lerp(x0, x1, t) - (z1 - z0) / Lg * side * off, z = lerp(z0, z1, t) + (x1 - x0) / Lg * side * off;
        if (roadIdx.edge(x, z) < 1 || Math.hypot(x - BRIDGE.x, z - BRIDGE.z) < 9) continue;
        const sc = 0.7 + r() * 0.9;
        m4.compose(_v1.set(x, heightAt(x, z) - 0.05, z), _q.setFromAxisAngle(_v2.set(0, 1, 0), r() * 6.28), _s.set(sc * 0.9, sc * 1.9, sc * 0.9));
        reeds.setMatrixAt(rn, m4); c.setRGB(0.95 + r() * 0.2, 0.92 + r() * 0.15, 0.55 + r() * 0.2); reeds.setColorAt(rn, c); rn++;
      }
    }
    reeds.count = rn; reeds.receiveShadow = true; reeds.layers.set(1); scene.add(reeds);
    disposables.push(geo, mat);
    updaters.push((dt, t) => { GU.uTime.value = t; });
    return { count: n, flowers: fn };
  }
  // 풀포기(16만 포기 자리 고르기, 0.5초 남짓)는 다음 일거리로 미룬다: 장면 짓기의 한 덩어리 멈춤을 줄인다 (ready 첫머리)
  let grass = { count: 0, flowers: 0 };
  times.sync = Math.round(performance.now() - TB);


  // ── 굴뚝 연기 ──
  const smokeT = smokeTex(); disposables.push(smokeT);
  const smokeMat = fogify(new THREE.SpriteMaterial({ map: smokeT, transparent: true, depthWrite: false, color: 0xd8d4cc, opacity: 0.2 }));
  const smokeCol = new THREE.Color(0.8, 0.79, 0.76);
  disposables.push(smokeMat);
  const puffs = [];
  function addSmoke(c) { for (let k = 0; k < 7; k++) { const s = new THREE.Sprite(smokeMat.clone()); s.material.color = smokeCol; s.material.rotation = k * 1.7; s.userData = { c, ph: k / 7 }; scene.add(s); puffs.push(s); disposables.push(s.material); } }
  updaters.push((dt, t) => {
    for (const s of puffs) {
      const a = (t * 0.05 + s.userData.ph) % 1, c = s.userData.c;
      s.position.set(c.x + a * 9 + Math.sin(t * 0.4 + s.userData.ph * 9) * 0.6, c.y + a * 9, c.z - a * 3.5);
      const sc = 1.2 + a * 7; s.scale.set(sc, sc, 1);
      s.material.opacity = 0.16 * Math.sin(a * Math.PI) * (1 - a * 0.5);
    }
  });

  // ── 나무 (ez-tree, MIT): 종 7가지(참나무 둘·물푸레·버드나무·자작·산사·사과) + 덤불. 가까운 것은 실제 메시 인스턴스(크기·색·기울기 변주),
  //    먼 것은 종마다 8방향에서 구운 빌보드(색 + 나무 좌표 노멀 → 해 방향으로 다시 비춘다) ──
  const treeInfo = { near: 0, far: 0, tris: 0, ok: false, err: null, species: {} };
  const treeU = TREEU;   // 나무 재질은 장면 사이에 함께 쓰므로 유니폼도 모듈 하나 (한 번에 한 장면만 그린다)
  updaters.push((dt, t) => { treeU.uTime.value = t; });
  async function buildTrees() {
    const TK = await treeKit(renderer, TREE_KEY, P);   // 땅 모습 × 세트마다 한 번 만든 나무 세트를 생 사이에 함께 쓴다
    await nextTask();
    if (state.disposed) return;
    const kit = [...TK.trees], bushKit = TK.bushes;
    const bySp = {}; kit.forEach((k, i) => { (bySp[k.def.sp] ||= []).push(i); });
    const rr = rng(2024);
    // 땅 모습의 나무 종 무게(LD.mix): 무게 1 이상인 종은 반쯤 그대로 두고, 나머지는 무게대로 다시 고른다
    // 같은 규칙(숲·강가·산울타리 나무)이 쓰는 잉글랜드 종 이름 → 이 세트의 종 (kitdata.js TREE_SWAP_SA)
    const swap = (sp) => (KS.treeSwap && KS.treeSwap[sp]) || sp;
    const MIX = (FLV && FLV.treeMix) || (KS.treeMix ? (KS.treeMix[opts.land] || KS.treeMix.monsoon) : LD.mix);   // 남아시아: 땅 모습마다, 동아시아: 땅 갈래마다 따로 정한 종 무게
    const mixList = MIX ? Object.entries(MIX).filter(([s]) => bySp[s]) : null, mixSum = mixList ? mixList.reduce((s, [, w]) => s + w, 0) : 0;
    const landSp = (sp) => {
      sp = swap(sp);
      if (!mixList || !mixSum || ((MIX[sp] || 0) >= 1 && rr() < 0.5)) return sp;
      let x = rr() * mixSum; for (const [s, w] of mixList) { x -= w; if (x < 0) return s; } return mixList[0][0];
    };
    const pick = (sp) => { const a = bySp[landSp(sp)] || bySp[swap(sp)] || bySp.oak || bySp.mango || bySp.zelkova || bySp.palm_date_tall || Object.values(bySp)[0]; return a ? a[Math.floor(rr() * a.length)] : 0; };
    const dens = LD.trees, keep = () => dens >= 1 || rr() < dens;   // 땅 모습의 나무 수 배수
    // 자리: [x, z, 크기, 돌림, 변형, 기울기x, 기울기z]
    const spots = [];
    const free = (x, z, rad) => roadIdx.edge(x, z) > rad * 0.5 + 1.5 && riverIdx.edge(x, z) > RIVER_HW + 1 && !occHit(x, z, rad * 0.4) && !inRect(VIEW_CLEAR, x, z);
    const lean = () => [(rr() - 0.5) * 0.08, (rr() - 0.5) * 0.08];
    // 마을 꾸미기 규칙이 정한 나무 (사과·버드나무·참나무·물푸레·자작·산사). 나무가 드문 땅도 마을 안 나무는 반 남짓 남긴다
    // 꾸미기 규칙이 정한 종은 그대로 (남아시아: 반얀 신당·야자·바나나·사원 님 …). 잉글랜드는 땅 모습 무게로 다시 고르기도 한다
    const pickD = (sp) => (KIT !== 'england' && bySp[sp] ? bySp[sp][Math.floor(rr() * bySp[sp].length)] : pick(sp));
    for (const t of dressing.trees) if (dens >= 1 || rr() < 0.35 + 0.65 * dens) spots.push([t.x, t.z, t.s, rr() * 6.28, pickD(t.sp), t.lean[0], t.lean[1]]);
    // 공유지 가장자리 (마을 둘레 110~200 m)
    for (let k = 0, n = 0; k < 160 * Math.max(1, dens) && n < 26 * dens; k++) {
      const a = rr() * 6.28, rad = 110 + rr() * 90, x = VC.x - 10 + Math.cos(a) * rad * 1.15, z = VC.z + 10 + Math.sin(a) * rad;
      if (!free(x, z, 6)) continue;
      const cell = findCell(x, z); if (cell && fieldType(cell.i, cell.j) > 1 && cell.edge > 8) continue;
      spots.push([x, z, 0.75 + rr() * 0.45, rr() * 6.28, pick(rr() < 0.5 ? 'oak' : rr() < 0.6 ? 'ash' : 'birch'), ...lean()]); n++;
    }
    // 마을 밖 강가 (버드나무·물푸레·자작)
    for (let k = 0; k < RIVER.length; k += 3) {
      const [x0, z0] = RIVER[k]; const d = Math.hypot(x0 - VC.x, z0 - VC.z); if (d < 420 || d > 2200 || rr() < 0.3) continue;
      const side = rr() < 0.5 ? -1 : 1, [x1, z1] = RIVER[Math.min(k + 1, RIVER.length - 1)], L = Math.hypot(x1 - x0, z1 - z0) || 1, off = RIVER_HW + 3 + rr() * 6;
      const x = x0 - (z1 - z0) / L * side * off, z = z0 + (x1 - x0) / L * side * off;
      if (free(x, z, 5) && keep()) spots.push([x, z, 0.8 + rr() * 0.35, rr() * 6.28, pick(rr() < 0.55 ? 'willow' : rr() < 0.6 ? 'ash' : 'birch'), ...lean()]);
    }
    // 산울타리 나무 (참나무·물푸레·산사·자작)
    for (const [x, z, r0] of hedgeTreeSpots) if (Math.hypot(x - VC.x, z - VC.z) < 2600 && free(x, z, 4) && keep()) {
      const sp = RC.hedge ? RC.hedge.pick(r0)   // 요리법 두렁 나무 (남아시아: 야자·망고·바불·님)
        : r0 < 0.4 ? 'oak' : r0 < 0.62 ? 'ash' : r0 < 0.9 ? 'hawthorn' : 'birch';
      spots.push([x, z, (sp === 'hawthorn' || sp === 'babul' ? 0.9 : 0.8) + r0 * 0.45, r0 * 40, pick(sp), ...lean()]);
    }
    // 언덕 위 작은 숲: 숲마다 주된 종 하나 + 섞임, 촘촘하게 (둥근 점이 아니라 덩어리로 읽히게)
    // 숲 수 = 땅 모습 배수 × 화질(보통은 먼 숲을 덜)
    for (let c = 0, nc = Math.round(52 * Math.min(1.3, dens) * QL.forest); c < nc; c++) {
      const a = rr() * 6.28, d = 300 + rr() * 2600, cx = VC.x + Math.cos(a) * d, cz = VC.z + Math.sin(a) * d * 0.9 - 200;
      if (cz > VC.z + 500 && Math.abs(cx - VC.x) < 500) continue;
      const main = landSp(['oak', 'oak', 'ash', 'birch'][Math.floor(rr() * 4)]);
      const n = Math.round((12 + Math.floor(rr() * 34)) * Math.min(1.25, Math.max(0.5, dens))), R0 = 30 + rr() * 70;
      for (let k = 0; k < n; k++) {
        const u = rr() * 6.28, q = Math.sqrt(rr()), x = cx + Math.cos(u) * q * R0, z = cz + Math.sin(u) * q * R0 * 0.8;
        if (free(x, z, 4)) spots.push([x, z, 0.8 + rr() * 0.55, rr() * 6.28, pick(rr() < 0.7 ? main : ['oak', 'ash', 'birch', 'hawthorn'][Math.floor(rr() * 4)]), ...lean()]);
      }
    }
    // 가까운 것 / 먼 것 나누기. 가까운 것은 다시 묶음으로 나눠 InstancedMesh 마다 경계 구가 작게 (화면·그림자·물 반사 밖이면 안 그린다):
    //   안쪽 고리(그림자 드리움) / 바깥 고리(그림자 없음) × 강가 60 m 안(물 반사 0번 층) / 밖(1번 층) × 네 쪽
    const NEAR_R = opts.treeNear ?? QL.treeNear, SHADOW_R = Math.min(150, NEAR_R);
    const groups = new Map(), farList = [];
    for (const s of spots) {
      const dx = s[0] - VC.x, dz = s[1] - VC.z, d = Math.hypot(dx, dz);
      if (d >= NEAR_R) { farList.push(s); continue; }
      const key = [s[4], d < SHADOW_R ? 1 : 0, riverIdx.edge(s[0], s[1]) < 60 ? 0 : 1, (dx > 0 ? 1 : 0) + (dz > 0 ? 2 : 0)].join(':');
      let g = groups.get(key); if (!g) groups.set(key, g = []); g.push(s);
    }
    const m4 = new THREE.Matrix4(), e = new THREE.Euler(), col = new THREE.Color(), tr = rng(77);
    treeInfo.groups = groups.size;
    for (const [key, list] of groups) {
      const [vi, shadow, layer] = key.split(':').map(Number), k = kit[vi];
      const ib = new THREE.InstancedMesh(k.bGeo, k.bark, list.length), il = new THREE.InstancedMesh(k.lGeo, k.leaf, list.length);
      list.forEach(([x, z, sc, ry, , lx, lz], n) => {
        m4.compose(_v1.set(x, heightAt(x, z) - 0.2, z), _q.setFromEuler(e.set(lx, ry, lz, 'YXZ')), _s.set(sc, sc * (0.9 + 0.2 * ((n * 0.618) % 1)), sc));
        ib.setMatrixAt(n, m4); il.setMatrixAt(n, m4);
        const b = 0.86 + tr() * 0.26; col.setRGB(b * (0.96 + tr() * 0.08), b * (0.97 + tr() * 0.06), b * (0.9 + tr() * 0.16)); il.setColorAt(n, col);
      });
      for (const im of [ib, il]) { im.castShadow = !!shadow; im.receiveShadow = true; im.layers.set(layer); im.computeBoundingSphere(); scene.add(im); }
      il.customDepthMaterial = k.depth;
      treeInfo.near += list.length;
      treeInfo.species[k.def.sp] = (treeInfo.species[k.def.sp] || 0) + list.length;
      treeInfo.tris += list.length * ((k.bGeo.index ? k.bGeo.index.count : k.bGeo.attributes.position.count) + k.lGeo.index.count) / 3;
    }
    // 덤불: 집 둘레, 길가, 물가 (가까운 곳만, 실제 메시)
    const bspots = bushKit.map(() => []);
    const pushB = (x, z, sc) => { const v = Math.floor(rr() * bushKit.length); if (Math.hypot(x - GREEN.x, z - GREEN.z) < GREEN.r + 6) return; bspots[v].push([x, z, sc, rr() * 6.28]); };   // 장터 둘레는 비운다
    for (const [x, z, sc] of dressing.bushes) pushB(x, z, sc);   // 전경 비탈 덤불 (꾸미기 규칙)
    for (const h of layout.houses) {
      const n = 2 + Math.floor(rr() * 3);
      for (let k = 0; k < n; k++) {
        const side = Math.floor(rr() * 4), u = side < 2 ? (side ? 1 : -1) * (h.L / 2 + 1.0 + rr() * 1.5) : (rr() - 0.5) * h.L, v = side >= 2 ? (side === 2 ? 1 : -1) * (h.D / 2 + 1.0 + rr() * 1.5) : (rr() - 0.5) * h.D;
        const [x, z] = obbLocal(h.foot, u, v);
        if (roadIdx.edge(x, z) > 0.8 && riverIdx.edge(x, z) > RIVER_HW && !occHit(x, z, -1)) pushB(x, z, 0.7 + rr() * 0.6);
      }
    }
    for (const L of roadLines) for (let k = 0; k < L.pts.length; k += 2) {
      const [x0, z0] = L.pts[k]; if (Math.hypot(x0 - VC.x, z0 - VC.z) > 260 || rr() > 0.32) continue;
      const [x1, z1] = L.pts[Math.min(k + 1, L.pts.length - 1)], Lg = Math.hypot(x1 - x0, z1 - z0) || 1, side = rr() < 0.5 ? -1 : 1, off = L.w / 2 + 1.8 + rr() * 3;
      const x = x0 - (z1 - z0) / Lg * side * off, z = z0 + (x1 - x0) / Lg * side * off;
      if (roadIdx.edge(x, z) > 1 && riverIdx.edge(x, z) > RIVER_HW && !occHit(x, z, -2)) pushB(x, z, 0.9 + rr() * 0.9);
    }
    for (let k = 0; k < RIVER.length - 1; k++) {   // 다리 둘레 물가는 양쪽에 덤불을 더 (전경)
      const [x0, z0] = RIVER[k]; if (Math.hypot(x0 - BRIDGE.x, z0 - BRIDGE.z) > 110) continue;
      const [x1, z1] = RIVER[k + 1], Lg = Math.hypot(x1 - x0, z1 - z0) || 1;
      for (const side of [-1, 1]) {
        if (rr() > 0.6) continue;
        const off = RIVER_HW + 1.5 + rr() * 5, x = x0 - (z1 - z0) / Lg * side * off, z = z0 + (x1 - x0) / Lg * side * off;
        if (roadIdx.edge(x, z) > 1.5 && Math.hypot(x - BRIDGE.x, z - BRIDGE.z) > 10 && !occHit(x, z, -3)) pushB(x, z, 0.8 + rr() * 0.9);
      }
    }
    for (let k = 0; k < RIVER.length - 1; k++) {
      const [x0, z0] = RIVER[k]; if (Math.hypot(x0 - VC.x, z0 - VC.z) > 420 || rr() > 0.55) continue;
      const [x1, z1] = RIVER[k + 1], Lg = Math.hypot(x1 - x0, z1 - z0) || 1, side = rr() < 0.5 ? -1 : 1, off = RIVER_HW + 0.3 + rr() * 3.5;
      const x = x0 - (z1 - z0) / Lg * side * off, z = z0 + (x1 - x0) / Lg * side * off;
      if (roadIdx.edge(x, z) > 1.5 && !occHit(x, z, -3)) pushB(x, z, 1.0 + rr() * 1.0);
    }
    bushKit.forEach((k, vi) => {
      const list = bspots[vi]; if (!list.length) return;
      const ib = new THREE.InstancedMesh(k.bGeo, k.bark, list.length), il = new THREE.InstancedMesh(k.lGeo, k.leaf, list.length);
      list.forEach(([x, z, sc, ry], n) => { m4.compose(_v1.set(x, heightAt(x, z) - 0.15, z), _q.setFromAxisAngle(_v2.set(0, 1, 0), ry), _s.set(sc, sc, sc)); ib.setMatrixAt(n, m4); il.setMatrixAt(n, m4); });
      for (const im of [ib, il]) { im.castShadow = true; im.receiveShadow = true; im.layers.set(1); im.computeBoundingSphere(); scene.add(im); }
      il.customDepthMaterial = k.depth;
      treeInfo.bushes = (treeInfo.bushes || 0) + list.length;
      treeInfo.tris += list.length * (k.bGeo.index.count + k.lGeo.index.count) / 3;
    });
    const { albRT, nrmRT, sizes, NV } = TK.bake;
    const quad = new THREE.PlaneGeometry(1, 1); quad.translate(0, 0.5, 0);
    const ig = new THREE.InstancedBufferGeometry(); ig.index = quad.index; ig.attributes.position = quad.attributes.position; ig.attributes.uv = quad.attributes.uv;
    const off = new Float32Array(farList.length * 4), par = new Float32Array(farList.length * 4);
    farList.forEach(([x, z, sc, ry, v], n) => {
      const [S, y0] = sizes[v];
      off.set([x, heightAt(x, z) - 0.4 + y0 * sc, z, v], n * 4);
      par.set([S * sc, ry, 0.86 + tr() * 0.26, 0], n * 4);
    });
    ig.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4)); ig.setAttribute('aPar', new THREE.InstancedBufferAttribute(par, 4)); ig.instanceCount = farList.length;
    const bbMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { tAlb: { value: null }, tNrm: { value: null }, uNV: { value: NV } }]),
      vertexShader: `attribute vec4 aOff; attribute vec4 aPar; varying vec2 vUv; varying float vRow; varying float vCol; varying float vYaw; varying float vTint;
        #include <fog_pars_vertex>
        void main(){
          vec3 toCam = cameraPosition - aOff.xyz;
          float c = cos(aPar.y), s = sin(aPar.y);
          float phi = atan(c * toCam.x - s * toCam.z, s * toCam.x + c * toCam.z);   // 나무 좌표에서 본 카메라 방위
          vCol = mod(floor(phi / 0.7853982 + 0.5), 8.0);
          vec3 right = normalize(vec3(viewMatrix[0][0], 0.0, viewMatrix[2][0]));
          vec3 wpos = aOff.xyz + right * position.x * aPar.x + vec3(0.0, 1.0, 0.0) * position.y * aPar.x;
          vec4 mvPosition = viewMatrix * vec4(wpos, 1.0);
          gl_Position = projectionMatrix * mvPosition; vUv = uv; vRow = aOff.w; vYaw = aPar.y; vTint = aPar.z;
          #include <fog_vertex>
        }`,
      fragmentShader: `uniform sampler2D tAlb; uniform sampler2D tNrm; uniform float uNV; uniform vec3 uSunC; uniform vec3 uAmbC; uniform vec3 uSunDir;
        varying vec2 vUv; varying float vRow; varying float vCol; varying float vYaw; varying float vTint;
        #include <common>
        #include <fog_pars_fragment>
        void main(){
          vec2 uv = vec2((vCol + clamp(vUv.x, 0.004, 0.996)) / 8.0, (vRow + clamp(vUv.y, 0.004, 0.996)) / uNV);
          vec4 a = texture2D(tAlb, uv);
          if (a.a < 0.5) discard;
          vec3 alb = a.rgb / max(a.a, 1e-3);
          vec4 q = texture2D(tNrm, uv);
          vec3 nl = normalize(q.rgb / max(q.a, 1e-3) * 2.0 - 1.0);
          float c = cos(vYaw), s = sin(vYaw);
          vec3 n = vec3(c * nl.x + s * nl.z, nl.y, -s * nl.x + c * nl.z);
          float dif = max(dot(n, uSunDir), 0.0);
          vec3 col = alb * vTint * (uAmbC * (0.62 + 0.38 * n.y) + uSunC * (dif * 1.05 + 0.12));
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
          #include <fog_fragment>
        }`,
      fog: true,
    });
    Object.assign(bbMat.uniforms, FOGU, { uSunC: treeU.uSunCol, uAmbC: treeU.uAmb, uSunDir: FOGU.uFogSunDir });
    bbMat.uniforms.tAlb.value = albRT.texture; bbMat.uniforms.tNrm.value = nrmRT.texture;
    const bbMesh = new THREE.Mesh(ig, bbMat); bbMesh.frustumCulled = false; scene.add(bbMesh);
    disposables.push(quad, ig, bbMat);
    treeInfo.far = farList.length; treeInfo.variants = NV; treeInfo.ok = true;
  }

  // ── 건물: Blender 세트 조각을 자리마다 놓고 재질별로 합친다 (그리기 횟수 = 재질 수) ──
  const kitInfo = { ok: false, err: null, placed: 0, tris: 0, draws: 0, pieces: {} };
  const KITU = { uAODirect: { value: 0.45 } };     // 구운 AO 를 해빛(직사광)에도 이만큼 (그림자 지도가 못 잡는 맞닿은 곳 그늘)
  const glowMats = [], coalMats = [], paperMats = [];
  const matClones = new Map();   // 캐시된 세트 원본 재질 → 이 장면의 복제본
  let wheel = null;
  const kitMeshes = [];
  const aniso = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  function kitMaterial(src) {
    if (matClones.has(src)) return matClones.get(src);
    const m = src.clone(); matClones.set(src, m);   // 텍스처는 원본과 함께 쓴다 (재질 dispose 는 텍스처를 지우지 않는다)
    const t = KIT_TINT[m.name]; if (t) m.color.multiply(new THREE.Color(...t));
    for (const tx of [m.map, m.normalMap, m.aoMap]) if (tx) tx.anisotropy = aniso;
    if (m.name === 'glass') { m.emissive.setRGB(1.0, 0.55, 0.22); m.emissiveIntensity = 0; glowMats.push(m); }
    if (m.name === 'coals') { m.emissive.setRGB(1.0, 0.36, 0.08); coalMats.push(m); }
    if (m.name === 'paper') { m.emissive.setRGB(1.0, 0.7, 0.4); m.emissiveIntensity = 0; paperMats.push(m); }   // 창호지·쇼지: 밤에 안쪽 불빛이 은은히 비친다
    fogify(m);
    const prev = m.onBeforeCompile;
    m.onBeforeCompile = (sh, r) => {
      prev.call(m, sh, r); sh.uniforms.uAODirect = KITU.uAODirect;
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uAODirect;')
        .replace('#include <aomap_fragment>', '#include <aomap_fragment>\n#ifdef USE_AOMAP\n  reflectedLight.directDiffuse *= mix(1.0, ambientOcclusion, uAODirect);\n#endif');
    };
    m.customProgramCacheKey = () => 'kit';
    disposables.push(m);
    return m;
  }
  function applyGlow() {
    for (const m of glowMats) m.emissiveIntensity = 2.2 * (state.dusk ?? 0);
    for (const m of coalMats) m.emissiveIntensity = 6 + 10 * (state.dusk ?? 0);
    for (const m of paperMats) m.emissiveIntensity = 0.55 * (state.dusk ?? 0);
  }
  // 합친 메시를 몇 덩어리로 나눠 화면 밖 덩어리는 그리지 않게 한다: 마을 안 네 쪽 + 먼 농가
  const chunkOf = (pl) => (Math.hypot(pl.x - VC.x, pl.z - VC.z) > 170 ? 'far' : (pl.x > 20 ? 'e' : 'w') + (pl.z > -40 ? 's' : 'n'));
  async function buildKit() {
    const kit = await loadKit(KIT_URL_S);
    await nextTask();
    if (state.disposed) return;
    const chunks = new Map(), _m = new THREE.Matrix4(), _p = new THREE.Vector3();
    let pCount = 0;
    for (const pl of placements) {
      if (++pCount % 6 === 0) await nextTask();
      if (state.disposed) return;
      const ck = chunkOf(pl); let kbins = chunks.get(ck); if (!kbins) chunks.set(ck, kbins = new Map());
      const root = kit.pieces.get(pl.piece);
      if (!root) throw new Error('세트에 조각이 없다: ' + pl.piece);
      root.traverse((o) => {
        if (o.isMesh && !isUnder(o, 'mill_wheel')) {
          const g = floatGeoOf(o.geometry).clone(); g.applyMatrix4(_m.multiplyMatrices(pl.M, o.matrixWorld));
          const mat = kitMaterial(o.material); if (!kbins.has(mat)) kbins.set(mat, []); kbins.get(mat).push(g);
          kitInfo.tris += g.index.count / 3;
        } else if (/_smoke\d*$/.test(o.name)) addSmoke(o.getWorldPosition(_p).clone().applyMatrix4(pl.M));
      });
      kitInfo.pieces[pl.piece] = (kitInfo.pieces[pl.piece] || 0) + 1;
      if (pl.role === 'smithy' && root.getObjectByName('smithy_forge')) {
        const f = root.getObjectByName('smithy_forge').getWorldPosition(_p).clone();
        forgeLight.position.copy(f.add(new THREE.Vector3(0, 0.55, 0.7))).applyMatrix4(pl.M);
      }
      if (millP && pl === millP) {   // 물레바퀴: 따로 돌린다 (로컬 z 가 굴대). 바닥이 물에 잠기게 높이를 맞춘다
        const src = root.getObjectByName('mill_wheel');
        const w = src.clone(true);
        _m.multiplyMatrices(pl.M, src.matrixWorld).decompose(w.position, w.quaternion, w.scale);
        const R = new THREE.Box3().setFromObject(src).getSize(_p).y / 2 * pl.s;
        w.position.y = Math.min(w.position.y, WATER_Y + R - 0.45);
        w.traverse((o) => { if (o.isMesh) { o.geometry = o.geometry.clone(); o.material = kitMaterial(o.material); o.castShadow = true; o.receiveShadow = true; } });
        scene.add(w); wheel = w;
      }
    }
    let draws = 0;
    for (const [ck, kbins] of chunks) for (const [mat, list] of kbins) {
      const merged = mergeGeometries(list); merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, mat); mesh.name = 'kit_' + ck + '_' + mat.name;
      mesh.castShadow = mat.name !== 'glass'; mesh.receiveShadow = true;
      scene.add(mesh); buildingMeshes.push(mesh); kitMeshes.push(mesh); disposables.push(merged); draws++;
    }
    applyGlow();
    Object.assign(kitInfo, { ok: true, placed: placements.length, chunks: chunks.size, draws, tris: Math.round(kitInfo.tris), glow: glowMats.length, at: placements.map((p) => [p.piece, Math.round(p.x), Math.round(p.z), Math.round(p.base * 10) / 10]) });
  }

  // ── 소품·가축 (Blender: tools/blender/kit_props.py → kits/props_england.glb): 조각마다 재질별 InstancedMesh 하나 ──
  // 자리는 dressVillage 가 정했다. 오리만 물 반사(0번 층)에 들어가고, 나머지는 1번 층(물 반사에서 뺀다)
  const PROPS_URL = ASSET + 'kits/props_england.glb';
  const propInfo = { ok: false, err: null, items: dressing.items.length, draws: 0, tris: 0, counts: {} };
  const PROP_NOSHADOW = new Set(['flower_patch', 'chicken', 'duck']);
  const PROP_TINT = new Set(['fleece', 'hide', 'canvas_b', 'down', 'hide_dark', 'hide_goat']);      // 마리·천막마다 색 변주(instanceColor)를 받는 재질 (down = 오리 깃털: 부리·눈은 palette 라 안 물든다)
  const propMeshes = [];
  async function buildProps() {
    const pk = await loadKit(PROPS_URL_S);
    await nextTask();
    if (state.disposed) return;
    const byPiece = new Map();
    for (const it of dressing.items) { let a = byPiece.get(it.p); if (!a) byPiece.set(it.p, a = []); a.push(it); }
    const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _c = new THREE.Color();
    let pieceIdx = 0;
    for (const [piece, list] of byPiece) {
      if (++pieceIdx % 8 === 0) await nextTask();
      if (state.disposed) return;
      const root = pk.pieces.get(piece); if (!root) throw new Error('소품 세트에 조각이 없다: ' + piece);
      const d = PD[piece] || [1, 1, 1];
      // 바닥 다섯 점의 가장 낮은 땅에 놓는다 (비탈에서 뜨지 않게, 울타리 기둥·담 밑은 땅속으로 이어짐)
      const place4 = list.map((it) => {
        let y = it.y;
        if (y == null) {
          const c = Math.cos(it.rot), s = Math.sin(it.rot), hx = d[0] / 2 * it.s * (it.sx ?? 1) * 0.8, hz = d[1] / 2 * it.s * 0.8; y = Infinity;
          for (const [u, v] of [[0, 0], [hx, hz], [-hx, hz], [hx, -hz], [-hx, -hz]]) y = Math.min(y, heightAt(it.x + u * c + v * s, it.z - u * s + v * c));
          y -= 0.03;
        }
        return new THREE.Matrix4().compose(_p.set(it.x, y, it.z), _q.setFromAxisAngle(_yAxis, it.rot), _s.set(it.s * (it.sx ?? 1), it.s, it.s));
      });
      const subs = []; root.traverse((o) => { if (o.isMesh) subs.push(o); });
      for (const o of subs) {
        const mat = kitMaterial(o.material), geo = o.geometry.clone(), tint = PROP_TINT.has(mat.name);
        const im = new THREE.InstancedMesh(geo, mat, list.length);
        list.forEach((it, i) => { im.setMatrixAt(i, _m.multiplyMatrices(place4[i], o.matrixWorld)); if (tint) im.setColorAt(i, _c.setRGB(...(it.tint || [1, 1, 1]))); });
        im.castShadow = !PROP_NOSHADOW.has(piece) && mat.name !== 'water'; im.receiveShadow = true;
        im.layers.set(piece === 'duck' ? 0 : 1);
        im.computeBoundingSphere(); im.name = 'prop_' + piece + '_' + mat.name;
        scene.add(im); propMeshes.push(im); disposables.push(geo);
        propInfo.draws++; propInfo.tris += list.length * (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
      }
      propInfo.counts[piece] = list.length;
    }
    propInfo.tris = Math.round(propInfo.tris); propInfo.ok = true;
  }

  // ── 사람: 옷 입은 마을 사람 (realpeople.js — villagers.glb 변형 8명 + UAL 동작). 누가·어디서·무엇을 하는지는 시드로 (peopleplan.js) ──
  // 땅 높이 (다리 위는 다리 길 높이)
  function groundAt(x, z) {
    let y = heightAt(x, z);
    const curBridge = ENV.bridge !== undefined ? ENV.bridge : BRIDGE;
    if (curBridge && Math.hypot(x - curBridge.x, z - curBridge.z) < curBridge.len / 2 + 0.6) {
      const u = Math.abs((x - curBridge.x) * curBridge.dirx + (z - curBridge.z) * curBridge.dirz);
      if (RC.bridge === 'timber') { const e = curBridge.len / 2 - 1.6; y = Math.max(y, u < e ? BRT.top : lerp(BRT.top, y, Math.min(1, (u - e) / 2.1))); }
      else if (u < curBridge.len / 2) y = Math.max(y, u < curBridge.len / 2 - 4.5 ? 2.8 : lerp(2.8, Math.min(y, 0) - 0.4, (u - (curBridge.len / 2 - 4.5)) / 4.5));
    }
    return y;
  }
  const peopleSys = createPeople(scene, { url: peopleUrl, animUrl: ASSET + 'people/anims.glb', fogify, envI: () => state.envI });
  const peopleInfo = peopleSys.info;
  // 시드 난수로 사람 count 명(10~20)을 고르고 세운다. 다시 부르면 앞 사람들을 치우고 새로 세운다. 돌려주는 것: 계획(planPeople 결과)
  function spawnPeople(rand, count = opts.people ?? PEOPLE_DEFAULT) {
    const plan = planPeople(rand, count, { layout, dressing, fieldAt, propDims: PD, kit: KIT, flavor: FL, camp: !!RC.camp, year: opts.era });
    peopleSys.spawn(plan, groundAt);
    return plan;
  }
  async function buildPeople() {
    await peopleSys.ready;
    await nextTask();
    if (state.disposed) return;
    spawnPeople(rng(peopleSeed(seed)));
  }
  function stepPeople(dt) { peopleSys.step(dt, camera); }

  // ── 후처리 ──
  const size = new THREE.Vector2();
  renderer.getSize(size);
  const depthTex = new THREE.DepthTexture(); depthTex.type = THREE.UnsignedIntType;
  const rt = new THREE.WebGLRenderTarget(16, 16, { type: THREE.HalfFloatType, samples: 4, depthTexture: depthTex });
  const composer = new EffectComposer(renderer, rt);
  const renderPass = new RenderPass(scene, camera);
  const gtao = new GTAOPass(scene, camera, 16, 16);
  gtao.setGBuffer(depthTex);   // 장면 깊이로 노멀을 다시 만든다 (기하 한 번 더 그리지 않음)
  gtao.gtaoMaterial.needsUpdate = true; gtao.pdMaterial.needsUpdate = true;
  gtao.updateGtaoMaterial({ radius: 3.2, distanceExponent: 1.3, thickness: 3.0, scale: 1.0, samples: 12, distanceFallOff: 1.0 });
  gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 12 });
  gtao.blendIntensity = 1.0;
  // GTAO 고침: 잎 빌보드 가장자리의 한 화소짜리 조각에서 깊이로 만든 노멀이 0 이 되면 ao 가 NaN → 검은 알갱이.
  // NaN 을 막고, 반지름 3 m AO 가 뜻이 없는 먼 곳(250 m~)은 AO 를 줄여 없앤다.
  gtao.gtaoMaterial.fragmentShader = gtao.gtaoMaterial.fragmentShader
    .replace('vec3 viewNormal = getViewNormal(vUv);', 'vec3 viewNormal = getViewNormal(vUv);\n\t\t\tif (any(isnan(viewNormal)) || dot(viewNormal, viewNormal) < 0.25) viewNormal = vec3(0.0, 0.0, 1.0);')
    .replace('ao = pow(ao, scale);', 'ao = pow(ao, scale);\n\t\t\tif (isnan(ao) || isinf(ao)) ao = 1.0;\n\t\t\tao = mix(ao, 1.0, smoothstep(250.0, 600.0, -viewPos.z));');
  gtao.gtaoMaterial.needsUpdate = true;
  class BindDepth extends Pass { constructor() { super(); this.needsSwap = false; } render(r, w, read) { const d = read.depthTexture; gtao.gtaoMaterial.uniforms.tDepth.value = d; gtao.pdMaterial.uniforms.tDepth.value = d; } }
  const bindDepth = new BindDepth();
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.22, 0.5, 2.2);
  const outPass = new OutputPass();
  // 색 보정 (출력 뒤 화면 색에서): 채도 · 따뜻한 곱 · 어두운 쪽 밤색/밝은 쪽 금빛 (split toning) · 약한 S 곡선 · 해 쪽 안개빛(아침·해질녘) · 비네트
  const grade = new ShaderPass({
    uniforms: { tDiffuse: { value: null }, uVig: { value: 0.3 }, uSat: { value: 1.16 }, uWarm: { value: new THREE.Vector3(1.04, 1.0, 0.92) }, uLift: { value: 0.01 },
      uCurve: { value: 0.22 }, uLo: { value: new THREE.Vector3(1.03, 0.98, 0.93) }, uHi: { value: new THREE.Vector3(1.04, 1.0, 0.9) },
      uSunUV: { value: new THREE.Vector2(0.5, 2) }, uSunGlow: { value: 0 }, uSunCol: { value: new THREE.Color(1, 0.7, 0.4) }, uAspect: { value: 16 / 9 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uVig, uSat, uLift, uCurve, uSunGlow, uAspect; uniform vec3 uWarm, uLo, uHi, uSunCol; uniform vec2 uSunUV; varying vec2 vUv;
      void main(){ vec4 c = texture2D(tDiffuse, vUv); vec3 col = c.rgb;
        const vec3 LW = vec3(0.2126, 0.7152, 0.0722);
        float l = dot(col, LW); col = mix(vec3(l), col, uSat);
        col = col * uWarm;
        col *= mix(uLo, uHi, smoothstep(0.3, 0.95, dot(col, LW)));
        col = clamp(col, 0.0, 1.0); col = mix(col, col * col * (3.0 - 2.0 * col), uCurve);
        col = col * (1.0 - uLift) + uLift * vec3(0.9, 0.85, 1.0);
        vec2 d = (vUv - uSunUV) * vec2(uAspect, 1.0);
        col += uSunCol * uSunGlow * (exp(-dot(d, d) * 6.0) * 0.75 + exp(-dot(d, d) * 40.0) * 0.5) * (1.0 - 0.6 * dot(col, LW));
        vec2 q = vUv - 0.5; q.x *= 1.2; col *= 1.0 - uVig * smoothstep(0.25, 0.85, length(q));
        gl_FragColor = vec4(col, c.a); }`,
  });
  const _sunNdc = new THREE.Vector3(), _camFwd = new THREE.Vector3();
  // 해 쪽 안개빛: 해가 낮을 때(아침·해질녘) 화면에 비친 해 자리 둘레를 데운다 (빛 줄기 대신 가벼운 산란 강조)
  function updateSunGlow() {
    const u = grade.uniforms;
    if (!state.post || state.sunLow <= 0.01) { u.uSunGlow.value = 0; return; }
    camera.getWorldDirection(_camFwd);
    const face = smooth(-0.15, 0.45, _camFwd.dot(sunDir));
    _sunNdc.copy(camera.position).addScaledVector(sunDir, 5000).project(camera);
    u.uSunUV.value.set(_sunNdc.x * 0.5 + 0.5, _sunNdc.y * 0.5 + 0.5);
    u.uAspect.value = camera.aspect;
    u.uSunGlow.value = state.sunLow * face * 0.3;
  }
  function rebuildComposer() {
    composer.passes.length = 0;
    composer.addPass(renderPass);
    if (state.post && state.ao) { composer.addPass(bindDepth); composer.addPass(gtao); }
    if (state.post && state.bloom) composer.addPass(bloom);
    composer.addPass(outPass);
    if (state.post) composer.addPass(grade);
  }
  rebuildComposer();
  disposables.push(rt, depthTex);

  // ── 크기 ──
  function resize() {
    const w = canvas.clientWidth || 1600, h = canvas.clientHeight || 900;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    composer.setSize(w, h);
    const pr = renderer.getPixelRatio(); gtao.setSize(w * pr, h * pr);
    bloom.setSize(Math.round(w * pr / 2), Math.round(h * pr / 2));
  }
  resize();
  const ro = new ResizeObserver(() => resize()); ro.observe(canvas);

  // ── 시간 → 해, 하늘, 안개 ──
  const fogRT = new THREE.WebGLRenderTarget(8, 8, { type: THREE.FloatType });
  const fogCam = new THREE.PerspectiveCamera(20, 1, 1, 5000);
  const px = new Float32Array(8 * 8 * 4);
  function sampleSky(dirAz, el) {
    fogCam.position.set(0, 0, 0); fogCam.lookAt(Math.sin(dirAz) * Math.cos(el), Math.sin(el), -Math.cos(dirAz) * Math.cos(el));
    renderer.setRenderTarget(fogRT); renderer.render(skyScene, fogCam); renderer.readRenderTargetPixels(fogRT, 0, 0, 8, 8, px); renderer.setRenderTarget(null);
    const c = new THREE.Color(0, 0, 0); for (let i = 0; i < 64; i++) { c.r += px[i * 4] / 64; c.g += px[i * 4 + 1] / 64; c.b += px[i * 4 + 2] / 64; } return c;
  }
  function sunAt(h) {
    const span = P.sunset - P.sunrise;
    h = ((h % 24) + 24) % 24;
    if (h >= P.sunrise && h <= P.sunset) { const f = (h - P.sunrise) / span; return { el: P.maxElev * Math.sin(Math.PI * f), az: lerp(P.azRise, P.azSet, f) }; }
    // 밤: 해가 진 쪽에서 북쪽 아래를 돌아 뜨는 쪽으로 (가장 깊을 때 지평선 아래 18°)
    const g = ((h - P.sunset + 24) % 24) / (24 - span);
    return { el: -18 * Math.sin(Math.PI * g), az: lerp(P.azSet, P.azRise + 360, g) % 360 };
  }
  // setTime(h, { light, colors }) : light 면 하늘 PMREM 을 건너뛴다. colors({fogC, sunSide})를 주면 안개 색 표본(GPU 를 기다리는 읽기)을 하지 않고 그 색을 쓴다
  //   (게임 무대가 시각을 넘길 때: 처음에 skyColorsAt(목표 시각)으로 두 끝 색을 한 번만 읽고, 사이는 섞은 색을 준다)
  let fogC = new THREE.Color(0xbfd0e0), sunSideC = new THREE.Color(0xffffff);
  const sunDirAt = (h, out) => { const { el, az } = sunAt(h), e = THREE.MathUtils.degToRad(el), a = THREE.MathUtils.degToRad(az); return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)).normalize(); };
  const skyCache = new Map();
  function skyColorsAt(h) {
    const key = Math.round(((h % 24) + 24) % 24 * 10);
    let cached = skyCache.get(key);
    if (cached) return { fogC: cached.fogC.clone(), sunSide: cached.sunSide.clone() };
    const { el, az } = sunAt(h), azR = THREE.MathUtils.degToRad(az), u = sky2.material.uniforms.sunPosition.value, keep = u.clone();
    sunDirAt(h, u);
    const f = sampleSky(azR + Math.PI / 2, THREE.MathUtils.degToRad(1.5)).lerp(sampleSky(azR - Math.PI / 2, THREE.MathUtils.degToRad(1.5)), 0.5);
    const side = sampleSky(azR, THREE.MathUtils.degToRad(Math.max(1.5, Math.min(el, 6))));
    u.copy(keep);
    cached = { fogC: f, sunSide: side };
    skyCache.set(key, cached);
    return { fogC: f.clone(), sunSide: side.clone() };
  }
  function setTime(h, o = {}) {
    state.time = h;
    const { el, az } = sunAt(h);
    const elR = THREE.MathUtils.degToRad(el), azR = THREE.MathUtils.degToRad(az);
    sunDir.set(Math.sin(azR) * Math.cos(elR), Math.sin(elR), -Math.cos(azR) * Math.cos(elR)).normalize();
    su.sunPosition.value.copy(sunDir); sky2.material.uniforms.sunPosition.value.copy(sunDir);
    sun.position.copy(sun.target.position).addScaledVector(sunDir, 600);
    const warm = smooth(-1, 42, el);
    const sunCol = new THREE.Color().setRGB(1.0, lerp(0.52, 0.95, warm), lerp(0.26, 0.88, warm));
    sun.color.copy(sunCol); sun.intensity = 4.6 * smooth(-1.5, 7, el) * (0.8 + 0.2 * warm);
    if (!o.light) {
      // 환경광 (하늘 PMREM: 그리기만 하고 읽지 않는다)
      if (envRT) envRT.dispose();
      envRT = pmrem.fromScene(skyScene, 0, 1, 20000); scene.environment = envRT.texture;
    }
    if (o.colors) { fogC = o.colors.fogC.clone(); sunSideC = o.colors.sunSide.clone(); }
    else if (!o.light) {
      // 안개 색 = 캐시된 하늘색 표본 (GPU 파이프라인 동기 락 방지)
      const col = skyColorsAt(h);
      fogC = col.fogC; sunSideC = col.sunSide;
    }
    scene.fog.color.copy(fogC);
    FOGU.uFogSunCol.value.copy(sunSideC).lerp(fogC, 0.25); FOGU.uFogSunDir.value.copy(sunDir);
    // 아침·해질녘: 해 쪽 산란을 넓고 세게, 색 보정도 더 따뜻하게 (낮 = 0 … 해가 낮을수록 1)
    const low = state.sunLow = (1 - smooth(4, 26, el)) * smooth(-4, 1, el);
    FOGU.uFogSunK.value.set(lerp(7, 3.2, low), lerp(0.9, 1.35, low));
    { const g = grade.uniforms; g.uHi.value.set(1.04 + 0.04 * low, 1.0, lerp(0.9, 0.8, low)); g.uLo.value.set(1.03, lerp(0.98, 0.95, low), lerp(0.93, 0.9, low)); g.uSunCol.value.copy(sunCol); }
    hemi.color.copy(fogC).multiplyScalar(0.6 / Math.max(0.05, fogC.getHSL({}).l)).lerp(new THREE.Color(0xbcd2ee), 0.3);
    hemi.intensity = 0.18 + 0.15 * warm;
    // 노출: 낮엔 밝은 하늘, 해질녘엔 올린다
    renderer.toneMappingExposure = lerp(0.95, 0.5, smooth(0, 35, el));
    // 구름·나무 빌보드 빛
    cloudMat.uniforms.uLit.value.copy(sunCol).multiplyScalar(lerp(0.6, 1.6, warm) * (0.3 + 0.7 * smooth(-2, 6, el)) * 3.0);
    cloudMat.uniforms.uShade.value.copy(fogC).multiplyScalar(0.85);
    treeU.uSunCol.value.copy(sunCol).multiplyScalar(sun.intensity * 0.42);
    treeU.uAmb.value.copy(fogC).multiplyScalar(0.55);
    smokeCol.copy(fogC).multiplyScalar(0.55).lerp(sunCol.clone().multiplyScalar(sun.intensity * 0.12), 0.35);
    // 물
    water.material.uniforms.sunDirection.value.copy(sunDir); water.material.uniforms.sunColor.value.copy(sunCol).multiplyScalar(0.6 + 0.4 * warm);
    // 저녁 불빛
    const dusk = 1 - smooth(1, 14, el);
    state.dusk = dusk; applyGlow();
    forgeBase = 26 + 40 * dusk; forgeLight.intensity = forgeBase;
    bloom.threshold = lerp(1.6, 3.0, warm);
    renderer.shadowMap.needsUpdate = true;
    state.el = el;
    return { el, az };
  }

  // ── 카메라 ──
  // rel: 높이(pos·look 의 y)가 그 자리 땅에서 잰 값 (마을이 비탈이라 눈높이 시점은 땅을 따른다). 없으면 절대 높이
  const VIEWS = {
    overview: ENV.overview || RC.overview || { pos: [-20, 40, 92], look: [10, -1, -26], fov: 42 },   // 목표 그림 구도
    street: { pos: [-11, 1.7, 8], look: [22, 3.2, -24], fov: 40, rel: true },      // 큰길 눈높이: 양쪽 집줄·길가 풀섶·꽃, 끝에 장터·교회 탑
    dusk: { pos: [23, 7, 55], look: [42, 3, 15], rel: true },
    forge: { pos: [29, 4.5, 44], look: [41, 2, 17], rel: true },          // 대장간 마당 가까이 (화덕 불빛·물통·말·연장 걸이)
    high: { pos: [-260, 210, 420], look: [20, 0, -90] },
    church: { pos: [40, 5.5, 10], look: [96, 9, -62], rel: true },
    market: { pos: [22, 3.6, -17], look: [44, 0.8, -38], rel: true },
    pasture: { pos: [24, 2.6, 60], look: [4, 0.5, 40], rel: true },      // 강가 양 풀밭 (양 떼 가까이), 뒤로 비탈 마을
  };
  function setView(name) {
    const v = VIEWS[name] || VIEWS.overview; state.view = name;
    camera.fov = v.fov ?? 33; camera.updateProjectionMatrix();
    const py = v.pos[1] + (v.rel ? heightAt(v.pos[0], v.pos[2]) : 0), ly = v.look[1] + (v.rel ? heightAt(v.look[0], v.look[2]) : 0);
    camera.position.set(v.pos[0], py, v.pos[2]); camera.lookAt(v.look[0], ly, v.look[2]); state.look = new THREE.Vector3(v.look[0], ly, v.look[2]);
    FOGU.uFogH.value.z = camera.position.y;
  }
  setView(state.view);
  setTime(state.time);

  // ── 돌리기 ──
  const clock = new THREE.Clock();
  let raf = 0, tAcc = 0;
  const frameTimes = [];
  function frame() {
    if (state.disposed) return;
    raf = requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.1); tAcc += dt;
    renderOnce(dt);
    frameTimes.push(dt * 1000); if (frameTimes.length > 240) frameTimes.shift();
  }
  function renderOnce(dt) {
    for (const u of updaters) u(dt, tAcc);
    stepPeople(dt);
    if (wheel) wheel.rotateZ(dt * 0.6);
    water.material.uniforms.time.value += dt * 0.35;
    cloudMat.uniforms.uTime.value = tAcc;
    {   // 화덕 깜박임: 기준 세기의 0.9~1.1 (사인 셋을 섞은 결정적 잡음, 누적되지 않음)
      const t = tAcc, n = 0.5 + 0.25 * Math.sin(t * 13.1) + 0.15 * Math.sin(t * 23.7 + 1.3) + 0.1 * Math.sin(t * 37.3 + 2.1);
      forgeLight.intensity = forgeBase * (0.9 + 0.2 * n);
    }
    if (state.orbit) {
      const a = tAcc * 0.03, L = state.look, d = 210;
      camera.position.set(L.x + Math.sin(a) * d, 46, L.z + Math.cos(a) * d); camera.lookAt(L);
    }
    FOGU.uFogH.value.z = camera.position.y;
    camera.updateMatrixWorld();
    updateSunGlow();
    if (++frameNo % SHADOW_EVERY === 0) renderer.shadowMap.needsUpdate = true;
    renderer.info.reset();
    composer.render(dt);
  }
  const ready = (async () => {
    await new Promise((r) => setTimeout(r, 0));
    if (state.disposed) return api;
    { const t = performance.now(); grass = buildGrass(); times.grass = Math.round(performance.now() - t); }
    await nextTask();
    if (state.disposed) return api;
    const res = await Promise.allSettled([buildTrees(), buildPeople(), buildKit(), buildProps()]);
    if (state.disposed) return api;   // 다 짓기 전에 풀렸다 (게임에서 생이 빨리 바뀜)
    await nextTask();
    if (state.disposed) return api;
    if (res[0].status === 'rejected') { treeInfo.err = String(res[0].reason?.stack || res[0].reason); console.warn('나무 실패', res[0].reason); }
    if (res[1].status === 'rejected') { peopleInfo.err = String(res[1].reason?.stack || res[1].reason); console.warn('사람 실패', res[1].reason); }
    if (res[2].status === 'rejected') {   // 세트를 못 불러오면 건물 없이 서고, 빈 자리에 화덕 불빛만 뜨지 않게 끈다
      kitInfo.err = String(res[2].reason?.message || res[2].reason); forgeLight.visible = false; console.warn('건물 세트 실패', res[2].reason);
    }
    if (res[3].status === 'rejected') { propInfo.err = String(res[3].reason?.message || res[3].reason); console.warn('소품 세트 실패', res[3].reason); }
    renderer.shadowMap.needsUpdate = true;
    applyEnvI();
    // 모든 셰이더를 미리 컴파일
    renderer.compile(scene, camera);
    for (const t of [5.1, 7.4, 12.6, 16.6, 19.05, 21.7]) skyColorsAt(t);
    return api;
  })();
  if (opts.autoStart !== false) frame();

  const api = {
    ready, renderer, scene, camera, gtao, GTAOPass,
    setTime, setView, spawnPeople, people: peopleSys,
    setEnv(i) { state.envI = i; applyEnvI(); },
    // 세트 그늘(AO) 확인용: direct = 해빛에 섞는 양, map = aoMap 세기 (0 이면 끔)
    setKitAO({ direct, map } = {}) { if (direct != null) KITU.uAODirect.value = direct; if (map != null) for (const m of kitMeshes) m.material.aoMapIntensity = map; },
    setPost(on, which = {}) { state.post = !!on; if ('ao' in which) state.ao = which.ao; if ('bloom' in which) state.bloom = which.bloom; rebuildComposer(); },
    setOrbit(on) { state.orbit = !!on; if (!on) setView(state.view); },
    // 지금 장면을 PNG dataURL 로
    snapshot() { renderOnce(0); return canvas.toDataURL('image/png'); },
    // 게임 무대(createStage)용: 바깥 고리에서 한 프레임 그리기 (autoStart: false 일 때), 땅 높이, 마을 배치, 화질
    renderFrame(dt) { if (state.disposed) return; dt = Math.min(dt, 0.1); tAcc += dt; renderOnce(dt); },
    heightAt, groundAt, layout, dressing, state, sunDir, fogify, skyColorsAt, kit: KIT, kitDims: KD, propDims: PD, recipe: RC, flavor: FL, peopleUrl, setting: opts.setting || RC.setting || 'village', household: opts.household || null, env: ENV,
    skyColors() { return { fogC: fogC.clone(), sunSide: sunSideC.clone() }; },
    setQuality(q) {
      const Q2 = QUALITY[q]; if (!Q2) return;
      state.quality = q; state.ao = Q2.ao; rebuildComposer();
      if (sun.shadow.mapSize.x !== Q2.shadow) { sun.shadow.mapSize.set(Q2.shadow, Q2.shadow); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } renderer.shadowMap.needsUpdate = true; }
    },
    // 동기 측정: n 프레임을 그리고 1px 읽어 GPU 를 기다린다
    bench(n = 60) {
      const gl = renderer.getContext(), b = new Uint8Array(4); renderOnce(0.016); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, b);
      const t0 = performance.now(); for (let i = 0; i < n; i++) { renderOnce(0.016); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, b); }
      return (performance.now() - t0) / n;
    },
    rafStats() { const a = [...frameTimes].sort((x, y) => x - y); return { avg: a.reduce((s, x) => s + x, 0) / (a.length || 1), p50: a[Math.floor(a.length / 2)], p95: a[Math.floor(a.length * 0.95)], n: a.length }; },
    info() {
      const i = renderer.info;
      return { calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures, caches: cacheInfo(renderer), splatMs: Math.round(splatMs), buildMs: times, hedges: hedges.edges, hedgeTris: hedges.tris, grass: grass.count, flowers: grass.flowers, trees: treeInfo, people: peopleInfo, kit: kitInfo, props: propInfo, layoutMs: Math.round(layoutMs),
        layout: { houses: layout.houses.length, farms: layout.farms.length, crofts: layout.houses.filter((h) => h.croft).length, awnings: layout.awnings.length, stalls: layout.stalls.length, items: dressing.items.length, trees: dressing.trees.length, tall: dressing.tall.length, pieces: layout.houses.map((h) => h.piece) }, gl: (() => { const gl = renderer.getContext(); const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); })() };
    },
    dispose() {
      state.disposed = true; cancelAnimationFrame(raf); ro.disconnect();
      for (const d of disposables) d.dispose?.();
      for (const m of buildingMeshes) m.geometry.dispose();
      peopleSys.dispose();
      envRT?.dispose(); pmrem.dispose(); fogRT.dispose(); composer.dispose?.(); gtao.dispose(); bloom.dispose(); grade.dispose?.(); outPass.dispose?.();
      sun.shadow.map?.dispose(); scene.remove(water);   // 물은 그리개마다 하나를 함께 쓴다 (다음 장면이 다시 단다)
      for (const m of [sky.material, sky2.material]) m.dispose();
      // 인스턴스 행렬·색 버퍼도 놓아준다 (생마다 장면을 다시 지으면 풀포기 16만 개 버퍼가 쌓이지 않게)
      scene.traverse((o) => { if (o.isMesh && o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); if (o.isInstancedMesh) o.dispose(); });
      if (ownRenderer) renderer.dispose();
    },
  };
  return api;
}

// ───────────────────────── 게임 무대: createStage(canvas) — village.js 와 같은 API ─────────────────────────
// main.js 가 `import { createStage as createVillage, phaseOf } from './realscene.js'` 로 쓴다.
//   setLife(birth)        : 출생 시드로 장면을 새로 짓는다 (앞 장면은 풀고, 그리개·세트·사람 glb·텍스처는 함께 쓴다). 땅 모습은 lands.js stageOf.
//                           처음 몇 초는 마을 전경(3/4 높이, 하늘·구릉)을 보여 주고 내 사람 곁으로 다가간다
//   setAge(age, year)     : 내 사람 (성별로 고른 마을 사람: 13살 아래 아이 · 13~59 어른 · 60~ 노인 — 크기·옷·걸음, 노인은 굽은 등·지팡이)
//   setFocus(id)          : 올해의 패 (work·learn·family·body·rest) → 내 사람이 하는 일과 자리 (밭·대장간·장터 / 교회 / 집 앞 가족 / 골목 / 걸상)
//   setPhase(name)        : dawn·morning·noon·afternoon·dusk·night → 해 높이·시각, 천천히 넘어간다 (fast 면 바로)
//   setCampfire(on, ghost): 장터 빈터에 모닥불(장작·돌·불꽃 입자·불티·점광원), 내 사람이 불가에, 카메라는 사람과 불을 함께. ghost 면 건너편에 푸른 불씨 사람
//   flameRise()           : 카메라가 마을 전경으로 물러나며 내 사람 위에서 하얀 불씨가 떠올라 사라진다 (Promise, fast·움직임 줄이기면 바로 끝)
//   snapshot()            : 320×180 JPEG dataURL (lift 없이 찍는다) · setView({lift}) : HUD 를 피해 그림을 위로 (0~0.3)
//   tick()                : 해가 넘어갈 때 카메라가 내 사람 둘레를 조금 더 돈다 · setKit() : 쓰지 않음 (KayKit 육각 섬 시절의 이름)
// 시점: 기본은 내 사람 가까이 (3인칭, 4~8 m, 눈높이보다 조금 위). 휠 = 가까이(3 m)~중간(15 m), 끌기 = 둘레 돌기 (HUD 위에서 시작한 끌기는 무시)
// 전경 시점은 목표 그림(m2-living-real)처럼 3/4 높이에서 — 위 15~20% 하늘·먼 구릉, 가운데 마을, 앞에 강·다리. 탄생·죽음 때만 쓴다.
const GAME_CAM = { pos: [-44, 20, 108], look: [21, 5.5, -31], fov: 41 };   // 높이는 그 자리 땅에서 잰다
const STAGE_SWAY = 0.075;            // 전경 카메라가 오가는 각 (rad, 좌우)
const QUALITY_KEY = 'pl.quality';
const WIDE_HOLD = 3.2;               // 탄생 전경을 보여 주는 시간 (화면에 보인 초)
let sharedGlow = null;
function glowTex() {
  if (!sharedGlow) sharedGlow = canvasTex(128, 128, (g, w, h) => {
    const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.22, 'rgba(255,255,255,.55)'); gr.addColorStop(0.55, 'rgba(255,255,255,.14)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  return sharedGlow;
}
// 불꽃·불티 입자 (점 하나 = 둥근 빛, 더하기 섞기). 크기는 m (거리에 따라 작아진다)
function makeParticles(n) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 4), size = new Float32Array(n);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aCol', new THREE.BufferAttribute(col, 4).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('aSize', new THREE.BufferAttribute(size, 1).setUsage(THREE.DynamicDrawUsage));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 500 } },
    vertexShader: `attribute vec4 aCol; attribute float aSize; uniform float uScale; varying vec4 vCol;
      void main(){ vCol = aCol; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(aSize * uScale / -mv.z, 1.0, 256.0); }`,
    fragmentShader: `varying vec4 vCol; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; float a = vCol.a * pow(max(0.0, 1.0 - d), 1.5); if (a < 0.004) discard; gl_FragColor = vec4(vCol.rgb, a); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 3;
  return { pts, pos, col, size, geo, mat, n };
}
const HEIGHT = 1.75;   // 어른 키 (m, 크기 1)

export function createStage(canvas) {
  // WebGL 이 없으면 여기서 던진다 → main.js 가 글로만 진행한다
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false });
  const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 화질: 주소의 ?q=high|normal 은 이번 판에만 (저장하지 않는다. 공유 링크가 받은 사람의 설정을 바꾸지 않게). 없으면 저장된 값(setQuality), 그것도 없으면 높음
  let quality = 'normal';
  try { const s = JSON.parse(localStorage.getItem(QUALITY_KEY)); if (s === 'high' || s === 'normal') quality = s; } catch (e) { /* 저장소가 없으면 보통 */ }
  try { const q = new URLSearchParams(location.search).get('q'); if (q === 'high' || q === 'normal') quality = q; } catch (e) { /* 주소를 못 읽으면 그대로 */ }

  const st = {
    fast: false, birth: null, errors: [], lifeErr: new Set(), failed: false,
    lift: 0, liftNow: 0, phi: 0, spin: 0,
    time: PHASE_TIME.night, tr: null, fullAt: 0,
    age: 0, year: 0, kitNow: null, focus: null, campOn: false, ghostOn: false, meKey: '',
    mode: 'wide', wideHold: WIDE_HOLD, rate: 1.2, wideW: 1,   // 카메라: wide(전경) · close(내 사람) · camp(모닥불)
    user: { yaw: 0, pitch: 0, zoom: 1 }, colDa: 0,
  };
  let W = null;   // 지금 장면에 붙인 무대 물건 (내 사람·모닥불·불씨). 장면과 함께 갈아 끼운다
  const frameTimes = [];
  const rises = [];
  const note = (() => {   // 자산을 못 불러왔을 때 무대 아래쪽에 작은 알림 (HUD 흐름은 그대로)
    const box = canvas.parentElement; if (!box) return null;
    const p = document.createElement('p'); p.className = 'stagewarn'; p.setAttribute('role', 'status'); p.hidden = true;
    p.dataset.t = 'stageWarn';   // 말을 바꾸면 ui.js 가 [data-t] 글을 다시 쓴다 (i18n.js stageWarn)
    Object.assign(p.style, { position: 'absolute', left: '50%', bottom: '128px', transform: 'translateX(-50%)', margin: '0', padding: '4px 12px', borderRadius: '999px', background: 'rgba(18,19,41,.62)', color: 'rgba(246,239,226,.85)', font: '12px/1.5 system-ui,sans-serif', pointerEvents: 'none', zIndex: '2' });
    box.appendChild(p); return p;
  })();
  function warn(what, err) {
    const line = what + ': ' + String((err && err.message) || err).split('\n')[0];
    if (note) { note.textContent = tr((document.documentElement.lang || 'ko').startsWith('en') ? 'en' : 'ko', 'stageWarn'); note.hidden = false; }
    if (st.lifeErr.has(line)) return;   // 한 생 안에서 같은 실패는 한 번만 적는다
    st.lifeErr.add(line);
    if (!st.errors.includes(line)) { st.errors.push(line); if (st.errors.length > 20) st.errors.shift(); console.warn('한 영혼의 여정 무대:', what, err); }
  }

  // ── 가림 검사: 두 점 사이에 집·큰 건물·천막(바닥 OBB × 높이)이 있나 ──
  const FIXED_TOP = { church: 22, smithy: 7, mill: 9, temple_small: 13, smithy_sa: 5, well_step: 4, house_courtyard: 4.2, granary: 4.3,
    manor: 8.6, haveli: 10.6, courtyard_estate: 6.8, palace_mb: 8.4,
    temple_ea: 9, pagoda_small: 15, gate_ea: 4.5, smithy_ea: 4.8, well_ea: 2.2, shrine_ea: 3, house_tile_ea: 5.8, house_thatch_ea: 5, granary_ea: 4.8, camp_hearth: 1.6 };
  function blockersOf(sc, market = false) {
    const list = [...sc.layout.houses, ...sc.layout.farms].map((h) => ({ o: h.foot, top: 8.5 }));
    for (const f of sc.layout.fixed || []) {   // 정한 자리 큰 조각 (잉글랜드: 교회·대장간·물레방앗간 / 남아시아: 사원·대장간·가트·큰 집·곳간)
      const top = FIXED_TOP[f.piece]; if (!top) continue;
      const [L, D] = sc.kitDims[f.piece]; list.push({ o: obb(f.x, f.z, f.rot, L / 2, D / 2), top });
    }
    if (market) {
      for (const a of sc.layout.stalls) list.push({ o: obb(a.x, a.z, a.rot, 1.9, 1.4), top: 3.0 });
      for (const a of sc.layout.awnings) list.push({ o: obb(a.x, a.z, a.rot, 2.0, 1.8), top: 3.3 });
    }
    return list;
  }
  function seen(sc, blk, from, x, y, z, skip = 1.5) {
    const dx = x - from.x, dy = y - from.y, dz = z - from.z, L = Math.hypot(dx, dy, dz), n = Math.ceil(L / 1.0);
    for (let i = 1; i < n; i++) {
      const t = i / n; if ((1 - t) * L < skip) break;
      const px = from.x + dx * t, py = from.y + dy * t, pz = from.z + dz * t;
      for (const b of blk) if (obbHas(b.o, px, pz, 0.3) && py < sc.heightAt(px, pz) + b.top) return false;
    }
    return true;
  }
  const inBlock = (blk, x, z, pad) => blk.some((b) => obbHas(b.o, x, z, pad));

  // ── 내 사람이 오가는 길: 마을 골목 가운데 전경 카메라에서 가리지 않고 보이는 18 m 남짓 (시드마다 집이 달라 그때그때 고른다) ──
  function homePath(sc, blk) {
    const cam = sc.camera, _v = new THREE.Vector3();
    gamePose(cam.position, _v, sc, 0); cam.lookAt(_v); cam.fov = (sc.env && sc.env.overview && sc.env.overview.fov) || GAME_CAM.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    let best = null;
    const lanes = (sc.env && sc.env.lanes) || LANES;
    for (const lane of lanes) {
      const pts = smoothLine(lane, 3), cum = polyCum(pts), total = cum[cum.length - 1], run = [];
      const flush = () => {
        if (run.length >= 6) {   // 15 m 넘게 이어 보이는 구간: 화면 가운데(0.5, 0.58)에 가깝고 길수록
          const mid = run[Math.floor(run.length / 2)], q = _v.set(mid[0], mid[2], mid[1]).project(cam);
          const score = -Math.hypot(q.x * 0.9, (q.y + 0.16) * 1.4) + Math.min(run.length, 9) * 0.04;
          if (Math.abs(q.x) < 0.75 && q.y > -0.7 && q.y < 0.4 && (!best || score > best.score)) best = { score, path: run.slice(0, 9).map(([x, z]) => [x, z]) };
        }
        run.length = 0;
      };
      for (let d = 1.5; d <= total - 1.5; d += 2.5) {
        const p = polyAt(pts, cum, d);
        const sx = -p.tz, sz = p.tx, toward = (cam.position.x - p.x) * sx + (cam.position.z - p.z) * sz > 0 ? 0.8 : -0.8;   // 길 가운데에서 카메라 쪽으로 0.8 m
        const x = p.x + sx * toward, z = p.z + sz * toward, y = sc.groundAt(x, z);
        if (seen(sc, blk, cam.position, x, y + 1.0, z) && seen(sc, blk, cam.position, x, y + 0.3, z)) run.push([x, z, y + 1]); else flush();
      }
      flush();
    }
    if (best) return best.path;
    const fallbackLane = lanes[lanes.length - 1] || LANES[LANES.length - 1], pts = smoothLine(fallbackLane, 3), cum = polyCum(pts), path = [];   // 못 찾으면 안쪽 길
    for (let d = 6; d <= 26; d += 2.5) { const p = polyAt(pts, cum, d); path.push([p.x - p.tz * 0.8, p.z + p.tx * 0.8]); }
    return path;
  }
  // 모닥불 자리: 장터 빈터 안에서 좌판·천막·큰 소품과 가장 넉넉히 떨어진 곳 (가운데에 가까운 쪽 먼저)
  function fireSpot(sc) {
    const obs = [...sc.layout.stalls.map((a) => [a.x, a.z, 2.2]), ...sc.layout.awnings.map((a) => [a.x, a.z, 2.5])];
    for (const it of sc.dressing.items) {
      const d = sc.propDims[it.p]; if (!d || Math.hypot(it.x - GREEN.x, it.z - GREEN.z) > GREEN.r + 6 || /flower/.test(it.p)) continue;
      obs.push([it.x, it.z, Math.max(d[0], d[1]) / 2 * it.s + 0.4]);
    }
    let best = null;
    for (const rad of [0, 1.5, 3, 4.5, 6, 7.5]) for (let k = 0; k < (rad ? 12 : 1); k++) {
      const a = k / 12 * Math.PI * 2, x = GREEN.x + Math.cos(a) * rad, z = GREEN.z + Math.sin(a) * rad;
      const free = Math.min(...obs.map(([ox, oz, r]) => Math.hypot(x - ox, z - oz) - r), 99);
      if (free >= 2.4) return [x, z];
      if (!best || free > best[2]) best = [x, z, free];
    }
    return [best[0], best[1]];
  }
  // 한 자리를 둘러볼 카메라 방향: want 쪽에서 시작해 좌우로 돌려 가며, 카메라 자리가 막히지 않고 그 자리가 가리지 않는 첫 방향
  function clearDir(sc, blk, x, y, z, want, d, h, keepOff = []) {
    const from = new THREE.Vector3();
    let second = null;
    for (const a of [0, 0.3, -0.3, 0.6, -0.6, 0.9, -0.9, 1.25, -1.25, 1.6, -1.6, 2.1, -2.1, 2.6, -2.6, Math.PI]) {
      const c = Math.cos(a), s = Math.sin(a), dx = want[0] * c + want[1] * s, dz = -want[0] * s + want[1] * c;
      from.set(x + dx * d, y + h, z + dz * d);
      if (inBlock(blk, from.x, from.z, 1.0) || !seen(sc, blk, from, x, y + 0.8, z, 0.6)) continue;
      // 천막·좌판이 카메라 코앞이나 가운데에 걸리지 않으면 바로, 걸리면 다음 후보로 (다 걸리면 처음 보인 방향)
      if (!keepOff.some(([kx, kz]) => Math.hypot(kx - from.x, kz - from.z) < 3.4 || Math.hypot(kx - (x + from.x) / 2, kz - (z + from.z) / 2) < 2.2)) return [dx, dz];
      second = second || [dx, dz];
    }
    return second || want;
  }
  const unit = (x, z) => { const l = Math.hypot(x, z) || 1; return [x / l, z / l]; };

  // ── 내 사람 자리들 (장면마다 시드로 한 번 정한다) ──
  function planSpots(sc, w) {
    const r = rng(w.seed ^ 0x6a09e667), L = sc.layout, items = sc.dressing.items;
    const near = L.houses.map((h, i) => [h, i]).filter(([h]) => Math.hypot(h.x - VC.x, h.z - VC.z) < 85 && h.n);
    const [home, hi] = near.length ? near[Math.floor(r() * Math.min(8, near.length))] : [L.houses[0], 0];
    const S = {};
    const toward = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
    // 집 앞 (길 쪽 2.4 m): 가족 이야기·아기
    { const fx = home.x - home.n[0] * (home.D / 2 + 2.4), fz = home.z - home.n[1] * (home.D / 2 + 2.4);
      S.home = { x: fx, z: fz, face: toward(fx, fz, home.x, home.z) + Math.PI, bg: [home.x, home.z] }; }
    // 텃밭 (집 뒤뜰의 채소밭 곁에 무릎 꿇기) — 없으면 뒤뜰 가운데
    // 남아시아: 텃밭 대신 마당 아궁이(chulha) 앞, 걸상 대신 끈 침상(charpai)
    const A = sc.recipe.activity, BED = A.bed, SEAT = A.seat, SEAT_H = A.seatH, SITE = sc.recipe.sites;   // 세트별 활동 자리 (villageplan.js RECIPES.*.activity)
    { const bed = items.filter((it) => it.p === BED && it.yard === hi)[0] || items.filter((it) => it.p === BED).sort((a, b) => Math.hypot(a.x - home.x, a.z - home.z) - Math.hypot(b.x - home.x, b.z - home.z))[0];
      if (bed) { const x = bed.x + Math.sin(bed.rot) * 0.95, z = bed.z + Math.cos(bed.rot) * 0.95; S.garden = { x, z, face: bed.rot + Math.PI, bg: [home.x, home.z] }; }
      else { const c = home.croft || home.foot; S.garden = { x: c.x, z: c.z, face: 0, bg: [home.x, home.z] }; } }
    // 밭 (마을에서 150~260 m 의 갈아엎은 밭·밀밭, 마을 사람 괭이질 자리와 20 m 넘게): 괭이질, 뒤로 마을
    { const busy = sc.people.people.filter((P) => P.p.action === 'hoe').map((P) => [P.p.x, P.p.z]);
      const a0 = r() * Math.PI * 2;
      for (let t = 0; t < 160 && !S.field; t++) {
        const a = a0 + t * 2.39996, d = 140 + (t % 12) * 10, x = VC.x + Math.cos(a) * d, z = VC.z + Math.sin(a) * d, f = sharedEnv().fieldAt(x, z);
        if (f && (f.type === 3 || f.type === 2) && f.edge > 8 && !busy.some(([bx, bz]) => Math.hypot(bx - x, bz - z) < 20)) S.field = { x, z, face: toward(x, z, VC.x, VC.z) + 0.9, bg: [VC.x, VC.z] };
      }
      if (!S.field) S.field = S.garden; }
    // 대장간 앞마당 (모루 옆, 무릎 꿇고 손질)
    { const o = obb(SMITHY.x, SMITHY.z, SMITHY.rot, 1, 1), [x, z] = obbLocal(o, 2.6, 3.4); S.forge = { x, z, face: SMITHY.rot + Math.PI * 0.85, bg: [SMITHY.x, SMITHY.z] }; }
    // 장터 천막 뒤 (장수 자리 옆)
    { const a = L.awnings[0] || { x: GREEN.x, z: GREEN.z, rot: 0 };
      if (A.marketFront) {   // 남아시아 좌판(market_stall_sa)은 앞 처마가 2 m 로 낮아 그 밑에 서면 가린다: 평상 앞(처마 밖)에 서서 곁의 손님과 이야기, 좌판이 뒤로
        // 좌판이 줄지어 서 있어 앞이 다른 좌판·집에 막힌 자리가 많다: 앞 9 m 띠가 가장 트인 천막 좌판을 고른다 (같으면 앞 번호)
        const open = (q) => { const oq = obb(q.x, q.z, q.rot, 1, 1); let n = 0; for (const v of [2.6, 4, 5.5, 7, 8.5]) for (const u of [-2, -0.5, 1]) { const [px, pz] = obbLocal(oq, u, v); if (inBlock(w.blkM, px, pz, 0.2)) n++; } return n; };
        const b = L.awnings.length ? L.awnings.map((q, k) => [open(q), k, q]).sort((p, q) => p[0] - q[0] || p[1] - q[1])[0][2] : a, o = obb(b.x, b.z, b.rot, 1, 1);
        const [x, z] = obbLocal(o, -0.6, 1.85), [cx, cz] = obbLocal(o, 1.35, 2.55);
        S.market = { x, z, face: toward(x, z, cx, cz), bg: obbLocal(o, 0, -4), mate: { x: cx, z: cz, face: toward(cx, cz, x, z) } };
      } else {
        const o = obb(a.x, a.z, a.rot, 1, 1), [x, z] = obbLocal(o, 1.0, -1.2), [cx, cz] = obbLocal(o, 0.6, 2.6);
        S.market = { x, z, face: a.rot, bg: obbLocal(o, 0, -6), mate: { x: cx, z: cz, face: a.rot + Math.PI } };
      } }
    // 교회 앞 (묘지 비석 없는 띠, 탑이 뒤로)
    if (A.templeFront) { const T = SITE.temple, [x, z] = obbLocal(obb(T.x, T.z, T.rot, 1, 1), ...A.templeFront); S.church = { x, z, face: T.rot + Math.PI, bg: [T.x, T.z] }; }   // 사원(또는 그 자리 신당) 계단 앞
    else { const x = CHURCH.x - 5, z = CHURCH.z + 9; S.church = { x, z, face: Math.PI * 0.75, bg: [CHURCH.x - 4, CHURCH.z] }; }
    // 쉬기: 집 걸상 (마을 사람이 앉은 걸상은 비킨다) — 없으면 나무 밑
    { const sitters = sc.people.people.filter((P) => P.p.action === 'sit').map((P) => [P.p.x, P.p.z]);
      const benches = items.filter((it) => it.p === SEAT && !sitters.some(([sx, sz]) => Math.hypot(sx - it.x, sz - it.z) < 1.2)).sort((a, b) => Math.hypot(a.x - home.x, a.z - home.z) - Math.hypot(b.x - home.x, b.z - home.z));
      const b = benches[0];
      if (b && Math.hypot(b.x - home.x, b.z - home.z) < 60) S.bench = { x: b.x + Math.sin(b.rot) * 0.06, z: b.z + Math.cos(b.rot) * 0.06, face: b.rot, sitOn: SEAT_H * b.s, bg: [b.x - Math.sin(b.rot) * 5, b.z - Math.cos(b.rot) * 5] };
      else { const t = [...sc.dressing.trees].sort((a, c) => Math.hypot(a.x - home.x, a.z - home.z) - Math.hypot(c.x - home.x, c.z - home.z))[0]; S.bench = t ? { x: t.x + 1.4, z: t.z + 0.6, face: 0, bg: [t.x, t.z], tree: true } : { ...S.home, tree: true }; } }
    // 물가 (다리 아래쪽 강둑, 그물 손질)
    { const k = RIVER.findIndex(([x, z]) => Math.hypot(x - BRIDGE.x, z - BRIDGE.z) < 30 && z > BRIDGE.z + 18);
      const [x0, z0] = RIVER[Math.max(0, k)], [x1, z1] = RIVER[Math.max(1, k + 1)], [tx, tz] = unit(x1 - x0, z1 - z0), off = RIVER_HW + 0.8;
      const x = x0 + tz * off, z = z0 - tx * off; S.shore = { x, z, face: Math.atan2(-tz, tx), bg: [BRIDGE.x, BRIDGE.z] }; }
    // 골목 (전경 카메라에서도 보이는 길)
    S.lane = { path: w.path, x: w.path[0][0], z: w.path[0][1], face: 0, bg: [SITE.church.x, SITE.church.z] };
    S.green = { x: GREEN.x - 3, z: GREEN.z + GREEN.r + 1.5, face: Math.PI, bg: A.greenBg === 'shrine' ? [SITE.shrine.x, SITE.shrine.z] : [CHURCH.x, CHURCH.z] };
    // 큰 집 (estate) 자리들: 앞마당, 대청/테라스, 뒤뜰 화덕, 우물가 빨래터, 마구간
    const est = L.estate || (L.fixed && L.fixed.find((f) => f.role === 'estate'));
    if (est) {
      const eD = est.D || 14, eL = est.L || 16, eFoot = est.foot || obb(est.x, est.z, est.rot, eL / 2, eD / 2);
      const [fx, fz] = obbLocal(eFoot, 0, eD / 2 + 3.2);
      S.estate_front = { x: fx, z: fz, face: est.rot, bg: [est.x, est.z] };
      const [tx, tz] = obbLocal(eFoot, 0, eD / 2 - 0.8);
      S.estate_terrace = { x: tx, z: tz, face: est.rot, bg: [est.x, est.z] };
      const [hx, hz] = obbLocal(eFoot, -eL / 4, -eD / 2 - 2.2);
      S.estate_hearth = { x: hx, z: hz, face: est.rot + Math.PI, bg: [est.x, est.z] };
      const well = (L.fixed && L.fixed.find((f) => f.role === 'well')) || { x: 2, z: -14, rot: 0.3 };
      const [wx, wz] = [well.x + 1.8, well.z + 0.8];
      S.estate_wash = { x: wx, z: wz, face: toward(wx, wz, well.x, well.z), bg: [est.x, est.z] };
      const store = (L.fixed && L.fixed.find((f) => f.role === 'store')) || { x: 26, z: -20, rot: -Math.PI / 2 };
      const [sx, sz] = [store.x - 2.5, store.z];
      S.estate_stable = { x: sx, z: sz, face: toward(sx, sz, store.x, store.z), bg: [store.x, store.z] };
    }
    return S;
  }

  // ── 내 사람이 지금 하는 일: 나이·올해의 패·집안 → 자리·동작·곁 사람 ──
  // 농사 전 야영: 수수한 옷 (CAMP_SWAP) · 그 밖에는 시대 옷 (ERA_SWAP: 조선 전 갓·두루마기 없음, 에도 전 넓은 오비·하오리 없음). peopleplan.js dressVariant
  const dress = (v, b) => (W && W.sc ? dressVariant(v, { flavor: W.sc.flavor, year: b.year, camp: !!W.sc.recipe.camp }) : v);
  const meVariant = (b, age) => dress(meVariant0(b, age), b);
  const meVariant0 = (b, age) => {
    const m = b.sex !== 'f', h = b.household;
    if (age < 13) return 'child';
    if (age >= 60) return m ? 'elder' : 'f_cloak';
    if (m) return h === 'farm' || h === 'herd' || h === 'band' ? 'm_field' : h === 'craft' || h === 'factory' ? 'm_smith' : h === 'elite' || h === 'pro' ? 'm_hood' : 'm_tunic';
    return h === 'elite' || h === 'trade' || h === 'shop' || h === 'pro' || h === 'office' ? 'f_cloak' : 'f_apron';
  };
  const meScale = (a) => (a < 3 ? 0.4 + a * 0.05 : a < 13 ? lerp(0.52, 0.68, (a - 3) / 10) : a < 18 ? lerp(0.9, 0.98, (a - 13) / 5) : a >= 60 ? 0.97 : 1);
  function activity() {
    const a = st.age, b = st.birth, S = W.spots, h = b.household, m = b.sex !== 'f';
    const stage = a < 13 ? 'child' : a < 60 ? 'grown' : 'old';
    let f = st.focus || 'work';
    if (a < 6) f = a < 3 || a % 2 === 0 ? 'family' : 'body';
    // 곁 사람 (가족): 내 나이에 맞춰 부모·짝·아이·손주
    const fam = () => (stage === 'child' ? [['f_apron', 'talk'], [m ? 'm_field' : 'm_tunic', 'talk'], ['child', 'stand']]
      : stage === 'grown' ? (a < 22 ? [['f_apron', 'talk'], ['elder', 'talk']] : [[m ? 'f_apron' : 'm_tunic', 'talk'], ['child', 'stand'], ['elder', 'talk']])
        : [[m ? 'f_cloak' : 'elder', 'talk'], [m ? 'm_tunic' : 'f_apron', 'talk'], ['child', 'stand']]);
    // 큰 집 (estate) 환경의 귀족(elite)과 하인(serve)
    if ((W.sc.setting === 'estate' || W.sc.recipe.setting === 'estate') && S.estate_front) {
      if (h === 'elite') {
        if (f === 'family') return { key: 'estate_front', spot: S.estate_front, action: a < 3 ? 'stand' : 'talk', mates: fam() };
        if (f === 'learn') return { key: 'estate_terrace', spot: S.estate_terrace, action: 'talk', mates: a < 13 ? [['m_hood', 'talk'], ['child', 'stand']] : [['m_hood', 'talk']] };
        if (f === 'rest') return { key: 'estate_terrace', spot: S.estate_terrace, action: a < 13 ? 'stand' : 'sit' };
        if (f === 'body') return { key: 'estate_front', spot: S.estate_front, action: 'walk' };
        return { key: 'estate_front', spot: S.estate_front, action: 'talk', mates: [['m_tunic', 'talk']] };
      }
      if (h === 'serve') {
        if (f === 'family') return { key: 'family', spot: S.home, action: a < 3 ? 'stand' : 'talk', mates: fam() };
        if (f === 'rest') return S.bench.tree || a < 13 ? { key: 'tree', spot: S.bench, action: 'stand' } : { key: 'bench', spot: S.bench, action: 'sit' };
        if (f === 'body') return { key: 'lane', spot: S.lane, action: 'carry' };
        if (f === 'learn') return { key: 'garden', spot: S.estate_hearth || S.garden, action: 'kneel' };
        if (stage !== 'grown') return { key: 'garden', spot: S.estate_hearth || S.garden, action: 'kneel' };
        if (m) {
          return (a % 2 === 0)
            ? { key: 'stable', spot: S.estate_stable || S.lane, action: 'kneel' }
            : { key: 'carry', spot: S.lane, action: 'carry' };
        } else {
          return (a % 2 === 0)
            ? { key: 'hearth', spot: S.estate_hearth || S.garden, action: 'kneel' }
            : { key: 'wash', spot: S.estate_wash || S.shore, action: 'kneel' };
        }
      }
    }
    if (f === 'family') return { key: 'family', spot: S.home, action: a < 3 ? 'stand' : 'talk', mates: fam() };
    if (f === 'body') return { key: 'lane', spot: S.lane, action: 'walk' };   // 노인은 굽은 등·지팡이로 천천히
    if (f === 'rest') return S.bench.tree || a < 13 ? { key: 'tree', spot: S.bench, action: 'stand' } : { key: 'bench', spot: S.bench, action: 'sit' };
    if (f === 'learn') return { key: 'church', spot: S.church, action: 'talk', mates: a < 13 ? [['m_hood', 'talk'], ['child', 'stand']] : [['m_hood', 'talk']] };
    // 일: 집안에 따라 (아이는 집안 돕기 = 텃밭, 노인은 소일거리 = 텃밭)
    if (stage !== 'grown') return { key: 'garden', spot: S.garden, action: 'kneel' };
    if (h === 'farm' || h === 'herd' || h === 'band') return { key: 'field', spot: S.field, action: W.sc.recipe.camp ? 'kneel' : 'hoe' };   // 농사 전 야영: 들에서 캐고 줍는다
    if (h === 'craft' || h === 'factory') return { key: 'forge', spot: S.forge, action: 'kneel' };
    if (h === 'trade' || h === 'shop') return { key: 'market', spot: S.market, action: 'talk', mates: [['f_cloak', 'talk', S.market.mate]] };
    if (h === 'fish' || h === 'sail') return { key: 'shore', spot: S.shore, action: 'kneel' };
    if (h === 'serve') return { key: 'lane', spot: S.lane, action: 'carry' };
    return { key: 'green', spot: S.green, action: 'talk', mates: [['m_hood', 'talk']] };   // elite·pro·office: 빈터에서 이야기
  }
  function mePalette(seed, k, sc = W && W.sc) {
    const r = rng((seed ^ 0x51ed27) + k * 7919), pick = (a) => a[Math.floor(r() * a.length)], PAL = paletteOf(sc ? sc.kit : 'england', sc && sc.flavor, !!(sc && sc.recipe.camp));
    const [s0, sr] = sc ? sc.recipe.activity.meSkin : [0.92, 0.12], s = s0 + r() * sr;
    return { prim: pick(PAL.dyes), sec: pick(PAL.plain), hair: pick(PAL.hairs), skin: [s * 1.02, s, s * 0.97], nat: 0.95 + r() * 0.1, linen: pick(PAL.linens) };
  }
  function spawnMe(force) {
    if (!W || !W.meReady || !st.birth) return;
    const a = st.age, b = st.birth, variant = meVariant(b, a), scale = meScale(a);
    const act = st.campOn ? { key: 'camp', spot: { x: W.campSeat[0], z: W.campSeat[1], face: W.campSeat[2] }, action: a >= 13 && a < 60 ? 'kneel' : 'stand' } : activity();
    // 다시 세우는 열쇠: 변형·자리·동작·곁 사람. 크기만 바뀌면 (해마다 자라는 아이) 그 자리에서 크기만 바꾼다 (곁 사람을 해마다 다시 세우지 않는다)
    const key = [variant, act.key, act.action, (act.mates || []).map((m) => m[0] + m[1]).join(',')].join('|');
    if (key === st.meKey && !force) {
      const P0 = W.me.people[0];
      if (P0 && Math.abs(P0.obj.scale.x - scale) > 1e-3) { P0.obj.scale.setScalar(scale); P0.p.scale = scale; }
      return;
    }
    const moved = st.meKey.split('|')[1] !== act.key;
    st.meKey = key; W.act = act;
    const pal = mePalette(W.seed, 0); if (a >= 60) pal.hair = [0.7, 0.68, 0.65];
    const sp = act.spot, bg = sp.bg || [VC.x, VC.z], [cdx, cdz] = unit(sp.x - bg[0], sp.z - bg[1]), cAz = Math.atan2(cdx, cdz);   // cAz: 내 자리에서 카메라 쪽 방위 (closePose 와 같다)
    // 얼굴 방향: 곁 사람과 이야기할 때·괭이질은 카메라에 옆얼굴(조금 앞)이 보이게, 그 밖은 자리의 방향
    // 곁 사람은 카메라에서 100° 남짓 돌아간 쪽(옆·조금 뒤)에 서고, 나는 그쪽을 보되 카메라 쪽으로 조금 돌아 3/4 얼굴이 보인다
    // (아이는 어른 곁 사람이 카메라 앞을 가리지 않게 더 뒤쪽·멀리)
    //   아이: 곁 어른은 아이 뒤(카메라 반대쪽 150° 남짓)에 모여 선다 → 아이가 앞에서 크게, 어른은 뒤에서 화면 가운데 쪽에 머리까지 (오른쪽 두루마리 밑으로 가지 않게)
    const small = a < 13, side = cAz + (small ? 2.75 : 1.8), face = act.mates && !act.mates[0][2] ? cAz + (small ? 1.2 : 1.15) : act.action === 'hoe' ? cAz + 1.75 : sp.face;
    const p = { id: 0, variant, action: act.action, place: 'you', speed: a >= 60 ? 0.62 : a < 13 ? 1.15 : 1.05, phase: 0.3, scale, palette: pal, x: sp.x, z: sp.z, face };
    if (act.action === 'walk' || act.action === 'carry') { p.path = sp.path || W.path; p.x = p.path[0][0]; p.z = p.path[0][1]; }
    if (act.action === 'sit') p.sitOn = sp.sitOn ?? 0.45;
    const plan = [p];
    let gx = sp.x, gz = sp.z;
    (act.mates || []).forEach(([v, ac, at], i) => {   // 곁 사람: 내가 보는 쪽에 둥글게 서서 나를 본다 (카메라와 나 사이를 가리지 않게)
      const ang = side + (i - ((act.mates.length - 1) / 2)) * (small ? 0.36 : 0.5), rad = small ? (v === 'child' ? 1.6 : 2.0) : v === 'child' ? 1.45 : 1.75;
      const x = at ? at.x : sp.x + Math.sin(ang) * rad, z = at ? at.z : sp.z + Math.cos(ang) * rad;
      gx += x; gz += z;
      const pl = mePalette(W.seed, i + 1); if (v === 'elder') pl.hair = [0.7, 0.68, 0.65];
      plan.push({ id: i + 1, variant: dress(v, b), action: ac, place: 'mate', x, z, face: at ? at.face : Math.atan2(sp.x - x, sp.z - z), speed: 0, phase: 0.2 + i * 0.27, scale: v === 'child' ? (a < 13 ? 0.62 : 0.58) : 1, palette: pl });
    });
    act.group = act.mates ? [gx / plan.length, gz / plan.length] : null;
    // 곁 사람도 가림 검사에 넣는다 (카메라가 돌아가도 가족이 나를 가리지 않게)
    act.blk = plan.slice(1).map((q) => ({ o: obb(q.x, q.z, 0, 0.4, 0.4), top: q.scale > 0.8 ? 1.85 : 1.2 }));
    // 남아시아: 뒤뜰 소품이 크다 (쇠똥 떡 더미·볏짚 가리·베틀·흙 담) — 가까운 높은 소품도 가림 검사에 넣어 아이·무릎 꿇은 사람을 가리지 않게
    const TB = W.sc.recipe.activity.tallBlock;
    if (TB) for (const it of W.sc.dressing.items) {
      const d = W.sc.propDims[it.p], s = it.s || 1;
      if (d && d[2] * s > TB && Math.hypot(it.x - sp.x, it.z - sp.z) < 7) act.blk.push({ o: obb(it.x, it.z, it.rot || 0, d[0] / 2 * s, d[1] / 2 * s), top: d[2] * s });
    }
    st.colDa = 0;
    try { W.me.spawn(plan, W.sc.groundAt); W.me.step(0, W.sc.camera); } catch (e) { warn('내 사람', e); }   // 걷는 사람은 첫 걸음에 자리를 잡으니 바로 한 번
    if (moved) st.rate = 1.4;   // 자리를 옮기면 카메라가 천천히 따라간다
  }
  const meObj = () => (W && W.me.people[0] ? W.me.people[0].obj : null);

  // ── 모닥불 ──
  function buildFire(sc) {
    const g = new THREE.Group(), mats = [], geos = [];
    const logMat = fogify(new THREE.MeshStandardMaterial({ color: 0x3b2817, roughness: 1 })), stoneMat = fogify(new THREE.MeshStandardMaterial({ color: 0x77716a, roughness: 0.95 }));
    mats.push(logMat, stoneMat);
    const logs = [];
    for (let i = 0; i < 6; i++) {   // 장작: 가운데로 기대 세운 원뿔 꼴 넷 + 바닥에 눕힌 둘
      const c = new THREE.CylinderGeometry(0.055, 0.075, 0.95, 7), a = i / 6 * Math.PI * 2;
      if (i < 4) { c.translate(0, 0.475, 0); c.rotateZ(0.62); c.rotateY(a); c.translate(Math.cos(a) * 0.38, 0, -Math.sin(a) * 0.38); }
      else { c.rotateZ(Math.PI / 2); c.rotateY(a + 0.4); c.translate(0, 0.07, 0); }
      logs.push(c.toNonIndexed()); c.dispose();
    }
    const logGeo = mergeGeometries(logs); logs.forEach((c) => c.dispose()); geos.push(logGeo);
    const lm = new THREE.Mesh(logGeo, logMat); lm.castShadow = true; lm.receiveShadow = true; g.add(lm);
    const stones = [], sr = rng(4242);
    for (let i = 0; i < 11; i++) { const s = new THREE.DodecahedronGeometry(0.12 + sr() * 0.05, 0), a = i / 11 * Math.PI * 2; s.scale(1.2, 0.7, 1); s.rotateY(sr() * 6); s.translate(Math.cos(a) * 0.62, 0.05, Math.sin(a) * 0.62); stones.push(s); }
    const stoneGeo = mergeGeometries(stones.map((s) => (s.index ? s.toNonIndexed() : s))); stones.forEach((s) => s.dispose()); geos.push(stoneGeo);
    const sm = new THREE.Mesh(stoneGeo, stoneMat); sm.castShadow = true; sm.receiveShadow = true; g.add(sm);
    const bedMat = new THREE.MeshBasicMaterial({ map: glowTex(), color: new THREE.Color(2.6, 0.75, 0.16), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const bed = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.3), bedMat); bed.rotation.x = -Math.PI / 2; bed.position.y = 0.06; g.add(bed); mats.push(bedMat); geos.push(bed.geometry);
    const haloMat = new THREE.SpriteMaterial({ map: glowTex(), color: new THREE.Color(1.6, 0.6, 0.18), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.5 });
    const halo = new THREE.Sprite(haloMat); halo.scale.set(4.5, 4.5, 1); halo.position.y = 0.8; g.add(halo); mats.push(haloMat);
    const flames = makeParticles(56), sparks = makeParticles(26);
    g.add(flames.pts, sparks.pts); mats.push(flames.mat, sparks.mat); geos.push(flames.geo, sparks.geo);
    const fr = rng(99);
    const fl = Array.from({ length: flames.n }, () => ({ t: fr(), life: 0.5 + fr() * 0.5, x: (fr() - 0.5) * 0.4, z: (fr() - 0.5) * 0.4, h: 0.8 + fr() * 0.8, ph: fr() * 6.28, s: 0.35 + fr() * 0.3 }));
    const sp = Array.from({ length: sparks.n }, () => ({ t: fr(), life: 1.2 + fr() * 1.4, x: (fr() - 0.5) * 0.3, z: (fr() - 0.5) * 0.3, h: 2.5 + fr() * 3, dx: (fr() - 0.5) * 1.2, dz: (fr() - 0.5) * 1.2, ph: fr() * 6.28 }));
    g.visible = false; sc.scene.add(g);
    // 점광원은 늘 장면에 둔다 (켜고 끌 때 빛 수가 바뀌면 모든 셰이더를 다시 짠다) — 꺼짐 = 세기 0
    const light = new THREE.PointLight(0xff8a3c, 0, 18, 2); light.position.y = 0.9;
    const lightHolder = new THREE.Group(); lightHolder.add(light); sc.scene.add(lightHolder);
    return { g, light, lightHolder, flames, sparks, fl, sp, bed, halo, mats, geos };
  }
  function stepFire(F, dt, t) {
    const on = st.campOn;
    F.g.visible = on;
    if (!on) { F.light.intensity = 0; return; }
    const n = 0.5 + 0.25 * Math.sin(t * 11.3) + 0.15 * Math.sin(t * 23.1 + 1.7) + 0.1 * Math.sin(t * 41.7 + 0.3);
    F.light.intensity = 26 * (0.82 + 0.36 * n);
    F.halo.material.opacity = 0.42 + 0.16 * n; F.bed.material.opacity = 0.8 + 0.2 * n;
    const { flames, sparks } = F;
    F.fl.forEach((p, i) => {
      p.t += dt / p.life; if (p.t >= 1) { p.t %= 1; p.x = (Math.random() - 0.5) * 0.42; p.z = (Math.random() - 0.5) * 0.42; }
      const q = p.t, k = 1 - q * 0.75;
      flames.pos[i * 3] = p.x * k + Math.sin(t * 6 + p.ph) * 0.05 * q; flames.pos[i * 3 + 1] = 0.12 + q * p.h; flames.pos[i * 3 + 2] = p.z * k + Math.cos(t * 5 + p.ph) * 0.05 * q;
      const r = lerp(3.6, 2.2, q), gg = lerp(2.4, 0.5, Math.min(1, q * 1.3)), b = lerp(0.9, 0.06, Math.min(1, q * 2));
      flames.col.set([r, gg, b, smooth(0, 0.12, q) * Math.pow(1 - q, 1.3) * 0.85], i * 4);
      flames.size[i] = p.s * (1 - 0.65 * q) * (0.85 + 0.3 * n);
    });
    F.sp.forEach((p, i) => {
      p.t += dt / p.life; if (p.t >= 1) { p.t %= 1; p.dx = (Math.random() - 0.5) * 1.2; p.dz = (Math.random() - 0.5) * 1.2; }
      const q = p.t;
      sparks.pos[i * 3] = p.x + p.dx * q + Math.sin(t * 3 + p.ph) * 0.15 * q; sparks.pos[i * 3 + 1] = 0.3 + q * p.h; sparks.pos[i * 3 + 2] = p.z + p.dz * q;
      sparks.col.set([4.5, 1.7, 0.35, (1 - q) * (0.6 + 0.4 * Math.sin(t * 20 + p.ph * 3))], i * 4);
      sparks.size[i] = 0.045;
    });
    for (const P of [flames, sparks]) { P.geo.attributes.position.needsUpdate = true; P.geo.attributes.aCol.needsUpdate = true; P.geo.attributes.aSize.needsUpdate = true; }
  }
  // 앞 생의 푸른 불씨 사람: 사람 하나를 세우고 몸을 푸른 반투명 빛으로 바꾼다
  function spawnGhost() {
    if (!W || !W.meReady) return;
    const [x, z, f] = W.ghostSeat;
    try {
      W.ghost.spawn([{ id: 0, variant: 'm_hood', action: 'stand', place: 'ghost', x, z, face: f, speed: 0, phase: 0.6, scale: 1, palette: { prim: [0.5, 0.5, 0.5], sec: [0.5, 0.5, 0.5], hair: [0.5, 0.5, 0.5], skin: [1, 1, 1], nat: 1, linen: [0.6, 0.6, 0.6] } }], W.sc.groundAt);
      const P = W.ghost.people[0];
      P.obj.traverse((o) => { if (o.isMesh) { o.material = W.ghostMat; o.castShadow = false; o.receiveShadow = false; o.renderOrder = 2; } });
      P.obj.add(W.ghostGlow);
    } catch (e) { warn('불씨 사람', e); }
  }

  // 장면을 못 지으면: 캔버스를 비우고 숨긴 뒤 무대 칸의 「글로만 진행」 안내(.no3d)를 띄운다 (앞 생의 마지막 그림이 남지 않게). 다음 생이 지어지면 되돌린다
  function showStage(ok) {
    const fb = canvas.parentElement && canvas.parentElement.querySelector('.no3d');
    if (ok) { if (st.failed) { canvas.hidden = false; if (fb) fb.hidden = true; st.failed = false; } return; }
    try { renderer.setRenderTarget(null); renderer.setViewport(0, 0, canvas.width, canvas.height); renderer.setClearColor(0x121329, 1); renderer.clear(); } catch (e) { /* 그리개가 망가졌어도 숨기기는 한다 */ }
    canvas.hidden = true; if (fb) fb.hidden = false; st.failed = true;
  }

  // ── 장면 갈아 끼우기 ──
  function detach() {
    if (!W) return;
    for (const r of rises.slice()) endRise(r);
    W.me.dispose(); W.ghost.dispose();
    W.sc.scene.remove(W.fire.g, W.fire.lightHolder, W.glow, W.aura);
    for (const m of W.fire.mats) m.dispose();
    for (const g of W.fire.geos) g.dispose();
    W.ghostMat.dispose(); W.ghostGlow.material.dispose(); W.glow.geometry.dispose(); W.glow.material.dispose(); W.aura.material.dispose();
    W = null;
  }
  // 짓다가 던지면 반쯤 지은 장면을 풀고 다시 던진다 (setLife 가 받아 글로만 진행하는 화면으로)
  function build(birth) {
    let made = null;
    try { buildInto(birth, (sc) => { made = sc; }); } catch (e) {
      if (made && !(W && W.sc === made)) { try { made.dispose(); } catch (e2) { /* 이미 망가진 장면 */ } }
      W = null;
      throw e;
    }
  }
  function buildInto(birth, made) {
    const stage = stageOf(birth), seed = stageSeed(birth);
    const sc = createRealScene(canvas, { renderer, seed, land: stage.land, quality, kit: sceneKitOf(stage), autoStart: false, pixelRatio: 1, timeOfDay: st.time, view: 'overview', era: birth.year, region: birth.region, area: stage.variant, setting: stage.setting, household: birth.household });
    made(sc);
    if (st.failNext) { st.failNext = false; throw new Error('확인용: 장면 짓기를 일부러 실패시킴 (debugFailNext)'); }
    const w = { sc, stage, seed, meReady: false };
    w.blk = blockersOf(sc); w.blkM = blockersOf(sc, true);
    w.path = homePath(sc, w.blk);
    const camDir = [GAME_CAM.pos[0] - GAME_CAM.look[0], GAME_CAM.pos[2] - GAME_CAM.look[2]], cl = Math.hypot(camDir[0], camDir[1]);
    w.camDir = [camDir[0] / cl, camDir[1] / cl];
    // 모닥불: 장터 빈터. 카메라는 불이 보이는 쪽에서, 내 사람은 카메라 쪽 오른편에, 푸른 불씨는 건너편에
    const [fx, fz] = fireSpot(sc), fy = sc.heightAt(fx, fz);
    w.fireAt = [fx, fy, fz];
    w.campDir = clearDir(sc, w.blkM, fx, fy, fz, w.camDir, 7.2, 3.0, [...sc.layout.stalls, ...sc.layout.awnings].map((a) => [a.x, a.z]));
    const cd = w.campDir, side = [-cd[1], cd[0]];
    const seat = [fx + cd[0] * 1.3 - side[0] * 0.75, fz + cd[1] * 1.3 - side[1] * 0.75];
    w.campSeat = [seat[0], seat[1], Math.atan2(fx - seat[0], fz - seat[1])];
    const gs = [fx - cd[0] * 1.9 + side[0] * 0.5, fz - cd[1] * 1.9 + side[1] * 0.5];
    w.ghostSeat = [gs[0], gs[1], Math.atan2(fx - gs[0], fz - gs[1])];
    w.fire = buildFire(sc); w.fire.g.position.set(fx, fy, fz); w.fire.lightHolder.position.set(fx, fy, fz);
    const peopleOpts = { url: sc.peopleUrl, animUrl: ASSET + 'people/anims.glb', fogify, envI: () => sc.state.envI };   // 내 사람·곁 사람도 세트(·갈래)의 옷
    w.me = createPeople(sc.scene, peopleOpts); w.ghost = createPeople(sc.scene, peopleOpts);
    w.ghostMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.45, 0.75, 1.6), transparent: true, opacity: 0.38, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    w.ghostGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: new THREE.Color(0.5, 0.8, 1.8), transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    w.ghostGlow.scale.set(2.6, 2.6, 1); w.ghostGlow.position.y = 1.1;
    // 내 사람의 은은한 빛: 발밑 금빛 웅덩이 + 몸 둘레 빛 (전경에서 마을 가운데의 나를 찾기 쉽게. 가까이 볼 때는 거의 끈다)
    w.glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: glowTex(), color: new THREE.Color(2.2, 1.55, 0.7), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    w.glow.rotation.x = -Math.PI / 2; w.glow.scale.set(6, 6, 1); w.glow.visible = false; w.glow.renderOrder = 1;
    w.aura = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: new THREE.Color(1.5, 1.15, 0.65), transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    w.aura.scale.set(3.2, 3.2, 1); w.aura.visible = false;
    sc.scene.add(w.glow, w.aura);
    w.cam = { pos: new THREE.Vector3(), look: new THREE.Vector3(), tgt: null };
    gamePose(w.cam.pos, w.cam.look, sc, 0);
    W = w;
    // 사람 자산이 오면: 장면의 마을 사람(괭이질·걸상 자리)을 본 뒤 내 사람 자리를 정하고 세운다
    Promise.all([w.me.ready, sc.people.ready]).then(() => {
      if (W !== w) return;
      w.spots = planSpots(sc, w); w.meReady = true; st.meKey = ''; spawnMe(true); if (st.campOn && st.ghostOn) spawnGhost();
    }).catch((e) => { if (W === w) warn('사람', e); });
    sc.ready.then(() => {
      if (W !== w) return;
      const i = sc.info();
      for (const [k, v] of [['건물 세트', i.kit.err], ['소품 세트', i.props.err], ['나무', i.trees.err], ['마을 사람', i.people.err]]) if (v) warn(k, v);
    }).catch((e) => { if (W === w) warn('무대', e); });
  }

  // ── 시각 ──
  function setTimeGoal(name) {
    const goal = PHASE_TIME[name] ?? PHASE_TIME.noon;
    const d = ((goal - st.time) % 24 + 36) % 24 - 12;   // 둥근 시계에서 가까운 쪽으로 (해질녘 → 한낮은 거꾸로, 밤 → 새벽은 앞으로)
    if (Math.abs(d) < 1e-3) { st.tr = null; return; }
    if (st.fast || !W) { st.time = ((st.time + d) % 24 + 24) % 24; st.tr = null; if (W) W.sc.setTime(st.time); return; }
    // 두 끝의 안개 색만 지금 한 번 읽고(GPU 를 기다리는 읽기는 여기 한 번), 넘어가는 동안은 섞은 색을 준다. 하늘 환경광(PMREM, 읽기 없음)은 0.4초마다
    const goalT = ((st.time + d) % 24 + 24) % 24;
    st.tr = { from: st.time, d, t: 0, dur: Math.min(3.2, 1.4 + Math.abs(d) * 0.18), a: W.sc.skyColors(), b: W.sc.skyColorsAt(goalT) };
  }
  const _mix = { fogC: new THREE.Color(), sunSide: new THREE.Color() };
  function stepTime(dt) {
    if (!st.tr || !W) return;
    const tr = st.tr; tr.t = Math.min(1, tr.t + dt / tr.dur);
    const e = tr.t * tr.t * (3 - 2 * tr.t);
    st.time = ((tr.from + tr.d * e) % 24 + 24) % 24;
    _mix.fogC.copy(tr.a.fogC).lerp(tr.b.fogC, e); _mix.sunSide.copy(tr.a.sunSide).lerp(tr.b.sunSide, e);
    const now = performance.now(), full = tr.t >= 1 || now - st.fullAt > 400;
    W.sc.setTime(st.time, { light: !full, colors: _mix });
    if (full) st.fullAt = now;
    if (tr.t >= 1) st.tr = null;
  }

  // ── 카메라 ──
  const _p = new THREE.Vector3(), _l = new THREE.Vector3(), _t = new THREE.Vector3(), _c = new THREE.Vector3();
  function gamePose(out, look, sc = W.sc, sway = STAGE_SWAY * Math.sin(st.phi)) {
    const a = sway;
    const camSpec = (sc && sc.env && sc.env.overview) || GAME_CAM;
    const lx = camSpec.look[0], lz = camSpec.look[2], ly = camSpec.look[1] + sc.heightAt(lx, lz);
    const dx = camSpec.pos[0] - lx, dz = camSpec.pos[2] - lz, c = Math.cos(a), s = Math.sin(a);
    out.set(lx + dx * c + dz * s, camSpec.pos[1] + sc.heightAt(camSpec.pos[0], camSpec.pos[2]), lz - dx * s + dz * c);
    look.set(lx, ly, lz);
  }
  // 내 사람 가까이: 사람 키의 3.4배쯤 떨어져 눈높이보다 조금 위에서. 바탕(bg: 마을·교회) 쪽을 보게 사람 건너편에 선다. 벽에 막히면 당기거나 돌린다
  function closePose(out, look, dt) {
    const me = meObj(); if (!me || !W.act) return false;
    const h = HEIGHT * me.scale.y;
    _t.set(me.position.x, me.position.y + h * 0.6, me.position.z);
    if (!W.cam.tgt) W.cam.tgt = _t.clone(); else W.cam.tgt.lerp(_t, 1 - Math.exp(-dt * 4));   // 걷는 사람을 부드럽게 따라간다
    const T = W.cam.tgt, sp = W.act.spot, bg = sp.bg || [VC.x, VC.z], grp = W.act.group;
    if (grp && h >= 1.2) { T.x = lerp(T.x, grp[0], 0.03); T.z = lerp(T.z, grp[1], 0.03); }   // 곁 사람이 있으면 무리 가운데 쪽으로 조금 (아기·아이는 그대로 가운데)
    const [bx, bz] = unit(sp.x - bg[0], sp.z - bg[1]);
    const base = Math.atan2(bx, bz) + (grp ? 0.18 : 0.35) * Math.sin(st.phi * 0.4) + st.user.yaw;   // 천천히 둘레를 오간다 (tick 마다 더, 무리일 때는 덜) + 끌기
    // 아기·아이(키 1.2 m 아래): 거리를 키에 맞춰 2.2~3.4 m (화면 높이의 40% 남짓).
    //   곁 어른이 있으면 카메라를 거의 수평(어른 허리 높이)으로 낮추고 보는 점을 0.95 m 로 올린다 → 아이가 주인공으로 크게, 뒤에 선 어른 머리도 화면 안에
    const small = h < 1.2;
    if (small && grp) T.y = Math.max(T.y, me.position.y + 0.95);
    const pitch = THREE.MathUtils.clamp((small ? (grp ? 0.08 : 0.28) : 0.2) + st.user.pitch, -0.05, 0.9);
    const d0 = small ? THREE.MathUtils.clamp(THREE.MathUtils.clamp(3.2 * h, 2.2, 3.4) * (grp ? 1.12 : 1) * st.user.zoom, 2, 15)
      : THREE.MathUtils.clamp(Math.max(3.2 * h + 0.6, grp ? 5.4 : 0) * (grp ? 1.05 : 1) * st.user.zoom, 3, 15);   // 어른: 화면 높이의 37~39%
    const chestY = me.position.y + h * 0.5;   // 곁 사람 가림 검사는 내 사람 가슴으로
    // 가림: 지난번에 쓴 방향부터, 거리를 줄여 보고, 안 되면 좌우로 돌린다
    const tries = [st.colDa, 0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.5, -1.5, 2.1, -2.1];
    let ok = false;
    for (const da of tries) {
      for (const k of [1, 0.78, 0.6]) {
        const d = Math.max(small ? 1.8 : 2.2, d0 * k), az = base + da;
        _c.set(T.x + Math.sin(az) * Math.cos(pitch) * d, T.y + Math.sin(pitch) * d, T.z + Math.cos(az) * Math.cos(pitch) * d);
        if (!inBlock(W.blkM, _c.x, _c.z, 0.6) && seen(W.sc, W.blkM, _c, T.x, T.y, T.z, 0.6) && (!W.act.blk || seen(W.sc, W.act.blk, _c, me.position.x, chestY, me.position.z, 0.5))) { ok = true; st.colDa = da; break; }
      }
      if (ok) break;
    }
    if (!ok) _c.set(T.x + Math.sin(base) * d0, T.y + Math.sin(pitch) * d0, T.z + Math.cos(base) * d0);
    _c.y = Math.max(_c.y, W.sc.groundAt(_c.x, _c.z) + 0.7);
    out.copy(_c); look.copy(T);
    return true;
  }
  // 모닥불: 내 사람과 불을 함께 (불씨 사람까지), 무리가 화면 왼쪽 40% 쯤 (오른쪽은 모닥불 종이 판)
  function campPose(out, look) {
    const [fx, fy, fz] = W.fireAt, [cx, cz] = W.campDir, a = 0.08 * Math.sin(st.phi * 0.5) + st.user.yaw * 0.5;
    const dx = cx * Math.cos(a) + cz * Math.sin(a), dz = -cx * Math.sin(a) + cz * Math.cos(a);
    const mx = (fx + W.campSeat[0]) / 2, mz = (fz + W.campSeat[1]) / 2, d = 7.0 * THREE.MathUtils.clamp(st.user.zoom, 0.7, 1.6);
    out.set(mx + dx * d, fy + 3.0, mz + dz * d);
    look.set(mx + dz * 1.35, fy + 0.75, mz - dx * 1.35);
  }
  function applyOffset(cam, lift, shiftX) {
    const w = canvas.clientWidth || 1600, h = canvas.clientHeight || 900;
    if (lift > 0.002 || Math.abs(shiftX) > 0.002) cam.setViewOffset(w, h, shiftX * w, lift * h * 0.4, w, h); else if (cam.view && cam.view.enabled) cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }
  function stepCamera(dt) {
    const cam = W.sc.camera;
    st.phi += dt * (0.045 + st.spin); st.spin *= Math.pow(0.5, dt);   // 늘 아주 천천히 + 해가 넘어갈 때(tick) 조금 더
    st.liftNow += (st.lift - st.liftNow) * (st.fast ? 1 : Math.min(1, dt * 1.6));
    // 탄생 전경: 보류 시간을 깎는 것과 가까운 시점으로 넘어가는 조건을 나눈다 (사람 자산이 보류보다 늦게 와도, 오는 순간 넘어간다)
    if (st.mode === 'wide' && !st.dying) {
      if (st.wideHold > 0) st.wideHold -= dt;
      if (st.wideHold <= 0 && W.meReady && meObj()) { st.mode = 'close'; st.rate = 0.9; st.user = { yaw: 0, pitch: 0, zoom: st.user.zoom }; }
    }
    let mode = st.campOn ? 'camp' : st.mode;
    if (mode === 'close' && !closePose(_p, _l, dt)) mode = 'wide';
    if (mode === 'camp') campPose(_p, _l);
    if (mode === 'wide') gamePose(_p, _l);
    st.rate = Math.min(4, st.rate + dt * 0.8);   // 시점이 바뀐 뒤 천천히 → 따라가기는 빠르게
    const k = st.fast ? 1 : 1 - Math.exp(-dt * st.rate);
    W.cam.pos.lerp(_p, k); W.cam.look.lerp(_l, k);
    cam.position.copy(W.cam.pos); cam.lookAt(W.cam.look);
    st.wideW += ((mode === 'wide' ? 1 : 0) - st.wideW) * Math.min(1, dt * 1.5);
    cam.fov = lerp(40, GAME_CAM.fov, st.wideW);
    applyOffset(cam, st.liftNow * (mode === 'camp' ? 0.4 : 1), mode === 'close' && st.lift > 0 ? 0.035 * (1 - st.wideW) : 0);   // 가까이 볼 때는 오른쪽 두루마리를 비켜 조금 왼쪽에
  }
  function setMode(m, rate = 1.2) { if (st.mode !== m) { st.mode = m; st.rate = rate; } }

  // ── 끌기·휠 (가까운 시점에서만. HUD 위에서 시작한 끌기는 캔버스에 오지 않는다) ──
  let drag = null;
  canvas.style.cursor = 'grab';
  const canSteer = () => W && (st.campOn || st.mode === 'close');   // 전경(탄생·죽음)일 때는 끌기·휠을 받지 않는다 (쌓였다가 가까운 시점에서 갑자기 튀지 않게)
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 || !canSteer()) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    st.user.yaw -= (e.clientX - drag.x) * 0.006; st.user.pitch = THREE.MathUtils.clamp(st.user.pitch + (e.clientY - drag.y) * 0.004, -0.25, 0.7);
    drag.x = e.clientX; drag.y = e.clientY; st.rate = Math.max(st.rate, 3.5);
  });
  const endDrag = (e) => { if (drag && e.pointerId === drag.id) { drag = null; canvas.style.cursor = 'grab'; } };
  canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
  canvas.addEventListener('wheel', (e) => {
    if (!canSteer()) return;
    e.preventDefault();
    st.user.zoom = THREE.MathUtils.clamp(st.user.zoom * Math.exp(e.deltaY * 0.0012), 0.45, 2.6);
  }, { passive: false });

  // ── 죽는 해의 불씨 ──
  const RISE_MS = 2600;
  function endRise(r) {
    const i = rises.indexOf(r); if (i < 0) return;
    rises.splice(i, 1); clearTimeout(r.timer);
    for (const s of r.parts) { if (s.parent) s.parent.remove(s); s.material.dispose(); }
    r.done();
  }
  function flameRise() {
    const me = meObj();
    if (st.fast || reduced() || !W || !me) return Promise.resolve();
    st.dying = true; setMode('wide', 1.1);   // 마을 전경으로 물러나며 불씨가 떠오른다
    return new Promise((done) => {
      const mk = (col, size, op) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: col, transparent: true, opacity: op, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, fog: false, sizeAttenuation: false })); s.scale.set(size, size, 1); s.renderOrder = 5; W.sc.scene.add(s); return s; };
      const parts = [mk(new THREE.Color(2.4, 2.4, 2.3), 0.026, 1), mk(new THREE.Color(1.0, 0.95, 0.85), 0.07, 0.55)];
      for (let i = 0; i < 6; i++) parts.push(mk(new THREE.Color(1.8, 1.65, 1.35), 0.009 + 0.003 * (i % 3), 0.8));
      const r = { parts, x: me.position.x, z: me.position.z, y0: me.position.y + HEIGHT * me.scale.y, t0: performance.now(), done };
      r.timer = setTimeout(() => endRise(r), RISE_MS);   // 그리기가 멈춰도 끝난다
      rises.push(r);
      stepRises(r.t0);
    });
  }
  function stepRises(now) {
    for (const r of rises) {
      const q = Math.min(1, (now - r.t0) / RISE_MS), rise = (qq) => r.y0 + 30 * qq * qq * (1.5 - 0.5 * qq);
      r.parts.forEach((s, i) => {
        if (i < 2) { s.position.set(r.x, rise(q), r.z); s.material.opacity = (i ? 0.7 : 1) * (1 - q * q); return; }
        const qq = Math.max(0, q - (i - 1) * 0.04);
        s.position.set(r.x + Math.sin(i * 2.3 + q * 6) * 0.5, rise(qq), r.z + Math.cos(i * 1.7 + q * 5) * 0.5);
        s.material.opacity = qq > 0 ? 0.8 * (1 - q) : 0;
      });
    }
  }

  // ── 돌리기 ──
  let last = performance.now();
  function frame(now) {
    requestAnimationFrame(frame);
    // dt: 움직임(사람·불꽃)용, 0.1 초까지 · rdt: 시각·카메라 넘어가기용 실제 시간 (창이 가려져 프레임이 드물어도 제때 끝나게), 0.5 초까지
    const rdt = Math.min(0.5, Math.max(0, (now - last) / 1000)), dt = Math.min(0.1, rdt); last = now;
    if (!W || !canvas.clientWidth || document.hidden) return;   // 숨겨진 동안은 그리지 않는다
    const t = now / 1000;
    stepTime(rdt);
    const me = meObj(), cam = W.sc.camera;
    W.me.step(dt, cam);
    stepCamera(rdt);
    if (st.campOn && st.ghostOn) W.ghost.step(dt, cam);
    W.glow.visible = W.aura.visible = !!me && st.wideW > 0.02;
    if (me && W.glow.visible) {   // 내 사람 빛: 전경일 때만 (한낮의 밝은 풀밭에서도 보이게 해가 높을수록 세게)
      W.glow.position.set(me.position.x, me.position.y + 0.14, me.position.z);
      W.aura.position.set(me.position.x, me.position.y + 1.0 * me.scale.y, me.position.z);
      const pulse = 0.85 + 0.15 * Math.sin(t * 1.7), gain = (1 + 2.4 * smooth(-2, 30, W.sc.state.el ?? 30)) * pulse * st.wideW;
      W.glow.material.color.setRGB(1.0 * gain, 0.72 * gain, 0.33 * gain); W.aura.material.color.setRGB(0.6 * gain, 0.46 * gain, 0.26 * gain);
    }
    if (W.ghost.people[0]) W.ghost.people[0].obj.position.y = W.sc.groundAt(W.ghostSeat[0], W.ghostSeat[1]) + 0.12 + 0.08 * Math.sin(t * 2.1);
    stepFire(W.fire, dt, t);
    const ps = (canvas.clientHeight || 900) / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
    W.fire.flames.mat.uniforms.uScale.value = ps; W.fire.sparks.mat.uniforms.uScale.value = ps;
    stepRises(now);
    W.sc.renderFrame(dt);
    frameTimes.push(rdt * 1000); if (frameTimes.length > 600) frameTimes.shift();
  }
  requestAnimationFrame(frame);

  return {
    get fast() { return st.fast; },
    set fast(v) { st.fast = !!v; },
    preload(birth) { preloadAssets(birth); },
    setKit() {},   // KayKit 육각 섬 시절의 이름 (실사 무대는 생마다 세트를 스스로 부른다)
    setLife(birth) {
      Object.assign(st, { birth, age: 0, year: birth.year, focus: null, campOn: false, ghostOn: false, meKey: '', tr: null, time: PHASE_TIME.night, phi: 0, spin: 0, mode: 'wide', wideHold: WIDE_HOLD, rate: 1.2, wideW: 1, dying: false, colDa: 0 });
      st.user = { yaw: 0, pitch: 0, zoom: 1 };
      st.lifeErr = new Set(); if (note) note.hidden = true;   // 새 생: 앞 생의 알림은 거둔다 (이번 생에 다시 실패하면 다시 뜬다)
      const old = W ? W.sc : null;
      try { detach(); } catch (e) { W = null; console.warn('한 영혼의 여정 무대: 앞 생 물건을 풀다 멈춤', e); }
      if (old) { try { old.dispose(); } catch (e) { console.warn('한 영혼의 여정 무대: 앞 장면을 풀다 멈춤', e); } }
      try { build(birth); showStage(true); } catch (e) { console.warn('한 영혼의 여정 무대: 장면을 짓지 못해 글로만 진행한다', e); st.errors.push('무대: ' + String((e && e.message) || e)); showStage(false); }
      st.kitNow = stageOf(birth).kit;
    },
    // 나이·해: 내 사람 크기·옷·걸음·하는 일. 시대가 바뀌면 세트 이름을 다시 정한다 (1단계는 잉글랜드 세트 하나라 그림은 그대로)
    setAge(age, year) {
      st.age = age; if (year != null) st.year = year;
      if (st.birth) st.kitNow = stageOf({ ...st.birth, year: st.year }).kit;
      spawnMe(false);
    },
    // 올해의 패 (work·learn·family·body·rest, 고르지 않았으면 main 이 정한 저절로 값) → 내 사람이 하는 일·자리
    setFocus(id) { st.focus = id || null; spawnMe(false); },
    setPhase(name) { setTimeGoal(name); },
    // 모닥불 (5·15·30·50·70살): 켜면 불 + 내 사람이 불가에 + 카메라가 사람과 불을 함께. ghost 면 건너편에 앞 생의 푸른 불씨. 끄면 되돌린다
    setCampfire(on, ghost = false) {
      const was = st.campOn;
      st.campOn = !!on; st.ghostOn = !!(on && ghost);
      if (was !== st.campOn) st.rate = 1.0;
      if (!W) return;
      spawnMe(false);
      if (st.ghostOn) spawnGhost(); else W.ghost.clear();
    },
    flameRise,
    setView(o) { st.lift = THREE.MathUtils.clamp(Number(o && o.lift) || 0, 0, 0.3); },
    tick() { st.spin = Math.min(0.9, st.spin + 0.3); },
    // 족보·나누기 그림 (320×180 JPEG). HUD 를 피한 lift 없이 찍은 뒤 지금 화면을 되돌린다
    snapshot() {
      if (!W || !canvas.width) return null;
      const cam = W.sc.camera, v = cam.view && cam.view.enabled ? { ...cam.view } : null;
      applyOffset(cam, 0, 0); W.sc.renderFrame(0);
      const c = document.createElement('canvas'); c.width = 320; c.height = 180;
      const s = renderer.domElement, sw = s.width, sh = s.height;
      let w = sw, h = sw / (16 / 9); if (h > sh) { h = sh; w = sh * (16 / 9); }
      c.getContext('2d').drawImage(s, (sw - w) / 2, (sh - h) / 2, w, h, 0, 0, 320, 180);
      if (v) { cam.setViewOffset(v.fullWidth, v.fullHeight, v.offsetX, v.offsetY, v.width, v.height); cam.updateProjectionMatrix(); }
      W.sc.renderFrame(0);
      return c.toDataURL('image/jpeg', 0.78);
    },
    // 지금 생의 무대를 다 지었는가 (건물·소품·나무·마을 사람 + 내 사람). 실패해도 끝난 것으로 본다 (main.js 「마을을 짓는 중…」 표시)
    whenReady() {
      const w = W;
      if (!w) return Promise.resolve();
      return Promise.allSettled([w.sc.ready, w.me.ready]).then(() => undefined);
    },
    setQuality(q) {
      if (q !== 'high' && q !== 'normal') return;
      quality = q; try { localStorage.setItem(QUALITY_KEY, JSON.stringify(q)); } catch (e) { /* 저장 못 해도 지금 장면에는 쓴다 */ }
      if (W) W.sc.setQuality(q);
    },
    rafStats() { const a = [...frameTimes].sort((x, y) => x - y); return { avg: a.reduce((s, x) => s + x, 0) / (a.length || 1), p50: a[Math.floor(a.length / 2)], p95: a[Math.floor(a.length * 0.95)], n: a.length }; },
    resetStats() { frameTimes.length = 0; },
    info() { return { stage: W ? { ...W.stage, seed: W.seed, kitNow: st.kitNow } : null, quality, time: st.time, moving: !!st.tr, mode: st.campOn ? 'camp' : st.mode, act: W && W.act ? { key: W.act.key, action: W.act.action } : null, focus: st.focus, errors: [...st.errors], scene: W ? W.sc.info() : null }; },
    get scene() { return W ? W.sc : null; },
    // 화면 확인용 (콘솔): 시점 바꾸기 'wide' | 'close', 전경 카메라 { pos, look, fov }
    // 화면 확인용 (콘솔): 다음 생의 장면 짓기를 한 번 일부러 실패시킨다 (글로만 진행 화면으로 넘어가는지 확인)
    debugFailNext() { st.failNext = true; },
    debugView(m) { if (m === 'wide' || m === 'close') { st.wideHold = 0; setMode(m, 2); } return st.mode; },
    debugCam(c) { if (c) Object.assign(GAME_CAM, c); return { ...GAME_CAM }; },
  };
}
