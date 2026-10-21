# Task 6 검토: 공통 카드·줄 말 바꿔 끼우기

검토 대상: `review-6-base..6-head.task6only.diff`, `snap-6-base` / `snap-6-head`, 보고서 `task-6-report.md`.
검토 방법: 읽기 전용. 시험은 집중 세 파일만 돌렸다(20개 모두 통과). 채우기 점검 스크립트는 내 임시 폴더(`scratchpad/r6/`)에 있다. 채우기는 라이브 `tokens.js`·`context.js`로 했고, 라이브 파일이 `snap-6-head`와 같음을 확인했다(`ui.js`만 Task 4 때문에 다르다).

**총평: ⚠️ 조건부 통과. Critical 없음. Important 2건은 글 자체가 아니라 낱말 표(`context_data.js`)·채우기(`tokens.js`)·집안 축에서 온다. 작은 수정 라운드 1번이면 닫힌다.**

---

## 1. Spec Compliance

| 항목 | 판정 | 근거 |
|---|---|---|
| 브리프 Step 1: 덱 전체 채우기 시험 + `tokens: true` 표시 | ✅ | `test/tokens.test.mjs`에 3개. 나올 수 있는 맥락만 `cards.js condOk`로 거르고(`LIFE_ONLY` 제외), `seen > 0 \|\| c.event`로 헛통과를 막는다. `strict` 채우기라 모르는 자리·조사가 던져진다. |
| Step 2: 말 바꿈 / 시대 조건 | ✅ | 카드 44장(`cards_life` 26 + `cards_era` 9 + `cards_trace` 9), 줄 39개. 시대 조건은 `l.u.adult.worksong`의 `maxYear: 1949` 하나. `maxYear`는 `cards.js weightOf`에 안 잡혀 가중치 ×2가 안 붙는다는 근거도 맞다. |
| Step 3: 시험 통과 | ✅ | 집중 세 파일 20/20. (전체 215는 보고서 값, 나는 안 돌림) |
| 울타리: 효과·id·구조 불변 | ✅ | `snap-6-base`↔`snap-6-head`의 `DECK`·`LINES`를 글({ko,en}) 뺀 채로 JSON 비교하니 다른 것은 `l.u.adult.worksong.when.maxYear` 하나. `bond` 전부 동일, 글이 바뀐 항목은 전부 `tokens: true`(또는 worksong). |
| 울타리: `lines.test.mjs` 수정 | ✅ (판정: 허용) | 지시문 울타리가 「글과 시험」을 허용한다. 옛 단정(`{place}`만 허용)은 자리 글이 들어가는 순간 깨지는 것이라 필요한 한 줄이고, `content.test.mjs`와 같은 규칙이다. 다만 같은 정규식이 세 시험 파일에 복사돼 있다(Minor 9). |
| 4.1 열쇠 사용 | ⚠️ | 11개 중 9개 사용(`ruler`·`school` 제외). 사용한 것은 `home` 16·`feast` 13·`holy` 11·`market` 11·`healer` 8·`staple` 7·`crop` 6·`coin` 6·`land` 4·`cloth` 2·`beast` 1. 공통 장면에 통치자·학교가 없어 타당하다. |
| 4.1 「모든 땅·시대에 안 맞으면 시대 조건」 | ⚠️ | 시대 축은 worksong 하나로 맞다. 그러나 **집안 축**(농사 안 짓는 산업·현대 집안에 `crop`·`land`·`beast`)은 건드리지 않았다(Important 2). |
| 4.4 공통 카드 비율 57% → ≤20% | ✅ | 보고서 측정 스크립트(`scratchpad/t6/measure.mjs`)를 다시 돌려 2,000시드에서 보인 카드 11,132 중 완전 공통 **0.0%**를 재현했다. 남은 공통은 흔적 카드 8장뿐(흔적이 있어야 나옴). |
| 4.4 줄(땅·시대 말이나 조건) ≥70% | ⚠️ | **덱 기준 126/152 = 83%**(재현). 그러나 4.4의 머리글이 「시드 2,000개, 자동 결정 기준」이므로 보인 줄로 재면 **68.9%**(공통 9,677/31,116 = 31.1%). 70%에 1.1점 모자란다. 보고서는 83%를 70% 목표 옆에 놓았다(Minor 7). Task 7의 고유 줄이 들어오면 넘을 것으로 보인다. |
| 4.4 `{…}` 0개 | ✅ | 아래 「시험」에서 확인. 내가 따로 40개 땅 × 40년 간격 × 집안(무리 포함)으로 채운 1,000만 개 글에서 `{ }`·길이 초과 0개. |
| 4.4 다른 문화권 같은 카드 18% → ≤8% | — | Task 7 몫(보고서도 인정). 말 바꿈은 id를 안 바꾸므로 그대로 18%. |
| 글 규칙(담담+위트, 실재 인물 없음, 한·영 짝, UTF-8·LF) | ✅ | CR 0개 확인. 새 역사 사실 주장이 없어 `CONTENT-SOURCES.md` 갱신은 필요 없다. |

참고: diff의 `test/content.test.mjs`에는 `EFFECT_RANGE` 효과 키 검사 줄이 같이 들어 있다. 이것은 Task 6이 아니라 같은 시간에 돌던 Task 4의 수정이 `snap-6-head`에 섞인 것이다(`task-4-brief.md` Step 6). 이 검토는 자리 글 검사 줄만 Task 6의 것으로 봤다.

---

## 2. Strengths

- **구조가 정말 그대로다.** 위 비교로 효과 값·확률·깃발·꿈·인연이 한 글자도 안 바뀐 것을 확인했다. 생명표·여정 시험이 영향받지 않는다는 보고서 주장이 성립한다.
- **시험이 진짜다.**
  - 기준선(`snap-6-base`)에서 60% 규칙을 계산하면 카드 7/50(14%), 줄 0/66(0%)로 실패하고, `snap-6-head`는 42/50(84%)·40/66(60.6%)로 통과한다. 즉 빈 시험이 아니다.
  - 채우기 시험은 자리가 있는 글만 골라 그 카드가 나올 수 있는 맥락에서만 채운다. 나올 맥락이 하나도 없으면 실패한다.
  - `tokens` 표시와 실제 자리의 양방향 일치, 그리고 인연 이름(`bond.who`)에 자리 금지를 지킨다(인연은 다음 생으로 넘어가므로 올바른 규칙).
- **조사 처리가 완전하다.** 콘텐츠 네 파일(`cards_life.js`·`cards_era.js`·`cards_trace.js`·`lines.js`)에서 `}` 바로 뒤에 맨 조사(은·는·이·가·을·를·과·와·으로·로 …)를 붙인 곳이 0개다. 받침 맞춤은 `tokens.js`와 따로 쓴 내 구현(유니코드 받침 계산, ㄹ 받침의 `로` 포함)으로 40개 땅 × 40년 간격 × 집안에서 조사 달린 자리 477,311개를 견주었고 틀린 것이 0개였다(바이디야가·의원이·벽돌 연립주택이·카카오 콩으로·무명으로 …).
- **영어 규칙이 효과가 있었다.** 자리 앞 a/an 0개, `the {feast}` 0개. 1,000만 개 채움을 정규식으로 훑어 `the the`·`a`+모음·겹단어·겹공백이 0개였고, 문법 문제로는 `t.fear.hunger` 하나만 잡혔다(Minor 1).
- **길이 제한 안전.** 40개 땅 × 40년 간격 × 집안으로 채운 약 1,024만 개 조각 중 길이 제한(카드 90/180자, 줄 60/120자 등) 초과 0개.
- **가중치를 건드리지 않는 판단이 맞다.** 시대 조건을 `eraGroups`가 아닌 `maxYear`로 붙인 이유(`weightOf`의 ×2)가 코드와 맞는다.
- **보고서가 정직하다.** 브리프의 67장 vs 실제 43장(+시대 카드) 차이, 남긴 공통 줄 26개의 이유, 18%가 그대로라는 점, `lines.test.mjs` 수정을 숨기지 않았다. 측정 수치도 내가 재현했다.

---

## 3. 채워 읽기 표 (5 맥락 + 보충 맥락)

맥락: **A** = 1200 india farm · **B** = 1650 korea farm · **C** = 1880 britain factory · **D** = −5000 australia band · **E** = 2000 north_america office. 보충: **F** = −9000 india band · **G** = −3000 mongolia herd · **H** = −2000 nile farm · **I** = −1500 mesoamerica farm · **J** = 1850 north_america farm · **K** = −9000 east_europe band.
판정: ✅ 자연스럽다 · ⚠️ 어색하지만 알아듣는다 · ❌ 깨졌다.

| # | id | 맥락 | ko | en | 판정 |
|---|---|---|---|---|---|
| 1 | u.baby.fever | A | 바이디야가 다녀간 뒤에도 어머니가 밤새 당신을 안고 있어요. | The vaidya has been and gone, and still your mother holds you through the night. | ✅ |
| 2 | u.child.friend | D | 옆 나무껍질 움막에 사는 아이가 날마다 같이 놀자고 찾아와요. | The child from the next bark shelter over comes by every day to play. | ✅ |
| 3 | u.child.story | D | 모임 잔치 무렵이면 밤마다 할머니가 옛이야기를 들려줘요. | **Around gathering feast**, your grandmother tells the old stories every night. | ❌ 관사 없음 |
| 4 | u.adult.child | H | 범람 축제를 앞두고 집에 아기가 태어났어요. | A baby has been born into your home just before **flood festival**. | ❌ 관사 없음 |
| 5 | u.adult.good_year(결과) | I | 사흘 동안 신들의 축일보다 요란하게 먹고 노래했어요. | Three days of eating and singing, louder than **festival of the gods**. | ❌ 관사 없음 |
| 6 | u.adult.good_year(결과) | B | 사흘 동안 한가위보다 요란하게 먹고 노래했어요. | …louder than Hangawi. | ✅ |
| 7 | u.adult.good_year | E | 올해는 하는 일마다 잘 풀렸어요. 옥수수도 넉넉히 남았어요. | This year, everything went your way. You have corn to spare. | ⚠️ 회사원 집안에 옥수수 |
| 8 | u.adult.neighbor | E | 이웃이 어렵게 입을 열어요. 올해 옥수수가 모자라서… | …asks: their corn ran short this year. | ⚠️ 교외 이웃의 옥수수 |
| 9 | u.child.chores | C | 어른들이 자꾸 일을 시켜요. 밀 나르고, 저거 줍고… | …Carry the wheat, pick that up, mind the little ones. | ⚠️ 공장 집안의 밀, ko 「저거」 짝 잃음 |
| 10 | t.fear.hunger | K | 올해는 개암이 남아돌아요. | This year there **is more hazelnuts** than you need. | ❌ 수 일치 |
| 11 | u.adult.borrow | B | 예전에 무명으로 빌린 것을 갚을 때가 됐어요. | …repay the cotton cloth you borrowed. | ✅ (좋은 보기) |
| 12 | u.adult.borrow | G | 예전에 털가죽으로 빌린 것을 갚을 때가 됐어요. | …repay the furs you borrowed. | ✅ |
| 13 | u.adult.borrow | D | 예전에 조개 구슬로 빌린 것을 갚을 때가 됐어요. | …repay the shell beads you borrowed. | ✅ 수렵 무리에도 받아들일 만함 |
| 14 | u.old.legacy | B | 평생 무명으로 모아 둔 것이 조금 있어요. | You have some cotton cloth put by after all these years. | ✅ |
| 15 | e.med.adult.raiders | G | 은 덩이를 땅에 묻었어요. 도적은 오지 않았는데… | You buried your silver ingots. …forgot half the places you had dug. | ✅ |
| 16 | e.ind.middle.doctor | C | 의사에게 갈까 / 읍내 의사는 비싸기로 유명해요. | See the doctor? / The doctor in town is famous for being expensive. | ✅ |
| 17 | e.mod.adult.abroad | E | 모아 둔 돈을 달러로 세어 보니 외국에 가 볼 수 있을 것 같아요. | Counting up your savings in dollars, you find you could finally go abroad. | ✅ |
| 18 | u.teen.love | E | 슈퍼마켓에서 자꾸 눈길이 가는 사람이 있어요. | There is someone at the supermarket you can’t stop looking at. | ✅ |
| 19 | t.talent.trade(결과) | E | 슈퍼마켓에서 당신이 흥정한 날은 늘 이쪽이 조금 더 챙겨 왔어요. | On the days you did the bargaining at the supermarket… | ⚠️ 슈퍼마켓 흥정 |
| 20 | u.middle.teach(결과) | D | 그 젊은이는 물물교환 모임 건너편 집에서 배웠대요. | …learned it from someone across the trading meet. | ⚠️ 모임 건너편 집은 말이 안 됨 |
| 21 | u.teen.leave | E | 여기서 사는 게 갑갑해요. 밭 너머에는 다른 삶이 있을 것만 같아요. | Somewhere beyond the fields, surely, is a different one. | ⚠️ 회사원 집안의 밭 |
| 22 | l.u.child.lost | E | 밭에서 놀다가 길을 잃었어요. | You got lost playing out in the fields. | ⚠️ 위와 같음 |
| 23 | l.u.old.dawn | E | 동틀 녘 밭은 혼자 차지였어요. | At dawn you had the fields to yourself. | ⚠️ 위와 같음 |
| 24 | l.u.child.nickname | E | 소에서 따온 별명이 생겼어요. | You got a nickname that had to do with the cattle. | ⚠️ 어느 맥락에서도 어색, 현대에서는 엉뚱 |
| 25 | l.u.child.nickname | D | 캥거루에서 따온 별명이 생겼어요. | …had to do with the kangaroos. | ✅ |
| 26 | l.u.teen.taller | D | 한 해 사이에 키가 훌쩍 컸어요. 가죽 옷이 다 짧아졌어요. | Every stitch of hide you owned got short. | ⚠️ 「stitch of hide」 |
| 27 | l.u.teen.taller | E | …데님 옷이 다 짧아졌어요. | Every stitch of denim you owned got short. | ✅ |
| 28 | l.u.child.feast | A | 디왈리 밤에는 늦게까지 놀아도 아무도 뭐라 하지 않았어요. | On the night of Diwali you stayed up late… | ✅ |
| 29 | l.u.child.feast | D | 모임 잔치 밤에는… | On the night of **gathering feast** you stayed up late… | ❌ 관사 없음 |
| 30 | l.u.child.feast | J | 독립기념일 밤에는… | On the night of the Fourth of July… | ✅ (이 템플릿에서는 문제없음, 5.2 참고) |
| 31 | l.u.middle.busy | D | 정신을 차려 보니 또 모임 잔치가 돌아와 있었어요. | …**gathering feast** had come round again. | ❌ 관사 없음 |
| 32 | l.u.middle.busy | C | …또 성탄절이 돌아와 있었어요. | …Christmas had come round again. | ✅ |
| 33 | l.u.adult.dance | B | 한가위에 춤추다 발을 여러 번 밟혔어요. | Dancing at Hangawi, you got your feet trodden on… | ✅ |
| 34 | l.u.teen.backtalk | D | 그날 저녁 구운 고기는 아주 조용히 먹었어요. | …everyone ate the roast meat in total silence. | ✅ (ko 「저녁 구운 고기」는 살짝 붙어 읽힘) |
| 35 | l.u.baby.tooth | A | 처음 깨문 것은 밥이 아니라 어머니 손가락이었어요. | The first thing it bit was not the rice but your mother’s finger. | ✅ |
| 36 | l.u.baby.step | C | 그리고 바로 벽돌 연립주택 바닥에 주저앉았어요. | …sat down on the floor of the terraced house. | ✅ (ko 낱말이 길다) |
| 37 | u.child.fight | E | 힘센 동네 아이가 교회 뒤에서 당신 것을 빼앗아 갔어요. | Behind the church, a bigger kid from down the way took something of yours. | ✅ |
| 38 | t.fear.fire | F | 바람 부는 밤, 이웃 바위 그늘에 불이 붙었어요. | …the neighbors’ **rock shelter** catches fire. | ⚠️ 바위 그늘이 불탄다 |
| 39 | u.old.visit | K | 선돌에 다녀온 사람이 소식을 전해요. | Someone back from the standing stones brings news… | ✅ |
| 40 | t.dream.music | A | 디왈리에 노래할 사람을 찾고 있어요. | They are looking for someone to sing at Diwali. | ✅ |

---

## 4. Issues

### Critical
없음. `{ }`가 새는 곳, 효과·id·구조 변경, 모욕적인 문장은 찾지 못했다.

### Important

**I1. 영어 `feast`가 일반 명사일 때 관사가 빠진다 (`context_data.js` 낱말 + `tokens.js`)**
- 위치: 템플릿은 `cards_life.js:97,150,185,229`, `cards_trace.js:226`, `lines.js:82,83,93,98,107,123,131,138`(총 13곳). 원인은 `context_data.js:142,170,251,475,546,606,663,763,772,867,1015,1302,1332,1531,1553 …`의 영어 값.
- 무엇이 틀렸나: 39개 영어 값 가운데 소문자 일반 명사형이 다수다(hunt feast, harvest feast, harvest festival, gathering feast, pig feast, flood festival, festival of the gods, summer gathering, saint's day, rice-planting festival …). 템플릿은 일부러 `the`를 안 붙였으므로 「Around hunt feast」, 「just before flood festival」, 「louder than festival of the gods」, 「On the night of gathering feast」, 「hunt feast had come round again」이 나온다.
- 얼마나 자주: 2만 시드(출생 30년 뒤 맥락)로 재면 **명백히 깨진 형태가 약 23.5%**(hunt feast 13.1% · harvest feast 4.8% · festival of the gods 2.9% · flood festival 1.3% · 나머지 1.4%). 「harvest festival」은 22.5%인데 관사 없이도 아주 어색하진 않아 경계선이다. 수렵 무리는 거의 모두가 「hunt feast」(오스트레일리아는 「gathering feast」)를 본다.
- 보고서의 원인 진단(고유 이름과 일반 명사 혼재)은 맞다. 다만 보고서가 바라는 「the Fourth of July의 the 빼기」는 필요 없다. 이 템플릿들에서는 문제없고(표 30행), 오히려 아래 5.1의 규칙으로 두면 그대로 둘 수 있다.
- 숨은 충돌: **`i18n.js:216`의 `calmFeast`**는 `/^[A-Z]/`로 고유 이름을 가리고 아니면 `'the ' + w`를 붙인다. 그래서 「waiting for **the the** Fourth of July」(소문자 t로 시작)와 「waiting for **New Year festival**」(대문자 N이라 고유 이름 취급, 관사 없음)이 나온다. 같은 낱말 표를 두 곳이 서로 다른 규칙으로 읽고 있다(Task 4 영역이지만 같은 원인이라 함께 고쳐야 한다).
- 고치는 법: 아래 5.1.

**I2. 농사 안 짓는 산업·현대 집안에 `crop`·`land`·`beast`가 들어간다 (카드 6장 + 줄 3개)**
- 위치와 보기(E = 2000 north_america office, C = 1880 britain factory):
  - `cards_life.js:76-83` u.child.chores 「Carry the **corn**」/「Carry the **wheat**」
  - `cards_life.js:168-175` u.adult.neighbor 「their **corn** ran short」
  - `cards_life.js:178-186` u.adult.good_year 「You have **corn** to spare」
  - `cards_trace.js:50-53` t.fear.hunger 「more **corn** than you need」
  - `cards_life.js:117-119` u.teen.leave, `cards_life.js:265-267` u.old.memory 「beyond/over the **fields**」
  - `lines.js:76` l.u.child.nickname 「the **cattle**」, `lines.js:79` l.u.child.lost 「playing out in the **fields**」, `lines.js:132` l.u.old.dawn 「the **fields** to yourself」
- 왜 문제인가: `contextOf`의 `words`는 집안과 무관하게 땅·해만 본다(`context.js:205`). 그래서 회사원·공장 집안도 그 땅의 밭 작물을 쓴다. 이 글들은 원래 「먹을 것」·「저 너머」·「동네 아이」처럼 집안에 중립이었다. 말 바꿈 때문에 오히려 지역성 대신 엉뚱함이 생겼다.
- 얼마나 자주: 산업·현대 묶음에서 농사·뱃사람 아닌 집안은 20,000 출생의 약 **8.7%**(공장·회사·가게·전문직·장사만 7.2%). 지금의 독자와 가장 가까운 시대다.
- 고치는 법: 아래 5.4(두 가지 안).

### Minor

1. **`t.fear.hunger` 수 일치** (`cards_trace.js:52`). 「This year there **is** more {crop} than you need」. `crop`이 복수형 값(acorns·hazelnuts·wild seeds·wild yams·wild tubers·potatoes·yams·sweet potatoes)이면 「there is more acorns」가 된다(전체 맥락의 약 13.8%가 복수 작물). `tokens.js:9`는 crop을 물질 명사라고 적어 두었지만 표가 어긴다. 고치기: 「You have more {crop} than you need.」로 바꾸면 단수·복수 모두 맞다.
2. **`u.child.chores` ko 짝 잃음** (`cards_life.js:78`). 「쌀 나르고, 저거 줍고」는 「이거」가 빠져 「저거」만 남는다. 「쌀 나르고, 이것저것 줍고」로.
3. **`u.middle.teach` 결과 「{market} 건너편 집」** (`cards_life.js:216`). 모임·시장터 낱말(trading meet, trading gathering, barter fair, haat, supermarket)에서 「건너편 집」이 말이 안 된다. 수렵 무리는 거의 모두 「물물교환 모임 건너편 집」을 본다. 원문(「다른 데서 배웠대요」)으로 되돌리거나 「{market}에서 만난 다른 사람에게 배웠대요」로.
4. **`market`이 현대에서 「슈퍼마켓」인 것과 흥정·공연 장면** (`cards_trace.js:136`, `:149`). 「슈퍼마켓에서 흥정」, 「슈퍼마켓을 지나던 사람들이 걸음을 멈춰요」. 흥정 문장은 `{market}` 없이도 성립한다(「거래를 맡은 날은…」).
5. **`t.fear.fire`의 바위 그늘·돌집** (`cards_trace.js:15-19`). 「이웃 {home}에 불이 붙었어요」가 바위 그늘·시멘트 집에서는 어색하다. 파일의 주석은 「지붕이 있다」고 전제한다. 「이웃 {home}에서 불길이 치솟았어요 / flames shoot up from the neighbors’ {home}」로 하면 어느 거처에서도 맞다.
6. **`l.u.teen.taller` 영어** (`lines.js:87`). 「Every stitch of **hide**/**felt**/**deerskin**」. 「Every garment of {cloth} you owned got short.」가 안전하다.
7. **4.4 줄 비율을 덱 기준으로만 보고함.** 보인 줄 기준은 68.9%(70% 미달). 남은 공통 줄 가운데 가장 많이 보이는 것은 `l.u.adult.dream` 730 · `l.u.adult.stream` 624 · `l.u.adult.waist` 620 · `l.u.adult.tool` 607 · `l.u.baby.word` 499 …(2,000시드). 이 위 4개만 말 바꿈하면 약 +8점이다. Task 7이 닫아 줄 가능성이 높지만 「목표 달성」으로 적지는 말 것.
8. **`l.u.child.errand` 「뭘 사러」** (`lines.js:78`). 물물교환 모임에는 「사러」가 어긋난다. 「뭘 하러」/「what for」(영어는 이미 중립).
9. **시험 중복·구멍.**
   - `content.test.mjs`·`lines.test.mjs`·`tokens.test.mjs`(`hasTokens`)에 같은 자리 정규식이 복사돼 있다. `tokens.js`에 `leftoverBraces(text)` 같은 도우미를 두고 셋이 쓰면 규칙이 한 곳에 모인다.
   - 한국어 맨 조사 점검이 시험에 없다(내가 정규식으로 확인해 지금은 0개). `/\{[A-Za-z]+\}(?:은|는|이|가|을|를|과|와|으로|로)(?![가-힣])/`를 ko 글에 검사하면 영구 보호된다.
   - 60% 규칙의 줄 쪽은 40/66 = 60.6%로 한 줄 차이다(의도적이면 괜찮고, 시험 메시지에 「Task 7에서 올릴 것」이라고 적어 두기).
10. **`l.u.adult.worksong`의 `maxYear: 1949`는 현대 농사·유목 집안까지 뺀다.** 합리적인 단순화지만 의도된 선택임을 주석으로 남기면 좋다.
11. **교차 작업 메모(Task 2/4, 이 작업의 잘못 아님).** 집안이 `band`인 생이 `FARM_FROM`을 넘겨 살면 `contextOf`가 해만 보고 낱말을 정착 사회 것으로 바꾼다(`context.js:89`). 예: 호주 1810 band는 `coin=shillings, feast=Christmas, holy=church, healer=doctor, home=tin-roofed house`. 카드는 계속 수렵 카드(`life.js:89`)라 「지붕 양철집 앞에서 별을 세다」가 된다. 해당 생은 드물지만(호주 1788, 라플라타 1580, 일본 −900 근처 출생), `preFarm`에 `household === 'band'`를 포함하는 것을 Task 7 이전에 정하자.

---

## 5. 낱말 열쇠 권고 (`context_data.js` · `tokens.js`)

### 5.1 `feast` — 관사는 한 곳에서 정한다
규칙을 `i18n.js:216`이 이미 쓰는 것(대문자 시작 = 고유 이름, 소문자 = 일반 명사 + the)으로 통일하고, 도우미를 `tokens.js`에 둔다.

```js
// tokens.js: 영어 feast 는 대문자로 시작하면 이름(Christmas, New Year Festival), 이미 the 로 시작하면 그대로, 아니면 the 를 붙인다
export const feastEn = (w) => (/^(the |[A-Z])/.test(w) ? w : `the ${w}`);
// fillTokens 안, word 를 만들 때: const base = lang === 'en' && k === 'feast' ? feastEn(w) : w;  (그다음 {Feast} 대문자 처리)
// i18n.js:216 :  calmFeast: (w) => `waiting for ${feastEn(w)}`
```

데이터는 대문자 N 때문에 이름 취급되는 일반 명사 두 곳만 고친다.
- `New Year festival` → `New Year Festival`(`context_data.js:403,460,1508`)
- `midsummer Christmas` → `Midsummer Christmas`(`:1531`)
- `the Fourth of July`는 그대로 둔다(이미 the로 시작).

그러면 「Around the hunt feast」, 「louder than the festival of the gods」, 「the hunt feast had come round again」, 「Around Diwali」, 「waiting for the Fourth of July」가 모두 맞다. `{Feast}`(문장 첫머리)는 「The hunt feast…」가 된다.
시험: (a) `WORD_KEYS` 열쇠마다 모든 맥락의 `feast.en`에서 `feastEn(w)`가 `the the`를 안 만든다, (b) 카드·줄 소스에 `the {feast` 가 없다, (c) `calmFeast`와 `fillTokens`가 같은 결과를 낸다.
(대안: 모든 일반 명사형을 이름으로 대문자화(Hunt Feast …). 쉽지만 「waiting for Hunt Feast」처럼 문장이 뻣뻣해진다.)

### 5.2 `ruler` — 지금은 안 쓰지만 쓰기 전에 고친다
- `context_data.js:935,961`의 `the Company`는 `East India Company`로(템플릿이 「the {ruler}」를 붙인다). 규칙을 「영어 통치자는 관사 없는 단수 칭호, 템플릿이 the를 붙인다」로 정한다.
- 복수·무리 이름은 단수 집합 명사로: `elders`(`:762`) → `council of elders`, `temple elders`(`:454`) → `temple council`, `city elders`(`:977`) → `city council`, `Free State authorities`(`:1257`) → `Free State administration`, `governor or emperor`(`east_africa` 1900) → `colonial governor`. 이래야 「{Ruler} demands…」에서 동사 일치와 「{Ruler}’s men」(`tokens.test.mjs:59`)이 깨지지 않는다.
- `context.test.mjs`에 `/^the /i` 금지와 복수 어미 허용 목록 시험을 둔다. `tokens.js` 머리 주석(「영어 단수」)도 이 규칙으로 고친다.

### 5.3 `school` — 고대 값 하나만
- 엮은 문제는 `elders' tales`(약 14곳: `:307,387,458,547,607,664,715,772,1333,1369,1400,1497,1560,1567`)이다. 장소가 아니라 이야기라서 「to the {school}」가 안 된다. `elders' circle`로 바꾼다(ko 「어른들의 이야기 자리」는 이미 장소라 그대로).
- `모닥불 가`(`:143`)는 끝 글자가 조사 `가`와 같아 `{school:이}`가 「모닥불 가가」가 된다. `모닥불 곁`으로.
- 규약을 머리 주석에 한 줄 적는다: 「school.en은 배우는 자리, `at/to/in the`와 쓴다」. 지금 공통 장면에 학교 장면이 없으므로 서둘러 템플릿에 쓸 필요는 없다.

### 5.4 농사 안 짓는 집안 (I2의 고치는 법)
- **안 A(권장, 한 곳에서 해결):** `contextOf`가 이미 `household`를 받는다. `industrial`·`modern` 묶음이고 집안이 `factory`·`office`·`shop`·`pro`면 `words.crop = words.staple`, `words.land = {ko:'동네', en:'neighborhood'}`로 덮는다(「동네 너머」, 「동틀 녘 동네는 혼자 차지」, 「the neighborhood to yourself」 모두 자연스럽다). `beast`를 쓰는 `l.u.child.nickname`은 되돌린다(어느 맥락에서도 어색).
- **안 B(Task 6 울타리 안, 글만):** 같은 아홉 군데에서 `{crop}` → `{staple}`, `{land}` → 중립 표현(원문으로 복귀)으로 바꾼다. 영어는 「There is more {staple}」 대신 「You have more {staple} than you need」. 지역색은 줄지만 이질감은 사라지고, Minor 1의 수 일치도 함께 닫힌다.

### 5.5 `money` — 새 열쇠는 필요 없다
- 지금 「돈」 자리가 필요한 공통 글이 실제로 없다. 남은 「돈」은 현대 한정 카드(`e.mod.*`)에 있어 평문 「돈」이면 된다.
- 화폐 이름을 맨 명사로 못 쓰는 문제는 이미 `{coin:으로}`로 풀렸다(표 11~17행).
- 앞으로 Task 7 글에서 일반 「돈」이 정말 필요하면, 40칸 표를 고치지 말고 `tokens.js`에 내장 기본값으로 둔다: `money: {ko:'돈', en:'money'}`. 수렵 무리 칸에서만 `재물 / valuables` 덮어쓰기. 지금 넣으면 안 쓰는 열쇠가 하나 늘 뿐이다.

---

## 6. Assessment

- **명세**: 브리프 3단계와 울타리는 충족했다. 구조 불변·시험 실질성·공통 카드 0.0%는 내가 직접 재현했다. 4.4 줄 비율은 덱 기준 83%이고 보인 줄 기준 68.9%다.
- **글 품질**: 한국어는 조사 처리와 어투가 깔끔하고(맨 조사 0개, 길이 초과 0개), 표 11·12·17행처럼 땅마다 다르게 읽히는 장면이 실제로 생긴다. 영어는 관사 규칙을 지킨 덕에 대부분 자연스럽지만, **I1(feast 관사)** 때문에 약 4분의 1의 생(수렵 무리 포함)이 깨진 영어를 본다. **I2(비농사 집안의 밭 낱말)** 는 가장 최근 시대의 독자에게 엉뚱한 문장을 만든다.
- **판정**: ⚠️ **작은 수정 라운드 후 승인.** 수정은 모두 데이터·도우미 몇 줄(5.1~5.4)이며 구조·효과를 건드리지 않는다. 이 둘은 Task 6의 글 자체보다 낱말 표와 집안 축의 문제라서, 수정 담당(낱말 표·`tokens.js`)을 정한 뒤 Task 7 전에 닫는 것을 권한다.
