# 작업 4 보고서 — 실사 무대를 게임에 연결 (1단계 마지막)

상태: **DONE_WITH_CONCERNS**

- 시험: `npm test` **117개 모두 통과** (113 + 새 `test/lands.test.mjs` 4개)
- 콘솔: 보통 한 생 끝까지 돌린 뒤 **오류 0, 경고 0** (자산 실패를 일부러 낸 시험만 404·경고가 나온다. 아래 6장)
- 성능: 1600×900 「높음」에서 게임 안 rAF 기준 **평균 13.6~16.2 ms, p95 18.3 ms** (아래 5장. GPU는 놀고 있었고, CPU는 사용자 GAMA java 배치가 62~73%를 쓰는 중에 쟀다)
- 놀아 보기: `http://localhost:8780/index.html?seed=T4-151` (서버: `python D:/Users/admin/Desktop/indigame/docs/past-life/tools/serve.py 8780`)

---

## 1. 만든 것

1. **`realscene.js`에 `createStage(canvas)`와 `phaseOf`를 더했다.**
   - `main.js`는 `import { createStage as createVillage, phaseOf } from './realscene.js';` 한 줄로 바꿨다. `village.js`·`assets.js`는 그대로 두었고 main은 더 이상 부르지 않는다.
   - `loadHex`는 지웠다. `setKit`은 빈 함수다.
2. **생마다 장면을 새로 짓는다.**
   - `setLife(birth)`가 앞 장면을 풀고(`dispose`) 출생 시드로 새 장면을 짓는다.
   - 그리개(WebGLRenderer) 하나, 세트 glb, 사람 glb, 텍스처는 생 사이에 함께 쓴다.
   - 시드와 상관없는 무거운 계산(지형 정점, 7 km 먼 땅 그림, 강·길·밭 색인)은 모듈에 한 번만 만들어 둔다.
   - 동기 짓기 시간: 첫 생 2.66 s → 다음 생부터 1.31 s.
3. **카메라: 내 사람 가까이 (사용자 결정 「너무 멀어서 안보여」 반영).**
   - 기본은 3인칭 근접 시점이다. 마을 전경은 탄생 3.2초와 죽음(불씨) 때만 쓴다. 3장에 자세히 적었다.
4. **내 사람이 올해의 패를 따른다.**
   - 새 API `setFocus(id)`를 더했다. main이 해마다, 그리고 패를 누를 때 `life.focus || autoFocus(life.stats)`를 넘긴다.
   - `setAge`도 같은 규칙으로 다시 정한다.
5. **모닥불·불씨.**
   - 장터 빈터에서 천막·좌판·큰 소품과 가장 넉넉히 떨어진 자리를 골라 모닥불을 놓는다. 장작 6개, 돌 11개, 불꽃 입자 56개, 불티 26개, 점광원, 바닥 빛을 넣었다.
   - 점광원은 늘 장면에 두고 세기만 0으로 바꾼다. 빛 수가 바뀌어 셰이더를 다시 짜는 일이 없다.
   - 내 사람은 불가에 무릎을 꿇는다(아이·노인은 선다).
   - `ghost`면 불 건너편에 푸른 반투명 불씨 사람이 위아래로 떠오른다.
   - 카메라는 내 사람과 불을 함께 담고, 오른쪽 모닥불 종이 판을 비켜 왼쪽 40%쯤에 둔다.
   - `flameRise()`: 카메라가 마을 전경으로 물러나고, 내 사람 머리 위에서 하얀 불씨와 꼬리 불티 6개가 2.6초 동안 30 m 떠올라 사라진다. Promise이고, `fast`·움직임 줄이기면 바로 끝난다.
   - **main.js가 죽는 해에 `await village.flameRise()`를 부르도록 더했다.** 예전에는 어디서도 부르지 않았다. 지금(2026)까지 사는 생에는 부르지 않는다.
6. **다른 땅의 고리.** 새 순수 모듈 `lands.js`와 그 Node 시험을 만들었다(4장).
   - 무대는 `stageOf(birth).land`대로 풀·흙·밭(논)·나무·하늘을 바꾼다.
   - 세트는 지금 england 하나뿐이라 모두 그것으로 대신 쓴다(`builtKit`).
7. **색감(가볍게).**
   - 색 보정 셰이더에 S 곡선(0.22), 어두운 쪽 밤색·밝은 쪽 금빛 split toning, 해 쪽 안개빛(화면 공간)을 더했다.
   - 아침·해질녘에는 안개의 해 쪽 산란을 넓고 세게 한다(`uFogSunK`). 이것이 god-ray 대신이다. god-ray는 비용 때문에 뺐다.
   - 「높음/보통」 화질 단계: `?q=high|normal`로 바꾸고 localStorage `pl.quality`에 저장한다. API는 `stage.setQuality(q)`다.
     - 보통 = AO 끔 + 그림자 지도 2048 + 가까운 나무 반경 150 m(나머지는 빌보드) + 먼 숲 60%.
     - 나무 반경과 숲 수는 다음 장면부터 적용된다.
8. **자산 실패.**
   - 건물·소품·사람·나무를 못 불러오면 무대 아래쪽에 작은 알림을 띄운다: 「마을 그림 일부를 불러오지 못했어요 — 이야기는 그대로 이어집니다」.
   - `info().errors`에 남긴다(같은 실패는 한 번만, 20개까지).
   - HUD 흐름은 멈추지 않는다. 404를 낸 시험에서 `fast`로 15생이 끝까지 돌았다.
   - WebGL이 없으면 `createStage`가 던지고 main의 `has3d` 대체가 받는다.
9. **`index.html`·`look-real.html` importmap**에 `three/addons/`와 `@dgreenheck/ez-tree`(1.1.0 build/ez-tree.es.js)를 넣었다. `realscene.js`는 ez-tree를 importmap 이름으로 동적 import한다(전역 제약 맞춤).

## 2. API 대응 (village.js → createStage)

| village.js | createStage (realscene.js) |
|---|---|
| `fast` (get/set) | 같다. 시각·카메라 넘어가기를 바로 끝내고, `flameRise`는 바로 끝난다 |
| `setKit(kit)` | 빈 함수 (KayKit 시절 이름) |
| `setLife(birth)` | 앞 장면 dispose → `stageOf(birth)`(땅·세트), `stageSeed(birth)`(배치 시드)로 새 장면. 첫 3.2초 전경 → 내 사람 곁으로 |
| `setAge(age, year)` | 내 사람 변형·크기·동작을 다시 정한다. 시대가 바뀌면 `kitNow`를 다시 정한다(1단계는 그림이 같다) |
| (새) `setFocus(id)` | 올해의 패 → 자리·동작·곁 사람 |
| `setPhase(name)` | dawn 5.1 · morning 7.4 · noon 12.6 · afternoon 16.6 · dusk 19.05 · night 21.7 (태양시). 둥근 시계에서 가까운 쪽으로 1.4~3.2초 동안 넘어간다. 밤은 해가 지평선 아래로(최저 −18°) |
| `setCampfire(on, ghost)` | 1장 5번 |
| `flameRise()` | 1장 5번 |
| `tick()` | 카메라가 내 사람 둘레를 조금 더 돈다(spin +0.3, 반감 1초) |
| `snapshot()` | 320×180 JPEG. lift·오프셋 없이 찍고 되돌린다 |
| `setView({lift})` | `camera.setViewOffset`으로 그림을 위로 (lift × 화면 높이 × 0.4). 가까운 시점에서는 두루마리를 비켜 조금 왼쪽으로(3.5%). 모닥불 때는 40%만 |
| (새) `setQuality`, `info`, `rafStats`, `resetStats`, `scene`, `debugView('wide'\|'close')`, `debugCam({...})` | 확인·조정용 |

## 3. 카메라

### 3.1 기본: 내 사람 가까이 (사용자 결정)
- **내 사람:** 마을 사람 세트의 변형을 성별로 고른다.
  - 13살 아래는 `child`, 60살부터는 남자 `elder`(굽은 등·지팡이), 여자 `f_cloak`이다. 노인 여자 변형은 세트에 없어서, 회색 머리에 망토 입은 여인으로 대신했다.
  - 어른 남자는 집안에 따라 `m_field`·`m_smith`·`m_hood`·`m_tunic`, 어른 여자는 `f_apron`·`f_cloak`이다.
  - 크기: 0살 0.4 → 12살 0.68 → 13~17살 0.9~0.98 → 어른 1 → 60살~ 0.97.
- **거리:** 사람 키 × 3.4 + 0.6 m, 4~8 m(3~15 m로 제한). 눈높이보다 조금 위(pitch 0.2, 아이는 0.3)에서 내려다본다.
  - 곁 사람이 있으면 5.4 m 이상으로 물러나고 무리 가운데 쪽으로 조금 옮긴다.
- **방향:** 내 자리에서 바탕(마을 가운데·교회·집) 반대편에 선다. 그래서 내 사람 뒤로 마을과 하늘이 보인다.
  - 천천히 ±0.35 rad를 오가고, `tick()`마다 더 돈다.
- **가림 검사:** 집·교회·대장간·물레방앗간·천막·좌판의 바닥 OBB × 높이, 그리고 곁 사람을 넣어 카메라→사람 선을 검사한다.
  - 막히면 지난번 방향부터 거리를 0.78·0.6배로 당기고, 그래도 막히면 좌우 ±0.35~2.1 rad로 돈다.
- **따라가기:** 걷는 사람은 목표점을 4/s 지수 감쇠로, 카메라는 시점 전환 직후 느리게(0.9~1.4/s) 시작해 4/s까지 올린다. 뚝 끊기지 않는다.
- **조작:**
  - 휠: 0.45~2.6배, 곧 3~15 m 남짓.
  - 끌기: 둘레 돌기·높이. 캔버스에서 시작한 끌기만 받으므로 HUD 위에서 시작한 끌기는 오지 않는다.
- **HUD:** `setView({lift})`(데스크톱 0.18)로 그림을 위로 올린다. 가까운 시점은 오른쪽 두루마리를 비켜 왼쪽으로 3.5% 옮긴다.

### 3.2 마을 전경 (탄생·죽음 때만)
- `GAME_CAM = { pos: [-44, 20, 108], look: [21, 5.5, -31], fov: 41 }`이다. 높이는 그 자리 땅에서 잰다.
- 화면 위 15~20%에 하늘과 먼 구릉이 들어오고, 가운데에 마을(교회 탑 오른쪽), 앞에 강·아치 다리·물레방앗간, 오른쪽에 대장간·양 떼가 보인다.
- 좌우로 ±0.075 rad 천천히 오간다.
- Task 2에서 넘겨받은 「40 m 내려다보기, 하늘 없음」 문제를 이 시점이 풀었다(`p1_final_compare.png` 가운데).
- 전경에서는 내 사람 발밑에 금빛 빛 웅덩이와 몸 빛을 켠다. 해가 높을수록 세게 해서 「주인공 자리의 은은한 빛」을 낸다. 가까운 시점에서는 끈다.

### 3.3 올해의 패 → 내 사람이 하는 일 (1단계는 잉글랜드 배치의 정해진 자리)

| 패 | 자리 | 동작 (UAL 클립) |
|---|---|---|
| work · 농사·목축·수렵 | 마을 140~260 m 밖 갈아엎은 밭·밀밭 (마을 사람 괭이질 자리와 20 m 넘게) | hoe (Idle + 허리 굽힘 + 두 팔 IK + 괭이) |
| work · 장인·공장 | 대장간 앞마당 | kneel (Fixing_Kneeling) — **망치질 자리는 마을 대장장이가 쓰고 있어** 무릎 손질로 대신 |
| work · 장사·가게 | 장터 천막 뒤 + 손님 1 | talk (Idle_Talking_Loop) |
| work · 고기잡이·뱃사람 | 다리 아래쪽 강둑 | kneel (그물 손질 대용) |
| work · 하인 | 골목 | carry (자루 메고 걷기) |
| work · 귀족·전문직·사무 | 장터 빈터 + 1 | talk |
| work · 아이·노인 | 집 텃밭 | kneel |
| learn | 교회 앞 + 수사(m_hood) 1 (아이면 아이 1 더) | talk — **책·석판 클립이 없어** 이야기 듣기로 대신 |
| family | 집 앞 + 가족 2~3 (나이에 따라 부모·짝·아이·노부모·손주) | talk (아기는 stand) |
| body | 전경에서도 보이는 골목 18 m 왕복 | walk (노인은 Walk_Formal + 굽은 등 + 지팡이) |
| rest | 집 걸상 (마을 사람이 앉은 걸상은 비킨다) / 걸상이 없거나 아이면 나무 밑 | sit (Sitting_Idle) / stand |
| 6살 아래 | 집 앞 가족 곁 (짝수 해) / 골목 걷기 | stand·talk / walk |
| 모닥불 | 불가 | kneel (아이·노인 stand) |

## 4. `lands.js` (three 없는 순수 모듈)

- `stageOf(birth) → { kit, land, era, setting, variant }`
  - `land`: temperate · dry · monsoon · steppe · cold · tropical
  - `kit`: england · mudbrick · eastasia · southasia · africa · steppe · earlymodern · modern
    - 1950년부터는 모두 modern이다.
    - 농사가 그 땅에 닿기 전(그리고 기원전 8000년 전 모든 땅)은 era=forager, kit=steppe(수렵·초원 야영지 세트)다.
  - `era`: forager · ancient · medieval · early · industrial · modern. births.js `groupOf`와 경계가 같다.
  - `setting`: 집안 id(문자열)에서 정한다. 아래 표.
  - `variant`: 지금은 땅 이름 그대로다(같은 세트 안의 지붕·벽·옷 물감 차이 열쇠, 2단계용).
- 그 밖의 export:
  - `stageSeed(birth)`: FNV 해시(`seed|stage`)로 만든 32비트 무대 시드.
  - `builtKit(kit)`: 지은 세트만. 지금은 england.
  - `kitOf`, `eraOf`, `settingOf`, `AREA_STAGE`, `HOUSEHOLD_SETTING`, `LAND_LOOK`, 이름 목록.
- 주석: 2단계에서 setting은 문화 세트 위의 배치 요리법(수수한 집·읍내 집·큰 집 + 천막)으로 짓는다. 1단계는 모든 setting이 잉글랜드 마을이다.

### 4.1 땅 표 (40개 전부)

「농사 해」는 그 해 전은 수렵(forager)이라는 뜻이다. 오른쪽 끝은 1000 / 1700 / 1900년의 세트다.

| 땅 | 지역 | 땅 모습 | 기본 세트 | 농사 해 | 시대별 세트 바꿈 | 1000 / 1700 / 1900 |
|---|---|---|---|---|---|---|
| china | east | monsoon | eastasia | -7000 | — | eastasia / eastasia / eastasia |
| japan | east | monsoon | eastasia | -900 | — | eastasia / eastasia / eastasia |
| korea | east | monsoon | eastasia | -3500 | — | eastasia / eastasia / eastasia |
| mongolia | east | steppe | steppe | 없음(늘 유목) | — | steppe / steppe / steppe |
| india | south | monsoon | southasia | -6500 | — | southasia / southasia / southasia |
| bengal | south | monsoon | southasia | -2500 | — | southasia / southasia / southasia |
| indus | south | dry | southasia | -7000 | — | southasia / southasia / southasia |
| himalaya | south | monsoon | southasia | -2000 | — | southasia / southasia / southasia |
| lanka | south | tropical | southasia | -1000 | — | southasia / southasia / southasia |
| anatolia | west | dry | mudbrick | -8500 | — | mudbrick / mudbrick / mudbrick |
| iran | west | dry | mudbrick | -7500 | — | mudbrick / mudbrick / mudbrick |
| nile | west | dry | mudbrick | -5500 | — | mudbrick / mudbrick / mudbrick |
| mesopotamia | west | dry | mudbrick | -9000 | — | mudbrick / mudbrick / mudbrick |
| arabia | west | dry | mudbrick | -5000 | — | mudbrick / mudbrick / mudbrick |
| maghreb | west | dry | mudbrick | -5000 | — | mudbrick / mudbrick / mudbrick |
| steppe (중앙아시아) | west | steppe | steppe | -4000 | -4000→mudbrick (오아시스) | mudbrick / mudbrick / mudbrick |
| east_europe | europe | cold | england | -5000 | 1800→earlymodern | england / england / earlymodern |
| france | europe | temperate | england | -5500 | 1800→earlymodern | england / england / earlymodern |
| italy | europe | temperate | england | -6000 | 1800→earlymodern | england / england / earlymodern |
| germany | europe | temperate | england | -5500 | 1800→earlymodern | england / england / earlymodern |
| iberia | europe | dry | england | -5500 | 1800→earlymodern | england / england / earlymodern |
| britain | europe | temperate | england | -4000 | 1800→earlymodern | england / england / earlymodern |
| nordic | europe | cold | england | -3900 | 1800→earlymodern | england / england / earlymodern |
| balkans | europe | temperate | england | -6500 | 1800→earlymodern | england / england / earlymodern |
| west_africa | africa | tropical | africa | -2500 | — | africa / africa / africa |
| east_africa | africa | steppe | africa | -3000 | — | africa / africa / africa |
| congo | africa | tropical | africa | -1000 | — | africa / africa / africa |
| south_africa | africa | steppe | africa | 300 | — | africa / africa / africa |
| mesoamerica | americas | tropical | mudbrick | -2500 | — | mudbrick / mudbrick / mudbrick |
| andes | americas | cold | mudbrick | -2500 | — | mudbrick / mudbrick / mudbrick |
| brazil | americas | tropical | africa | -1000 | 1550→mudbrick, 1850→earlymodern | africa / mudbrick / earlymodern |
| north_america | americas | temperate | steppe | 800 | 1650→england, 1800→earlymodern | steppe / england / earlymodern |
| la_plata | americas | steppe | steppe | 1600 | 1600→mudbrick, 1850→earlymodern | steppe / mudbrick / earlymodern |
| caribbean | americas | tropical | africa | -1000 | 1500→mudbrick, 1850→earlymodern | africa / mudbrick / earlymodern |
| indonesia | seaoc | monsoon | southasia | -2000 | — | southasia / southasia / southasia |
| mainland_sea | seaoc | monsoon | southasia | -2500 | — | southasia / southasia / southasia |
| philippines | seaoc | monsoon | southasia | -2000 | — | southasia / southasia / southasia |
| malay | seaoc | tropical | southasia | -2000 | — | southasia / southasia / southasia |
| australia | seaoc | dry | steppe | 1790 | 1790→earlymodern | steppe / steppe / earlymodern |
| pacific | seaoc | tropical | africa | -1000 | — | africa / africa / africa |

메모:
- 아메리카·태평양의 「africa」 세트는 「열대 초가·나무 기둥 마을」 자리다(2단계에서 세트 이름을 더 나눌 수 있다).
- 남아시아 세트를 동남아시아 섬·대륙부가 함께 쓴다.

### 4.2 집안 → 자리 (setting)

| 집안 (households.js id) | 자리 |
|---|---|
| farm | village |
| band, herd | camp |
| craft, trade, shop, pro, office | street |
| elite, serve (큰 집의 하인) | estate |
| fish, sail | shore |
| factory | factory |
| (모르는 id) | village |

### 4.3 땅 모습이 바꾸는 것 (1단계, 잉글랜드 세트 위에서 `LAND_LOOK`)

- **temperate:** 바탕 그대로.
- **dry:**
  - 풀이 마른 풀빛(78%), 맨흙 얼룩 50%.
  - 나무 28%(산사·사과 위주), 산울타리 30%, 풀포기 45%, 들꽃 15%.
  - 탁한 하늘(turbidity 3.8), 구름 적음(0.74), 해 높이 72°.
- **monsoon:**
  - 짙은 초록. **밀밭 자리는 다 자란 벼, 갈아엎은 밭 자리는 물 댄 논과 줄지은 모**이다(물 부분은 거칠기 0.1이라 하늘을 비춘다).
  - 버드나무·물푸레·과일나무 위주, 나무 110%, 산울타리 25%.
  - 습한 하늘(turbidity 5.5, mie 0.008), 짙은 안개, 구름 많음, 해 74°.
- **steppe:** 마른 풀 55%, 맨흙 18%, 나무 10%(자작·산사), 산울타리 8%, 맑은 하늘.
- **cold:** 푸르스름한 풀, 자작 위주, 맑고 파란 하늘(rayleigh 2.2), 해 42°.
- **tropical:** 짙고 푸른 초록, 붉은 흙, 나무 125%, 들꽃 그대로, 아주 습한 하늘(turbidity 6.5), 해 80°.

### 4.4 시험 (`test/lands.test.mjs`, 4개)
1. 40개 땅이 표에 빠짐없이 있고, 이름이 모두 정해진 값이며, 땅 모습 여섯이 모두 쓰인다.
2. 모든 땅 × 20개 해 × 집안 3종에서 stageOf가 정해진 이름을 돌려준다. 1950년부터는 modern, 기원전 8000년 전은 forager/steppe이고, 모르는 땅·null 출생도 멈추지 않는다.
3. households.js의 모든 집안 id가 여섯 자리 가운데 하나로 이어진다(표와 id 집합이 같다).
4. 같은 출생이면 stageOf·stageSeed가 같고, 400 시드에서 무대 시드가 거의 겹치지 않는다.

## 5. 성능

측정 전 확인:
- `fczf` 없음.
- GPU 사용률 9%.
- CPU 62~73%: 사용자 GAMA java 배치가 쓰고 있었다. 꽉 찬 것은 아니어서 쟀다. 건드리지 않았다.

조건: RTX 2060, 1600×900, 「높음」, HUD 켬. 게임 안 rAF 간격이고, 시점마다 넘어가기를 기다린 뒤 6초를 쟀다.

| 장면 | 평균 | p50 | p95 | 그리기 | 삼각형 |
|---|---|---|---|---|---|
| 아침 · 가까이 (가족) | 15.6 ms | 18.1 | 18.3 | 372 | 11.4 M |
| 한낮 · 가까이 (괭이질, 마을이 뒤로) | 16.2 ms | 18.1 | 18.4 | 755 | 21.4 M |
| 해질녘 · 가까이 (골목) | 13.6 ms | 12.2 | 18.3 | 219 | 10.2 M |
| 한낮 · 전경 | 15.2 ms | 12.5 | 18.3 | 1150 | 13.7 M |
| 해질녘 · 전경 | 14.3 ms | 12.2 | 18.3 | 1395 | 22.0 M |
| 「보통」 한낮 · 가까이 | 10.6 ms | 12.1 | 18.2 | — | — |
| 「보통」 해질녘 · 전경 | 14.4 ms | 12.2 | 24.0 | — | — |

- 평균은 60 fps를 넘는다(61~74 fps). p95 18.3 ms(약 55 fps)는 목표에 조금 모자란다.
  - 간격이 12.2/18.1 ms 두 값으로 몰린다. 그리기는 16 ms 근처인데 가끔 한 vsync를 놓친다는 뜻이다.
  - Task 2·3의 장면 단독 p95(15~18 ms)와 같은 수준이다.
- 동기 측정 `bench`(그리기 + 1px 읽기, GPU를 기다림): 높음 23.6 ms, 보통 21.7 ms. 읽기 비용이 들어간 값이라 실제 프레임보다 크다.
- **판단:** 「높음」 평균 60 fps는 지켰다. p95는 CPU가 붐비는 중이라 컨트롤러가 깨끗한 상태에서 다시 재 주면 좋겠다. 그래서 「perf: 평균 통과, p95 확인 필요」로 둔다.

## 6. 스크린샷 (`D:/Users/admin/Desktop/indigame/.playwright-mcp/`, 1600×900, HUD 포함)

시드 T4-151: 1189년 브리튼, 농사짓는 집 둘째 아들, 80살에 죽음.

- 한 생 흐름 (Playwright 드라이버 `p1_t4_run2.js`가 실제 게임 흐름에서 패를 눌러 가며 찍었다):
  - `p1_t4_birth_wide.png` — 탄생 직후 마을 전경(밤에서 새벽으로, 대장간·창 불빛).
  - `p1_t4_baby.png` — 1살, 집 앞 가족 곁(아기).
  - `p1_t4_child.png` — 8살, 「친구와 놀기」(family) → 집 앞에서 부모·형과 이야기. **아이 샷.**
  - `p1_t4_morning.png` — 21살 아침, 「가족·이웃」 → 집 앞 셋이 이야기.
  - `p1_t4_crossroads.png` — 21살 갈림길(물레방아). 카드 뒤 마을이 흐려진다.
  - `p1_t4_campfire.png` — 30살 모닥불, 내 사람이 불가에 무릎 꿇음, 오른쪽 종이 판. 연습 판이라 앞 생이 없어 불씨 사람은 없다.
  - `p1_t4_adult.png` — 33살, 「쉬기·놀기」 → 집 앞 걸상에 앉음. **어른 샷.**
  - `p1_t4_noon.png` — 39살 한낮, 저절로 패(일) → 밭 괭이질, 뒤로 교회.
  - `p1_t4_elder.png` — 60살, 「배우기」 → 교회 앞에서 수사와 이야기, 회색 머리. **노인 샷.**
  - `p1_t4_dusk.png` — 66살 해질녘, 「몸 돌보기」 → 지팡이 짚고 골목 걷기, 창 불빛.
  - `p1_t4_flame.png` — 80살 죽는 해, 마을 전경으로 물러나며 하얀 불씨가 떠오름.
- 다른 땅(24살로 맞춘 아침, 일 → 밭):
  - `p1_t4_india_wide.png`, `p1_t4_india_close.png` — T4-21, 1304년 인도 땅(monsoon). 습한 하늘·짙은 초록, 물 댄 논에 줄지은 모.
  - `p1_t4_china_wide.png`, `p1_t4_china_close.png` — T4-39, 1410년 중국 땅(monsoon). 같은 땅 모습.
- 기타:
  - `p1_t4_wide_morning.png` — 잉글랜드 아침 전경(비교 그림용).
  - `p1_t4_close_work.png` — 24살 아침 괭이질 가까이.
  - `p1_t4_assetfail.png` — england.glb·villagers.glb를 일부러 404로 막은 화면. 알림이 뜨고 이야기는 이어진다.
  - `p1_final_compare.png` — 목표 그림 | 게임 전경(아침) | 게임 내 사람 가까이(21살 아침).
- 앞서 쓴 드라이버 `p1_t4_run.js`는 전경 시점 시절 것이다. 조정용 debug 샷은 스크래치패드로 옮겼다.
- 불씨 사람(ghost) 모습은 조정 중 콘솔로 `setCampfire(true, true)`를 불러 확인했다(푸른 반투명 사람 + 빛). 실제 게임에서는 두 번째 생부터 나온다.

## 7. 바꾼 파일

- `docs/past-life/realscene.js` (1,420 → 2,203줄):
  - `createStage`·`phaseOf`·`PHASE_TIME`을 더했다.
  - `createRealScene`에 새 옵션을 더했다: `land`, `quality`, `renderer`(함께 쓰기), `autoStart:false` + `renderFrame(dt)`.
  - 밤 해 궤도, `setTime(h, {light})`, 논·마른 땅 셰이더, 땅 모습별 나무·풀·산울타리를 넣었다.
  - 색 보정 곡선·split toning·해 쪽 빛, 해 쪽 안개 산란 세기를 넣었다.
  - 시드와 상관없는 지형·먼 땅 그림·환경 색인을 캐시하고, 텍스처를 그리개마다 캐시한다.
  - dispose를 보강했다: InstancedMesh 버퍼, 그림자 지도, 하늘·물 재질, 공유 그리개는 지우지 않음.
  - 다 짓기 전에 풀린 장면의 비동기 짓기를 멈춘다.
  - ez-tree를 importmap 이름으로 부른다.
- `docs/past-life/main.js`:
  - import 한 줄을 바꾸고 `loadHex`를 지웠다.
  - `setFocus`를 이었다(해마다 + 패를 누를 때, 빈 마을에도 `setFocus` 넣음).
  - 죽는 해에 `await village.flameRise()`를 넣었다.
  - `window.__pl.has3d`를 더했다.
- `docs/past-life/index.html`, `docs/past-life/look-real.html`: importmap에 `three/addons/`, `@dgreenheck/ez-tree`.
- 새 파일: `docs/past-life/lands.js`, `docs/past-life/test/lands.test.mjs`.
- 손대지 않음: 엔진 파일 전부, `village.js`, `assets.js`, `realpeople.js`, `peopleplan.js`, `villageplan.js`, `ui.js`.
- 확인 도구: `.playwright-mcp/p1_t4_run.js`, `p1_t4_run2.js`.

## 8. 걱정거리

1. **p95 18.3 ms** (5장): 평균은 60 fps를 넘지만 p95는 약 55 fps다. CPU가 붐비는 중에 쟀으니 깨끗한 상태에서 다시 재 주길 바란다. 더 줄일 곳:
   - 가까운 시점에서 먼 나무 빌보드·풀포기를 거리로 거르기.
   - 그림자를 3프레임마다에서 4프레임마다로.
2. **생이 바뀔 때 1.3초 멈춤:** `setLife`가 동기로 장면을 짓는다(가까운 땅 그림 0.65 s + 풀 0.5 s + 산울타리). 탄생 소개 화면 동안이라 거의 보이지 않지만, 소개 애니메이션이 한 번 끊긴다. 고치려면 Web Worker로 옮겨야 한다.
3. **없는 클립을 대신한 것들:**
   - 배우기: 책·석판 → 이야기 듣기.
   - 대장장이 일: 망치 → 무릎 손질. 대장간 망치질 자리를 마을 대장장이가 쓰고 있다.
   - 고기잡이: 그물 → 무릎.
   - 노인 여자: 전용 변형 없음 → f_cloak + 회색 머리.
   - 아기: 아이 변형을 0.4배로. 머리 비율이 아이 그대로라 아기로는 조금 크게 읽힌다.
4. **아이 장면의 가족 자리:** 아이(키 1.1 m) 곁 어른이 화면 오른쪽에서 크게 잘린다(`p1_t4_child.png`). 아이는 잘 보인다. 2단계 폴리시에서 아이용 무리 배치를 다듬으면 좋겠다.
5. **다른 땅은 여전히 잉글랜드 집·교회다.** 땅 색·논·하늘만 바뀐다(계획대로, 2단계 세트 대기). 인도·중국 판이 「물 댄 논 옆 잉글랜드 마을」로 보인다.
6. **화질 「보통」**은 AO·그림자를 바로 바꾸지만, 나무 반경·먼 숲 수는 다음 생 장면부터 적용된다.
7. **사람·소품 세부:** Task 3에서 넘긴 세부(괭이 자루 손 위치 어긋남, 다리 각반 등)는 사용자 지시대로 손대지 않았다. 가까운 시점이 되면서 이런 세부가 더 잘 보인다(예: `p1_t4_noon.png` 괭이 손).
8. **`look-real.html`의 overview 프리셋**은 예전 그대로다(시험 페이지용). 게임 전경은 `GAME_CAM`을 쓴다.

## 9. 놀아 보기

1. 서버: `python D:/Users/admin/Desktop/indigame/docs/past-life/tools/serve.py 8780` (루트 = `docs/past-life`)
2. 잉글랜드 한 생(연습 판, 저장 안 함): **`http://localhost:8780/index.html?seed=T4-151`**
   - 저절로 끝까지: `http://localhost:8780/index.html?seed=T4-151&auto=1`
   - 「보통」 화질: `&q=normal` (다시 높음: `&q=high`)
   - 다른 땅: `?seed=T4-21`(1304 인도), `?seed=T4-39`(1410 중국)
3. 조작: 마우스 휠 = 가까이/멀리, 끌기 = 내 사람 둘레 돌기. 오른쪽 아래 「올해의 패」를 누르면 내 사람이 하는 일이 바뀐다.

---

# 수정 1차 (검토 task-4-review.md 반영 · 친구에게 나눌 수 있게 안정성·느낌 우선)

상태: **DONE_WITH_CONCERNS**

- 시험: `npm test` **118개 모두 통과**. `lands.test.mjs`가 4개에서 5개로 늘었다(새로: 엔진 출생 3,000개 일관성).
- 콘솔: 최종 코드로 `?seed=T4-151&auto=1`, `T4-21`, `T4-39` 세 생을 끝까지 돌렸다. **오류 0, 경고 0.**
  - 입력은 실제 플레이와 같다: 속도 단추, 올해의 패 카드, 멈춤 단추를 클릭했다.
  - 게임 상태는 읽기만 하고 콘솔로 바꾸지 않았다.
- 성능: **pending**.
  - 측정 때 GAMA java가 CPU 62~85%를 쓰고 있었다. 첫 확인 때는 FC ONLINE(`fczf`)도 돌았고 GPU 사용률이 38%였다.
  - 둘 다 건드리지 않았다.
- 긴 작업(longtask) 합: 생 하나 바뀔 때마다 **약 2.5~3.6초, 가장 긴 한 덩어리는 약 0.7~1.0초**(아래 M1).
- 서버: 내 서버는 8781을 썼고 끝에 멈췄다. 컨트롤러의 8780은 건드리지 않았다. 브라우저도 닫았다.

## Important

### I1. 전경에 갇히는 경쟁 상태 — 고침
- 보류 시간을 깎는 일과 가까운 시점으로 넘어가는 조건을 나눴다.
  ```js
  if (st.mode === 'wide' && !st.dying) {
    if (st.wideHold > 0) st.wideHold -= dt;
    if (st.wideHold <= 0 && W.meReady && meObj()) { st.mode = 'close'; ... }
  }
  ```
- 보류가 끝난 뒤 사람 자산이 와도, 오는 첫 프레임에 가까운 시점으로 넘어간다.
- 넘어갈 때 끌기로 쌓인 회전·높이(`st.user.yaw/pitch`)는 비운다.

### I2. `lands.js` 시대·세트가 엔진과 모순 — 고침
- `era`는 이제 엔진 값 그대로다. `birth.group`이 있으면 그것을, 없으면 births.js `groupOf(year)`를 쓴다.
- 땅별 「농사 해」 열은 지웠다.
- `setting`: 수렵 시대(forager)는 늘 `camp`다. 그 밖은 집안 표대로다.
- `kit`:
  - forager는 `steppe`(야영지 세트), modern은 `modern`이다.
  - 그 사이는 땅의 문화 세트 + 시대별 바꿈이다.
  - 몽골·북아메리카 원주민·오스트레일리아처럼 천막 문화인 땅은 문화 세트 자체가 `steppe`다.
- 확인: 노드로 6,000시드를 돌려 `era ≠ group`이 **0건**(전에는 368건, 6.1%), 수렵 451건 모두 `camp`다.
- 새 시험(`lands.test.mjs` 3번): `drawBirth` 3,000개에서 다음을 확인한다.
  - `stageOf(b).era === b.group`
  - 수렵이면 `setting:'camp'`·`kit:'steppe'`
  - 그 밖은 `setting === HOUSEHOLD_SETTING[household]`
  - modern이면 `kit:'modern'`
- 표 바뀜:
  - `AREA_STAGE` 모양이 `[땅 모습, 문화 세트, 시대별 바꿈?]`로 바뀌었다.
  - 땅 모습·문화 세트·시대별 바꿈 값은 첫 보고 4.1장 표와 같다. 「농사 해」 열만 빠졌다.
  - `kitOf(area, year, era = groupOf(year))`, `eraOf(birth)`, `settingOf(household, era)`.

### I3. 아기·아이가 너무 작음 — 고침
- 키 1.2 m 아래(0~12살)는 거리를 키에 맞춘다: `clamp(3.2 × 키, 2.2, 3.4) m`. 곁 사람이 있으면 ×1.12다.
  - ×1.3 넓히기와 하한 3.6 m는 지웠다.
  - 사용자 휠은 2 m까지 당길 수 있다(어른은 3 m).
- 곁 어른이 있을 때:
  - 카메라를 거의 수평으로 낮춘다(pitch 0.08). 보는 점은 0.95 m로 올린다.
  - 어른들은 아이 **뒤**(카메라 반대쪽 약 150°, 반지름 2.0 m, 간격 0.36 rad)에 모여 선다.
  - 아이는 앞에서 크게 보이고, 뒤에 선 어른들은 머리까지 화면 가운데 쪽에 들어온다(오른쪽 두루마리 밑으로 가지 않게).
  - 곁 사람 가림 검사는 내 사람 가슴을 겨눈다.
- 어른 거리도 조금 당겼다: `3.2 × 키 + 0.6`(무리면 ×1.05).
- **실측 화면 비율** (머리~발을 카메라로 투영, 1600×900, HUD 켬, 실제 플레이 중 멈춤 단추로 멈춘 화면):

  | 그림 | 나이·자리 | 내 사람 비율 | 전 (검토 실측) |
  |---|---|---|---|
  | `p1_t4_baby.png` | 1살, 집 앞 가족(부모·형) | **37%** | 23% |
  | `p1_t4_child.png` | 7살, 친구와 놀기 → 집 앞 가족 | **37.5%** | 27% |
  | `p1_t4_adult.png` | 32살, 쉬기 → 걸상에 앉음 | 26.7% (앉은 키 기준, 서 있으면 약 37%) | 33% |
  | `p1_t4_elder.png` | 60살, 배우기 → 교회 앞 수사와 | **36.3%** | 32% |
  | `p1_t4_india_play.png` | 20살 인도(T4-21), 일 → 논에서 괭이질 | **37.6%** | (콘솔로 맞춘 그림이었음) |
  | `p1_t4_china_play.png` | 20살 중국(T4-39), 일 → 논에서 괭이질 | **37.6%** | (〃) |

- 아기·아이 그림에서 곁 어른 머리는 모두 화면 안에 있다. 엄마 옷자락만 두루마리 가장자리에 조금 걸린다.

## Minor (지금 고친 것)

### M1. 생 바뀔 때 멈춤
- **`setLife`를 미뤘다** (`main.js`).
  - 탄생 소개가 끝난 뒤 출생 기록 종이를 띄우고, 그것이 한 번 그려진 뒤(`requestAnimationFrame` + `setTimeout 0`, 창이 가려져도 0.1초면 넘어감) 무대를 짓는다.
  - 시작을 누르면 화면이 바로 바뀐다(탄생 소개가 즉시 뜬다). 짓는 동안의 멈춤은 가만히 읽는 종이 뒤에 숨는다.
- **나무 세트 캐시:** ez-tree 만들기와 먼 나무 빌보드 굽기를 그리개 × 땅 모습마다 한 번만 한다(`treeKit`).
  - 나무 재질이 장면 사이에 공유되므로 나무 유니폼(`TREEU`)을 모듈 하나로 뺐다.
  - 공유 지오메트리는 `userData.shared`라 장면 dispose가 지우지 않는다.
- **세트 조각 float 변환 캐시:** `floatGeoOf`. 전에는 집 놓을 때마다 양자화 속성을 다시 풀었다.
- **풀포기 짓기를 다음 일거리로:** `ready` 첫머리로 옮겼다.
- **나무·건물·소품·사람 짓기 사이에 `setTimeout 0`** (`nextTask`)를 넣어 한 덩어리 멈춤을 나눴다.
- **시각 넘어가기:** 전에는 300 ms마다 하늘 PMREM과 안개 색 읽기(GPU를 기다리는 `readRenderTargetPixels`)를 함께 했다.
  - 이제 넘어가기 시작 때 두 끝의 안개 색을 **한 번만** 읽는다(`skyColorsAt(목표)`).
  - 사이는 섞은 색을 준다(`setTime(h, { colors })`).
  - PMREM(그리기만, 읽기 없음)은 0.4초마다 한다.
- **긴 작업 측정:** `PerformanceObserver('longtask')`, `?seed=T4-151&auto=1&fast=1`로 10생을 이어 돌렸다. 땅은 무작위다. CPU를 GAMA가 쓰는 중이다.
  - 한 생 바뀜 구간(앞 생 끝 → 새 무대가 선 뒤 2초)의 50 ms 넘는 일거리 합: **2.5~3.6초**. 이 구간에는 앞 생의 썸네일·사망 기록 화면도 들어 있다.
  - 첫 생(차가운 상태: glb 풀기·셰이더·나무 만들기 포함): 3.7초. 첫 덩어리 1.6초는 모듈 읽기·three 초기화다.
  - **가장 긴 한 덩어리:** 수정 전 약 1.5~1.6초(setLife 한 덩어리 + ready 1.0초) → 수정 후 **약 0.7~1.0초**. 덩어리가 6~8개로 나뉘었다.
  - 장면 짓기 동기 시간(`info().scene.buildMs.sync`): 1,085 → 805 ms. 풀포기 405 ms는 다음 일거리로 갔다.
  - 차가운 새 땅 모습은 나무 만들기·굽기로 0.4~0.5초가 더 든다. 같은 땅 모습을 다시 만나면 0이다.

### M2. 물 반사 렌더 타깃 누수 — 고침
- three `Water`는 타깃을 클로저에 숨겨 풀 수 없다. 그래서 그리개마다 `Water` 하나를 만들어(`waterCaches`) 장면 사이에 옮겨 단다.
- 장면 dispose는 `scene.remove(water)`만 한다.
- 이제 생이 몇 번 바뀌어도 반사 타깃은 하나다(768², 깊이 버퍼 포함 약 2.4 MB, 1개).
- 전에 넣었던 「반사 텍스처만 dispose」 줄은 지웠다(공유 타깃을 망가뜨릴 수 있어서).

### M3. 짓기 실패 — 고침
- `setLife`가 앞 생 물건 풀기(`detach`), 앞 장면 `dispose`, 새 장면 짓기를 각각 try로 감싼다.
- 짓기가 던지면:
  - 반쯤 지은 장면을 `dispose`한다.
  - 캔버스를 밤색으로 비우고 숨긴 뒤, 무대 칸의 「3D 마을을 그릴 수 없어서 글로만 진행해요」 안내(`#no3d`, i18n `noVillage`)를 띄운다.
  - 앞 생의 마지막 그림은 남지 않는다.
- 다음 생이 지어지면 캔버스를 되살리고 안내를 거둔다.
- 확인용 콘솔 API `debugFailNext()`(다음 짓기를 한 번 일부러 실패시킴)를 넣고 `fast`로 이어 돌렸다.
  - 실패한 생: `canvas.hidden=true`, 안내 보임, 흐름이 이어짐(`done` 증가).
  - 다음 생: 캔버스가 되살아남.
  - 그림: `p1_t4_fix1_buildfail.png`

### M4. 알림 문구 — 고침
- `i18n.js`에 `stageWarn`(한·영)을 넣었다. 알림 `<p>`에 `data-t="stageWarn"`을 달아, 말을 바꾸면 ui.js가 함께 다시 쓴다.
- 새 생을 시작할 때 알림을 거둔다. 그 생에 다시 실패하면 다시 뜬다.
  - 같은 실패는 한 생에 한 번만 적고, 전체 목록은 20개까지다.
- 확인: england.glb를 404로 막고 시작 → 알림이 뜸(`p1_t4_fix1_kit404.png`). 막기를 풀고 다음 생 → 세트가 서고(`kit.ok=true`) 알림이 걷힘.

### M5. `?q=` 저장 — 고침
- 주소의 `?q=high|normal`은 그 판에만 쓰고 저장하지 않는다. 저장은 `setQuality()` API만 한다.
- 순서: 주소 → 저장 값 → 높음.

### M10. 입력·곁 사람 — 고침
- 전경(탄생·죽음)일 때는 끌기·휠을 받지 않는다. 가까운 시점·모닥불에서만 받는다.
- 내 사람을 다시 세우는 열쇠에서 크기를 뺐다: `변형|자리|동작|곁 사람 목록`.
  - 해마다 크기만 바뀌면 그 자리에서 `scale`만 바꾼다. 곁 사람을 해마다 다시 세우지 않는다.

(M6~M9는 지시대로 미뤘다.)

## 새로 찍은 그림 (`D:/Users/admin/Desktop/indigame/.playwright-mcp/`, 1600×900, HUD 포함, 실제 플레이)
- 영국 1189년(T4-151, 70살에 죽음):
  - `p1_t4_baby.png` — 1살
  - `p1_t4_child.png` — 7살
  - `p1_t4_adult.png` — 32살
  - `p1_t4_elder.png` — 60살
- 인도 1304년(T4-21, 61살에 죽음):
  - `p1_t4_india_play.png` — 20살, 「일」 패 → 물 댄 논에서 괭이질
- 중국 1410년(T4-39, 52살에 죽음):
  - `p1_t4_china_play.png` — 20살, 「일」 패 → 물 댄 논에서 괭이질
- 실패 경로:
  - `p1_t4_fix1_buildfail.png` — 짓기 실패 → 글로만 진행 안내
  - `p1_t4_fix1_kit404.png` — 건물 세트 404 → 알림
- 드라이버: `.playwright-mcp/p1_t4_fix1.js`
  - 시드별로 누를 패·찍을 나이를 정해 두었다.
  - `&drv=young`이면 아기·아이만 찍는다.
  - 상태는 읽기만 하고, 입력은 단추 클릭만 한다.
- 예전 `p1_t4_india_close/wide`, `p1_t4_china_close/wide`는 콘솔로 나이를 맞춘 그림이라 증거로 쓰지 않는다. 지금 그림은 `*_play.png`다.

## 바꾼 파일 (수정 1차)
- `docs/past-life/realscene.js` (2,203 → 2,299줄): I1·I3·M1·M2·M3·M4·M5·M10, 나무·물·float 캐시, `skyColorsAt`·`setTime({colors})`, `debugFailNext`
- `docs/past-life/lands.js`: I2 (`era` = 엔진 group, 수렵 = camp, 농사 해 열 삭제)
- `docs/past-life/test/lands.test.mjs`: 엔진 출생 3,000개 일관성 시험 추가(4 → 5개)
- `docs/past-life/main.js`: `setLife`를 출생 기록 종이가 그려진 뒤로(`nextPaint`)
- `docs/past-life/i18n.js`: `stageWarn` (ko·en)
- 모든 파일 LF, 엔진 파일은 그대로다.

## 걱정거리 (수정 1차 뒤)
1. **성능은 pending이다.** GAMA java가 CPU를 쓰는 동안이라 프레임 수치를 새로 내지 않았다. 깨끗한 상태에서 다시 재야 한다.
2. **생 바뀜 긴 작업 합은 아직 2.5~3.6초다.** 덩어리는 1초 아래로 나뉘었고 출생 기록 종이 뒤로 숨었지만, 종이가 떠 있는 동안 1초 남짓 단추 반응이 늦을 수 있다.
   - 남은 큰 몫: 가까운 땅 그림 1024²(0.55~0.62초), 풀포기(0.4초), 집 합치기·사람 세우기·셰이더 준비.
   - 더 줄이려면 땅 그림·풀포기 자리 고르기를 Web Worker로 옮겨야 한다.
3. **아기는 여전히 아이 변형을 줄인 것이라** 머리 비율이 아기답지 않다(세트에 아기가 없음).
4. **앉은 어른(`p1_t4_adult.png`)은 앉은 키 기준 27%다.** 서 있을 때 기준으로는 37%다. 앉은 자세라 그대로 두었다.
5. **아이 장면에서 엄마 옷자락이 두루마리 가장자리에 조금 걸린다.** 머리는 화면 안이다.
6. **`debugFailNext`·`debugView`·`debugCam`은 확인용 콘솔 API다.** 게임은 부르지 않는다.
