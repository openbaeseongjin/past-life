# SDD ledger — plan: docs/superpowers/plans/2026-10-20-past-life-sim2.md

Setup: plan written 2026-10-20 after user chose 「시뮬 2.0 먼저, 3D 세트는 줄이기」; waits for real-phase1 Task 4 (same files main.js/ui.js) to finish before Task 1
Task 2: implementer dispatched out of order (opus; snap 2-base) — new files only (context.js, context_data.js, tokens.js, tests, CONTENT-SOURCES.md); lands.js import deferred; Task 1 (campfire) waits for real-phase1 Task 4 fix (main/ui/i18n conflict)
Task 1: brief extracted; implementer dispatching (opus; snap 1-base) — runs alongside Task 2 (new files) and phase2 South Asia
Task 1: implementer dispatched (opus; port 8782; fences: memory.js, life.js, traces.js, ui.js, i18n.js, main.js, strand.js, index.html)
Task 2: implementer DONE_WITH_CONCERNS (135 tests; 32 area overrides; ZONE_OF vs lands.js 12 known diffs pinned; sources from memory — unverified; snap 2-head)
Task 2: reviewer dispatched (sonnet; filtered diff; +25-claim WebSearch fact-check)
Task 2: review — spec ✅, quality needs fixes: I1 varna/jati + temples before Vedic; I2 ancient-group era ladder missing in several zones (rice Japan −8000, wheel/irrigation −7500, iron Africa −7500, bronze drums −8000, chariots); I3 WW levels on neutral lands, N. Africa front missing; I4 Congo franc / Ethiopia not colonised / apartheid; I5 north_america 1500–1699 colonial leak; fact-check 49 claims: 25 OK, 15 vague-OK, 9 WRONG
Task 2: fix round 1/5 dispatched (resume implementer; I1–I5 + all WRONG rows + earliest-year test)
Task 1: implementer DONE_WITH_CONCERNS (150 tests; rosary added to lineage screen; soul.js touched (pauses keys removed); echo tone 해요체; prev-life ghost reads white in 3D; build_share ORDER broken; snap 1-head)
Task 1: reviewer dispatched (sonnet; filtered diff)
CONTROLLER NOTE for Task 3: s2_t1_echo shows prev life 「오스트레일리아의 농사짓는 집」 before 43 BCE — households must be area-aware (Australia pre-1788 foragers; other forager areas by date). Add area-aware household override (drawHousehold filter or context.forager) in Task 3 scope; keep region/year draw untouched
CONTROLLER NOTE: 3D prev-life ghost renders white, not blue (realscene.js — phase2 track or polish)
Task 1: review — spec ✅ (2 gaps), quality ⚠️: I1 echo boost no effect for 10/22 traces + invisible; I2 echo lines repeat within a life (47%); out-of-fence rosary + soul.js accepted
Task 1: fix round 1/5 dispatched (resume implementer; boost effects per kind + HUD strength mark + toast; echoSeen + ≥3 lines/key + fallback; tests)
Task 2: fix round 1 done (own 20 tests pass; full suite 139/144 — 5 failures in phase2 Phase B in-progress files villageplan/peopleplan/kit; anachronism rule test 92 rules 0 hits; snap 2-fix1)
Task 2: scoped re-review 1 dispatched (sonnet; +10 fact spot-checks; Oba-in-Sahel judgement)
Task 2: re-review 1 — I1–I5 + 9 WRONG ADDRESSED; new Important N-1 Oba across all West Africa (0.8% lives); Minors N-2..N-7 → fix round 2/5 dispatched (resume implementer)
Task 1: fix round 1 done (164 tests; boost effects all 22 traces + HUD ●●○ + toast; echo repeats 47%→0%; snap 1-fix1)
Task 1: scoped re-review 1 dispatched (sonnet)
Task 2: fix round 2 done (context+tokens 20/20; full 164/164; 101 anachronism rules, 0 hits; snap 2-fix2) — controller scoped check of round-2 diff: N-1..N-7 addressed as described
Task 2: minor (deferred): 1440–1600 craft households in Ghana/Hausa part of west_africa also see 「장인 · 오바의 길드」 (single area); anachronism rules only cover words someone thought of
Task 2: deferred (from brief): lands.js import of ZONE_OF + zone→kit mapping table (12 known diffs pinned by test)
Task 2: complete (snap 2-base..2-fix2)
Task 5: brief extracted; dispatching out of order (opus; snap 5-base) while Task 1 re-review runs (no file overlap: events.js, cards_event.js, CONTENT-SOURCES.md, test/events)
Task 1: re-review 1 — I1, I2 ADDRESSED; no new Critical/Important; calibration byte-identical without boost
Task 1: minor (deferred → Task 8 polish): fear:fire echo lines (화덕/불씨) lack era gate (memory.js:28,30); seeMemories call only in main (main.js:122/ui.js:468); boost indirect mean death age +0.17y; happy bonus from talent can reach +22 over a lifetime (> "small") — cap it
Task 1: complete (snap 1-base..1-fix1)
Task 3: brief extracted (snap 3-base)
Task 3: implementer dispatched (opus; + area-aware households via FARM_FROM; fences exclude UI/events/context/3D)
Task 3: implementer DONE_WITH_CONCERNS (183/183 at 02:51; later 2 failures from Task 5 in-progress events; skill saturates (41% ≥95 by 40); forager holdings override in holdings.js; snap 3-head)
Task 3: reviewer dispatched (sonnet; filtered diff)
Task 5: implementer DONE_WITH_CONCERNS (191/191; 141 events (117 new), 69 with cards; 66 verified by web; e0 −0.11y; event exposure by 40: 13.8%→38.6%; content.test.mjs edited out-of-fence; broad areas make local events area-wide; snap 5-head)
Task 5: reviewer dispatched (sonnet; +30 fact checks, card text, broad-area mismatch)
STATUS at usage limit: Task 3 review + Task 5 review running (sonnet); after them → fix rounds; then Task 4 (HUD), 6 (tokens), 7 (local packs), 8 (playthrough polish incl. Task 1 deferred minors)
Task 3: review — ✅ conditional approve; Important 1: skill saturates (median 90 at 40, 99% ≥95 at 60) → CONTROLLER DECISION: diminishing growth 1.5×(100−x)/60 (apply same shape to know/charm if they saturate); fix round 1 to dispatch when usage resets
Task 3: fix round 1/5 dispatched (resume implementer; diminishing growth; distributions; test)
Task 5: review resumed after rate limit
Task 5: review — spec ✅, quality ⚠️; 0 date/place errors in 38 checks; Important: I1 vietnam_war in Myanmar/Thailand, I2 partition in South India, I3 spice_voc Maluku-only detail, I4 korea_colony land survey years (event cards ignore when years), I5 adult/male choices to kids/elders/women, I6 death causes vs painful institutions (potosi accident, congo hunger); M5 denylist gaps → fix round 1/5 dispatched (no life.js edits)
Task 3: fix round 1 done (194/194; diminishing growth skill/charm/know; choice-level when (condOk/choiceOpen/openChoices); literate flag at know 60; wealthText; snap 3-fix1)
Task 3: scoped re-review 1 dispatched (sonnet); spec 2.2 updated with diminishing growth + craft chance + literate flag
Task 3: re-review 1 — APPROVED (I1 + ⚠️ items addressed; calibration preserved)
Task 3: minor (deferred → Task 4/7/8): shiftStatus text always 「한 계단」; literate at know 60 closes 4 letters-trace cards (dream:letters unreachable); distribution test only skill; weak "same choice" assert; 'denarii' plural at n=1; forager goods override belongs in context.js; Task 4 brief must mention name/wealthText/chanceOf/openChoices locked-choice rendering
Task 3: complete (snap 3-base..3-fix1)
Task 4: implementer dispatched (opus; snap 4-base; port 8784; + content.test effect keys, shiftStatus text, build_share ORDER)
Task 5: fix round 1 done (198/198; 142 events, 69 cards; minAge 15 on 13 cards; 12 cards rewritten for kids/elders/women; causes fixed; denylist 71/67; snap 5-fix1)
Task 5: scoped re-review 1 dispatched (sonnet)
Task 5: re-review 1 — PASS (I1–I6 addressed; mutation tests real)
Task 5: minor (deferred → Task 8 / later): congo_rubber death label says 「전쟁」 (add forced-labour/violence cause in deaths.js); e0 guard margin 0.415 vs threshold 0.5 (watch when adding hazards); short events with minAge 15 seen less (73–78%); area-wide war/hazard for local events (root: sub-area field); event cards read only minAge from when (no year/sex/maxAge)
Task 5: complete (snap 5-base..5-fix1)
Task 6: brief extracted; waits for Task 4 (ui.js fillTokens conflict) — or dispatch content-only part now
Task 6: render hook (fillTokens in ui.js) delegated to Task 4 implementer via SendMessage; Task 6 content-only dispatching (opus; snap 6-base)
Task 6: implementer dispatched (opus; content-only fences)
Task 6: implementer DONE_WITH_CONCERNS (215/215; shown generic cards 54.8%→0.0%, generic lines 83.4%→31.1%, deck lines gated/tokenized 83%; cross-zone overlap still 18% (Task 7); lines.test edited out-of-fence; ruler/feast/school English word problems; wants money key; snap 6-head)
Task 6: reviewer dispatched (sonnet; 30 sample fills in 5 contexts)
Task 4: implementer DONE_WITH_CONCERNS (215/215; 4 auto lives 0 errors; HUD panel/era wind/effectParts/locked choices/renderText; survivedLine + death comparison replaced; single-file build assembles (3D assets missing → 48 resource errors); duplicated focus formula in ui.js; snap 4-head)
Task 4: controller visual note — s2_t4_england close shot: giant vegetable leaves occlude child protagonist (3D polish)
Task 4: reviewer dispatched (sonnet; filtered diff)
Task 4: review — conditional approve; Important: I1 illness line pulls non-illness titles (47%); I2 ×N risk misleading → absolute %; I3 focus formula duplicated → shared focusYearEffects + equivalence test (life.js/focus.js allowed); I4 English effects overflow 84px cards → fix round 1/5 dispatched
Task 6: review — conditional approve; I1 English feast articles (23.5% lives; i18n.js:216 double 'the'); I2 farming words in non-farm industrial/modern households (6 cards, 3 lines); shown-lines share 68.9% <70% → fix round 1/5 dispatched (tokens.js + context_data.js words allowed; i18n.js:216 delegated to Task 4 agent via fillTokens)
Task 6: fix round 1 done (222/222; feastEn articles; farm words reworded for non-farm households; ruler/school words; shown-lines tokenized/gated 77.2%; snap 6-fix1) — controller self-check: token/context/content/lines tests 38/38, sample fills OK in 6 contexts → accepted without separate re-review (text + small helper)
Task 6: complete (snap 6-base..6-fix1)
CONTROLLER FIX (context.js): band households keep forager words after FARM_FROM year (baseCell band flag) + test in context.test.mjs (15/15)
Task 4: fix round 1 done (222/222; illness line tagged only; absolute death % banner; focusYearEffects shared + focus.test equivalence; English chips short; snap 4-fix1)
Task 4: scoped re-review 1 dispatched (sonnet)
Task 7: split into 4 parallel content writers (SA, EA, EU+WestAsia, AM+Africa+SEA); controller pre-wired cards_local_*.js/lines_local_*.js into deck.js/lines.js (223/223); split doc task-7-split.md; snap 7-base
Task 7: 4 writers dispatched in parallel (opus): SA, EA, EU(+WestAsia), AM(+Africa+SEA); reports task-7-<z>-report.md; controller will merge sources + write repertoire.test.mjs metrics after all finish
Task 4: re-review 1 — PASS (I1–I4 + feast addressed; 223/223)
Task 4: minor (deferred → Task 8): ILL_CARDS/HURT_CARDS temporary — Task 7 cards carry ill:true; chance 'lose' chip only in title; banner narrow at 901–1100px; phone layout; old design doc cleanup
Task 4: complete (snap 4-base..4-fix1)
Task 7 EA: DONE_WITH_CONCERNS (37 cards / 33 lines; local_ea 11/11; full 252/253 — content.test pins DECK.length → controller must fix; choice-0 when caused infinite loop in memory.test → rule sent to other 3 writers; local-card exposure low (China village 7% of slots) → consider weight 3 for local cards in Task 7 wrap-up)
Task 7 SA: DONE_WITH_CONCERNS (27 cards / 40 lines; local_sa 10/10; full 262/263 — DECK.length pin; local exposure SA: cards 15.2%, lines 8.3% → weights in wrap-up)
CONTROLLER FIX: content.test.mjs DECK.length now adds LOCAL_CARDS_* (8/8)
Task 7: EU, AM writers + phase2 EA kit resumed after rate limit
Task 7 AM: DONE_WITH_CONCERNS (21 cards / 32 lines; local_am 10/10; local exposure 4–11%; choice-0 rule held)
Task 7 EU: DONE_WITH_CONCERNS (35 cards / 47 lines; 265/265; local share 2–4% of Europe cards; medieval herd households absent → no medieval Bedouin births)
Task 7: all 4 writers done — totals SA 27/40, EA 37/33, EU 35/47, AM 21/32 = 120 cards / 152 lines; next: controller wrap-up (weights, repertoire.test metrics, sources merge) then review
Task 7: controller wrap-up — LOCAL_WEIGHT 3 (deck.js, lines.js, in place); test/repertoire.test.mjs (generic 0%, rendered-text cross-zone overlap ≤8% [measured 4.1% at K=3, id-overlap 15.2% due to tokenized universal cards], deck lines gated/tokenized ≥70%, local ≥8% of shown [11.2%], choice-0 never gated); CONTENT-SOURCES.md links local files; 270/270; snap 7-head; reviewers: 2 (sa+ea, eu+am)
USER (2026-10-21): 「주간한도 95퍼에서 멈춰줘」 — no new heavy dispatches until current % known; running: Task 7 reviewers ×2 (sonnet), phase2 East Asia kit (opus)
Task 7 review EU+AM: Critical 0, Important 4 (planting in pacific; cashcrop Java-only scope; motorbike in Aus/NZ; pasture transhumance in Arabia/Nile) → CONTROLLER FIXED directly (gates narrowed; tests 47/47); metrics at 2000 seeds: generic 0%, overlap 3.86%, lines 92.8%, local 11.4%
Task 7: minor (deferred): repertoire.test uses 600 seeds (brief said 2,000); haft-sin date; no medieval herd households (households.js) → no medieval Bedouin; Arabia-specific camp line
Task 7 review SA+EA: APPROVED WITH FIXES; Important: I1 choice minKnow 60 unreachable premodern (know 25–34) → CONTROLLER lowered all local choice minKnow to 25 (one 30) + repertoire test minKnow ≤30; I2 seodang no sex gate → sex 'm'; I3 so_celadon/onggi missing craft tag → tags craft; local tests aligned; 271/271; snap 7-fix1
Task 7: minor (deferred → Task 8): Korean births only 0.5% → Korea cards rarely seen (birth share, not bug); 15 Minors in task-7-review-saea.md §5 (date windows, wording 「아마도.」, teen-stage adult choices); literate flag at know 60 still unreachable premodern for old letters cards
Task 7: complete (snap 7-base..7-fix1)
PAUSED 2026-10-21 at user's 93% weekly usage (stop at 95%). Next on resume: phase2 Task 2 review → sim2 Task 8 → phase2 Task 3/4 → share build
SHARE: GitHub Pages live https://openbaeseongjin.github.io/past-life/ (repo openbaeseongjin/past-life, deploy dir D:/Users/admin/Desktop/past-life-pages, commit f143e12); live check 0 console errors
Task 8 (cloud 2026-10-21): tools/sweep.mjs — 영혼마다 생을 이어 2,400생을 자동으로 돌려 화면 글 전부(카드·선택지·결과·효과·작은 일·두루마리·모닥불·시대 띠·살림·부고·묘비) ko/en 665k줄을 검사 (중괄호·조사·영어 관사/복수·시대 착오 44규칙·한 생 반복·성별/나이/혼인/집안·빈도); 처음 진짜 흠: en 「the potatoes harvest」(calm 줄 → harvesting the {crop}), 고추 1515 동아프리카(minYear 1540), 커피 1640 발칸(minYear 1555); 2,400생 흠 0건
Task 8: deferred minors — fear:fire 메아리 화덕·불씨 premodern + 현대 줄 2 · 재능 마음 덤 한 생 상한 8 (TALENT_HAPPY_MAX) · 지식 60에 글 꿈 이룸 · congo_rubber 사인 forced(강제 노역) · ILL/HURT_CARDS → 카드 ill/hurt 표지 · 중세·근세 유목 집안(HERD_SHARE, 무게 0 herd로 다른 시드 뽑기 그대로; 몽골·초원·아라비아…) · 사건 카드도 when 전체 검사 · repertoire 시드 600→2000 · 어른·중년 작은 일 확률 0.4 + 앞 생 줄 가중치 ×0.25 (soul.lives[].lines; 40살 넘은 생의 최다 줄 87%→~65%, 한 영혼 세 생 반복 18%→5%)
Task 8: 이미 고쳐져 있던 것 — shiftStatus 계단 수, denarii 단수(fixOne); 그대로 — 오바의 길드(설계 2.3 예시·시험 고정), 한국 카드 노출(출생 비율), 짧은 사건 minAge 15 노출(설계)
Task 8: EU·AM Minor 5–16 (11 고침, 13 그대로) · SA·EA Minor 1–13 (10 고침 + 새 카드 barley_loan·well_law·inheritance) — 하위 에이전트 2 (opus); test/sweep.test.mjs 10개; 294/294
Task 8: 남음 — 브라우저 auto=1 여섯 생 콘솔 점검(클라우드는 jsDelivr 막힘 → npm 받은 three 로 가로채 시험 중), 일본·중국 큰 집 시대 빈자리
