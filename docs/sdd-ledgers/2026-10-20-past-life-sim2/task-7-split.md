# Task 7 split: 4 content writers in parallel (controller decision)
Each writer owns ONE pair of files (cards_local_<z>.js, lines_local_<z>.js) + one sources file CONTENT-SOURCES-local-<z>.md (merged later by controller). deck.js / lines.js already import all four (pre-wired by controller). Nobody else edits the others' files.

| writer | files | combos (design 4.2 table: cards / lines) |
|---|---|---|
| SA | cards_local_sa.js, lines_local_sa.js | 남아시아 마을 10/12, 남아시아 큰 집 6/8 (귀족 쪽 + 하인 쪽), 남아시아 거리 5/6, 남아시아 야영지 4/6 |
| EA | cards_local_ea.js, lines_local_ea.js | 동아시아 마을 10/12, 동아시아 거리 5/6, 동아시아 큰 집 5/6 (귀족 + 하인) |
| EU | cards_local_eu.js, lines_local_eu.js | 유럽 마을 8/10, 유럽 거리 4/6, 유럽 큰 집 4/6, 서아시아·북아프리카 마을 8/10, 서아시아 야영지(유목) 4/6 |
| AM | cards_local_am.js, lines_local_am.js | 아메리카 마을 8/10, 아프리카 마을 5/6, 아프리카 야영지 4/6, 동남아·오세아니아 마을 4/6 |

Conventions (all writers):
- Gate every card/line with `when: { zones: [...], setting: '<village|estate|street|camp|shore|factory>' }` plus era (`eraGroups` or `minYear`/`maxYear`) and, where needed, `areas` (e.g. korea vs china vs japan), `tags`, `minAge`/`maxAge`, `sex` only if truly needed. Zones: europe, southasia, eastasia, mudbrick, africa, americas, seaoc, steppe (context_data.js ZONE_OF). Settings come from lands.js stageOf(birth).setting via household (farm→village, band/herd→camp, craft/trade/shop/pro/office→street, elite/serve→estate, fish/sail→shore, factory→factory). Check cards.js eligible/condOk for exact semantics.
- Spread each combo across eras (ancient / medieval / early / industrial / modern) in proportion to births (77% before 1500) — most cards for ancient+medieval.
- Card shape = existing cards (cards_life.js): id `loc.<z>.<combo>.<slug>`, stage (or list), title/text/choices ko+en, effects using health/wealth/family/happy and the new keys luck/charm/know/skill/status (±1) sparingly, chance/risk/skill where natural, `ill: true` on illness/injury cards, choice-level `when` (e.g. `{ minKnow: 60 }` → 「글을 알아야 해요」) at least a few times per writer.
- Lines shape = lines.js entries: id `l.loc.<z>.<slug>`, stage, text ko/en, when.
- Tokens allowed ({staple},{holy},{feast},{market},{coin},{home},{cloth},{healer},{ruler} — see tokens.js WORD_KEYS; English {feast} gets articles automatically); never write "the {feast}".
- Tone: 해요체, 담담하지만 위트. No real-person names (denylist test). Painful institutions (caste discrimination, slavery, serfdom, colonial rule, war) from the eyes of the person living there, calm, never flippant. Choices must make sense for the stage's ages; adult-only actions get minAge.
- Historical facts: verify with WebSearch where specific (dates, institutions, objects); record one line per card/line cluster in CONTENT-SOURCES-local-<z>.md (claim + public source title).
- Tests: add `test/local_<z>.test.mjs`: counts per combo ≥ table, every card/line gated by zones+setting, ko/en complete, tokens fill without leftovers in eligible contexts, ids unique, no denylisted names. Run `npm test` (all pass).
