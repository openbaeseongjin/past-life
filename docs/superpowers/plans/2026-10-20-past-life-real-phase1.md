# 실사 3D 1단계: 잉글랜드 장면 완성 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 시험 장면(`realscene.js`, 겉모습 60~65%)을 목표 그림(`docs/concept-images/28-past-life-worldmap/m2-living-real.png`)의 75~80%까지 끌어올린다. 그리고 게임의 삶 무대로 연결해, 실제 한 생이 이 실사 무대에서 흐르게 한다.

**Architecture:**
- 건물·소품·옷은 Blender 4.2 명령줄 스크립트로 만든다. CC0 실사 재료를 입히고 그늘을 구운 뒤, glTF(meshopt)로 내보낸다.
- 무대 코드는 `realscene.js`(three.js 0.160)를 키운다.
  - 그 glTF를 불러 마을을 빽빽하게 채운다.
  - 지금 `village.js`가 내주는 API(`setLife, setAge, setPhase, tick, snapshot, setCampfire, flameRise, setView, fast`)를 똑같이 갖춘다. `main.js`는 import 한 줄만 바꾸면 된다.

**Tech Stack:**
- Blender 4.2.0(`"C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python …`), Cycles AO bake
- gltf-transform(meshopt)
- three.js 0.160 + addons
- `@dgreenheck/ez-tree` 1.1.0(MIT)
- Quaternius UBC/UAL(CC0)
- Poly Haven·ambientCG(CC0)
- Playwright MCP(스크린샷)

## Global Constraints

- 설계: `docs/superpowers/specs/2026-10-20-past-life-real-world-design.md`(3장·7장 1단계). HUD·이름 사전은 `docs/superpowers/specs/2026-10-20-past-life-identity-design.md`.
- PC 전용. 1600×900에서 RTX 2060급 60 fps 이상(후처리 켠 「높음」 기준). 폰 배치는 만들지 않는다.
- 재료·모델·코드 출처는 CC0·MIT·공개 영역만 쓴다. 새로 받은 것은 `docs/past-life/assets/real/SOURCES.md`에 적는다(이름, URL, 라이선스). Hunyuan3D(한국 제외 라이선스)·Mixamo·Sketchfab 유료/로그인 자산은 쓰지 않는다.
- 엔진 파일(`life.js`, `cards*.js`, `lines.js`, `events.js`, `deaths.js`, `traces.js`, `birth*.js`, `world.js`, `places.js`, `households.js`, `lifetable.js`, `focus.js`, `peers.js`, `rng.js`, `soul.js`, `beads.js`, `epitaphs.js`)은 고치지 않는다. `npm test` 100개가 계속 통과해야 한다.
- 결정성: 마을 배치·소품 흩뿌리기·사람 고르기는 출생 시드(`birth.seed`)에서 나온 난수로 정한다. 같은 시드면 같은 마을이 나온다.
- Blender 스크립트는 `tools/blender/`에 두고, 같은 스크립트를 다시 돌리면 같은 glTF가 나와야 한다. 결과물은 `docs/past-life/assets/real/kits/`(glb)와 `docs/past-life/assets/real/kits/preview/`(Blender 미리보기 그림)에 둔다.
- Blender 사용자 설정을 덮어쓰지 않는다(`--factory-startup`와 `save_userpref`를 함께 쓰지 않는다).
- 모듈 import: 우리 모듈끼리는 한 줄 `import { a } from './x.js';` 꼴이다. three addons와 ez-tree는 importmap 이름으로 부른다(공유 빌드는 3단계에서 여러 파일 빌드로 바꾼다).
- git이 없다. 커밋하지 않는다(`git init` 금지). 셸에서 프로젝트 하위 폴더로 `cd`해 머무르지 않는다(훅이 `.omc/`를 만든다). 절대 경로나 `( cd … && … )`를 쓴다.
- 화면 확인은 Playwright MCP로 한다.
  - 스크린샷은 `D:/Users/admin/Desktop/indigame/.playwright-mcp/`에 `p1_<작업>_*.png`로 둔다.
  - 서버는 `python D:/Users/admin/Desktop/indigame/docs/past-life/tools/serve.py 8780`(뒤에서 돌리고 끝나면 멈춤)다.
  - 목표 그림과 나란히 놓은 비교 그림을 남긴다.
- 파일은 UTF-8, LF.

## File Structure

| 파일 | 책임 | 작업 |
|---|---|---|
| `tools/blender/kit_common.py` (새) | Blender 공통: 재료 불러오기(CC0 텍스처), AO 굽기, glTF 내보내기, 미리보기 렌더 | 1 |
| `tools/blender/kit_england.py` (새) | 중세 잉글랜드 건물 세트 | 1 |
| `tools/blender/kit_props.py` (새) | 소품 세트(잉글랜드) | 2 |
| `tools/blender/kit_clothes.py` (새) | CC0 몸에 입힐 옷과 사람 변형 | 3 |
| `docs/past-life/assets/real/kits/*.glb` (새) | 결과물 | 1~3 |
| `docs/past-life/realscene.js` | 세트 불러오기·마을 배치·식생 다양화·사람·색감·게임 API | 1~4 |
| `docs/past-life/look-real.html` | 확인 쪽 | 1~4 |
| `docs/past-life/main.js` | 무대 import 바꾸기, 3D 실패 시 빈 마을 유지 | 4 |

---

### Task 1: 중세 잉글랜드 건물 세트 (Blender)

**Files:**
- Create: `tools/blender/kit_common.py`, `tools/blender/kit_england.py`
- Create: `docs/past-life/assets/real/kits/england.glb`, `docs/past-life/assets/real/kits/preview/england_*.png`
- Modify: `docs/past-life/realscene.js`(코드 건물 대신 세트 사용), `docs/past-life/assets/real/SOURCES.md`

**Interfaces:**
- Produces:
  - `england.glb` 안의 노드 이름(그대로 쓴다):
    - `cottage_a`, `cottage_b`, `cottage_c`(초가 오두막 변형)
    - `house_jetty`(2층, 위층이 튀어나온 목골조)
    - `longhouse`, `barn`, `smithy`(앞이 트인 일터, 화덕 자리 `smithy_forge` 빈 노드)
    - `church`(네모 탑 + 본당 + 현관), `mill`(물레방아 `mill_wheel` 따로 돌릴 수 있게)
    - `well`, `market_stall`
  - 노드마다 바닥 중심이 원점이고 단위는 미터다.
  - `realscene.js`: `loadKit(url) → Promise<{ pieces: Map<name, Object3D> }>`(같은 세트를 다시 부르면 캐시)

- [ ] **Step 1: 공통 도구 `kit_common.py`**
  - CC0 PBR 텍스처(이미 `docs/past-life/assets/real/tex/`에 있는 것 + 필요하면 Poly Haven·ambientCG에서 1K 더 받기)로 Principled 재료를 만든다. 재료 이름은 `stone_rubble`, `plaster_lime`, `timber_dark`, `thatch`, `slate`, `planks`, `cobble`, `wattle`.
  - Cycles AO를 정점 색 또는 두 번째 UV 라이트맵에 굽는다(three.js `aoMap`으로 쓸 수 있게).
  - glTF 내보내기 다음에 gltf-transform으로 meshopt 압축을 하고 텍스처를 1K로 맞춘다.
  - 미리보기 렌더(Eevee, 1280×720, 3/4 시점)를 만든다.

- [ ] **Step 2: 건물 스크립트 `kit_england.py`** (참고 그림: `m2-living-real.png`)
  - 비례: 오두막 5~7 m × 4~5 m, 벽 높이 2.4~2.8 m, 지붕 경사 45~55°.
  - 진짜 기하로 만든다:
    - 초가 두께 30~40 cm, 처마가 벽 밖으로 40~60 cm, 용마루가 살짝 처진 곡선
    - 목골조 기둥·보·가새가 벽면에서 2~4 cm 튀어나오게
    - 창틀·덧문·문틀, 굴뚝, 낮은 돌 기단
  - 변형: 별채를 덧댄 집, 지붕창 하나, 기울어진 헛간 문.
  - 교회: 성곽 모양 꼭대기(총안)를 단 네모 탑, 슬레이트 지붕 본당, 뾰족 창, 현관. 물레방앗간에는 바퀴를 따로 둔다.
  - 삼각형은 모두 합쳐 25만 개 이하, glb는 8 MB 이하.

- [ ] **Step 3: 내보내기와 미리보기**
  - Run: `"C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python D:/Users/admin/Desktop/indigame/tools/blender/kit_england.py`
  - Expected: `england.glb`와 미리보기 그림이 생긴다. 같은 명령을 다시 돌려도 같은 결과다.

- [ ] **Step 4: `realscene.js`에서 세트 쓰기**
  - 코드로 만든 건물을 세트 조각으로 바꾼다. 배치 규칙(골짜기·길·강가)은 그대로 쓰되, 조각 고르기·회전·약간의 크기 변주는 시드로 정한다.
  - 대장간 화덕 불빛은 `smithy_forge`, 물레방아 회전은 `mill_wheel`에 붙인다.

- [ ] **Step 5: 확인**
  - `look-real.html`에서 아침 전경·골목 눈높이·해질녘 대장간 세 장을 찍는다(`p1_t1_*.png`). 바뀌기 전 `real_*.png`와 나란히 놓은 그림도 남긴다.
  - 골목 눈높이에서 「상자 + 지붕」으로 보이지 않아야 한다.
  - 콘솔 오류 0, 60 fps 이상.
  - `( cd D:/Users/admin/Desktop/indigame/docs/past-life && npm test )` → 100개 통과.

---

### Task 2: 소품·식생·밀도

**Files:**
- Create: `tools/blender/kit_props.py`, `docs/past-life/assets/real/kits/props_england.glb`
- Modify: `docs/past-life/realscene.js`, `SOURCES.md`

**Interfaces:**
- Produces:
  - `props_england.glb` 노드:
    - 운반·저장: `cart`, `barrel`, `crate`, `woodpile`, `haystack`, `sacks`
    - 울타리·담: `wattle_fence`, `stone_wall`(이어 붙일 수 있는 2 m 조각)
    - 일터: `trough`, `anvil`, `tool_rack`
    - 장터: `market_goods`, `cloth_awning`
    - 마당: `bench`, `flower_patch`, `vegetable_bed`
  - 가축: `sheep`, `cow`, `chicken`, `duck`, `horse`. CC0 모델을 쓰거나 Blender로 만들고, 실사 비례에 털·가죽 재료를 입힌다. 가축은 멀리서 보이는 크기라 단순해도 된다.
  - `realscene.js`: 마을 꾸미기 규칙 함수 `dressVillage(rng, kit, props, layout)`

- [ ] **Step 1: 소품 세트**
  - 앞의 노드를 실사 재료로 만들고, 그늘을 구운 뒤 meshopt로 압축한다.
  - 삼각형 15만 개 이하, glb 5 MB 이하.
- [ ] **Step 2: 마을 모아 짓기와 꾸미기 규칙**
  - 먼저 마을을 모은다. 지금 전경은 넓은 들판에 집이 띄엄띄엄 있어 「공원」처럼 보인다(`.playwright-mcp/p1_t1_vs_target.png`).
    - 집 사이를 8~15 m로 좁힌다. 길을 따라 집이 늘어서고 교회 앞에 빈터가 있는 마을 꼴로 짠다.
    - 전경 카메라는 마을이 화면의 2/3를 차지하도록 마을 가까이 당긴다. 목표 그림처럼 앞쪽에 강·다리, 가운데 마을, 뒤에 구릉이 오게 한다.
  - 집마다 마당을 두고, 마당에 장작·통·텃밭·벤치를 2~5개 놓는다.
  - 길가에는 수레와 울타리를 둔다.
  - 장터(교회 앞 빈터)에는 천막 3~5개와 물건을 둔다.
  - 밭 가장자리에 건초더미를 두고, 풀밭에는 양 떼(무리 지어 15~30마리)를 둔다.
  - 강가에는 오리를 둔다.
  - 모두 시드로 정한다.
- [ ] **Step 3: 나무 다양화**
  - ez-tree 종 6가지 이상을 쓴다(참나무·물푸레·버드나무(강가)·자작나무·산사나무·사과나무(텃밭)). 크기·색·기울기에 변주를 준다.
  - 먼 나무는 종마다 각도 8방향 빌보드로 그리거나, 무리 지은 숲 덩어리 메시로 「브로콜리 점박이」를 없앤다.
  - 꽃·키 큰 풀 무더기를 둔다.
- [ ] **Step 4: 확인**
  - 아침 전경을 목표와 나란히 놓고(`p1_t2_compare.png`), 해질녘 전경도 찍는다.
  - 마을이 「공원」이 아니라 사람이 사는 곳처럼 채워져야 한다.
  - 60 fps 이상, 콘솔 오류 0, 시험 100개.

---

### Task 3: 옷 입은 사람

**Files:**
- Create: `tools/blender/kit_clothes.py`, `docs/past-life/assets/real/people/villagers.glb`
- Modify: `docs/past-life/realscene.js`, `SOURCES.md`

**Interfaces:**
- Produces:
  - `villagers.glb`: Quaternius Universal Base Characters 몸(남·여)에 옷을 입혀 굽은 변형 8명이다.
    - 남: 튜닉+각반, 튜닉+두건, 대장장이 앞치마
    - 여: 긴 치마+앞치마+머릿수건, 망토
    - 아이 1, 노인 1(굽은 자세는 코드에서 줌)
    - 뼈대는 바탕 몸과 같아서 Universal Animation Library 동작(걷기·서기·이야기·망치질·들기·괭이질)을 그대로 쓴다.
  - `realscene.js`: `spawnPeople(rng, count)`가 시드로 정한 변형·동작·경로로 사람을 둔다.

- [ ] **Step 1: 옷 만들기**
  - Blender에서 몸에 맞춰 옷 메시를 만든다(shrinkwrap + 두께 + 주름 노멀).
  - 재료는 거친 리넨·양모·가죽(CC0 천 텍스처)이고 색은 변주한다.
  - 몸의 가중치를 옷으로 옮긴다(Data Transfer).
  - 옷 밑으로 가려지는 몸 부분은 지워 뚫고 나오지 않게 한다.
- [ ] **Step 2: 동작 확인**
  - 걷기·서기·망치질에서 옷이 몸을 뚫지 않는지 Blender 미리보기 세 장으로 확인한다.
- [ ] **Step 3: 장면에 넣기**
  - 사람 10~20명을 마당·장터·밭·대장간(망치질)에 둔다.
  - 가까운 사람은 메시로, 먼 사람은 수를 줄여 그린다.
- [ ] **Step 4: 확인**
  - 골목 눈높이에서 「마네킹」이 아니라 옷 입은 마을 사람으로 보여야 한다(`p1_t3_street.png`).
  - 60 fps 이상, 오류 0, 시험 100개.

---

### Task 4: 색감·연출 + 게임 무대로 연결

**Files:**
- Modify: `docs/past-life/realscene.js`, `docs/past-life/main.js`, `docs/past-life/index.html`(스크립트 importmap에 addons·ez-tree), `docs/past-life/look-real.html`

**Interfaces:**
- Consumes:
  - 지금 `main.js`가 부르는 마을 API: `createVillage(canvas)` → `{ fast, setKit, setLife(birth), setAge(age, year), setPhase(name), tick(), snapshot(), setCampfire(on, ghost), flameRise(), setView({lift}) }`
  - `phaseOf(age)`(village.js에서 export)
- Produces:
  - `realscene.js`에 `createStage(canvas) → 같은 API`를 둔다. `phaseOf`도 export한다.
  - `main.js`는 `import { createStage as createVillage, phaseOf } from './realscene.js';` 한 줄로 바꾼다. KayKit `loadHex`·`setKit`은 빈 함수로 둔다.

- [ ] **Step 1: 색감·연출**
  - 따뜻한 색 보정(약한 LUT 또는 셰이더 곡선)을 넣는다. 아침·해질녘에는 빛 줄기(가벼운 god-ray 또는 안개 산란 강조)를 쓴다.
  - 주인공 자리에는 은은한 빛(카메라가 바라보는 마을 가운데)을 둔다.
  - 「높음/보통」 화질 단계를 둔다(보통은 AO 끔, 그림자 해상도 반, 먼 나무 단순).
- [ ] **Step 2: API 맞추기**
  - `setPhase(name)`: dawn·morning·noon·afternoon·dusk·night를 해 높이와 시각으로 바꾼다. 바뀔 때는 천천히 넘어간다.
  - `setAge`: 나이에 맞는 내 사람 크기·자세(아이·어른·노인)를 정한다. 시대가 바뀌면 소품을 교체한다(1단계는 잉글랜드 세트 안에서 근세 이후 소품만 조금 바꾼다).
  - `setCampfire(on, ghost)`: 마을 빈터에 실사 모닥불(장작 메시 + 불꽃 입자 + 점광원)을 놓는다. `ghost`면 푸른 반투명 불씨 사람을 둔다.
  - `flameRise()`: 내 사람 위에서 하얀 불씨가 떠올라 사라진다(Promise, fast·reduced-motion이면 바로 끝남).
  - `snapshot()`: 320×180 JPEG를 낸다(염주 메달·나누기 그림용).
  - `setView({lift})`: HUD를 피해 카메라가 보는 점을 내린다.
  - `tick()`: 해가 넘어갈 때 카메라를 조금 돈다.
- [ ] **Step 3: 다른 땅**
  - 1단계에서는 잉글랜드가 아닌 땅도 같은 바탕(지형·하늘)에 잉글랜드 세트를 쓰되, 땅 모습 색(사막은 마른 흙·적은 나무, 논은 물 댄 밭색)만 바꿔 둔다.
  - 2단계에서 세트로 대체한다.
- [ ] **Step 4: 게임에서 확인**
  - `?seed=`로 잉글랜드에 태어나는 시드를 찾는다(노드에서 `drawBirth`를 돌려서).
  - 그 시드로 한 생을 `?auto=1`로 끝까지 돌리면서 다음을 찍는다.
    - 해가 흐르는 화면(아침·한낮·해질녘)
    - 갈림길
    - 모닥불
    - 불씨가 떠오르는 장면
  - 각 장면을 1600×900으로 찍는다(`p1_t4_*.png`). HUD(작업 5)가 실사 무대 위에서 잘 읽히는지 본다.
  - 다른 땅 시드도 하나 확인한다.
  - 60 fps 이상, 콘솔 오류 0, 시험 100개.
  - 마지막으로 목표 그림과 나란히 놓은 비교 그림 `p1_final_compare.png`를 남긴다.
