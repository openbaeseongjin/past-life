# 작업 2-2 보고: 동아시아 세트 (중국·한국·일본) — 2026-10-21

상태: **DONE_WITH_CONCERNS** (아래 6절 걱정 참고)
시험: `npm test` **284/284 통과** (새 `test/eagates.test.mjs` 7개 + `test/kit.test.mjs` 동아시아 6개 포함, 다른 사람 파일 실패 없음)
성능: 1600×900 「높음」 동아시아 장면 전부 **69~91 fps** (아래 5절. FC ONLINE·GAMA 꺼져 있고 GPU 0% 인 것을 확인한 뒤 잼)

동아시아 생(중국 16.9% + 한국·일본, 출생의 약 18.8%)이 더는 잉글랜드 오두막으로 그려지지 않는다.
땅 갈래(중국·한국·일본)마다 건물 glb·사람 glb·물감·나무 무게가 다르고, 해(불교·기와·수레·가축)와 농사 전 야영(FARM_FROM)을 따른다.

## 1. 만든 것

### 건물 — `kits/eastasia.glb`(중국) · `eastasia_korea.glb` · `eastasia_japan.glb` (`tools/blender/kit_eastasia.py` + `kit_ea_common.py`, `KIT_VARIANT`)

| glb | 크기 | 삼각형 | 재질 |
|---|---|---|---|
| eastasia (중국) | 4.48 MB | 105,904 | 18 |
| eastasia_korea | 4.97 MB | 107,728 | 21 |
| eastasia_japan | 4.54 MB | 118,476 | 19 |

- 같은 조각 이름 13개: `house_thatch_ea`, `house_tile_ea`, `house_town_ea`, `temple_ea`, `pagoda_small`, `gate_ea`, `well_ea`, `granary_ea`,
  `smithy_ea`(화덕 표지 `smithy_forge`, 모루 자리는 잉글랜드와 같은 약속), `shrine_ea`(마을 사당 — 원점에 장면이 마을 나무), `stall_ea`, `pit_house_ea`(움집), `camp_hearth`(야영 화덕).
  `courtyard_estate` 는 작업 4 몫으로 남겼다.
- 갈래: 중국 = 회색 벽돌·판축 흙벽·회색 기와·안뜰 담·벽돌 탑 / 한국 = 둥근 초가·팔작 기와(곡선·처마 들림)·돌담·굴뚝·툇마루·석탑 / 일본 = 판벽·가파른 이엉·우진각·엔가와·목조 탑.
- 지붕: 오목 곡선 g(s)=s(1+c)−cs², 모서리 들림, 우진각(smin), 팔작 = 맞배 격자 + 치마 격자 + 합각 삼각, 골기와 무늬(numpy), 용마루·내림마루(꺾임선 기준), 막새.
- 종이 창은 저녁에 빛난다 (`paper` 재질 → 장면 emissive).

### 소품·가축 — `kits/props_eastasia.glb` (3.54 MB, 27,658 삼각형, 22 조각)
수레 `cart_ea`, 장독대 `jangdok`, 독 `jars_ea`, 통 `taru_ea`, 볏덕 `rice_rack`, 짚가리, 볏짚 단, 바구니, 절구, 장작, 평상 `bench_ea`, 텃밭 두둑, 구유, 디딤돌 `stones_ea`,
돌담·흙담·바자울(2 m 이어 붙임), 소 `ox_ea`·물소 `buffalo_ea`·돼지 `pig`·닭 `chicken`·오리 `duck_ea` (브리프의 `ducks` 는 `duck_ea` 한 마리 조각을 여럿 놓는다).

### 식생 — `kits/trees_eastasia.glb` (0.42 MB, 18,766 삼각형) + ez-tree
- Blender: 대숲 `bamboo_grove`·작은 대 `bamboo_small`(가까이 InstancedMesh·멀리 8방향 빌보드), 억새·갈대. 잎 띠 그림 한 장 + 줄기 재질 하나.
- ez-tree 1.1.0 프리셋(`kitdata.js` `TREES_EA`): 소나무·느티나무·버드나무·감나무(새 잎 그림 `tex/ea_persimmon_leaf.png` — 잎 + 주황 감, `make_leaf_tex.py`)·단풍. 갈래마다 종 무게 `TREE_MIX_EA`.

### 사람 — `people/villagers_{china,korea,japan}.glb` (각 1.91~1.95 MB, `KIT_CULTURE=china|korea|japan`)
- 뼈대·변형 이름·LOD·재질이 `villagers.glb` 와 같다 (주소만 바꿔 쓴다). LOD0 8,549~10,952 (모두 ≤ 11,000), LOD1 ≤ 2,408.
- 한국: 저고리+바지+상투·망건, 두루마기+갓(+수염), 머리띠 대장장이, 삿갓 농부(맨발), 앞치마+머릿수건, 치마저고리+쪽머리, 땋은 머리 아이, 흰 두루마기+갓 노인. 평민은 흰옷·생무명이 많다(물감 `PALETTES.korea`).
- 중국: 교령 짧은 겉옷+허리끈+바지+두건, 긴 포+검은 건, 가죽 앞치마 대장장이, 두립 농부, 웃옷+치마+쪽, 쌍상투 아이, 긴 포+두건 노인.
- 일본: 고소데+띠+모모히키+촌마게, 긴 고소데+하오리, 스게가사 농부(각반), 넓은 오비(등 매듭), 앞치마+머릿수건.
- 작업 1 교훈 반영: 매끈한 단, 느슨한 천은 몸 면을 지우지 않음(nohide), 가중치 전사, 맨 윗몸 없음(밭일꾼도 짧은 옷), 깃은 좁은 띠, 고름 없앰(날개처럼 보여서).

### 마을 요리법 (`villageplan.js` `RECIPES.eastasia` + `recipeEA`)
- 개울 따라 늘어선 마을, 뒷산 비탈의 절·탑·절 문(TEMPLE·PAGODA·TGATE), 마을 사당 + 큰 나무, 큰 기와집 + 솟을대문 + 곳간, 우물, 디딤돌, 나무다리, 계단 논(지형 셰이더 두렁 줄 `terrace`).
- 시대·땅 거름 `PIECE_GATES.eastasia` (실제 해):
  - 절·탑: 중국 100, 한국 372, 일본 538 이전에는 그 자리에 마을 사당 + 나무.
  - 기와집·큰 집 대문: 중국 −1000, 한국 300, 일본 590 (절 문은 절과 함께 — 절 기와는 불교와 같이 왔다).
  - 읍내 집: 중국 −500, 한국 1000, 일본 1300 / 수레: −1500, 0, 800 / 소: −3000, −1000, 400 / 물소: 중국만 / 돼지: 일본 없음 / 장독: 한국 300~ / 독: 한국 300 전·일본 1300 전 / 통: 일본 1300~.
  - 집 섞기 `HOUSE_MIX.eastasia` 가 땅·해마다 (서민은 초가, 기와는 늦게 늘어남, 이른 시대엔 움집 몇 채).
- **농사 전 야영** (`isCampYear` = `year < FARM_FROM[area]`: 중국 −7000, 한국 −3500, 일본 −900): 움집 50채 + 야영 화덕만, 장터·논·가축·수레 없음, 소품은 장작·바구니·절구, 통나무 외나무다리(널·난간 없음), 사람은 물들이지 않은 빛(`PALETTES.eastasia_camp`)과 수수한 옷(`CAMP_SWAP`: 갓·삿갓·두립·스게가사·두루마기·하오리·넓은 오비 → 머리띠·두건 짧은 옷·앞치마), 일은 괭이질 대신 쪼그려 캐기(kneel).
- **수렵 시대(forager) 동아시아 생**도 이제 잉글랜드 마을 대신 동아시아 야영으로 그린다 (`lands.js` `sceneKitOf` + `CAMP_KITS = ['eastasia']`; 다른 땅의 수렵 생은 그대로 `builtKit`).
  몽골 등 초원은 이 세트가 아니다 (AREA_STAGE 그대로).

### 장면 연결 (`realscene.js`)
`PRESETS.eastasia`, 갈래별 건물 glb 주소·크기 표(`RC.dims`), 갈래별 나무 무게, 감나무 잎 그림 갈아 끼우기, 종이 창 저녁 빛, 나무다리(`buildBridgeTimber`, 다리 위 사람 높이 `groundAt`),
지형 셰이더 계단 논 두렁(`uTerrace`)·야영 때 밭 없음(`uCrops`), 야영 무대 높이·사람·활동(kneel), 큰 조각 카메라 가림 높이(FIXED_TOP), 게임 무대는 `sceneKitOf(stage)`.
`peopleplan.js`: 동아시아 물감 3+1벌, 활동 자리(텃밭·평상)를 요리법 `activity` 에서 읽기, 야영 kneel·수수한 옷.

## 2. 결정성 (같은 PC, RTX 2060 OptiX)
- 동아시아 전부 두 번(r0 → r1): 건물 3 glb·dims, 소품·식생 glb·dims, 중국·일본 사람 glb, 미리보기 전부 **바이트까지 같다**.
  한국 사람은 r1 에서 갓 둘레 칸을 26→22 로 줄여(노인 LOD0 11,012 → 10,952) 바뀌었고, 그 뒤 한 번 더(r2) 지어 r1 과 **바이트까지 같다**.
- 바뀐 `kit_clothes.py` 로 잉글랜드·남아시아·동남아 사람을 다시 지어: `villagers.glb`·`villagers_southasia.glb`·`villagers_seasia.glb`·`anims.glb`·잉글랜드/남아시아 kits·dims, 그리고 잉글랜드·남아시아·동남아 사람 미리보기 13장이 **작업 전 해시와 모두 같다**.
- 잉글랜드·남아시아 마을 + 사람 계획 해시 18개가 작업 전과 같다 (`test/eagates.test.mjs` 에 고정, `test/sagates.test.mjs` 의 잉글랜드 고정도 통과).
- `primitive_uv_sphere_add`·`recalc_face_normals` 를 쓰지 않는다.

## 3. 확인 (1600×900, 시스템 Chrome headless + ANGLE D3D11 RTX 2060, 포트 8785) — `.playwright-mcp/p2_t2_*.png`
실제 게임 입력(시작·속도·올해의 패·선택지 클릭)으로 생을 돌리며 찍었다 (`.playwright-mcp/p2_t2_drive.mjs`). 모든 판 콘솔 오류 0.

| 시드 | 생 | 그림 |
|---|---|---|
| `T4-39` | 1410 중국 (브리프 지정) | `p2_t2_china_wide` · `_child` · `_close` |
| `EA-208` | 조선 한국 | `p2_t2_korea_wide` · `_child` · `_close` |
| `P2-150` | 일본 | `p2_t2_japan_wide` · `_close` |
| `T4-59` | 기원전 179 중국 (300 CE 전, 절 없음 → 사당) | `p2_t2_ancient_wide` · `_close` (논에서 괭이질) |
| `T4-3029` | 기원전 1256 일본 조몬 (농사 전 야영) | `p2_t2_camp_wide` · `_close` (움집·통나무 다리·생무명 옷) |
| `T4-1685` | 기원전 29,300 중국 수렵 생 | `p2_t2_forager_wide` · `_close` (동아시아 야영) |
| `EN-30` | 잉글랜드 세트 회귀 | `p2_t2_england_regress_wide` · `_close` |
| `T4-21` | 남아시아 세트 회귀 | `p2_t2_southasia_regress_wide` · `_close` |

- `?auto=1` 한 생 전체: `T4-39`(52살까지, 73초), `EA-208`(50살), `T4-3029`(야영, 54살) — **콘솔 오류 0, 경고 0**, 무대 오류 0.
- 내 사람 크기(close): 화면 높이의 0.24~0.38 (작업 1 의 1/3 약속 근처; 쪼그린 자세는 0.24).
- Blender 미리보기: `kits/preview/eastasia_{china,korea,japan}_{조각}.png`, `eastasia_{props_overview,animals,props_yard,trees}.png`,
  사람 `people_{china,korea,japan}_{idle,walk,heads,close,work}.png` (브리프의 `people_eastasia_*` 대신 갈래 이름 — 갈래가 셋이라서).

## 4. 고친·새 파일 (울타리 안)
- 새: `tools/blender/kit_ea_common.py`, `kit_eastasia.py`, `kit_props_eastasia.py`, `kit_trees_eastasia.py`, `docs/past-life/tools/make_leaf_tex.py`, `docs/past-life/test/eagates.test.mjs`,
  `.playwright-mcp/p2_t2_{look,drive,perf}.mjs`, 자산(`assets/real/kits/eastasia*`, `props_eastasia.*`, `trees_eastasia.*`, `people/villagers_{china,korea,japan}.glb`, `tex/` 7벌 + 감잎, 미리보기).
- 고침: `tools/blender/kit_clothes.py`(EA 갈래만 — 잉글랜드·남아시아 출력 바이트 같음), `docs/past-life/tools/fetch_real.py`(텍스처 7벌), `kitdata.js`(동아시아 표 끝에 덧붙임),
  `villageplan.js`, `peopleplan.js`, `realscene.js`, `lands.js`(BUILT_KITS·`sceneKitOf`·`CAMP_KITS` 만), `look-real.html`(주석 한 줄), `test/kit.test.mjs`(동아시아 덧붙임), `assets/real/SOURCES.md`(동아시아 절).
- 건드리지 않음: ui.js, i18n.js, life.js, focus.js, cards*.js, lines.js, tokens.js, context_data.js(읽기만: `FARM_FROM`), main.js, index.html.

## 5. 성능 (`.playwright-mcp/p2_t2_perf.mjs`, look-real `bench(90)` = GPU 가 끝날 때까지 기다린 한 프레임, 1600×900 높음)
`Get-Process fczf,java` 없음, `nvidia-smi` GPU 0% 를 확인하고 쟀다 (Blender 빌드 전).

| 장면 | 전경 ms (fps) | 골목 ms (fps) | 전경 그리기 호출 |
|---|---|---|---|
| 잉글랜드 1329 (기준) | 15.35 (65) | 13.53 (74) | 1345 |
| 남아시아 인도 1304 (기준) | 14.69 (68) | 12.53 (80) | 1273 |
| 중국 1410 | 14.42 (69) | 12.98 (77) | 1151 |
| 한국 1700 | 14.47 (69) | 12.86 (78) | 1376 |
| 일본 1700 | 13.85 (72) | 12.49 (80) | 1087 |
| 중국 기원전 179 | 13.64 (73) | 12.05 (83) | 1392 |
| 일본 조몬 야영 | 12.46 (80) | 11.00 (91) | 885 |

## 6. 걱정·남은 것
1. **한국 건물 glb 4.97 MB** — 5 MB 예산 안이지만 여유가 27 KB 뿐이다 (텍스처 27장). 손질로 텍스처가 늘면 넘는다 → 다음에 늘리면 공용 재질 텍스처를 줄이거나 1K→512 로.
2. **브리프와 다른 점**: 한국 `pagoda_small` 은 목조가 아니라 **석탑**(한국 탑의 일반형, 3.16 m 폭). 미리보기 이름은 `people_eastasia_*` 대신 `people_{china,korea,japan}_*`. `ducks` → `duck_ea`.
   일본 절은 538 부터 (공식 전래 해) — 실제 첫 큰 절(아스카데라)은 588~596 이라 538~587 사이 일본 생은 조금 이르게 절이 선다.
3. **야영·수렵 생의 옷**은 여전히 꿰맨 짧은 옷(색·쓰개만 수수하게 바꿈)이다. 가죽·나무껍질 옷 같은 선사 시대 옷 변형은 없다. 움집 50채 마을은 구석기(기원전 3만 년)에는 너무 크다 (작은 무리 야영은 따로 짓지 않았다).
   길(흙길)과 다리 자리도 마을과 같은 자리에 있다 (통나무 다리로만 바꿈).
4. **땅 꼴은 다른 세트와 같은 지형**이다. 계단 논은 지형 셰이더의 등고선 두렁 줄이지 실제 계단 지오메트리가 아니다. 강·다리 자리도 공용.
5. 소 빛이 장면에서 꽤 주황빛이다 (한우 누렁소로 보면 맞지만 중국·일본 소로는 조금 진하다). 고치려면 소품 glb 를 다시 지어야 해서 두었다.
6. 일본 여자 `f_cloak`(넓은 오비 등 매듭)은 에도풍이라 중세 이전 일본 생에도 같은 옷이다 (갈래가 해에 따라 옷을 바꾸지 않는다 — 야영만 바꿈). 한국 갓·두루마기도 조선 전 시대(삼국·고려)에 그대로 나온다.
7. 사람 LOD0 은 한국 노인 10,952 · 한국 m_hood 10,904 로 11,000 한계에 가깝다.
8. 서버(8785)는 껐고, 연 브라우저는 모두 닫혔다 (남은 headless Chrome 0).
