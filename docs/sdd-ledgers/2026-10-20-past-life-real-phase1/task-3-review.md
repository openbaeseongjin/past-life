# 작업 3 검토: 옷 입은 마을 사람 (snap-3-base → snap-3-head)

검토 범위: 작업 단위 관문 (병합 검토 아님). 읽기 전용. 새 시험 `test/peopleplan.test.mjs` 4개만 다시 돌렸다(4/4 통과). 전체 시험은 다시 돌리지 않았다. 성능은 `perf pending`(fczf.exe 가동)이라 지적하지 않는다.
검증에 쓴 것: diff 전체, 스크린샷 p1_t3_* 14장, Blender 미리보기 3장(+ 다리 부분 확대), `villagers.glb`·`anims.glb` sha256(보고서 값과 일치), 시드 30개 계획 탐침 스크립트 2개(scratchpad, 프로젝트 파일 수정 없음).

## 1. Spec Compliance

| 항목 | 판정 | 근거 |
|---|---|---|
| `villagers.glb` 변형 8명 (남 3·여 2·아이·노인) | ✅ | 브리프가 「8명」이라 쓰고 7명만 나열한다. 8번째 `m_field`(밭일꾼)는 그 모순을 메우는 것으로 보여 Extra 로 세지 않는다. |
| 뼈대가 바탕 몸과 같다 | ✅ | `docs/past-life/tools/pack_people.mjs:33-50`이 쉼 자세 TRS 편차 < 1e-4 를 확인하고 틀리면 쓰지 않고 멈춘다(보고된 최대 1.3e-6). |
| 크기 ≤ 3 MB | ✅ | 2,070,008 B (ASSETS.txt, 실제 파일 일치). |
| 같은 스크립트 → 바이트까지 같은 glb | ⚠️ | 현재 `villagers.glb` sha256 = `2b06fd9c…`로 보고서와 일치한다. 재현 자체는 확인하지 않았다. 스크립트가 배포 glb 를 그 자리에서 덮어쓰고 Quaternius 묶음도 이 세션에 없어 읽기 전용 검토에서는 돌리지 않았다. 난수·집합 순서·`recalc_face_normals` 를 피한 설계는 합리적이다. |
| Step 1 옷 짓기 | ⚠️ | 몸에 맞춘 감싸기는 Blender `Shrinkwrap` 모디파이어가 아니라 지지 함수 격자다(의도는 같음, 보고서에 밝힘). 주름 노멀은 격자 주름 + 천 노멀 텍스처이고 구운 주름 노멀 맵은 아니다. 두께(Solidify)·CC0 천 텍스처·색 변주·가려진 몸 지우기는 ✅. 가중치는 Data Transfer 후 **덮어쓰기에서 각반 감은 띠가 잘못 처리된다 → I1**. |
| Step 2 걷기·서기·망치질에서 뚫림 없음 (미리보기 3장) | ❌ | 3장은 있다. 그러나 걷기 그림에서 `m_tunic`·`m_field`의 각반 감은 띠가 다리에서 떨어져 뻣뻣한 관으로 매달린다. 보고서의 「눈에 보이는 뚫림 없음」은 틀리다 → I1. |
| Step 3 10~20명, 마당·장터·밭·대장간(망치질), 가까이 메시·멀리 줄임 | ⚠️ | 10~20 맞춤 ✅(시험 통과), 대장간 망치질은 30/30 시드에 있고 모루 3 m 안 ✅, 장터·우물·밭·텃밭 ✅, LOD0/LOD1 + 220 m 밖 숨김 ✅. 「걸상에 앉기」는 어느 시드에서도 뽑히지 않는다 → I2. |
| Step 4 골목 눈높이에서 마네킹이 아닌 옷 입은 사람 (`p1_t3_street.png`) | ✅ | 짚모자·자루·리넨 튜닉으로 읽힌다. 단 발치의 회색 관(각반)이 어색하다 → I1. |
| 오류 0 | ⚠️ | 콘솔 확인은 보고서 주장이다. 새 오류 경로(`peopleInfo.err`)는 코드로 확인했다. |
| 60 fps 이상 | ⚠️ | 측정 보류(지적 아님). |
| 시험 100개 유지 | ✅ | 보고 111(100 + 7 + 4). 새 4개는 통과를 직접 확인했다. |
| 근사 예산 LOD0 ≈ 8k 삼각형 | ⚠️ | 8.2k~10.2k (`f_cloak` 10,191 = +27%). 보고서가 인정했고 줄이는 길도 적었다 → M2. |
| 전역 제약 (출처, 엔진 파일 미수정, 결정성, Blender 사용자 설정, import 꼴, LF, 스크린샷 이름) | ✅ | CC0 출처·URL·라이선스는 `SOURCES.md`에 있다. `save_userpref`·`--factory-startup`은 없다. LF 확인함. 엔진 파일은 diff 에 없다. 새 코드에 `Math.random` 없음. |
| 동작: UAL 동작 그대로 | ⚠️ | UAL Standard 에 망치·괭이·들기가 없다. `Idle_Torch_Loop`+코드 겨누기, `Idle_Loop`+2뼈 IK 등으로 바꿔 썼고 문서에 근거를 남겼다. 합리적이다. 망치질·괭이질은 장면에서 그 동작으로 읽힌다(`forge`, `look2_hoe`). |
| 망토 | ⚠️ | 등 뒤 140° 만 덮는다(보고서 우려 5). 브리프 「망토」의 최소 형태다. |

Extra (요청에 없던 것):
- `tools/serve.py` 요청 대기열 128 (개발 서버만, 근거 있음, 무해).
- `look-real.html`의 `people=` 인자.
- `peopleplan.js`: 컨트롤러가 허용한 `realpeople.js` 외 순수 모듈. 작업 2의 `villageplan.js` 방식과 같아 이득이 더 크다.
- 걸상 앉기 동작(`sit`)과 앉기 동작 2개 → 도달 불가라 I2.

Misunderstood: 없음.

## 2. Strengths

- 세 층이 깨끗하다. 규칙은 three 없는 `peopleplan.js`, 그리기·동작은 `realpeople.js`, 연결은 `realscene.js`다. `realscene.js`는 1,501 → 1,420줄로 줄었다. 옛 마네킹·셰이더 옷·원뿔 치마가 지워졌다.
- 결정성이 좋다. 난수는 모두 인자 `rng`로만 쓰고(`peopleplan.js`), `peopleSeed`로 마을 짜기와 섞이지 않게 했다. 시험 1은 층 전체를 새로 짓고도 JSON 이 같은지 본다.
- 실패가 보인다. `Promise.allSettled` → `peopleInfo.err` + `console.warn`(`realscene.js:1374`), `spawn`의 한국어 오류, 실패한 자산 약속을 캐시에서 빼기(`realpeople.js:66`)가 있다. `p.catch`는 파생 약속만 처리하고 호출자에게는 거절이 그대로 간다.
- 작업 1 지적 유형(캐시가 재질을 공유)을 사람마다 재질 복제 + `customProgramCacheKey`로 피했다. 프로그램은 공유하고 유니폼만 따로 둔다.
- 덧씌운 뼈를 믹서 전에 되돌리는 처리(`realpeople.js:320`)는 `PropertyMixer`가 값이 바뀐 곡선만 쓴다는 원인을 정확히 짚은 수정이다. 1번 층으로 물 반사에서 뺀 것과 먼 사람 갱신 간격 줄이기도 좋다.
- Blender 쪽이 이식 가능하게 짜였다. 경로는 환경변수이고 세션 경로를 박지 않았다. 없으면 이유를 적어 멈춘다. `sys.dont_write_bytecode`, 쉼 자세 가드, 가드 실패 시 배포 glb 보존이 있다.
- 새 시험 4개는 실제 동작을 본다. 시드 30개에서 대장장이 위치(< 3 m), 동작 6종 존재, 변형 5종 이상, 집 밖 서기를 확인한다.
- 비교 그림(`before_after`)과 동작별 가까이 그림을 남겼고, 우려를 숨기지 않고 적었다.

## 3. Issues

### Critical
없음.

### Important

**I1. 각반 감은 띠(`leg_wraps`)가 허벅지 가중치를 받아, 걷기·들기·괭이질에서 다리와 떨어져 뻣뻣한 관으로 매달린다 (Step 2·4 요구 불충족)**
- 위치: `tools/blender/kit_clothes.py:916-917`(`weigh`), 사용처 `:841`(`m_tunic`), `:860`(`m_field`), 정의 `:779-784`.
- 무엇이 틀렸나:
  - `weigh`는 격자 옷이 `len(g.P) > 4`이고 `min z < F.z_crotch`이면 모두 `skirt_blend(share=0.95)`를 건다.
  - 치마·튜닉에는 맞다. 그러나 정강이에 감는 `*_wrap_*`(행 약 11, 모두 가랑이보다 아래)도 걸려, `t = 1`에서 가중치가 pelvis 0.05 + thigh 0.95로 통째로 바뀐다(`skirt_blend`, `:718-739`). Data Transfer 로 옮긴 calf·foot 가중치가 없어지는 것이다.
  - 무릎을 굽히는 동작에서 관은 허벅지만 따라가고 정강이(각반 hose, 몸 가중치 그대로)와 갈라진다.
- 눈에 보이는 증거:
  - `kits/preview/people_walk.png`: 1번(`m_tunic`)과 4번(`m_field`) 인물. 다리 부분 확대에서 굽은 hose 다리는 뒤로 가고 흰 관은 곧게 앞에 걸려 있다.
  - `p1_t3_look2_carry.png`: 두 다리 옆에 회색 관 둘이 어긋나 걸렸다.
  - `p1_t3_look2_hoe.png`: 오른쪽 다리 옆 관이 다리와 다른 각이다.
  - `p1_t3_street.png`: 발치의 회색 덩어리 두 개가 이 관이다. 골목 눈높이 필수 그림 안의 가장 가까운 사람이다.
- 왜 보고서가 못 잡았나: `poke_check`(`:1502`)는 `(V1[i] - c).length < 0.12` 인 쌍만 뚫림으로 센다. 다리가 굽어 hose 정점이 관 면에서 12 cm 넘게 벌어지면 「뚫림」이 아니라 목록에서 빠진다. 그래서 `m_tunic` 걷기 「1」, `m_field` 「1~3」으로 나왔다. 검사가 가장 큰 결함을 보지 못하게 설계된 셈이다. 보고서의 「눈에 보이는 뚫림 없음」과 「몸이 옷을 뚫는 것은 0~1 정점」은 신뢰할 수 없다.
- 고치는 법:
  1. `weigh`의 `skirt_blend` 조건에서 각반 감은 띠를 뺀다. 예: `limb_garment`로 지은 격자에 `g.limb = True`를 달고 `not getattr(g, 'limb', False)`를 조건에 더한다. Data Transfer 로 받은 calf·foot 가중치를 그대로 둔다.
  2. 다시 빌드해 `people_walk.png`를 새로 뽑고 장면(`look2_carry`, `look2_hoe`, `street`)에서 확인한다.
  3. `poke_check`의 12 cm 상한을 없애거나, 같은 쌍의 최대 이탈 거리를 로그로 남겨 「큰 이탈」을 함께 센다. 수치가 0에 가까운 채 그림이 틀린 일이 다시 없게 한다.
  4. (선택) 무릎 위쪽의 작은 살색 점(`people_walk.png` 확대, 1·2·4번 무릎)은 hose 를 뚫은 몸 정점으로 보인다. `hose`의 `off`(0.0035 m)를 무릎에서 키우거나 몸 쪽을 더 지운다.

**I2. 「걸상에 앉기」(`sit`)가 어떤 시드에서도 뽑히지 않는다: 기능 한 벌이 도달 불가이고 한 번도 장면에서 돌지 않았다**
- 위치: `docs/past-life/peopleplan.js:34`(`free`), `:80-84`(걸상 고르기); 죽은 코드: `realpeople.js:59-60`(`seatH`), `:218`(`sit` 동작), `:244`(엉덩이 높이), `anims.glb`의 `Sitting_Idle_Loop`·`Sitting_Talking_Loop`.
- 무엇이 틀렸나:
  - `free()`는 집 발자국을 `r + 0.3`(여기서는 0.5 m) 부풀려 그 안이면 거부한다.
  - 그런데 마당 걸상은 집 벽에서 0.42 m 떨어져 놓인다(`villageplan.js:372`, `D/2 + 0.42`). 그래서 모든 마당 걸상이 거부된다.
  - 탐침 결과: 시드 30개에 마당 걸상 730개, 이 중 집 거리 검사 탈락 730개. 16명일 때 `sit` 가 나온 시드는 0/30이다.
- 보고서 6항은 「시드 1329 에는 빈 걸상이 거의 없어 뽑히지 않는다」라고 적었지만, 시드 하나의 사정이 아니라 규칙이 항상 거부하는 구조다. 「엉덩이 높이 맞춤 코드는 있다」는 한 번도 실행되지 않은 코드다. 시험 3은 `sit`을 요구하지 않아 통과하며, 시험 2의 `ACTIONS.includes`가 `sit`을 허용만 한다.
- 왜 중요한가: 브리프에 없던 덤인데 문서·헤더·시험에 「된다」고 적혀 있다. 도달 불가 코드와 쓰이지 않는 애니메이션 2개(anims.glb 용량도 차지)가 남고, 작업 4에서 누가 이것을 믿고 쓸 수 있다.
- 고치는 법: 둘 중 하나로 끝낸다.
  - (a) 지운다: `peopleplan.js:80-84`, `ACTIONS`의 `sit`, `realpeople.js`의 `sit` 가지·`seatH`·`Sitting_*`, `CLIPS`에서 앉기 2개 → `anims.glb` 다시 뽑기.
  - (b) 살린다: `free`에서 `ignore`로 받은 항목(걸상 자신)이 곁에 있는 집 벽 거리 검사를 건너뛰게 하고, 장면에서 시각 확인 그림 + 「시드 30개 중 N개 이상에 `sit`」을 확인하는 시험을 더한다.

### Minor

**M1. 자원 해제가 덜 하다.**
- `clear()`(`realpeople.js:174-177`)는 재질 사본만 `dispose`한다. 사람마다 `SkeletonUtils.clone`이 만든 `Skeleton`(LOD0·LOD1 각각)의 `boneTexture`는 `skeleton.dispose()`가 없으면 남는다. 렌더된 LOD 마다 DataTexture 하나라서 `spawnPeople`을 다시 부를 때마다 쌓인다(작업 4에서 삶마다 부를 수 있다).
- 모듈 `cache`(`:20`)는 영영 비지 않는다. 같은 glb 를 다시 쓰려는 설계라 괜찮지만 `dispose()`로 해제할 길이 없다.
- `toolMat`(`:172, :184`)은 캐시가 가진 `A.mats.people_tool`에 `fogify`를 직접 덮어쓴다. `FOGU`가 모듈 변수라 지금은 무해하지만(래퍼가 한 겹 더 쌓일 뿐), 작업 1에서 지적된 「캐시가 가변 재질을 공유」와 같은 모양이다. `clone()` 후 `fogify`가 낫다.
- 고치는 법: `clear()`에서 `obj.traverse(o => o.isSkinnedMesh && o.skeleton.dispose())`, `toolMat`은 복제.

**M2. LOD0 삼각형이 약 8k 예산을 넘는다.** 8.2k~10.2k(`f_cloak` 10,191, `m_tunic` 9,086, `m_hood` 9,149). 보고서가 인정했고 가까이(28 m) 오는 사람이 보통 1~8명이라 합계는 작다(장터 시점 8명 근접, +73k 삼각형). 성능 측정 후 필요하면 몸통 열 24 → 20 또는 머리 Decimate 로 줄인다.

**M3. 「사람 갱신 0.2 ms」는 하한이다.** `stepMs`(`realpeople.js:329`)는 `step()` 안만 잰다. 이 밖에서 장면 전체 `updateMatrixWorld`가 보이지 않는 사람의 뼈(사람당 뼈 65 + 노드)까지 갱신하고(`visible = false`여도 행렬 갱신은 한다), 그림자 패스에도 스키닝이 있다. 측정이 풀리면 전체 프레임으로 확인한다.

**M4. LOD 전환에 완충이 없다.** `const nr = d < NEAR;`(`realpeople.js:311`). 28 m 근처를 서성이는 사람은 LOD0/LOD1 이 뚝뚝 바뀐다. 2~3 m 완충을 둔다.

**M5. 시험 빈틈.**
- 변형 이름이 `peopleplan.js:7`과 `kit_clothes.py:896`에 손으로 두 번 적혀 있고, glb 의 `v_*` 노드와 맞는지 보는 시험이 없다. 오타는 브라우저에서 `spawn`이 던질 때만 안다. glb JSON 청크의 노드 이름을 읽는 Node 시험이면 충분하다.
- 시험 4는 걷는 사람 경로를 `continue`로 건너뛰어(`test/peopleplan.test.mjs:51`) 경로가 집·큰 소품과 겹치는지 보지 않는다.
- `planPeople(…, NaN)`은 `Math.round(NaN ?? …)`이 NaN 이라 `n = NaN`이 되어 모든 역할이 뽑힌다(`peopleplan.js:27`, `?people=abc`). `Number.isFinite` 가드가 필요하다.
- 팔레트 시험의 상한 1.2는 느슨하다(`skin` 최대 약 1.1).

**M6. 그림 쪽 잔손질 (보고서가 일부 인정).**
- 가까이서 소매·후드·셔츠 끝에 들쭉날쭉한 가장자리가 보인다(`closeup` 후드 아래, `look2_hoe` 목선).
- 셔츠 단에 작은 틈이 보인다(`people_hammer.png` 오른쪽 아래, `forge.png`의 파란 삼각형).
- 자루(`prop_sack`)는 평면 음영이라 각진 면이 드러난다(`kit_clothes.py:1229`, `smooth = False`).
- 아이는 얼굴이 어른 비율에 가깝다(`look2_child`).
- 노인 발목에 거친 절단 단면이 보인다(`look2_elder`).

**M7. 재현성 메모.**
- Quaternius 묶음 두 개는 파일 해시도 버전도 적혀 있지 않다. 입력이 바뀌면 「바이트까지 같다」가 깨져도 알 길이 없다. `SOURCES.md`에 sha256 을 남긴다.
- `pack_people.mjs`의 의존(`@gltf-transform/*@4`, `meshoptimizer@0.21`, `sharp` 버전 미고정)은 파일 머리글에만 있고 `SOURCES.md`의 「다시 만들기」에는 없다.
- `anims.glb`는 `villagers.glb`를 쓴 다음에 쓴다. 뒷단계가 실패하면 둘이 어긋난 채 남는다(`pack_people.mjs:62`, `:91`).
- 표 `NATURAL`(`realpeople.js:17` ↔ `kit_clothes.py:1283`)과 망치 자세 상수(`realpeople.js:111` ↔ `kit_clothes.py:1412`)가 주석으로만 「같은 값」이라고 묶여 있다.

**M8. 파일·잔재.**
- `kit_clothes.py` 1,670줄은 격자 짓기·가중치·가림·텍스처·소품·미리보기·검사·내보내기를 한 파일에 담는다. 같은 폴더의 `kit_england.py`(1,237)·`kit_props.py`(1,321)와 같은 방식이라 지금은 감수한다.
- `realscene.js:30`의 `smoothLine` 가져오기가 안 쓰인다(옛 사람 코드 삭제 뒤 잔재).
- `planPeople`의 `ctx.roadEdge`는 안 쓰인다(`peopleplan.js:3`).
- `people/villager_m.glb`·`villager_f.glb`(약 830 KB)는 더 쓰이지 않는다(`SOURCES.md`가 「지워도 된다」고 적음). 비교 그림이 이미 있으니 지워도 된다.

## 4. Assessment

**Needs fixes.**
구조·결정성·오류 표면화·재질 공유 회피는 잘 지어졌고, 대장장이·괭이질·두건/여자 그림은 「옷 입은 마을 사람」으로 읽힌다. 그러나 `m_tunic`·`m_field`의 각반 감은 띠가 걷는 동안 다리에서 떨어지는 결함(I1)이 Step 2·4의 「걷기에서 뚫림 없음」 요구와 보고서 주장을 깨고, 그것을 놓친 뚫림 검사 자체가 큰 이탈을 걸러내므로(`:1502`) 함께 고쳐야 한다. `sit`은 도달 불가 코드(I2)이므로 지우거나 살려서 끝낸다.
