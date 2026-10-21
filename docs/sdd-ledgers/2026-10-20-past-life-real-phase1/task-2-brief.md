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

