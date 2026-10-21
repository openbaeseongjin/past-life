# 작업 7 · 남아시아 고유 묶음 보고 (SA 작성자)

- 상태: **DONE_WITH_CONCERNS**
- 시험: `npm test` 263개 중 262개 통과. 실패 1개는 `content.test.mjs` 「카드 수와 id」(DECK.length를 208로 못 박음, 지금 324)다. 컨트롤러가 고치기로 한 것이다. 내 시험 `test/local_sa.test.mjs` 10/10 통과.

## 바꾼 파일 (이 넷만)
- `docs/past-life/cards_local_sa.js`: `LOCAL_CARDS_SA` 27장
- `docs/past-life/lines_local_sa.js`: `LOCAL_LINES_SA` 40줄
- `docs/past-life/CONTENT-SOURCES-local-sa.md`(새 파일): 카드·줄 묶음마다 한 줄씩 사실과 공개 출처. 「넓은 표현」 표시 포함
- `docs/past-life/test/local_sa.test.mjs`(새 파일): 시험 10개

## 수 (설계 4.2 표 대비)
| 조합 | 카드 (표) | 줄 (표) |
|---|---|---|
| 남아시아 마을 (farm) | 11 (10) | 15 (12) |
| 남아시아 큰 집 (elite 앞마당 4 · serve 뒤뜰 3) | 7 (6) | 10 (8), elite 5 · serve 5 |
| 남아시아 거리 (craft·trade·shop·pro·office) | 5 (5) | 8 (6) |
| 남아시아 야영지 (band 2 · herd 2) | 4 (4) | 7 (6) |

## 규칙 지킴
- 모든 카드·줄에 `when.zones: ['southasia']`와 `setting`이 있고, 시대 조건(`eraGroups`나 `minYear`·`maxYear`)도 있다. 필요한 곳에는 `areas`·`tags`(elite/serve/craft/trade/herd)를 달았다.
- 선택지 `when`은 6개다: 글 `minKnow: 60` 4개(대금업자 장부·순례기·궁정 시·조합 장부), 나이 `minAge: 15` 1개(소 찾기), 매인 몸 `bound: false` 1개(빚에 매인 하인의 「떠난다」). **첫 선택(0번)에는 `when`을 두지 않았고, 시험이 이를 확인한다.**
- `ill: true`는 뱀에 물림, 벼랑 벌집(떨어져 다침) 두 장에 달았다. `skill: 'heal'`이나 `risk: 'plague'` 선택은 없다.
- 새 효과 키는 아껴 썼다. know·charm·skill·luck은 ±1~6이다. `status`는 둘뿐이다: 빚 문서를 태우면 +1, 해 질 녘 경매에 영지를 잃으면 −1.
- 자리 글은 `{home}·{healer}·{coin:이}·{ruler}·{crop}·{holy}·{school:으로}·{feast}·{market}·{beast:이}·{cloth}·{land:으로}`다. 남아시아 5개 땅 × 50년 간격 해 × 집안 맥락 전부에서 엄격 채우기를 거쳤다(빈 `{}` 0개, `the the` 0개). 거리·큰 집처럼 산업·현대의 농사 안 짓는 집에 닿는 글에는 밭·짐승 낱말을 쓰지 않았다.
- 실재 인물 이름은 쓰지 않았다. 시험의 금지 표에 남아시아 인물 50여 명을 더했다.
- 고통스러운 제도는 그 자리 사람의 눈으로 담담하게 썼다.
  - 우물가 불가촉 차별: 마을 아이의 눈
  - 빚에 매인 하인
  - 흉년 구호 공사의 돌 깨기
  - 천장 부채 줄 당기는 하인
  - 해 질 녘 법에 걸린 지주

## 실제 생 노출 (자동 결정, 남아시아 생 1,000개)
| 자리 | 본 카드 가운데 남아시아 고유 | 본 줄 가운데 고유 |
|---|---|---|
| 마을 (570생) | 21.8% | 9.9% |
| 큰 집 (117생) | 9.0% | 8.6% |
| 거리 (131생) | 6.2% | 4.5% |
| 야영지 (118생) | 8.1% | 8.8% |
| 전체 남아시아 | 15.2% | 8.3% |

남아시아 밖 생 150개에서 남아시아 고유 카드·줄이 새어 나온 것은 0이었다(시험). 가중치(`weight`)는 기본값 그대로 두었다. 작은 조합(큰 집·거리·야영지)은 카드가 시대·단계로 흩어져 있어 비율이 낮다. 4.4 목표를 맞출 때 컨트롤러가 `weight: 2~3`을 주면 바로 오른다.

## 카드·줄 표
| id | 조합 | 시대 | 땅 | 한 줄 요지 |
|---|---|---|---|---|
| loc.sa.village.shave | 마을 (baby) | 기원전 800~ | india, himalaya | 첫 머리 깎기, 정수리 한 줌 |
| loc.sa.village.dung | 마을 (child) | 기원전 5000~ | 전체 | 소똥 땔감을 빚어 {home} 벽에 붙이기 |
| loc.sa.village.alms | 마을 (child) | 기원전 450~1200 | india, bengal, himalaya, lanka | 탁발 스님에게 밥 담기 (luck +2) |
| loc.sa.village.well | 마을 (child) | 300~1949 | india, bengal, himalaya | 우물에 손댈 수 없는 아이에게 물 길어 주기 |
| loc.sa.village.raid | 마을 (teen) | 기원전 1500~600 | india, indus | 리그베다 「소를 찾아 나서기」 (따라나서기 minAge 15) |
| loc.sa.village.dowry | 마을 (teen/adult) | 기원전 500~ | 전체 | 한 지붕 사촌의 혼수 |
| loc.sa.village.snake | 마을 (adult/middle) ill | 기원전 5000~ | 전체 | 몬순 저녁 뱀에 물림, {healer} |
| loc.sa.village.lender | 마을 (adult/middle) | 기원전 300~1949 | 전체 | 대금업자 장부 (글 알면 이자 칸 읽기) |
| loc.sa.village.revenue | 마을 (middle) | 기원전 300~1949 | 전체 | {ruler}의 관리가 {crop} 몫을 매김 |
| loc.sa.village.pilgrim | 마을 (middle/old) | 기원전 500~ | 전체 | 먼 {holy} 순례 (fulfill travel, 글 알면 순례기) |
| loc.sa.village.weights | 마을 (adult/middle) | 기원전 2600~1900 | indus, india | 하라파의 같은 저울추로 목화 달기 |
| loc.sa.estate.guru | 큰 집 앞마당 (child) | 기원전 800~1800 | 전체 | {school}에서 한 자도 틀리지 않고 외기 |
| loc.sa.estate.door | 큰 집 뒤뜰 (child) | 기원전 800~1947 | 전체 | 주인집 아이 공부를 문 뒤에서 듣기 |
| loc.sa.estate.court | 큰 집 앞마당 (adult/middle) | 기원전 600~1757 | 전체 | {ruler} 궁정에 선물 (글 알면 시) |
| loc.sa.estate.kitchen | 큰 집 뒤뜰 (teen/adult) | 기원전 1000~1947 | 전체 | {feast} 날 부엌의 단과자 |
| loc.sa.estate.bond | 큰 집 뒤뜰 (adult/middle) | 기원전 600~1949 | 전체 | 아버지 빚에 매인 몸 (떠나기 bound:false, 문서 태우면 status +1) |
| loc.sa.estate.sunset | 큰 집 앞마당 (adult/middle) | 1793~1947 | bengal, india | 영구 정액제 「해 질 녘 법」 경매 (잃으면 status −1) |
| loc.sa.estate.seal | 큰 집 앞마당 (teen/adult) | 기원전 2600~1900 | indus, india | 집안 도장 그림 고르기 (외뿔 짐승·코뿔소·코끼리) |
| loc.sa.street.beads | 거리 craft (child/teen) | 기원전 2600~1700 | indus, india | 홍옥수 긴 구슬을 양쪽에서 뚫기 |
| loc.sa.street.guild | 거리 (teen/adult) | 기원전 600~1800 | 전체 | 슈레니 조합 가입 (글 알면 장부) |
| loc.sa.street.road | 거리 (adult/middle) | 기원전 500~1850 | india, indus, bengal | 북쪽 큰길 소달구지 행렬 / 동네 {market} |
| loc.sa.street.millcloth | 거리 craft (adult/middle) | 1855~1947 | india, bengal, indus | 기차로 온 바다 건너 공장 천 |
| loc.sa.street.tiffin | 거리 (adult/middle) | 1950~ | india | 절대 안 바뀐다던 배달 도시락이 바뀜 |
| loc.sa.camp.honey | 야영지 band (teen/adult) ill | 수렵 | 전체 | 벼랑 벌집 꿀 따기 (risk heights) |
| loc.sa.camp.mahua | 야영지 band (child) | 수렵 | india, bengal | 곰보다 먼저 마후아 꽃 줍기 |
| loc.sa.camp.pasture | 야영지 herd (teen/adult) | 고대 | 전체 | 건기 먼 풀밭으로 {beast} 떼 (risk beast) |
| loc.sa.camp.ashmound | 야영지 herd (adult/middle) | 기원전 3000~1200 | india | 데칸 신석기 잿더미에 불 놓는 날 |
| l.loc.sa.v.drill | 마을 줄 | 기원전 7000~5500 | indus | 메르가르 활비비로 이 뚫기 |
| l.loc.sa.v.bricks | 마을 줄 | 기원전 2600~1900 | indus, india | 도시 벽돌 크기가 다 같음 |
| l.loc.sa.v.hymn | 마을 줄 | 기원전 1500~500 | india, indus | 사제가 베다를 틀림없이 욈 |
| l.loc.sa.v.transplant | 마을 줄 | 기원전 1000~ | 벼 땅 4곳 | 모내기 노래 |
| l.loc.sa.v.neem | 마을 줄 | 기원전 1000~ | india, bengal, indus, lanka | 님나무 가지로 이 닦기 |
| l.loc.sa.v.banyan | 마을 줄 | 기원전 3000~ | 전체 | 반얀나무 아래 노인들 |
| l.loc.sa.v.cart | 마을 줄 | 기원전 2600~ | 전체 | 진창에 빠진 소달구지 |
| l.loc.sa.v.wheel | 마을 줄 | 1300~1950 | indus, india | 눈 가린 소가 페르시아 수차를 돌림 |
| l.loc.sa.v.tank | 마을 줄 | 기원전 300~1500 | lanka | 마을 저수지(웨와) 둑 손보기 |
| l.loc.sa.v.relief | 마을 줄 | 1877~1945 | india, bengal, indus | 흉년 구호 공사에서 돌 깨기 |
| l.loc.sa.v.pump | 마을 줄 | 1975~ | 전체 | 손 펌프, 수다가 옮겨 감 |
| l.loc.sa.v.cricket | 마을 줄 | 1961~ | 전체 | 라디오 크리켓 중계 |
| l.loc.sa.v.monsoon | 마을 줄 | 기원전 1000~ | 벼 땅 4곳 | 첫 몬순 구름에 {land}로 |
| l.loc.sa.v.share | 마을 줄 | 600~1900 | india, bengal, himalaya | 대장장이·도공이 추수 몫 받기 |
| l.loc.sa.v.boat | 마을 줄 | 기원전 500~ | bengal | 배 타고 {market}에 |
| l.loc.sa.e.fan | 큰 집 앞마당 줄 | 기원전 1000~1947 | 전체 | 부치는 사람이 졸면 바람도 졺 |
| l.loc.sa.e.smoke | 큰 집 뒤뜰 줄 | 기원전 2000~1947 | 전체 | 부엌 연기 너머 앞마당 노래 |
| l.loc.sa.e.elephant | 큰 집 앞마당 줄 | 기원전 500~1857 | 전체 | 축제 행렬 코끼리 |
| l.loc.sa.e.palm | 큰 집 뒤뜰 줄 | 기원전 300~1850 | 전체 | 버린 야자잎 책장 줍기 |
| l.loc.sa.e.stars | 큰 집 앞마당 줄 | 기원전 500~1947 | 전체 | 점성가의 좋은 말 |
| l.loc.sa.e.sweep | 큰 집 뒤뜰 줄 | 기원전 2000~1947 | 전체 | 새벽 마당 쓸기 |
| l.loc.sa.e.persian | 큰 집 앞마당 줄 | 1206~1837 | india, indus, bengal | 페르시아어 시 외기 |
| l.loc.sa.e.punkah | 큰 집 뒤뜰 줄 | 1760~1910 | india, bengal | 밤새 천장 부채 줄 당기기 |
| l.loc.sa.e.seal | 큰 집 앞마당 줄 | 기원전 2600~1900 | indus, india | 진흙에 집안 도장 |
| l.loc.sa.e.babyback | 큰 집 뒤뜰 줄 | 기원전 2000~1947 | 전체 | 어머니가 주인집 아기를 업은 동안 |
| l.loc.sa.s.kiln | 거리 craft 줄 | 기원전 2600~1900 | indus, india | 틀 하나로 구운 벽돌 |
| l.loc.sa.s.hammer | 거리 craft 줄 | 기원전 1000~1850 | 전체 | 스승 망치 박자 |
| l.loc.sa.s.spice | 거리 trade 줄 | 600~1850 | 전체 | 향신료 골목 재채기 |
| l.loc.sa.s.cloth | 거리 craft 줄 | 기원전 500~1850 | 전체 | {cloth} 한 필 |
| l.loc.sa.s.telegraph | 거리 줄 | 1855~1947 | india, bengal, indus, lanka | 글자 수대로 값을 받는 전신 |
| l.loc.sa.s.rail | 거리 줄 | 1860~1947 | india, bengal, indus | 철길로 사흘 |
| l.loc.sa.s.filmsong | 거리 줄 | 1950~ | 전체 | 가게 라디오 영화 노래 |
| l.loc.sa.s.powercut | 거리 줄 | 1970~ | 전체 | 정전에 등잔불 |
| l.loc.sa.c.shelter | 야영지 band 줄 | 수렵 | 전체 | 바위 그늘 그림이 불빛에 흔들림 |
| l.loc.sa.c.blades | 야영지 band 줄 | 수렵 | 전체 | 잔석기 화살 |
| l.loc.sa.c.rhino | 야영지 band 줄 | 수렵 | india, bengal, indus | 코뿔소 발자국 |
| l.loc.sa.c.honeysong | 야영지 band 줄 | 수렵 | 전체 | 벌 달래는 노래 가르치기 |
| l.loc.sa.c.voice | 야영지 herd 줄 | 고대 | 전체 | {beast} 울음소리로 알아보기 |
| l.loc.sa.c.calf | 야영지 herd 줄 | 고대 | 전체 | 송아지에게 받힘 |
| l.loc.sa.c.rain | 야영지 herd 줄 | 고대 | 전체 | 첫 비 냄새에 소가 먼저 고개 듦 |

## 시험 (`test/local_sa.test.mjs`, 10개)
1. 조합마다 카드·줄 수가 표 이상이다. id는 하나뿐이고 접두사가 맞으며, deck.js·lines.js에 이어 붙었다.
2. 모든 카드·줄에 zones southasia + setting + 시대 조건이 있고, 땅은 남아시아 땅이다.
3. 한·영 글이 다 있고 길이 제한을 지킨다. 흔적 키(skill·risk·fulfill)가 바르다.
4. 남아시아 모든 맥락에서 자리 글을 엄격 채우기로 다 채운다. `tokens` 표시가 맞고, 카드·줄마다 나올 맥락이 있다.
5. 카드마다 실제 맥락(나이·능력치·신분 포함)에서 고를 수 있다. **첫 선택은 잠기지 않는다.**
6. 선택지 조건이 3개 이상이고, 글 60은 둘 이상, bound:false가 있다. heal·plague 선택이 있는 카드는 ill이다.
7. 큰 집 앞마당·뒤뜰이 카드·줄 모두 둘 이상씩 있다.
8. 마을 카드는 고대~현대에 다 닿고, 조합마다 고대·수렵 카드가 있다. 고대·중세에 닿는 카드가 절반을 넘는다.
9. 실재 인물 이름이 없다. 금지 표가 실제로 잡는지도 먼저 확인한다.
10. 자동 결정 생(남아시아 250 + 다른 곳 150): 고유 카드 ≥10%, 고유 줄 ≥5%, 네 자리 다 보이고, 남아시아 밖으로 새지 않는다.

## 우려
1. **`content.test.mjs` 「카드 수와 id」**가 DECK.length를 208로 못 박아 실패한다. 네 작성자 카드가 다 들어가 지금은 324다. 컨트롤러가 고치기로 했다.
2. **첫 선택 잠금**: 작업 중 전체 `npm test`가 600초를 넘겨 멈춘 적이 한 번 있었다.
   - 원인 후보는 `choose(life, 0)`으로 덱을 도는 시험이다(memory.test 344줄, life.test 72줄 등). 0번 선택이 잠기면 같은 카드가 영원히 남는다.
   - 확인 당시 덱 전체에서 0번에 `when`이 있던 카드는 `loc.ea.village.exam`(minKnow 60) 하나였다(EA 작성자 파일). 그 뒤 전체 시험은 정상으로 돌았다(262/263).
   - 남아시아 카드는 0번에 조건이 없고, 시험이 이를 지킨다.
3. **노출 비율**: 가중치는 기본값이다. 큰 집·거리·야영지에서 고유 카드 비율이 6~9%에 그친다. 4.4 목표(공통 ≤20%, 문화권 사이 겹침 ≤8%)를 맞출 때 `weight` 조정이 필요할 수 있다.
4. **넓은 표현으로 쓴 것**: 자즈마니(이름 없이 썼다), 혼수, 소똥 땔감, 마후아를 수렵 시대에 쓴 일, 잿더미 언덕의 쓰임새, 손도장 대신 「장부에 이름을 올린다」. 웹 검색으로 연대를 못 박지 못한 것이 몇 있다(구슬 뚫는 데 걸린 날 수, 전신 일반 개방 해). 「오래」, 「1855년 무렵」처럼 일반적인 말로 썼다.
5. **아키카**: 남아시아 무슬림 땅(인더스 1200년 뒤·벵골 1600년 뒤)의 첫 머리 깎기는 태어나 이레째라 2~4살 아기 카드에 맞지 않는다. 그래서 「첫 머리 깎는 날」은 인도 평원·히말라야만 받는다.
