# 실사 시험 장면(look-real) 자산 출처

모두 CC0 또는 MIT 이다. 다시 받기: `python tools/fetch_real.py` (텍스처). 사람 모델은 아래 '사람' 절차(Blender 스크립트)로 만든다.

## 텍스처 — Poly Haven (CC0 1.0)

1K JPG. 주소 형식: `https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/<이름>/<이름>_<맵>_1k.jpg`
(diff = 색, nor_gl = OpenGL 노멀, arm = AO·거칠기·금속). 라이선스: https://polyhaven.com/license

| 파일 | 자산 | 쓰는 곳 |
|---|---|---|
| `tex/leafy_grass_{diff,nor_gl}_1k.jpg` | [Leafy Grass](https://polyhaven.com/a/leafy_grass) | 풀밭·공유지 |
| `tex/farm_soil_{diff,nor_gl}_1k.jpg` | [Farm Soil](https://polyhaven.com/a/farm_soil) | 갈아엎은 밭·텃밭 |
| `tex/withered_grass_diff_1k.jpg` | [Withered Grass](https://polyhaven.com/a/withered_grass) | 밀밭·휴경지·건초 (금빛으로 물들임) |
| `tex/brown_mud_dry_{diff,nor_gl}_1k.jpg` | [Brown Mud Dry](https://polyhaven.com/a/brown_mud_dry) | 흙길 |
| `tex/river_small_rocks_diff_1k.jpg` | [River Small Rocks](https://polyhaven.com/a/river_small_rocks) | 강바닥·물가 |
| `tex/rustic_stone_wall_{diff,nor_gl,arm}_1k.jpg` | [Rustic Stone Wall](https://polyhaven.com/a/rustic_stone_wall) | 오두막·대장간·물레방앗간·다리·굴뚝·돌담 |
| `tex/castle_wall_slates_{diff,nor_gl,arm}_1k.jpg` | [Castle Wall Slates](https://polyhaven.com/a/castle_wall_slates) | 교회 벽·탑·비석 |
| `tex/grey_plaster_{diff,nor_gl}_1k.jpg` | [Grey Plaster](https://polyhaven.com/a/grey_plaster) | 석회 회벽 (크림색으로 물들임) |
| `tex/old_planks_02_{diff,nor_gl}_1k.jpg` | [Old Planks 02](https://polyhaven.com/a/old_planks_02) | 목골조 기둥·보, 문, 헛간 판자, 울타리 |
| `tex/thatch_roof_angled_{diff,nor_gl,arm}_1k.jpg` | [Thatch Roof Angled](https://polyhaven.com/a/thatch_roof_angled) | 초가 지붕 |
| `tex/roof_slates_02_{diff,nor_gl,arm}_1k.jpg` | [Roof Slates 02](https://polyhaven.com/a/roof_slates_02) | 교회·대장간 슬레이트 지붕, 첨탑 |

### 건물 세트(kits/england.glb)용으로 더 받은 것 (2026-10-20, Poly Haven CC0, 1K, `tools/fetch_real.py` 로 다시 받기)

| 파일 | 자산 | 세트 재료 이름 |
|---|---|---|
| `tex/reed_roof_04_{diff,nor_gl}_1k.jpg` | [Reed Roof 04](https://polyhaven.com/a/reed_roof_04) | `thatch` (맨 위 이끼 띠를 잘라내고 세로로 이어 붙여 씀) |
| `tex/rough_wood_{diff,nor_gl}_1k.jpg` | [Rough Wood](https://polyhaven.com/a/rough_wood) | `timber_dark` (짙은 참나무로 물들임) |
| `tex/white_rough_plaster_{diff,nor_gl}_1k.jpg` | [White Rough Plaster](https://polyhaven.com/a/white_rough_plaster) | `plaster_lime` (크림색 석회로 물들임) |
| `tex/clay_plaster_{diff,nor_gl}_1k.jpg` | [Clay Plaster](https://polyhaven.com/a/clay_plaster) | `wattle` (욋가지 흙벽 = wattle & daub 의 흙 바름) |
| `tex/cobblestone_02_{diff,nor_gl}_1k.jpg` | [Cobblestone 02](https://polyhaven.com/a/cobblestone_02) | `cobble` (대장간 바닥·우물 둘레·교회 현관) |
| `tex/rough_linen_{diff,nor_gl}_1k.jpg` | [Rough Linen](https://polyhaven.com/a/rough_linen) | `canvas` (장터 차양, 줄무늬로 물들임) |

이미 있던 것 중 세트에 쓴 것: `rustic_stone_wall`(→ `stone_rubble`), `castle_wall_slates`(→ `stone_ashlar`, 교회·모서리 돌), `roof_slates_02`(→ `slate`), `old_planks_02`(→ `planks`), `leafy_grass`(Blender 미리보기 땅만).

### 소품 세트(kits/props_england.glb)용으로 더 받은 것 (2026-10-20, Poly Haven CC0, 1K, `tools/fetch_real.py` 로 다시 받기)

| 파일 | 자산 | 세트 재료 이름 |
|---|---|---|
| `tex/bark_brown_02_{diff,nor_gl}_1k.jpg` | [Bark Brown 02](https://polyhaven.com/a/bark_brown_02) | `bark` (장작·받침 통나무·울짱·욋가지 울·그루터기, 채도를 낮춤) |
| `tex/stacked_stone_wall_{diff,nor_gl}_1k.jpg` | [Stacked Stone Wall](https://polyhaven.com/a/stacked_stone_wall) | `stone_dry` (막쌓은 돌담, 붉은 기를 빼 회황색으로) |
| `tex/wool_boucle_nor_gl_1k.jpg` | [Wool Boucle](https://polyhaven.com/a/wool_boucle) | `fleece` 의 노멀만 (양털 결. 색 그림은 체크 무늬라 받지 않는다) |

이미 있던 것 중 소품 세트에 쓴 것: `old_planks_02`(→ `planks`), `rough_wood`(→ `timber_dark`), `reed_roof_04`(→ `hay`·`thatch`, 건초더미 몸과 이엉), `rough_linen`(→ `linen` 자루, `canvas_b` 파란 줄무늬 천막), `farm_soil`(→ `soil` 텃밭 두둑).

## 건물 세트 — `kits/england.glb` (이 저장소에서 만든 것, 외부 모델 없음)

- 만드는 법: `"C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_england.py`
  (`tools/blender/kit_common.py` 공통 도구). 형태는 전부 Python 으로 짓고, 재료는 위 CC0 텍스처를 물들여 쓴다.
- 그늘(AO): Cycles 로 두 번째 UV(`AO`, glTF TEXCOORD_1) 아틀라스 2048² 한 장에 굽는다 → glTF `occlusionTexture`(texCoord 1) → three.js `aoMap`(uv1).
  굽기는 Cycles OptiX(RTX 2060)로 했다. 같은 PC·장치에서는 다시 돌려도 바이트까지 같지만, 다른 GPU·CPU 에서는 AO 화소가 조금 달라질 수 있다(바이트 동일 보장 없음).
- 조각 바닥 크기: `kits/england.dims.json` (Blender 가 함께 내보냄) ↔ `kitdata.js` 의 `KIT_DIMS` 를 `test/kit.test.mjs` 가 맞춰 본다.
- 압축 도구 위치: 환경변수 `GLTFT`, 없으면 `docs/past-life/tools/node_modules`(`npm i --prefix docs/past-life/tools …`, .gitignore 됨). 못 찾으면 스크립트가 멈추고 배포 glb 를 덮지 않는다.
- 압축: `docs/past-life/tools/pack_kit.mjs` (gltf-transform 4 + meshoptimizer 0.21 + sharp, 개발 도구라 저장소에 넣지 않음, MIT/Apache-2.0) → EXT_meshopt_compression + KHR_mesh_quantization + EXT_texture_webp.
  three.js 쪽은 `three/addons/libs/meshopt_decoder.module.js`(MIT) 를 GLTFLoader 에 꽂는다.
- 미리보기: `kits/preview/england_*.png` (Blender Eevee, 1280×720).

## 소품·가축 세트 — `kits/props_england.glb` (이 저장소에서 만든 것, 외부 모델 없음)

- 만드는 법: `GLTFT=<gltf-transform 폴더> "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_props.py`
  (`kit_common.py` 공통 도구를 함께 쓴다. 굽기·압축·결정성 약속은 건물 세트와 같다: 같은 PC·장치에서 다시 돌리면 glb·미리보기가 바이트까지 같다).
- 조각: 수레·통·상자·장작더미·건초더미·자루, 욋가지 울·막쌓은 돌담(2 m, 이어 붙임)·가로대 울타리(2.5 m, 덤), 여물통·모루·연장 걸이, 장터 물건·천 차양, 걸상·꽃밭·텃밭 두둑,
  가축 양·소·말·닭·오리. 가축은 단면 고리를 이은 몸(loft)에 다리·머리·귀·뿔을 붙인 것이다 (사실 비례, 털·가죽은 노멀 결 + 재료 색, 장면에서 마리마다 색을 곱한다).
  양은 촘촘한 고리 + 털 뭉치 잡음, 짙은 얼굴·가는 짙은 다리. 오리 몸·목은 전용 재료 `down`(색 곱은 몸에만, 부리·눈은 palette).
  꽃밭은 앞뒤 마름모 잎 카드 + 육각 꽃 원반 + 작은 원뿔 꽃 이삭 (삼각형 ≤1,500).
- 스크립트가 numpy 로 만드는 텍스처 (외부 자산 아님): `props_palette.png`(64² 색표: 꽃·채소·뿔·부리·발굽 같은 작은 색 부품을 재료 하나로 모음, 칸 가운데 UV),
  `props_endgrain.png`(통나무 자른 면 나이테·갈라짐), `props_hide_n.png`(짧은 털 가죽 노멀).
- 조각 크기: `kits/props_england.dims.json` ↔ `kitdata.js` 의 `PROP_DIMS` (`test/kit.test.mjs`).
- 미리보기: `kits/preview/props_{overview,animals,market,yard,garden,sheep}.png`.

## 남아시아 세트 (작업 2-1, 2026-10-21) — 이 저장소에서 만든 것, 외부 모델 없음

시대 일반형 마을이다 (특정 실존 건물을 본뜨지 않았다). 같은 PC 에서 두 번 지어 glb·dims·미리보기가 바이트까지 같다.
압축 도구는 잉글랜드 세트와 같은 gltf-transform 4.5.1 + meshoptimizer 0.21 + sharp 0.35 (`GLTFT` 폴더; 이 도구로 england_raw 를 다시 누르면 배포 england.glb 와 바이트까지 같다).

### 더 받은 텍스처 (Poly Haven CC0 1.0, 1K, `tools/fetch_real.py` 로 다시 받기)

| 파일 | 자산 | 세트 재료 이름 |
|---|---|---|
| `tex/patterned_clay_plaster_{diff,nor_gl}_1k.jpg` | [Patterned Clay Plaster](https://polyhaven.com/a/patterned_clay_plaster) | `mud_bare`(맨흙 벽), `mud_red`(붉은 흙 밑단·기단) — 같은 그림을 물들임 |
| `tex/red_brick_plaster_patch_02_{diff,nor_gl}_1k.jpg` | [Red Brick Plaster Patch 02](https://polyhaven.com/a/red_brick_plaster_patch_02) | `brick_old` (두 층 읍내 집·곳간 기둥) |
| `tex/sandstone_blocks_08_{diff,nor_gl}_1k.jpg` | [Sandstone Blocks 08](https://polyhaven.com/a/sandstone_blocks_08) | `sandstone` (사원·가트·우물 기둥, 담황색으로 물들임) |
| `tex/clay_roof_tiles_02_{diff,nor_gl}_1k.jpg` | [Clay Roof Tiles 02](https://polyhaven.com/a/clay_roof_tiles_02) | `tiles` (읍내 집 기와 차양) |
| `tex/bamboo_wall_{diff,nor_gl}_1k.jpg` | [Bamboo Wall](https://polyhaven.com/a/bamboo_wall) | `bamboo` (툇마루 기둥·울·사다리·대나무 줄기) |
| `tex/palm_tree_bark_{diff,nor_gl}_1k.jpg` | [Palm Tree Bark](https://polyhaven.com/a/palm_tree_bark) | `palm_bark` (코코넛·빈랑·대추 야자 줄기) |

이미 있던 것 중 쓴 것: `white_rough_plaster`(→ `mud_lime` 석회칠), `reed_roof_04`(→ `thatch` 볏짚 초가·`hay`), `rough_wood`(→ `timber_dark`), `old_planks_02`(→ `planks`),
`rough_linen`(→ `canvas` 꼭두서니·사프란 줄무늬 차양, `canvas_jute` 마대), `brown_mud_dry`(Blender 미리보기 땅), `bark_brown_02`(→ `bark` 반얀 공기뿌리).

### 건물 — `kits/southasia.glb` (`tools/blender/kit_southasia.py` + `kit_sa_common.py`)

- 조각: `hut_mud_a`(석회칠 흙집·박공 초가·앞 툇마루), `hut_mud_b`(맨흙 둥근 집·원뿔 초가·둘레 툇마루), `house_courtyard`(흙벽돌 안뜰집),
  `house_town`(두 층 벽돌집·나무 발코니), `temple_small`(나가라 양식 작은 사원), `shrine_tree`(나무 밑 신당 단), `well_step`(물가 가트 계단·작은 정자),
  `well_kuan`(마을 우물), `granary`(기둥 위 곳간), `market_stall_sa`(천 차양 좌판), `smithy_sa`(흙 뒷벽·초가 차양 대장간, 화덕 표지 `smithy_forge`).
  이름 `haveli` 는 작업 4 의 큰 집 몫.
- 단계 B 손질: 안뜰집에 석회 갓돌 턱·석회 띠·붉은 흙 밑단·석회 덧칠 조각·나무 상인방(까치발·놋 못)·사암 문턱·벽감 테,
  읍내 집 가게 안은 빛나지 않는 어두운 흙빛 `shade` 재질 + 선반 두 단·항아리·자루, 가트 계단 뒤는 꽉 찬 둑.
- 그늘(AO)·압축·크기 표 약속은 잉글랜드 세트와 같다 (`kits/southasia.dims.json` ↔ `kitdata.js` `KIT_DIMS_SA`, `test/kit.test.mjs`).
- 결정성: `recalc_face_normals` 를 쓰지 않는다 — 벽·자르개 감김을 만들 때부터 맞춘다 (`kit_sa_common.prism_ok`·`bool_cut`).
- 미리보기: `kits/preview/southasia_{조각}.png`, 마을 모퉁이 `southasia_village.png`·`southasia_lane.png`·`southasia_lane2.png`
  (마을 그림에는 아래 소품·야자를 미리보기에서만 함께 놓는다 — `tools/blender/kit_vignette_southasia.py`).

### 소품·가축 — `kits/props_southasia.glb` (`tools/blender/kit_props_southasia.py`)

- 조각: 소달구지, 흙 항아리·놋 물병(lota), 끈 침상(charpai), 볏짚 가리, 마대, 바구니·키, 쇠똥 떡 더미, 흙 아궁이, 바닥 베틀, 흙 담·대나무 울(2 m, 이어 붙임), 흙 여물통,
  혹소(cow_zebu)·물소·염소·닭. 가축은 잉글랜드 소품 세트와 같은 고리 몸(loft) 방식 (`kit_props.py` 의 결정적 도형 도구를 그대로 쓴다).
- 스크립트가 numpy 로 만드는 텍스처: `sa_palette.png`(색표), `sa_weave.png`(끈 침상 엮음), `props_hide_n.png`(짧은 털 가죽 노멀, 잉글랜드와 같은 것).
- 크기: `kits/props_southasia.dims.json` ↔ `PROP_DIMS_SA`. 미리보기: `kits/preview/southasia_{props_overview,animals,props_yard}.png`.

### 식생 — `kits/trees_southasia.glb` (`tools/blender/kit_trees_southasia.py`) + ez-tree 프리셋

- Blender 로 지은 것 (ez-tree 로 못 짓는 꼴): 코코넛·빈랑·대추 야자, 바나나, 대나무 포기, 반얀 공기뿌리(기둥 뿌리 + 매달린 뿌리), 카슈 풀·마른 풀.
  잎·풀은 스크립트가 만든 잎 띠 그림 `sa_frond.png` 한 장(512×256, 16 색 띠, 양면 재질 `frond`) — 조각마다 줄기 재질 하나 + `frond` 하나뿐이라
  게임에서 재질별 인스턴싱·먼 거리 판(빌보드)으로 묶인다. 그늘은 굽지 않는다. 크기: `kits/trees_southasia.dims.json` ↔ `TREE_DIMS_SA`.
- 넓은잎 나무(반얀·보리수·망고·님·바불)와 덤불은 ez-tree 1.1.0(MIT) 프리셋 값만 `kitdata.js` `TREES_SA`·`BUSHES_SA` 에 둔다 (실행 때 생성).
  미리보기: `tools/trees_preview.html` → `kits/preview/southasia_eztrees.png` (Blender 식생도 함께), `kits/preview/southasia_trees.png`.

### 사람 — `people/villagers_southasia.glb` (`KIT_CULTURE=southasia` 로 `tools/blender/kit_clothes.py`)

- 원본은 잉글랜드 사람과 같은 Quaternius Universal Base Characters / Universal Animation Library (CC0). 뼈대·변형 이름(`v_*`)·LOD(`_lod0`·`_lod1`)·재질이 `villagers.glb` 와 같아 주소만 바꿔 쓴다.
  동작 묶음은 `people/anims.glb` 를 그대로 쓴다 (남아시아 빌드가 임시 폴더에 지은 동작 묶음이 배포 anims.glb 와 바이트까지 같다).
- 옷 (시대 일반형 평민 옷, 맨발): 도티(앞·뒤 단을 올린 여밈 + 앞 주름), 쿠르타, 터번·머리 수건(머리뼈에 고정), 어깨 숄, 사리(치마 + 대각 자락 팔루 + 머리를 덮는 베일) + 촐리.
  변형 자리 (단계 B): m_tunic 쿠르타+도티+터번, m_hood 짧은 쿠르타+도티+앙가바스트람(어깨 천)+터번+수염, m_smith 반소매 쿠르타+무릎 도티+머리 수건,
  m_field 맨 윗몸(근육을 다듬어 누그러뜨림)+짧은 도티+왼어깨 감차+머리 수건 — 맨 윗몸은 이 한 자리뿐, f_apron 사리+얼굴이 열린 베일(뒤로 주름), f_cloak 사리(틀어 올린 머리),
  child 무릎 쿠르타, elder 쿠르타+도티+앙가바스트람+흰 터번+수염. 터번은 머리 높이의 약 1.3 배, 살짝 비틀린 띠를 겹쳐 감는다.
  살빛은 잉글랜드처럼 밝히지 않고 갈색으로 (사람마다 장면 살빛 배수). 머리색·옷 물감은 `peopleplan.js` `PALETTES.southasia` (검정·짙은 갈색 머리, 천연 염료).
- 미리보기: `kits/preview/people_southasia_{idle,walk,close,work,heads}.png`.
- 수정 1차 (검토 I-1): 머릿자락 아랫단은 격자 칸을 지우지 않고 열마다 자를 높이까지 다시 놓아 매끈한 곡선(+ 말린 단), 머릿자락이 어깨·등에서 팔루를 덮는다.
  팔루는 오른 허리춤에 접어 넣은 좁은 끝에서 시작하고(허리 앞 네모 판 없앰), 반지름 마당을 다듬어 촐리 단을 지날 때 톱니가 생기지 않으며 옅은 주름이 있다.
  앙가바스트람은 왼어깨에서 앞·뒤로 곧게 늘어지는 두 자락(세로 주름, 비스듬한 단). 느슨하게 두른 천(팔루·어깨 천·감차)은 밑의 몸 면을 지우지 않는다 (움직일 때 구멍이 보이던 것).

### 사람 (동남아 갈래) — `people/villagers_seasia.glb` (`KIT_CULTURE=seasia` 로 `tools/blender/kit_clothes.py`, 수정 1차)

- 남아시아 세트를 쓰는 동남아 땅(mainland_sea·indonesia·malay·philippines)의 사람. 원본·뼈대·변형 이름·LOD·재질은 `villagers.glb` 와 같다 (주소만 바꿔 쓴다).
- 옷 (시대 일반형 평민, 맨발): 사롱(허리 두름 통 치마, 일할 때 걷어 올림), 짧은 웃옷(남아시아 쿠르타 격자를 짧게), 머리 수건(터번 틀을 낮고 납작하게) 또는 맨머리,
  여자는 짧은 저고리 또는 가슴 두름 + 어깨 띠, 틀어 올린 머리·긴 머리. 터번·사리·베일은 없다. 맨 윗몸은 밭일꾼(m_field) 하나.
- 물감: `peopleplan.js` `PALETTES.seasia` (쪽빛·소가 갈색·노니 붉은 갈색·짙은 초록·검정·생무명).
- 미리보기: `kits/preview/people_seasia_{idle,walk,close,work,heads}.png`.

## 동아시아 세트 (작업 2-2, 2026-10-21) — 이 저장소에서 만든 것, 외부 모델 없음

중국·한국·일본의 시대 일반형 마을이다 (특정 실존 건물을 본뜨지 않았다). 같은 PC 에서 두 번 지어 glb·dims·미리보기가 바이트까지 같다.
압축 도구는 잉글랜드·남아시아 세트와 같은 gltf-transform 4.5.1 + meshoptimizer 0.21 + sharp 0.35 (`GLTFT` 폴더).

### 더 받은 텍스처 (Poly Haven CC0 1.0, 1K, `tools/fetch_real.py` 로 다시 받기)

| 파일 | 자산 | 세트 재료 이름 |
|---|---|---|
| `tex/grey_roof_tiles_{diff,nor_gl}_1k.jpg` | [Grey Roof Tiles](https://polyhaven.com/a/grey_roof_tiles) | 기와 풍화 결 (스크립트가 만든 골기와 무늬에 섞는다), `ridge` 용마루 |
| `tex/brick_wall_11_{diff,nor_gl}_1k.jpg` | [Brick Wall 11](https://polyhaven.com/a/brick_wall_11) | `brick_grey` (중국 청벽돌 — 회색으로 물들임, 벽돌 탑) |
| `tex/japanese_stone_wall_{diff,nor_gl}_1k.jpg` | [Japanese Stone Wall](https://polyhaven.com/a/japanese_stone_wall) | `stone` (기단·주춧돌·석탑 기단·디딤돌) |
| `tex/clay_block_wall_{diff,nor_gl}_1k.jpg` | [Clay Block Wall](https://polyhaven.com/a/clay_block_wall) | `rammed` (판축 흙벽·흙담) |
| `tex/weathered_plank_siding_{diff,nor_gl}_1k.jpg` | [Weathered Plank Siding](https://polyhaven.com/a/weathered_plank_siding) | `boards` (일본 민가 판벽·곳간) |
| `tex/broken_wall_{diff,nor_gl}_1k.jpg` | [Broken Wall](https://polyhaven.com/a/broken_wall) | `rubble` (한국 돌담·굴뚝·막돌) |
| `tex/hinoki_planks_{diff,nor_gl}_1k.jpg` | [Hinoki Planks](https://polyhaven.com/a/hinoki_planks) | `floor` (툇마루·엔가와·평상) |

이미 있던 것 중 쓴 것: `rough_wood`(→ `timber`, `timber_red` 붉은 칠 기둥), `old_planks_02`(→ `planks`, 나무다리), `white_rough_plaster`(→ `plaster`·`lime`·`wall_red`·`granite`),
`clay_plaster`(→ `earth` 흙벽), `reed_roof_04`(→ `thatch` 초가·`hay`), `bamboo_wall`(→ `bamboo` 울·대 줄기), `farm_soil`(→ `soil` 텃밭), `leafy_grass`(Blender 미리보기 땅만).

### 스크립트가 만든 그림 (CC0, 이 저장소)

- `tex/ea_persimmon_leaf.png` — 감나무 잎 9장 + 주황 감 3개 잔가지 그림 (`docs/past-life/tools/make_leaf_tex.py`, numpy+PIL, 결정적). ez-tree 감나무의 잎 그림을 바꿔 끼운다 (`kitdata.js` `TREES_EA` `leafTex`).
- 빌드 임시 폴더에서 numpy 로 짓는 것: 골기와 무늬(색·노멀, 땅 갈래마다 기와빛), `ea_palette.png`(작은 색 조각 색표), `ea_mat_weave.png`(멍석·바구니 엮음), `ea_frond.png`(대잎·억새·갈대 띠 그림).

### 건물 — `kits/eastasia.glb`(중국) · `eastasia_korea.glb` · `eastasia_japan.glb` (`tools/blender/kit_eastasia.py` + `kit_ea_common.py`, `KIT_VARIANT=china|korea|japan`)

- 세 glb 가 같은 조각 이름을 쓴다: `house_thatch_ea`(초가: 중국 흙벽·한국 초가 둥근 지붕+굴뚝·일본 가파른 이엉), `house_tile_ea`(기와집: 중국 청벽돌·한국 팔작 기와+툇마루·일본 판벽+엔가와),
  `house_town_ea`(가게 딸린 읍내 집), `temple_ea`(절 큰 법당), `pagoda_small`(탑: 중국 벽돌 탑·한국 석탑·일본 목조 탑), `gate_ea`(대문), `well_ea`, `granary_ea`(곳간),
  `smithy_ea`(대장간, 화덕 표지 `smithy_forge`), `shrine_ea`(마을 사당 — 원점에 장면이 마을 나무를 세운다), `stall_ea`(좌판), `pit_house_ea`(움집), `camp_hearth`(농사 전 야영 화덕).
  `courtyard_estate`(큰 안뜰 집)는 작업 4 몫.
- 지붕: 오목한 지붕 곡선 + 처마 끝 들림 + 우진각·맞배·팔작(합각) 격자, 골기와 무늬, 용마루·내림마루, 막새. 한국 석탑은 브리프의 목조가 아니라 돌 (한국 탑의 일반형).
- 크기 표: 각 `kits/eastasia*.dims.json` ↔ `kitdata.js` `KIT_DIMS_EA`·`KIT_DIMS_EA_KR`·`KIT_DIMS_EA_JP` (`test/kit.test.mjs`).
- 결정성: `recalc_face_normals`·`primitive_uv_sphere_add` 를 쓰지 않는다 (`kit_sa_common.prism_ok`·`bool_cut` 와 같은 방식).
- 미리보기: `kits/preview/eastasia_{china,korea,japan}_{조각}.png`.

### 소품·가축 — `kits/props_eastasia.glb` (`tools/blender/kit_props_eastasia.py`, 세 땅이 함께 쓴다)

- 조각 22: 수레, 장독대, 독, 통(일본), 볏덕(벼 말리는 틀), 짚가리, 볏짚 단, 바구니, 절구, 장작, 평상, 텃밭 두둑, 구유, 디딤돌, 돌담·흙담·바자울(2 m, 이어 붙임),
  소·물소·돼지·닭·오리. 가축은 잉글랜드 소품 세트와 같은 고리 몸(loft) 방식.
- 크기: `kits/props_eastasia.dims.json` ↔ `PROP_DIMS_EA`. 미리보기: `kits/preview/eastasia_{props_overview,animals,props_yard}.png`.

### 식생 — `kits/trees_eastasia.glb` (`tools/blender/kit_trees_eastasia.py`) + ez-tree 프리셋

- Blender 로 지은 것: 대숲·작은 대 포기(가까이 InstancedMesh, 멀리 빌보드), 억새·갈대. 잎·풀은 `ea_frond.png` 한 장 + 줄기 재질 하나.
  크기: `kits/trees_eastasia.dims.json` ↔ `TREE_DIMS_EA`. 미리보기: `kits/preview/eastasia_trees.png`.
- 소나무·느티나무·버드나무·감나무(위 잎 그림)·단풍나무와 덤불은 ez-tree 1.1.0(MIT) 프리셋 값만 `kitdata.js` `TREES_EA`·`BUSHES_EA` 에 둔다 (실행 때 생성).

### 사람 — `people/villagers_{china,korea,japan}.glb` (`KIT_CULTURE=china|korea|japan` 로 `tools/blender/kit_clothes.py`)

- 원본은 잉글랜드 사람과 같은 Quaternius Universal Base Characters / Universal Animation Library (CC0). 뼈대·변형 이름·LOD·재질이 `villagers.glb` 와 같아 주소만 바꿔 쓴다.
  동작 묶음은 `people/anims.glb` 를 그대로 쓴다. 머리 모양(상투·쪽·촌마게·쌍상투)은 UBC 머리카락 + 살 재질 머리 칸으로 짓는다.
- 옷 (시대 일반형 평민):
  - 한국: 저고리+바지+상투·망건, 두루마기+갓, 삿갓 쓴 농부, 치마저고리+쪽머리, 앞치마+머릿수건, 땋은 머리 아이, 흰 두루마기+갓 노인 (평민은 흰옷·생무명이 많다).
  - 중국: 교령 짧은 겉옷+허리끈+바지+두건, 긴 포+건, 두립 쓴 농부, 웃옷+치마+쪽, 쌍상투 아이, 대장장이 가죽 앞치마.
  - 일본: 고소데+띠+모모히키+촌마게, 하오리, 스게가사 농부, 넓은 오비(등 매듭), 앞치마+머릿수건.
- 물감: `peopleplan.js` `PALETTES.eastasia`(중국)·`korea`·`japan`, 농사 전 야영은 `eastasia_camp`(물들이지 않은 삼·칡 섬유·가죽 빛).
- 미리보기: `kits/preview/people_{china,korea,japan}_{idle,walk,close,work,heads}.png`.

## 물결 노멀 — three.js 예제 (MIT)

| 파일 | 출처 |
|---|---|
| `tex/waternormals.jpg` | https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/textures/waternormals.jpg (three.js 저장소, MIT) |

## 사람 — Quaternius (CC0 1.0) + 이 저장소에서 지은 옷

| 파일 | 원본 | 만든 법 |
|---|---|---|
| `people/villagers.glb` (2.0 MB) | [Universal Base Characters](https://quaternius.itch.io/universal-base-characters) Standard(무료, CC0) → `Base Characters/Godot - UE/Superhero_{Male,Female}_FullBody.gltf`(몸·눈·눈썹·살 텍스처), `Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/Hair_{SimpleParted,Buzzed,Beard,Buns}.gltf`(머리카락·T_Hair_1/2) | `tools/blender/kit_clothes.py` 가 몸에 옷을 지어 입힌 변형 8명 (아래) + 연장 소품 (망치·괭이·지팡이·자루, 코드 도형) |
| `people/anims.glb` (0.27 MB) | [Universal Animation Library](https://quaternius.itch.io/universal-animation-library) Standard(무료, CC0) → `Unreal-Godot/UAL1_Standard.glb` | 같은 스크립트가 `docs/past-life/tools/pack_people.mjs` 로 동작 8개(Idle_Loop, Walk_Loop, Idle_Talking_Loop, Idle_Torch_Loop, Walk_Formal_Loop, Fixing_Kneeling, Sitting_Idle_Loop, Sitting_Talking_Loop)만, 회전 곡선 + 골반 이동만 남긴다 (몸마다 뼈 길이가 달라 다른 이동·크기 곡선은 뺀다) |

- 다시 만들기: `UBC_DIR=<Universal Base Characters[Standard] 폴더> UAL_GLB=<UAL1_Standard.glb> GLTFT=<gltf-transform 폴더> "C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python tools/blender/kit_clothes.py`
  - 두 묶음은 저장소에 넣지 않는다. itch.io 에서 받아(가격 0 선택, 로그인 없이 된다) 푼 폴더를 환경변수로 알려 준다.
  - 같은 PC 에서 두 번 돌려 `villagers.glb`·`anims.glb`·미리보기 3장이 바이트까지 같다. 30초 남짓 걸린다.
- 변형 8명 (노드 `v_<이름>` → 뼈대 `arm_<이름>` → `<이름>_lod0`(8~10k 삼각형)·`<이름>_lod1`(약 2k)):
  `m_tunic`(튜닉+각반), `m_hood`(튜닉+어깨 덮는 두건), `m_smith`(리넨 셔츠 소매 걷음+가죽 앞치마), `m_field`(짧은 리넨 튜닉+새끼 허리띠+각반+짚모자),
  `f_apron`(긴 치마+앞치마+머릿수건), `f_cloak`(긴 치마+등에 늘어진 망토), `child`(무릎 튜닉; 장면에서 0.6배+머리 1.22배), `elder`(발목 겉옷+리넨 쓰개+수염; 굽은 등·지팡이는 장면 코드).
- 옷 짓는 법: 몸을 수평(몸통)·뼈 수직(소매·감은 띠) 단면으로 잘라 지지 함수(볼록 껍질 반지름) + 여유·처짐·허리띠·치마 퍼짐·주름 물결로 격자를 짓는다.
  각반·신은 몸 면을 복사해 법선으로 띄운다. 두께는 Solidify(테두리만) + 양면 재질. 가중치는 몸 → 옷 Data Transfer, 치마 자락은 골반·허벅지 섞기, 앞치마·허리띠는 밑옷 가중치를 물려받는다.
  옷에 가려진 몸 면은 지운다. 미리보기 `kits/preview/people_{idle,walk,hammer}.png`, 걷기·서기·망치질 자세의 뚫림 검사 수는 스크립트 로그에.
- 재질 둘: `people_skin`(살 남·여 + 머리카락 1·2 + 눈을 2048² 아틀라스 한 장에 모음, 살빛은 덜 주황으로 다듬음; 정점색 = 머리카락/살/눈 칸 → 장면에서 사람마다 머리색·살빛),
  `people_cloth`(아래 천 텍스처의 밝기 결을 RGBA 채널로 묶은 512² + 노멀 묶음; 정점색 RGB = 주색/보조색/생지, A = 천 종류 → 장면에서 사람마다 물감).
- 천 텍스처 (Poly Haven CC0 1.0, 1K, `tools/fetch_real.py` 로 다시 받기):

| 파일 | 자산 | 쓰는 곳 |
|---|---|---|
| `tex/caban_{diff,nor_gl}_1k.jpg` | [Caban](https://polyhaven.com/a/caban) | 모직 결 (튜닉·치마·두건·망토) — 밝기 결만 쓰고 색은 장면 물감 |
| `tex/brown_leather_{albedo,nor_gl}_1k.jpg` | [Brown Leather](https://polyhaven.com/a/brown_leather) | 가죽 결·주름 노멀 (신·허리띠·대장장이 앞치마) |
| `tex/rough_linen_{diff,nor_gl}_1k.jpg` (이미 있던 것) | [Rough Linen](https://polyhaven.com/a/rough_linen) | 리넨 결 + 짠 천 노멀 (셔츠·앞치마·머릿수건·쓰개) |
| `tex/reed_roof_04_diff_1k.jpg` (이미 있던 것) | [Reed Roof 04](https://polyhaven.com/a/reed_roof_04) | 짚모자 결 |

- 장면 쪽: `realpeople.js`(그리기·동작·코드 덧씌우기), `peopleplan.js`(시드로 사람 고르기, Node 시험 `test/peopleplan.test.mjs`).
- `people/villager_m.glb`·`villager_f.glb`(옛 마네킹 몸, 셰이더로 칠한 옷)는 이제 쓰지 않는다. 작업 3 전후 비교 그림용으로만 남겨 두었다 (지워도 된다).

## 나무·덤불 — @dgreenheck/ez-tree 1.1.0 (MIT)

내려받아 두지 않고 실행 때 CDN 에서 부른다: `https://cdn.jsdelivr.net/npm/@dgreenheck/ez-tree@1.1.0/build/ez-tree.es.js`
(약 4 MB, 껍질·잎 텍스처가 base64 로 들어 있음. 저작자 Daniel Greenheck, https://github.com/dgreenheck/ez-tree).
종 7가지: 참나무(Oak Medium·Large), 물푸레(Ash Medium), 버드나무(Ash Medium + willow 껍질 + 가지 끝을 늘어뜨리는 휨 — 코드),
자작(Aspen Medium, birch 껍질), 산사(Oak Small 고친 값), 사과(Oak Small 고친 값) + 덤불 Bush 1/2/3. 값은 `realscene.js` 의 `PRESETS.trees`.
먼 나무는 종마다 8방향 × (색·노멀) 빌보드를 실행 때 구워 해 방향으로 다시 비춘다 (외부 자산 아님).
게임에 넣을 때는 나무 지오메트리를 GLB 로 구워 저장하는 편이 낫다 (매번 생성 + 4 MB 를 피함).

## 세계지도 땅 — Natural Earth (공개 영역)

| 파일 | 자산 | 쓰는 곳 |
|---|---|---|
| `../geo/land.json` (약 124 KB) | [Natural Earth](https://www.naturalearthdata.com/) 1:50m Land (공개 영역, https://www.naturalearthdata.com/about/terms-of-use/). npm `world-atlas@2.0.2`(ISC, TopoJSON 으로 옮긴 판)의 `land-50m.json` 에서 받음 | 옛 지도책 세계지도 (`worldmap.js`·`geo.js`) |

만드는 법: `npm install --ignore-scripts world-atlas@2.0.2` (작업 폴더 밖 임시 폴더) → `node tools/make_geo.mjs <…/world-atlas/land-50m.json>`.
TopoJSON 을 직접 풀고, 날짜변경선을 건너는 고리는 −180°/180° 에서 나누고, 북위 75°~남위 56° 로 자르고(남극 빠짐), Douglas–Peucker 0.035° 로 줄이고, 0.004 도² 보다 작은 섬을 빼고, 1/50° 격자 정수의 차이(delta)로 적는다.
산줄기 빗금(`geo.js` MOUNTAINS)·지형 빛깔·종이 결·나침반 장미는 자료가 아니라 코드로 그린다 (Natural Earth 땅에는 높이가 없다).

## 코드로 만든 것 (외부 자산 아님)

하늘(three.js Sky, MIT), 구름 셰이더, 지형·밭 조각보·산울타리·다리(위 길은 `brown_mud_dry`)·묘지 비석·풀포기 텍스처(캔버스)·들꽃 포기 텍스처(캔버스)·연기 텍스처(캔버스).
건물(집·교회·대장간·물레방앗간과 물레바퀴·우물·좌판)은 위 '건물 세트', 울타리·돌담·양 같은 소품과 가축은 위 '소품·가축 세트'(Blender 스크립트)에서 온다.
동아시아 세트(작업 2-2): 나무다리(말뚝·멍에·널·난간)와 농사 전 야영의 통나무 다리, 계단식 논의 두렁 줄(지형 셰이더의 등고선), 종이 창 저녁 빛은 `realscene.js` 코드로 만든다.
