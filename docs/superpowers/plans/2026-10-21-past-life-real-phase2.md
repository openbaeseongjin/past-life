# 실사 2단계: 문화 세트(남아시아·동아시아·흙벽돌) + 큰 집 장소 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 인도·중국·한국·서아시아에서 태어난 생이 그 땅의 집·사원·나무·옷·마을 모양으로 보이게 한다. 귀족과 하인은 큰 집에서 산다. 그래서 친구들에게 보여 줄 만한 장면이 되게 한다.

**Architecture:**
- 잉글랜드 세트를 만든 길(Blender 명령줄 스크립트 → AO 굽기 → meshopt glb → `kitdata.js` 크기표 → `realscene.js` 배치)을 그대로 따른다.
- 문화권마다 `kit_<zone>.py`(건물), `kit_props_<zone>.py`(소품·가축), 옷 변형(`kit_clothes.py`에 문화권 옷)을 만든다.
- 마을 배치 규칙은 `villageplan.js`에 문화권별 레시피로 더한다.
- 무대는 `lands.js`의 `stageOf(birth).kit`으로 세트를 고른다.

**Tech Stack:** Blender 4.2 headless, gltf-transform(meshopt·webp), three.js 0.160, ez-tree 1.1.0, CC0 재료(Poly Haven·ambientCG), Quaternius UBC/UAL(CC0)

## Global Constraints

- 설계: `docs/superpowers/specs/2026-10-20-past-life-real-world-design.md` 3.2(세트·장소 배치·땅별 변형), 3.3(땅 모습), 3.4(사람), 3.5(성능). 사용자 결정 「시뮬 2.0 먼저, 3D 세트는 줄이기」에 따라 이번 범위는 남아시아·동아시아·흙벽돌 세트와 큰 집 장소까지다.
- 같은 스크립트를 다시 돌리면 같은 glb가 나와야 한다. `bpy.ops.mesh.primitive_uv_sphere_add`·`recalc_face_normals`는 쓰지 않는다(`kit_props.py`의 결정적 대체 함수를 쓴다).
- glb는 세트 하나에 삼각형 15만 개 이하, 5 MB 이하다. 옷 입은 사람 변형은 LOD0 약 8천 삼각형이다.
- 1600×900, RTX 2060급에서 「높음」 평균 60 fps 이상이어야 한다. FC ONLINE(`fczf.exe`)·GAMA(java)가 돌면 측정은 「pending」이고, 절대 끄지 않는다.
- 출처는 CC0·MIT·공개 영역만 쓴다. `docs/past-life/assets/real/SOURCES.md`에 적는다. Hunyuan3D·Mixamo·Sketchfab 유료/로그인 자산은 쓰지 않는다.
- 이 계획의 작업은 `main.js`·`ui.js`·`i18n.js`·`index.html`·엔진 파일(`life.js`·`cards*.js`·`lines.js`·`events.js`·`focus.js`·`context*.js` 등)을 고치지 않는다. 시뮬 2.0이 같은 때에 그 파일들을 고친다.
  - 고쳐도 되는 파일: `realscene.js`, `realpeople.js`, `peopleplan.js`, `villageplan.js`, `kitdata.js`, `lands.js`의 무대 쪽(kit→glb 표), `look-real.html`, `tools/blender/*`, `docs/past-life/tools/*`, `assets/real/*`.
- 문화 표현: 실재 종교 시설은 그 시대 일반형(예: 북인도 나가라 양식 사원, 동아시아 목조 사찰)으로만 짓는다. 특정 실존 건물을 복제하지 않는다. 옷은 그 시대 평민·귀족의 일반형이다.
- git이 없다. 커밋하지 않는다. 셸에서 프로젝트 하위 폴더로 `cd`해 머무르지 않는다.
- 스크린샷은 `D:/Users/admin/Desktop/indigame/.playwright-mcp/p2_<작업>_*.png`이다(1600×900, 게임 안 가까운 시점 + 전경).

---

### Task 1: 남아시아 세트 (출생 31%)

**Files:**
- Create: `tools/blender/kit_southasia.py`, `tools/blender/kit_props_southasia.py`, `docs/past-life/assets/real/kits/southasia.glb`, `props_southasia.glb`, `.dims.json`, `preview/southasia_*.png`
- Modify: `tools/blender/kit_clothes.py`(문화권 옷), `docs/past-life/assets/real/people/villagers_southasia.glb`, `kitdata.js`, `villageplan.js`(남아시아 레시피), `realscene.js`(세트 고르기), `realpeople.js`, `peopleplan.js`, `test/kit.test.mjs`, `SOURCES.md`

**Interfaces:**
- Produces:
  - 건물 노드: `hut_mud_a/b`(초가 흙집), `house_courtyard`(안뜰 흙벽돌 집), `house_town`(두 층 벽돌·나무 발코니), `temple_small`(나가라 양식 작은 사원), `shrine_tree`(나무 밑 신당), `well_step`(계단 우물 또는 저수지 가트), `granary`, `market_stall_sa`
  - 소품·가축: `cart_bullock`, `water_pot`, `charpai`(끈 침상), `haystack_sa`, `cow_zebu`, `buffalo`, `goat`, `chicken`
  - 나무: 바니안·망고·야자(빈랑·코코넛)·님. ez-tree 프리셋 또는 카드 나무다.
  - 옷: 도티·쿠르타·터번(남), 사리·촐리(여), 아이·노인 변형. 색 변주 포함.
  - `villageplan.js`: `RECIPES.southasia`. 저수지·사원·큰 나무 둘레로 모인 마을, 좁은 골목, 논 둑. 수치는 시드에서 나온다.

- [ ] **Step 1:** 건물 세트. 잉글랜드 세트 방식(재료·AO·결정적 빌드·미리보기)으로 만든다.
- [ ] **Step 2:** 소품·가축·나무·옷.
- [ ] **Step 3:** 배치 레시피와 무대 연결.
  - `stageOf(birth).kit === 'southasia'`이면 이 세트를 쓴다.
  - 땅 모습(monsoon·dry)과 함께 쓴다.
  - 논 물빛의 줄무늬 그림자를 고친다(Task 4 스크린샷 p1_t4_india_close).
- [ ] **Step 4:** 확인.
  - 1304 인도 시드(`?seed=T4-21`)와 남아시아 큰 집·거리 시드를 하나씩 찍는다. 가까운 시점과 전경이다.
  - 확인할 것: 60 fps, 오류 0, `npm test` 다 통과, 두 번 빌드한 glb가 바이트까지 같음.

### Task 2: 동아시아 세트 (출생 19%)

**Files:** Task 1과 같은 꼴이다(`kit_eastasia.py` 등).

**Interfaces:**
- Produces:
  - 건물: `house_thatch_ea`(초가), `house_tile_ea`(기와집), `house_town_ea`(가게 딸린 집), `temple_ea`(목조 법당), `pagoda_small`, `gate_ea`, `well_ea`, `granary_ea`
  - 땅별 변형 `variant`:
    - china: 회벽·회색 기와
    - korea: 초가·기와 곡선·돌담
    - japan: 판벽·초가 지붕 경사
    - 지붕 곡선·벽 색·담 재료를 바꾼다.
  - 소품·가축: `cart_ea`, `jangdok`(항아리)·`rice_rack`, `ox_ea`, `pig`, `chicken`, `ducks`
  - 나무: 소나무·감나무·대나무·버드나무
  - 옷: 한푸·한복·기모노풍 평민복(땅 변형별), 삿갓·두건
  - 레시피: 개울을 따라 늘어선 마을, 뒷산, 계단 논

- [ ] **Step 1~4:** Task 1과 같은 차례로 한다. 확인 시드는 1410 중국(`T4-39`)과 조선 시드 하나다.

### Task 3: 흙벽돌 세트 (서아시아·북아프리카·나일·이란, 출생 13%)

**Interfaces:**
- Produces:
  - 건물: `house_flat_a/b`(평지붕 흙벽돌), `house_courtyard_mb`, `tower_wind`(바람탑, 이란·걸프), `mosque_small`(이슬람 시기) / `shrine_mb`(그 전), `well_mb`, `market_arcade`
  - 소품·가축: 대추야자, 낙타, 염소, 당나귀, 물레, 양탄자
  - 옷: 긴 겉옷·두건(남), 긴 옷·머릿수건(여)
  - 레시피: 오아시스·강가 관개 수로를 따라 빽빽한 안뜰 집 덩어리
- 시대 분기: 이슬람 이전(< 630, 지역별 기준은 `lands.js` era로)에는 모스크 대신 신전·작은 성소를 쓴다.

- [ ] **Step 1~4:** Task 1과 같은 차례로 한다.

### Task 4: 큰 집 장소 (귀족·하인 13%)

**Files:** 각 세트 스크립트에 큰 집 조각을 더하고, `villageplan.js`에 `setting === 'estate'` 레시피를 둔다.

**Interfaces:**
- Produces:
  - 큰 집 조각:
    - 잉글랜드: `manor`(돌 저택·담·문)
    - 남아시아: `haveli`(안뜰 저택)
    - 동아시아: `courtyard_estate`(담·대문·사랑채·안채)
    - 흙벽돌: `palace_mb`
  - 레시피: 큰 집이 화면 가운데에 오고 둘레에 마을이 있다.
  - 주인공 자리: 귀족(elite)은 앞마당·대청, 하인(serve)은 뒤뜰·부엌·마구간이다. 가까운 시점이 이 자리를 잡는다.

- [ ] **Step 1~3:** 조각을 만들고, 레시피를 짜고, 가까운 시점의 자리를 정한다.
- [ ] **Step 4:** 귀족 생 하나·하인 생 하나를 세트마다 찍는다.
