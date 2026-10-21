# 작업 2 재검토 1차 (snap-2-head → snap-2-fix1)

줄 번호는 `snap-2-fix1/realscene.js`, `snap-2-fix1/villageplan.js` 기준이다(살아 있는 `docs/past-life/realscene.js`와 `diff`로 같음을 확인했다).

## 내가 직접 확인한 것

- `villageplan.js`의 `planAll`을 시드 1,500개(구현자 시험은 200개)로 돌렸다. 좌판은 늘 2, 천막 3:521 / 4:566 / 5:413, 집 45~59채 모두 뒤뜰(`croft`) 있음, 마당 소품은 모든 집 2~5개, 주 양 떼 22~30마리. 위반 0건.
- `node --test test/villageplan.test.mjs`(5/5), `test/kit.test.mjs`(2/2) 통과. 새 시험은 실제 범위를 단언한다. 천막 3~5와 좌판 2, 천막 소품 수와 `layout.awnings` 일치, 집마다 `croft` 존재와 `yard` 소품 2~5(`YARD_PIECES` 종류 확인), 양 15~30이다. 빈 시험이 아니다.
- 손으로 짠 `smoothLine`을 three r160 `CatmullRomCurve3`(centripetal) 결과와 비교했다. 강·길·LANES 17개 곡선에서 점 개수와 좌표가 모두 같다(최대 오차 0). 지형·길 그림이 이 교체로 달라지지 않는다.
- `GTAOShader.js`(r160)에 `vec3 viewNormal = getViewNormal(vUv);`, `ao = pow(ao, scale);`가 그대로 있다. `realscene.js:1308-1310`의 `replace`가 실제로 걸린다.
- `props_england.glb`를 읽었다. 재료 16개에 `down`이 있고 노드 22개 조각이 모두 있다.
- 살아 있는 `realscene.js`의 마지막 수정(18:54:46)이 새 스크린샷(18:55~18:56)보다 앞이다. 그림은 최종 코드의 것이다.
- 최종 코드로 `p1_t2_perf.js`를 직접 돌렸다. `fczf`는 없었고 GPU는 한가했다. 서버는 `serve.py 8780`이고 끝나자 멈췄고, 브라우저도 닫았다(프로젝트 파일은 건드리지 않음).

| 시점 | 평균 / p50 / p95 (ms) | 그리기 | 삼각형 | bench |
|---|---|---|---|---|
| 아침 전경 | 13.08 / 12.2 / 18.5 | 1,378 | 21.95M | 21.6 |
| 골목 | 12.52 / 12.1 / 18.2 | 997 | 20.11M | 20.7 |
| 해질녘 대장간 | 12.55 / 12.1 / 18.3 | 737 | 11.28M | 18.7 |
| 해질녘 전경 | 13.25 / 12.2 / 18.5 | 1,163 | 13.73M | 21.3 |

  콘솔 경고·오류 0.

## Finding Verdicts

- **I1 전경 구도: 마을 2/3, 다리 옆면** — **ADDRESSED** (구도 주의점은 Minor로 남긴다).
  - `realscene.js:1404` `overview: { pos: [-20, 40, 92], look: [10, -1, -26], fov: 42 }`, 땅 비탈 `realscene.js:348`.
  - `p1_t2_overview_morning.png`(1600×900)에서 마을 띠는 y≈150(교회·뒷집) ~ 730(앞집 아래), 약 64%다(전 31%). 아래 약 20%는 울타리 친 양 풀밭과 다리·강 모서리이고, 맨 잔디 비탈이 아니다. 다리는 아치 옆면이 보인다(전: 정면 상자).
  - 시드 7 그림(`p1_t2_seed7.png`)에서도 같은 구도가 선다.
  - 목표 그림과 견주면, 차례(앞 강·다리 → 가운데 마을 → 뒤 구릉)와 비율은 맞다. 다만 목표는 눈높이에 가까운 3/4 시점이고 이쪽은 높이 40 m에서 내려다보는 항공 시점이다. 하늘이 없고 구릉은 위쪽 가는 띠뿐이다. 다리는 왼쪽 아래 모서리에서 잘려 아치 절반만 보이고, 집·사람·양이 작아 「미니어처」로 읽힌다. 목표의 초점(물레방앗간·버드나무·대장간·교회가 한 덩어리로 모인 느낌)은 넓게 흩어졌다. 위 두 번째 문장의 두 수치와 차례는 요구를 채우므로 막는 사안은 아니다. 작업 4 색감·구도 손질 때 하늘과 구릉 띠를 되찾을지 정하라.
- **I2 천막 3~5, 집마다 마당 2~5** — **ADDRESSED**.
  - 천막: `villageplan.js:272-293` 후보 4고리×24 + 가운데, 좌판 2를 먼저 잡고 천막 `wantAwn = 3 + floor(R()*3)`를 따로 센다. 못 채우면 간격 0.5 m로 한 번 더 시도한다. 1,500 시드 중 3 미만 0건, 5 초과 0건. 천막 소품 수는 `layout.awnings` 길이와 같다(`villageplan.js:355`, `413-416`).
  - 마당: 뒤뜰을 못 붙이면 집을 세우지 않는다(`villageplan.js:251-262`). 소품은 `want = 2 + floor(R()*4)`를 정하고 `yard()`로 `got`을 세며, 2개 미만이면 뒤뜰 안 칸을 훑어 채운다(`villageplan.js:357-384`). 소품에 `yard` 번호가 붙고 시험이 센다.
  - 규칙을 three 없는 모듈로 빼서 Node 시험이 생겼다(Minor 1 해소). 결정성 시험도 있다.
- **I3 최종 코드의 60 fps 게이트** — **ADDRESSED** (여유가 줄었다는 주의점은 Minor).
  - 보고서는 `fczf` 종료·GPU 0% 뒤 측정한 평균 11.1~12.6 ms, p95 13.3~16.1 ms를 적었다. 마지막 코드 수정 직전 시점으로 보이고(풀 165k·천막 5·전경 덤불을 언급), 내 독립 재측정이 평균 12.5~13.3 ms(75~80 fps)로 이를 뒷받침한다. 평균 기준 60 fps 게이트(작업 1 때부터 쓴 기준)는 통과다.
  - `flower_patch`는 5,909 → 1,146 삼각형으로 줄었다(`kit_props.py` `leaf_card`·`flower_head`, `flower_patch()`).
  - 내 run의 p95는 18.2~18.5 ms라서 보고서의 13.3~16.1 ms보다 2~5 ms 높다. 다른 프로세스가 섞였을 수 있다. 이 때문에 막지는 않지만 아래 Minor 2를 본다.
- **V1 풀포기가 도장 찍은 네모, 땅이 한 가지 색** — **ADDRESSED** (근경 성긴 점이 남음).
  - 풀 그림이 둥근 포기로 바뀌었고(`grassBladeTex`), 작고 촘촘하게(`BASE = 140000`, `realscene.js:736`, 마을 95 m 안 55%), 땅 셰이더에 마른·짙은 얼룩과 잔 점이 들어갔다. 전경·골목 그림에서는 네모 가장자리가 사라졌고, 땅 색이 얼룩진다.
  - 풀밭 근경(`p1_t2_pasture.png`)에서는 포기가 여전히 서로 떨어져 성기게 보인다. 방치하면 「잔디 장」으로 읽히는 구간이다(작업 4 색감 때 다루면 된다).
- **V2 골목 아래쪽이 맨 흙 광장** — **ADDRESSED**.
  - `street` 시점 변경(`realscene.js:1405`), 길가 풀섶(`villageplan.js:456-460`), 길가 꽃. `p1_t2_street.png`는 양쪽 집줄, 풀섶·꽃, 수레, 끝에 교회 탑이 있어 사람이 사는 길로 읽힌다.
- **V3 양이 장난감 같다** — **ADDRESSED**.
  - 짙은 얼굴·귀, 가늘고 짙은 다리, 털 뭉치 잡음, 마리마다 털 색·몸 길이 변주(`kit_props.py` `sheep()`, `villageplan.js:501`). `p1_t2_pasture.png`에서 양으로 읽힌다.
- **V4 먼 나무 검은 알갱이** — **ADDRESSED**.
  - 원인 진단(GTAO가 깊이로 만든 노멀이 0일 때 `ao`가 NaN)이 그럴듯하고, `realscene.js:1308-1310`의 NaN 방어와 250~600 m AO 줄임이 r160 셰이더 문자열과 맞는다. `p1_t2_trees_far.png`와 `p1_t2_overview_*.png`에 검은 알갱이가 없다.
- **Minor 3 (결합 주석)** — **ADDRESSED**. `villageplan.js:8-9`, `298-300`, `realscene.js:66-67`.
- **Minor 4 (occGrid 굳음)** — **ADDRESSED**. `occupied` 배열을 없애고 `occAdd`가 색인에 바로 넣는다(`realscene.js:543-548`, 호출 `568`, `578`, `580`, `633`). 남은 `occupied` 참조 0.
- **Minor 5 (죽은 코드)** — **ADDRESSED**. `beamGeo`와 쓰이지 않던 `_m4`·`_bq`·`_bv`·`_bc`·`_one` 제거(참조 0), `cart()`의 `q` 제거, `cloth_awning` 설명을 실제 크기로 고침. `leaf_blade`·`daisy`는 새 조각으로 바뀌며 지워졌고 참조 0.
- **Minor 6 (오리 색이 부리·눈에 곱해짐)** — **ADDRESSED**. 몸·목은 새 재료 `down`(`kit_props.py` `duck()`), `PROP_TINT`에 `down`(`realscene.js:1149`). 부리·눈은 palette라 곱이 안 걸린다. glb에 `down`이 있다.
- **Minor 7 (woodpile `recalc_face_normals`)** — **ADDRESSED**. 결정적 `outward()`(`kit_props.py:253`, 호출 `423`). 이 파일에 `recalc_face_normals` 호출은 0(주석 두 곳만).

## New Breakage in the Fix Diff

- **Critical:** 없음.
- **Important:** 없음.
- **Minor:**
  1. `realscene.js:1308-1310` GTAO 셰이더를 `String.replace`로 고친다. three가 `@0.160.0`으로 고정돼 지금은 걸리지만, 버전을 올려 문자열이 달라지면 말없이 고침이 사라져 검은 알갱이가 되돌아온다. 걸렸는지(`includes`) 확인하는 경고 한 줄이 있으면 좋다.
  2. 성능 여유가 줄었다. 동기 bench 15.4 → 약 21 ms(보고서) / 18.7~21.6 ms(내 run), 내 run p95 18.2~18.5 ms. 평균은 통과지만 작업 3·4가 비용을 더 얹으면 먼저 깨진다. 풀 165k·천막 5·전경 덤불이 쓴 몫이다.
  3. 집 수가 줄었다(뒤뜰 없으면 집 안 세움). 구현자 보고는 49~59채, 내 1,500 시드는 45~59채다. 시험 하한 30은 느슨하다. 의도는 맞고 영향은 작다.
  4. `p1_t2_yard.png`는 수정 전 그림이다(보고서가 인정함). 마당 규칙의 눈으로 본 증거는 시험이 대신한다.

## Out-of-Scope Observations

- `dressVillage`의 `kit` 인자는 여전히 쓰이지 않는다. 인터페이스가 정한 인자이고 이제 주석으로 밝혔다.
- 이 수정은 길·`MEADOW`·땅 비탈·`FOREGROUND`·`VIEW_CLEAR`·`ROADS[6]`/`LANES[6]` 등 마을 배치를 상당히 바꿨다(I1·V2에 필요한 변경이다). 교회 아래 비탈이 건물 기초 처리(`place()`의 `base = lo + …`)와 어긋나지 않는지는 이 스크린샷 크기로 판정할 수 없다. 겉으로 보이는 문제는 없었다.
- `realscene.js`는 1,917 → 1,501줄이 되어 Minor 10은 일부 풀렸다.

## Verdict

**Fix round:** All findings addressed, no new Critical/Important breakage. 열린 Important 없음. 컨트롤러가 정할 것: 전경 시점이 항공 시점이라 하늘·구릉 띠가 없고 다리가 잘리는 점(I1 주석)과 근경 풀밭의 성긴 풀(V1 잔여)은 작업 4 색감·구도에서 다룰지 여부.
