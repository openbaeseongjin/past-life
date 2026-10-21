# SDD ledger — plan: docs/superpowers/plans/2026-10-21-past-life-real-phase2.md

Setup: plan written 2026-10-21 after user asked "친구들한테도 공유할 정도로 퀄리티 높여줘"; runs in parallel with sim2 track (disjoint files: no main/ui/i18n/index/engine edits)
Task 1: implementer dispatched (opus; snap 1-base) — Phase A only (Blender kit/props/trees/clothes + kitdata/kit.test); Phase B wiring waits for controller 「Phase B 시작」 after real-phase1 Task 4 fix lands
Task 1: Phase A done (141 tests; southasia.glb 67k tris 3.79 MB; props 22.8k 2.10 MB; trees 32k 1.20 MB; villagers_southasia 1.82 MB; deterministic; England outputs byte-identical; gltf-transform not installed in repo — used session temp copy via GLTFT)
Task 1: controller visual notes — superhero bare chests, flat turban, pointed sari hood, plain courtyard box; Phase B 시작 sent (port 8783; fences exclude main/ui/i18n/index/strand/life/traces/memory/context/tokens)
Task 1: minor (deferred): england.glb 6.25 MB > 5 MB budget; install gltf-transform 4.5.1 + meshoptimizer 0.21 + sharp 0.35 into docs/past-life/tools for reproducible builds
Task 1: Phase B done (191/191; T4-21 full auto life 0 errors; street P2-44, estate P2-114, England regress EN-30 screenshots p2_t1_*; draw calls wide 1508 vs England 1274; perf pending (GAMA); concerns: shared terrain/stone bridge, flat paddy shader, flat angavastram from back) — NEXT: snap + review (filter to phase2 files)
Task 1: snap 1-head; reviewer dispatched (sonnet; review-1-base..1-head.task1only.diff with realscene/lands base = real-phase1 snap-4-fix1)
Task 1: review — conditional approve; I-1 cloth artifacts (jagged veil/choli, board pallu, holes, shield angavastram); I-2 SE Asia on southasia kit gets saris/turbans/Hindu temple + ancient lives get medieval forms; I-3 kit/tree caches never freed (~84 MB/land×kit)
Task 1: CONTROLLER DECISION I-2 — temple_small only year ≥600 (india/bengal/himalaya), indus only 600–1000, lanka never; SE Asia areas: no temple, no turban/sari (sarong variant or at least drop + SE Asia palette); ancient (<600) simpler forms; Node test for temple gating
Task 1: fix round 1/5 dispatched (resume implementer; + LRU caches; M-1/M-2/M-4 optional)
Task 1: fix round 1 done (215/215; cloth topology fixed; PIECE_GATES temple ≥600 etc.; villagers_seasia.glb; LRU caches bounded over 13 rebuilds; perf measured GAMA off: SA wide 15.3 ms 65 fps, England 15.5 ms 64 fps; snap 1-fix1)
Task 1: scoped re-review 1 dispatched (sonnet)
Task 1: re-review 1 — APPROVED (I-1..I-3 addressed)
Task 1: minor (deferred): N-1 angavastram reads as torn wedge; N-2 peopleplan.js:54 kit name compare; N-3 rebuild villagers glbs with final kit_clothes.py and byte-compare (screenshots india_close/ancient/sea predate final rebuild); N-4 SE Asia still has town house/stone bridge, ancient still kurta/turban; N-5 failed glb tree species leaves set cached without palms
Task 1: complete (snap 1-base..1-fix1)
Task 2: brief extracted (snap 2-base)
Task 2: implementer dispatched (opus; Phase A+B together; port 8785; lessons from Task 1 included)
Task 2: implementer DONE_WITH_CONCERNS (284/284; perf GPU free: EA wide 69–80 fps, street 77–91, England 65, SA 68; deterministic; korea glb 4.97 MB near 5 MB; Korean stone pagoda; era-agnostic clothes (Joseon gat in Three Kingdoms); orange cattle; LOD0 near 11k)
Task 2: controller visual check p2_t2_korea_wide/close — Joseon village, satgat, white hanbok, 엽전·마지기 HUD read well
Task 2: formal review HELD — user asked to stop at 95% weekly usage; waiting for current % before dispatching reviewer
PAUSED 2026-10-21 at user's 93% weekly usage (stop at 95%). Next on resume: phase2 Task 2 review → sim2 Task 8 → phase2 Task 3/4 → share build
