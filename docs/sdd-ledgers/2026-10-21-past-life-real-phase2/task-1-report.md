# 작업 2-1 보고: 남아시아 세트 — 단계 A (2026-10-21)

상태: **PHASE_A_DONE**. 단계 B(연결)는 「Phase B 시작」을 받으면 한다.
테스트: `npm test` 141/141 통과 (kit.test 7개 가운데 남아시아 5개가 새것).

## 1. 만든 것

| 산출물 | 조각 | 삼각형 | 크기 |
|---|---|---|---|
| `kits/southasia.glb` (`tools/blender/kit_southasia.py`) | 건물 10 | 67,294 | 3.79 MB |
| `kits/props_southasia.glb` (`kit_props_southasia.py`) | 소품·가축 17 | 22,782 | 2.10 MB |
| `kits/trees_southasia.glb` (`kit_trees_southasia.py`) | 식생 8 | 32,168 | 1.20 MB |
| `people/villagers_southasia.glb` (`kit_clothes.py`, `KIT_CULTURE=southasia`) | 사람 8 + 연장 4 | LOD0 6.8k~10.1k · LOD1 1.5k~2.2k | 1.82 MB |

모두 예산 안이다 (세트마다 15만 삼각형·5 MB 이하). 예산은 `test/kit.test.mjs` 가 glb JSON 에서 직접 잰다.

### 건물 (특정 실존 건물을 본뜨지 않은 시대 일반형)
- `hut_mud_a`: 석회칠 흙집. 붉은 흙 밑단, 박공 초가, 앞 처마 밑 툇마루(대나무 기둥 넷), 두 짝 나무문, 창살 창, 등잔 감실, 물항아리.
- `hut_mud_b`: 맨흙 둥근 집. 둥근 기단 둘레 툇마루, 처마 넓은 원뿔 초가(대나무 기둥 열 개), 꼭대기에 엎은 항아리.
- `house_courtyard`: 흙벽돌 안뜰집 (12.7 × 12 m). 네 채가 안뜰을 둘러싼 평지붕, 난간벽과 석회 갓, 대문 통로(두 짝 활짝), 문 옆 걸터앉는 단, 뒤채 툇마루, 안뜰 툴시 단, 빗물 홈통.
- `house_town`: 두 층 벽돌집. 아래층에 가게와 뾰족 아치 문, 기와 차양이 있다. 위층에 나무 발코니(까치발·난간 동자·기와 차양)와 덧문 창이 있고, 옥상에 난간·작은 방·모서리 꼭지가 있다.
- `temple_small`: 나가라 양식 작은 사원. 쇠시리 기단과 계단, 성소(겹 문틀, 세 면 돌출 감실)가 있다. 휜 시카라에는 다섯 면 돌출, 층 띠 9, 모서리 아말라카가 있고, 그 위에 아말라카·칼라샤·사프란 깃발을 얹었다. 앞에는 기둥 넷 주랑(걸터앉는 난간벽, 놋 종)과 계단꼴 지붕이 있다.
- `shrine_tree`: 두 단 둥근 단(석회칠 + 붉은 흙 띠), 주홍 칠한 돌·등잔·금잔화·작은 감실. 나무는 장면이 `shrine_tree_trunk` 빈 노드 자리에 세운다 (윗면이 막혀 있어 줄기 굵기와 상관없다).
- `well_step`: 물가 가트. 뒤 단은 땅 높이 0이고, 사암 계단 9단이 앞으로 2 m 내려간다. 옆벽과 작은 정자(chhatri)가 있다. 빈 노드 `well_step_water`.
- `well_kuan` (브리프 밖 덤): 마을 우물. 장면의 우물 자리용이다. 가트는 땅 밑으로 내려가서 마을 가운데에는 놓을 수 없기 때문이다.
- `granary`: 기둥 위 곳간(골라). 흙 바른 대나무 통, 원뿔 초가, 들창, 대나무 사다리.
- `market_stall_sa`: 대나무 기둥 천 차양(꼭두서니·사프란 줄무늬), 평상 위 향신료 무더기·놋그릇·항아리, 매단 저울, 마대.
- `haveli` 이름은 작업 4 몫으로 비워 두었다 (짓지 않음).
- 연기 빈 노드: `hut_mud_a_smoke`, `hut_mud_b_smoke`, `house_courtyard_smoke`, `house_town_smoke`. 문·창 안 어둠은 잉글랜드와 같은 `glass` 재료라 밤 불빛이 그대로 켜진다.

### 소품·가축
- 브리프 품목: `cart_bullock`, `water_pot`, `lota`, `charpai`, `haystack_sa`, `loom`, `cow_zebu`, `buffalo`, `goat`, `chicken`.
  - 혹소: 혹·목살·늘어진 귀·위로 휜 뿔.
  - 물소: 뒤로 휜 초승달 뿔.
  - 염소: 늘어진 귀.
- 마을 꾸미기에 필요해 더한 것: `sacks_sa`, `basket_sa`, `dung_cakes`, `chulha`, `wall_mud`·`fence_bamboo`(2 m, 이어 붙임), `trough_sa`.
- `kitdata.js` `PROP_SWAP_SA` 에 잉글랜드 소품 이름 → 남아시아 짝을 적어 두었다 (단계 B 의 `RECIPES.southasia` 가 쓴다). 예: barrel→water_pot, bench→charpai, sheep→goat, horse→buffalo.

### 나무·식생
- ez-tree 프리셋 (`kitdata.js` `TREES_SA`):
  - 반얀(Oak Large, 넓게 퍼짐, aspen 잎)
  - 보리수(aspen 잎)
  - 망고(Oak Medium, 짙고 빽빽)
  - 님(Ash Medium, 깃꼴 잎)
  - 바불(Ash Small, 우산꼴)
  - 덤불 셋 (`BUSHES_SA`)
- `TREE_SWAP_SA`: 잉글랜드 종 → 남아시아 종.
- Blender 식생 (ez-tree 로 못 짓는 꼴): 코코넛·빈랑·대추 야자, 바나나, 대나무 포기, 반얀 공기뿌리(기둥 뿌리 8 + 매달린 뿌리 46), 카슈 풀(흰 이삭)·마른 풀.
  - 계절풍: 카슈 풀·바나나·대나무.
  - 마른 땅: 대추 야자·마른 풀·바불.

### 옷 (villagers_southasia.glb)
- 변형 이름·뼈대·LOD·재질을 `villagers.glb` 와 똑같이 맞췄다. 그래서 `realpeople.js`·`peopleplan.js` 는 주소만 바꾸면 된다. 시험이 노드·뼈 이름·LOD 짜임을 비교한다.

| 자리 | 옷 |
|---|---|
| `m_tunic` | 쿠르타 + 긴 도티 + 파그리 |
| `m_hood` | 맨 윗몸 + 도티(앞 주름) + 앙가바스트람 숄 + 터번 + 수염 |
| `m_smith` | 무릎 도티 + 머리 수건 |
| `m_field` | 짧게 걷은 도티 + 감차 |
| `f_apron` | 사리 + 촐리 + 머리를 덮은 베일 |
| `f_cloak` | 사리 + 촐리 (팔루가 왼어깨 너머 등으로), 틀어 올린 머리 |
| `child` | 무릎 쿠르타 |
| `elder` | 긴 쿠르타 + 도티 + 숄 + 흰 터번 + 수염 |

- 모두 맨발이고 살빛은 갈색이다 (잉글랜드처럼 밝히지 않는다).
- 도티: 앞·뒤 단을 올려 다리 사이로 여민 꼴로 만들었다. 반지름은 원래 높이 값을 써서 다리와의 거리가 줄지 않게 했다.
- 터번: 머리뼈에 고정했다.
- 팔루: 오른쪽 허리 → 가슴 대각 → 왼어깨 위 → 등으로 가는 띠 격자다. 늘 촐리·사리 치마 바깥에 있게 했다.
- 물감 칸: 미리보기는 쪽빛·꼭두서니·강황·사프란·생무명이다. 장면에서는 사람마다 시드 물감을 쓴다. 남아시아 물감 표는 단계 B 의 `peopleplan.js` 몫이다.
- 다리 감기 교훈: 꼭 붙는 다리 옷은 없다. 늘어진 천(도티·사리·팔루 등 자락)만 골반·허벅지 섞기를 한다.
- 뚫림 검사 (LOD0, 뚫린 정점 수, 프레임 최대):

| 동작 | m_tunic | m_hood | m_smith | m_field | f_apron | f_cloak | child | elder |
|---|---|---|---|---|---|---|---|---|
| 걷기 | 1 | 0 | 0 | 0 | 3 | 4 | 3 | 1 |
| 서기 | 1 | 0 | 0 | 0 | 3 | 2 | 1 | 1 |
| 일(망치) | 0 | 0 | 0 | 0 | 1 | 1 | 0 | 0 |

  - 남는 1~4 정점은 쉼 자세부터 같은 수로 있는 겹침이다 (`KIT_DEBUG` 로 확인: 몸→소매 1, 몸→팔루 2, 팔루→베일 1). 움직임 때문에 생긴 뚫림이 아니고, 화면에서 보이지 않는다.
  - 꿇기는 m_tunic 이 8로 가장 많다.

## 2. 결정성 (같은 PC·RTX 2060 OptiX)
- 남아시아 glb·dims·미리보기는 두 번씩 지어 바이트까지 같았다.
  - 건물: glb + dims + 미리보기 13장.
  - 소품: glb + dims + 미리보기 3장.
  - 식생: glb + dims + 미리보기 1장.
  - 사람: villagers_southasia.glb + 미리보기 4장.
- 남아시아 사람 빌드가 임시 폴더에 지은 동작 묶음은 배포 `anims.glb` 와 바이트까지 같다 (sha 9eacb372…). 같은 뼈대·동작 경로라는 뜻이다.
- 잉글랜드 세트는 그대로다 (바이트 동일):
  - `kit_clothes.py` 를 고친 뒤 잉글랜드로 다시 지었다. `villagers.glb`·`anims.glb`·`people_{idle,walk,hammer}.png` 가 백업과 같았다.
  - `kit_common.py`·`kit_england.py`·`kit_props.py` 는 고치지 않았다. 확인으로 다시 지었고, `england.glb`·`props_england.glb`·dims·미리보기 24 파일이 같았다.
- 압축 도구: 세션 scratchpad 의 `gltft` 폴더(gltf-transform 4.5.1 + meshoptimizer 0.21 + sharp 0.35)를 `GLTFT` 로 썼다. 이 도구로 england_raw 를 다시 누르면 배포 england.glb 와 바이트까지 같다. `docs/past-life/tools/node_modules` 에는 깔려 있지 않다.
- `recalc_face_normals`·`primitive_uv_sphere_add` 는 쓰지 않았다.
  - `kit_common.boolean_cut`·`kit_england.solid_obj` 는 recalc 를 쓰므로 부르지 않았다.
  - 대신 감김을 만들 때부터 맞추는 `kit_sa_common.prism_ok`·`solid_ok`·`bool_cut` 을 새로 썼다. 겹친 자르개는 EXACT `use_self` 로 뺀다.

## 3. 미리보기 (`docs/past-life/assets/real/kits/preview/`)
- 건물: `southasia_{hut_mud_a,hut_mud_b,house_courtyard,house_town,temple_small,shrine_tree,well_step,well_kuan,granary,market_stall_sa}.png`
- 마을 모퉁이: `southasia_village.png`(높은 전경), `southasia_lane.png`·`southasia_lane2.png`(눈높이 골목). 소품·야자를 미리보기에서만 함께 놓았다.
- 소품·가축: `southasia_props_overview.png`, `southasia_animals.png`, `southasia_props_yard.png`
- 식생: `southasia_trees.png`(Blender), `southasia_eztrees.png`(ez-tree 프리셋 + Blender 식생, `docs/past-life/tools/trees_preview.html` 을 Playwright 로 찍음)
- 사람: `people_southasia_idle.png`, `people_southasia_walk.png`, `people_southasia_close.png`(가까이), `people_southasia_work.png`(대장장이 망치질)

## 4. 고친·새 파일 (단계 A 울타리 안)
- 새 파일:
  - `tools/blender/kit_sa_common.py`, `kit_southasia.py`, `kit_props_southasia.py`, `kit_trees_southasia.py`, `kit_vignette_southasia.py`
  - `docs/past-life/tools/trees_preview.html`
- 고친 파일:
  - `tools/blender/kit_clothes.py`: `KIT_CULTURE=southasia` 갈래만 더했다. 잉글랜드 결과는 바이트 동일.
  - `docs/past-life/tools/fetch_real.py`: 텍스처 6개를 더했다.
  - `docs/past-life/kitdata.js`: `TREES_SA`, `BUSHES_SA`, `KIT_DIMS_SA`, `KIT_POOL_SA`, `PROP_DIMS_SA`, `TREE_DIMS_SA`, `PROP_SWAP_SA`, `TREE_SWAP_SA`, `KIT_SETS` 를 더했다. 기존 export 는 그대로다.
  - `docs/past-life/test/kit.test.mjs`: 시험 5개를 더했다.
  - `docs/past-life/assets/real/SOURCES.md`
- 새 에셋:
  - 텍스처: `assets/real/tex/` 에 Poly Haven CC0 6종 12장 (patterned_clay_plaster, red_brick_plaster_patch_02, sandstone_blocks_08, clay_roof_tiles_02, bamboo_wall, palm_tree_bark).
  - 세트: kits glb 3 + dims 3, people glb 1, 미리보기 22장.
- 손대지 않은 파일: `realscene.js`, `realpeople.js`, `peopleplan.js`, `villageplan.js`, `lands.js`, `main.js`, `ui.js`, `i18n.js`, `index.html`, `look-real.html`.

## 5. 걱정·단계 B 에 넘길 것
1. **가트 `well_step` 은 땅 밑으로 2 m 내려간다.** 장면 지형이 계단을 덮는다. 단계 B 에서 강가(물이 낮은 쪽)에 앞을 물로 두어야 한다. 마을 가운데 우물 자리에는 `well_kuan` 을 쓴다.
2. **반얀 = ez-tree 몸통 + `banyan_roots` glb.** 공기뿌리 반지름(~8 m)이 ez-tree 반얀 수관(키 14 m)보다 조금 넓다. 단계 B 에서 뿌리를 수관 폭에 맞춰 배율을 주는 편이 좋다. 넓은잎 나무는 실행 때 ez-tree 로 생성된다 (잉글랜드와 같은 방식).
3. **야자·대나무는 잎이 실제 메시다.**
   - 코코넛 5.8k, 대나무 11k, 대추 6.6k 삼각형이다.
   - 가까운 것만 메시로, 먼 것은 기존 나무처럼 빌보드로 가야 60 fps 예산에 맞는다.
   - glb 조각 하나에 재료가 여러 개(줄기 palm_bark·bark·bamboo / 잎 frond(양면) / palette)라, 단계 B 가 재료별로 나눠 InstancedMesh 로 써야 한다.
4. **사람 물감·머리색은 아직 잉글랜드 표다.** `peopleplan.js` 의 DYES·HAIRS 가 잉글랜드용이라 금발·붉은 머리가 나올 수 있다. 단계 B 에서 남아시아 물감(쪽빛·꼭두서니·강황·생무명)과 검은 머리 표를 `kit === 'southasia'` 일 때 쓰게 해야 한다.
5. **남은 뚫림.** f_cloak·child 의 「떨어짐」 4는 촐리·쿠르타 소매(꼭 붙는 옷)가 일부 자세에서 몸에서 5 cm 넘게 뜨는 정점이다. 걷기·서기·일 모두 정점 4개 이하라 그대로 두었다.
6. **잉글랜드 england.glb 는 6.25 MB 다.** 원래 5 MB 예산을 넘는다 (내 작업과 무관, 참고).
7. **gltf-transform 이 저장소 폴더에 없다.** 다시 지으려면 `GLTFT` 를 scratchpad `gltft` 로 주거나 `npm i --prefix docs/past-life/tools …` 를 해야 한다. 같은 버전(4.5.1 / 0.21 / sharp 0.35)이어야 바이트가 같다.
8. **미리보기 그림의 한계.** Blender 마을 미리보기에는 ez-tree 넓은잎 나무가 없다 (실행 때 생성). 신당 단(shrine_tree)은 나무 없이 찍혔다.
9. **시간이 남으면 고칠 것.** 가축은 잉글랜드와 같은 매끈한 양식화 수준이다. 혹소 혹이 조금 둥근 덩이처럼 보인다.

---

# 단계 B (2026-10-21) — 장면에 붙이기·손질·실제 플레이 확인

## B1. 지시 1~6 처리
1. **사람 (`kit_clothes.py` 남아시아 갈래 + `peopleplan.js`)**
   - 어른 남자는 거의 다 쿠르타나 앙가바스트람을 입는다.
     - m_tunic: 쿠르타 + 도티 + 터번
     - m_hood: 짧은 쿠르타 + 도티 + 앙가바스트람 + 터번 + 수염
     - m_smith: 반소매 쿠르타 + 무릎 도티 + 머리 수건
     - elder: 쿠르타 + 도티 + 앙가바스트람 + 흰 터번
   - 맨 윗몸은 m_field 한 자리뿐이다. 몸을 라플라시안으로 다듬어 근육 굴곡을 누그러뜨렸고, 왼어깨 감차·머리 수건을 둘렀다.
   - 터번: 이마 높이 반지름 벽 위에 비틀린 띠를 겹쳐 감고, 앞 교차·정수리 돔을 얹었다. 머리 높이의 약 1.3 배.
   - 사리 베일: 머리에 붙게 낮췄다. 앞·옆은 얼굴이 열리게 자르고, 뒤로 주름을 늘어뜨린다.
   - `PALETTES.southasia` (`peopleplan.js`): 검정·짙은 갈색 머리, 쪽빛·꼭두서니·강황·생무명 같은 천연 염료. 금발·붉은 머리는 나오지 않는다. 시험으로 시드 12개를 확인했다.
   - 미리보기: `people_southasia_heads.png` 를 더했다.
2. **안뜰집 `house_courtyard`** (12,443 삼각형)
   - 석회 갓돌 턱, 위 석회 띠, 붉은 흙 밑단, 석회 덧칠 조각.
   - 나무 상인방(까치발·놋 못)·조각 문, 사암 문턱, 벽감 두 곳(석회 테).
3. **야자·대나무**
   - 조각마다 재질이 줄기(palm_bark/bark/bamboo) 하나와 `frond` 하나뿐이다. 잎 띠 그림은 한 장 (512×256, 16 띠).
   - 장면에서는 ez-tree 와 같은 길을 탄다: 가까이는 재질별 InstancedMesh, 멀리는 8 방향 빌보드.
   - `trees_southasia.glb` 1145 KB, 27,320 삼각형.
4. **`RECIPES.southasia` (`villageplan.js`)**
   - 정한 자리 `SA_SITES`: 사원(+마당), 강을 보는 가트(바닥 = 물 높이 + 1.95 → 계단이 물로 내려간다), 반얀 신당, 마을 우물, 큰 집, 곳간.
   - 집은 그 둘레로 모이고 좁은 골목으로 잇는다. 뒤뜰 소품·혹소·물소·염소는 집 가까이 둔다 (`planDressingSA`).
   - 논두렁은 셰이더로 그린 흙 둑이다 (밭 가장자리 값).
   - `lands.js`: `BUILT_KITS = ['england', 'southasia']`. `stageOf(birth).kit === 'southasia'` 인 생만 이 세트를 쓰고, 다른 세트는 그대로 잉글랜드다.
   - 잉글랜드 요리법은 같은 난수 순서를 그대로 쓴다. 시험·회귀 플레이로 확인했다.
5. **논 줄무늬 그림자 (`p1_t4_india_close.png`)**
   - 고랑 sin 줄무늬를 걷어냈다. 대신 줄마다 반 칸 엇갈리고 지터를 준 모 포기를 놓는다.
     - 포기는 별꼴 잎 다발이고, 가운데 밑동은 어둡다.
     - 포기의 24% 는 빠지고, 큰 얼룩으로 잘 자란 데·덜 자란 데가 갈린다.
   - 화소보다 작아지는 거리에서는 평균 덮임으로 바꾼다 (fwidth). 물 거칠기는 0.22 다.
6. **내 사람·곁 사람**
   - 세트가 southasia 면 `villagers_southasia.glb` 를 쓰고, `mePalette` 도 남아시아 표다.
   - 가까운 장면에서 내 사람이 차지하는 키: 0.33~0.38. 아이는 0.26 이다 (무릎 꿇은 아이, 잉글랜드와 같은 규칙).

## B2. 실제 플레이에서 찾아 더 고친 것
- **읍내 집 가게 안이 새까만 판이었다.**
  - `shade` 를 어두운 흙빛(0.085, 0.062, 0.045)으로 바꿨다.
  - 선반 두 단에 흙·놋 항아리, 평상 위에 자루·광주리를 두었다. `house_town` 은 10,794 삼각형이다.
  - `southasia.glb` 4134 KB. 두 번 지어 바이트까지 같았다.
- **장터 가까운 장면에서 좌판 처마가 내 사람을 덮었다.** 남아시아 좌판은 앞 처마가 2 m 로 낮다. 좌판이 줄지어 있어 카메라가 갈 곳을 찾지 못하고 처마 위로 갔다.
  - 남아시아일 때만 바꿨다:
    - 내 사람이 평상 앞(처마 밖)에 서서 곁의 손님과 이야기한다.
    - 앞 9 m 띠가 가장 트인 천막 좌판을 고른다.
  - 잉글랜드 갈래는 그대로다.
- **뒤뜰 쇠똥 떡 더미(1.1 m)가 아궁이 앞 아이를 가렸다.**
  - 남아시아일 때만, 내 사람 7 m 안의 0.85 m 넘는 소품을 카메라 가림 검사에 넣는다.

## B3. 확인 (1600×900, 시스템 Chrome headless + ANGLE D3D11 RTX 2060, 포트 8783)
공용 MCP 브라우저는 다른 에이전트가 쓰고 있었다. 그래서 내 드라이버(`.playwright-mcp/p2_t1_drive.mjs`)로 따로 띄웠다. 드라이버는 사람처럼 시작·속도·선택지·멈춤 단추만 누르고, 게임 상태는 읽기만 한다.

| 시드 | 생 | 찍은 그림 (`.playwright-mcp/`) | 내 사람 키 비율 | 콘솔 오류 |
|---|---|---|---|---|
| T4-21 | 1304 인도 땅 · 농사 집(village, monsoon) | `p2_t1_india_wide.png`(탄생 전경), `p2_t1_india_child.png`(9살 아궁이), `p2_t1_india_close.png`(20살 논 괭이질) | 0.376 / 아이 0.264 | 0 |
| P2-44 | 1855 인도 땅 · 장사하는 집(street) | `p2_t1_street_wide.png`, `p2_t1_street_close.png`(20살 장터 좌판 앞) | 0.355 | 0 |
| P2-114 | 1056 인더스 강가 · 관리의 집(estate, dry) | `p2_t1_estate_wide.png`, `p2_t1_estate_child.png`, `p2_t1_estate_close.png`(20살 마을 빈터 이야기) | 0.363 / 아이 0.264 | 0 |
| EN-30 (회귀) | 412 프랑스 땅 · 잉글랜드 세트 | `p2_t1_england_regress_{wide,close}.png` | 0.376 | 0 |

- estate 는 지시대로 village 요리법을 쓴다.
  - 처음 고른 P2-60(970 인도·serve)은 아기 때 죽어 20살 그림이 없다.
  - 그래서 살아남는 P2-114 로 바꿨다. dry 땅 모습도 함께 확인된다.
- `?seed=T4-21&auto=1` 한 생 전체: 61살에 끝났고 89초 걸렸다. 콘솔 오류 0, 경고 0, 장면 오류 0.
- `npm test`: 191/191 통과. `kit.test.mjs` 의 남아시아 시험 9개 포함.
- 결정성:
  - `southasia.glb` 는 이번 손질 뒤 두 번 지어 같았다.
  - 사람·식생·소품 glb 는 단계 B 앞쪽에서 두 번씩 지어 같았다.
  - 잉글랜드 산출물은 바이트 동일이다.
- **성능: 보류.** GAMA java(PID 2968, 5.6 GB, CPU 74%)가 돌고 있어 fps 를 재지 않았고, 건드리지 않았다.
  - 참고로 같은 카메라의 렌더 호출·삼각형 수(그림자·후처리 패스 포함)를 적는다.

    | 장면 | 남아시아 | 잉글랜드 |
    |---|---|---|
    | 탄생 전경 | 1508 호출 / 14.6M | 1274 호출 / 19.1M |
    | 가까이 | 1056 호출 / 9.6M | 1170 호출 / 21.5M |

## B4. 단계 B 에서 고친·새 파일
- 웹:
  - 고친 파일: `docs/past-life/realscene.js`, `villageplan.js`, `peopleplan.js`, `kitdata.js`, `lands.js`, `look-real.html`(`set=`·`land=`), `test/kit.test.mjs`, `assets/real/SOURCES.md`
  - 손대지 않은 파일: `realpeople.js`, `main.js`, `ui.js`, `i18n.js`, `index.html`, `strand.js`, `life.js`, `traces.js`, `memory.js`, `context*.js`, `tokens.js`
- Blender:
  - 고친 파일: `tools/blender/kit_southasia.py`, `kit_sa_common.py`, `kit_trees_southasia.py`, `kit_clothes.py`(남아시아 갈래만)
  - 다시 지은 에셋: `kits/southasia.glb`·dims·미리보기, `kits/trees_southasia.glb`, `people/villagers_southasia.glb`
- 확인 도구: `.playwright-mcp/p2_t1_drive.mjs`(play·auto), `p2_t1_probe.mjs`, `p2_t1_run.js`(MCP 용)

## B5. 걱정·남은 것
1. **렌더 호출이 잉글랜드보다 많다.** 전경에서 1508 대 1274 (+18%) 다.
   - 원인: 남아시아 세트 재질 수(흙 셋·벽돌·사암·기와·대나무·천 둘…)와 glb 야자 5종 × 2재질.
   - 삼각형은 더 적다. fps 는 GAMA 가 꺼진 뒤 재야 한다.
2. **땅 모양은 잉글랜드와 같은 공용 env 다** (강·길·밭 구획·다리). 다리는 잉글랜드 돌다리 그대로다.
3. **논두렁은 모델이 아니라 땅 셰이더로 그린 흙 띠다.**
   - 밭 가장자리 풀 띠는 공용 먼 splat 이다.
   - 논 물 위 모는 셰이더 무늬다 (가까이 보면 납작하다).
4. **앙가바스트람 늘어진 자락이 뒤에서 보면 납작한 판처럼 보인다** (`p2_t1_street_close.png` 의 노인).
   - 천 두께·주름을 더하면 나아진다.
5. **headless 에서는 `rafStats` 가 0 이다** (게임 rAF 통계가 쌓이지 않는다). 그림·상태·오류 검사에는 영향이 없다.
6. **반얀 공기뿌리는 나무 키 / 14 배율로 맞췄다.** 가트 둑은 꽉 찬 사암 둑으로 바꿨다.
   - 가트 계단이 물에 닿는 모습은 강 굽이마다 조금씩 다르다.

---

# 수정 1차 (2026-10-21) — 검토 I-1·I-2·I-3 + 가벼운 Minor

## R1. I-1 옷 흠 (`tools/blender/kit_clothes.py`)
- **머릿자락(베일) 아랫단 톱니**
  - 원인: 격자 칸을 `keep(k, j)` 로 통째 지웠다.
  - 고침: 얼굴 구멍 아래 행을 열마다 원래 열 선을 따라 「자를 높이」까지 고르게 다시 놓는다.
    - 자를 높이: 앞·옆은 목 언저리, 뒤로 갈수록 가슴 높이.
    - 아랫단은 매끈한 곡선이 되고, 마지막 두 행은 조금 바깥으로 낸 말린 단이다.
  - 머릿자락이 어깨·등에서 팔루를 덮는다 (`cover_over`). 같은 천이 이어진 것이다.
- **촐리 단 톱니**
  - 원인: 팔루 띠 반지름이 촐리 단에서 계단처럼 뚝 떨어져, 촐리 단 모서리가 띠를 뚫고 나왔다.
  - 고침:
    - `drape_band` 가 반지름 마당을 이웃 평균으로 다듬는다. 몸·밑옷보다 안으로는 들어가지 않는다.
    - 밑옷 단 아래 6 cm 는 단 반지름에서 천천히 내려온다.
- **팔루 네모 판**
  - 원인: 오른 허리 앞에서 20 cm 높이의 세로 끝단으로 시작했다.
  - 고침: 치마 허리춤에 접어 넣은 6 cm 좁은 끝에서 시작해 앞으로 오며 넓어진다.
  - 40×20 격자로 촘촘히 했고, 옅은 주름 (0.007 m × 7) 을 넣었다.
  - 가중치는 그대로 몸 Data Transfer + 팔→빗장뼈다. 등 아래 자락만 치마 섞기를 한다.
- **등 구멍**
  - 원인: 느슨하게 두른 띠(팔루·어깨 천·감차)도 밑의 몸 면을 지웠다. 그래서 움직일 때 띠가 몸에서 뜨면 구멍이 보였다.
  - 고침: 띠는 `nohide` 로 몸 면을 지우지 않는다. 몸에 붙는 옷(촐리·치마·쿠르타·도티)만 지운다.
- **앙가바스트람 방패 판**
  - 원인: 등 가운데로 비스듬히 와서 세로 끝단으로 끊겼다.
  - 고침: 왼어깨에서 늘어지는 두 자락으로 바꿨다.
    - 앞자락은 왼가슴을 따라 허리까지 간다. 바깥 모서리가 더 늘어진 비스듬한 단이다.
    - 뒷자락은 좁고 짧게 왼어깨뼈 아래까지 간다. 깊은 세로 주름 (0.017 m × 5) 이 있고, 쿠르타에서 7 mm 다.
- **맞음 검사** [뚫림, 떨어짐] (걷기·서기·이야기·무릎·앉기 중 가장 나쁜 것):
  - 남아시아: f_apron 1·0 (단계 B 4), f_cloak 2·4, m_hood 6·4 (무릎), elder 8·0 (무릎), m_field 2·0.
  - LOD0 은 elder 10,651 / m_hood 10,076 삼각형이다 (상한 11,000).
- 미리보기 `people_southasia_{idle,walk,close,heads,work}.png` 를 다시 렌더했고, 가까운 장면 그림도 다시 찍었다 (아래 R5).

## R2. I-2 시대·땅 갈래
### 표 (`villageplan.js`)
- `PIECE_GATES.southasia`: 조각 → 쓸 수 있는 해 [from, to). 땅·갈래가 덮어쓰고, null 은 그 땅·갈래에 없다는 뜻이다.

  | 조각 | 쓸 수 있는 해 | 예외 |
  |---|---|---|
  | `temple_small` | 600년부터 | lanka: 없음 · indus: 600~999 · 동남아(seasia): 없음 |
  | `house_town` | 기원전 300년부터 | — |
  | `cart_bullock` | 기원전 2600년부터 (맥락의 남아시아 기술 2단계·인더스 수레 모형) | 동남아: 기원전 500년부터 |

- `HOUSE_MIX`: 해마다 안뜰집·읍내 집 몫이다. 고대는 흙집이 더 많고, 600년부터는 원래 값이다.
- `recipeFor(kit, {year, area})`:
  - 거를 것이 없으면 `RECIPES[kit]` 그 객체를 그대로 돌려준다. 그래서 중세 인도·잉글랜드 계획은 수정 전과 같다.
  - 거르면 사원 자리를 신당(`shrine_tree`)으로 바꾸고, 그 자리에 보리수를 심는다.
  - 소품은 `put` 이 난수를 뽑기 전에 거른다.
- `flavorOf`·`SA_FLAVOR_OF`: mainland_sea·indonesia·malay·philippines → 갈래 `seasia`.

### 동남아 사람
- `villagers_seasia.glb` (`KIT_CULTURE=seasia`, 1856 KB). 같은 메시 틀의 갈래다.
  - 남자: 사롱(일할 때 걷어 올림), 짧은 웃옷 또는 맨 윗몸(밭일꾼 하나), 머리 수건 또는 맨머리.
  - 여자: 사롱 + 짧은 저고리, 또는 가슴 두름 + 어깨 띠. 틀어 올린 머리·긴 머리.
  - 터번·사리·베일은 없다.
- 물감은 `PALETTES.seasia` (쪽빛·소가 갈색·노니 붉은 갈색·짙은 초록·검정·생무명) 다.
- `KIT_SETS.southasia.flavors.seasia` 가 사람 glb·물감을 가리킨다.
- 맞음 검사 최대: 모두 8 이하 (m_tunic·m_smith·elder 8 은 무릎 자세).

### 장면 연결 (`realscene.js`)
- `createRealScene` 이 `opts.era`(해)·`opts.area`(땅) 로 `recipeFor` 를 부르고, 갈래로 사람 glb·물감을 고른다.
- 게임 `buildInto` 는 `area: stage.variant` 를 넘긴다. 내 사람·곁 사람도 `sc.peopleUrl` 을 쓴다.
- `lands.js` 지도는 그대로다 (동남아 4곳은 남아시아 세트). 주석만 더했다.

### 시험 (`test/sagates.test.mjs`)
- 출생 2,000개 (남아시아 세트 생):
  - 사원 684, 신당 1,316.
  - 600년 전 1,193, 기원전 300년 전 773, 동남아 147, 스리랑카 9, 1000년 뒤 인더스 35.
- 확인한 것:
  - 600년 전·스리랑카·동남아에는 `temple_small` 이 없다.
  - 인더스는 600~999년만 사원이 있다.
  - 사원이 없으면 그 자리가 신당이다.
  - 기원전 300년 전에는 읍내 집이 없다.
  - 바퀴 해 전에는 소달구지가 없다.

## R3. I-3 GPU 자원 캐시
- **세대 표지:** 장면을 지을 때마다 세대(GEN)를 올린다. 그 장면이 쓸 항목에 짓기 전에 세대를 적는다:
  - 세트 glb 셋 (`kitCache`)
  - 나무 세트 열쇠 (`treeCaches`: 빌보드 굽기 타깃 2장 + 나무 지오메트리·재질)
  - 사람 glb (`realpeople.js` 캐시)
- **풀기:** 지금·바로 앞 장면이 쓰지 않은 항목은 지오메트리·재질·텍스처·렌더 타깃을 `dispose` 하고 지운다. 다시 필요하면 다시 만든다.
  - ez-tree 텍스처는 ez-tree 가 함께 쓰므로 두고, glb 나무 텍스처는 세트 glb 와 함께 풀린다.
- `info().caches = { gen, kits, trees, people, freed }`.
- `look-real.html?shared=1` 에 `window.__swap(set, land, area, year)` 를 더했다 (그리개 하나를 함께 쓴다).
- **시험 결과** (`.playwright-mcp/p2_t1_cache.mjs`):
  - 세트 2 × 땅 5 × 땅 갈래(인도·인더스·스리랑카·인도네시아·말레이·벵골)로 13번 바꿔 지었다.
  - `renderer.info.memory` 지오메트리 207~236, 텍스처 126~177 로 묶여 있다. 앞 절반과 뒤 절반의 최대가 같다 (177).
  - 캐시는 세트 glb 3~5, 나무 세트 2, 사람 2 개다. 23 항목을 풀었고, 콘솔 오류 0.

## R4. Minor
- **M-1:** `RECIPES.*` 에 `activity`·`hedge`·`dress`·`graveyard` 를 두었다.
  - `activity` 는 텃밭·걸상 소품, 걸상 높이, 좌판 앞에 서기, 큰 소품 가림 문턱, 사원 앞 자리, 빈터 배경, 내 살빛 범위다.
  - `hedge` 는 두렁 나무 남기기·종 고르기, `dress` 는 꾸미기 함수다.
  - `realscene.js` 에 세트 이름 비교(`kit === 'southasia'`)가 하나도 남지 않았다 (프리셋 열쇠도 표로).
- **M-3:** glb 나무·반얀 공기뿌리를 못 읽으면 그 종(뿌리)만 빼고 경고한다. 나무 세트 전체가 사라지지 않는다.
- **M-4:**
  - 남아시아 마을 결정성 (중세·고대 인더스·동남아 × 시드 2).
  - 잉글랜드 계획 고정 해시 (시드 4개; 단계 B 코드와 수정 1차 코드가 같은 해시).
  - `BUILT_KITS` ↔ `KIT_SETS`·`RECIPES`·glb 파일·갈래 사람 glb·물감.
  - `villagers_seasia.glb` 짜임 대조 (`kit.test.mjs`).
- **M-6:** glb 나무(야자·대나무·바나나)에도 땅 모습 잎 색 곱을 입힌다.
- **M-7:** 두렁 줄 겹친 주석을 정리했다. `edges` 는 띠를 그을 때만 센다.
- 하지 않은 것:
  - M-2 (나무 묶음 그리기 횟수)
  - M-5 (`KIT_SETS` 의 안 쓰는 칸 정리) — 아래 R7 참고.

## R5. 확인
- **결정성:**
  - `villagers_southasia.glb` (1962 KB): 두 번 지어 바이트 동일, 미리보기 5장 동일.
  - `villagers_seasia.glb`: 두 번 지어 바이트 동일, 미리보기 5장 동일.
  - 잉글랜드로 다시 지은 `villagers.glb`·`anims.glb`·`people_{idle,walk,hammer}.png` 가 배포본과 바이트까지 같다 (검토가 지적한 「파일 시각으로는 입증 안 됨」을 직접 확인).
  - 남아시아·동남아 빌드가 임시로 지은 동작 묶음도 배포 `anims.glb` 와 같다.
  - 건물·소품·식생 glb 는 이번에 고치지 않았다.
- **`npm test`:** 215/215 통과.
  - 중간에 `test/life.test.mjs` 「작은 일」 하나가 실패했다. 다른 에이전트가 고치던 파일이라 손대지 않았고, 마지막 실행에서는 통과했다.
- **실제 플레이** (시스템 Chrome headless, 포트 8783), 콘솔 오류 모두 0:

  | 시드 | 생 | 다시 찍은 그림 | 내 사람 키 |
  |---|---|---|---|
  | T4-21 | 1304 인도 | `p2_t1_india_{wide,child,close}.png` | 0.376 |
  | P2-44 | 1875 인도 거리 | `p2_t1_street_{wide,close}.png` | 0.357 |
  | P2-114 | 1056 인더스, 사원 대신 신당 | `p2_t1_estate_{wide,child,close}.png` | 0.363 |
  | R1-106 | 720 인도네시아 (새) | `p2_t1_sea_{wide,close}.png` — 사롱·머리 수건, 사원 없음 | 0.376 |
  | R1-58 | 기원전 679 인도 (새) | `p2_t1_ancient_{wide,close}.png` — 사원·읍내 집 없음 | 0.376 |

- **`?seed=T4-21&auto=1` 한 생 전체:** 61살, 96초. 콘솔 오류 0, 경고 0, 장면 오류 0.

## R6. 성능 (이번에는 GAMA 가 꺼져 있어 쟀다)
- `.playwright-mcp/p2_t1_perf.mjs`: look-real 1600×900 '높음'.
- 잰 방법: `bench(90)` = 렌더 + readPixels 동기로 GPU 가 끝날 때까지 기다린 프레임 시간. 시스템 Chrome headless + ANGLE D3D11 RTX 2060.

  | 장면 | 전경 | 골목 |
  |---|---|---|
  | 잉글랜드 | 15.5 ms (64 fps, 1125 호출) | 13.7 ms (73 fps) |
  | 남아시아 인도 1304 | 15.3 ms (65 fps, 1273 호출) | 13.0 ms (77 fps) |
  | 인더스 1056 | 12.4 ms (81 fps) | 11.0 ms |
  | 인도네시아 720 | 14.5 ms (69 fps) | 13.3 ms |

- 60 fps 목표 안이다. 다만 headless·동기 측정이라 실제 화면 rAF 와 조금 다를 수 있다. 다른 에이전트 작업으로 CPU 가 24% 쯤 쓰이고 있었다.

## R7. 남은 걱정
1. **앙가바스트람 앞자락은 아직 납작한 평행사변형이다.** 가까이 보면 천 두께감이 적다. 뒷자락은 좁은 띠로 바뀌어 판처럼 보이지 않는다.
2. **터번은 여전히 「홈 파인 원통」에 가깝다** (검토 Visual note). 이번 범위(I-1 목록) 밖이라 그대로 두었다. 남아시아 `f_cloak` 의 `Hair_Buns` 도 그대로다.
3. **동남아 갈래의 범위는 사람·사원뿐이다.** 동남아에도 두 층 벽돌 읍내 집(`house_town`)·남아시아 흙집이 그대로 서고, 기둥 위 집 같은 동남아 건물은 아직 없다. 머리 수건은 납작한 천 모자로 읽힌다.
4. **고대 생은 사원·읍내 집·수레만 거른다.** 촐리·쿠르타 같은 중세 재단 옷은 그대로다.
5. **남은 Minor:**
   - M-2: 나무 묶음 그리기 횟수. 측정상 60 fps 안이라 뒤로 미뤘다.
   - M-5: `KIT_SETS` 의 안 쓰는 칸 정리.
   - 친구 공유 README 한계 문구 (「세트는 중세 인도 일반형, 동남아·고대는 임시」): 공유 폴더 파일이라 이번에 쓰지 않았다.
