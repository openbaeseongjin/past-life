# 작업 4 재검토 1차 — 수정 1차 확인

- 범위: `snap-4-head` → `snap-4-fix1` 차이(작업 4 파일만: `realscene.js`·`main.js`·`lands.js`·`i18n.js`·`test/lands.test.mjs`) + 보고서 「수정 1차」 + 새 그림.
- 라이브 파일 여섯 개(`realscene.js`·`main.js`·`lands.js`·`i18n.js`·`ui.js`·`test/lands.test.mjs`)가 `snap-4-fix1`과 바이트 단위로 같음을 확인했다. 줄 번호는 `D:/Users/admin/Desktop/indigame/docs/past-life/` 기준이다.
- 브라우저는 실행하지 않았다. 코드 읽기, 노드 시험, 스크린샷 육안 확인으로 판단했다.
- 직접 돌린 것: `node --test test/lands.test.mjs`(5개 통과), `test/context.test.mjs`·`test/i18n.test.mjs`(20개 통과, `context.test`가 `AREA_STAGE[a][1]`을 쓰므로 표 모양 바뀜의 영향을 확인), `node --check`(네 파일 문법 통과), 그리고 스크래치패드의 일회용 스크립트로 `drawBirth('CHK2-0..19999')` 2만 개에 `stageOf`를 돌림.

---

## 1. 지적별 판정 (Finding Verdicts)

### I1. `W.meReady`가 늦으면 전경에 갇힘 — **ADDRESSED**
- `realscene.js:2132~2136`: 보류 깎기(`if (st.wideHold > 0) st.wideHold -= dt;`)와 전환 조건(`st.wideHold <= 0 && W.meReady && meObj()`)이 갈라졌다. 보류가 먼저 끝나도 사람 자산이 오는 첫 프레임에 `close`로 넘어간다. 제안한 고침과 같은 모양이고, 거기에 `meObj()` 검사를 더 얹었다.
- `meReady`가 true가 되는 곳(`realscene.js:2040`)은 `spawnMe(true)`를 바로 부르므로 그 직후 `meObj()`가 채워진다. `spawnMe`가 던져 `meObj()`가 비어도 전경으로 남는 것이라 안전한 쪽이다.
- 넘어갈 때 `st.user`의 yaw·pitch를 비운다(전경에서 쌓인 입력이 튀지 않게). 아래 M10과 맞물려 있다.
- 덧붙임: 지금 출생 기록 종이가 뜨는 동안 `app.hidden = true`(ui.js:257)라 캔버스 폭이 0이고, `frame()`은 `!canvas.clientWidth`이면 일찍 나간다(realscene.js:2212). 그래서 보류 시간은 종이를 읽는 동안에는 줄지 않는다. 이 경로는 수정 전과 같다.

### I2. `lands.js` 시대·세트가 `birth.group`과 모순 — **ADDRESSED**
- `lands.js:86` `eraOf(birth)`가 `birth.group`을 그대로 쓴다(없으면 `groupOf(year)`). 땅별 「농사 해」 열이 지워졌다.
- `lands.js:28` `settingOf(household, era)`: forager면 늘 `camp`, 그 밖은 집안 표.
- `lands.js:89~` `kitOf(area, year, era)`: forager는 `steppe`, modern은 `modern`, 그 사이는 땅의 문화 세트 + 시대별 바꿈.
- 시험(필수 조건): `test/lands.test.mjs:54` 「엔진이 뽑은 출생 3,000개」가 `drawBirth`로 `era === b.group`, forager면 `camp`·`steppe`, 그 밖은 `HOUSEHOLD_SETTING[household]`, modern이면 `modern`을 확인한다. 직접 돌려서 통과했다.
- 독립 검증: 2만 개(`CHK2-0..19999`)에서 `stageOf().era !== birth.group`은 **0건**(전에는 6,000개 중 368건). forager 1,489건은 모두 집안이 `band`이고 `camp`·`steppe`로 나온다.
- `soul.js:39`의 `okBirth`가 `b.group === groupOf(b.year)`를 강제하므로, 저장된 출생에서도 `eraOf(birth)`는 늘 `groupOf(year)`와 같다.
- 표 모양이 `[땅 모습, 문화 세트, 시대별 바꿈?]`으로 바뀌었다. 다른 곳에서 `AREA_STAGE`를 쓰는 곳은 `test/context.test.mjs`(인덱스 1만 읽음)뿐이라 영향이 없다. `eraOf`·`kitOf`·`settingOf`의 다른 호출처도 없다.

### I3. 아기·아이가 화면에서 너무 작음 — **ADDRESSED**
- `realscene.js:2093~2096`: 키 1.2 m 아래는 `clamp(3.2 × 키, 2.2, 3.4)`(곁 사람이 있으면 ×1.12)로 거리를 키에 맞춘다. 낮춘 시점(pitch 0.08)과 올린 보는 점(0.95 m)도 들어갔다. 곁 어른은 아이 뒤 150° 남짓에 모아 세운다(`spawnMe`, 1883·1890줄).
- 그림을 직접 열어 머리~발 높이를 쟀다(900px 기준).
  | 그림 | 대략 높이 | 비율 | 보고서 |
  |---|---|---|---|
  | `p1_t4_baby.png` | 약 355px | 약 39% | 37% |
  | `p1_t4_child.png` | 약 345px | 약 38% | 37.5% |
  | `p1_t4_adult.png` | 약 310px(밀짚모자 포함) | 약 34% | 26.7%(앉은 키 기준) |
  | `p1_t4_elder.png` | 약 340px | 약 38% | 36.3% |
  | `p1_t4_india_play.png` | 약 350px | 약 39% | 37.6% |
  | `p1_t4_china_play.png` | 약 370px | 약 41% | 37.6% |
  - 모두 1/3~1/2 안이다. 보고서의 앉은 어른 수치는 내 눈대중보다 낮게 적혀 있다. 방향은 보수적이라 문제가 아니다.
- 곁 어른 머리가 모두 화면에 들어 있고 엄마 옷자락이 두루마리 가장자리에 닿는 정도다. 보고서 걱정거리 5번과 일치한다.
- 12살↔13살 경계(`h` 1.19 m ↔ 1.575 m)에서 거리 공식이 바뀌어 화면 비율이 43% → 37%로 변한다. 시점 감쇠(`rate`)가 있고 변화 폭이 작아 문제가 아니다. `meScale`·`meVariant`(a < 13)과 `small`(h < 1.2)이 우연히 같은 경계에 맞아 있다.
- 새 그림이 `india_play`·`china_play`로 실제 플레이 상태(HUD 20살, 「일」 패 → 괭이질)라 이전 M7의 지적(콘솔로 맞춘 그림)도 이번 그림에서는 해소되었다.

### 컨트롤러가 요청한 마이너

| 항목 | 판정 | 근거 |
|---|---|---|
| **M1** 소개 뒤로 `setLife` 미루기 | ADDRESSED | `main.js:42`의 `nextPaint`(rAF + `setTimeout 0`, 창이 가려져도 100 ms 안에 넘어감). `main.js:90~95`에서 종이를 띄운 뒤 짓고 `await record`. `ui.birthRecord`가 `app.hidden = true`(ui.js:257)로 잡아서 캔버스는 가려져 있고, 소개 화면(`#intro`)은 불투명 전면(index.html:268)이라 앞 생의 마지막 그림이 비치지 않는다. |
| **M1** 땅 모습별 나무 캐시 | ADDRESSED | `realscene.js:323` `treeKit(renderer, landKey, P)`가 나무 만들기와 빌보드 굽기를 그리개 × 땅 모습마다 한 번만 한다. 공유 지오메트리는 `userData.shared`로 dispose에서 빠지고, 유니폼은 모듈 하나(`TREEU`, 310줄)다. `presetKey()`가 상수(75줄)라 캐시 키가 땅 모습만이어도 틀리지 않는다. 나무 만들기 안에는 화질(`QL`)이 안 들어간다. 키가 틀어질 일은 없다. |
| **M1** 짓기 쪼개기 | ADDRESSED | `nextTask`(1028·1234·1283·1337·1557줄), `floatGeoOf` 캐시(148줄), 풀포기를 `ready` 첫머리로(1554줄). `grass`는 `info()`에서만 읽는다. |
| **M1** `setTime` 전환 중 줄이기 | ADDRESSED | `setTimeGoal`이 끝 두 색을 한 번만 읽는다(`skyColorsAt`, 1440줄 / 2057줄). `stepTime`은 섞은 색을 주고 PMREM은 0.4초마다(2065~2067줄). `skyColors()`가 복제본을 돌려주고 새 장면은 1517줄에서 한 번 완전 계산한다. 도중에 목표가 또 바뀌어도 앞 `setTime`의 색을 이어받아 이음매가 맞다. |
| **M1** 긴 작업 합 측정 | ADDRESSED (측정은 보고서 주장) | 한 생 바뀜 2.5~3.6초 합, 가장 긴 한 덩어리 약 0.7~1.0초(전 1.5~1.6초)로 공개했다. 합은 거의 안 줄었고 보고서도 걱정거리 2번에 그대로 적었다. GAMA가 도는 중에 쟀다. 브라우저를 안 돌려서 수치는 재확인하지 못했다. 코드 구조(덩어리 분할·종이 뒤로 숨김)는 주장과 맞다. |
| **M2** 물 렌더 타깃 누수 | ADDRESSED | `realscene.js:312·717~728` `waterCaches`: 그리개마다 `Water` 하나를 만들어 장면 사이에 옮겨 단다. dispose는 `scene.remove(water)`만(793줄 부근). 장면마다 갱신하는 것(`sunDirection`·`sunColor` 1486줄, `time` 1534줄)이 모두 `water` 변수로 간다. 텍스처 캐시도 그리개 단위라 첫 장면의 dispose에 안 지워진다. |
| **M3** 짓기 실패 | ADDRESSED | `build`가 `made`를 따로 받아 반쯤 지은 장면을 `dispose`(1995~2002줄). `setLife`는 `detach`·`dispose`·`build`를 따로 try로 감싼다(2245~2247줄). `showStage(false)`는 캔버스를 비우고 숨긴 뒤 `.no3d`를 띄우고, 다음 성공 때 되돌린다(1976~1981줄, `[hidden]{display:none!important}` 40줄). 새 장면이 `canvas.hidden` 상태에서 지어져도 `resize()`가 1600×900으로 대신하고 되돌릴 때 `ResizeObserver`가 바로잡는다. |
| **M4** 알림 문구 | ADDRESSED | `i18n.js`에 `stageWarn` ko·en 둘 다 들어갔다. `p.dataset.t = 'stageWarn'`(1688줄)이라 `ui.js:49`의 `labels()`가 말을 바꿀 때 다시 쓴다. `warn()`은 `documentElement.lang`으로 말을 고른다(main.js:59·151이 갱신). 새 생 시작에서 알림을 거둔다(2243줄). `i18n.test`의 한·영 짝 검사도 통과. |
| **M5** `?q=` 저장 | ADDRESSED | `realscene.js:1670~1672`: 주소 → 저장값 → 높음 순서이고 쓰기는 `setQuality()`(2286줄)에만 있다. |
| **M10** 전경 입력 무시 | ADDRESSED | `canSteer`(2154줄)가 `campOn`이거나 `mode === 'close'`일 때만 포인터·휠을 받는다. |
| **M10** 곁 사람 매년 재세우기 | ADDRESSED | `spawnMe`(1869~1874줄)의 열쇠가 `변형|자리|동작|곁 사람 목록`이고 크기는 빠졌다. 크기만 바뀌면 `obj.scale`과 `p.scale`만 바꾼다. `realpeople.js:251`(`obj.scale.setScalar(p.scale)`)과 280(앉은 높이가 `p.scale`을 읽음)이 같은 필드라 맞고, `P.p`가 계획 객체 그 자체다. `act.key`에 `|`가 들어가지 않아 `moved` 계산(`split('|')[1]`)도 안전하다. |

---

## 2. 새 문제 (New Breakage)

### Critical
없음.

### Important
없음.

### Minor
1. **나무 캐시가 상한 없이 그래픽 메모리를 쥔다** — `realscene.js:323` `treeKit`
   - 굽는 판(`albRT` 반정밀 2048×1792, `nrmRT` 8비트)은 땅 모습 하나에 mip 포함 약 59 MB다(나무 7종 기준 내 계산). 전에는 생마다 dispose했는데 이제 그리개 수명 동안 남는다.
   - 땅 모습이 여섯 가지라 한 번 놀면서 모두 만나면 최대 약 350 MB(나무 지오메트리 제외)다. 상한은 있지만 약한 그래픽 칩에서는 빠듯할 수 있다.
   - 실측은 안 했다. 가까운 두 땅 모습만 남기는 식의 정리(LRU)를 권한다. 급하지 않다.
2. **`createRealScene` 자체가 중간에 던지면 반쯤 지은 것이 남는다** — `realscene.js:2003~2006`
   - `made(sc)`는 `createRealScene`이 `sc`를 돌려준 뒤에 불린다. 그 안에서 던지면(주로 WebGL 오류) `ResizeObserver`·렌더 타깃이 풀리지 않고, 앞 생의 캔버스는 `showStage(false)`가 비운다. 앞의 M3 세 번째 항목은 `sc`가 있는 경우만 풀린다.
   - 던질 일이 드물고, 던지면 어차피 글로만 진행으로 가므로 낮게 본다.
3. **전경에서도 커서가 `grab`이다** — `realscene.js:2153`
   - 전경은 이제 끌기·휠을 안 받는데 커서 모양이 안 바뀐다. 또 휠에 `preventDefault`를 안 해서 창이 스크롤되는 좁은 화면에서는 휠이 창으로 간다(3D는 PC 전용이라 영향은 거의 없다). 겉모양 문제다.
4. **확인 그림이 주장의 증거가 못 된다** — `p1_t4_fix1_buildfail.png`·`p1_t4_fix1_kit404.png`
   - `buildfail.png`는 「마지막 해, 4살」 전면 종이이고 `.no3d` 안내나 가려진 캔버스가 안 보인다.
   - `kit404.png`는 집이 없는 흐린 마을이라 세트 실패는 맞다. 그러나 바닥 가운데(800, 772)를 확대해도 알림 알약이 안 보인다.
   - 코드 읽기로는 논리가 맞다. 증거 그림만 약하다. 콘솔 확인값(`canvas.hidden`, `kit.ok`)에 기댄 것이다.
5. **확인용 API가 게임 객체에 남는다** — `debugFailNext`(2295줄), `st.failNext` 검사(2007줄)
   - 게임은 부르지 않고 보고서도 걱정거리 6번에 적었다. 해롭지 않으나 출시 전 정리 대상이다.

---

## 3. 범위 밖 관찰 (Out-of-Scope)

- **공유용 한 파일 빌드가 깨져 있다** — `D:/Users/admin/Desktop/indigame/docs/past-life/build_share.py`의 `ORDER`는 옛 `village`만 넣고 `realscene`·`lands`·`villageplan`·`peopleplan`·`realpeople`·`kitdata` 등을 모른다. `main.js`가 `./realscene.js`를 import하므로 읽기로는 의존 순서 검사(`assert … ORDER 에 없거나 뒤에 있다`)가 먼저 걸린다. 실행은 하지 않았다(파일을 쓴다). 또 실사 자산(glb 수 MB)을 한 파일에 넣을지는 별도 설계가 필요하다. 이전 라운드부터 있던 일이고 작업 4 수정의 책임은 아니다. 계획의 공유 단계에서 다뤄야 한다.
- **보류 중인 마이너(M6~M9)**: 시대별 소품 교체 미구현(`st.kitNow` 죽은 값), 드라이버 재현성, `realscene.js` 2,299줄(`createStage` 분리 권고), 시험 보강(무대 반환 객체 모양, `LAND_LOOK.mix` 종 이름)은 지시대로 미뤘다. 그대로 열려 있다. `AREA_STAGE`의 「농사 해」 열을 지우면서 M9의 「`land` 동어반복」 줄은 시험에서 사라졌다.
- **성능**: 프레임 p95는 컨트롤러 결정 5대로 대기 중이다(GAMA 실행 중). 이번 수정으로 생 바뀜의 긴 작업 합은 거의 안 줄었다(2.5~3.6초, 덩어리는 쪼개고 종이 뒤로 숨김).
- **아기 모습**: 아기가 세트에 없어 아이 변형을 줄인 것이라 머리 비율이 아기답지 않다. 보고서가 이미 밝혔다. 그림에서도 1살이 일고여덟 살처럼 보인다. 2단계 자산 문제다.
- 파일은 LF로 바뀌었다(`realscene.js` 등 여섯 개 확인). 저장소 나머지는 CRLF라 줄 끝이 섞이지만, 전역 제약 문구에는 맞는다.

---

## 4. 판정 (Verdict)

**통과 (APPROVED).** I1·I2·I3 세 가지 모두 ADDRESSED이고, 요청한 마이너 M1·M2·M3·M4·M5·M10도 ADDRESSED다. 새로 생긴 Critical·Important 문제는 없다. 위 Minor 다섯 개는 다음 라운드나 2단계 전에 처리해도 된다. 특히 1번(나무 캐시 상한)은 한 번 놀면서 여러 땅을 거치는 사용에서 실측해 보길 권한다.
