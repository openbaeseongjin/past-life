// 마을 사람 (실사 장면) — 옷 입은 변형 8명(villagers.glb, tools/blender/kit_clothes.py) + UAL 동작(anims.glb) + 코드 덧씌우기.
// createPeople(scene, { url, animUrl, fogify(mat, key), envI() }) → { ready, spawn(plan, groundAt), step(dt, camera), info, clear(), dispose() }
//   plan 은 peopleplan.js 의 planPeople 결과 (시드로 정한 변형·동작·자리·경로·물감). groundAt(x, z) → 땅(다리 위 포함) 높이.
// 동작 → UAL 동작 (+ 코드):
//   walk Walk_Loop (노인은 Walk_Formal_Loop + 굽은 등 + 지팡이) · stand Idle_Loop · talk Idle_Talking_Loop · kneel Fixing_Kneeling · sit Sitting_*_Loop
//   hammer Idle_Torch_Loop(왼손을 가슴 앞에 든 자세) + 오른팔 내리치기(팔 겨누기) + 망치
//   carry Walk_Loop(왼팔 뺌) + Idle_Torch_Loop 왼팔(어깨 자루를 받친 손) + 자루 · hoe Idle_Loop + 허리 굽힘 + 두 팔 내리찍기(2뼈 IK) + 괭이
// 성능: 한 사람 그리기 2번(살·옷 재질), 가까이(28 m) LOD0 ~9k 삼각형, 멀리 LOD1 ~2k, 220 m 밖은 그리지 않는다.
//   뼈 계산은 지역 회전을 곱해 뼈대 공간에서 한다 (사람마다 updateMatrixWorld 를 부르지 않는다). 경계 구를 정해 화면 밖 사람은 그리지 않는다.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/addons/utils/SkeletonUtils.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const NEAR = 28, FAR = 220;
// 천 종류별 생지 색 (sRGB): 리넨(사람마다 palette.linen 으로 바꾼다)·모직·가죽·짚
const NATURAL = [[0.7, 0.66, 0.56], [0.6, 0.55, 0.48], [0.36, 0.22, 0.13], [0.86, 0.72, 0.44]];
const NEAR_GAP = 1.5;          // LOD 전환 완충 (28 m ± 1.5 m)
const HAIR_GAIN = 1.7;      // 머리카락 텍스처가 밝은 회색이라 물감을 키운다

const cache = new Map();
function loadAssets(url, animUrl) {
  const key = url + '|' + animUrl;
  if (cache.has(key)) return cache.get(key);
  const p = (async () => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    const [g, ga] = await Promise.all([loader.loadAsync(url), loader.loadAsync(animUrl)]);
    const variants = new Map(), props = new Map(), mats = {};
    for (const o of g.scene.children) {
      if (o.name.startsWith('v_')) variants.set(o.name.slice(2), o);
      else if (o.name.startsWith('prop_')) props.set(o.name.slice(5), o);
    }
    for (const root of variants.values()) root.traverse((o) => { if (o.isMesh) mats[o.material.name] = o.material; });   // 사람 몸의 재질 (소품 것 말고)
    for (const pr of props.values()) pr.traverse((o) => { if (o.isMesh && !mats[o.material.name]) mats[o.material.name] = o.material; });
    if (mats.people_cloth?.map) { mats.people_cloth.map.colorSpace = THREE.NoColorSpace; mats.people_cloth.map.needsUpdate = true; }   // 결 묶음은 색이 아니다
    // GLTFLoader 는 같은 이름의 노드에 _1, _2 … 를 붙인다 (변형마다 뼈 이름이 같다). 동작 곡선이 이름으로 뼈를 찾으므로 원래 이름으로 되돌린다
    const canon = new Set(); ga.scene.traverse((o) => canon.add(o.name));
    for (const root of variants.values()) root.traverse((o) => { if (o.isBone && !canon.has(o.name)) { const b = o.name.replace(/_\d+$/, ''); if (canon.has(b)) o.name = b; } });
    const clips = Object.fromEntries(ga.animations.map((c) => [c.name, c]));
    const ualPelvis = ga.scene.getObjectByName('pelvis').position.clone();
    // 몸(남·여)마다 골반 이동 곡선을 제 쉼 자세 높이로 옮긴다 (UAL 마네킹과 골반 높이가 다르다)
    const fam = {};
    for (const [name, root] of variants) {
      const f = name.startsWith('f_') ? 'f' : 'm';
      if (fam[f]) continue;
      const d = root.getObjectByName('pelvis').position.clone().sub(ualPelvis);
      const out = {};
      for (const [cn, c] of Object.entries(clips)) {
        const k = c.clone();
        for (const t of k.tracks) if (t.name === 'pelvis.position') for (let i = 0; i < t.values.length; i += 3) { t.values[i] += d.x; t.values[i + 1] += d.y; t.values[i + 2] += d.z; }
        out[cn] = k;
      }
      // 들기: 걷기에서 왼팔을 빼고, 횃불 든 왼팔(Idle_Torch_Loop)을 따로 (어깨에 멘 자루를 받친다)
      const LARM = /^(?:(?:clavicle|upperarm|lowerarm|hand)_l|(?:index|middle|pinky|ring|thumb)_0\d(?:_leaf)?_l)\./;
      out.carry_body = new THREE.AnimationClip('carry_body', out.Walk_Loop.duration, out.Walk_Loop.tracks.filter((t) => !LARM.test(t.name)));
      out.carry_arm = new THREE.AnimationClip('carry_arm', out.Idle_Torch_Loop.duration, out.Idle_Torch_Loop.tracks.filter((t) => LARM.test(t.name)));
      // 텃밭 손질: Fixing_Kneeling 앞부분(서 있다 무릎 꿇기)을 빼고 무릎 꿇은 부분만 오간다
      out.kneel = THREE.AnimationUtils.subclip(out.Fixing_Kneeling, 'kneel', 30, 124, 24);
      // 앉은 동작의 엉덩이 높이 (골반 - 0.09): 걸상 높이에 맞춘다
      const pt = out.Sitting_Idle_Loop.tracks.find((t) => t.name === 'pelvis.position');
      out.seatH = (pt ? pt.values[2] : 0.5) - 0.09;
      fam[f] = out;
    }
    return { variants, props, mats, fam };
  })();
  cache.set(key, p);
  p.catch(() => cache.delete(key));
  return p;
}
// 수정 1차 (I-3): 사람 glb 캐시는 최근 두 장면(세대)이 쓴 것만 남긴다. 장면(realscene.js)이 짓기 전에 쓸 주소에 세대를 적고 sweepPeople 로 나머지를 푼다.
const cacheGen = new Map();
export function touchPeople(url, animUrl, gen) { cacheGen.set(url + '|' + animUrl, gen); }
export const peopleCacheSize = () => cache.size;
export function preloadPeople(url, animUrl) { return loadAssets(url, animUrl).catch(() => null); }
function disposeAssets(a) {
  const seen = new Set();
  const drop = (root) => root.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry?.dispose();
    for (const m of [].concat(o.material || [])) {
      if (seen.has(m)) continue; seen.add(m);
      for (const k of Object.keys(m)) if (m[k] && m[k].isTexture) m[k].dispose();
      m.dispose();
    }
  });
  for (const r of a.variants.values()) drop(r);
  for (const r of a.props.values()) drop(r);
}
export function sweepPeople(minGen) {
  let n = 0;
  for (const [key, p] of [...cache]) {
    if ((cacheGen.get(key) ?? -1) >= minGen) continue;
    cache.delete(key); cacheGen.delete(key); n++;
    p.then(disposeAssets).catch(() => {});
  }
  return n;
}

// ── 뼈대 공간 계산 (지역 TRS 를 곱한다: 행렬 갱신 없이) ──
const _p = new THREE.Vector3(), _a = new THREE.Vector3(), _w = new THREE.Vector3(), _v = new THREE.Vector3();
const _q = new THREE.Quaternion(), _qp = new THREE.Quaternion(), _dq = new THREE.Quaternion(), _qa = new THREE.Quaternion();
function charQ(bone, out) { out.copy(bone.quaternion); for (let b = bone.parent; b && b.isBone; b = b.parent) out.premultiply(b.quaternion); return out; }
function parentQ(bone, out) { return bone.parent && bone.parent.isBone ? charQ(bone.parent, out) : out.identity(); }
function charP(bone, out) {
  const chain = []; for (let b = bone; b && b.isBone; b = b.parent) chain.push(b);
  out.set(0, 0, 0); _qa.identity();
  for (let i = chain.length - 1; i >= 0; i--) { out.add(_v.copy(chain[i].position).applyQuaternion(_qa)); _qa.multiply(chain[i].quaternion); }
  return out;
}
// 뼈를 target(뼈대 공간 점)으로 겨눈다: 뼈 축 = 자식 뼈 쪽
function aim(bone, child, target) {
  charP(bone, _p); charQ(bone, _q);
  _a.copy(child.position).normalize().applyQuaternion(_q);
  _w.subVectors(target, _p).normalize();
  _dq.setFromUnitVectors(_a, _w);
  _q.premultiply(_dq);
  bone.quaternion.copy(parentQ(bone, _qp).invert().multiply(_q));
}
// 뼈대 공간 축(axis) 둘레로 뼈를 돌린다 (굽은 등)
function bend(bone, axis, ang) {
  charQ(bone, _q); _dq.setFromAxisAngle(axis, ang); _q.premultiply(_dq);
  bone.quaternion.copy(parentQ(bone, _qp).invert().multiply(_q));
}
// 2뼈 IK: 어깨 S 에서 손 T 로 (윗팔 a, 아래팔 b), 팔꿈치는 pole 쪽
const _d = new THREE.Vector3(), _pl = new THREE.Vector3();
function ik2(S, T, a, b, pole, E, T2) {
  _d.subVectors(T, S); let d = _d.length(); _d.normalize();
  d = Math.min(a + b - 1e-3, Math.max(Math.abs(a - b) + 1e-3, d));
  const x = (a * a - b * b + d * d) / (2 * d), h = Math.sqrt(Math.max(0, a * a - x * x));
  _pl.copy(pole).addScaledVector(_d, -pole.dot(_d)).normalize();
  E.copy(S).addScaledVector(_d, x).addScaledVector(_pl, h);
  T2.copy(S).addScaledVector(_d, d);
}
const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0);
// 덧씌우기가 손대는 뼈 (믹서 전에 되돌린다)
const OVER = ['spine_01', 'spine_02', 'neck_01', 'Head', 'upperarm_r', 'lowerarm_r', 'upperarm_l', 'lowerarm_l'];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const V = (x, y, z) => new THREE.Vector3(x, y, z);
// 망치질 (뼈대 공간: 앞 +Z, 위 +Y, 오른쪽 -X; 어깨 기준). Blender 미리보기(kit_clothes.py HAMMER_*)와 같은 생각
// 망치질 (뼈대 공간 절대 자리, 발 = 원점): 오른손을 머리 옆으로 들었다(hUp) 모루 윗면(앞 0.45 m, 높이 0.8 m)으로 내리친다.
//   gUp·gDn = 자루 방향 (망치 머리는 자루 끝 0.32 m), 팔꿈치는 바깥 아래(pole). kit_clothes.py 미리보기(HAMMER_*)와 같은 값
const HAM = { hUp: V(-0.3, 1.72, -0.02), gUp: V(0.05, 0.8, -0.6).normalize(), headDn: V(-0.05, 0.85, 0.45), gDn: V(0.03, -0.5, 0.87).normalize(), pole: V(-0.75, -0.25, -0.35) };
HAM.hDn = HAM.headDn.clone().addScaledVector(HAM.gDn, -0.32);
// 괭이질 (뼈대 공간 절대 자리): 오른손(아래 손잡이) R, 왼손(위) L — 들기 / 찍기
const HOE = { rUp: V(-0.08, 1.48, 0.36), lUp: V(0.0, 1.28, 0.12), rDn: V(-0.1, 0.8, 0.46), lDn: V(0.0, 1.02, 0.2), poleR: V(-0.6, -0.4, -0.3), poleL: V(0.6, -0.4, -0.3) };
const _S = new THREE.Vector3(), _E = new THREE.Vector3(), _T = new THREE.Vector3(), _H = new THREE.Vector3(), _G = new THREE.Vector3(), _L = new THREE.Vector3(), _R = new THREE.Vector3();
const _m = new THREE.Matrix4(), _xb = new THREE.Vector3(), _zb = new THREE.Vector3();
// 소품 자세: 자루(+Y) = handle, 소품 Z = zHint 쪽
function orient(prop, pos, handle, zHint) {
  _zb.copy(zHint).addScaledVector(handle, -zHint.dot(handle)).normalize();
  _xb.crossVectors(handle, _zb);
  _m.makeBasis(_xb, handle, _zb);
  prop.quaternion.setFromRotationMatrix(_m); prop.position.copy(pos);
}

export function createPeople(scene, opts) {
  const fogify = opts.fogify || ((m) => m);
  const people = [];
  const info = { count: 0, ok: false, err: null, near: 0, far: 0, hidden: 0, stepMs: null, variants: {}, actions: {} };
  let A = null;
  const ready = loadAssets(opts.url, opts.animUrl).then((a) => { A = a; info.ok = true; return a; });

  function skinMat(base, pal) {
    const m = base.clone();
    m.vertexColors = true;
    const U = { uHair: { value: new THREE.Color().setRGB(...pal.hair, THREE.SRGBColorSpace).multiplyScalar(HAIR_GAIN) }, uSkin: { value: new THREE.Color().setRGB(...pal.skin) } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uHair; uniform vec3 uSkin;')
        .replace('#include <color_fragment>', '#ifdef USE_COLOR_ALPHA\n diffuseColor.rgb *= vColor.r * uHair + vColor.g * uSkin + vColor.b;\n#endif')
        .replace('#include <opaque_fragment>', `#include <opaque_fragment>
          vec3 V = normalize(-vViewPosition);
          float rim = pow(clamp(1.0 - dot(normal, V), 0.0, 1.0), 3.5);
          outgoingLight += outgoingLight * rim * 0.22;`);
    };
    m.envMapIntensity = opts.envI ? opts.envI() : 0.6;
    return fogify(m, 'people_skin');
  }
  function clothMat(base, pal) {
    const m = base.clone();
    m.side = THREE.DoubleSide;
    m.vertexColors = true;
    const c = (rgb, k = 1) => new THREE.Color().setRGB(...rgb, THREE.SRGBColorSpace).multiplyScalar(k);
    const U = { uPrim: { value: c(pal.prim) }, uSec: { value: c(pal.sec) }, uNat: { value: NATURAL.map((n, i) => (i === 0 && pal.linen ? c(pal.linen) : c(n, pal.nat))) } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      // PCOL = 정점색 RGBA (RGB 칸만 있으면 A = 0 = 리넨, 정점색이 없으면 생지 리넨)
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
        uniform vec3 uPrim; uniform vec3 uSec; uniform vec3 uNat[4];
        #if defined( USE_COLOR_ALPHA )
          #define PCOL vColor
        #elif defined( USE_COLOR )
          #define PCOL vec4( vColor, 0.0 )
        #else
          #define PCOL vec4( 0.0, 0.0, 1.0, 0.0 )
        #endif`)
        // 결: RGBA = 리넨·모직·가죽·짚 (정점색 A = 천 종류), 색: 정점색 RGB = 주색·보조색·생지 칸
        .replace('#include <map_fragment>', `
          vec4 pc = PCOL;
          vec4 texel = texture2D( map, vMapUv ); float ft = pc.a;
          float det = ft < 0.17 ? texel.r : ( ft < 0.5 ? texel.g : ( ft < 0.83 ? texel.b : texel.a ) );
          vec3 nat = ft < 0.17 ? uNat[0] : ( ft < 0.5 ? uNat[1] : ( ft < 0.83 ? uNat[2] : uNat[3] ) );
          // 큰 얼룩(바램·때): 결 묶음 모직 채널을 1/8 크기로 다시 읽어 2 m 남짓한 얼룩 → 골목 거리에서도 천이 밋밋하지 않다
          float mac = texture2D( map, vMapUv * 0.13 + vec2( 0.37, 0.61 ) ).g;
          diffuseColor.rgb *= ( pc.r * uPrim + pc.g * uSec + pc.b * nat ) * det * 2.0 * ( 0.8 + 0.4 * mac );`)
        .replace('#include <color_fragment>', '')
        .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = roughness;\n if ( PCOL.a > 0.5 && PCOL.a < 0.83 ) roughnessFactor = 0.6;')
        // 노멀 묶음: RG = 짠 천 XY, BA = 가죽 XY
        .replace('#include <normal_fragment_maps>', `#if defined( USE_NORMALMAP_TANGENTSPACE )
          vec4 nt = texture2D( normalMap, vNormalMapUv );
          float fa = PCOL.a;
          bool lth = fa > 0.5 && fa < 0.83;
          vec2 nxy = ( lth ? nt.ba : nt.rg ) * 2.0 - 1.0;
          nxy *= normalScale * ( fa > 0.17 && fa < 0.5 ? 0.6 : 1.0 );
          vec3 mapN = vec3( nxy, sqrt( max( 0.0, 1.0 - dot( nxy, nxy ) ) ) );
          normal = normalize( tbn * mapN );
        #endif`)
        .replace('#include <opaque_fragment>', `#include <opaque_fragment>
          vec3 V = normalize(-vViewPosition);
          float rim = pow(clamp(1.0 - dot(normal, V), 0.0, 1.0), 3.0);
          outgoingLight += outgoingLight * rim * 0.32;`);
    };
    m.envMapIntensity = opts.envI ? opts.envI() : 0.6;
    return fogify(m, 'people_cloth');
  }
  let toolMat = null;
  let shadowMat = null;
  function getShadowMat() {
    if (shadowMat) return shadowMat;
    if (typeof document === 'undefined') return null;
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    g.addColorStop(0, 'rgba(10, 12, 18, 0.52)');
    g.addColorStop(0.5, 'rgba(10, 12, 18, 0.22)');
    g.addColorStop(1, 'rgba(10, 12, 18, 0.0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(c);
    shadowMat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    return shadowMat;
  }

  function clear() {
    for (const P of people) {
      scene.remove(P.obj); P.mixer.stopAllAction(); P.mixer.uncacheRoot(P.obj);
      for (const m of P.mats) m.dispose();
      for (const sk of P.skeletons) sk.dispose();       // 뼈 텍스처 (사람마다 복제)
      if (P.props) {
        for (const pr of Object.values(P.props)) {
          if (pr) pr.traverse((o) => {
            if (o.isMesh) {
              if (o.userData?.disposableMat && o.material) o.material.dispose();
              if (o.userData?.disposableMat && o.geometry) o.geometry.dispose();
            }
          });
        }
      }
    }
    people.length = 0;
  }

  // plan: planPeople 결과, groundAt(x, z): 땅 높이
  function spawn(plan, groundAt) {
    if (!A) throw new Error('사람 자산을 아직 불러오지 않았다 (ready 를 기다려라)');
    clear();
    info.variants = {}; info.actions = {};
    if (!toolMat && A.mats.people_tool) toolMat = fogify(A.mats.people_tool.clone(), 'people_tool');   // 캐시 원본은 건드리지 않는다
    for (const p of plan) {
      const src = A.variants.get(p.variant); if (!src) throw new Error('변형이 없다: ' + p.variant);
      const F = A.fam[p.variant.startsWith('f_') ? 'f' : 'm'];
      const obj = skeletonClone(src);
      obj.name = 'person_' + p.id;
      obj.userData = { variant: p.variant, action: p.action, place: p.place };
      const sk = skinMat(A.mats.people_skin, p.palette), cl = clothMat(A.mats.people_cloth, p.palette);
      const lod0 = [], lod1 = [];
      obj.traverse((o) => {
        if (!o.isMesh) return;
        o.material = o.material.name === 'people_cloth' ? cl : sk;
        o.castShadow = true; o.receiveShadow = true; o.layers.set(1);   // 1번 층: 물 반사에서 뺀다 (그림자·화면에는 나온다)
        o.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.95, 0), 1.35);   // 뼈대 공간 어림 (팔을 든 자세까지)
        (/_lod1/.test(o.name) || /_lod1/.test(o.parent?.name || '') ? lod1 : lod0).push(o);
      });
      for (const o of lod1) o.visible = false;
      // 한 LOD 의 두 조각(살·옷)은 같은 스킨이다: 뼈대 하나를 함께 써 뼈 행렬 계산·텍스처를 줄인다
      const skeletons = [];
      for (const group of [lod0, lod1]) {
        const first = group.find((o) => o.isSkinnedMesh);
        for (const o of group) if (o.isSkinnedMesh && o !== first) { o.skeleton.dispose(); o.bind(first.skeleton, o.bindMatrix); }
        if (first) skeletons.push(first.skeleton);
      }
      const bone = (n) => obj.getObjectByName(n);
      const B = {};
      for (const n of ['pelvis', 'spine_01', 'spine_02', 'spine_03', 'neck_01', 'Head', 'upperarm_r', 'lowerarm_r', 'hand_r', 'upperarm_l', 'lowerarm_l', 'hand_l']) B[n] = bone(n);
      // 발 밑 소프트 접지 그림자 (저사양 무그림자 모드에서도 인물이 바닥에 밀착되게)
      const sm = getShadowMat();
      if (sm) {
        const sGeo = new THREE.PlaneGeometry(0.85, 0.85);
        sGeo.rotateX(-Math.PI / 2);
        const smesh = new THREE.Mesh(sGeo, sm);
        smesh.position.y = 0.02;
        obj.add(smesh);
      }
      const armNode = B.pelvis.parent.parent;            // 뼈대 노드 (뿌리 뼈의 부모) = 뼈대 공간
      const P = { p, obj, B, armNode, lod0, lod1, skeletons, near: true, mats: [sk, cl], t: p.phase * 10, s: 0, dir: 1, props: {}, tick: p.id, acc: 0 };
      P.ua = B.lowerarm_r.position.length(); P.la = B.hand_r.position.length();
      P.over = p.action === 'hammer' || p.action === 'hoe' || p.handProp === 'hoe' || (p.variant === 'elder' && (p.action === 'walk' || p.action === 'stand' || p.action === 'talk')) || p.handProp === 'staff';
      const mixer = P.mixer = new THREE.AnimationMixer(obj);
      const play = (clip, ts = 1) => { const a = mixer.clipAction(clip); a.play(); a.timeScale = ts; a.time = p.phase * clip.duration; return a; };
      const act = p.action;
      if (act === 'walk') {
        if (p.variant === 'elder') play(F.Walk_Formal_Loop, p.speed / 0.95);
        else play(F.Walk_Loop, p.speed / 1.3);
      } else if (act === 'carry') { play(F.carry_body, p.speed / 1.3); play(F.carry_arm); }
      else if (act === 'talk') play(F.Idle_Talking_Loop, 0.9 + p.phase * 0.2);
      else if (act === 'hammer') play(F.Idle_Torch_Loop);
      else if (act === 'kneel') play(F.kneel).setLoop(THREE.LoopPingPong);
      else if (act === 'sit') play(p.phase < 0.5 ? F.Sitting_Idle_Loop : F.Sitting_Talking_Loop);
      else play(F.Idle_Loop, 0.85 + p.phase * 0.3);   // stand, hoe
      // 아이: 작게 + 머리 크게 (동작에 크기 곡선이 없다)
      obj.scale.setScalar(p.scale);
      if (p.variant === 'child') B.Head.scale.setScalar(1.22);
      // 소품은 그룹에 싸서 움직인다 (meshopt 양자화가 메시 노드에 둔 크기·자리 변환을 지키려고)
      // 자루는 천(people_cloth: 리넨 결 + 이 사람의 생지 빛), 나머지 연장은 people_tool
      const prop = (name) => {
        const s = A.props.get(name); if (!s) return null;
        const o = s.clone();
        o.traverse((m) => { if (m.isMesh) { m.material = m.material.name === 'people_cloth' ? cl : toolMat; m.castShadow = true; m.layers.set(1); } });
        const g = new THREE.Group(); g.add(o); return g;
      };
      // 0비용 절차적 기본 도형 소품 생성 (GLTF 자산에 없는 책/두루마리, 봇짐, 지팡이 등)
      const makeProceduralProp = (type) => {
        if (type === 'book') {
          const g = new THREE.Group();
          const geo = new THREE.BoxGeometry(0.12, 0.16, 0.035);
          const mat = new THREE.MeshLambertMaterial({ color: 0x4a2a16 });
          const m = new THREE.Mesh(geo, mat);
          m.userData = { disposableMat: true };
          m.castShadow = true; m.layers.set(1);
          g.add(m);
          return g;
        }
        if (type === 'pack' || type === 'sack') {
          const g = new THREE.Group();
          const geo = new THREE.BoxGeometry(0.22, 0.28, 0.16);
          const mat = cl || new THREE.MeshLambertMaterial({ color: 0x7a6b56 });
          const m = new THREE.Mesh(geo, mat);
          m.userData = { disposableMat: !cl };
          m.castShadow = true; m.layers.set(1);
          g.add(m);
          return g;
        }
        if (type === 'staff') {
          const g = new THREE.Group();
          const geo = new THREE.CylinderGeometry(0.015, 0.018, 1.05, 6);
          const mat = toolMat || new THREE.MeshLambertMaterial({ color: 0x5c4033 });
          const m = new THREE.Mesh(geo, mat);
          m.userData = { disposableMat: !toolMat };
          m.castShadow = true; m.layers.set(1);
          g.add(m);
          return g;
        }
        if (type === 'hoe') {
          const g = new THREE.Group();
          const hGeo = new THREE.CylinderGeometry(0.014, 0.016, 0.85, 6);
          const hMat = new THREE.MeshLambertMaterial({ color: 0x6e4a2e });
          const hm = new THREE.Mesh(hGeo, hMat); hm.userData = { disposableMat: true };
          hm.castShadow = true; hm.layers.set(1);
          const bGeo = new THREE.BoxGeometry(0.05, 0.12, 0.02);
          bGeo.translate(0, 0.42, 0.05);
          const bMat = toolMat || new THREE.MeshLambertMaterial({ color: 0x444444 });
          const bm = new THREE.Mesh(bGeo, bMat); bm.userData = { disposableMat: !toolMat };
          bm.castShadow = true; bm.layers.set(1);
          g.add(hm); g.add(bm);
          return g;
        }
        if (type === 'sword') {
          const g = new THREE.Group();
          const bladeGeo = new THREE.BoxGeometry(0.035, 0.62, 0.014);
          const bladeMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.8 });
          const blade = new THREE.Mesh(bladeGeo, bladeMat);
          blade.position.y = 0.3; blade.userData = { disposableMat: true };
          blade.castShadow = true; blade.layers.set(1); g.add(blade);
          const guardGeo = new THREE.BoxGeometry(0.12, 0.02, 0.035);
          const guardMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
          const guard = new THREE.Mesh(guardGeo, guardMat);
          guard.userData = { disposableMat: true }; g.add(guard);
          const hiltGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.13, 6);
          const hiltMat = new THREE.MeshLambertMaterial({ color: 0x5a3d28 });
          const hilt = new THREE.Mesh(hiltGeo, hiltMat);
          hilt.position.y = -0.065; hilt.userData = { disposableMat: true }; g.add(hilt);
          return g;
        }
        if (type === 'hammer') {
          const g = new THREE.Group();
          const handleGeo = new THREE.CylinderGeometry(0.015, 0.018, 0.42, 6);
          const handleMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
          const handle = new THREE.Mesh(handleGeo, handleMat);
          handle.userData = { disposableMat: true }; handle.castShadow = true; handle.layers.set(1); g.add(handle);
          const headGeo = new THREE.BoxGeometry(0.11, 0.065, 0.065);
          const headMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.7 });
          const head = new THREE.Mesh(headGeo, headMat);
          head.position.y = 0.18; head.userData = { disposableMat: true };
          head.castShadow = true; head.layers.set(1); g.add(head);
          return g;
        }
        if (type === 'flute') {
          const g = new THREE.Group();
          const geo = new THREE.CylinderGeometry(0.012, 0.014, 0.42, 8);
          const mat = new THREE.MeshLambertMaterial({ color: 0x40552b });
          const m = new THREE.Mesh(geo, mat); m.userData = { disposableMat: true };
          m.castShadow = true; m.layers.set(1); g.add(m);
          return g;
        }
        if (type === 'pouch') {
          const g = new THREE.Group();
          const geo = new THREE.SphereGeometry(0.065, 7, 7);
          const mat = new THREE.MeshLambertMaterial({ color: 0x966f33 });
          const m = new THREE.Mesh(geo, mat); m.userData = { disposableMat: true };
          m.castShadow = true; m.layers.set(1); g.add(m);
          return g;
        }
        if (type === 'dagger') {
          const g = new THREE.Group();
          const bladeGeo = new THREE.BoxGeometry(0.025, 0.26, 0.01);
          const bladeMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.3, metalness: 0.8 });
          const blade = new THREE.Mesh(bladeGeo, bladeMat);
          blade.position.y = 0.13; blade.userData = { disposableMat: true }; g.add(blade);
          const hiltGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.09, 6);
          const hiltMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
          const hilt = new THREE.Mesh(hiltGeo, hiltMat);
          hilt.position.y = -0.045; hilt.userData = { disposableMat: true }; g.add(hilt);
          return g;
        }
        if (type === 'spyglass') {
          const g = new THREE.Group();
          const geo = new THREE.CylinderGeometry(0.018, 0.026, 0.32, 8);
          const mat = new THREE.MeshStandardMaterial({ color: 0xbf9b30, roughness: 0.3, metalness: 0.9 });
          const m = new THREE.Mesh(geo, mat); m.userData = { disposableMat: true }; g.add(m);
          return g;
        }
        return null;
      };
      const hProp = p.handProp;
      if (act === 'hammer') { P.props.hammer = prop('hammer'); armNode.add(P.props.hammer); }
      if (act === 'hoe' || hProp === 'hoe') { P.props.hoe = prop('hoe') || makeProceduralProp('hoe'); if (P.props.hoe) armNode.add(P.props.hoe); }
      if ((act === 'walk' && p.variant === 'elder') || hProp === 'staff') { P.props.staff = prop('staff') || makeProceduralProp('staff'); if (P.props.staff) armNode.add(P.props.staff); }
      if (act === 'carry' || hProp === 'pack') {   // 왼어깨 자루/봇짐: 등뼈(spine_03)에 붙인다
        const sack = prop('sack') || makeProceduralProp('pack');
        if (sack && !P.props.sack) {
          const rest = new THREE.Matrix4().compose(charP(B.spine_03, new THREE.Vector3()), charQ(B.spine_03, new THREE.Quaternion()), V(1, 1, 1));
          const want = new THREE.Matrix4().compose(V(0.19, charP(B.upperarm_l, new THREE.Vector3()).y + 0.1, 0.02), new THREE.Quaternion().setFromAxisAngle(Y, -Math.PI / 2), V(1, 1, 1));
          rest.invert().multiply(want).decompose(sack.position, sack.quaternion, sack.scale);
          B.spine_03.add(sack); P.props.sack = sack;
        }
      }
      if (hProp === 'book' && B.hand_r && !P.props.book) {
        const bk = prop('book') || makeProceduralProp('book');
        if (bk) {
          bk.position.set(0.04, -0.05, 0.02);
          bk.rotation.set(-0.2, 0.3, 0.1);
          B.hand_r.add(bk); P.props.book = bk;
        }
      }
      if (['sword', 'hammer', 'flute', 'pouch', 'dagger', 'spyglass'].includes(hProp) && B.hand_r && !P.props[hProp]) {
        const pr = prop(hProp) || makeProceduralProp(hProp);
        if (pr) {
          pr.position.set(0.04, -0.05, 0.02);
          pr.rotation.set(-0.2, 0.3, 0.1);
          B.hand_r.add(pr);
          P.props[hProp] = pr;
        }
      }
      if (p.headwear === 'satgat' && B.Head && !P.props.headwear) {
        const hGeo = new THREE.ConeGeometry(0.25, 0.1, 9);
        const hMat = new THREE.MeshLambertMaterial({ color: 0xbd9f67 });
        const hm = new THREE.Mesh(hGeo, hMat);
        hm.position.set(0, 0.16, 0);
        hm.userData = { disposableMat: true };
        B.Head.add(hm); P.props.headwear = hm;
      } else if (p.headwear === 'scholar_cap' && B.Head && !P.props.headwear) {
        const hGeo = new THREE.BoxGeometry(0.13, 0.11, 0.13);
        const hMat = new THREE.MeshLambertMaterial({ color: 0x222228 });
        const hm = new THREE.Mesh(hGeo, hMat);
        hm.position.set(0, 0.16, 0);
        hm.userData = { disposableMat: true };
        B.Head.add(hm); P.props.headwear = hm;
      } else if (p.headwear === 'warrior_helm' && B.Head && !P.props.headwear) {
        const hGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.12, 8);
        const hMat = new THREE.MeshStandardMaterial({ color: 0x3a3d40, metalness: 0.6, roughness: 0.4 });
        const hm = new THREE.Mesh(hGeo, hMat);
        hm.position.set(0, 0.15, 0);
        hm.userData = { disposableMat: true };
        B.Head.add(hm); P.props.headwear = hm;
      } else if (p.headwear === 'headband' && B.Head && !P.props.headwear) {
        const hGeo = new THREE.TorusGeometry(0.12, 0.018, 6, 12);
        const hMat = new THREE.MeshLambertMaterial({ color: 0xa83232 });
        const hm = new THREE.Mesh(hGeo, hMat);
        hm.rotation.x = Math.PI / 2;
        hm.position.set(0, 0.11, 0);
        hm.userData = { disposableMat: true };
        B.Head.add(hm); P.props.headwear = hm;
      } else if (p.headwear === 'monk_cowl' && B.Head && !P.props.headwear) {
        const hGeo = new THREE.SphereGeometry(0.13, 8, 8);
        const hMat = new THREE.MeshLambertMaterial({ color: 0x887b68 });
        const hm = new THREE.Mesh(hGeo, hMat);
        hm.position.set(0, 0.13, -0.02);
        hm.userData = { disposableMat: true };
        B.Head.add(hm); P.props.headwear = hm;
      }
      // 자리
      if (p.path) {
        P.path = p.path; P.cum = [0];
        for (let i = 1; i < p.path.length; i++) P.cum.push(P.cum[i - 1] + Math.hypot(p.path[i][0] - p.path[i - 1][0], p.path[i][1] - p.path[i - 1][1]));
        P.s = p.phase * P.cum[P.cum.length - 1];
      } else {
        let y = groundAt(p.x, p.z);
        if (act === 'sit') y += (p.sitOn ?? 0.45) - F.seatH * p.scale;
        obj.position.set(p.x, y, p.z); obj.rotation.y = p.face;
      }
      P.groundAt = groundAt;
      scene.add(obj); people.push(P);
      info.variants[p.variant] = (info.variants[p.variant] || 0) + 1; info.actions[act] = (info.actions[act] || 0) + 1;
    }
    info.count = people.length;
  }

  function walkStep(P, dt) {
    const pts = P.path, cum = P.cum, total = cum[cum.length - 1];
    P.s += dt * P.p.speed * P.dir;
    if (P.s > total) { P.s = total; P.dir = -1; } else if (P.s < 0) { P.s = 0; P.dir = 1; }
    let i = 0; while (i < pts.length - 2 && cum[i + 1] < P.s) i++;
    const L = cum[i + 1] - cum[i] || 1, t = (P.s - cum[i]) / L;
    const x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, z = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t;
    P.obj.position.set(x, P.groundAt(x, z), z);
    // 방향은 부드럽게 (모퉁이에서 휙 돌지 않게)
    const want = Math.atan2((pts[i + 1][0] - pts[i][0]) * P.dir, (pts[i + 1][1] - pts[i][1]) * P.dir);
    let d = want - P.obj.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d));
    P.obj.rotation.y += d * Math.min(1, dt * 5);
  }

  // 동작 위 코드 덧씌우기 (믹서가 뼈 회전을 쓴 다음)
  function overlay(P) {
    const { B, p } = P, act = p.action;
    if (act === 'hammer') {
      // 1.15초: 들기 0.45 → 멈춤 0.1 → 내리침 0.09 (빨라짐) → 모루에 댄 채 쉼
      const t = (P.t / 1.15) % 1;
      const k = t < 0.45 ? smooth(0, 0.45, t) : t < 0.55 ? 1 : t < 0.64 ? 1 - ((t - 0.55) / 0.09) ** 2 : 0;
      bend(B.spine_02, X, 0.06 + 0.14 * (1 - k));        // 내리칠 때 몸을 숙인다
      charP(B.upperarm_r, _S);
      _H.copy(HAM.hDn).lerp(HAM.hUp, k);
      ik2(_S, _H, P.ua, P.la, HAM.pole, _E, _T); aim(B.upperarm_r, B.lowerarm_r, _E); aim(B.lowerarm_r, B.hand_r, _T);
      if (P.props.hammer) {        // 주먹(손목에서 아래팔 쪽으로 7 cm)에 자루를 쥔다
        _L.subVectors(_T, _E).normalize();
        orient(P.props.hammer, _R.copy(_T).addScaledVector(_L, 0.07), _G.copy(HAM.gDn).lerp(HAM.gUp, k).normalize(), X);
      }
    } else if (act === 'hoe') {
      const t = (P.t / 1.6 + p.phase) % 1;
      const k = t < 0.45 ? smooth(0, 0.45, t) : t < 0.55 ? 1 : t < 0.65 ? 1 - ((t - 0.55) / 0.1) ** 1.5 : 0;
      bend(B.spine_01, X, 0.28 - 0.1 * k); bend(B.spine_02, X, 0.1);
      _R.copy(HOE.rDn).lerp(HOE.rUp, k); _L.copy(HOE.lDn).lerp(HOE.lUp, k);
      charP(B.upperarm_r, _S); ik2(_S, _R, P.ua, P.la, HOE.poleR, _E, _T); aim(B.upperarm_r, B.lowerarm_r, _E); aim(B.lowerarm_r, B.hand_r, _T);
      charP(B.upperarm_l, _S); ik2(_S, _L, P.ua, P.la, HOE.poleL, _E, _T); aim(B.upperarm_l, B.lowerarm_l, _E); aim(B.lowerarm_l, B.hand_l, _T);
      if (P.props.hoe) orient(P.props.hoe, _R, _G.subVectors(_R, _L).normalize(), _H.set(0, -1, -0.3));
    } else if (P.props.staff && (p.variant === 'elder' || p.handProp === 'staff')) {
      if (p.variant === 'elder') {
        bend(B.spine_01, X, 0.2); bend(B.spine_02, X, 0.14); bend(B.neck_01, X, -0.16); bend(B.Head, X, -0.1);
      }
      charP(B.upperarm_r, _S); _H.set(-0.27, 0.93 + 0.02 * Math.sin(P.t * 7), 0.3);
      ik2(_S, _H, P.ua, P.la, V(-0.5, -0.6, -0.4), _E, _T); aim(B.upperarm_r, B.lowerarm_r, _E); aim(B.lowerarm_r, B.hand_r, _T);
      P.props.staff.position.copy(_T); P.props.staff.quaternion.identity();
    }
    // 선택지 반응 등 0비용 리액션
    if (P.react) {
      P.react.t -= P.lastDt || 0.016;
      if (P.react.t <= 0) {
        P.react = null;
      } else {
        const k = Math.sin((P.react.dur - P.react.t) / P.react.dur * Math.PI);
        if (P.react.type === 'nod') {
          bend(B.neck_01, X, 0.24 * k);
          bend(B.Head, X, 0.16 * k);
        } else if (P.react.type === 'flinch') {
          bend(B.spine_02, X, -0.14 * k);
          bend(B.neck_01, X, -0.1 * k);
        }
      }
    }
  }

  const _cp = new THREE.Vector3();
  function step(dt, camera) {
    if (!people.length) return;
    const t0 = performance.now();
    _cp.copy(camera.position);
    let near = 0, far = 0, hid = 0;
    for (const P of people) {
      P.t += dt;
      if (P.path) walkStep(P, dt);
      const d = P.obj.position.distanceTo(_cp);
      const vis = d < FAR;
      if (P.obj.visible !== vis) P.obj.visible = vis;
      if (!vis) { hid++; continue; }
      const nr = P.near ? d < NEAR + NEAR_GAP : d < NEAR - NEAR_GAP;     // 완충: 28 m 근처에서 LOD 가 뚝뚝 바뀌지 않게
      if (nr !== P.near) { P.near = nr; for (const o of P.lod0) o.visible = nr; for (const o of P.lod1) o.visible = !nr; }
      if (nr) near++; else far++;
      // 먼 사람(LOD1)은 동작을 2프레임에 한 번, 아주 먼 사람(90 m~)은 3프레임에 한 번 갱신 (모은 시간으로)
      P.acc = (P.acc || 0) + dt;
      const every = nr ? 1 : d < 90 ? 2 : 3;
      if (++P.tick % every !== 0) continue;
      P.lastDt = dt * every;
      // 덧씌우기를 되돌린 뒤 믹서를 돌린다: 믹서는 값이 바뀐 곡선만 뼈에 다시 쓰므로(PropertyMixer),
      // 상수 곡선(줄인 키)의 뼈는 덧씌운 회전이 남아 프레임마다 쌓인다
      if (P.saved) for (let i = 0; i < OVER.length; i++) { const b = P.B[OVER[i]]; if (b) b.quaternion.fromArray(P.saved, i * 4); }
      P.mixer.update(P.acc); P.acc = 0;
      if (P.over || P.react) {
        P.saved = P.saved || new Float32Array(OVER.length * 4);
        for (let i = 0; i < OVER.length; i++) { const b = P.B[OVER[i]]; if (b) b.quaternion.toArray(P.saved, i * 4); }
        overlay(P);
      }
    }
    info.near = near; info.far = far; info.hidden = hid;
    info.stepMs = info.stepMs == null ? performance.now() - t0 : info.stepMs * 0.95 + (performance.now() - t0) * 0.05;   // 사람 갱신(CPU) 시간, 지수 평균
  }

  function react(type = 'nod', dur = 0.8) {
    for (const P of people) {
      P.react = { type, dur, t: dur };
    }
  }

  return { ready, spawn, step, clear, info, people, react, dispose() { clear(); } };
}
