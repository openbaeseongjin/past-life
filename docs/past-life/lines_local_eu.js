// 땅·자리 고유 작은 일 줄 (시뮬 2.0 설계 4.2, 작업 7 · 유럽 + 서아시아·북아프리카 몫)
// 카드와 같은 when 규칙: zones + setting + 시대(eraGroups 나 minYear·maxYear), 필요하면 areas·tags.
// 무거운 일(병·죽음)과 숫자·나이는 쓰지 않는다. 출처는 CONTENT-SOURCES-local-eu.md
const EU = ['europe'];
const MB = ['mudbrick'];
const CAMP = ['mudbrick', 'steppe'];
const ROMAN = ['italy', 'france', 'iberia', 'balkans'];
const ISLAMIC = ['mesopotamia', 'nile', 'iran', 'arabia', 'maghreb'];
const ALL = ['child', 'teen', 'adult', 'middle', 'old'];
const GROWN = ['adult', 'middle', 'old'];

export const LOCAL_LINES_EU = [
  // ── 유럽 마을 (europe · village) ─────────────────────────────────
  // 선돌 (거석 시대의 브리튼·브르타뉴·이베리아·북쪽)
  { id: 'l.loc.eu.village.stones', stage: ['child', 'teen', 'adult'], when: { zones: EU, setting: 'village', areas: ['britain', 'france', 'iberia', 'nordic', 'germany'], minYear: -3500, maxYear: -1200 },
    text: { ko: '한겨울 아침, 선돌 사이로 해가 떠오르는 걸 다 같이 지켜봤어요.', en: 'One midwinter morning, everyone watched the sun rise between the standing stones.' } },
  // 청동기: 떠돌이 청동 장인이 헌 연장을 녹여 다시 부어 준다
  { id: 'l.loc.eu.village.bronze', stage: GROWN, when: { zones: EU, setting: 'village', minYear: -2200, maxYear: -800 },
    text: { ko: '떠돌이 청동 장인이 와서 부러진 낫을 녹여 새 낫으로 부어 줬어요.', en: 'A travelling bronzesmith melted down your broken sickle and cast you a new one.' } },
  // 사람과 소가 한 지붕 아래 사는 긴 집 (북쪽 철기 시대~바이킹 시대)
  { id: 'l.loc.eu.village.byre', stage: ALL, when: { zones: EU, setting: 'village', areas: ['germany', 'nordic'], minYear: -800, maxYear: 1100 },
    text: { ko: '겨울엔 소와 한 지붕 아래서 잤어요. 소 덕에 따뜻했고, 소 덕에 냄새도 났어요.', en: 'In winter you slept under one roof with the cattle. They kept you warm, and they kept the place smelling of cow.' } },
  // 로마 길의 이정표
  { id: 'l.loc.eu.village.milestone', stage: ['child', 'teen'], when: { zones: EU, setting: 'village', areas: [...ROMAN, 'britain'], minYear: 50, maxYear: 400 },
    text: { ko: '길가 이정표 돌에 글자가 새겨져 있었어요. 마을에서 그걸 읽는 사람은 없었어요.', en: 'Letters were carved on the milestone by the road. Nobody in the village could read them.' } },
  // 돼지를 숲에 몰고 가 도토리를 먹이기 (가을, 판니지)
  { id: 'l.loc.eu.village.pannage', stage: ['child', 'teen', 'adult'], when: { zones: EU, setting: 'village', minYear: 600, maxYear: 1600 },
    text: { ko: '가을엔 돼지를 숲에 몰고 가 도토리를 먹였어요. 돼지가 당신보다 잘 먹었어요.', en: 'In autumn you drove the pigs into the woods for acorns. They ate better than you did.' } },
  // 영주 밭 추수를 거드는 날 (부역 날의 빵과 에일)
  { id: 'l.loc.eu.village.boon', stage: ['adult', 'middle'], when: { zones: EU, setting: 'village', areas: ['britain', 'france', 'germany'], minYear: 900, maxYear: 1500 },
    text: { ko: '영주 밭 추수를 거드는 날이었어요. 영주 집에서 빵과 에일을 내왔어요.', en: 'It was a boon day, harvesting the lord’s fields. The lord’s house sent out bread and ale.' } },
  // 영주 방앗간에서만 빻아야 했다
  { id: 'l.loc.eu.village.mill', stage: ['adult', 'middle'], when: { zones: EU, setting: 'village', areas: ['britain', 'france', 'germany', 'italy'], minYear: 900, maxYear: 1600 },
    text: { ko: '영주 방앗간에서만 빻아야 했어요. 방앗간 주인 몫은 늘 한 줌 더 많아 보였어요.', en: 'You had to grind at the lord’s mill. The miller’s share always looked a handful too big.' } },
  // 성 요한 축일 전야(하지 무렵)의 모닥불 뛰어넘기
  { id: 'l.loc.eu.village.midsummer', stage: ['teen', 'adult'], when: { zones: EU, setting: 'village', minYear: 800, maxYear: 1900 },
    text: { ko: '한여름 밤 모닥불을 뛰어넘었어요. 그러면 추수 때 허리가 안 아프다고들 했어요.', en: 'On Midsummer Eve you leapt over the bonfire. It meant no backache at harvest, people said.' } },
  // 바다 건너간 친척이 뱃삯을 부쳐 온다 (대이민 시대)
  { id: 'l.loc.eu.village.ticket', stage: ['teen', 'adult'], when: { zones: EU, setting: 'village', minYear: 1840, maxYear: 1924 },
    text: { ko: '바다 건너간 사촌이 뱃삯을 부쳐 왔어요. 편지 끝엔 「너도 와」라고 적혀 있었어요.', en: 'A cousin across the ocean sent money for a ticket. The letter ended, “You come too.”' } },
  // 의무 교육이 퍼진 뒤의 농가 아이
  { id: 'l.loc.eu.village.school', stage: ['child', 'teen'], tokens: true, when: { zones: EU, setting: 'village', minYear: 1870, maxYear: 1950 },
    text: { ko: '{school}에서 돌아오면 곧장 밭으로 갔어요. 숙제는 소 옆에서 했어요.', en: 'Home from {school}, you went straight to the fields. Homework got done next to the cow.' } },
  // 트랙터가 말을 대신하다 (전후)
  { id: 'l.loc.eu.village.tractor', stage: ['teen', 'adult', 'middle', 'old'], when: { zones: EU, setting: 'village', minYear: 1950, maxYear: 2000 },
    text: { ko: '트랙터가 들어온 해, 마지막 말을 팔았어요. 말이 서 있던 자리가 한참 허전했어요.', en: 'The year the tractor came, you sold the last horse. Its empty stall felt strange for a long while.' } },

  // ── 유럽 거리 (europe · street) ──────────────────────────────────
  // 마살리아·에트루리아의 포도주 항아리가 갈리아로
  { id: 'l.loc.eu.street.amphora', stage: GROWN, when: { zones: EU, setting: 'street', areas: ['france', 'germany'], minYear: -600, maxYear: -50 },
    text: { ko: '남쪽 상인들이 포도주 항아리를 싣고 왔어요. 다들 맥주보다 비싼 걸 굳이 맛봤어요.', en: 'Traders from the south came with jars of wine. Everyone insisted on tasting the thing that cost more than beer.' } },
  // 청동기 장인의 돌 거푸집
  { id: 'l.loc.eu.street.mould', stage: ['teen', 'adult', 'middle'], when: { zones: EU, setting: 'street', minYear: -2200, maxYear: -800 },
    text: { ko: '돌 거푸집에 청동 쇳물을 부었어요. 식을 때까지 숨도 크게 못 쉬었어요.', en: 'You poured molten bronze into the stone mould and hardly dared breathe until it cooled.' } },
  // 로마 도시의 공중목욕탕
  { id: 'l.loc.eu.street.baths', stage: ['teen', 'adult', 'middle', 'old'], when: { zones: EU, setting: 'street', areas: ROMAN, minYear: -100, maxYear: 450 },
    text: { ko: '목욕탕에서 반나절을 보냈어요. 몸보다 귀가 더 바빴어요.', en: 'You spent half the day at the baths. Your ears worked harder than your scrub brush.' } },
  // 성벽 도시의 저녁 종 (통금)
  { id: 'l.loc.eu.street.curfew', stage: ALL, when: { zones: EU, setting: 'street', minYear: 1000, maxYear: 1600 },
    text: { ko: '저녁 종이 울리자 성문이 닫히고 불씨를 덮었어요. 늦은 사람은 성 밖에서 잤어요.', en: 'When the evening bell rang, the gates shut and the fires were banked. Latecomers slept outside the walls.' } },
  // 길드 수호성인 축일 행렬
  { id: 'l.loc.eu.street.patron', stage: ['teen', 'adult', 'middle'], when: { zones: EU, setting: 'street', areas: ['france', 'italy', 'iberia', 'germany'], minYear: 1200, maxYear: 1800 },
    text: { ko: '길드 수호성인 축일에 깃발을 들고 행렬을 따라 걸었어요.', en: 'On the guild’s patron saint’s day you walked in the procession carrying the banner.' } },
  // 거리의 가스등
  { id: 'l.loc.eu.street.gaslight', stage: ALL, when: { zones: EU, setting: 'street', minYear: 1820, maxYear: 1920 },
    text: { ko: '거리에 가스등이 켜졌어요. 밤이 갑자기 짧아졌어요.', en: 'Gas lamps were lit along the street. The night suddenly got shorter.' } },
  // 8월 휴가에 텅 빈 도시
  { id: 'l.loc.eu.street.august', stage: ALL, when: { zones: EU, setting: 'street', areas: ['france', 'italy', 'iberia'], minYear: 1955 },
    text: { ko: '8월이면 도시가 텅 비었어요. 다들 바다로 떠났고, 빵집도 문을 닫았어요.', en: 'In August the city emptied. Everyone left for the sea, even the baker.' } },
  // 계획 경제의 월말 몰아치기
  { id: 'l.loc.eu.street.plan', stage: ['adult', 'middle'], when: { zones: EU, setting: 'street', areas: ['east_europe'], minYear: 1955, maxYear: 1991 },
    text: { ko: '월말이면 계획 숫자를 맞추느라 일터에 불이 늦게까지 켜져 있었어요.', en: 'At the end of every month the lights burned late at work, to make the plan’s numbers add up.' } },

  // ── 유럽 큰 집 (europe · estate) ─────────────────────────────────
  // 하인 쪽 · 사투르날리아에 주인이 노예에게 밥을 차린다
  { id: 'l.loc.eu.estate.saturnalia', stage: ALL, when: { zones: EU, setting: 'estate', tags: ['serve'], areas: ROMAN, minYear: -200, maxYear: 400 },
    text: { ko: '사투르날리아 날엔 주인이 노예들에게 밥을 차려 줬어요. 딱 하루였어요.', en: 'On Saturnalia the master served dinner to the slaves. For exactly one day.' } },
  // 하인 쪽 · 로마 이전 족장 집의 화덕 불 지키기
  { id: 'l.loc.eu.estate.hearth', stage: ['child', 'teen', 'adult'], when: { zones: EU, setting: 'estate', tags: ['serve'], eraGroups: ['ancient'], areas: ['britain', 'france', 'germany', 'iberia', 'east_europe', 'balkans', 'nordic'], minYear: -2000, maxYear: -50 },
    text: { ko: '족장 집 화덕의 불을 밤새 지켰어요. 불이 꺼진 아침은 생각하기도 싫었어요.', en: 'You kept the fire in the chieftain’s hearth alive all night. A morning with a dead hearth did not bear thinking about.' } },
  // 귀족 쪽 · 로마 연회에서 비스듬히 누워 먹기
  { id: 'l.loc.eu.estate.couch', stage: ['teen', 'adult', 'middle'], when: { zones: EU, setting: 'estate', tags: ['elite'], areas: ROMAN, minYear: -300, maxYear: 450 },
    text: { ko: '연회에서 비스듬히 누워 먹는 법을 배웠어요. 앉아 먹는 사람이 조금 촌스러워 보였어요.', en: 'You learned to dine reclining on a couch. People who ate sitting up began to look a bit provincial.' } },
  // 귀족 쪽 · 켈트 잔치의 가장 좋은 고기
  { id: 'l.loc.eu.estate.portion', stage: GROWN, when: { zones: EU, setting: 'estate', tags: ['elite'], areas: ['britain', 'france', 'germany', 'iberia'], minYear: -600, maxYear: -50 },
    text: { ko: '잔치에서 가장 좋은 고기는 가장 용감한 사람 몫이었어요. 그걸 두고 꼭 말다툼이 났어요.', en: 'At feasts the best cut went to the bravest. There was always an argument about who that was.' } },
  // 귀족 쪽 · 매사냥
  { id: 'l.loc.eu.estate.falcon', stage: ['teen', 'adult'], when: { zones: EU, setting: 'estate', tags: ['elite'], minYear: 900, maxYear: 1600 },
    text: { ko: '매사냥을 배웠어요. 매가 먼저 당신을 길들였어요.', en: 'You learned falconry. The falcon trained you first.' } },
  // 하인 쪽 · 영주 부엌의 고기 꼬챙이
  { id: 'l.loc.eu.estate.spit', stage: ['child', 'teen'], when: { zones: EU, setting: 'estate', tags: ['serve'], minYear: 900, maxYear: 1600 },
    text: { ko: '영주 부엌에서 하루 종일 고기 꼬챙이를 돌렸어요. 코만 배가 불렀어요.', en: 'You turned the roasting spit in the lord’s kitchen all day. Only your nose ate its fill.' } },
  // 하인 쪽 · 동유럽의 집안 농노
  { id: 'l.loc.eu.estate.houseserf', stage: ['child', 'teen', 'adult', 'middle'], when: { zones: EU, setting: 'estate', tags: ['serve'], areas: ['east_europe'], minYear: 1600, maxYear: 1861 },
    text: { ko: '집안 농노라 밭 대신 지주 집 마루를 닦았어요. 마루는 밭보다 빨리 더러워졌어요.', en: 'As a house serf, you scrubbed the landlord’s floors instead of fields. Floors got dirty faster than fields.' } },
  // 하인 쪽 · 부엌 벽의 종 판
  { id: 'l.loc.eu.estate.bells', stage: ['teen', 'adult', 'middle'], when: { zones: EU, setting: 'estate', tags: ['serve'], minYear: 1780, maxYear: 1950 },
    text: { ko: '부엌 벽 종이 울리면 소리만 듣고도 어느 방인지 알았어요.', en: 'When a bell rang on the kitchen wall, you knew which room it was by the sound alone.' } },
  // 귀족 쪽 · 저녁마다 옷을 갈아입는 긴 식탁
  { id: 'l.loc.eu.estate.dinner', stage: ['teen', 'adult', 'middle', 'old'], when: { zones: EU, setting: 'estate', tags: ['elite'], minYear: 1800, maxYear: 1939 },
    text: { ko: '저녁마다 옷을 갈아입고 긴 식탁에 앉았어요. 대화도 옷처럼 갈아입었어요.', en: 'Every evening you changed for dinner and sat at the long table. The conversation changed its clothes too.' } },

  // ── 서아시아·북아프리카 마을 (mudbrick · village) ─────────────────
  // 신석기 갈판 (무릎을 꿇고 하는 곡식 갈기)
  { id: 'l.loc.eu.wvillage.quern', stage: ['child', 'teen', 'adult'], when: { zones: MB, setting: 'village', areas: ['mesopotamia', 'anatolia', 'iran', 'nile'], minYear: -8000, maxYear: -3000 },
    text: { ko: '아침마다 갈판에 곡식을 갈았어요. 팔보다 무릎이 먼저 아팠어요.', en: 'Every morning you ground grain on the saddle quern. Your knees gave out before your arms did.' } },
  // 수메르: 큰 단지의 보리 맥주를 갈대 빨대로
  { id: 'l.loc.eu.wvillage.straws', stage: GROWN, when: { zones: MB, setting: 'village', areas: ['mesopotamia'], minYear: -3000, maxYear: -500 },
    text: { ko: '큰 단지에 둘러앉아 갈대 빨대로 보리 맥주를 나눠 마셨어요.', en: 'Everyone sat round a big jar, sipping barley beer through reed straws.' } },
  // 나일: 물 빠진 뒤의 둑 부역
  { id: 'l.loc.eu.wvillage.dykes', stage: ['adult', 'middle'], when: { zones: MB, setting: 'village', areas: ['nile'], minYear: -3000, maxYear: 1880 },
    text: { ko: '물이 빠지자 둑과 물길을 고치는 부역에 나갔어요. 진흙이 무릎까지 찼어요.', en: 'When the flood went down, you were called out to mend the dykes and channels. The mud came up to your knees.' } },
  // 나일: 씨를 뿌리고 가축 떼로 밟게 한다
  { id: 'l.loc.eu.wvillage.sowing', stage: ['child', 'teen', 'adult'], when: { zones: MB, setting: 'village', areas: ['nile'], minYear: -3000, maxYear: 600 },
    text: { ko: '물 빠진 진흙에 씨를 뿌리고, 가축 떼를 몰아 밟게 했어요.', en: 'You scattered seed on the wet mud and drove the herd over it to tread it in.' } },
  // 페르시아 왕의 길과 파발꾼 (기원전 550~330년)
  { id: 'l.loc.eu.wvillage.courier', stage: ['child', 'teen', 'adult'], when: { zones: MB, setting: 'village', areas: ['iran', 'mesopotamia', 'anatolia'], minYear: -550, maxYear: -330 },
    text: { ko: '왕의 파발꾼이 역참에서 말을 바꿔 타고 바람처럼 지나갔어요.', en: 'The king’s courier changed horses at the post station and was gone like the wind.' } },
  // 로마 아프리카 속주의 곡식 배
  { id: 'l.loc.eu.wvillage.grainship', stage: ['adult', 'middle'], when: { zones: MB, setting: 'village', areas: ['maghreb'], minYear: -100, maxYear: 430 },
    text: { ko: '거둔 밀이 배에 실려 로마로 떠났어요. 로마 사람들은 누가 길렀는지 몰랐을 거예요.', en: 'The harvested wheat sailed off to Rome. The Romans probably never knew who grew it.' } },
  // 남아라비아의 유향 채취
  { id: 'l.loc.eu.wvillage.incense', stage: ['teen', 'adult', 'middle'], when: { zones: MB, setting: 'village', areas: ['arabia'], minYear: -1000, maxYear: 600 },
    text: { ko: '유향나무 껍질에 칼집을 내고, 하얀 진이 굳기를 몇 주씩 기다렸어요.', en: 'You notched the frankincense bark and waited weeks for the white resin to harden.' } },
  // 새벽 아잔
  { id: 'l.loc.eu.wvillage.azan', stage: ALL, tokens: true, when: { zones: MB, setting: 'village', areas: ISLAMIC, minYear: 700 },
    text: { ko: '{holy}에서 새벽 아잔이 울리면 다들 일어나 하루를 시작했어요.', en: 'When the dawn call to prayer rang out from the {holy}, everyone rose and began the day.' } },
  // 읍내 하맘
  { id: 'l.loc.eu.wvillage.hammam', stage: ['teen', 'adult', 'middle', 'old'], when: { zones: MB, setting: 'village', areas: ISLAMIC, minYear: 800, maxYear: 1950 },
    text: { ko: '장날 읍내 하맘에서 때를 밀었어요. 돌아오는 길에 다시 먼지투성이가 됐어요.', en: 'On market day you scrubbed clean at the town hammam. By the walk home you were dusty again.' } },
  // 이란: 노루즈 상의 새싹
  { id: 'l.loc.eu.wvillage.nowruz', stage: ALL, tokens: true, when: { zones: MB, setting: 'village', areas: ['iran'], minYear: -500 },
    text: { ko: '{feast} 상에 올리려고 접시에 보리 싹을 길렀어요.', en: 'You grew barley sprouts in a dish to set out for {feast}.' } },
  // 나일: 목화 따는 철 (1820년대부터)
  { id: 'l.loc.eu.wvillage.cotton', stage: ['child', 'teen', 'adult'], when: { zones: MB, setting: 'village', areas: ['nile'], minYear: 1822, maxYear: 1950 },
    text: { ko: '목화 따는 철엔 아이들까지 밭에 나갔어요. 손끝이 하얗게 일었어요.', en: 'In cotton-picking season even the children went to the fields. Your fingertips got rubbed raw.' } },
  // 나일: 아스완 큰 댐 뒤로 넘치지 않는 강
  { id: 'l.loc.eu.wvillage.dam', stage: ALL, when: { zones: MB, setting: 'village', areas: ['nile'], minYear: 1971 },
    text: { ko: '큰 댐이 생긴 뒤로 나일은 더는 넘치지 않았어요. 할머니는 그 물을 그리워했어요.', en: 'After the great dam was built, the Nile no longer flooded. Grandmother missed the water.' } },

  // ── 서아시아 야영지 (mudbrick·steppe · camp) ─────────────────────
  // 수렵 무리 · 타조알 껍데기 물통 (마그레브의 카프사 무렵, 사하라·아라비아)
  { id: 'l.loc.eu.wcamp.ostrich', stage: ['child', 'teen', 'adult', 'middle'], when: { zones: MB, setting: 'camp', eraGroups: ['forager'], areas: ['maghreb', 'nile', 'arabia'], minYear: -12000 },
    text: { ko: '타조알 껍데기 물통에 물을 채워 들고 다녔어요. 깨질까 봐 늘 조심조심 걸었어요.', en: 'You carried water in an ostrich-eggshell flask, always walking carefully in case it broke.' } },
  // 수렵 무리 · 가젤 떼가 지나는 길목
  { id: 'l.loc.eu.wcamp.gazelle', stage: ['teen', 'adult', 'middle'], when: { zones: CAMP, setting: 'camp', eraGroups: ['forager'] },
    text: { ko: '가젤 떼가 지나는 골짜기 길목에 숨어 하루 종일 기다렸어요.', en: 'You hid all day at the mouth of the valley where the gazelles pass.' } },
  // 수렵 무리 · 나투프 사람들의 돌낫 (야생 곡식 거두기, 기원전 13000년 무렵부터)
  { id: 'l.loc.eu.wcamp.sickle', stage: ['teen', 'adult', 'middle'], tokens: true, when: { zones: MB, setting: 'camp', eraGroups: ['forager'], areas: ['mesopotamia', 'anatolia'], minYear: -13000 },
    text: { ko: '{crop:을} 돌낫으로 베어 모았어요. 낫날이 햇빛에 반들거렸어요.', en: 'You cut {crop} with a flint sickle. The blade wore to a glassy shine.' } },
  // 가축 치는 집 · 여름 풀밭과 겨울 강가를 오가기
  { id: 'l.loc.eu.wcamp.pasture', stage: ALL, when: { zones: CAMP, setting: 'camp', tags: ['herd'], areas: ['anatolia', 'iran', 'steppe', 'mongolia'], eraGroups: ['ancient', 'medieval'] },   // 산 풀밭과 강가를 오가는 땅만 (아라비아·나일·마그레브·메소포타미아는 빼 둔다, 검토 I4)
    text: { ko: '여름엔 높은 풀밭으로, 겨울엔 강가로 양 떼를 몰았어요. 집은 늘 양 떼 뒤에 있었어요.', en: 'Summer meant the high pastures, winter the river flats. Home was always wherever the flock was.' } },
  // 가축 치는 집 · 마을 장터에서 치즈·양털과 곡식 바꾸기
  { id: 'l.loc.eu.wcamp.trade', stage: ['teen', 'adult', 'middle', 'old'], tokens: true, when: { zones: CAMP, setting: 'camp', tags: ['herd'], eraGroups: ['ancient', 'medieval'] },
    text: { ko: '{market}에서 치즈와 양털을 {crop:과} 바꿨어요. 흥정은 늘 길었어요.', en: 'At the {market} you traded cheese and wool for {crop}. The haggling always went on.' } },
  // 가축 치는 집 · 낙타 젖 짜기
  { id: 'l.loc.eu.wcamp.camelmilk', stage: ['child', 'teen', 'adult'], when: { zones: CAMP, setting: 'camp', tags: ['herd'], areas: ['arabia', 'mesopotamia', 'nile', 'iran', 'steppe', 'mongolia'], eraGroups: ['ancient', 'medieval'], minYear: -900 },
    text: { ko: '낙타 젖 짜는 법을 배웠어요. 낙타가 먼저 성질부터 가르쳐 줬어요.', en: 'You learned to milk a camel. The camel taught you about temper first.' } },
  // 가축 치는 집 · 초원의 펠트 만들기
  { id: 'l.loc.eu.wcamp.felt', stage: ALL, when: { zones: ['steppe'], setting: 'camp', tags: ['herd'], eraGroups: ['ancient', 'medieval'], minYear: -1000 },
    text: { ko: '펠트 만드는 날, 다 같이 양털 뭉치를 말아 굴리고 밟았어요.', en: 'On felt-making day, everyone rolled and trampled the bundles of wool together.' } },
];
