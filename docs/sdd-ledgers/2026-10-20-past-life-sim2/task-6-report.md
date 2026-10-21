# Task 6 보고: 공통 카드·줄 말 바꿔 끼우기

상태: **DONE_WITH_CONCERNS**. 우려는 맨 아래에 적었고, 모두 내 울타리 밖 데이터나 다른 작업에 걸린 것이다.

## 한 일

1. **시험부터 썼다** (`test/tokens.test.mjs`, 3개 추가).
   - 덱 전체 채우기: 덱의 모든 카드와 줄 글(제목·본문·노트·선택지·결과·줄)을 채운다.
     - 맥락: 40개 땅 × 대표 해 6개(−9000·300·1200·1650·1900·2000) × 그 묶음의 집안. 농사가 닿기 전의 땅이면 무리(band)도 넣는다.
     - 그 카드가 나올 수 있는 맥락만 본다. 거르기는 `cards.js` `condOk`로 한다. 다만 나이·성별·깃발·흔적·능력치·신분·전쟁처럼 한 생 안에서 바뀌는 조건은 뺀다.
     - 채운 뒤 한국어·영어 어디에도 `{` `}`가 남으면 안 된다. 모르는 자리 이름과 틀린 조사도 잡는다.
   - `tokens: true` 표시: 자리가 있는 카드·줄에는 반드시 표시가 있어야 하고, 표시가 있으면 반드시 자리가 있어야 한다. 인연 이름(`bond.who`)은 다음 생으로 넘어가므로 자리를 쓸 수 없다.
   - 누구나·흔적 카드(`u.`·`t.`)와 누구나 줄(`l.u.`) 가운데 60% 넘게 말 바꿈이나 조건이 붙었는지 본다. 20% 이하 목표의 단정은 Task 7 몫이라 넣지 않았다.
   - 먼저 돌려서 빨간불(실패) 2개를 확인했다. 바꾼 뒤에는 초록불이다.
2. **자리 글을 허용했다.** `test/content.test.mjs`와 `test/lines.test.mjs`에는 「`{place}` 말고 다른 자리는 안 된다」는 검사가 있었다.
   - 이 검사를 「`{place}`와 `WORD_KEYS` 자리(조사 포함)만 된다」로 바꿨다(`checkTokens` 사용).
   - content 쪽 검사는 제목과 노트까지 넓혔다.
3. **글을 바꿨다.** 카드와 줄의 id·선택지 구조·효과 값은 그대로다(아래 「확인」 참고).

## 전후 표

공통 카드의 기준은 감사 스크립트와 같다: `areas·regions·eras·eraGroups·minYear·maxYear·tags·zones·setting·event` 조건이 하나도 없는 카드.

| 묶음 | 전: 공통 | 후: 말 바꿈 | 후: 조건 붙임 | 후: 여전히 공통 |
|---|---|---|---|---|
| `cards_life.js` 누구나 카드 | 26 | **26** | 0 | 0 |
| `cards_trace.js` 흔적 카드 (조건이 흔적뿐) | 17 | **9** | 0 | 8 |
| `cards_era.js` | 0 (모두 `eraGroups`가 있음) | 9장 더 (시대 조건만 있던 카드) | 0 | 0 |
| **카드 합** | **43** | **44** (공통이던 것 35 + 시대 카드 9) | 0 | **8** |
| `lines.js` 누구나 줄 | 66 | **39** | **1** (`l.u.adult.worksong` → `maxYear: 1949`) | 26 |

- 브리프는 공통 카드를 67장으로 적었다. 위 기준으로 세면 누구나 26장과 흔적 17장, 모두 43장이다.
  - 67이라는 수는 `eraGroups`만 있는 시대 카드(약 28장)까지 센 것으로 보인다.
  - 그 시대 카드도 다 훑었고, 땅의 말이 자연스럽게 들어가는 9장에 자리를 넣었다:
    - e.for.adult.herd, e.for.adult.strangers
    - e.anc.middle.omen
    - e.med.adult.raiders, e.med.middle.well, e.med.old.lamp
    - e.ind.middle.doctor (제목·선택지 포함)
    - e.mod.adult.loan, e.mod.adult.abroad
- 남은 공통 흔적 카드는 8장이다:
  - t.fear.sea, t.fear.war, t.fear.beast
  - t.talent.craft, t.talent.sea, t.talent.fight
  - t.dream.sea, t.dream.travel
  - 앞 생의 흔적이 있을 때만 한 번 나오는 카드라서, 아래 측정(흔적 없는 자동 생)에는 잡히지 않는다.
- 남은 공통 줄 26개는 아기의 첫 순간(말·자장가·웃음)과 몸이나 마음의 보편적인 일이다.
  - 예: 흰머리, 말투가 부모를 닮음, 같은 이야기를 또 함, 아이들 놀이 규칙.
  - 억지로 자리를 넣으면 말이 어색해져서 그대로 두었다.
- 이 묶음 안 비율:
  - 누구나·흔적 카드는 42/50 = 84%가 말 바꿈이나 조건을 가졌다(원래부터 조건이 있던 흔적 카드 7장 포함).
  - 누구나 줄은 40/66 = 61%다.
- 쓴 자리와, 그 자리를 쓴 카드·줄의 수:
  - `{home}` 16, `{feast}` 13, `{holy}` 11, `{market}` 11, `{healer}` 8, `{staple}` 7, `{crop}` 6, `{coin}` 6, `{land}` 4, `{cloth}` 2, `{beast}` 1
  - `{ruler}`·`{school}`은 쓰지 않았다(아래 「바랐던 낱말」).
- 조건을 붙인 곳은 `l.u.adult.worksong` 하나다. 「일하면서 부르는 노래」는 기계 앞 일터가 흔한 현대 묶음에서 빼고 `maxYear: 1949`로 막았다.
  - `eraGroups`를 쓰지 않은 데는 이유가 있다. `eraGroups`로 막으면 그 카드의 가중치가 ×2가 된다. `maxYear`는 가중치를 바꾸지 않는다.
  - 다른 공통 카드는 모든 시대·땅에 장면이 맞아서 조건이 필요 없었다.
    - 수렵 무리도 「{coin:으로} 빌린 것」을 쓸 수 있다. 무리의 돈은 조개 구슬이다.
    - 「{market}」은 무리에서 「물물교환 모임」이 되어 자연스럽다.

## 측정: 시드 2,000개, 자동 결정

- 스크립트: `<scratchpad>/t6/measure.mjs`
- 「완전 공통」의 기준: 위 조건이 하나도 없고, 글에 자리도 없다(`tokens`가 없음).

| | 전 | 후 |
|---|---|---|
| 보인 카드 가운데 완전 공통 | 6,098 / 11,132 = **54.8%** | 0 / 11,132 = **0.0%** |
| 보인 작은 일 줄 가운데 완전 공통 | 25,961 / 31,124 = **83.4%** | 9,677 / 31,116 = **31.1%** |
| 덱의 카드 가운데 조건이나 자리가 있음 | 165/208 (79%) | 200/208 (96%) |
| 덱의 줄 가운데 조건이나 자리가 있음 (설계 4.4 목표 ≥70%) | 86/152 (57%) | 126/152 (**83%**) |

- 보인 카드 수(11,132)는 전후가 같다.
  - 자리를 넣어도 id와 가중치가 그대로라서, 같은 시드는 같은 생이다.
  - 생명표 맞춤도 그대로다.
- 보인 줄 수는 8개 줄었다. 일 노래 조건 때문에, 아주 오래 사는 현대 생 몇이 남은 줄을 다 써 버린 해가 생겼다. 줄은 죽음 굴림이나 수치에 닿지 않는다.
- 참고로 감사 스크립트(`scratchpad/rep_audit.mjs`)에 따르면, 다른 문화권에서 500년 넘게 떨어져 태어난 두 생이 같은 카드 id를 보는 비율은 **18%** 그대로다.
  - 말 바꿈은 id를 바꾸지 않기 때문이다.
  - 이 수치(목표 ≤8%)는 Task 7의 고유 묶음이 맡는다.

## 보기: 다섯 카드와 한 줄을 네 맥락에서

맥락은 네 가지다:
- A: 1200년 인도 땅, 농사짓는 집
- B: 1880년 브리튼, 공장 다니는 집
- C: 2000년 한반도, 회사 다니는 집
- D: 기원전 5000년 오스트레일리아, 무리

**u.baby.fever** 본문 `몸이 불덩이처럼 뜨거워요. {healer:이} 다녀간 뒤에도 어머니가 밤새 당신을 안고 있어요.`
- A: 바이디야가 다녀간 뒤에도 … / The vaidya has been and gone, …
- B: 의사가 다녀간 뒤에도 … / The doctor has been and gone, …
- C: 의사가 다녀간 뒤에도 … / The doctor has been and gone, …
- D: 주술사가 다녀간 뒤에도 … / The healer has been and gone, …

**u.teen.love** 본문 `{market}에서 자꾸 눈길이 가는 사람이 있어요. …`
- A: 장터에서 … / There is someone at the market …
- B: 시장에서 … / There is someone at the market …
- C: 시장에서 … / There is someone at the market …
- D: 물물교환 모임에서 … / There is someone at the trading meet …

**u.adult.borrow** 본문 `예전에 {coin:으로} 빌린 것을 갚을 때가 됐어요. …`
- A: 은화로 빌린 것을 … / repay the silver coins you borrowed
- B: 실링으로 빌린 것을 … / repay the shillings you borrowed
- C: 원으로 빌린 것을 … / repay the won you borrowed
- D: 조개 구슬로 빌린 것을 … / repay the shell beads you borrowed

**u.adult.good_year** 잔치 결과 `사흘 동안 {feast}보다 요란하게 먹고 노래했어요. 나흘째엔 다들 조용했어요.`
- A: 디왈리보다 … / louder than Diwali
- B: 성탄절보다 … / louder than Christmas
- C: 추석보다 … / louder than Chuseok
- D: 모임 잔치보다 … / louder than gathering feast

**u.old.visit** 본문 `{holy}에 다녀온 사람이 소식을 전해요. 어릴 적 친구가 아직 살아 있대요. …`
- A: 사원에 다녀온 … / Someone back from the temple …
- B: 교회에 다녀온 … / Someone back from the church …
- C: 절에 다녀온 … / Someone back from the temple …
- D: 성스러운 바위에 다녀온 … / Someone back from the sacred rock …

**l.u.middle.busy** 줄 `… 정신을 차려 보니 또 {feast:이} 돌아와 있었어요.`
- A: 디왈리가 돌아와 있었어요 / Diwali had come round again
- B: 성탄절이 돌아와 있었어요 / Christmas had come round again
- C: 추석이 돌아와 있었어요 / Chuseok had come round again
- D: 모임 잔치가 돌아와 있었어요 / gathering feast had come round again

## 글을 쓸 때 지킨 규칙

카드 파일 머리에 주석으로도 남겼다.

- **영어는 자리 앞에 a/an을 쓰지 않는다.** 「a apartment」 같은 글이 나오기 때문이다. `the {x}`나 복수·물질 명사 꼴로만 쓴다.
- **`{feast}` 앞에 the를 붙이지 않는다.** Christmas·Diwali 같은 이름이 섞여 있고, 「the Fourth of July」는 낱말에 이미 the가 들어 있다. 「around/for/than/at {feast}」, 「{feast} had come round」 꼴로 쓴다.
- **crop·staple·coin은 주어로 쓰지 않는다.** 단수·복수가 섞여 있어서 동사 수 맞춤이 깨지기 때문이다. 목적어나 「the {x}」, 「some {x}」로만 쓴다.
- **한국어 조사는 받침에 따라 달라지면 반드시 `{x:조사}`로 쓴다.** 에·에서·도·뿐·보다·마다·만처럼 받침과 상관없는 것만 그냥 붙인다. 시험이 이 규칙을 잡지는 않으므로, 검사 스크립트로 맨 조사가 0개인 것을 따로 확인했다.
- **현대의 돈 낱말(원·엔·위안 …)은 화폐 이름이다.** 「빌린 원을」처럼 맨 명사로 쓰면 어색하다. 그래서 「{coin:으로} 빌린 것」, 「{coin:으로} 셈하는 소리」 꼴로 썼다.
- **채운 뒤 길이도 쟀다.** 16개 해 × 40개 땅에서 채운 글이 길이 제한(카드 90/180자, 줄 60/120자 등)을 넘는 것은 0개다. 처음에 넘던 영어 줄 3개는 줄였다.

## 바랐던 낱말 (context 쪽, 내 울타리 밖이라 고치지 않음)

1. **`ruler` 영어 낱말을 관사·단수로 맞춰 주세요.**
   - 「동인도회사 / the Company」에는 the가 들어 있다. 「원로원 / Senate」, 「신전의 어른 / temple elders」, 「어른들 / elders」는 복수이거나 무리 이름이다.
   - 이 때문에 영어에서 「the {ruler}」를 안전하게 쓸 수 없어 `{ruler}`를 아예 쓰지 않았다. 세금·부역·징집 같은 공통 장면에 가장 쓰고 싶던 자리다.
   - 바라는 것: the를 낱말에서 빼거나, `rulerTitle` 같은 관사 없는 단수 칭호를 새 키로 두기.
2. **`feast` 영어 낱말의 꼴을 맞춰 주세요.**
   - 고유 이름(Christmas)과 일반 명사(gathering feast·harvest festival·festival of the gods)가 섞여 있다. 그래서 「louder than gathering feast」처럼 관사가 빠진 글이 나온다.
   - 바라는 것: 모두 이름처럼 대문자로 쓰기(Gathering Feast), 그리고 「the Fourth of July」의 the 빼기.
3. **`money` (한 「돈」, 영 「money」 또는 그 땅·시대의 돈을 부르는 일반 말).** 화폐 이름이 아닌 「돈」 자리가 있으면 빚·유산·여행 카드가 더 자연스럽다.
4. **`school`의 이른 시대 값을 손봐 주세요.** 고대의 기본값 「어른들의 이야기 자리 / elders' tales」와 「성년식 배움터 / initiation camp」는 「학교」 자리에 넣으면 뜻이 달라진다. 그래서 공통 카드에서 `{school}`을 쓰지 못했다.
5. 있으면 장면이 더 다양해질 키:
   - `drink`: 차·맥주·마테·버터차
   - `instrument`: 북·시타르·가야금
   - `toy`/`game`: 아이들 놀이

## 확인

- **구조는 그대로다.** 글을 뺀 구조(id·`when`·효과·확률·깃발·스킬·꿈·인연)를 바꾸기 전 백업과 견줬다.
  - 다른 것은 일부러 붙인 `l.u.adult.worksong`의 `maxYear` 하나뿐이다(`<scratchpad>/t6/samestruct.mjs`).
  - 효과 값은 하나도 바뀌지 않았다.
- **파일 형식:** UTF-8·LF다(CRLF 0개를 확인했다).
- **`npm test`:** 215개 모두 통과, 실패 0이다(생명표·여정 시험 포함).

## 바꾼 파일

- `docs/past-life/cards_life.js`: 누구나 카드 26장, 머리 주석
- `docs/past-life/cards_era.js`: 9장
- `docs/past-life/cards_trace.js`: 9장
- `docs/past-life/lines.js`: 줄 39개에 말 바꿈, 1개에 조건, 머리 주석
- `docs/past-life/test/tokens.test.mjs`: 덱 전체 채우기 시험 3개
- `docs/past-life/test/content.test.mjs`: 자리 글 검사 한 줄을 고치고 import 추가
- `docs/past-life/test/lines.test.mjs`: 자리 글 검사 한 줄을 고치고 import 추가
  - 이 파일은 허용 목록에 없지만, `{place}`만 받는 검사 때문에 줄에 자리를 넣으면 시험이 깨진다.
  - 그 한 줄만 content 쪽과 같은 규칙으로 고쳤다.

## 우려

1. **`lines.test.mjs`를 울타리 밖에서 고쳤다.** 위 「바꾼 파일」에 이유를 적었다. 다른 작업이 이 파일을 고치고 있다면 합칠 때 그 한 줄만 보면 된다.
2. **자리를 채우는 것은 Task 4 몫이다.** 화면에서 채우는 일은 Task 4(`i18n.js renderText`, `ui.js`)에 달려 있다.
   - 지금 `ui.js`는 갈림길을 그해 맥락으로, 기억 구슬을 `memCtx(그 생, 그 구슬)`로 채운다.
   - 기억 구슬에는 날것의 자리 글이 저장되어 영혼 기록으로 넘어간다. 다음 생 모닥불에서 보일 때도 그 구슬이 생긴 생과 해의 맥락으로 채워야 한다. 다음 생의 맥락으로 채우면 낱말이 틀린다.
   - 인연 이름(`bond.who`)에는 자리가 없다. 시험이 지킨다.
3. **영어 관사 문제.** 「바랐던 낱말」 1·2번의 낱말 문제 때문에 영어 몇 군데가 「gathering feast」처럼 조금 어색하게 읽힌다. 시험이 막을 문제는 아니다(빈 `{}` 없음).
4. **같은 카드 id 비율은 그대로다.** 완전 공통 카드 비율은 0%가 됐다. 그러나 다른 문화권의 두 생이 같은 카드 id를 보는 비율은 18%로 변하지 않았다. 「다 똑같다」는 체감의 절반은 같은 장면 구조에서 오므로, Task 7의 고유 묶음이 꼭 필요하다.
5. **`context_data.js`가 작업 중에 바뀌고 있었다.** 다른 작업이 고치는 동안 「드루이드」, 「아고라」 같은 새 낱말이 생겼다. 내 시험은 표를 그때그때 읽으므로 새 낱말에도 그대로 맞는다.

---

## 수정 1차 (검토 `task-6-review.md` 반영)

상태: **DONE**. `npm test`는 222개 모두 통과, 실패 0이다(생명표·여정·맥락·시대어긋남 시험 포함). 시험 7개가 늘었다.

### I1. 영어 `{feast}` 관사 (`tokens.js` + `context_data.js`)
- **`tokens.js`에 `feastEn(w)`를 두었다.** `fillTokens`는 영어 `{feast}` 자리를 채울 때 이 함수를 거친다.
  - 대문자로 시작하면 이름이라 그대로 둔다(Diwali, Christmas, New Year Festival).
  - 이미 `the `로 시작해도 그대로 둔다(the Fourth of July). 그래서 「the the」는 생길 수 없다.
  - 둘 다 아니면 일반 명사로 보고 `the`를 붙인다(the hunt feast, the festival of the gods).
  - 문장 첫머리의 `{Feast}`는 「The hunt feast…」가 된다.
- **낱말을 나누는 기준은 따로 표시하지 않고 첫 글자로 정했다.** 대문자로 시작하면 이름, 소문자면 일반 명사다. 이름인데 첫 글자가 소문자인 것은 없다. 반대로 일반 명사인데 대문자로 시작하던 두 낱말은 이름 꼴로 고쳤다:
  - `New Year festival` → `New Year Festival` (3곳)
  - `midsummer Christmas` → `Midsummer Christmas`
- **Task 4와 같은 규칙을 쓴다.** `i18n.js:216`은 조정자 말대로 Task 4가 `fillTokens('{feast}…')`로 바꾸므로 이 규칙이 그대로 적용된다(`i18n.js`는 건드리지 않았다).
- **결과:**
  - 「Around the gathering feast」, 「just before the flood festival」, 「louder than the festival of the gods」, 「the hunt feast had come round again」
  - 「Around Diwali」, 「On the night of the Fourth of July」
- **시험(`tokens.test.mjs`):**
  - `feastEn` 단위 시험
  - 40개 땅 × 20개 해 × 집안(무리 포함)에서 「Around {feast}. {Feast}.」를 채워도 `the the`가 0개
  - 카드·줄 원문에 `the {feast`가 0개, `a/an {…}`도 0개

### I2. 농사 안 짓는 집안의 밭 낱말 (카드 6장 + 줄 3개)
조건을 붙이지 않고 모든 집안에 맞는 자리로 바꿨다. 조건을 붙이면 가중치 ×2가 붙고 공장·회사 집안의 카드 수가 줄기 때문이다.

| id | 전 | 후 |
|---|---|---|
| u.child.chores | Carry the {crop} / {crop} 나르고, 저거 줍고 | Run to the {market} / {market}에 심부름 가고, 이것저것 줍고 (Minor 2도 함께) |
| u.adult.neighbor | their {crop} ran short · You shared your {crop} | {staple} |
| u.adult.good_year | You have {crop} to spare | You have {staple} to spare |
| t.fear.hunger | there is more {crop} | This year you have more {staple} than you need (Minor 1 수 일치도 함께) |
| u.teen.leave | beyond the {land} | Life in this {home} feels too small / 이 {home}에서 사는 게 갑갑해요 |
| u.old.memory | over the {land} | beyond the {holy} / {holy} 너머 하늘 |
| l.u.child.nickname | the {beast} | The kids at the {market} gave you a nickname |
| l.u.child.lost | out in the {land} | around the {market} |
| l.u.old.dawn | the {land} to yourself | At dawn the whole {home} was yours / 동틀 녘 {home:은} 혼자 차지였어요 |

- `{crop}`은 이제 수렵 무리만 보는 `e.for.*` 카드 두 장에만 남았다. `{land}`·`{beast}`는 쓰지 않는다.
- **새 시험:** `{crop}`·`{land}`·`{landUnit}`·`{beast}`가 들어간 글이 산업·현대 시대의 농사 안 짓는 집안(농사·목축·무리 밖의 모든 집안)에게 나올 수 있으면 실패한다. 이전 카드 파일로 돌려 보면 「u.child.chores … china 1900 factory」에서 실패하는 것을 확인했다.

### 낱말 표 손질 (`context_data.js`, 값만)
- **ruler:**
  - `the Company` → `East India Company` (2곳)
  - `city elders` → `city council`
  - `temple elders` → `temple council`
  - `elders`(오스트레일리아 농사 전) → `council of elders`
  - `Free State authorities` → `Free State administration`
  - `occupying powers` → `occupation authority`. 이 낱말은 다른 작업이 새로 넣은 것이고, 한국어도 「점령군」 → 「점령 당국」으로 맞췄다.
  - 시험: 모든 맥락의 ruler.en에 관사가 없고, 머리 낱말이 복수가 아니다(`Congress`만 예외).
  - **`governor or emperor`(동아프리카 1885~1959)는 그대로 두었다.**
    - 표 주석에 따르면 에티오피아는 식민지가 되지 않아 일부러 「총독이나 황제」로 쓴 것이다.
    - `colonial governor`로 바꾸면 에티오피아 황제가 사라진다.
    - 「or」로 묶은 단수 칭호라서 「the governor or emperor」, 「governor or emperor demands」 모두 문법이 맞는다.
- **school:**
  - `elders' tales` → `elders' circle` (15곳)
  - 「모닥불 가」 → 「모닥불 곁」 (「모닥불 가가」 막기)
  - 시험: school.en이 「…tales」로 끝나지 않는다.
- **feast:** I1에서 고친 두 낱말이다.
- **`money`:** 조정자 결정대로 새 키를 만들지 않았다.
- **머리 주석:** `tokens.js`와 `context_data.js` 머리 주석에 ruler·feast·school 규칙을 적었다.

### Minor
- **1·2:** 위 I2에서 함께 고쳤다.
- **3:** `u.middle.teach` 결과를 「{market}에서 만난 다른 사람에게 배웠대요 / someone they met at the {market}」로 바꿨다.
- **4:** `t.talent.trade` 결과는 원문으로 되돌렸다(슈퍼마켓 흥정). 그래서 말 바꿈 표시도 뺐다. `t.talent.music`의 「{market:을} 지나던 사람들」은 길거리 노래로 자연스러워 그대로 두었다.
- **5:** `t.fear.fire`를 「이웃 {home}에서 불길이 치솟았어요 / flames shoot up from the neighbors’ {home}」로 바꿨다.
- **6:** `l.u.teen.taller`를 「Every garment of {cloth} you owned got short」로 바꿨다.
- **7:** 가장 자주 보이던 공통 줄 넷에 자리를 넣었다.
  - `l.u.adult.dream`: {market}에 가는 길
  - `l.u.adult.stream`: {staple:을} 싸 들고
  - `l.u.adult.waist`: {market}까지 다녀오며
  - `l.u.adult.tool`: 이웃 {home}
- **8:** `l.u.child.errand`의 「뭘 사러」를 「뭘 하러」로 바꿨다.
- **9:** 시험 손질.
  - `tokens.js`에 `hasWordTokens`·`leftoverBraces` 도우미를 두었다. content·lines·tokens 시험 셋이 이 도우미를 같이 쓰므로, 복사된 정규식이 없어졌다.
  - 한국어 맨 조사 금지 시험을 더했다(`{x}` 바로 뒤의 은·는·이·가·을·를·과·와·으로·로 …).
  - 60% 규칙 시험의 주석과 메시지에, 보인 카드 기준 ≤20% 단정은 Task 7이 둔다고 적었다.
- **10:** `l.u.adult.worksong` 위에 주석을 달았다. 현대의 농사·유목 집안까지 빠지는 것은 일부러 둔 단순화이고, `maxYear`는 가중치 ×2를 붙이지 않는다.
- **채운 뒤 길이:** `the`가 붙으며 영어 줄 두 개가 120자를 넘어서 줄였다(feastfood, oldsong). 16개 해 × 40개 땅에서 채운 뒤 넘는 것은 0개다.

### 다시 잰 수치 (시드 2,000개, 자동 결정)

| | 처음 | Task 6 1차 | 수정 1차 |
|---|---|---|---|
| 보인 카드 가운데 완전 공통 | 54.8% | 0.0% | **0.0%** |
| 보인 줄 가운데 완전 공통 | 83.4% | 31.1% | **22.8%** (말 바꿈이나 조건이 있는 줄이 **77.2%**, 목표 ≥70%) |
| 덱의 줄 가운데 조건이나 자리가 있음 | 57% | 83% | **86%** (130/152) |

- 말 바꿈한 카드·줄 수:
  - 누구나 카드 26/26, 시대 카드 9, 흔적 카드 8/24
  - 누구나 줄 43/66 + 조건 1
- 쓰는 자리와, 그 자리를 쓴 카드·줄의 수:
  - `{home}` 19, `{market}` 15, `{feast}` 13, `{holy}` 12, `{staple}` 11, `{healer}` 8, `{coin}` 6, `{crop}` 2, `{cloth}` 2
- **구조:** 글을 뺀 구조는 Task 6 이전과 견줘 다른 것이 `l.u.adult.worksong`의 `maxYear` 하나뿐이다. 효과 값이 바뀐 곳은 없다.
- **파일 형식:** 모든 파일이 LF다.

### 바꾼 파일 (이번 차례)
- `docs/past-life/tokens.js`: `feastEn`, `hasWordTokens`, `leftoverBraces`, 머리 주석
- `docs/past-life/context_data.js`: ruler 6개 값, school 16곳, feast 4곳, 머리 주석
- `docs/past-life/cards_life.js`, `cards_trace.js`, `lines.js`
- `docs/past-life/test/tokens.test.mjs`: 시험 4개 추가, 도우미 사용
- `docs/past-life/test/content.test.mjs`, `test/lines.test.mjs`: 자리 검사 줄을 `leftoverBraces`로 바꿈

### 남은 우려
1. **`governor or emperor`를 고치지 않았다.** 검토 권고와 다른 판단이다(위 「낱말 표 손질」 참고).
2. **무리가 `FARM_FROM`을 넘겨 살 때의 낱말(검토 Minor 11)은 이번 울타리 밖이다.** `context.js`가 해만 보기 때문에 생기는 문제라 Task 7 전에 정해야 한다.
3. **Task 4의 `calmFeast`가 `fillTokens`로 바뀌어야 규칙이 하나로 모인다.** 조정자가 Task 4에 이미 알렸다.
