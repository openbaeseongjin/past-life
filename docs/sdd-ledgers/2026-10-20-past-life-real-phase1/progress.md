# SDD ledger — plan: docs/superpowers/plans/2026-10-20-past-life-real-phase1.md
(spec: docs/superpowers/specs/2026-10-20-past-life-real-world-design.md; previous plan ledger: .superpowers/sdd/2026-10-20-past-life-identity/progress.md (Tasks 1–5 done; 6–7 superseded by real-world spec phase 3); tests 100)
Task 1: implementer dispatched (opus; Blender England building kit; snap 1-base)
Task 1: implementer hit API rate limit mid-read; resumed after reset
Task 1: implementer DONE (kit 11 pieces, 146k tris, 6.1MB; AO uv1; 73/88/69 fps; 100/100; snap 1-base..1-head). Controller note: overview still sparse/wide vs target → Task 2/4 must tighten composition (closer camera, clustered dense village)
Plan updated: Task 2 Step 2 adds clustering (8–15 m spacing, street-lined village, church green) + closer overview camera (village ~2/3 of frame)
Task 1: review — spec ⚠️ (accepted: cottage_b 2.30 m/longhouse 2.25 m walls, 56° hip, 2K AO atlas; seed wiring deferred to Task 4), quality Needs fixes: Important loadKit cache shares mutable materials across scenes; kit_common.py hard-coded session gltft path + raw 38 MB overwrite fallback. Fix round 1 sent (+ Math.imul seed, kit-fail visibility, KIT_DIMS json + node test (→101), dead leftovers, bounded forge flicker, AO GPU note)
Task 1: minor (deferred): merged village meshes never frustum-cull; dusk p95 17.4 ms thin margin (watch in Task 2)
Task 1: fix round 1 DONE by implementer (101/101; snap 1-head..1-fix1); re-review dispatched (sonnet)
Task 1: fix round 1/5 (8 addressed, 0 open — per-scene material clones, no session gltft path + raise, Math.imul seed, kit-fail HUD + forge off, england.dims.json + kitdata.js + kit.test.mjs (101), dead leftovers, bounded flicker, OptiX note; snap 1-head..1-fix1)
Task 1: minor (deferred): shared texture anisotropy write; GLTFT bad path silently falls back to docs/past-life/tools
Task 1: complete (snap 1-base..1-fix1, review clean)
Task 2: brief re-extracted after plan update
Task 2: implementer dispatched (opus; snap 2-base)
Task 2: implementer DONE_WITH_CONCERNS (perf final re-run inflated by FC ONLINE on GPU; clean-GPU near-final 12.2/10.7/10.9 ms avg; 102 tests; snap 2-head)
Task 2: controller visual notes — overview bridge seen end-on reads as grey wall; grass tufts sparse/stamp-like; street plaza large bare dirt; sheep toy-like
Task 2: reviewer dispatched (sonnet; review-2-base..2-head.diff → task-2-review.md)
Task 2: review — spec ❌ (I1 overview village ~31% not 2/3 + bridge end-on; I2 awnings 2–3 not 3–5, yards not guaranteed; I3 perf unverified on final code, flower_patch 5,909 tris)
Task 2: minor (deferred): rail_fence/view buttons/seed= extras (accepted, composition support); realscene.js size 1,917 lines (split in Task 3/phase 3)
Task 2: fix round 1/5 dispatched (resume implementer; I1–I3 + V1 grass tufts, V2 street plaza, V3 sheep, V4 billboard black specks + minors 3–7; controller allowed pure villageplan.js with Node tests, realscene.js keeps dressVillage export; perf only when fczf.exe not running)
Task 2: fix round 1 done by implementer (107 tests; clean-GPU perf p95 15.0/16.1/13.3/13.9 ms; villageplan.js pure module; report section appended by controller — implementer .md write blocked; snap 2-fix1)
Task 2: controller visual note after fix1 — overview now steep aerial (no sky/hills, diorama look); street & sheep much better
Task 2: scoped re-review 1 dispatched (sonnet; review-2-head..2-fix1.diff → task-2-rereview-1.md)
Task 2: re-review 1 — all findings ADDRESSED (I1–I3, V1–V4, minors 3–7), no new Critical/Important (task-2-rereview-1.md)
Task 2: minor (deferred): GTAO NaN patch via String.replace silently no-ops on three upgrade; perf headroom thinner (reviewer p95 18.2–18.5 ms, sync bench ~21 ms); house count 45–59 over 1,500 seeds; p1_t2_yard.png stale; pasture near field still sparse
Task 2: PARKED for Task 4 — overview camera is 40 m aerial (no sky, hills thin strip, bridge cropped lower-left) → diorama look; Task 4 must re-aim overview to target 3/4 view with sky ~15–20% + hills behind while keeping village large
Task 2: complete (snap 2-base..2-fix1)
Task 3: brief extracted; implementer dispatched (opus; snap 3-base; Quaternius packs at scratchpad x_ubc/x_ual; realpeople.js module allowed; perf only when fczf.exe not running)
Task 3: implementer DONE_WITH_CONCERNS (111 tests; perf pending — GPU busy (fczf) + GAMA headless java on CPU (user's D:/vcpf R experiment, not ours); LOD0 8.2–10.2k tris; Superhero body proportions; snap 3-head)
Task 3: controller copied CC0 Quaternius packs to tools/blender/_src/quaternius/{ubc,ual} (53 MB) — kit_clothes.py should default UBC_DIR/UAL_GLB there
Task 3: controller visual notes — smith has arm tattoos + hammer not visible in hand (reads as scratching head); blue triangle artifact at smith hip; carrier sack is a flat beige polygon; carrier shirt flat white/untextured; horse blocky (Task 2 asset)
Task 3: reviewer dispatched (sonnet; review-3-base..3-head.diff → task-3-review.md)
Task 3: review — spec ❌ (I1 leg wraps get skirt_blend thigh weights → stiff tubes in walk; poke_check ignores >12 cm drift; I2 sit unreachable: free() 0.5 m inflate vs bench 0.42 m)
Task 3: minor (deferred unless fixed in round 1): M3 stepMs is a lower bound (hidden people still matrix-updated, shadow skinning); M8 kit_clothes.py 1,670 lines (same style as other kits)
Task 3: fix round 1/5 dispatched (resume implementer; I1, I2 + V1 tattoos, V2 hammer visible/strike, V3 hem gap, V4 sack shape, V5 garment textures + M1, M2, M4–M8; old villager_m/f.glb moved to scratchpad/old_people)
USER (2026-10-20): "이렇게 디테일한 수정은 나중에 진행하고 지금은 게임부터 만들어서 보여줘봐" → Task 3 fix round 1 STOPPED (implementer told to leave working state); remaining Task 3 findings (I1 leg wraps, I2 sit, V1–V5, minors) PARKED for later polish pass
Task 4: brief extracted; scope per user = wire game first (Step 2 API + Step 4 game check + Step 3 land tint); Step 1 grading kept light; game camera must be 3/4 view with sky+hills (parked Task 2 overview note)
Task 3: fix round 1 stopped at clean point (113 tests, 0 console errors; I1, I2, V1–V5, M1/M2/M4–M8 applied; NOT done: glb byte-compare, screenshots re-shoot, SOURCES.md sha256/deps/paths, report numbers; snap 3-fix1)
Task 3: PARKED (user priority = game first) — scoped re-review of review-3-head..3-fix1.diff + leftovers above → later polish pass; perf pending
Task 4: implementer dispatching (opus; snap 4-base)
Task 4: implementer dispatched (opus; snap 4-base) — wiring createStage + 3/4 game camera + lands.js stageOf(birth)→{kit,land,era} for all 40 areas (Node test) + light grade/quality tiers
USER (2026-10-20): concern "영국 마을만 쓰면 세계 각지 전생 기획과 어긋남" → birth tally (20k seeds): south 31% (india 25.6%), east 18.8% (china 16.9%), west 13.2%, europe 12.6%, americas 11.9%, africa 7.8%, seaoc 4.8%; pre-1500 77%
USER decision: 「출생 비율 순으로 세트 추가」 — show game now (non-England lands = interim land-look only), then Phase 2 kits in order: southasia → eastasia → mudbrick (W.Asia/N.Africa/Nile) → americas → africa → SE Asia/Oceania → early-modern/modern
USER (2026-10-20): "왕이나 귀족으로 태어나면 배경이 다를텐데" + "나라마다 다 이미지가 다를거고" → settings tally: village 53.2%, estate (elite 4.75% + serve 8.5%) 13.3%, street 12.9%, camp 12.9%, shore 4.9%, factory 2.8%; 42 region×setting combos, top 16 = 80% (south·village 17.5, east·village 10.4, europe·village 7.1, americas·village 6.7, west·village 6.7, south·estate 4.7 …)
USER decision: 「문화 세트 × 장소 배치 조합」 — each culture kit = humble/town/grand(manor·palace·castle)/tent pieces in Blender; 6 settings = code layout recipes; elite = grand house courtyard, serve = same estate's back yard; factory/modern = shared world kit + land tint; per-area variant (roof/wall/cloth palette) inside a kit; fill by birth share
Task 4: SendMessage to implementer — stageOf adds setting (household→6) + variant (area key) + Node test
USER (2026-10-20): "이런 요소들은 수치도 같이 나오면 좋을 거 같아" (올해의 패 icons) → controller edited i18n.js effectIcons (+num), ui.js fxHtml/fxText (+3 icon), i18n.test (117 pass); verify not overwritten by Task 4
USER (2026-10-20): campfire too reference-like ("이것보다는 다른 우리만의 이벤트를 넣어야할 거 같아") → chose 「기억 구슬 고르기 + 앞 생의 메아리」; mockups s8a/s8b in docs/concept-images/29-past-life-memory-beads (Figma gpt-image-2.5 + KoPubBatang overlay) → user 「이대로 진행」; identity spec 3.5 + 4.4 updated. TODO after Task 4: plan + implement memory-bead campfire (journal-based 3 beads, blue echo bead from prev life traces, big memory bead on thread/rosary, reuse in scroll/epitaph/next-life echo; no stat line/text box)
USER (2026-10-20): "3D로 한 이유가 주인공을 가까이서 키우는 맛을 보기 위해선데 너무 멀어서 안보여" → Task 4 amended via SendMessage: main view = close 3rd-person on protagonist (4–8 m, 1/3–1/2 frame, child/adult/elder by age, sex from birth), action/spot by focus (setFocus), wide 3/4 only as establishing (birth, flame-rise), campfire frames protagonist+fire+ghost, wheel zoom 3–15 m + drag orbit
USER (2026-10-20): "+3 이런 거 말고 구체적인 재산, 건강상태, 행운, 친화력 … 수치화" + "시대적 상황(전쟁·질병·과학·재산·신분)이 잘 반영" + "어디서 언제 태어나든 레파토리가 다 달라야 하는데 다 똑같아" → audit: 57% of shown cards generic; 163 cards (generic 67), 152 lines (generic 66); mockups s9-stats-era, s10-repertoire (docs/concept-images/30-past-life-stats-era)
USER decision: 「시뮬 2.0 먼저, 3D 세트는 줄이기」 — order: Task 4 (running) → memory-bead campfire → SIM 2.0 (stats/attributes/status/concrete holdings + era context table + 100+ real events + tokenized cards + signature packs for top combos) → culture kits only southasia/eastasia/mudbrick + estate setting (others nearest kit + land tint) → simple world map (birth + rosary) → test/submit
Task 4: implementer DONE_WITH_CONCERNS (117 tests; avg 13.6–16.2 ms, p95 18.3 ms measured while GAMA java on CPU → re-measure; setLife sync stall 1.3–2.7 s; clip substitutions; child scene crops adults; snap 4-head)
Task 4: controller visual notes — p1_t4_india_close shows "1살" but adult woman hoeing (protagonist variant/camera target?); paddy water stripe pattern odd; old campfire UI still (replaced by sim2 Task 1)
Task 4: game opened for user at http://localhost:8780/index.html?seed=T4-151 (server running in background — stop later)
Task 4: reviewer dispatched (sonnet; review-4-base..4-head.diff → task-4-review.md)
USER (2026-10-21): "친구들한테도 공유할 정도로 퀄리티 높여줘" → roadmap to shareable quality:
  Track B0: Task 4 review fixes + Task 3 parked re-review leftovers (people detail) — next, before parallel tracks
  Track A: sim2 plan Tasks 1–8 (campfire, context, attrs/status/holdings, HUD, events 100+, tokens, local packs, playthrough polish) — files: engine + ui/main/i18n/index.html
  Track B: Phase 2 culture kits (southasia → eastasia → mudbrick + estate setting + clothing variants) — files: tools/blender, assets/real, realscene.js/realpeople.js only (no main/ui)
  Track C: share build (multi-file web build, loading screen, auto quality, error fallback) + publish channel decision (ask user: artifact multi-file vs GitHub Pages vs itch) + OG/share card
  Track D: playtest pass (auto-run many lives, console 0, text check), perf clean measure
Task 4: review — ⚠️ (I1 camera can stick in wide when meReady late; I2 lands.js era vs birth.group mismatch 6.1% forager with non-camp settings; I3 baby/child 23–27% of frame); india_close "1살 + adult" was console-forced state, not a bug
Task 4: minor (deferred): M6 era prop swap unimplemented (st.kitNow dead); M7 run drivers not reproducible (__rise); M8 realscene.js 2,203 lines → split stage.js before phase 3; M9 tautological lands test assert, LAND_LOOK.mix species not validated, no createStage shape test; M10 pixelRatio 1, ghost/elder-female variant ignore prev life
Task 4: fix round 1/5 dispatched (resume implementer; I1–I3 + M1 stall/longtask/tree cache/setTime throttle, M2 Water RT leak, M3 build-failure fallback, M4 i18n notices, M5 ?q no persist, M10 input in wide + companion rebuild; port 8781)
Task 4: fix round 1 done (118 tests; 0 console errors on T4-151/T4-21/T4-39 auto runs; baby/child 37%; lands era fixed 0/6000 mismatch; M1–M5, M10 fixed; longtask per life change 2.5–3.6 s (GAMA busy); perf pending; snap 4-fix1)
Task 4: scoped re-review 1 dispatched (sonnet; review-4-head..4-fix1.task4only.diff — filtered to Task 4 files since parallel tracks changed others)
Task 4: re-review 1 — all ADDRESSED (I1–I3, M1–M5, M10), APPROVED
Task 4: minor (deferred): tree cache unbounded (~350 MB worst case over 6 land looks); createRealScene throw leaves half-built; grab cursor in wide; weak buildfail evidence; debugFailNext debug API left; OUT-OF-SCOPE: build_share.py ORDER lacks realscene.js (single-file share build broken — PC multi-file build planned anyway)
Task 4: complete (snap 4-base..4-fix1)
Phase 1: Tasks 1,2,4 complete; Task 3 fix1 applied but re-review PARKED → final whole-branch review deferred to polish pass (Track D)
