// 3D 마을: 떠 있는 육각 섬, 시대별 건물, 사람, 나이에 따른 하늘 (설계 8장)
import * as THREE from 'three';
import { STYLES, styleFor, buildPiece, mat } from './buildings.js';
import { AREAS } from './places.js';
import { createRng } from './rng.js';

const R = 1.1547;   // KayKit 육각: 평평한 면 사이 2 (x), 뾰족한 쪽 반지름 1.1547 (z), 윗면 y=0
const hexAt = (q, r) => new THREE.Vector3(2 * (q + r / 2), 0, 1.5 * R * r);
const CELLS = [];
for (let r = -2; r <= 2; r++) for (let q = -2; q <= 2; q++) if (Math.abs(q + r) <= 2) CELLS.push([q, r]);
const HOME = [0, -1];
const HOUSE_SLOTS = [[1, -2], [-1, -1], [2, -1]];
const DECOR_SLOTS = [[0, -2], [2, -2], [-2, 0], [2, 0], [-2, 1]];
const WALK = [[1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
// 강·길 타일이 x 방향(r 이 같은 줄)으로 이어지게 돌리는 각. 화면 확인(Step 6)에서 0 이 맞는 것으로 확인했다 (π/3 · 2π/3 로 돌릴 필요 없음)
const RIVER_ROT = 0, ROAD_ROT = 0;
// 카메라가 보는 높이·거리 (섬 아랫부분까지 한 화면에 들어오게. 화면 확인에서 조정)
const FOCUS_Y = -1.1, DIST_WIDE = 20, FIT_HALF = 5.8;   // FIT_HALF: 섬 반쪽 폭(+여유). 좁은 화면은 이만큼이 가로에 들어오게 물러난다

const PHASE = {   // [하늘 위, 하늘 아래·안개, 해 색, 해 세기, 해 높이(rad), 반구광 세기]
  dawn: [0xf2b8a2, 0xfde6cf, 0xffc9a0, 1.5, 0.35, 0.7],
  morning: [0x8cc6ef, 0xdcefff, 0xfff1d8, 2.3, 0.75, 0.9],
  noon: [0x6db2f0, 0xd2e8fb, 0xffffff, 2.7, 1.15, 1.0],
  afternoon: [0xeebf78, 0xfbe3ba, 0xffd59a, 2.1, 0.6, 0.85],
  dusk: [0x7d68ad, 0xf0a985, 0xff9f6b, 1.3, 0.22, 0.6],
  night: [0x0e0f2b, 0x24265a, 0x8fa0ff, 0.45, 0.9, 0.35],
};
// 생의 시간 = 하루의 시간
export const phaseOf = (age) => (age < 13 ? 'dawn' : age < 30 ? 'morning' : age < 50 ? 'noon' : age < 65 ? 'afternoon' : 'dusk');
const SKIN = {
  east: [0xf1c9a5, 0xe8b98f, 0xd9a77c], south: [0xc68e5d, 0xb07a4f, 0x9a6740], west: [0xd9a77c, 0xc68e5d, 0xe2b48c],
  europe: [0xf3d2b8, 0xe8bf9e, 0xd9a77c], africa: [0x8a5a3b, 0x6e4630, 0x9b6744], americas: [0xc68e5d, 0xb07a4f, 0xd09a6a],
  seaoc: [0xc68e5d, 0xb98457, 0x9a6740],
};

export function createVillage(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x6b5a45, 0.9);
  const sun = new THREE.DirectionalLight(0xffffff, 2.5);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 40 });
  scene.add(hemi, sun, sun.target);
  const fog = new THREE.Fog(0xffffff, 30, 80); scene.fog = fog;

  // 하늘: 세로 그라데이션 (밤에는 별). 바뀔 때만 다시 그린다
  const skyCv = document.createElement('canvas'); skyCv.width = 256; skyCv.height = 256;
  const skyTex = new THREE.CanvasTexture(skyCv); skyTex.colorSpace = THREE.SRGBColorSpace;
  scene.background = skyTex;
  const STARS = Array.from({ length: 160 }, (_, i) => [(i * 97) % 256, (i * 57) % 170, 0.6 + ((i * 13) % 10) / 12]);
  const toGoal = (n) => { const p = PHASE[n]; return { top: new THREE.Color(p[0]), bot: new THREE.Color(p[1]), sunC: new THREE.Color(p[2]), sunI: p[3], sunH: p[4], hemiI: p[5], night: n === 'night' ? 1 : 0 }; };
  let cur = toGoal('night'), goal = toGoal('night');
  function drawSky() {
    const g = skyCv.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#' + cur.top.getHexString()); gr.addColorStop(1, '#' + cur.bot.getHexString());
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    if (cur.night > 0.05) { g.fillStyle = `rgba(255,244,220,${cur.night.toFixed(2)})`; for (const [x, y, s] of STARS) g.fillRect(x, y, s, s); }
    skyTex.needsUpdate = true;
  }
  drawSky();

  const island = new THREE.Group(), town = new THREE.Group(), folk = new THREE.Group();
  scene.add(island, town, folk);
  const puffMat = new THREE.MeshStandardMaterial({ color: 0xdedede, transparent: true, opacity: 0.6, roughness: 1 });
  const st = { kit: null, birth: null, style: null, age: 0, az: 0.6, spin: 0, dist: DIST_WIDE, el: 0.61, fast: false, lift: 0, liftNow: 0, sit: false };
  let people = [], you = null, puffs = [];
  // 다시 지을 때 버리는 조각의 geometry 를 놓아준다. KayKit 조각은 원본과 geometry 를 나눠 쓰니 건드리지 않는다.
  // 재질은 mat()·winBox 가 캐시해서 나눠 쓰는 것이라 dispose 하지 않는다
  const clear = (g) => {
    while (g.children.length) {
      const o = g.children[0];
      g.remove(o);
      if (!o.userData.kit) o.traverse((m) => { if (m.geometry) m.geometry.dispose(); if (m.isInstancedMesh) m.dispose(); });
    }
  };

  function tile(name, q, r, rot) {
    const p = hexAt(q, r);
    let o;
    if (st.kit && st.kit[name]) { o = st.kit[name].clone(true); o.userData.kit = true; }
    else {   // kit 이 없으면 육각기둥
      o = new THREE.Group();
      const top = { hex_water: 0x5fb3c9, hex_road_A: 0x9cc46b, hex_river_A: 0x9cc46b }[name] ?? 0x9cc46b;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 1, 6), mat(top)); m.position.y = name === 'hex_water' ? -0.6 : -0.5; o.add(m);
      if (name === 'hex_river_A') { const s = new THREE.Mesh(new THREE.BoxGeometry(2, 0.02, 0.6), mat(0x5fb3c9)); s.position.y = 0.01; o.add(s); }
      if (name === 'hex_road_A') { const s = new THREE.Mesh(new THREE.BoxGeometry(2, 0.02, 0.5), mat(0x8a8a80)); s.position.y = 0.01; o.add(s); }
    }
    o.traverse((m) => { if (m.isMesh) m.receiveShadow = true; });
    o.position.add(p); o.rotation.y = rot; island.add(o);
  }
  function buildIsland() {
    clear(island);
    const area = AREAS[st.birth.area], S = STYLES[st.style];
    for (const [q, r] of CELLS) {
      if (r === 2 && area.coast) tile('hex_water', q, r, 0);
      else if (r === 1 && area.river && !S.road) tile('hex_river_A', q, r, RIVER_ROT);
      else if (r === 0 && S.road) tile('hex_road_A', q, r, ROAD_ROT);
      else tile('hex_grass', q, r, 0);
    }
    const rock = new THREE.Mesh(new THREE.CylinderGeometry(5.3, 1.4, 3.6, 12), mat(0x7d5f44)); rock.position.y = -2.8; island.add(rock);
  }
  function buildTown() {
    clear(town); puffs = [];
    const S = STYLES[st.style], area = AREAS[st.birth.area];
    const put = (name, q, r, rotY, scale = 1, dz = 0) => {
      const o = buildPiece(name, S.pal, st.kit), p = hexAt(q, r);
      o.position.set(p.x, 0, p.z + dz); o.rotation.y = rotY; o.scale.multiplyScalar(scale); town.add(o);
      for (const s of o.userData.smoke || []) for (let i = 0; i < 3; i++) {
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 5), puffMat); town.add(m);
        puffs.push({ m, base: s.clone().multiplyScalar(scale).applyAxisAngle(new THREE.Vector3(0, 1, 0), rotY).add(o.position), k: i / 3 });
      }
    };
    const tags = st.birth.tags || [];
    put(S.homes[0], HOME[0], HOME[1], 0.2, tags.includes('elite') ? 1.2 : tags.includes('serve') ? 0.85 : 1);
    // 이웃집·건물은 마을 가운데를 바라보게 (KayKit 건물은 앞면이 +z. 고정 각이면 시장 앞마당이 옆 칸 풍차와 겹쳤다)
    const faceMid = (q, r) => { const p = hexAt(q, r); return Math.atan2(-p.x, -p.z); };
    HOUSE_SLOTS.forEach(([q, r], i) => put(S.homes[1 + (i % (S.homes.length - 1))], q, r, faceMid(q, r)));
    const river = area.river && !S.road;
    // 길이 있는 마을(modern): 자동차는 길 위로, 길 줄(r=0)에 놓이는 다른 장식은 길가로 비켜 세운다
    const roadCars = S.road ? [[-1, 0, 0.14], [1, 0, -0.14]] : [];
    DECOR_SLOTS.forEach(([q, r], i) => {
      if (river && r === 1) return;
      const name = S.decor[i % S.decor.length];
      if (S.road && name === 'car' && roadCars.length) { const [cq, cr, dz] = roadCars.shift(); put(name, cq, cr, 0, 1, dz); return; }
      put(name, q, r, name.startsWith('kk:building') ? faceMid(q, r) : i * 1.1, 1, S.road && r === 0 ? -0.85 : 0);
    });
    // 바다가 없으면 앞줄(r=2)에도 장식을 놓는다. 길 마을의 자동차는 풀밭에 두지 않는다
    if (!area.coast) for (const [n, q, rr, rot] of [[S.decor[1], -2, 2, 0.3], [S.decor[0], -1, 2, 0], [S.decor[2], 0, 2, 1.2]]) if (!(S.road && n === 'car')) put(n, q, rr, rot);
  }
  function person(rng, pal, skins) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.11, 0.2, 3, 8), mat(rng.pick(pal.cloth))); body.position.y = 0.23;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.11, 10, 8), mat(rng.pick(skins))); head.position.y = 0.5;
    g.add(body, head);
    if (pal.hat) { const h = new THREE.Mesh(pal.hat === 'cone' ? new THREE.ConeGeometry(0.18, 0.09, 10) : new THREE.CylinderGeometry(0.1, 0.12, 0.07, 10), mat(pal.hatColor)); h.position.y = 0.63; g.add(h); }
    g.traverse((m) => { if (m.isMesh) m.castShadow = true; });
    return g;
  }
  const walkPoint = (rng, cells) => { const [q, r] = rng.pick(cells); const p = hexAt(q, r); return new THREE.Vector3(p.x + rng.range(-0.6, 0.6), 0, p.z + rng.range(-0.6, 0.6)); };
  function buildFolk() {
    clear(folk); people = [];
    const S = STYLES[st.style], rng = createRng(st.birth.seed + '|folk'), skins = SKIN[st.birth.region];
    const walk = WALK.filter(([, r]) => !(r === 1 && AREAS[st.birth.area].river && !S.road));
    for (let i = 0; i < 6; i++) { const p = person(rng, S.pal, skins); p.position.copy(walkPoint(rng, walk)); folk.add(p); people.push({ o: p, to: walkPoint(rng, walk), wait: rng.range(0, 3), rng, walk }); }
    you = person(rng, S.pal, skins);
    you.rotation.order = 'YXZ';   // 허리 굽힘(x)이 걷는 방향(y)을 따라가게
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 24), mat(0xe2b65e, 0x8a6a20)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.02; you.add(ring);
    const hp = hexAt(HOME[0], HOME[1]); you.position.set(hp.x + 0.2, 0, hp.z + 1.0);
    folk.add(you); people.push({ o: you, to: walkPoint(rng, walk), wait: 1, rng, walk, you: true });
    applyAge();
  }
  function applyAge() {
    if (!you) return;
    const a = st.age;
    you.scale.setScalar(a < 3 ? 0.42 : a < 13 ? 0.65 : a < 20 ? 0.88 : 1);
    you.rotation.x = a >= 65 ? 0.22 : 0;
  }

  // 모닥불·불씨 (화면 다시 기획 4.6). 처음 켤 때 한 번만 만들고, 끄면 숨긴다 (다시 짓지 않으니 지오메트리가 쌓이지 않는다).
  // 섬 그룹 밖(scene)에 두어 clear() 가 건드리지 않는다
  let glowMap = null, fire = null, riseGeo = null;
  const rises = [];
  const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function glow(color, size, opacity) {   // 둥근 빛 (더하기 섞기)
    if (!glowMap) {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      glowMap = new THREE.CanvasTexture(c); glowMap.colorSpace = THREE.SRGBColorSpace;
    }
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap, color, opacity, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.set(size, size, 1);
    return s;
  }
  const flat = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
  function makeFire() {
    const group = new THREE.Group();
    const logGeo = new THREE.CylinderGeometry(0.045, 0.055, 0.52, 6);
    for (let i = 0; i < 3; i++) {   // 장작 셋을 엇갈려 눕힌다
      const m = new THREE.Mesh(logGeo, mat(0x6b4426));
      m.rotation.order = 'YXZ'; m.rotation.set(0.12 * (i - 1), (i * Math.PI) / 3, Math.PI / 2);
      m.position.y = 0.05 + i * 0.025; m.castShadow = true; group.add(m);
    }
    const stoneGeo = new THREE.DodecahedronGeometry(0.065, 0);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2, s = new THREE.Mesh(stoneGeo, mat(0x8d877c)); s.position.set(Math.cos(a) * 0.32, 0.035, Math.sin(a) * 0.32); s.rotation.set(i, i * 2, 0); group.add(s); }
    const flames = [[0.17, 0.5, 0xff9a3c, 0.9, 1], [0.1, 0.34, 0xffd36b, 1, 2]].map(([r, h, c, o, order]) => {
      const pivot = new THREE.Group(), cone = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8), flat(c, o));
      cone.position.y = h / 2; cone.renderOrder = order; pivot.add(cone); pivot.position.y = 0.08; group.add(pivot);
      return pivot;
    });
    const light = new THREE.PointLight(0xff8a3c, 2, 6); light.position.y = 0.45; group.add(light);
    const halo = glow(0xff9a3c, 1.2, 0.32); halo.position.y = 0.22; group.add(halo);
    // 앞 생의 불씨: 빛나는 방울 + 원뿔 몸, 불 건너편에서 위아래로 떠오른다
    const ghost = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.5, 12), flat(0x8fc7ff, 0.62)); body.position.y = 0.25;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 10), flat(0x8fc7ff, 0.72)); head.position.y = 0.6;
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 8), flat(0xeaf5ff, 0.95)); core.position.y = 0.6; core.renderOrder = 3;
    const wisp = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.2, 8), flat(0xd8ecff, 0.8)); wisp.position.y = 0.84;
    const gl = glow(0x8fc7ff, 0.95, 0.4); gl.position.y = 0.5;
    const gLight = new THREE.PointLight(0x8fc7ff, 0.8, 3); gLight.position.y = 0.5;
    ghost.add(body, head, core, wisp, gl, gLight); group.add(ghost);
    group.visible = false; scene.add(group);
    return { group, flames, light, ghost };
  }
  function setCampfire(on, withGhost = false) {
    if (!on) { if (fire) fire.group.visible = false; st.sit = false; return; }
    if (!fire) fire = makeFire();
    // 섬 가운데 쪽으로, 내 사람에게서 1.2 떨어진 빈 바닥 (걷는 칸은 집·장식이 없는 가운데 칸들이다)
    const p = you ? you.position : new THREE.Vector3(), d = new THREE.Vector3(-p.x, 0, -p.z);
    if (d.lengthSq() < 1e-4) d.set(1, 0, 0);
    d.normalize();
    fire.group.position.set(p.x + d.x * 1.2, 0, p.z + d.z * 1.2);
    fire.ghost.visible = !!withGhost;
    fire.ghost.position.set(d.x * 0.75, 0.1, d.z * 0.75);   // 불 건너편
    fire.group.visible = true;
    if (you) { st.sit = true; you.rotation.y = Math.atan2(d.x, d.z); }   // 불가에 멈춰 불을 본다
  }
  function endRise(r) {
    const i = rises.indexOf(r);
    if (i < 0) return;
    rises.splice(i, 1); clearTimeout(r.timer); scene.remove(r.m);
    r.m.material.dispose(); r.halo.material.dispose();   // 공 지오메트리·빛 그림은 나눠 쓴다
    r.done();
  }
  // 죽는 해: 내 사람 머리 위에서 하얀 불씨가 1.6초 동안 떠올라 사라진다
  function flameRise() {
    if (st.fast || reduced() || !you) return Promise.resolve();
    return new Promise((done) => {
      if (!riseGeo) riseGeo = new THREE.SphereGeometry(0.12, 14, 10);
      const m = new THREE.Mesh(riseGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 1, depthWrite: false }));
      const halo = glow(0xffffff, 0.9, 0.9); m.add(halo);
      m.position.copy(you.position); m.position.y += 0.82 * you.scale.y; m.scale.set(1, 1.3, 1);
      scene.add(m);
      const r = { m, halo, y0: m.position.y, t0: performance.now(), done };
      r.timer = setTimeout(() => endRise(r), 1600);   // 캔버스가 숨겨져 frame 이 멈춰도 끝난다
      rises.push(r);
    });
  }

  // 캔버스는 대시보드 가운데 칸(16:9) 안에 있다. 칸 크기를 따라간다 (숨겨져 크기가 0이면 건너뛴다)
  function resize() {
    const box = canvas.parentElement, w = box.clientWidth, h = box.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    const asp = w / h;
    camera.aspect = asp;
    st.dist = Math.max(DIST_WIDE, FIT_HALF / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * asp));
    st.el = asp < 1 ? 0.95 : 0.61;   // 세로 화면은 더 위에서 내려다본다
    fog.near = st.dist + 10; fog.far = st.dist + 60;   // 멀리 물러나도 섬에 안개가 끼지 않게
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);   // setSize 가 캔버스를 비우니 바로 한 번 그린다 (빈 화면 깜빡임 방지)
  }
  new ResizeObserver(resize).observe(canvas.parentElement);
  resize();

  const clock = new THREE.Clock();
  const diff = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b);
  // 카메라 놓기. drop: setView 로 카메라 전체를 내린 거리 (섬이 화면 위쪽에 온다). snapshot 은 drop 0 으로 찍는다
  const liftDrop = () => st.liftNow * FIT_HALF * 1.6;
  function placeCamera(drop) {
    camera.position.set(Math.sin(st.az) * st.dist * Math.cos(st.el), st.dist * Math.sin(st.el) + FOCUS_Y - drop, Math.cos(st.az) * st.dist * Math.cos(st.el));
    camera.lookAt(0, FOCUS_Y - drop, 0);
  }
  function frame() {
    const dt = Math.min(0.05, clock.getDelta()), now = performance.now();
    if (!canvas.clientWidth) { requestAnimationFrame(frame); return; }   // 숨겨진 동안은 그리지 않는다
    const k = st.fast ? 1 : Math.min(1, dt * 1.6);
    const moving = diff(cur.top, goal.top) + diff(cur.bot, goal.bot) + Math.abs(cur.night - goal.night) > 0.004;
    cur.top.lerp(goal.top, k); cur.bot.lerp(goal.bot, k); cur.sunC.lerp(goal.sunC, k);
    for (const key of ['sunI', 'sunH', 'hemiI', 'night']) cur[key] += (goal[key] - cur[key]) * k;
    if (moving) drawSky();
    fog.color.copy(cur.bot); hemi.color.copy(cur.top); hemi.intensity = cur.hemiI;
    sun.color.copy(cur.sunC); sun.intensity = cur.sunI;
    const sa = st.az + 0.9;
    sun.position.set(Math.cos(sa) * 12 * Math.cos(cur.sunH), 12 * Math.sin(cur.sunH) + 2, Math.sin(sa) * 12 * Math.cos(cur.sunH));
    st.az += dt * (0.05 + st.spin); st.spin *= Math.pow(0.94, dt * 60);
    // setView: 카메라 전체를 아래로 내려 섬이 화면 위쪽에 오게 한다 (lift 0~0.3, 섬 지름의 lift 배)
    st.liftNow += (st.lift - st.liftNow) * k;
    placeCamera(liftDrop());
    if (fire && fire.group.visible) {   // 불꽃 흔들림 · 불씨 떠오름
      const s = now / 1000;
      fire.flames.forEach((f, i) => { const v = 1 + 0.12 * Math.sin(s * 9 + i * 1.9); f.scale.set(2 - v, v, 2 - v); });
      fire.light.intensity = 2 * (0.88 + 0.12 * Math.sin(s * 13) * Math.sin(s * 7.3));
      if (fire.ghost.visible) fire.ghost.position.y = 0.1 + 0.08 * Math.sin((s * Math.PI * 2) / 3);
    }
    for (const r of rises) {
      const q = Math.min(1, (now - r.t0) / 1600);
      r.m.position.y = r.y0 + 4 * q * q * (1.5 - 0.5 * q);
      r.m.material.opacity = 1 - q * q; r.halo.material.opacity = 0.9 * (1 - q);
    }
    for (const p of people) {
      if (p.you && (st.age < 3 || st.sit)) continue;   // 아기는 집 앞에, 모닥불 때는 불가에
      if (p.wait > 0) { p.wait -= dt; continue; }
      const d = p.to.clone().sub(p.o.position); d.y = 0;
      const L = d.length(), sp = p.you && st.age >= 65 ? 0.18 : 0.32;
      if (L < 0.05) { p.to = walkPoint(p.rng, p.walk); p.wait = p.rng.range(1, 4); continue; }
      d.multiplyScalar(Math.min(1, (sp * dt) / L)); p.o.position.add(d);
      p.o.rotation.y = Math.atan2(d.x, d.z);
      p.o.position.y = Math.abs(Math.sin(now / 160 + p.o.id)) * 0.03;
    }
    for (const f of puffs) {
      const t = (now / 3000 + f.k) % 1;
      f.m.position.copy(f.base).add(new THREE.Vector3(t * 0.3, t * 0.9, 0));
      f.m.scale.setScalar(0.6 + t * 1.6);
    }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return {
    get fast() { return st.fast; },
    set fast(v) { st.fast = v; },
    setKit(kit) { st.kit = kit; if (st.birth) { buildIsland(); buildTown(); } },
    setLife(birth, opts = {}) {
      st.birth = birth; st.age = 0;
      st.style = opts.style || styleFor(birth.year, birth.region);
      st.fixed = !!opts.style;
      setCampfire(false);   // 새 생: 모닥불·불씨는 숨기고 떠오르던 불씨는 끝낸다
      for (const r of rises.slice()) endRise(r);
      buildIsland(); buildTown(); buildFolk();
    },
    // 나이·해가 바뀌면: 크기·자세, 시대가 바뀌었으면 마을도 (예: 1940년생은 1950년에 현대 마을로)
    setAge(age, year) {
      st.age = age;
      const s = st.fixed ? st.style : styleFor(year, st.birth.region);
      if (s !== st.style) { st.style = s; buildIsland(); buildTown(); buildFolk(); }
      applyAge();
    },
    setPhase(name) { goal = toGoal(name); },
    // 모닥불 (5·15·30·50·70살): on 이면 내 사람 곁에 불을 켜고, ghost 면 불 건너편에 앞 생의 푸른 불씨. off 는 숨기기만 한다
    setCampfire,
    // 죽는 해의 하얀 불씨. fast·움직임 줄이기면 바로 끝난다
    flameRise,
    // 섬을 화면 위쪽으로 (데스크톱에서 아래 구슬 실·패에 덜 가리게). lift 0~0.3
    setView(o) { st.lift = THREE.MathUtils.clamp(Number(o && o.lift) || 0, 0, 0.3); },
    // 해가 넘어갈 때 카메라가 조금 더 돈다
    tick() { st.spin = Math.min(0.6, st.spin + 0.15); },
    // 족보·공유 그림 (320×180 JPEG). setView 의 lift 와 상관없이 섬을 가운데에 두고 찍은 뒤, 지금 화면을 되돌린다
    snapshot() {
      placeCamera(0);
      renderer.render(scene, camera);
      const c = document.createElement('canvas'); c.width = 320; c.height = 180;
      const s = renderer.domElement, sw = s.width, sh = s.height;
      let w = sw, h = sw / (16 / 9);
      if (h > sh) { h = sh; w = sh * (16 / 9); }
      c.getContext('2d').drawImage(s, (sw - w) / 2, (sh - h) / 2, w, h, 0, 0, 320, 180);
      placeCamera(liftDrop());
      renderer.render(scene, camera);
      return c.toDataURL('image/jpeg', 0.75);
    },
  };
}
