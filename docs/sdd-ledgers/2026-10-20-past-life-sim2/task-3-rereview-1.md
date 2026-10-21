# 작업 3 재검토 1: 수정 1차 (snap-3-head → snap-3-fix1, 작업 3 파일만)

- 대상: `review-3-head..3-fix1.task3only.diff`, 보고서 「수정 1차」, 지금 트리 `docs/past-life`.
- 지금 트리의 작업 3 파일(status·holdings·life·focus·cards·traces·households·birth, attrs·holdings 시험)은 `snap-3-fix1`과 바이트까지 같다(`cmp`). 줄 끝은 전부 LF다(보고서 말이 맞다).
- 시험:
  - 지정 셋(`attrs`·`holdings`·`life`) **41/41 통과**.
  - 생명표 맞춤·관련 시험 열하나(`lifetable`·`cards`·`content`·`memory`·`events`·`birth`·`i18n`·`soul`·`traces`·`lines`·`context`) **102/102 통과**. 보고서의 194/194와 어긋남 없음.
  - 이 저장소에 따로 「calibration」「journey」라는 이름의 시험 파일은 없다. 생명표 맞춤은 `lifetable.test.mjs`와 `attrs.test.mjs`의 「생명표 맞춤은 그대로」가 맡는다.

## Finding Verdicts

### I1 손재주 포화 → ADDRESSED
- **식이 한 번, 세 능력치 모두에.** `focus.js:43-44` `attrGain(base, x) = base × (100 − clampAttr(x)) / 60`. 쓰는 곳은 `life.js:144` 한 줄(`for (const [k, v] of Object.entries(FOCUS_ATTR[f]))`)뿐이고, 지식은 기본량에 `× w.school`을 먼저 곱한 뒤 같은 식을 쓴다. `FOCUS_ATTR`·`attrGain`을 다른 곳(`ui.js`·`main.js`)에서 쓰는 곳은 없다(grep). `choose`의 효과 키는 일부러 평평하게 더한다(카드가 정한 값).
- **측정이 컨트롤러 기준 안이다(내가 다시 쟀다).** 같은 시드 3,000개, 실제 덱, 자동 결정, 그 나이까지 산 생. 수정 전은 같은 트리에 작업 3 파일 5개만 head로 덮은 사본이다.

  | | 손재주 40살 p10/p50/p90 · ≥95 | 손재주 60살 p10/p50/p90 · ≥95 |
  |---|---|---|
  | 수정 전 | 72.5/89.0/100 · 35.2% | 98.5/100/100 · **97.7%** |
  | **수정 후** | 66.6/**73.8**/80.9 · 0% | 78.6/83.2/87.9 · **0%** |

  기준(40살 중앙값 55~85, 60살 ≥95 15% 미만)을 둘 다 만족한다. 시작값 차이도 남는다(60살 p10~p90 = 79~88).
- **친화력·지식도 줄었는지**(초점을 하나로 고정한 1,200생, 40살/60살 ≥95): 「늘 가족·이웃」 친화력 수정 전 64.7%/100% → **0%/0%**(중앙값 79/87), 「늘 배우기」 지식 6.3%/9.5% → **0%/0%**(p90 67/77). 보고서 표와 같은 쪽이다. 자동 결정만 보면 친화력·지식은 원래 포화하지 않고(수정 전후 같은 값 50·15), 그래서 분포 시험은 손재주만 본다.
- **새 시험이 진짜 범위를 단언한다.** `attrs.test.mjs:322` 「줄어드는 성장」은 1,500생을 돌려 40살 중앙값 55~85, 60살 ≥95 15% 미만, 시작이 낮았던 생(≤30)과 높았던 생(≥50)이 60살에도 3 넘게 갈리는 것을 본다. 표본 크기도 단언한다(`at[40]>300`, `at[60]>100`). 이빨 확인(임시 사본에 변이를 넣어 돌림):

  | 변이 | 결과 |
  |---|---|
  | `attrGain`을 평평하게(`return base`) | 「줄어드는 성장」과 「배우기 10해·일·가족」 둘 다 실패 |
  | 친화력만 평평하게 | 「배우기 10해·일·가족」 실패(분포 시험은 못 잡지만 점화식 시험이 잡는다) |

  `attrs.test.mjs:70` 「배우기 10해」는 `attrGain` 식 자체를 따로 못 박고(`attrGain(1.5,40)=1.5`·`(1.5,100)=0`·`(1.5,10)=2.25`), 한 해 오름의 비가 `school`의 비와 같음(1e−9)과 `2.5×s×70/60`을 독립 값으로 확인한다. 점화식 시험(`x += attrGain(...)`)은 구현과 같은 함수를 쓰지만 위의 못 박은 값이 그 순환을 막아 준다.

### ⚠️ ① 설계 2.2의 두 문장 → ADDRESSED
- 손재주 → 장인 확률: `life.js:247-251` `chanceOf`가 `CRAFT_SKILLS.includes(c.skill)`일 때만 `attrShift(a.skill)`(±0.2)을 더하고 0.05~0.95로 자른다(`focus.js:48-51`). 시험 `attrs.test.mjs:109` 블록이 craft ±0.2, 다른 재주(`sea`·`farm`·`letters`·없음) 0 더함, 합쳐서 0.95 자름을 본다. 설계 문서 2.2(`…-design.md:47-48`)도 이 말로 고쳐져 있어 구현과 맞다. 지금 덱에는 craft가 걸린 확률 선택이 0개라(208장 훑음) 닿는 카드는 작업 7부터다.
- 지식 60 → 글 읽음: `focus.js:46` `KNOW_READ = 60`, `life.js:240-243` `readCheck`. 해 마무리(`life.js:145`)와 `choose`(능력치 효과 뒤)에서 부르고, 한 번 서면 내리지 않는다. 시험 `attrs.test.mjs:344`가 해마다 닿는 경우·카드 효과로 닿는 경우·「잊어도 읽는 법은 남는다」를 본다.

### ⚠️ ② 선택지 단위 `when` (M8) → ADDRESSED (엔진 쪽)
- `cards.js:33-59` `condOk`, `cards.js:30` `choiceOpen`. 카드 `when`의 열세 줄은 한 글자도 안 바뀌고 `eligible`의 순서(사건 카드 → 단계 → 본 카드 → `when` → 선택지)만 이어 붙였다. 선택지 `when`이 없으면 늘 열림.
- 화면에서 잠긴 선택지를 그리는 일은 작업 4다(`ui.js:415`는 아직 모든 선택지를 그린다). 보고서 걱정 c가 같은 말을 한다.

### ⚠️ ③ `wealthToUnits` 모양 (M7·M4) → ADDRESSED (코드), 문서는 컨트롤러
- 모양 `{ n, unit, name }`은 그대로 두고 `wealthText(delta, ctx, lang, household?)`(`holdings.js:113`)를 더했다. 「은화 +5닢」·'+5 silver pennies'·「+150,000원」·'+1 bolt of cotton cloth'·0이면 ''. `wealthToUnits`도 세 번째 인자 `household`를 받아 `holdingsOf`와 같은 값표를 쓴다(`holdings.js:76`, 시험으로 무리 돈 이름이 `holdingsOf`와 같음을 확인).
- 작업 4 브리프·계획에 `name`·`wealthText`를 적는 일은 컨트롤러 몫이다(보고서도 같은 말).

### Minor
| 항목 | 판정 | 근거 |
|---|---|---|
| M1 초점 순환에 `body`·`rest` | ADDRESSED | `attrs.test.mjs:218` 순환이 6칸. 내가 「몸 돌보기의 건강 증가 × 친화력」 변이를 임시 사본에 넣어 보니 이 시험이 **잡는다**(전에는 통과했다). 신분 바꾸기 줄(무효)도 뺐다 |
| M2 `refreshStatus` 단언 | ADDRESSED | 진짜 생 `s`에서 `s.status = {id:'nobody',…}`로 바꾸고 `s.ctx` 함수가 붙은 채 호출, 한 해 더 지나도 그대로. 「없는 자리는 그대로」 가지를 실제로 탄다. 1866년 해방(하인·풀림)도 따로 단언 |
| M3 묶음에 없는 집안 | ADDRESSED | `holdings.test.mjs` `cases({borrowed:true, years:[…경계 앞뒤…]})`, 재산 4점 간격, 2만 경우 넘게 |
| M4 `wealthToUnits`가 무리 값표를 못 씀 | ADDRESSED (부분) | 인자로 받게 했다. 근본 고침(`context.js`에서 무리 값표를 정함)은 울타리 밖이고 보고서 걱정 d가 밝혔다. 지금 부르는 곳이 없어서 인자를 안 넘기는 실수는 작업 4의 일이다 |
| M5 `ctxOf` 주석 | ADDRESSED | `life.js:84-85`에 「평생 무리 (일부러)」. `preFarm`/`beforeFarming` 두 정의는 `context.js` 쪽이라 울타리 밖 |
| M6 해·땅 뽑기 독립 단언 | ADDRESSED | `holdings.test.mjs` 3,000개에서 `[region, area, sex, order]`가 각자 `sub(seed,…)`에서 바로 뽑은 값과 같음 |
| M9 영어 글꼴 | ADDRESSED | `BARE`에 `coins`·`grazing grounds`, `garb` 가지 추가(`holdings.js:91,103`). 273가지 꼴을 수정 전과 견줘 보니 바뀐 것은 「2 coins of dirhams → 2 dirhams」·「1 grazing ground of pastures → 1 pasture」·「hemp cloth clothes → hemp clothes」 유형뿐이고 새로 어색해진 꼴은 없다. 「3 plots of paddies」는 일부러 둠 |
| M10 짧은 것들 | ADDRESSED | 0~100 시험에 1347 농노 긴 생 셋 추가(`attrs.test.mjs:209`), 1100 갠지스 farm 「농민 집(자티)」 단언, `shiftStatus` 기록 `d`가 실제 움직인 계단 수(`status.js:36-44`, 노비 +5 → 양반 `d:2` 시험), `choose`가 `life.attrs`·`life.status` 없는 손으로 만든 생에서 안 던짐. CRLF는 처음부터 문제 없음(LF 확인) |

## 특히 점검한 것

### 1. 선택지 `when`의 영향
- **모두 열려 있으면 자동 결정이 예전과 같다 → 확인.** `autoChoice`(`life.js:78-81`)는 열린 선택지의 목록에서 `pool[int(pool.length)]`를 고르는데 다 열려 있으면 `pool.length === choices.length`, 같은 `sub(seed, age, 'auto', id)`라 같은 수다. 실측: 덱 208장 × 400생 × 나이 4개 = **332,800쌍에서 예전 식과 다른 경우 0**, 잠긴 선택지가 있는 경우도 0(덱에 선택지 `when`이 하나도 없음). 같은 시드 3,000생을 처음부터 끝까지 돌린 비교에서도 수정 전과 수정 후의 죽는 나이·사인·카드 기록 길이·건강 기록이 **0/3,000 다름**.
  - 시험의 약점(Minor): `attrs.test.mjs:378`은 `[0,1,2].includes(autoChoice(...))`만 본다. 「예전 수 그대로」라는 주석에 비해 단언이 약하다. `=== sub(seed, age, 'auto', 'free').int(3)`로 바꾸면 완결된다.
- **`choose`가 잠긴 선택지에 `null`을 돌려주는 것이 부르는 쪽을 깨는가 → 아니다.**
  - 부르는 곳은 `main.js:114` 하나뿐이다(`choose(life, i); refresh(); continue;`). 반환값을 안 쓴다. `ui.js`에는 `choose` 호출이 없고 `ui.decision`은 번호(`Number(v)`)만 돌려준다. 시험 파일의 호출도 모두 통과한다.
  - 잠긴 선택지를 눌렀을 때: `life.pending`이 남으므로 다음 `advance`가 같은 카드를 다시 돌려주고(`life.js:190`) 갈림길이 다시 뜬다. 무한 반복은 사람이 잠긴 단추를 계속 누를 때뿐이다. 자동·robot은 `autoChoice`가 늘 열린 선택지를 줘서 닿지 않는다. 지금 덱에는 잠긴 선택지가 없어 실제로 일어나지 않고, 작업 4가 잠금 표시를 그리면 사라질 깜박임이다.
- **열린 선택지가 하나도 없는 카드는 빠진다 → 확인.** `cards.js:28` `card.choices.some(choiceOpen)`, `pickCard`가 `eligible`로 거른다. 시험 `attrs.test.mjs:386-387`(경계 `minKnow 41`/`40`)이 본다. 작은 일 줄은 `choices`가 없어 그대로 통과한다. 사건 카드는 `eligible`에서 원래 빠지고 `openChoices`가 다 잠겼으면 모두 열린 것으로 보니(`life.js:75`) 결정이 막히지 않는다.

### 2. literate 깃발
- 이미 있는 「글을 배운다」 선택 열한 곳은 `set: ['literate']`로 같은 깃발을 세운다. `unset: ['literate']`는 없다. 깃발을 읽는 곳은 `notFlags: ['literate']`인 흔적 카드 네 장(`cards_trace.js:106,116,186,196`), `lines.js:206`(`flags:['literate']`, 산업 시대 아이 줄), `i18n.js:233,244`(부고 「글을 배웠어요」) 뿐이다. 생명표·사인에는 안 쓰인다(grep).
- 새 길로 서는 경우의 효과:
  - 흔적 카드 네 장이 닫힌다. 이미 글을 아는 사람에게 「글을 배운다」를 안 묻는 쪽이라 의미는 맞다.
  - 아이 줄은 지식 60이 아이 때 닿아야 열린다. 시작 지식이 최대 48이라(20+20+재능 8) 거의 닿지 않는다.
  - 자동 결정에서는 60살에도 지식 ≥60이 0%라 literate는 카드로만 선다(40살 11.5%, 수정 전후 같음). 닿는 것은 「늘 배우기」처럼 배우기를 오래 고른 생뿐이다.
- 부작용 한 가지(Minor, 아래 N2).

### 3. 생명표 맞춤
- 새 길이 건강·위험률에 닿는가: 아니다. `endYear`의 배율 `m`은 건강에 늘 1(`life.js:140`), `readCheck`는 깃발만, `chanceOf`의 손재주 덤은 갈래 확률만(그 갈래에 건강 효과가 있어도 이미 받아들인 행운과 같은 길이고, 덱엔 craft 선택이 없음), `shiftStatus`·`wealthText`는 `stats`에 안 닿는다. `drawCause`·`yearHazard`·`healthMul`에 새 입력이 없다.
- 실측(같은 시드 3,000, 같은 트리에 작업 3 파일만 base/head/fix1로 덮은 사본 셋):

  | 비교 | 카드 없이 | 실제 덱 |
  |---|---|---|
  | base ↔ fix1 | 죽는 나이·사인·건강 기록 **0 다름** (e0 27.840 = 27.840) | 나이 8·사인 9·건강 기록 139 다름 (e0 27.741 → 27.702) |
  | head ↔ fix1 | **0 다름** | **0 다름** (e0 27.702 = 27.702) |

  덱이 있을 때 base와 다른 8생은 head와도 똑같이 다른, 첫 검토에서 이미 받아들인 카드·갈림길 경로이고 수정 1차가 더한 차이가 아니다. 시험은 이빨이 있다: 변이 「몸 돌보기 건강 × 친화력」을 넣으면 `생명표 맞춤은 그대로`가 실패한다.

## New Breakage

### Critical
없음.

### Important
없음.

### Minor
- **N1. `shiftStatus`가 끝에서 덜 움직일 때 글이 「한 계단」 그대로다.** (`status.js:46-47`) 기록의 `d`는 이제 맞지만(노비 +5 → 양반, `d:2`) 일지 글은 늘 「한 계단 올랐어요/내려앉았어요」다. 지금 ±2 이상을 쓰는 카드가 없으므로 작업 7이 쓸 때 정하면 된다.
- **N2. 지식 60으로 literate가 서면 「글을 배운다」 흔적 카드가 닫혀서, 그 꿈 흔적을 풀 길이 막힌다.** `t.dream.letters.*`·`t.talent.letters.*`는 `notFlags: ['literate']`다(`cards_trace.js:106,116,186,196`). 앞 생에서 `dream:letters`를 물려받고 이 생에서 배우기를 오래 골라 지식 60에 닿으면, 이미 읽을 줄 아는데도 그 꿈을 이루는 카드(`fulfill: 'letters'`)가 안 나온다. 지금은 카드로만 literate가 서던 것과 같은 결과이고, 자동 결정에서는 닿지 않으며(60살에도 지식 ≥60 0%), 「늘 배우기」에서만 가능하다. 작업 7이 `readCheck`에서 `letters` 꿈도 이뤄진 것으로 칠지 정하면 된다.
- **N3. 분포 시험이 손재주만 본다.** 친화력·지식은 자동 결정 생에서 원래 포화하지 않아 거기서는 시험할 것이 없고, 포화하는 「늘 가족·이웃」「늘 배우기」는 점화식 시험(`attrs.test.mjs:70`)이 식을 지키되 분포는 안 본다. 내가 고정 초점 1,200생으로 0%를 확인했고 변이(친화력만 평평)도 점화식 시험이 잡으므로 위험은 낮다.
- **N4. 「모두 열려 있으면 예전과 같은 수」 단언이 약하다.** (`attrs.test.mjs:378`, 위 §1)
- **N5. 영어 기본 글 「1 denarii」꼴.** 홑꼴이 없는 로마 은화 이름 `denarii`는 n=1에서도 그대로 나온다. 수정 전에도 같은 종류였고(「1 coin of denarii」) 작업 4가 `holdingText`를 다듬을 때 같이 보면 된다.

## Out-of-Scope (울타리 밖, 컨트롤러·다른 작업)
- 설계 2.2 표 숫자는 컨트롤러가 이미 고쳐 두었다(`…-design.md:47-48`).
- 작업 4 브리프·계획의 `wealthToUnits` 모양 `{ n, unit, name }`·`wealthText` 한 줄 (M7).
- 무리 값표를 `context.js`로 옮기는 근본 고침, `preFarm`/`beforeFarming` 중복 (작업 2 파일, M4·M5).
- `content.test.mjs`의 효과 키 제한, `ui.js` `fxText`·`i18n.effectHint`가 새 키(`luck`·`charm`·`know`·`skill`·`status`)를 모름, `build_share.py` ORDER (`context_data`·`lands`·`context`·`status`·`holdings`). 작업 7이 새 키를 쓰기 전에 고칠 것.
- 잠긴 선택지를 그리는 화면, 시대 문해 기준과 함께 literate를 그리는 일 (작업 4).

## Verdict

**APPROVED.** I1을 포함한 이전 지적 모두 ADDRESSED. 새 Critical·Important 없음. Minor N1~N5는 작업 4·7에서 다루면 된다.

| 항목 | 판정 |
|---|---|
| I1 손재주 포화 | ADDRESSED (식 한 곳·세 능력치, 3,000생 재측정으로 컨트롤러 기준 안, 시험에 이빨 있음) |
| ⚠️ ① 설계 2.2 두 문장 | ADDRESSED |
| ⚠️ ② 선택지 단위 `when` | ADDRESSED (엔진), 화면은 작업 4 |
| ⚠️ ③ `wealthToUnits` 모양 | ADDRESSED (코드), 문서는 컨트롤러 |
| Minor M1~M3, M5, M6, M9, M10 | ADDRESSED |
| Minor M4 | ADDRESSED (부분, 근본은 울타리 밖) |
| 생명표 맞춤 | 지켜짐 (head ↔ fix1 0/3,000, 카드 없이 base ↔ fix1 0/3,000) |
