# 작업 4 재검토 1차: 수정 1차 확인

- 대상: `snap-4-head` → `snap-4-fix1` (Task 4 파일만, `review-4-head..4-fix1.task4only.diff`). 줄 번호는 `snap-4-fix1` 기준이고, 살아 있는 `docs/past-life/`의 Task 4 파일 다섯 개(`ui.js`·`i18n.js`·`life.js`·`focus.js`·`index.html`)는 스냅샷과 바이트 단위로 같다.
- 판정: **I1 · I2 · I3 · I4 · 컨트롤러 덧붙임 모두 ADDRESSED. 새로 생긴 Critical·Important 없음. 통과.**
- 직접 확인한 것 (브라우저는 돌리지 않았다)
  - 지정한 집중 시험 다섯 파일(`focus`·`life`·`i18n`·`lifetable`·`attrs`): 살아 있는 트리 **62/62 통과**, `snap-4-fix1`에서도 62/62.
  - 전체 `node --test "test/*.test.mjs"`: 살아 있는 트리 **223/223 통과**. (`snap-4-fix1`에서 전체를 돌리면 kit·glb 시험이 떨어지는데, 스냅샷에 `assets/`를 담지 않아서다. 수정과 무관.)
  - `node --check`: `ui.js`·`i18n.js`·`life.js`·`focus.js`·`main.js` 통과.
  - 아래 스크래치 검증은 모두 `…/scratchpad/`의 일회용 스크립트이고 프로젝트 파일은 건드리지 않았다.

---

## Finding Verdicts

### I1 건강 줄 「앓은 일」 — **ADDRESSED**
- `i18n.js:295-307`(주석), `300-301`(`ILL_CARDS`·`HURT_CARDS`), `303-309`(`illTag`), `310-` (`ailmentLine`). 코드 줄: 표지가 있을 때만 제목 인용(`tag && (h <= -3 || (h >= 3 && tag === 'ill'))`), 표지가 없으면 `h <= -6`일 때만 제목 없는 「몸이 많이 축남」(`sickHard`), 아무 일 없고 건강 40 밑이면 풍토병(`endemicLand`). 제목은 `j.year`의 맥락으로 채운다(Minor 1도 함께 정리).
- 덱 전수 확인: 건강이 ±3 이상 움직이는 카드 96장 중 표지가 붙는 것은 ill 13장(열이 끓는 밤·앓아누운 날들·삐걱대는 몸·다친 다리·마마를 막는 법·{healer}에게 갈까·앓는 이웃·유행병 사건 카드 7장)과 hurt 14장(폭풍·첫 사냥·불·지붕·울음소리·가뭄·기근 사건 카드)이다. 「물레방아」·「텔레비전」·「장터 구경」·「힘센 아이」·「손주들」 등 나머지 69장은 표지가 없다. 두 목록의 아이디 12개는 모두 덱에 실제로 있다(오타 없음).
- 실플레이 확인: 자동 결정 200생, 6,063해에서 줄이 뜬 337해(5.6%)의 인용 제목은 **전부 병·부상·유행병·기근**이었다(앓아누운 날들 87, 삐걱대는 몸 85, 열이 끓는 밤 51, 다친 다리 16, 독감·코로나·의사에게 갈까 등). 병이 아닌 카드 제목은 **0**. 제목 없는 「몸이 많이 축남」 42해, 「도는 중」 17해, 풍토병 1해. 수정 전 첫 검토의 「병 아닌 제목 약 47%」가 사라졌다.
- 표지가 없는 카드는 틀리게 인용하지 않고 **말을 덜 할 뿐**이라 실패해도 안전하다(방향이 안전하다). 시험(`test/i18n.test.mjs`)에 「물레방아」 두 갈래·큰 내림·폭풍·다친 다리 회복·덱 전체 훑기·풍토병이 들어 있다.
- 임시 아이디 목록은 **적절한 다리**다 → 아래 Minor 1(작업 7·8이 카드에 `ill: true`를 달아야 한다).

### I2 「올해 죽을 위험」 표시 — **ADDRESSED**
- `i18n.js:116`·`211`(`windRisk(now, usual)`, `under1`), `382`(`pctText`), `390-400`(`eraWind`). 「올해 죽을 확률 약 11% (평소 1% 미만)」 / 'about 11% chance of dying this year (usually under 1%)'.
- 식: 평소 = `1 − e^(−base)`, 올해 = `1 − e^(−(base + 사건 위험률))`. `base`는 `ui.js:454`에서 그 사람의 **나이와 건강**으로 `yearHazard(shapeFor(eraOf(year).id, region), age) × healthMul(health)`다. 이는 `life.js` 죽음 굴림의 바탕 항과 같은 식이다. 「평소」에는 사건 위험률이 **들어가지 않는다**(`usual = pctText(1 − exp(−base))`).
- 숫자 검증(내가 독립 계산): 모든 땅 × 해(−5000~2026, 7년 간격) × 나이 6가지 × 건강 3가지 중 사건 위험이 있는 17,730칸에서, 띠에 뜬 11,762칸의 「약 N% (평소 M)」이 엔진의 `lifetable.deathChance`(사건 위험 넣은 것 / 뺀 것)와 **불일치 0**. `ctx.events`의 위험 합과 엔진 `activeEvents`의 합도 불일치 0. 띠가 안 뜬 5,968칸은 올해와 평소가 같게 반올림되는 경우이고, 실제 차이가 1%p를 넘는 칸은 0(최대 0.89%p)이다.
- 스크린샷 `s2_t4_england.png`의 「약 11% (평소 1% 미만)」(1348 브리튼 6살, 건강 51)를 직접 다시 계산하니 바탕 0.0093, 사건 0.102(흑사병 0.1 + 백년전쟁 0.002) → 10.5% → 「11%」로 맞다. 갓난아기는 「약 34% (평소 27%)」로 나온다.
- 방향이 바르다: 건강이 나쁠수록(바탕이 클수록) 올해 확률도 커진다. 시험으로 묶여 있다(`now(0.006) < now(0.02) < now(0.2)`).
- 하나 더 따져 봤다: 엔진은 해 **끝**의 건강(초점 효과·되돌림 뒤)으로 굴리고 띠는 해 **초** 건강으로 보인다. 400생에서 사건이 있는 520해를 견주니 차이는 평균 0.007%p, 최대 0.13%p로 화면에 안 보인다.

### I3 올해의 패 식 하나로 — **ADDRESSED**
- `focus.js:60` `focusYearEffects(life, focus, ctx = life.ctx())`. 부르는 곳은 `life.js:140`(`endYear`, 인자는 `worldOf(life)` = `life.ctx()`)과 `ui.js:465`(화면) 둘뿐이고, `ui.js`의 복사본 `focusEffects`는 지워졌다. `life.js`·`ui.js`에서 안 쓰게 된 import(`attrGain`·`skillMul`·`FOCUS_EFFECT`(ui))도 정리했고 남은 참조는 없다(grep).
- **`endYear` 결과가 같다는 확인을 내가 다시 했다.** 생 300개(패 6가지를 7년마다 돌림, 해마다 수치·능력치·곁·혼인, 죽음, 인생 기록 전체, 로그, 기술, 패별 햇수를 해시):
  - `snap-4-head` 와, `snap-4-head`에 `snap-4-fix1`의 `life.js`·`focus.js`만 덮어쓴 혼합본이 **해시 `625902167c060b64` 완전히 같다**(8,425해).
  - 수정 라운드 사이에 Task 6의 파일(`cards_life.js`·`lines.js`·`context_data.js` 등)이 함께 바뀌어 있어서, `snap-4-fix1` 전체와는 인생 기록 글이 다르다(해마다 수치·능력치만 보는 해시는 `fd003920306735a9`로 같다). 그래서 엔진 두 파일만 바꿔 넣은 혼합본으로 견주었다.
  - 보고서가 말한 해시 `7164087a…` 자체는 저장된 스크립트가 없어 다시 맞춰 볼 수 없었다(보고서 주장일 뿐). 하지만 위 독립 검증이 같은 결론을 준다.
- 새 시험 `test/focus.test.mjs`(2개, `npm test` 글롭에 잡힘).
  1. 옛 식을 시험 안에 고정해 두고 생 120 × 패 5 × 나이 6~95 × 능력치 흔들기 5천 칸 넘게 `deepEqual`.
  2. 엔진을 실제로 한 해 넘겨 「변화 ÷ 0.94 = `focusYearEffects`」(1e−9)와 능력치 전·후를 확인(생 30 × 패 5 × 나이 4).
  - **변이 시험으로 잡히는지 확인**했다. 복사본에서 ① 일의 품삯 × 손재주 배율 빼기, ② 곁의 친화력 배율 빼기, ③ 배우기의 `school` 배율 빼기, ④ 엔진이 능력치 효과를 두 번 더하기, ⑤ 엔진이 수치 효과에 1.1배: **다섯 모두 시험이 실패**했다.

### I4 영어 올해의 패 넘침 — **ADDRESSED**
- `i18n.js:267` `effectParts` → `{ key, sign, text, full }`. 영어 재산만 `text`가 돈 이름까지(`full.replace(/ of .+$/, '')`), 카드·길의 `title`·`aria-label`은 `full`(`ui.js:472` `parts.map((p) => p.full)`, 갈림길은 `fxLine` → `effectText` → `full`). 한국어는 둘이 같다.
- CSS `index.html:201`: `.pcard .fx`가 `white-space:normal; overflow-wrap:anywhere; max-width:100%; line-clamp:2`, 카드는 `min-height:112px`(`:193`). 더 구체적인 선택자라 아래쪽의 `.fx{white-space:nowrap}`(기본)를 이긴다.
- 영어 돈 글의 길이를 내가 다시 쟀다(모든 땅 × 해 41년 간격 × 집안 7 × 크기 7): 칩 글은 가장 긴 것이 19자(`+3 Straits dollars`)이고 22자 이하라서 두 줄이면 84px 카드에 들어간다. 「 of … 」가 붙은 긴 꼴은 칩에서 사라진다.
- `s2_t4_en.png`(1319 독일 땅 30살): 「+3 pfennigs · Skill +1 · Heart −1」, 「Knowledge +a little」은 두 줄, 카드 다섯 개 모두 안에 들어 있다.

### 컨트롤러 덧붙임 「평소 모습 줄을 자리 글로」 — **ADDRESSED**
- `i18n.js:120·215`의 `STR[lang].calm`이 자리 글(`{crop:을} 거두는 철`, `waiting for {feast}`…)이고, `calmLine`(`i18n.js:384`)이 `fillTokens(…, ctx, lang)`로 채운다. 이 함수에는 **관사·조사 규칙이 없다**(옛 `/^[A-Z]/` 규칙 삭제 확인, `calmHarvest` 같은 옛 이름이 남은 곳도 없음).
- 모든 땅 × 해(−20000~2026, 13년 간격) × 연속 3해 × 한·영에서 평소 모습 머리글을 훑었다: `{ }`·`undefined`·`NaN`·「the the」·빈칸 **0건**. 영어는 'waiting for the harvest feast' / 'waiting for Christmas' / 'waiting for Obon' / 'waiting for Naadam'처럼 관사가 `tokens.js` 쪽에서 맞게 붙는다. 한국어는 「성탄절을 기다리는 철」·「율을 기다리는 철」·「이드를 기다리는 철」처럼 조사가 맞다.

### 함께 한 Minor (확인만)
- M2 「지식 +조금」(`effectParts`의 `aLittle`), M6 「계단」 통일(`i18n.js` `statusStep` ↔ `status.js:44`, 한·영 모두 같은 말), M7 묶임 뜻의 숨은 글(`ui.js` `.sbh`, `.sr` 클래스는 `index.html:47`에 있음), M12 첫돌 단언 강화(`test/life.test.mjs`), M14 사인이 전쟁이면 흔한 마지막의 둘째 문장(`commonEnd(…, { cause })`): 코드와 시험이 보고서와 맞다.

---

## New Breakage

### Critical
없음.

### Important
없음.

### Minor
1. **병·부상 아이디 목록은 작업 7·8에서 카드 표지로 옮겨야 한다** — `i18n.js:300-301`. 새 병·부상 카드가 `ill: true`(없으면 `risk: 'plague'`·`skill: 'heal'`)를 안 달면 **인용되지 않을 뿐 틀린 말은 안 나온다**(실패 방향이 안전). 다만 그 사실을 작업 7·8 목록에 넣어 두자. 보고서 「남은 걱정」에 적혀 있다.
2. **덱 전체 시험의 허용 조건이 느슨하다** — `test/i18n.test.mjs`(「덱 전체」 반복문): `cd.ill || cd.event || /fever|sick|…/.test(cd.id)`. 사건 카드(`cd.event`)는 무엇이든 통과하고 아이디 정규식은 두 목록과 같은 가족이라, 시험이 구현을 되풀이하는 모양이다. 지금 덱에서는 위 실플레이 200생 확인으로 어긋남이 없다. 작업 7에서 카드가 늘면 「인용된 제목이 `illTag` 결과가 `'ill'`/`'hurt'`인 카드의 것인가」로 바꾸면 더 믿을 만하다(Nit에 가깝다).
3. **영어 풍토병 글 어색함** — `i18n.js:211` `endemicLand: 'parasitic worms country'`, 'influenza country'(병 이름 + `country`). 'malaria country'는 괜찮지만 일부는 어색하다. 건강 40 밑에서만 드물게 뜬다(200생에서 1해). 작업 8 다듬기 때 'where X is common' 꼴로(Nit).
4. **I2 시험이 식을 되풀이한다** — `test/i18n.test.mjs` `eraWind: 흑사병 해`는 같은 식으로 기댓값을 계산한다. 엔진의 `lifetable.deathChance`로 견주면 한 단계 더 믿을 만하다(위 17,730칸 대조가 이를 대신 확인했다). 해 초 건강 대 해 끝 건강 차이는 앞서 잰 대로 무시할 만하다.
5. **보고서 M5와 diff가 안 맞는다** — 보고서는 영어 「Knowledge」 잘림을 「능력치 칸을 이름 줄 / 아이콘+숫자 / 글 알약으로 바꿨다」고 썼지만 이번 diff의 `index.html`에는 `.at` 변경이 없다(head에 이미 같은 3줄 격자, `.attrs`는 4등분 `minmax(0,1fr)`). `s2_t4_en.png`에서 'Knowledge'가 안 잘리는 것은 보이지만(약 55px 글이 약 61px 칸에 겨우 들어감) 칸이 더 좁아지면 줄임표가 다시 걸릴 수 있다. 결과는 통과이고 서술만 정정하면 된다.
6. **올해의 패 다시 그리기 키는 칩 글만 본다** — `ui.js:466` `fkey`는 `x.text`만 쓰므로, 칩 글은 같고 `full`(툴팁·읽어 주기)만 바뀌는 드문 경우(영어 같은 돈 이름 뒤 「of …」가 해마다 바뀔 때) 툴팁이 한 해 늦게 갱신될 수 있다. 시각 영향 없음(Nit).
7. **해시 확인 스크립트가 보관되지 않았다** — 보고서의 `7164087a…`는 보고서 안 주장뿐이다. 나는 같은 결론을 독립 스크립트로 확인했지만, 다음에는 스크립트를 `tools/`나 SDD 폴더에 남기자(Nit).

---

## Out-of-Scope
- `review-4-head..4-fix1.task4only.diff`의 `test/content.test.mjs`(`checkTokens` → `leftoverBraces`)와 스냅샷 사이에 바뀐 `tokens.js`·`context.js`·`context_data.js`·`cards_life.js`·`cards_trace.js`·`lines.js`·`test/tokens.test.mjs`·`test/context.test.mjs`·`test/lines.test.mjs`는 **작업 6의 병렬 수정**이다. 이번 판정에서 제외했다(첫 검토와 같은 처리).
- 수정 1차에서 일부러 하지 않은 Minor(M3 운에 맡김 「안되면」 칩, M4 살림 환산 설명, M8 띠 위 Space, M9 901~1100px 띠 폭, M10 폰, M11 옛 설계 문서 정리, M13 `renderText` 인자 계산)는 보고서가 이유를 적었고 이번 판정 대상이 아니다.
- 영어 평소 모습 줄 'off to the school in the morning'(→ 'off to school') 같은 문장 결은 `tokens.js`·작업 6 몫이다.

---

## Verdict

- **I1: ADDRESSED**
- **I2: ADDRESSED**
- **I3: ADDRESSED**
- **I4: ADDRESSED**
- **컨트롤러 덧붙임(`calm` 자리 글): ADDRESSED**
- 새로 생긴 Critical 0, Important 0, Minor 7(모두 비차단).
- **결론: 수정 1차 통과.** 작업 4는 이대로 닫아도 된다. 작업 7·8로 넘길 것: 카드에 `ill: true` 표지 + 임시 아이디 목록 제거(Minor 1).
