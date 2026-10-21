# Task 5 보고 — 실제 사건 100개 이상

상태: **DONE_WITH_CONCERNS**

시험: `( cd docs/past-life && npm test )` → **191개 모두 통과** (events.test.mjs 7 → 15개. 그 밖의 늘어난 시험은 같은 때 돈 다른 작업 몫이다)

## 한 일

| 파일 | 바뀐 것 |
|---|---|
| `docs/past-life/events.js` | 사건 24 → **141개**(새 117). `E(…, start, extra)`에 10번째 인자 `extra`를 더했다. 사건마다 `kind`(war·epidemic·famine·institution·tech·trade)가 있고, 필요한 사건에는 `war`·`warAt`·`warName`·`econ`·`disease`·`after`가 있다. `KINDS`를 내보낸다. 처음 24개의 맥락 값(옛 EVENT_MODS)도 사건에 옮겼고, 값은 그대로다 |
| `docs/past-life/cards_event.js` | 카드 24 → **69장**(새 45). 카드가 붙은 사건이 69개다. 옛 카드 메모의 실명 둘을 고쳤다. 「구텐베르크」는 「마인츠에서」로, 「제너」는 「잉글랜드의 한 시골 의사」로 바꿨다 |
| `docs/past-life/context_data.js` | `EVENT_MODS`를 비웠다(`{}`, 주석 3줄). context.js가 사건 필드를 먼저 읽는 것을 확인했고, context.js는 손대지 않았다 |
| `docs/past-life/CONTENT-SOURCES.md` | 끝에 「## 사건 (events.js, Task 5)」 칸을 붙였다. 사건 id 141개가 한 줄씩 있다. 새 사건 66개는 「확인함」 표시를 달았다 |
| `docs/past-life/test/events.test.mjs` | 사건 수 시험을 바꾸고 새 시험 8개를 더했다(아래) |
| `docs/past-life/test/content.test.mjs` | **울타리 밖이다. 꼭 필요한 두 곳만 고쳤다** (걱정 1) |

### 새 시험 (events.test.mjs)
- 사건이 100개 이상이고 id가 겹치지 않는다. `from < to`이고, 지역·땅 id가 바르고, 처음 24개가 그대로 있다.
- 사건 카드:
  - 카드가 붙은 사건이 50개 이상이다.
  - 카드마다 사건이 있고, 사건마다 카드는 하나 이하다.
  - id는 `ev.<사건>`이고, 단계는 child, minAge는 5 이상이다.
  - 제목·글·메모(note)가 한영 짝으로 있다. 선택지는 2~3개다.
  - 효과는 네 수치뿐이고, 크기는 ±15 안이다.
- 문화권마다 8개 이상, 남아시아·동아시아는 15개 이상이다. 8개 문화권을 다 덮는 세계 사건은 빼고 센다.
- 종류마다 8개 이상이다. 고대(600년 전 시작) 사건은 25개 이상, 중세(600~1499년에 걸침) 사건은 30개 이상이다. 남아시아·동아시아는 1500년 전 사건이 각각 8개 이상이다.
- 맥락 필드 범위:
  - 모르는 필드가 없다.
  - war는 0~3이다. warAt은 그 사건이 덮는 땅만, 0~3으로 쓴다. warName은 한영 짝이다.
  - econ의 price·wage는 0.5~3이다. disease는 DISEASES의 id다.
  - after.years는 1~150이다.
- 위험률:
  - 위험률이 0보다 크면 사인이 있고, 사인이 있으면 위험률도 0보다 크다.
  - 새 사건은 0.05 이하다. 처음 24개는 0.1 이하다(흑사병이 0.10이다).
  - 전쟁 사건이 30개 이상, 유행병 사건이 15개 이상, 값·품삯 사건이 50개 이상이다.
- 한영 짝과 시작 줄:
  - 이름과 시작 줄의 길이가 정해진 만큼을 넘지 않는다.
  - 시작 줄은 첫 문장만으로 뜻이 선다(6자 이상). 모닥불 기억(memory.js clip)이 첫 문장만 쓰기 때문이다.
- 실재 인물 이름 금지 표:
  - 영어 55개, 한국어 48개다.
  - 표가 실제로 잡는지 먼저 본다. 「무사히」·「Musandam」은 잡지 않는다.
  - 사건 이름·시작 줄·전쟁 이름과 카드의 모든 글을 훑는다.
- 출처:
  - 모든 사건 id가 「## 사건」 칸에 정확히 한 줄씩 있다.
  - 줄마다 「 — 출처」가 있다.
  - 새 사건 가운데 「확인함」이 40개 이상이다(지금 66개).
- activeEvents·contextOf 통합:
  - 병자호란은 땅이 전장(3)이고, 전쟁 이름이 「병자호란」이다.
  - 경신 대기근에는 발진티푸스가 돌고 값은 오르고 품삯은 내린다.
  - 덴표 천연두 뒤 20년(738~757) 동안 품삯이 높다.
  - 잉카 정복의 전쟁 이름은 「정복 전쟁」이다.
  - 백년 전쟁은 프랑스 2, 브리튼 1이다.
  - 흉노는 몽골 2, 중국 1이다.
  - 에티오피아 땅은 아프리카 분할에서 뺀다.

## 숫자

- 사건 141개(새 117), 카드가 붙은 사건 69개(새 45), 웹 검색으로 확인한 새 사건 66개.
- 문화권별(세계 사건 빼고): 유럽 27 · 남아시아 27 · 동아시아 42 · 서아시아·북아프리카 24 · 아프리카 13 · 아메리카 15 · 동남아·오세아니아 14 · 초원 15.
- 종류별: 전쟁 50 · 역병 13 · 기근 16 · 제도 26 · 기술 15 · 교역 21.
- 시대: 600년 전에 시작한 사건 32개, 600~1499년에 걸친 사건 43개.
- 새 카드 45장은 남아시아 9, 동아시아 17(한반도 6), 서아시아 5, 아프리카 5, 아메리카 3, 동남아·오세아니아 4, 초원 2, 유럽 3, 세계 1장이다. 몇 장은 두 문화권에 걸친다. 한반도 카드는 브리프 예시(조선 건국·훈민정음·병자호란·대동법·경신 대기근)를 따랐다.
- 생명표 영향: 시드 2만 개로 쟀다(출생 표본에서 건강 50 기준 기대 수명). 처음 24개 사건만 있을 때 e0는 34.63년, 141개일 때 34.53년이다. **차이는 −0.11년**이다. 생명표·여정·15세 전 사망 시험은 고치지 않고 그대로 통과했다.
- 사건을 만나는 생: 태어나서 40년 안에 사건이 하나라도 걸리는 생이 **13.8% → 38.6%**로 늘었다. 새 사건이 걸리는 생은 30.9%다. 1500년 전 출생은 76.8%다.

## 걱정

1. **울타리 밖 수정: `test/content.test.mjs`**
   - 고치기 전 시험은 둘 다 Task 5와 맞부딪혔다. `DECK.length === 55 + 60 + 24 + 24`는 사건 카드를 24장으로 못 박았다. 「사건마다 카드가 꼭 하나」는 설계 3.3의 「50개 이상에만 카드」와 맞지 않았다.
   - 앞 시험은 `55 + 60 + 24 + EVENT_CARDS.length`로 바꿨다.
   - 뒤 시험은 「사건마다 카드는 하나 이하 + 사건 카드의 사건은 있다」로 바꿨다.
   - 다른 줄은 손대지 않았다. Task 6·7이 카드 수를 또 바꾸면 이 줄을 함께 고쳐야 한다.
2. **땅 단위가 넓다.** 한 고장의 일이 땅 전체에 걸린다.
   - 예: 칼링가는 인도 땅 전체에, 베트남 전쟁은 미얀마·타이까지에, 테노치티틀란은 마야 땅까지, 잉카 길은 콜롬비아까지 걸린다.
   - 위험률은 그 땅 사람 전체로 나눈 어림으로 낮게 잡았다.
   - 카드 글은 그 땅 누구에게나 말이 되게 「소식」 꼴로 다듬었다. 다듬은 카드는 무굴, 백년 전쟁, 사하라, 동인도 회사, 베냉이다.
   - 다듬은 내용:
     - 무굴: 벵골에는 자브트가 시행되지 않았다는 출처가 있어, 벵골을 사건에서 뺐다.
     - 베트남 전쟁: 땅 전체로는 전쟁 수준을 2로 낮췄다.
     - 아프리카 분할: 동아프리카 땅은 에티오피아 몫이 커서 넣지 않았다(Task 2 검토 I4와 맞춤).
   - 그래도 완전하지는 않다. 사건 「한 고장」 필드나 땅 안의 비율이 있으면 더 정확해진다(나중 작업).
3. **이름에서 온 사건 이름.**
   - 「안사의 난 / The An–Shi Rebellion」은 인명 음절(안녹산·사사명)에서 온 표준 역사 용어라 그대로 뒀다.
   - 금지 표에는 「안녹산」과 「An Lushan」을 넣었다.
   - 사건 글에는 사람 이름을 하나도 쓰지 않았다. 출처 줄의 위키백과 제목(예: 'Mansa Musa', 'Edicts of Ashoka')은 출처라서 남겼다.
4. **병 id가 없는 경우.**
   - 코로나19는 DISEASES에 id가 없어 `disease`를 두지 않았다(위험률 0.001, 사인 plague).
   - 코코리스틀리는 옛 유골 연구가 살모넬라 파라티푸스 C를 지목해, 게임에서는 `typhoid`로 근사했다.
   - 병 id를 더하는 일은 context_data.js의 다른 칸이라 이번 울타리 밖이다.
5. **확인의 깊이.**
   - 66개는 웹 검색으로 연대·장소를 맞췄다. 결과 가운데 정확한 날짜가 엇갈린 것은 출처 줄에 적어 두었다. 굽타 320~550년, 조선 1392·1394년, 베냉 1486년 첫 사절, 동인도 회사 1799년 해산이 그렇다.
   - 고친 날짜: 베냉 교역은 1487년(우고톤 상관), 라피타는 −1200년, 몽골의 고려 침입은 1231~1259년이다.
   - 나머지 51개는 일반 연표 지식으로 위키백과 제목만 달았다.
6. **사건 카드가 더 자주 나온다.**
   - 사건 카드는 해마다 0.6 확률로 나온다(기본 p, 그대로 뒀다).
   - 카드가 붙은 사건이 69개라, 사건이 몰린 시기·땅에서는 한 생에 사건 카드가 여럿 나올 수 있다. 예: 조선 1600~1710년에는 대동법·병자호란·경신 대기근·새 작물이 겹친다.
   - Task 8 「한 생 돌려 보기」에서 체감을 보길 권한다.
7. `build_share.py`는 돌리지 않았다(울타리 밖). 새로 내보낸 `KINDS`는 묶음기 규칙(`export const`)에 맞는다. ORDER에 context·tokens가 아직 없는 것은 Task 2·3 몫이다.

## 사건 표

열은 id · 해 · 땅([…]는 지역) · 종류 · 위험률 · 전쟁 수준 · 카드 · 웹 확인이다. 앞 24개가 처음부터 있던 사건이고, 「새」 표시가 Task 5의 사건이다.

| id | 해 | 땅 | 종류 | 위험률 | 전쟁 | 카드 | 확인 |
|---|---|---|---|---|---|---|---|
| `drought42` | −2200~−2100 | [west·south] | 기근 | 0.01 |  | ✓ |  |
| `bronze` | −1200~−1150 | [west·europe] | 전쟁 | 0.01 | 2 | ✓ |  |
| `winter536` | 536~541 | [europe·west·east] | 기근 | 0.01 |  | ✓ |  |
| `justinian` | 541~549 | [europe·west] | 역병 | 0.05 |  | ✓ |  |
| `blackdeath` | 1347~1351 | [europe·west] | 역병 | 0.1 |  | ✓ |  |
| `contact` | 1519~1600 | [americas] | 역병 | 0.06 | 2 | ✓ |  |
| `newcrops` | 1550~1700 | [europe·east·south·africa] | 교역 | 0 |  | ✓ |  |
| `imjin` | 1592~1598 | korea | 전쟁 | 0.02 | 3 | ✓ |  |
| `thirty` | 1618~1648 | germany | 전쟁 | 0.02 | 3 | ✓ |  |
| `mingqing` | 1630~1662 | china | 전쟁 | 0.02 | 3 | ✓ |  |
| `slavetrade` | 1600~1850 | west_africa, congo | 전쟁 | 0.01 | 2 | ✓ |  |
| `nosummer` | 1816~1817 | [europe], north_america | 기근 | 0.01 |  | ✓ |  |
| `famine1876` | 1876~1879 | india, china | 기근 | 0.04 |  | ✓ |  |
| `ww1` | 1914~1918 | [europe] | 전쟁 | 0.01 | 2 | ✓ |  |
| `flu1918` | 1918~1920 | [세계] | 역병 | 0.02 |  | ✓ |  |
| `ww2` | 1939~1945 | [europe·east·seaoc] | 전쟁 | 0.02 | 3 | ✓ |  |
| `bengal` | 1943~1944 | bengal, india | 기근 | 0.02 |  | ✓ |  |
| `koreanwar` | 1950~1953 | korea | 전쟁 | 0.03 | 3 | ✓ |  |
| `greatleap` | 1959~1961 | china | 기근 | 0.03 |  | ✓ |  |
| `writing` | −3200~−2000 | mesopotamia | 기술 | 0 |  | ✓ |  |
| `printing` | 1450~1600 | [europe] | 기술 | 0 |  | ✓ |  |
| `factories` | 1780~1900 | [europe] | 기술 | 0 |  | ✓ |  |
| `vaccine` | 1800~1900 | [europe] | 기술 | 0 |  | ✓ |  |
| `antibiotics` | 1945~1965 | [세계] | 기술 | 0 |  | ✓ |  |
| 새 `harappa_trade` | −2600~−1900 | indus, india | 교역 | 0 |  | ✓ | ✓ |
| 새 `pyramids` | −2600~−2500 | nile | 제도 | 0 |  | ✓ | ✓ |
| 새 `chariot` | −2000~−1700 | steppe | 기술 | 0 |  |  |  |
| 새 `law_stele` | −1755~−1700 | mesopotamia | 제도 | 0 |  |  | ✓ |
| 새 `oracle_bones` | −1250~−1046 | china | 기술 | 0 |  |  |  |
| 새 `lapita` | −1200~−800 | pacific | 교역 | 0 |  | ✓ | ✓ |
| 새 `mahajanapada` | −600~−321 | india, bengal | 교역 | 0 |  |  | ✓ |
| 새 `iron_plow` | −500~−221 | china | 기술 | 0 |  | ✓ | ✓ |
| 새 `bantu` | −500~0 | congo, east_africa | 기술 | 0 |  | ✓ | ✓ |
| 새 `athens_plague` | −430~−426 | balkans | 역병 | 0.01 |  |  | ✓ |
| 새 `macedon` | −334~−323 | anatolia, mesopotamia, nile, iran, indus | 전쟁 | 0.003 | 2 |  |  |
| 새 `kalinga` | −262~−261 | india | 전쟁 | 0.003 | 2 |  | ✓ |
| 새 `dhamma` | −260~−232 | india, indus, bengal | 제도 | 0 |  | ✓ | ✓ |
| 새 `lanka_buddhism` | −250~−210 | lanka | 제도 | 0 |  |  |  |
| 새 `qin` | −230~−207 | china | 전쟁 | 0.005 | 2 | ✓ | ✓ |
| 새 `punic2` | −218~−201 | italy, iberia | 전쟁 | 0.005 | 3 |  |  |
| 새 `xiongnu` | −209~−60 | mongolia, china | 전쟁 | 0 | 2 |  |  |
| 새 `silk_road` | −130~200 | china, mongolia, steppe, iran, mesopotamia | 교역 | 0 |  | ✓ | ✓ |
| 새 `gallic` | −58~−50 | france | 전쟁 | 0.01 | 3 |  |  |
| 새 `roman_pepper` | −30~250 | india, lanka | 교역 | 0 |  |  | ✓ |
| 새 `teotihuacan` | 100~550 | mesoamerica | 교역 | 0 |  |  |  |
| 새 `funan` | 100~550 | mainland_sea | 교역 | 0 |  |  |  |
| 새 `antonine` | 165~180 | italy, france, iberia, britain, balkans, germany, anatolia, nile, mesopotamia, maghreb | 역병 | 0.007 |  |  | ✓ |
| 새 `yellow_turban` | 184~205 | china | 전쟁 | 0.008 | 3 | ✓ | ✓ |
| 새 `aksum` | 300~600 | east_africa | 교역 | 0 |  |  |  |
| 새 `gupta` | 320~550 | india, bengal | 기술 | 0 |  | ✓ | ✓ |
| 새 `asuka` | 538~645 | japan | 제도 | 0 |  |  |  |
| 새 `grand_canal` | 605~611 | china | 제도 | 0 |  |  | ✓ |
| 새 `arab_conquest` | 633~651 | mesopotamia, iran, nile | 전쟁 | 0.003 | 2 |  |  |
| 새 `ritsuryo` | 646~710 | japan | 제도 | 0 |  |  | ✓ |
| 새 `silla_unify` | 660~676 | korea | 전쟁 | 0.005 | 3 |  | ✓ |
| 새 `srivijaya` | 670~1025 | indonesia, malay | 교역 | 0 |  |  |  |
| 새 `smallpox735` | 735~737 | japan | 역병 | 0.05 |  | ✓ | ✓ |
| 새 `anlushan` | 755~763 | china | 전쟁 | 0.015 | 3 | ✓ | ✓ |
| 새 `abbasid_baghdad` | 762~900 | mesopotamia, iran | 교역 | 0 |  | ✓ | ✓ |
| 새 `viking` | 793~1000 | britain, france | 전쟁 | 0.001 | 2 |  |  |
| 새 `maya_collapse` | 800~950 | mesoamerica | 기근 | 0.002 |  |  |  |
| 새 `saharan_trade` | 800~1500 | west_africa, maghreb | 교역 | 0 |  | ✓ | ✓ |
| 새 `chola_lanka` | 993~1070 | lanka | 전쟁 | 0.002 | 2 |  |  |
| 새 `ghazni` | 1000~1027 | indus, india | 전쟁 | 0.002 | 3 |  | ✓ |
| 새 `champa_rice` | 1012~1100 | china | 기술 | 0 |  |  | ✓ |
| 새 `song_print` | 1040~1127 | china | 기술 | 0 |  | ✓ | ✓ |
| 새 `song_gunpowder` | 1044~1127 | china | 기술 | 0 |  |  | ✓ |
| 새 `crusades` | 1096~1291 | mesopotamia, anatolia | 전쟁 | 0.002 | 2 | ✓ |  |
| 새 `angkor_build` | 1113~1150 | mainland_sea | 제도 | 0 |  |  |  |
| 새 `delhi_sultanate` | 1206~1290 | india, indus, bengal | 제도 | 0 |  | ✓ | ✓ |
| 새 `mongol_rise` | 1206~1227 | mongolia | 전쟁 | 0.003 | 2 |  | ✓ |
| 새 `mongol_jin` | 1211~1234 | china | 전쟁 | 0.01 | 3 | ✓ | ✓ |
| 새 `khwarazm` | 1219~1221 | steppe, iran | 전쟁 | 0.03 | 3 |  | ✓ |
| 새 `mongol_korea` | 1231~1259 | korea | 전쟁 | 0.005 | 3 |  | ✓ |
| 새 `mongol_baghdad` | 1256~1260 | mesopotamia, iran | 전쟁 | 0.02 | 3 |  | ✓ |
| 새 `mongol_japan` | 1274~1281 | japan | 전쟁 | 0.001 | 2 |  |  |
| 새 `great_famine` | 1315~1317 | britain, france, germany, nordic, east_europe | 기근 | 0.03 |  | ✓ | ✓ |
| 새 `mali_hajj` | 1324~1325 | west_africa, nile, arabia | 교역 | 0 |  | ✓ | ✓ |
| 새 `hundred_years` | 1337~1453 | france, britain | 전쟁 | 0.002 | 2 | ✓ |  |
| 새 `yuan_ming` | 1351~1368 | china | 전쟁 | 0.01 | 3 | ✓ | ✓ |
| 새 `timur` | 1370~1405 | steppe, iran, mesopotamia, anatolia | 전쟁 | 0.004 | 2 |  |  |
| 새 `joseon_found` | 1392~1400 | korea | 제도 | 0 |  | ✓ |  |
| 새 `islam_malacca` | 1400~1511 | malay, indonesia | 교역 | 0 |  |  |  |
| 새 `ming_voyages` | 1405~1433 | china, malay, indonesia, lanka, india, arabia, east_africa | 교역 | 0 |  |  | ✓ |
| 새 `tenochtitlan` | 1428~1519 | mesoamerica | 제도 | 0 |  | ✓ | ✓ |
| 새 `inca_roads` | 1438~1532 | andes | 제도 | 0 |  | ✓ | ✓ |
| 새 `hangul` | 1446~1500 | korea | 기술 | 0 |  | ✓ | ✓ |
| 새 `constantinople` | 1453~1454 | anatolia, balkans | 전쟁 | 0 | 3 | ✓ | ✓ |
| 새 `sengoku` | 1467~1590 | japan | 전쟁 | 0.002 | 2 | ✓ | ✓ |
| 새 `benin_portugal` | 1487~1600 | west_africa | 교역 | 0 |  | ✓ | ✓ |
| 새 `reformation` | 1517~1555 | germany, britain, nordic, france | 제도 | 0 |  |  |  |
| 새 `inca_conquest` | 1532~1572 | andes | 전쟁 | 0.003 | 3 |  |  |
| 새 `nanban` | 1543~1639 | japan | 교역 | 0 |  |  | ✓ |
| 새 `cocoliztli` | 1545~1548 | mesoamerica | 역병 | 0.05 |  |  |  |
| 새 `brazil_sugar` | 1550~1700 | brazil | 제도 | 0 |  |  |  |
| 새 `mughal` | 1556~1605 | india, indus | 제도 | 0 |  | ✓ | ✓ |
| 새 `manila_galleon` | 1565~1815 | philippines | 교역 | 0 |  |  |  |
| 새 `potosi_mita` | 1573~1700 | andes | 제도 | 0.002 |  | ✓ | ✓ |
| 새 `spice_voc` | 1602~1799 | indonesia | 교역 | 0 |  | ✓ | ✓ |
| 새 `daedong` | 1608~1708 | korea | 제도 | 0 |  | ✓ | ✓ |
| 새 `deccan1630` | 1630~1632 | india | 기근 | 0.02 |  |  | ✓ |
| 새 `byeongja` | 1636~1637 | korea | 전쟁 | 0.02 | 3 | ✓ | ✓ |
| 새 `gyeongsin` | 1670~1671 | korea | 기근 | 0.05 |  | ✓ | ✓ |
| 새 `gorkha` | 1743~1775 | himalaya | 전쟁 | 0.002 | 2 |  |  |
| 새 `bengal1770` | 1769~1773 | bengal | 기근 | 0.04 |  | ✓ | ✓ |
| 새 `first_fleet` | 1788~1792 | australia | 역병 | 0.01 |  |  |  |
| 새 `revolution1789` | 1789~1799 | france | 제도 | 0.002 | 2 |  |  |
| 새 `haiti` | 1791~1804 | caribbean | 전쟁 | 0.01 | 3 |  |  |
| 새 `french_empire_wars` | 1803~1815 | [europe] | 전쟁 | 0.002 | 2 |  |  |
| 새 `latam_independence` | 1810~1825 | mesoamerica, andes, la_plata, brazil | 전쟁 | 0.003 | 2 |  |  |
| 새 `tambora` | 1815~1816 | indonesia | 기근 | 0.003 |  |  |  |
| 새 `cholera1817` | 1817~1824 | bengal, india, indonesia, mainland_sea, philippines, china, mesopotamia, iran | 역병 | 0.003 |  |  | ✓ |
| 새 `opium` | 1839~1842 | china | 전쟁 | 0 | 2 | ✓ | ✓ |
| 새 `irish_famine` | 1845~1849 | britain | 기근 | 0.008 |  |  | ✓ |
| 새 `taiping` | 1850~1864 | china | 전쟁 | 0.005 | 3 |  | ✓ |
| 새 `sepoy1857` | 1857~1858 | india | 전쟁 | 0.003 | 2 | ✓ | ✓ |
| 새 `us_civil_war` | 1861~1865 | north_america | 전쟁 | 0.004 | 2 |  |  |
| 새 `serf_emancipation` | 1861~1870 | east_europe | 제도 | 0 |  |  |  |
| 새 `russian_turkestan` | 1865~1885 | steppe | 전쟁 | 0.002 | 2 |  |  |
| 새 `meiji` | 1868~1890 | japan | 제도 | 0 |  |  |  |
| 새 `scramble` | 1884~1914 | west_africa, congo, south_africa | 제도 | 0.002 |  | ✓ | ✓ |
| 새 `rinderpest` | 1889~1897 | east_africa, south_africa | 기근 | 0.012 |  |  | ✓ |
| 새 `congo_rubber` | 1891~1908 | congo | 제도 | 0.008 |  |  |  |
| 새 `plague1896` | 1896~1918 | india, indus, bengal | 역병 | 0.002 |  |  | ✓ |
| 새 `mexican_revolution` | 1910~1920 | mesoamerica | 전쟁 | 0.006 | 3 |  |  |
| 새 `korea_colony` | 1910~1945 | korea | 제도 | 0 |  | ✓ | ✓ |
| 새 `depression` | 1929~1934 | north_america, germany, britain, france, la_plata | 교역 | 0 |  |  |  |
| 새 `kazakh_famine` | 1930~1933 | steppe | 기근 | 0.025 |  | ✓ | ✓ |
| 새 `soviet_famine` | 1932~1933 | east_europe | 기근 | 0.015 |  |  |  |
| 새 `partition` | 1947~1948 | india, indus, bengal | 전쟁 | 0.003 | 2 | ✓ | ✓ |
| 새 `oil_boom` | 1950~1980 | arabia | 교역 | 0 |  |  |  |
| 새 `algeria_war` | 1954~1962 | maghreb | 전쟁 | 0.003 | 3 |  |  |
| 새 `vietnam_war` | 1955~1975 | mainland_sea | 전쟁 | 0.002 | 2 | ✓ |  |
| 새 `independence` | 1957~1975 | west_africa, congo | 제도 | 0 |  |  |  |
| 새 `green_revolution` | 1965~1985 | india, indus, philippines, indonesia | 기술 | 0 |  | ✓ | ✓ |
| 새 `cultural_rev` | 1966~1976 | china | 제도 | 0 |  |  |  |
| 새 `bangladesh1971` | 1971~1972 | bengal | 전쟁 | 0.01 | 3 |  | ✓ |
| 새 `reform_china` | 1978~1992 | china | 제도 | 0 |  |  |  |
| 새 `lanka_civilwar` | 1983~2009 | lanka | 전쟁 | 0.001 | 2 |  |  |
| 새 `hiv_africa` | 1985~2005 | east_africa, south_africa, congo | 역병 | 0.004 |  |  |  |
| 새 `covid` | 2020~2022 | [세계] | 역병 | 0.001 |  | ✓ | ✓ |

---

## 수정 1차 (검토 task-5-review.md: Important 6, Minor 11)

상태: **DONE_WITH_CONCERNS**

시험: `npm test` → **198개 모두 통과**. events.test.mjs는 15 → 19개다.

`life.js`·`context.js`·`deaths.js`는 손대지 않았다. 고친 파일은 `events.js`·`cards_event.js`·`CONTENT-SOURCES.md`·`test/events.test.mjs`다.

### Important

| # | 고친 것 |
|---|---|
| I1 `vietnam_war` | 카드를 「소식과 피란민」 꼴로 다시 썼다. 제목 「긴 전쟁의 소식」, 글 「라디오마다 전쟁 소식… 폭격을 피해 길을 떠난 사람들이 이 고장까지」. 선택지는 「피란민을 맞아 준다 / 식구와 도시로 떠난다 / 하던 일을 한다」로, 미얀마·타이·베트남 어디서나 된다. 폭격 구덩이·땅굴은 뺐다. 위험률은 땅 평균 0.002, 전쟁 수준은 2 그대로다 |
| I2 `partition` | 「소식과 피란민」 꼴: 「나라를 둘로 가른대요. 새 국경으로 가는 기차마다… 이 고장에도 피란민이 닿았어요」. 선택지는 「피란민을 맞아 준다 / 먼 친척을 찾아 나선다(확률, 「다른 신을 믿는 이웃이 숨겨 줬대요」를 살림) / 하던 일을 한다」다. 땅을 북인도만으로 좁힐 수 없어(`india`에 남인도와 동펀자브가 함께 있다) 사건을 둘로 쪼개지 않았다 |
| I3 `spice_voc` | 제목은 「회사가 정한 값」이다. 글은 「회사가 정한 값에, 정한 양만큼 팔고 바쳐야 한대요. 향신료 섬에서는 몰래 판 집의 나무까지 베었대요(소문)」로 바꿨다. 선택지 「정한 양을 바친다 / 다른 배에 몰래 판다」의 실패 결과도 「벌금을 물고 밭까지 빼앗겼어요」로 바꿨다 |
| I4 `korea_colony` | 사건을 쪼갰다. 새 사건 `korea_land_survey`(1910~1918)에 토지 조사 카드(`ev.korea_land_survey`)를 붙였다. `korea_colony`(1910~1945)는 카드 없이 맥락만 남겼고, 시작 줄은 「총독부가 들어선대요」다. 출처 줄도 한 줄 더 썼다. 사건은 142개, 카드가 붙은 사건은 69개 그대로다 |
| I5 나이·성별 | 아래 「카드 69장 나이·성별 점검」 |
| I6 사망 줄 | `potosi_mita`의 사인을 `accident`에서 `lung`으로 바꿨다(「기침이 몇 해 동안 따라다녔어요」, 규폐·수은 중독). `congo_rubber`는 `hunger`에서 `war`로 바꿨다(「군대가 마을을 지나갔어요. 당신은 그 길 위에 있었어요」, 무장 단속의 폭력). 새 사건의 사인은 모두 `deaths.js`의 사망 줄과 `i18n.js`의 「…으로 세상을 떠났어요」에 대 보았다. 나머지(war·plague·hunger·lung)는 맞아서 그대로 뒀다. 기근의 hunger 「그해 곡식이 모자랐어요. 당신 몫도」는 사람이 만든 기근(카자흐·소련)에도 놀림 없이 읽혀 그대로 뒀다 |

### 카드 69장 나이·성별 점검

사건 카드는 `when.minAge`만 읽힌다. `life.js`는 minAge가 될 때까지 카드를 아껴 둔다.
- **minAge 15로 올림 (13장):**
  - harappa_trade(배를 따라감), pyramids(공사장), lapita(카누), qin(부역)
  - silk_road(대상), yellow_turban(봉기), saharan_trade(사막 건너기), hundred_years(종군)
  - yuan_ming(둑 노역), inca_roads(미타), sengoku(창), potosi_mita(광산), scramble(농장 품팔이)
- **minAge 12 (1장):** crusades(바닷가 성으로 장사하러 감).
- **선택지를 누구나 고를 수 있게 바꿈:**
  - `qin`: 「집안 몫으로 간다 / 떠나는 이의 짐을 꾸린다 / 산으로 달아난다」
  - `pyramids`: 「공사장 일을 거든다」, 결과에 빵 굽는 화덕
  - `hundred_years`: 징집 대신 「군대를 따라나선다」(종군 상인·세탁부도 따라갔다), 「세금을 내고 집에 남는다」, 활쏘기 대신 「곡식을 땅에 묻어 둔다」
  - `inca_roads`: 「일꾼들의 밥과 술을 짓는다」를 더함
  - `potosi_mita`: 「식구와 함께 은산으로 간다」(식구가 따라간 사실을 메모에 더함)
  - `mongol_jin`: 「항복하자는 쪽에 선다 / 장인 식구들 틈에 선다」
  - `mali_hajj`: 두 해짜리 사건이라 나이는 올리지 않았다. 짐꾼·금 팔기 대신 「행렬에 물과 대추야자를 판다 / 언젠가의 순례를 꿈꾼다」
  - `joseon_found`: 도성 공사 대신 「새 도읍 구경을 간다」
  - `tenochtitlan`: 「공물을 함께 마련한다 / 호수 위 도시에 가 본다」
  - `opium`: 「식구와 항구로 옮겨 간다」
  - `covid`: 「일하러 나간다」를 「평소처럼 나다닌다」로
  - `vietnam_war`·`partition`: 위 I1·I2
- **성별 중립:** `song_print`의 「과거 공부」(남자 몫)는 「책을 읽고 글을 익힌다 / 책 장사를 거든다」로 바꿨다. 글은 「집에도 책을 한 권 들이재요」다. `gupta` 영어의 `he`도 뺐다.
- **그대로 둔 카드:**
  - 처음 24장: 집안의 결정·거들기·망보기 원칙에 맞다. 「공장으로 간다」는 아이 노동이 실제 있었다.
  - 집안 살림 카드(iron_plow·bantu·great_famine·mughal·delhi_sultanate·daedong·spice_voc·bengal1770·korea_land_survey·green_revolution): 옛 카드 nosummer·thirty처럼 「집안의 결정」으로 읽힌다.
  - 15살 카드의 「창을 들고 나선다」·「두건을 받는다」 같은 남자 몫 선택지: 같은 카드에 누구나 고를 수 있는 선택지가 함께 있다.
- **시험이 지킨다:** 15살 카드 13장의 minAge, 아이도 보는 새 카드에 「징집·부역·창을 들·과거 공부·품을 팔」이 없음, 토지 조사 카드가 1918년에 끝나는 사건에 붙음.

### Minor

- **M1 테노치티틀란:** 「…공물을 매긴다는 소식이에요」로 바꿨다.
- **M2 십자군:** 「바닷가 성들을 에워쌌대요. 피란민이 안쪽 고을로」로 바꿨고, 선택지는 「피란민을 맞아 준다 / 바닷가 성으로 장사하러 간다」다.
- **M3 시대 어긋남:**
  - `delhi_sultanate`: 「밭을 다시 재고」 대신 「거둘 몫을 새로 정한대요」로 바꾸고, 소식 꼴과 「페르시아 말을 배워 본다」로 고쳤다.
  - `gupta`: 영 기호(점)를 빼고 「자리만 바꿔 놓으면」으로 바꿨다. 「점은 주사위에나」는 「모자라면 조약돌」로 바꿨다.
  - `constantinople`: 메모와 결과에 강제 이주를 더했다.
  - `qin`: 「북쪽 성벽 공사」 대신 「나라의 큰 공사」로 바꿨다.
  - `abbasid_baghdad`: 794년 전에는 종이가 없으니 「책을 베껴 파는 공방」과 「장터에서 책을 판다」로 바꾸고, 「새 도읍」 대신 「둥근 성벽의 도시」로 고쳤다.
  - `mughal`: 「측량 관리들이 고을마다 돈대요」(소식 꼴)로 바꿨다.
- **M4 전쟁 수준:** `constantinople`과 `algeria_war`를 3에서 2로 낮췄다. `kalinga`·`ghazni`는 검토 권고대로 그대로 뒀다(Task 6 때 다시 본다).
- **M5 금지 표:** 영어 16개(Qin Shi Huang·Justinian·Muhammad·Hong Taiji·Prithvi Narayan·Mahinda·Wiman·Injo·Yi Seong-gye·Taejo·Kangxi·Qianlong·Yongle·Lin Zexu·Toyotomi·Oda Nobunaga)와 한국어 19개(이성계·인조·진시황·정화 함대·정화가·알렉산더·징기스칸·홍타이지·유스티니아누스·무함마드·프리트비·마힌다·위만·태조·강희제·건륭제·영락제·임칙서·도요토미)를 더했다. 영어는 71개, 한국어는 67개가 됐다.
  - 걸린 것: 처음 24개의 `justinian` 사건 이름과 그 카드 제목.
  - 「541년 역병 / The plague of 541」로 바꿨다. 사건 id는 그대로다.
  - CONTENT-SOURCES에 방침 한 줄을 넣었다. 사람 이름이 그대로 든 이름은 바꾼다. 「안사의 난」처럼 성을 한 자씩 딴 표준 역사 용어는 둔다.
- **M6:** 출처 줄 `[id 해~해 · …]`와 `from/to`를 맞추는 시험을 더했다.
- **M8:** 「우리 마을 / 우리 양 떼」를 「이 마을 / 집안의 양 떼」로 바꿨다(영어 `our`도).
- **M9:** 합계 보정 시험을 더했다. 시드 3천 개로, 사건을 넣은 e0가 사건 없는 e0보다 0.5년 넘게 낮지 않다. 지금 차이는 약 −0.1년이다.
- **M10:** `first_fleet` 위험률을 0.01에서 0.005로 낮췄다. 땅에 뉴질랜드가 끼어 있기 때문이다.
- **손대지 않음:**
  - M7 `EVENT_MODS` 죽은 코드: Task 2·3과 함께 정리한다.
  - M11 CRLF: 이 작업의 파일은 Python으로 세면 모두 LF(CR 0)다. 검토 스냅샷이 CRLF로 보인 것은 스냅샷 복사 쪽 일로 보인다.

### 바뀐 숫자

- 사건 142개(새 118), 카드가 붙은 사건 69개(새 45), 웹 확인 새 사건 67개(`korea_land_survey` 포함).
- 문화권별: 동아시아 43, 나머지는 그대로다.
- e0 차이 −0.11년(시드 2만 개). 40년 안에 사건을 만나는 생 38.6%로, 그대로다.

새 사건 행:

| id | 해 | 땅 | 종류 | 위험률 | 전쟁 | 카드 | 확인 |
|---|---|---|---|---|---|---|---|
| 새 `korea_land_survey` | 1910~1918 | korea | 제도 | 0 |  | ✓ | ✓ |

위 사건 표의 바뀐 값: `korea_colony` 카드는 이제 없다. `constantinople`·`algeria_war`·`vietnam_war`의 전쟁 수준은 2다. `first_fleet` 위험률은 0.005다. `potosi_mita` 사인은 lung, `congo_rubber` 사인은 war다. `mughal`은 india·indus만 덮는다.

### 남은 걱정

1. **땅 단위의 뿌리 문제는 그대로다.** 카드를 「소식」 꼴로 다듬어 틀린 장면은 지웠다. 하지만 전쟁 수준·위험률은 여전히 땅 전체에 걸린다(베트남 전쟁의 미얀마·타이, 분할의 남인도·아프가니스탄). 사건의 「한 고장」 필드나 땅 안 비율을 Task 6 앞에 넣기를 권한다.
2. **사건 카드가 해 조건을 읽지 않는다.** `life.js`가 `minAge`만 본다. 이번에는 사건을 쪼개서 피했다. 뿌리 처방(`life.js`가 `when.minYear·maxYear·sex`를 읽게 하는 일)은 `life.js`를 맡은 쪽에 넘긴다.
3. **15살로 올린 카드는 그 전에 사건이 끝나면 못 본다.** 예: 1336년에 태어난 아이는 백년 전쟁 카드를 1351년부터 본다. 그 앞 아이 시절의 일은 시작 줄과 맥락으로만 남는다. 두 해짜리 `mali_hajj`는 그래서 나이를 올리지 않고 선택지를 바꿨다.
4. **「안사의 난」을 둔 판단은 방침 한 줄에 기대고 있다.** 코디네이터가 이것도 바꾸길 원하면 「당 북방 장군의 난」 같은 이름으로 한 줄 고치면 된다.
