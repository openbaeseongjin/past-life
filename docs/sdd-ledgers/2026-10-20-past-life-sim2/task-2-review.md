# Task 2 검토: 맥락 엔진 (context.js · context_data.js · tokens.js)

검토 대상: `docs/past-life/context.js` · `context_data.js` · `tokens.js` · `test/context.test.mjs` · `test/tokens.test.mjs` · `CONTENT-SOURCES.md` (모두 새 파일).
검토 방법: 코드 전부 읽기, `node --test`로 두 시험 파일만 돌려 17/17 통과 확인, 임시 스크립트(scratchpad)로 땅 × 해 맥락을 직접 뽑아 보기, 출생 비율(`births.js`·`places.js`)로 문제가 닿는 삶의 비중 계산, 웹 검색(standard)으로 사실 49건 확인(일부는 「알려진 연대」로 표시).

**판정: 명세는 충족(✅). 품질은 「수정 후 진행」. Critical 0건, Important 5건.** 구조·시험·토큰은 탄탄하다. 그러나 사용자가 콕 집은 「시대·땅 반영」의 자료 쪽에 남아시아 신분제 시대 착오 같은 눈에 띄는 오류가 있고, 이 오류는 Task 6(카드 글)이 이 맥락을 쓰기 전에 고치는 편이 싸다.

---

## 1. Spec Compliance

| 항목 | 판정 | 비고 |
|---|---|---|
| 새 파일만 만들고 기존 파일은 안 건드림 (`lands.js` 보류는 컨트롤러 결정) | ✅ | 문제 아님 |
| `ZONE_OF` 40개 땅, 8개 문화권 모두 사용 | ✅ | 시험 1·2가 못 박음 (lands.js와 28개 일치, 12개는 `KNOWN_DIFF`로 고정) |
| `contextOf(year, area, household)` 모양 = 설계 3.1 | ✅ | 14개 필드(설계 13 + `firstYear`). `firstYear`는 설계 5.3(첫돌 풍습 줄) 쪽 요구라 타당 |
| `status.ranks` 키 | ⚠️ | 설계 3.1은 집안 13개 전부를 늘어놓지만, 구현은 「그 묶음의 집안 + 인자로 받은 집안(빌려서)」만 담는다. 브리프 시험(`ranks[household]`)에는 맞고 Task 3·4가 `ranks[birth.household]`로 읽으면 문제없다. 다른 집안 키를 훑는 코드를 쓰면 빈다 |
| `fillTokens(text, ctx, lang)` + 조사 5쌍 | ✅ | `strict` 인자와 조사 5쌍 추가는 상위 호환. 받침 판정 `(code-0xAC00)%28`, ㄹ 받침 「로」 |
| `WORD_KEYS` 15개 | ✅ | 설계와 같음 |
| 문화권 8 × 묶음 6 = 48칸 | ✅ | `ZONE_DATA` 8개 × (forager…modern) 전부 있음. 칸마다 words·신분·병·의술·기술·war·school·literacy 상속으로 채워짐 |
| 땅 덮어쓰기 17개 이상 | ✅ | 필수 17개 + 15개 = 32개 (`AREA_DATA`) |
| 합치는 순서 기본값 → 땅 → 사건, 캐시 | ✅ | 순서는 `context.js` 머리 주석 그대로. 캐시는 2층(칸·맥락)이고 같은 열쇠면 같은 얼린 객체 |
| 사건 수정 (전쟁·질병·품삯) | ✅ | 흑사병 1347~51 품삯 > 1과 뒤끝 100년, 임진왜란 3, 1차 대전 서부전선 3, 1918 독감. `events.js` 필드(`war`·`econ`·`disease`·`after`)를 먼저 읽어 Task 5와 맞물림 |
| 의술 연대 기준 (1796 앞 ≤2, 1870 뒤 유럽 ≥4, 1945부터 5) | ✅ | 표 값과 코드 안전장치를 따로 시험함 |
| 시험이 실제 범위를 단언하나 | ✅ | 아래 「시험」 참고 |
| 한국어·영어 짝, 실존 인물 이름 없음 | ✅ | 짝은 시험으로 보장. 칭호만 씀 (`Sapa Inca`, `oba`, `pharaoh`, `tlatoani`…). 사소한 불일치 1건은 Minor-9 |
| 생명표·죽음 굴림 불변 | ✅ | 기존 파일을 전혀 안 고침. 의술·능력치는 죽음 굴림에 안 들어감 |
| 결정성·순수성 | ✅ | `Math.random`/Date 없음. three·DOM 없음, LF (시험이 확인) |
| 사실마다 출처 한 줄 (`CONTENT-SOURCES.md`) | ⚠️ | 칸 단위로 있음. 그러나 문서 제목은 기억에 기대 적은 것이라 일부가 틀림 (Minor-11). 보고서가 스스로 밝힘 |
| 「확인 안 되는 것은 넓은 표현」 | ⚠️ | 풍습·화폐는 잘 지킴. 신분제·통치 칭호·tech 물건은 시대 구분 없이 단정한 곳이 있음 (Important 1·2·4·5) |

## 2. Strengths

- **합치기 설계가 깔끔하다.** 문화권 칸(앞 묶음 상속) → 문화권 기간 → 땅 `all`/묶음/기간 → 사건 → 연대 안전장치. `[[해, 값], …]` 계단으로 한 묶음 안에서도 해마다 의술·문해율이 바뀐다. 병 목록 `endemic`/`add`/`remove`로 땅 덮어쓰기가 흑사병을 지우지 않게 한 것도 좋다.
- **사건 연결이 앞을 내다본다.** `after`(흑사병 뒤 100년 품삯 ×1.4), `warAt`(땅별 전쟁 수준), 사건 필드 우선 → `EVENT_MODS` 보충. 가짜 사건을 `EVENTS`에 끼워 Task 5 계약을 시험하고 `finally`로 되돌린다.
- **시험이 비어 있지 않다.** 40땅 × 대표 해 6개 × 그 묶음 모든 집안 = 1,280칸에서 15개 낱말·신분·살림·병·의술·전쟁·기술·배움까지 단언한다. 1,000개가 넘는 해(1500년부터 해마다)로 기간 경계 전수 검사, `resolveAt(cellOf(...))`로 안전장치 없는 표 값 검사, 3,000개 넘는 맥락에서 `{`·`}` 0개 확인. 직접 17/17 통과를 확인했다.
- **tokens.js가 짧고 정확하다.** 받침/ㄹ 받침/숫자 읽는 소리/닫는 문장부호 무시, `strict`에서 던지고 평소에는 날것의 `{`를 절대 안 내보냄. `checkTokens`는 Task 6 덱 시험에 바로 쓸 수 있다.
- **사실 정밀도가 높은 구역이 많다.** 한국(1392·1678·1894·1897·1910), 일본(1192·1871·1872), 이집트 칭호 연대, 몽골(1206·1691·1924·1925), 러시아(코페이카 1535·차르 1547·농노 1649~1861·콜호스 1974), 벵골(1204·1576·1717), 서아프리카 통화(1913·1973), 안데스(1438·1532·1944), 프랑스·독일·이탈리아 통치 칭호. 표본 49건 중 25건이 정확히 맞고 15건은 「넓은 표현」으로 안전하다.
- **민감한 말을 신중히 골랐다.** 「바이샤」류 바르나 이름 금지(시험 포함), 고통스러운 제도는 담담한 낱말(「노예」·「농노」·「빚종」), 웃음거리 없음.
- **보고서가 솔직하다.** KNOWN_DIFF 12개, 신분이 집안으로만 정해지는 한계, 아파르트헤이트·원주민 부재, 출처 제목 미확인을 먼저 밝혔다.

## 3. Fact-check 표

판정: **OK** = 맞음, **VAGUE-OK** = 틀리진 않으나 느슨/논쟁, **WRONG** = 틀림(수정 필요). 위치는 `context_data.js`. 근거 링크는 하단 「출처」.

| # | 주장 (게임에 나오는 말) | 위치 | 판정 | 근거·고침 |
|---|---|---|---|---|
| 1 | 남아시아 −8000부터 「바르나와 자티」, 신분 「농사짓는 자티」, 통치자 「라자」 | 217–224 | **WRONG** | 바르나 도식은 리그베다 후기(푸루샤 숙타, 대략 BC 1200~1000)에 처음 나오고, 학자들은 리그베다에도 정교한 카스트 증거가 없다고 본다. 자티는 훨씬 뒤. 인더스(BC 2600~1900) 문명에 카스트 증거는 없다. 고침: BC 1000 앞은 「씨족·마을 어른」 [S1] |
| 2 | 스리랑카 −5000에서 성소 「절 (Buddhist temple)」 | 870 | **WRONG** | 불교 전래는 BC 3세기(마힌다, 대략 BC 247). 그 앞은 불교 낱말 불가 [S2] |
| 3 | 일본 −8000~−1000에서 작물 「쌀」, 성소 「신사」, 신분 「호족과 백성」 | 764–771 | **WRONG** | 벼농사는 규슈 북부 BC 800/700 무렵(방사성탄소로는 BC 1000~900 주장도). 그 앞은 조몬. 한국은 −1001 앞에 조로 바꿨는데 일본에는 빠짐 [S3] |
| 4 | 콩고 1900~1949 화폐 「실링」 | 460 | **WRONG** | 콩고는 1887년부터 프랑(자유국 → 벨기에령 콩고 프랑). 실링은 영국령 동아프리카 [S4] |
| 5 | 남아공 1960~ 「독립 국가의 시민 / citizens of new nations」 | 451 | **WRONG** | 아파르트헤이트 1948~1994, 1970년 흑인 남아공 시민권 박탈(홈랜드 시민 지정). 정반대의 표현 [S5] |
| 6 | 동아프리카(에티오피아 포함) 1885~1959 「총독 · 식민 통치」 | 459 | **VAGUE-OK** | 에티오피아는 분할기에 식민지가 되지 않았고 1936~41 점령만 있었다. 케냐·탄자니아·우간다는 맞음 [S6] |
| 7 | 2차 대전 전쟁 수준 3(땅이 전장)을 events 지역 전부에, 이베리아 포함 | 1426 | **WRONG** | 스페인은 비교전국(1940~43)·이후 중립. 포르투갈·스웨덴도 중립. 오스트레일리아·한반도도 「땅이 전장」은 과장 [S7] |
| 8 | 1차 대전 수준 2를 이베리아·북유럽 포함 유럽 전체에 | 1424 | **VAGUE-OK** | 스페인·스웨덴·노르웨이·덴마크는 중립 (널리 알려진 사실, 검색 생략) |
| 9 | 북아메리카 1500~1699: 기술 3, 물건 「쇠 연장·화약·사탕수수 압착기」, 전쟁 「정복 전쟁」 | 493, 1416 | **WRONG** | `americas.early`를 그대로 물려받음. 1520년 원주민 농가에 사탕수수 압착기는 없다 (설탕 공장은 1516년 히스파니올라) [S8] |
| 10 | 인도 루피 1540년대 (쉐르샤) | 270 | OK | 1540~45 [S9] |
| 11 | 남아시아 은화 BC 6세기, 그 앞은 조개 | 269 | OK | 펀치마크 주화 BC 6세기 [S10] |
| 12 | 델리 술탄국 1206~, 무굴 1526~, 동인도회사·총독 | 823–827 | OK | 널리 알려진 연대 (검색 생략) |
| 13 | 벵골 술탄 1204, 무굴 1576, 나와브 1717 | 839–842 | OK | 1204(바크티야르 칼지), 1576 라지마할, 1717 무르시드 쿨리 칸 [S11] |
| 14 | 벵골 조개 화폐(1800년 뒤에는 루피) | 832, 836 | VAGUE-OK | 조개 화폐는 19세기 중반 벵골 관할에서도 쓰임, 끝 연대는 자료마다 다름 [S12] |
| 15 | 벵골 1600~ 전역 「모스크·이드·막타브」 | 841 | VAGUE-OK | 동벵골은 맞으나 서벵골의 힌두는 사라짐 (Minor-5) |
| 16 | 방글라데시 타카 1972 | 847 | OK | 널리 알려진 연대 (검색 생략) |
| 17 | 첫 쌀밥 의례(안나프라샤나)를 「첫 해 무렵」 | 228 | VAGUE-OK | 보통 생후 6개월 안팎(5~9개월) [S13] |
| 18 | 조선 상평통보 1678 / 그 앞 무명 | 749–750 | VAGUE-OK | 1633에 처음 주조, 1678 재개해 전국 유통. 구현은 후자 [S14] |
| 19 | 갑오개혁 1894 신분제 폐지 | 751–752 | OK | 1894~96, 노비·양반 법적 근거 폐지 [S15] |
| 20 | 대한제국 1897~1910, 총독부 1910~45 | 756, 758 | OK | 널리 알려진 연대 (검색 생략) |
| 21 | 한국 「원」 1905~ | 757 | VAGUE-OK | 대한제국 원은 1902. 구현자도 「넓은 표현」으로 밝힘 [S16] |
| 22 | 돌잡이 실·붓·쌀 | 654 | OK | 위키백과 「돌잡이」가 실(장수)·붓·쌀(부)을 듦. 「양천제」 문서는 양인/천인 이분을 설명하고 양반·상민·노비라는 세 이름은 따로 다룸 (검색 결과로 확인) |
| 23 | 중국 「춘절」을 고대·중세·근세 내내 | 694 | **WRONG** (Minor) | 춘절이라는 이름은 1914년 제안·1949년 이후 정착. 그 앞은 「새해」·「설」 [S17] |
| 24 | 첫돌 잡기 풍습 6세기 기록 | 303 | OK | 안씨가훈(북제) 기록 [S18] |
| 25 | 중국 동전·칼돈·반량전·오수전 연대 | 704–708 | OK | 널리 알려진 연대 (검색 생략) |
| 26 | 호구 제도 1958, 인민공사 1958~1983 | 714–715 | OK | 1958 호구 조례, 1983~84 해체 [S19] |
| 27 | 일본 엔·사민평등 1871, 쇼군 1192 | 793, 811 | OK | 널리 알려진 연대 (검색 생략) |
| 28 | 일본 「한 되 떡」 첫 생일 | 790 | VAGUE-OK | 기원 연대 미상(구현이 「넓은 표현」으로 표시) [S20] |
| 29 | 술탄 칭호 1000~ (인더스), 1071 아나톨리아 | 357, 860, 919 | OK | 11세기에 퍼짐(가즈나 마흐무드 998~1030, 셀주크 투그릴) [S21] |
| 30 | 오스만 악체 1330~, 쿠루쉬 1690~ | 921–922 | OK | 악체 1326 무렵, 쿠루쉬 1688~90 [S22] |
| 31 | 이집트 케디브 1867 · 술탄 1914 · 왕 1922 · 대통령 1953 | 893–898 | OK | 모두 일치 [S23] |
| 32 | 이집트 흑사병 1844까지, 유럽 1720(마르세유) | 205, 392 | VAGUE-OK | 1844는 늦은 유행이지 끝점이 아님(벵가지 1857, 이라크 1867~77까지 있음) [S24] |
| 33 | 세켈(무게로 단 은), 리디아 주화 BC 600 무렵 | 389 | OK | 최초 주화 BC 650~600 [S25] |
| 34 | 이란 「불의 신전」 BC 550~ | 933 | VAGUE-OK | 확실한 신전 유적은 사산 조. 아케메네스는 제단과 부조 근거라 논쟁 [S26] |
| 35 | 첫 이가 나면 밀을 삶아 나눔 (튀르키예·레반트) | 365 | VAGUE-OK | 튀르키예·아르메니아·레바논에 있으나 기원 불명 [S27] |
| 36 | 유럽 중세 물건 「풍차」 (600~) | 163 | **WRONG** (Minor) | 유럽 풍차의 확실한 첫 기록은 1185년 [S28] |
| 37 | 러시아 코페이카 1535, 차르 1547, 농노제 1649~1861 | 1033, 1046–1047 | OK | 일치 [S29] |
| 38 | 콜호스 농민 「묶임」 1930~1974 | 1049 | OK | 1974 결정, 실제 발급은 1976~81 [S30] |
| 39 | 생일 케이크에 초 (1800~ 서유럽 농가 첫돌) | 186, 1221 | VAGUE-OK | 18세기 독일 귀족 킨더페스트에서 퍼짐. 농가 첫돌은 19세기 후반이 자연스러움 [S31] |
| 40 | 몽골 벽돌차 화폐, 투그릭 1925 | 606, 634 | OK | [S32] [S33] |
| 41 | 서아프리카 마닐라 1500~, 조개 화폐 중세 | 1092–1093 | OK | 마닐라는 15세기부터 이미 쓰임(포르투갈이 퍼뜨린 것은 아님), 니제르 굽이에 중세 조개 화폐 [S34] |
| 42 | 영국령 서아프리카 파운드·실링 1913~, 나이라 1973 | 1102–1103 | OK | 1912 설립 [S35] |
| 43 | 아즈텍 삼각 동맹 1428~1521 | 1147 | OK | [S36] |
| 44 | 사파 잉카 1438~1532, 인티 라이미 1944 재현 | 1178, 1183 | OK | [S37] [S38] |
| 45 | 카리브 설탕 농장 노예제(1500~) | 1270 | VAGUE-OK | 첫 설탕 공장 1504/1516 히스파니올라. 1500~1515는 이르고 타이노가 있었음 [S39] |
| 46 | 아메리카 종두 1803~1806 (발미스 원정) | CONTENT-SOURCES 14, 501 | OK | [S40] |
| 47 | 페루 솔 1863, 브라질 헤알 1994 | 1182, 1260 | OK | 크루제이루 1942는 이번 검색에서 확인 못함 (알려진 연대) [S41] |
| 48 | 메소아메리카 「카카오 콩」 화폐 −8000~ | 1112 | VAGUE-OK | 화폐 용도는 접촉기·마야 고전기 기록. 선사 시대 화폐는 근거 없음 (Minor-9) [S42] |
| 49 | 태평양 통치자 「빅맨」 | 1353 | VAGUE-OK | 멜라네시아(뉴기니) 중심 개념. 폴리네시아는 세습 족장 [S43] |

집계: 49건 중 OK 25 · VAGUE-OK 15 · WRONG 9 (Important로 올린 것 7건: #1~5, #7, #9 / Minor 2건: #23, #36). #6은 VAGUE-OK이지만 I-4에 함께 적었다. 검색하지 않고 「알려진 연대」로 둔 행은 표에 그렇게 적었다.

## 4. Issues

### Critical
없음.

### Important

**I-1. 남아시아 BC 1000 앞에 「바르나와 자티」 신분제와 「~자티」 신분 이름이 나온다**
- 위치: `context_data.js:217–224` (`southasia.ancient`), 같은 틀을 쓰는 `india`·`bengal`·`indus`·`himalaya`·`lanka`; `:870` (스리랑카 −5000 「절」); `:228` (인더스 첫 쌀밥 vs 작물 밀).
- 확인: `contextOf(-6000,'india','farm')` → `sys=바르나와 자티`, `farm=농사짓는 자티`, `ruler=라자`. `contextOf(-2500,'indus','farm')`도 같은 신분제이고 작물은 밀인데 첫돌 줄은 쌀밥이다. `contextOf(-5000,'lanka','farm')` → 성소 「절」.
- 왜 문제인가: 사용자가 콕 집은 「잘못된 카스트·바르나 사용」이다. 바르나는 BC 1200~1000 무렵 이후, 자티는 훨씬 뒤다. 출생 비율로 재면 남아시아 −8000~−1000이 전체 삶의 약 6.9%(고대 남아시아 전체는 약 17%)다. 가장 많이 보이는 오류다.
- 고침: `ZONE_DATA.southasia.spans`에 `S(-I, -1001, { sys: ['씨족과 마을', 'kin groups and villages'], r: {…농사짓는 집·소 치는 집·… 같은 중립 이름…}, w: { ruler: ['마을 어른','village elder'], holy: ['신성한 나무','sacred tree'], first: 보리·밀 죽 같은 중립 줄 } })` 하나를 더하고, `lanka`에 `S(-I,-251,{ holy 불교 아닌 말 })`를 더한다. 바르나·자티는 BC 1000~599부터. 시험도 같이: 남아시아 5개 땅 × BC 1000 앞 해에서 `ranks`·`system`에 「자티」·「바르나」가 없어야 한다.

**I-2. 고대 묶음(−8000~599, 전체 삶의 약 49.5%)의 시대 계단이 일부 문화권에만 있다**
- 위치: `context_data.js` 각 문화권 `ancient` 칸 (`:142`, `:214`, `:280`, `:342`, `:400`, `:469`, `:528`, `:583`) 과 `tech`/`items`(`:351`, `:412`, `:537`, `:593`).
- 확인: 유럽(−601 앞)·한국(−1001 앞)·메소아메리카(−1001 앞)·중국/동아시아 일부(−501·−1500 앞)에만 선사용 span이 있다. 나머지는 −7500에서도 문명 말이 나온다.
  - 서아시아 땅(메소포타미아·이란·아라비아·마그레브·아나톨리아): 「왕」·「은 조각」·「수레바퀴·관개 수로」·「신전」 (수레바퀴는 BC 3500 무렵 이후)
  - 아프리카 4개 땅: 「철 연장」 (BC 500 앞에는 없음)
  - 동남아·태평양: 「청동 북」 (CONTENT-SOURCES.md:163 스스로 「기원전 600년 무렵~」이라고 적었는데 −8000부터 나옴)
  - 초원(몽골·중앙아시아): 「전차」 (BC 2000 무렵 이후)
  - 중국: −7500 「왕 · 귀족과 평민」, 일본: I-1과 같은 병(Jōmon 쌀·신사)
  - 안데스: −7500 「아이유·계단밭·관개 수로」, 아프리카·아메리카: 「토기」 대신 같은 틀 반복
- 왜 문제인가: 삶의 절반이 이 묶음이고, 설계 3.2는 `tech.items`를 「배우기」·「일」 카드 문구에 넣는다고 했다. 사용자의 「시대 반영」 요구가 가장 약한 곳이다.
- 고침: (a) 칸마다 `items`가 `[[해, 목록], …]` 계단을 받게 하거나, (b) 위 땅들에 `S(-I, 해, { items, w, sys })` 선사 span을 한두 개씩 더한다. 시험은 「이 낱말은 이 해 앞에 나오면 안 된다」 표(`ANACHRONISM = [{ word:'청동 북', notBefore:-600 }, …]`)를 40땅 × 해 전수에 돌리면 싸고 효과가 크다.

**I-3. 2차 대전·1차 대전 전쟁 수준이 중립국까지 같게 걸린다**
- 위치: `context_data.js:1424–1426` (`ww1`/`ww2`), `context.js:176` (`lv >= war.level && lv > 0`).
- 확인: `contextOf(1941,'iberia','farm')` → `war 3 · 2차 세계대전`, 같은 해 `nordic`도 3, `australia` 1942 = 3, `korea` 1942 = 3. 반대로 1941 마그레브는 1(북아프리카 전선), 나일·이란도 0(이벤트 지역이 `europe/east/seaoc`뿐). `ww1`은 `warAt`을 쓰면서(`france/east_europe/italy/balkans: 3`) 이베리아·북유럽은 2로 둔다.
- 왜 문제인가: 「땅이 전장」은 설계 3.2에서 징집·약탈·피란 카드를 부르는 눈금이다. 비교전·중립 땅에서 이 카드가 나오면 틀린 시대 묘사다. 사용자가 「전쟁」을 첫 번째로 꼽았다.
- 고침: `ww2: { war: 3, warAt: { iberia: 1, nordic: 1, australia: 1, korea: 1, pacific: 2, … } }`, `ww1`도 이베리아·북유럽 1. 단 `context.js:176`은 `warAt` 값이 기본 전쟁 수준보다 낮으면 무시하므로(0은 「올리지 않음」), 의도를 주석에 적어 둔다. 지역 자체(마그레브·나일·이란 추가)는 events.js를 늘리는 Task 5 몫이다.

**I-4. 아프리카 식민 낱말이 틀린 곳이 있고, 남아공은 정반대 표현이다**
- 위치: `context_data.js:451`·`:459–460` (아프리카 현대/식민 span), `south_africa`·`congo`·`east_africa`는 덮어쓰기가 없음.
- 확인: `contextOf(1920,'congo','farm')` → 화폐 「실링」, 통치자 「총독」, 성소 「예배당」(이슬람·정교회 땅까지 포함). `contextOf(1960,'south_africa','farm')` → `sys=독립 국가의 시민`.
- 왜 문제인가: 콩고 프랑(1887~)이 맞다. 남아공은 1948~94 인종 분리와 1970년 흑인 시민권 박탈이 있었으므로 「독립 국가의 시민」은 사실과 반대다. 에티오피아는 분할기의 식민지가 아니다. 노출은 작지만(콩고 0.05%, 동아프리카 0.10%, 남아공 0.06%) 틀린 사실이 그대로 보인다.
- 고침: `congo` 덮어쓰기(프랑 1887~, 「식민 당국」), `south_africa` 덮어쓰기(1948~1994 「인종 분리 제도(아파르트헤이트)」와 신분 이름, 1910 연방), `east_africa`는 식민 span을 땅 이름 그대로 두되 문장을 「열강의 지배와 독립 왕국」처럼 에티오피아가 걸리게 넓힌다.

**I-5. 북아메리카 1500~1699에 아메리카 근세 칸이 새어 든다**
- 위치: `context_data.js:485–496` (`americas.early`), `:1186–1250` (`north_america`에 `early` 없음), `:1416` (`contact`).
- 확인: `contextOf(1520,'north_america','farm')` → 기술 3, 물건 「쇠 연장 / 화약 / 사탕수수 압착기」, 의술 1, 전쟁 2 「정복 전쟁」. 원주민 농가에 사탕수수 압착기와 화약이 나온다. 안데스 1533~1799도 같은 물건 목록을 상속한다.
- 왜 문제인가: 명시적으로 틀린 물건이고, `contact` 정복 전쟁은 메소아메리카·안데스 일이다.
- 고침: `north_america.early`(1500~1699)에 `tech 1~2`·물건(활과 화살·돌괭이·토기), `contact`에 `warAt: { north_america: 0 }`, `andes.early`에 사탕수수 대신 은광(「포토시 은광」) 물건.

### Minor

1. **풍차 600년부터** (`:163`): 유럽 첫 확실한 풍차는 1185년. 중세 물건 목록을 해 계단으로 하거나 「풍차」를 1100년부터. 「봉건제」(600~)는 9~10세기 이후라 넓은 표현.
2. **「춘절」 고대부터** (`:694`): 이름이 1914~1949년의 것. 고대·중세는 「새해」·「설」, 1912/1949부터 「춘절」.
3. **이베리아·이탈리아 20세기 통치자** : 이베리아는 유럽 산업기 기본(「왕」)을 물려받아 1931~1949에도 「왕」(스페인 공화국·프랑코, 포르투갈 공화국 1910~). 이탈리아는 1946년 공화국이 되었는데 `S(1861,1949)`가 「왕」으로 둠(`:1017`).
4. **서아프리카 1200~1896 전역 「오바」** (`:1097–1100`): 베냉·요루바 칭호. 사헬(말리·송가이)은 다른 칭호. 보고서 필수 예(「베냉 craft = 오바의 길드」)와 동시에 쓰려면 땅 이름을 「나이지리아 남부」처럼 좁히거나 「왕」으로 넓힌다.
5. **벵골 1600~ 이슬람 낱말인데 신분이 「농민 집(자티)」** (`:841` vs 신분): 무슬림 집안에 힌두식 자티 이름이 붙는다. 서벵골 힌두도 사라진다. 신분 이름을 「농민 집」으로 중립화.
6. **남아시아 `serve` = 「가장 낮은 자티」(묶임)** (`:223`, `:234`, `:243`, `:253`): 직업(하인 집안)과 낮은 자티를 한 쌍으로 묶는다. 모든 하인 집안이 가장 낮은 자티는 아니다. 「남의 집에 매인 사람」처럼 중립 이름이 안전.
7. **원주민 낱말이 식민 이후 사라짐** (보고서 걱정거리 2): 북아메리카 1700~, 오스트레일리아 1788~. 카리브 `farm`이 1500~1799 내내 농장 노예(1500~1515 타이노 시기와 쿠바·푸에르토리코 노예제 말기(1873·1886)에 어긋남). 설계 한계로 알려진 것이라 README나 Task 6 카드 조건에 남겨 둘 것.
8. **태평양 「빅맨」·「빚종」** (`:1349–1373`): 멜라네시아 PNG 중심 낱말과 동남아의 빚종을 섞음. 폴리네시아·미크로네시아는 세습 족장. `pacific` 문화권 칸을 「족장·어른」처럼 넓히기.
9. **사소한 짝·시대 어긋남**: 나일 `S(-332,599)`의 `coin` ko 「은화」/ en `drachmas`(짝이 안 맞음, `:890`), 메소아메리카 −8000부터 「카카오 콩」 화폐(`:1112`), 이란 `S(-550, 650)` 「불의 신전」, 케디브 등 사소한 칭호.
10. **영어 낱말 규칙과 실제**: 머리 주석은 「소문자」인데 고유명사(Kaiser, Christmas, Diwali, Eid…)는 대문자다. 카드 글쓴이가 `{Ruler}`를 쓸 때 혼동되지 않게 「고유명사는 대문자」 한 줄을 두 파일 머리 주석에 추가.
11. **CONTENT-SOURCES 제목 일부 틀림**: 「위키백과 '결부제'」는 404, 「삼신할머니」는 실제 제목이 「삼신할미」, 「Gentry (China)」는 「Landed gentry in China」. 보고서가 인정한 대로 제목을 안 열어 본 결과다. 제출 전에 링크 점검(링크 확인 스크립트) 한 번이면 끝난다.
12. **`tech.items`가 묶음 안에서 해 계단이 아님**: 위 I-2의 뿌리. 근세·산업 묶음에서도 한국 조선 1500~1799 「화약·인쇄·나침반」처럼 한 목록을 쭉 쓴다.
13. **시험이 사실의 경계는 거의 안 본다**: 설계 2.3 신분 예와 바이샤 금지만 단언한다. 위 I-1·I-2·I-5는 시험이 못 잡았다. 「ANACHRONISM 표」 전수 시험을 권한다 (I-2 고침 참고).

## 5. Assessment

**구조와 시험은 그대로 쓸 만하고, 자료(context_data.js)를 먼저 한 번 손봐야 한다.**
- 코드 쪽: 결함 없음. 합치기 순서·캐시·토큰 규칙·결정성이 명세대로 동작하고, 시험 17개가 실제 범위를 단언한다. Task 3·4·6이 의존할 `contextOf` 모양은 안정적이다.
- 자료 쪽: 사실 표본 49건 중 틀림 9건, 그중 7건(I-1~I-5로 묶음)이 사용자 눈에 직접 보이는 시대 착오다. 가장 큰 것은 I-1(전체 삶의 약 6.9%에 바르나·자티가 선사 시대로 나옴)과 I-2(삶의 절반인 고대 묶음의 시대 계단 부족)다. 둘 다 span 몇 개와 「이 낱말은 이 해 앞에 금지」 전수 시험으로 해결된다. 구조를 바꿀 필요는 없다.
- 순서 제안: I-1 → I-2 → I-3 → I-4 → I-5를 한 번에 고치고 ANACHRONISM 시험을 붙인 뒤 Task 3으로 간다. Minor는 Task 6 카드 글 쓸 때 같이 정리해도 된다.

## 출처

[S1] https://thewire.in/caste/how-varna-and-jati-were-consolidated · https://www.vedantu.com/history/varnas-and-caste-sytem (리그베다 푸루샤 숙타 BC 1200~1000, 바르나는 이상에 가까움)
[S2] https://en.wikipedia.org/wiki/Mahinda_(Buddhist_monk)
[S3] https://en.wikipedia.org/wiki/Yayoi_period · https://link.springer.com/article/10.1007/s12520-024-01992-9
[S4] https://en.wikipedia.org/wiki/Congolese_franc
[S5] https://en.wikipedia.org/wiki/Bantu_Homelands_Citizenship_Act,_1970 · https://en.wikipedia.org/wiki/Bantustan
[S6] https://en.wikipedia.org/wiki/Italians_of_Ethiopia
[S7] https://en.wikipedia.org/wiki/Spain_during_World_War_II
[S8] https://repositorio.unphu.edu.do/handle/123456789/3384 · https://whc.unesco.org/en/tentativelists/6291/
[S9] https://en.wikipedia.org/wiki/History_of_the_rupee
[S10] https://en.wikipedia.org/wiki/Punch-marked_coins
[S11] https://en.wikipedia.org/wiki/Bengal_Subah · https://en.wikipedia.org/wiki/Khalji_dynasty_(Bengal)
[S12] https://livehistoryindia.com/story/eras/slave-trade-bengal
[S13] https://en.wikipedia.org/wiki/Annaprashana
[S14] https://en.wikipedia.org/wiki/Joseon_Tongbo
[S15] https://www.wikipedia.com/wiki/Gabo_Reform
[S16] https://en.wikipedia.org/wiki/Korean_Empire_won
[S17] https://en.wikipedia.org/wiki/Chinese_New_Year · https://chinaheritage.net/journal/the-dragon-gives-way-to-the-snake/
[S18] https://en.wikipedia.org/wiki/Zhuazhou
[S19] https://en.wikipedia.org/wiki/Hukou · https://cato.org/cato-journal/fall-1996/how-farmers-changed-china-power-people-kate-xiao-zhou
[S20] https://tinytotintokyo.com/first-birthday-traditions-in-japan-isshou-mochi-and-erabitori
[S21] https://www.britannica.com/print/article/573018 · https://en.wikipedia.org/wiki/Tughril_I
[S22] https://arheologia.com.ua/index.php/arheologia/article/view/54 · https://numisview.com/reference/coins/ottoman-empire/empire/akce/early-akce-coinage
[S23] https://en.wikipedia.org/wiki/Khedivate_of_Egypt · https://archontology.org/nations/egypt/01_polity.php
[S24] https://en.wikipedia.org/wiki/Second_plague_pandemic
[S25] https://en.wikipedia.org/wiki/Electrum
[S26] https://iranicaonline.org/articles/fire-altars
[S27] https://folklore.usc.edu/first-tooth-party%E2%80%94armenian/
[S28] https://en.wikipedia.org/wiki/Windmill · https://www.guinnessworldrecords.com/world-records/first-windmills
[S29] https://en.wikipedia.org/wiki/Kopeck · https://en.wikipedia.org/wiki/Serfdom_in_Russia
[S30] https://en.wikipedia.org/wiki/Passport_system_in_the_Soviet_Union
[S31] https://en.wikipedia.org/wiki/Birthday_cake
[S32] https://bankofcanadamuseum.ca/2018/12/tea-brick-currency/
[S33] https://en.wikipedia.org/wiki/Mongolian_t%C3%B6gr%C3%B6g
[S34] https://core.tdar.org/document/475778/before-the-gold-standard-alternative-currencies-in-west-africa
[S35] https://en.wikipedia.org/wiki/West_African_Currency_Board · https://en.wikipedia.org/wiki/Nigerian_naira
[S36] https://historycrunch.com/aztec-triple-alliance/
[S37] https://brewminate.com/tahuantinsuyu-the-rise-and-fall-of-the-inca-empire-1438-1533/
[S38] https://www.wikipedia.org/wiki/Inti_Raymi
[S39] https://repositorio.unphu.edu.do/handle/123456789/3384
[S40] https://en.wikipedia.org/wiki/Balmis_Expedition
[S41] https://en.wikipedia.org/wiki/Peruvian_sol_(1863%E2%80%931985)
[S42] https://www.smithsonianmag.com/arts-culture/what-we-know-about-earliest-history-chocolate-180954243/
[S43] https://en.wikipedia.org/wiki/Big_man_(anthropology)
