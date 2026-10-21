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

