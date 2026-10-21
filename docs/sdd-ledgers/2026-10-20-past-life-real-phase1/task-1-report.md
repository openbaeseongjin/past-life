# 작업 1 보고: 중세 잉글랜드 건물 세트 (Blender) — 2026-10-20

상태: **완료 (DONE)**. 세트 11조각을 Blender 스크립트로 짓고, AO를 구워 meshopt glb(6.1 MB, 삼각형 146k)로 내보냈다. `realscene.js`의 코드 건물을 세트 조각으로 바꿨다. 같은 명령을 두 번 돌리면 glb와 미리보기 PNG가 바이트까지 같다. 콘솔 오류 0, 후처리를 켜고 69~88 fps, `npm test` 100/100.

## 1. 파일

| 파일 | 상태 | 내용 |
|---|---|---|
| `tools/blender/kit_common.py` | 새 | Blender 공통 도구. 장면 비우기, CC0 텍스처 손질(numpy로 물들이기·초가 이음매 고치기·천 줄무늬), Principled 재료, 조각 짓기(`Piece`: bmesh 부품 합치기, 상자/각재/기둥/원기둥, 불리언 구멍, 높이장 지붕+두께+둥근 모서리), AO 아틀라스 굽기, glTF 내보내기와 압축 호출, Eevee 미리보기 |
| `tools/blender/kit_england.py` | 새 | 잉글랜드 세트 11조각, 벽면 틀(`Face`), 목골조 생성기, 창·문·덧문, 초가(높이장)·블록컷 용마루, 슬레이트 지붕, 굴뚝, 버팀벽, 갓돌, 물레바퀴 |
| `docs/past-life/tools/pack_kit.mjs` | 새 | gltf-transform: dedup·prune(빈 노드 유지) → 텍스처 WebP(색 1K, 노멀 1K/512, AO 2K) → meshopt(high) |
| `docs/past-life/tools/fetch_real.py` | 고침 | 세트용 CC0 텍스처 6종 추가 |
| `docs/past-life/assets/real/kits/england.glb` | 새 | 6,251,836 B (6.1 MB), sha256 `0bf5d8066bb39041…` |
| `docs/past-life/assets/real/kits/preview/england_*.png` | 새 | 14장, 1280×720 Eevee (조각마다 3/4 시점 11장 + 전경 + 골목 2장) |
| `docs/past-life/assets/real/tex/` | 추가 | `reed_roof_04`, `rough_wood`, `white_rough_plaster`, `clay_plaster`, `cobblestone_02`, `rough_linen` (diff+nor_gl, 1K) |
| `docs/past-life/assets/real/SOURCES.md` | 고침 | 새 텍스처, 세트 만드는 법, 압축 도구, 코드 도형 목록 |
| `docs/past-life/realscene.js` | 고침 | `loadKit`, 시드 조각 고르기, 자리 잡기, 재질별 합치기, 물레바퀴·화덕 불빛·굴뚝 연기·창 불빛 연결. 코드 건물(집·교회 본체·대장간·물레방앗간)과 지붕 생성기(`roofGeo`, `FaceBuilder`)는 지웠다 |

`look-real.html`은 고치지 않았다(시점 프리셋·주소 인자 그대로 동작). 엔진 파일도 손대지 않았다.

## 2. 다시 만들기

```
"C:/Program Files/Blender Foundation/Blender 4.2/blender.exe" --background --python D:/Users/admin/Desktop/indigame/tools/blender/kit_england.py
```

- 약 66초 걸린다. 짓기 3초, AO UV 1.4초, Cycles OptiX AO 굽기 256표본 42초, 내보내기·압축, 미리보기 14장.
- 사용자 설정은 저장하지 않는다(`--factory-startup` 안 씀). `userpref.blend` 시각이 바뀌지 않은 것을 확인했다.
- 압축에는 gltf-transform이 깔린 폴더가 필요하다.
  - 환경변수 `GLTFT`를 먼저 보고, 없으면 이번 세션의 scratchpad `gltft` 폴더를 쓴다.
  - 둘 다 없으면 압축하지 않은 glb(약 38 MB)를 복사하고 경고를 낸다.
- 환경변수:
  - `KIT_FAST=1`: 표본을 줄인다.
  - `KIT_ONLY=cottage_a,church`: 일부만 짓는다. 이때는 glb를 내보내지 않고 미리보기만 만든다.
  - `KIT_NOPREVIEW=1`: 미리보기를 만들지 않는다.
- 결정성:
  - 난수는 조각마다 고정 씨앗이고, 장면은 매번 비운다. Cycles 씨앗은 0이다.
  - PNG 날짜 메타데이터를 끈다.
  - 전체를 두 번 돌려 `england.glb` 1바이트도 다르지 않음(`cmp`)과 미리보기 PNG 14장이 모두 같음을 확인했다.

## 3. 세트 내용

좌표: 조각마다 바닥 가운데가 원점이고 단위는 m다. 앞(문·트인 쪽)은 glTF +Z(Blender −Y), 긴 축(용마루)은 X다. 뿌리 노드 이름은 조각 이름 그대로이고 그 아래에 `<이름>_mesh`가 붙는다.

| 노드 | 삼각형 | 바닥×높이 (m) | 특징 |
|---|---|---|---|
| `cottage_a` | 20,168 | 8.0×5.6×6.7 | 목골조+석회 회벽. 박공 초가(두께 36 cm, 처마 50 cm, 박공 42 cm, 용마루 12 cm 처짐, 톱니 블록컷 용마루), 박공 바깥 굴뚝(어깨 경사), 열린 덧문·닫힌 덧문, 다락 창, 돌 기단·디딤돌 |
| `cottage_b` | 17,120 | 10.4×5.8×6.7 | 막돌 두꺼운 벽(창턱 깊이 36 cm, 나무 상인방, 돌 창턱), 모서리 돌. 반박공 초가, 용마루 굴뚝. **별채(슬레이트 외쪽 지붕 헛간)** |
| `cottage_c` | 12,959 | 7.0×5.4×6.6 | 욋가지 흙벽(wattle)+목골조. 우진각 초가에 **박공 지붕창 하나**(높이장 smooth-max로 초가가 창 위로 솟음) |
| `house_jetty` | 13,168 | 8.0×6.3×9.7 | 2층 목골조. **위층이 앞으로 50 cm 돌출**(장선 끝 17개, 멍에, 마루 밑판), 위층은 샛기둥이 촘촘하다. 슬레이트 박공, 박공널, 용마루 기와 |
| `longhouse` | 25,092 | 15.0×6.6×6.9 | 막돌 긴 집. 통로 문 앞뒤, 외양간 쪽 넓은 문(조금 열림), 환기 틈. 우진각 초가(20 cm 처짐) |
| `barn` | 19,370 | 14.1×9.4×8.5 | 세로 판자벽+기둥·도리, 돌 기단, 큰 우진각 초가. 수레 문 한 짝은 112° 활짝, **한 짝은 처져 4.5° 기울고 16° 벌어짐**(띠장·Z 가새·쇠 경첩). 안쪽은 4 m 깊이 어둠 |
| `smithy` (+`smithy_forge`) | 5,660 | 7.0×7.0×6.0 | 앞이 트인 일터. 막돌 뒷벽·옆벽, 기둥 받침돌·보·가새, 판자 박공, 슬레이트. 화덕(숯 발광), 돌 덮개(사다리꼴), 굴뚝, 가죽 풀무, 모루+그루터기, 담금 물통, 작업대, 벽에 건 연장, 자갈 바닥 |
| `church` | 14,020 | 30.7×12.6×18.6 | 서쪽 네모 탑(띠돌림 2단, **총안 성가퀴**, 모서리 작은 첨탑 4, 쌍 버팀벽, 종탑 비늘창 8, 뾰족 서문·서창). 본당·제단부(슬레이트, 동쪽 갓돌 박공+십자가), **뾰족 창 깊은 창턱**, 버팀벽, 남쪽 현관(뾰족 아치, 직각 박공 지붕) |
| `mill` (+`mill_wheel`) | 8,292 + 바퀴 5,936 | 9.2×8.7×9.2 | 2층 막돌, 슬레이트 박공, 자루 올리는 문·도르래 들보, 모서리 돌, 굴뚝. **`mill_wheel` 빈 노드가 굴대 중심(로컬 Z축 회전)**. 바퀴는 지름 4.4 m, 테 2겹, 살 16, 물받이 20. 바깥 축받이 기둥 |
| `well` | 2,060 | 3.0×3.0×2.7 | 둥근 막돌 우물+갓돌, 기둥 둘·버팀, 도르래 굴대·손잡이, 두레박(쇠테)·밧줄, 판자 지붕, 팔각 자갈 바닥, 물 |
| `market_stall` | 2,500 | 3.4×2.4×2.6 | 기둥 넷, 판자 계산대·선반, 처진 줄무늬 차양+물결 드림, 상자 셋 |
| **합계** | **146,345** (≤250k) | | glb **6.1 MB** (≤8 MB). 텍스처 21장 3.2 MB, 기하 약 2.9 MB |

- 재료(15개):
  - brief의 8개: `stone_rubble`, `plaster_lime`, `timber_dark`, `thatch`, `slate`, `planks`, `cobble`, `wattle`
  - 더한 것: `stone_ashlar`(교회·모서리 돌·창턱·용마루 기와), `glass`(해질녘 발광), `iron`, `coals`, `water`, `leather`, `canvas`
- 표시 노드:
  - `<조각>_smoke` 7개(굴뚝 꼭대기)
  - `smithy_forge`(숯 위)
  - `mill_wheel`(굴대)
- 목골조 부재는 벽면보다 2.8~4.2 cm 튀어나온다. 부재마다 깊이를 조금씩 달리해 겹치는 면이 깜빡이지 않게 했다. 부재마다 ±0.5 cm 비뚤어짐과 폭 ±8% 변주가 있다.
- AO:
  - 모든 메시에 두 번째 UV `AO`를 만든다(스마트 투영 후 한꺼번에 묶음).
  - Cycles AO(거리 1.4 m, 굽기용 땅 판 포함)를 2048² 아틀라스 한 장에 굽는다. 3×3 흐림을 하고 0.12를 바닥으로 깐다.
  - glTF `occlusionTexture.texCoord=1`로 내보낸다. three.js에서는 `aoMap`과 `uv1`로 들어간다.
  - three.js는 aoMap을 간접광에만 쓴다. 그래서 세트 재질에는 같은 AO를 해빛(직사광)에도 0.45만큼 곱하는 조각을 더 넣었다(`uAODirect`). 그림자 지도(7 cm/텍셀)가 못 잡는 맞닿은 곳 그늘을 보충하는 용도다.

## 4. `realscene.js` 연결

- `export function loadKit(url) → Promise<{ pieces: Map<name, Object3D>, scene }>`.
  - GLTFLoader에 `three/addons/libs/meshopt_decoder.module.js`를 꽂는다.
  - 같은 주소는 캐시하고, 실패하면 캐시에서 뺀다.
- 조각 고르기(시드 `opts.seed ?? 1329`):
  - 프로토타입 `BUILDINGS`의 자리·방향·종류(timber/plaster/stone/barn)는 그대로 둔다.
  - 종류별 조각 주머니(`KIT_POOL`)를 시드로 섞어 앞에서부터 고른다. 둘레 16점이 길(0.4 m)이나 강에 걸리는 조각은 건너뛴다.
  - 크기는 ±5%, 방향은 ±1.7° 변주를 준다.
  - 결과(이번 시드): cottage_a 5, cottage_c 4, house_jetty 4, cottage_b 3, longhouse 1, barn 1.
  - 텃밭(splat)과 덤불 자리는 고른 조각의 실제 크기(`KIT_DIMS`)로 계산한다.
- 자리 잡기: `place(piece, x, z, rot, s)`.
  - 바닥 7점의 땅 높이 중 낮은 값에 기울기 몫을 조금 더한 높이에 놓는다. 기단과 막돌이 땅속 0.6 m까지 이어져 낮은 쪽이 뜨지 않는다.
  - 집은 세트 앞(+z)이 길 쪽(프로토타입 +x)을 보게 +90°로 돌린다.
  - 교회·대장간·물레방앗간은 기존 좌표에 놓는다. 우물(`WELL`)과 좌판 2개(`STALLS`, 교회 길 북쪽 장터)는 새로 놓았다.
- 그리기:
  - 세트를 불러온 뒤 놓은 24조각의 메시를 Float32로 풀어 행렬을 곱하고, 재질별로 합친다. 그리기는 15회, 삼각형은 336k다.
  - 물레바퀴만 따로 복제한다. 바닥이 물에 잠기게 높이를 맞추고 매 프레임 로컬 Z축으로 돌린다.
  - 화덕 점광원은 처음부터 있다(빛 수가 변하지 않아 셰이더를 다시 짜지 않음). 세트가 오면 `smithy_forge` 앞으로 옮긴다.
  - 굴뚝 연기는 `_smoke` 노드 19곳에서 나온다. 창(`glass`)과 숯(`coals`)은 해질녘에 빛난다.
- 그대로 둔 것: 하늘·지형·식생·사람·후처리, 다리·울타리·묘지 돌담·비석(코드 도형). 대장장이 자리만 세트 모루 앞으로 옮겼다.
- 확인용 API:
  - `setKitAO({ direct, map })`
  - `info().kit` = `{ ok, placed, draws, tris, pieces, at }`

## 5. 스크린샷 (1600×900, `D:/Users/admin/Desktop/indigame/.playwright-mcp/`)

| 파일 | 설명 |
|---|---|
| `p1_t1_morning.png` | 아침 6:30 전경. 초가·목골조·슬레이트 지붕이 섞인 마을, 왼쪽 강가 물레방앗간과 바퀴, 오른쪽 교회 탑(총안), 대장간 |
| `p1_t1_street.png` | 골목 눈높이 7:36(기존 `street` 프리셋). 반목골조 초가 오두막들, 우물, 성가퀴 교회 |
| `p1_t1_dusk_forge.png` | 해질녘 19:09 대장간. 화덕 불빛이 막돌 안벽과 바닥을 비추고, 교회 뾰족 창에 불이 켜졌다 |
| `p1_t1_compare_morning.png` / `p1_t1_compare_street.png` / `p1_t1_compare_dusk_forge.png` | **전(`real_*.png`) / 후** 나란히 |
| `p1_t1_vs_target.png` | 목표 그림 `m2-living-real` / 후 아침 전경 |
| `p1_t1_lane_cottage.png` | 골목 가까이(9 m): 흙벽 목골조 오두막, 지붕창, 처마 두께, 덧문 |
| `p1_t1_lane_longhouse.png` | 막돌 긴 집 가까이: 깊은 창턱, 상인방, 모서리 돌, 처진 우진각 초가 |
| `p1_t1_lane_church.png` / `p1_t1_lane_mill.png` | 교회 남쪽 면(현관·버팀벽·뾰족 창), 강가 물레방앗간과 바퀴 |
| `p1_t1_ao_check.png`, `p1_t1_ao_zoom.png` | 같은 시점 AO 끔/켬. 처마 밑 벽 위쪽, 모서리, 창·문 안쪽이 어두워진다. 화면 평균 밝기 113.6→110.3, 8단계 넘게 어두워진 화소 24만 개 → **AO가 three.js에서 실제로 보인다** |
| `p1_t1_before_street_now.png` | 같은 세션에서 다시 찍은 프로토타입 골목(시간 비교용) |
| Blender 미리보기 `docs/past-life/assets/real/kits/preview/england_*.png` | 조각별 3/4, `england_overview`, `england_street`, `england_street2`(골목 눈높이) |

## 6. 프레임 시간 (RTX 2060, Playwright Chrome, 1600×900, DPR 1, 후처리 켬: GTAO+빛번짐+색보정)

같은 세션에서 프로토타입(백업 사본을 잠시 띄웠다가 지움)과 나란히 쟀다. 시점마다 5.5초 뒤 rAF 240프레임이다.

| 시점 | 전 평균 / p95 (ms) | **후 평균 / p95 (ms)** | 그리기 전→후 |
|---|---|---|---|
| 아침 전경 | 13.16 / 15.8 | **13.68 / 16.4 (73 fps)** | 333 → 349 |
| 골목 7:36 | 10.60 / 13.0 | **11.31 / 14.0 (88 fps)** | 186 → 201 |
| 해질녘 대장간 | 13.57 / 16.4 | **14.42 / 17.4 (69 fps)** | 210 → 283 |
| bench(동기, 최악) | 16.12 | 16.51 | |

- 세트가 드는 비용은 프레임당 약 0.5~0.9 ms다. 평균은 모두 60 fps 이상이다.
- 해질녘 p95(17.4 ms)는 60 fps 경계에 가깝다. 그림자 갱신 프레임이 섞인 탓이다.
- 콘솔 오류·경고 0(세 시점 모두, 다시 불러도 0).
- `npm test` 100/100.

## 7. 목표 그림과 비교 (솔직하게)

**좋아진 것: 이번 작업의 목표**
- 골목 눈높이에서 건물이 더는 「상자 + 지붕」으로 읽히지 않는다. 그렇게 보이게 하는 요소는 다음과 같다.
  - 두꺼운 둥근 초가 처마, 처진 용마루, 톱니 용마루
  - 튀어나온 목골조, 깊은 창턱과 창살·덧문, 돌 기단과 디딤돌
  - 굴뚝 어깨, 돌출 위층과 장선 끝, 지붕창, 반박공·별채
  - 교회 성가퀴·버팀벽·뾰족 창
- 구운 AO 덕분에 처마 밑과 부재 둘레가 붙어 보인다.
- 실제 비례(벽 2.3~2.7 m, 경사 45~56°)라서 프로토타입보다 집이 작고 낮게 앉아 그림 속 집과 비례가 비슷하다.

**아직 먼 것**
1. 건물 하나하나의 「손때」. 그림의 집은 벽이 기울고 처마가 울퉁불퉁하며, 이끼·때·덩굴·꽃이 있다. 우리 집은 선이 곧고 깨끗해서 **새로 지은 민속촌**처럼 보인다.
   - 다음에 할 일: 정점 잡음으로 벽 기울이기, 지붕 이끼·그을음 꼭짓점 색 또는 두 번째 AO 채널, 덩굴 카드
2. 회벽 텍스처의 회색 얼룩이 가까이서는 「벗겨진 벽」으로 읽힌다(그림은 고른 크림색).
   - 대비는 0.38까지 낮췄다. 색 보정이 아니라 다른 회벽 텍스처가 필요할 수도 있다.
3. 슬레이트 지붕이 넓게 고르다. 처마 끝 돌 두께와 줄눈 변주가 없다. three.js에서는 색을 1.4배 밝혀 맞췄다.
4. 마을 전경 점수는 크게 바뀌지 않는다. 전경 비교(`p1_t1_vs_target.png`)의 차이는 여전히 빽빽함(소품·사람·가축·꽃)과 나무 모양에서 온다. 이것은 작업 2~3이다.
   - 내 어림: 전체는 60~65% → **약 68%**, 건물만 놓고 보면 그림의 75~80% 수준이다.
5. 교회: brief대로 총안 네모 탑으로 했다. 목표 그림에는 탑 위에 뾰족한 첨탑이 있어서 실루엣이 조금 다르다.

## 8. 남은 문제·메모

- `KIT_DIMS`(JS 쪽 바닥 크기 표)는 Blender 실행 로그의 STATS 값을 손으로 옮겨 적었다. 세트를 바꾸면 같이 고쳐야 한다. barn은 열린 문짝을 뺀 몸채 13.4×7.6을 쓴다.
- 우물·좌판 자리(`WELL`, `STALLS`)는 손으로 정한 상수다. 장터 규칙은 작업 2의 `dressVillage`에서 정하는 게 맞다. 시드는 아직 `opts.seed ?? 1329`이고, 출생 시드 연결은 작업 4다.
- AO 아틀라스는 보이지 않는 면(벽 속·지붕 밑 안쪽)에도 자리를 쓴다. 그래서 실제 화소 밀도는 약 2~3 cm/px다. 좁은 각재 섬은 멀리서 밉맵 번짐이 날 수 있다(아직 눈에 띄지는 않음). 숨은 면을 지우면 밀도를 높일 수 있다.
- 초가 처마 단면은 고체화 테의 UV가 늘어나 짚 끝처럼 줄무늬로 보인다. 지금은 그럴듯하지만 아주 가까이서는 반복이 보인다.
- 물레방앗간: 바퀴가 돌고 바닥이 물에 닿는다. 다만 물을 대는 수로·물보라가 없고 바퀴 일부가 둑에 걸린다.
- 압축 도구(gltf-transform·meshoptimizer·sharp)는 세션 scratchpad에 깔려 있다. 다른 PC에서는 `npm i --prefix <폴더> …` 뒤에 `GLTFT=<폴더>`로 실행한다(`pack_kit.mjs` 머리말).
- Blender 미리보기는 AgX와 Nishita 하늘을 쓴다. three.js는 ACES와 물리 하늘이라 색감이 조금 다르다. 재질 색 미세 조정은 JS의 `KIT_TINT`에 있다.
- 지운 코드: 프로토타입 `buildHouse`, `buildChurch`(본체), `buildSmithy`, `buildMill`, `roofGeo`, `FaceBuilder`, `addWindow`. 쓰지 않는 재질(plaster, thatch, slate, window, iron, forge 등)도 정리했다.

## Fix round 1 (리뷰 반영)

| # | 지적 | 고친 것 | 확인 |
|---|---|---|---|
| 1 (중요) | `loadKit` 캐시가 바뀌는 재질을 장면끼리 같이 써서, 두 번째 장면은 창·숯이 빛나지 않음 | `kitMaterial`이 장면마다 `src.clone()`한 뒤(`matClones` Map) 색 보정·안개·발광 목록·AO 조각을 **복제본에만** 붙인다. 캐시 원본은 손대지 않는다(텍스처는 함께 쓰고, 재질 dispose는 텍스처를 지우지 않는다). 물레바퀴도 지오메트리를 장면마다 `clone()`한다. `loadKit`과 파일 머리말에 「pieces는 읽기 전용 원본」이라고 적었다 | 한 페이지에서 장면 생성 → `dispose()` → 새 캔버스에 다시 생성. 두 번째 장면도 `kit.glow=1`, 창 `emissiveIntensity` 1.86, 숯 14.4, 재질 객체가 첫 장면과 다름(`p1_t1_fix_rescene_dusk.png`: 화덕·교회 창 불빛). 콘솔 0 |
| 2 (중요) | `GLTFT_CANDIDATES`에 세션 scratchpad 경로가 박혀 있고, 없으면 압축 안 된 38 MB glb로 배포 파일을 덮음 | 세션 경로를 지웠다. 이제 `GLTFT` 환경변수 → `docs/past-life/tools/node_modules` 순서로 찾는다(`npm i --prefix docs/past-life/tools …`, `node_modules/`는 .gitignore). 못 찾으면 **`RuntimeError`로 멈추고 배포 glb를 덮지 않는다**. 스크립트는 예외가 나면 `sys.exit(1)`로 끝난다. `KIT_ONLY=… KIT_EXPORT=1`은 임시 폴더 `england_partial.glb`로 쓴다 | `GLTFT` 없이 돌리면 RuntimeError, `england.glb` sha256 그대로(`0bf5d806…`). `GLTFT`를 주고 전체를 다시 돌리면 glb **바이트 동일**(sha 같음), 미리보기 14장도 동일 |
| 3 | 시드 섞기 | `rng(Math.imul(opts.seed ?? 1329, 2654435761) >>> 0)` (1329에서는 결과가 같아 마을도 같다) | 조각 배치 목록이 이전과 같음 |
| 4 | 세트를 못 부르면 건물 없는 마을에 화덕 불빛만 뜸 | 실패하면 `forgeLight.visible = false`, `info().kit.err`에 이유를 담는다. look-real HUD 셋째 줄에 「건물 세트 24채 (그리기 15)」 또는 붉은 「※ 건물 세트 못 불러옴: …」을 띄운다(실패하면 HUD를 숨겼어도 다시 보임). 시험용 주소 인자 `kit=`와 옵션 `kitUrl`을 더했다 | `?kit=assets/real/kits/missing.glb` → ok=false, 화덕 빛 꺼짐, HUD 경고(`p1_t1_fix_kitfail.png`). 이때 콘솔에는 예상된 404 1건과 경고 2건만 나온다 |
| 5 | `KIT_DIMS` 어긋남 | Blender가 `kits/england.dims.json`(조각 [x, z, 높이])을 함께 내보낸다. 바닥 크기는 「활짝 연 문짝」 같은 `P.nofoot` 부품을 빼고 잰다(barn 14.1×8.3). `KIT_DIMS`·`KIT_POOL`은 three 없는 작은 모듈 `docs/past-life/kitdata.js`로 옮겼고(realscene은 한 줄 import), `test/kit.test.mjs`가 0.15 m 안에서 맞는지와 주머니 조각이 세트에 다 있는지 본다 | `npm test` **101/101** |
| 6 | 남은 찌꺼기 | `BUILDINGS`에서 `w, d, h, roof`를 지웠다(남은 것: x, z, rot, kind). `PRESETS.plaster`·`thatchTint`도 지우고, 파일 머리말을 지금 API·구성에 맞게 고쳤다 | 문법 확인, 장면 정상 |
| 7 | 화덕 깜박임이 누적 | `forgeBase`(시각이 정함) × (0.9 + 0.2 × 사인 셋 잡음)으로 바꿨다. 기준값 둘레에서만 흔들린다 | 2초 동안 54.8~64.6(기준 약 60) |
| 8 | AO 결정성 범위 | `kit_common.py` 머리말과 SOURCES.md에 적었다: 「Cycles OptiX(RTX 2060)로 구움. 같은 PC·장치에서만 바이트 동일, 다른 GPU·CPU는 보장 안 함」 | — |

- 새 파일: `docs/past-life/kitdata.js`, `docs/past-life/test/kit.test.mjs`, `docs/past-life/assets/real/kits/england.dims.json`.
- 고친 파일: `realscene.js`, `look-real.html`, `tools/blender/kit_common.py`, `tools/blender/kit_england.py`, `assets/real/SOURCES.md`.
- `england.glb`는 바뀌지 않았다(바이트 동일). barn의 `KIT_DIMS`만 13.4×7.6에서 Blender 값 14.1×8.3(처마 포함)으로 바뀌었다. 헛간 자리 (102, −8)는 그대로다.
- 다시 확인:
  - 아침 전경 평균 13.5 ms, p95 16.2(`p1_t1_fix_morning.png`), 콘솔 0.
  - 브라우저를 닫고 서버를 멈췄다. `.omc/`와 `__pycache__`는 없다. 줄 끝은 모두 LF다.
