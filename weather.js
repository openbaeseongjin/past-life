// weather.js
// 전생 시뮬레이션: 동적 날씨 & 기후 파티클 시스템 (Dynamic Weather & Particle System)
// 1. 비 (Rain): 수직 빗줄기 + 물보라/어두워지는 하늘 + 안개 짙어짐
// 2. 눈 (Snow): 흩날리는 솜눈송이 + 차가운 은백색 대기
// 3. 꽃잎 (Petals): 봄철 벚꽃·살구꽃 꽃잎 흩날림 (혼례, 축제, 화창한 봄)
// 4. 낙엽 (Leaves): 가을철 붉은/노란 단풍잎 흩날림 (추수, 풍년, 만년)
// 5. 황사/모래바람 (Dust): 건기/사막/가뭄의 금빛 미립자 부유
// 6. 맑음 (Clear): 온화한 자연광

export const WEATHER_TYPES = ['clear', 'rain', 'snow', 'petals', 'leaves', 'dust'];

const WEATHER_INDICES = {
  clear: 0,
  rain: 1,
  snow: 2,
  petals: 3,
  leaves: 4,
  dust: 5,
};

// 카드 내용(키워드)에 따른 특수 날씨 판별
export function cardWeatherOf(card) {
  if (!card) return null;
  if (card.weather) return card.weather; // 명시적 지정이 있으면 최우선

  const id = card.id || '';
  const textKo = card.text?.ko || '';
  const textEn = card.text?.en || '';
  const titleKo = card.title?.ko || '';
  const full = `${id} ${titleKo} ${textKo} ${textEn}`.toLowerCase();

  // 1. 눈 / 혹한 / 겨울 / 빙설
  if (/snow|winter|blizzard|frost|freeze|frozen|hail|혹한|눈보라|대설|한파|겨울|폭설|얼어붙|동사|서리/.test(full)) {
    return 'snow';
  }

  // 2. 가뭄 / 황사 / 사막 / 흙먼지 / 모래폭풍 (rain 보다 먼저 검사)
  if (/drought|desert|sandstorm|dust|arid|famine|가뭄|황사|사막|모래바람|흙먼지|건기|메마른/.test(full)) {
    return 'dust';
  }

  // 3. 비 / 장마 / 폭우 / 홍수 / 태풍 / 폭풍
  if (/rain|monsoon|flood|downpour|tempest|thunderstorm|(?<!sand|dust)storm|장마|폭우|홍수|소나기|우기|빗줄기|비가|폭풍|태풍|물난리/.test(full)) {
    return 'rain';
  }

  // 4. 봄 / 꽃잎 / 벚꽃 / 살구꽃 / 혼례
  if (/blossom|sakura|spring|petal|flower|wedding|festive|봄날|꽃잎|벚꽃|살구꽃|매화|혼례|화창|새봄/.test(full)) {
    return 'petals';
  }

  // 5. 가을 / 단풍 / 낙엽 / 추수
  if (/autumn|harvest|leaves|foliage|fall|단풍|낙엽|가을|추수|풍년|갈잎/.test(full)) {
    return 'leaves';
  }

  return null;
}

// 사건 카드가 없을 때의 자연스러운 계절 및 기후 순환
export function seasonalWeatherOf(life) {
  if (!life) return 'clear';
  const age = life.age || 0;
  const year = life.year || 0;
  const region = life.birth?.region || 'eu';

  // 4계절 문화권 (동아시아, 유럽): 3~4년 주기로 계절별 대기 연출
  if (region === 'ea' || region === 'eu') {
    const cycle = Math.abs(year + age) % 12;
    if (cycle === 0 || cycle === 1) return 'petals'; // 봄
    if (cycle === 4) return 'rain';                  // 초여름 소나기
    if (cycle === 7 || cycle === 8) return 'leaves'; // 가을
    if (cycle === 10) return 'snow';                 // 한겨울
    return 'clear';
  }

  // 몬순/열대 문화권 (남아시아): 우기(몬순)와 건기
  if (region === 'sa') {
    const cycle = Math.abs(year + age) % 8;
    if (cycle === 0 || cycle === 1) return 'rain'; // 몬순 우기
    if (cycle === 4) return 'dust';                // 건기 먼지
    return 'clear';
  }

  // 사막/건조/그 외 (중동/아메리카 등)
  const cycle = Math.abs(year + age) % 10;
  if (cycle === 0 || cycle === 1) return 'dust';
  if (cycle === 5) return 'rain';
  return 'clear';
}

// 텍스처 아틀라스 생성 (128x128 캔버스: 4개 사분면)
function createWeatherAtlas(THREE) {
  if (typeof document === 'undefined' || !THREE) return null; // Node 환경 배려
  const c = document.createElement('canvas');
  c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  g.clearRect(0, 0, 128, 128);

  // 사분면 0 (0..64, 0..64): 빗방울 (Rain streak)
  const rgrad = g.createLinearGradient(32, 4, 32, 60);
  rgrad.addColorStop(0, 'rgba(255,255,255,0.05)');
  rgrad.addColorStop(0.5, 'rgba(255,255,255,0.7)');
  rgrad.addColorStop(1, 'rgba(255,255,255,1.0)');
  g.fillStyle = rgrad;
  g.beginPath();
  g.ellipse(32, 50, 5, 10, 0, 0, Math.PI * 2);
  g.moveTo(28, 48); g.lineTo(32, 6); g.lineTo(36, 48);
  g.fill();

  // 사분면 1 (64..128, 0..64): 눈송이 & 미세 먼지 (Snow / Dust)
  const sgrad = g.createRadialGradient(96, 32, 2, 96, 32, 26);
  sgrad.addColorStop(0, 'rgba(255,255,255,1.0)');
  sgrad.addColorStop(0.35, 'rgba(255,255,255,0.85)');
  sgrad.addColorStop(0.7, 'rgba(255,255,255,0.3)');
  sgrad.addColorStop(1, 'rgba(255,255,255,0.0)');
  g.fillStyle = sgrad;
  g.beginPath();
  g.arc(96, 32, 28, 0, Math.PI * 2);
  g.fill();

  // 사분면 2 (0..64, 64..128): 봄꽃잎 (Sakura / Apricot Petal)
  g.save();
  g.translate(32, 96);
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.beginPath();
  g.moveTo(0, -22);
  g.bezierCurveTo(16, -18, 18, 12, 0, 24);
  g.bezierCurveTo(-18, 12, -16, -18, 0, -22);
  g.fill();
  g.strokeStyle = 'rgba(255,220,230,0.6)';
  g.lineWidth = 1.5;
  g.beginPath(); g.moveTo(0, -16); g.lineTo(0, 14); g.stroke();
  g.restore();

  // 사분면 3 (64..128, 64..128): 가을 단풍잎 (Autumn Leaf)
  g.save();
  g.translate(96, 96);
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.beginPath();
  g.moveTo(0, -24);
  g.bezierCurveTo(20, -12, 14, 18, 0, 26);
  g.bezierCurveTo(-14, 18, -20, -12, 0, -24);
  g.fill();
  g.restore();

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  return tex;
}

// 3D 날씨 파티클 매니저 생성
export function createWeather(THREE, scene, camera, { fogify = (m) => m } = {}) {
  const atlas = createWeatherAtlas(THREE);
  const COUNT = 900; // 파티클 총수 (60fps 무부하)
  const BOX_SIZE = new THREE.Vector3(56.0, 32.0, 56.0);

  const baseGeo = new THREE.PlaneGeometry(1, 1);
  const geo = new THREE.InstancedBufferGeometry();
  geo.index = baseGeo.index;
  geo.attributes.position = baseGeo.attributes.position;
  geo.attributes.uv = baseGeo.attributes.uv;

  const aOffset = new Float32Array(COUNT * 3);
  const aVelocity = new Float32Array(COUNT * 3);
  const aParams = new Float32Array(COUNT * 4); // [size, phaseX, phaseZ, rotSpeed]

  for (let i = 0; i < COUNT; i++) {
    const i3 = i * 3, i4 = i * 4;
    aOffset[i3] = (Math.random() - 0.5) * BOX_SIZE.x;
    aOffset[i3 + 1] = (Math.random() - 0.5) * BOX_SIZE.y;
    aOffset[i3 + 2] = (Math.random() - 0.5) * BOX_SIZE.z;

    aVelocity[i3] = (Math.random() - 0.5) * 1.5;
    aVelocity[i3 + 1] = -1.0;
    aVelocity[i3 + 2] = (Math.random() - 0.5) * 1.5;

    aParams[i4] = 0.75 + Math.random() * 0.65;    // size
    aParams[i4 + 1] = Math.random() * 6.28;       // phaseX
    aParams[i4 + 2] = Math.random() * 6.28;       // phaseZ
    aParams[i4 + 3] = 0.8 + Math.random() * 1.4;  // rotSpeed
  }

  geo.setAttribute('aOffset', new THREE.InstancedBufferAttribute(aOffset, 3));
  geo.setAttribute('aVelocity', new THREE.InstancedBufferAttribute(aVelocity, 3));
  geo.setAttribute('aParams', new THREE.InstancedBufferAttribute(aParams, 4));

  const uniforms = {
    tAtlas: { value: atlas },
    uCamPos: { value: new THREE.Vector3() },
    uBoxSize: { value: BOX_SIZE },
    uTime: { value: 0 },
    uWeatherType: { value: 0 },
    uNextWeatherType: { value: 0 },
    uTransition: { value: 1.0 },
    uOpacity: { value: 0.0 },
    uWind: { value: new THREE.Vector3(0.5, 0, 0.2) },
  };

  const vertexShader = `
    uniform vec3 uCamPos;
    uniform vec3 uBoxSize;
    uniform float uTime;
    uniform float uWeatherType;
    uniform float uNextWeatherType;
    uniform float uTransition;
    uniform vec3 uWind;

    attribute vec3 aOffset;
    attribute vec3 aVelocity;
    attribute vec4 aParams;

    varying vec2 vUv;
    varying float vAlpha;
    varying vec3 vColor;

    const vec3 COL_RAIN = vec3(0.88, 0.93, 1.0);
    const vec3 COL_SNOW = vec3(0.98, 0.98, 1.0);
    const vec3 COL_PETAL = vec3(1.0, 0.75, 0.82);
    const vec3 COL_LEAF = vec3(0.95, 0.52, 0.18);
    const vec3 COL_DUST = vec3(0.96, 0.82, 0.48);

    void main() {
      float wType = mix(uWeatherType, uNextWeatherType, uTransition);
      vec3 vel = aVelocity;
      float size = aParams.x;
      vec3 col = COL_RAIN;
      vec2 atlasOffset = vec2(0.0, 0.0);
      vec2 atlasScale = vec2(0.5, 0.5);

      if (wType < 0.5) {
        // Clear
        col = vec3(1.0);
      } else if (wType <= 1.5) {
        // Rain
        vel = vec3(aVelocity.x * 0.3 - 1.5, -28.0, aVelocity.z * 0.3 - 0.8);
        col = COL_RAIN;
        atlasOffset = vec2(0.0, 0.0);
      } else if (wType <= 2.5) {
        // Snow
        vel = vec3(aVelocity.x * 0.6, -3.2, aVelocity.z * 0.6);
        col = COL_SNOW;
        atlasOffset = vec2(0.5, 0.0);
        size *= 1.25;
      } else if (wType <= 3.5) {
        // Petals
        vel = vec3(aVelocity.x * 1.1 + 1.2, -1.9, aVelocity.z * 1.1 + 0.6);
        col = mix(COL_PETAL, vec3(1.0, 0.88, 0.92), aParams.y / 6.28);
        atlasOffset = vec2(0.0, 0.5);
        size *= 1.1;
      } else if (wType <= 4.5) {
        // Leaves
        vel = vec3(aVelocity.x * 1.3 + 1.6, -2.4, aVelocity.z * 1.3 + 0.8);
        col = mix(COL_LEAF, vec3(0.72, 0.22, 0.06), aParams.z / 6.28);
        atlasOffset = vec2(0.5, 0.5);
        size *= 1.3;
      } else {
        // Dust
        vel = vec3(aVelocity.x * 0.8 + 0.6, -0.6, aVelocity.z * 0.8 + 0.4);
        col = COL_DUST;
        atlasOffset = vec2(0.5, 0.0);
        size *= 0.75;
      }

      vec3 delta = aOffset + (vel + uWind * 2.5) * uTime;
      vec3 rel = mod(delta + uBoxSize * 0.5, uBoxSize) - uBoxSize * 0.5;

      if (wType > 1.5) {
        rel.x += sin(uTime * 2.0 + aParams.y) * 0.6;
        rel.z += cos(uTime * 1.7 + aParams.z) * 0.6;
        if (wType > 2.5) {
          rel.y += sin(uTime * 2.8 + aParams.y) * 0.25;
        }
      }

      vec3 worldPos = uCamPos + rel;
      vec4 mvPos = modelViewMatrix * vec4(worldPos, 1.0);
      vec2 pt = position.xy;

      if (wType <= 1.5 && wType > 0.5) {
        // Rain: 길게 떨어지는 빗줄기
        pt.x *= 0.04 * size;
        pt.y *= 0.85 * size;
        float angle = -0.12;
        float ca = cos(angle), sa = sin(angle);
        pt = vec2(pt.x * ca - pt.y * sa, pt.x * sa + pt.y * ca);
      } else {
        // 회전하는 꽃잎·낙엽·눈
        float rot = (wType > 2.5) ? (uTime * aParams.w * 3.5 + aParams.y) : 0.0;
        float cr = cos(rot), sr = sin(rot);
        pt = vec2(pt.x * cr - pt.y * sr, pt.x * sr + pt.y * cr) * (0.32 * size);
      }

      mvPos.xy += pt;
      gl_Position = projectionMatrix * mvPos;

      vUv = atlasOffset + uv * atlasScale;
      vColor = col;

      float camDist = length(rel);
      float nearFade = smoothstep(1.2, 3.2, camDist);
      float edgeFade = smoothstep(uBoxSize.y * 0.5, uBoxSize.y * 0.35, abs(rel.y));
      vAlpha = nearFade * edgeFade;
    }
  `;

  const fragmentShader = `
    uniform sampler2D tAtlas;
    uniform float uOpacity;
    varying vec2 vUv;
    varying float vAlpha;
    varying vec3 vColor;

    void main() {
      vec4 tex = texture2D(tAtlas, vUv);
      float a = tex.a * vAlpha * uOpacity;
      if (a < 0.02) discard;
      gl_FragColor = vec4(vColor * tex.rgb, a);
    }
  `;

  const mat = fogify(new THREE.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
  }));

  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false; // 항상 카메라 주위에 위치
  mesh.renderOrder = 3;
  scene.add(mesh);

  let currentType = 'clear';
  let targetType = 'clear';
  let targetOpacity = 0.0;
  let currentOpacity = 0.0;
  let transitionProgress = 1.0;

  function setWeather(name, intensity = 1.0) {
    if (!WEATHER_TYPES.includes(name)) name = 'clear';
    if (name === targetType && Math.abs(targetOpacity - (name === 'clear' ? 0.0 : intensity)) < 0.05) return;

    if (name !== targetType) {
      uniforms.uWeatherType.value = WEATHER_INDICES[targetType] ?? 0;
      uniforms.uNextWeatherType.value = WEATHER_INDICES[name] ?? 0;
      transitionProgress = 0.0;
      targetType = name;
    }
    targetOpacity = (name === 'clear') ? 0.0 : THREE.MathUtils.clamp(intensity, 0.0, 1.0);
  }

  function step(dt, t, cam) {
    if (cam) uniforms.uCamPos.value.copy(cam.position);
    uniforms.uTime.value = t;

    // 날씨 간 전환 보간
    if (transitionProgress < 1.0) {
      transitionProgress = Math.min(1.0, transitionProgress + dt * 1.2);
      uniforms.uTransition.value = transitionProgress;
      if (transitionProgress >= 1.0) {
        currentType = targetType;
        uniforms.uWeatherType.value = WEATHER_INDICES[currentType] ?? 0;
      }
    }

    // 투명도 서서히 페이드인 / 페이드아웃
    currentOpacity += (targetOpacity - currentOpacity) * Math.min(1.0, dt * 1.5);
    uniforms.uOpacity.value = currentOpacity;
    mesh.visible = currentOpacity > 0.01;
  }

  function dispose() {
    scene.remove(mesh);
    geo.dispose();
    baseGeo.dispose();
    mat.dispose();
    atlas?.dispose();
  }

  return {
    mesh,
    setWeather,
    step,
    dispose,
    get type() { return targetType; },
    get opacity() { return currentOpacity; },
  };
}

