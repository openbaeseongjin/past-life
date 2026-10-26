// 땅·자리 고유 작은 일 줄 (시뮬 2.0 설계 4.2, 작업 7 AM): 아메리카 마을 11 · 아프리카 마을 7 · 아프리카 야영지 7 · 동남아·오세아니아 마을 7
// 모든 줄은 when.zones + when.setting + 시대 조건(eraGroups 또는 minYear·maxYear)을 갖는다 (test/local_am.test.mjs). 무거운 일(병·죽음)과 숫자·나이는 쓰지 않는다.
// 사실 출처: CONTENT-SOURCES-local-am.md
const AMV = (o = {}) => ({ zones: ['americas'], setting: 'village', ...o });
const AFV = (o = {}) => ({ zones: ['africa'], setting: 'village', ...o });
const AFC = (o = {}) => ({ zones: ['africa'], setting: 'camp', ...o });
const SEV = (o = {}) => ({ zones: ['seaoc'], setting: 'village', ...o });
const ALL = ['child', 'teen', 'adult', 'middle', 'old'];

export const LOCAL_LINES_AM = [
  // ── 아메리카 마을 (11) ────────────────────────────────────────
  // 갈돌(메타테)로 옥수수 갈기: 방앗간이 퍼진 1930년대 전까지
  { id: 'l.loc.am.amvil.metate', stage: ['child', 'teen', 'adult'], tokens: true, when: AMV({ areas: ['mesoamerica'], maxYear: 1930 }),
    text: { ko: '동트기 전부터 갈돌 소리가 났어요. 옥수수를 다 갈아야 아침 {staple:이} 나왔어요.', en: 'The grinding stone was going before dawn. No maize ground, no {staple} for breakfast.' } },
  // 치남파 (1150~1521)
  { id: 'l.loc.am.amvil.chinampa', stage: ['teen', 'adult', 'middle'], when: AMV({ areas: ['mesoamerica'], minYear: 1150, maxYear: 1521 }),
    text: { ko: '카누를 저어 물길 사이의 밭에 다녀왔어요. 밭이 물 위에 떠 있는 것만 같았어요.', en: 'You poled a canoe down the canals to the raised fields. They looked as if they were floating.' } },
  // 추뇨: 밤에 얼리고 낮에 밟아 말린 감자
  { id: 'l.loc.am.amvil.chuno', stage: ALL, tokens: true, when: AMV({ areas: ['andes'], minYear: 600, maxYear: 1900 }),   // 가장 이른 흔적이 중기 지평(600~1000)이라 (검토 m12)
    text: { ko: '얼었다 녹은 감자를 맨발로 밟아 물을 뺐어요. 발은 시려도 {staple:은} 몇 해를 가요.', en: 'You trampled the frozen, thawed potatoes barefoot to squeeze them dry. Cold feet, but {staple} keeps for years.' } },
  // 아이니: 오늘은 내가 돕고 다음엔 네가 돕는다
  { id: 'l.loc.am.amvil.ayni', stage: ['adult', 'middle'], when: AMV({ areas: ['andes'], eraGroups: ['ancient', 'medieval', 'early'] }),
    text: { ko: '이웃 지붕을 올리는 날, 온 아이유가 모였어요. 다음엔 그 이웃이 당신 지붕에 올 차례예요.', en: 'The day the neighbors raised their roof, the whole ayllu turned out. Next time it will be their turn on yours.' } },
  // 카사바 술(카우잉): 여인들이 씹어 빚었고 잔치는 며칠 갔다
  { id: 'l.loc.am.amvil.cauim', stage: ['teen', 'adult', 'middle'], when: AMV({ areas: ['brazil'], eraGroups: ['ancient', 'medieval'] }),
    text: { ko: '잔치 전 여인들이 며칠 동안 카사바를 씹어 술을 빚었어요. 잔치는 사흘을 갔어요.', en: 'Before the feast the women spent days chewing cassava to brew beer. The feast went on for three days.' } },
  // 청키: 굴러가는 돌 원반 뒤로 창을 던지는 놀이 (미시시피)
  { id: 'l.loc.am.amvil.chunkey', stage: ['child', 'teen', 'adult'], when: AMV({ areas: ['north_america'], minYear: 600, maxYear: 1700 }),
    text: { ko: '굴러가는 돌 원반 뒤로 창을 던지는 놀이를 구경했어요. 원반이 멈출 자리를 맞히는 놀이래요.', en: 'You watched spears thrown after a rolling stone disk. The trick was to guess where it would stop.' } },
  // 원주민 마을을 광장·교회 둘레의 새 고을로 옮김 (콩그레가시온·레둑시온, 1550~1620)
  { id: 'l.loc.am.amvil.newtown', stage: ALL, when: AMV({ areas: ['mesoamerica', 'andes'], minYear: 1550, maxYear: 1620 }),
    text: { ko: '마을이 광장과 교회를 둔 새 고을로 옮겨졌어요. 산 위 옛 성소는 제자리에 남았어요.', en: 'The village was moved to a new town laid out round a square and a church. The old shrine on the hill stayed put.' } },
  // 일요일 장: 노예들이 쉬는 날 제 손으로 기른 것을 팔았다 (매이지 않은 이웃의 눈으로)
  { id: 'l.loc.am.amvil.sunday', stage: ALL, when: AMV({ areas: ['brazil', 'caribbean'], minYear: 1550, maxYear: 1888, bound: false }),
    text: { ko: '일요일 장에 농장의 노예들이 쉬는 날 손수 기른 콩을 들고 왔어요. 당신은 그 콩을 샀어요.', en: 'At the Sunday market, enslaved people from the plantation sold beans grown on their one day off. You bought some.' } },
  // 아시엔다 가게 장부 (메소아메리카 1870~1915)
  { id: 'l.loc.am.amvil.store', stage: ['adult', 'middle', 'old'], when: AMV({ areas: ['mesoamerica'], minYear: 1870, maxYear: 1915 }),
    text: { ko: '아시엔다 가게 장부에 빚이 또 한 줄 늘었어요. 그런 빚은 아이에게까지 넘어간대요.', en: 'One more line of debt went into the hacienda store’s ledger. They say such debts pass down to the children.' } },
  // 커피 따는 철 (1870~1950)
  { id: 'l.loc.am.amvil.coffee', stage: ['child', 'teen', 'adult', 'middle'], when: AMV({ areas: ['brazil', 'mesoamerica', 'andes'], minYear: 1870, maxYear: 1950 }),
    text: { ko: '커피 따는 철이라 온 식구가 산 아래 농장으로 내려갔어요. 바구니가 차면 장부에 줄이 하나 그어졌어요.', en: 'Coffee-picking season: the whole family went down to the estate. Each full basket earned one mark in the ledger.' } },
  // 도시로 간 친척 (1960~)
  { id: 'l.loc.am.amvil.photo', stage: ['teen', 'adult', 'middle', 'old'], when: AMV({ minYear: 1960 }),
    text: { ko: '도시에 간 친척이 사진 한 장과 돈을 부쳐 왔어요. 사진은 온 마을을 한 바퀴 돌았어요.', en: 'A relative in the city sent a photograph and some money. The photo went round the whole village.' } },

  // ── 아프리카 마을 (7) ─────────────────────────────────────────
  // 고원의 소 쟁기와 아주 작은 씨앗 (에티오피아 고원, 기원전 2500 무렵부터). 땅 칸이 동아프리카 전체라 길손에게 들은 말로 쓴다 (검토 m12)
  { id: 'l.loc.am.afvil.plough', stage: ['child', 'teen', 'adult', 'middle'], when: AFV({ areas: ['east_africa'], minYear: -2500, maxYear: 1949 }),
    text: { ko: '고원에서 온 길손 말로는, 거기선 황소 둘이 쟁기를 끌고 아주 작은 씨앗을 뿌린대요.', en: 'A traveler from the highlands said that up there, oxen pull the plow and people sow seeds almost too small to see.' } },
  // 그레이트 짐바브웨 돌담 (1150~1450)
  { id: 'l.loc.am.afvil.stonewalls', stage: ['teen', 'adult', 'middle', 'old'], when: AFV({ areas: ['south_africa'], minYear: 1150, maxYear: 1450 }),
    text: { ko: '강 위쪽에 돌담 고을이 있대요. 회반죽도 없이 돌만 쌓았는데 사람 키의 몇 배래요.', en: 'Travelers told of a town upriver walled in stone, piled without mortar, many times the height of a man.' } },
  // 햇얌 축제 (서아프리카)
  { id: 'l.loc.am.afvil.yam', stage: ALL, tokens: true, when: AFV({ areas: ['west_africa'], eraGroups: ['ancient', 'medieval', 'early', 'industrial', 'modern'] }),
    text: { ko: '{feast} 전에는 아무도 햇얌에 손대지 않았어요. 어른들이 첫 얌을 바친 뒤에야 칼이 들어갔어요.', en: 'Nobody touched the new yams before {feast}. Only after the elders had offered the first did the knives come out.' } },
  // 노예무역 시대의 마을 (1550~1850, 서아프리카·콩고): 담담하게 마을 쪽의 눈으로
  { id: 'l.loc.am.afvil.hedge', stage: ALL, when: AFV({ areas: ['west_africa', 'congo'], minYear: 1550, maxYear: 1850 }),
    text: { ko: '마을 둘레에 가시 울타리를 두 겹으로 둘렀어요. 이제 아무도 혼자 물 길으러 가지 않아요.', en: 'The village ringed itself with a double hedge of thorns. Nobody goes to the stream alone any more.' } },
  // 바닷길로 온 유리구슬 (동아프리카, 900~1900)
  { id: 'l.loc.am.afvil.glass', stage: ['teen', 'adult', 'middle', 'old'], when: AFV({ areas: ['east_africa'], minYear: 900, maxYear: 1900 }),
    text: { ko: '바다 건너온 유리구슬이 마을까지 들어왔어요. 할머니는 그 구슬을 잔칫날에만 걸었어요.', en: 'Glass beads from across the ocean found their way inland. Grandmother wore hers only on feast days.' } },
  // 선교 학교 (1850~1949)
  { id: 'l.loc.am.afvil.mission', stage: ['child', 'teen'], tokens: true, when: AFV({ minYear: 1850, maxYear: 1949 }),
    text: { ko: '{school} 종이 울리면 아이들이 맨발로 뛰어갔어요. 석판은 셋이 하나를 나눠 썼어요.', en: 'When the {school} bell rang, the children ran barefoot. Three of them shared one slate.' } },
  // 휴대전화로 돈 부치기 (2008~)
  { id: 'l.loc.am.afvil.phone', stage: ['adult', 'middle', 'old'], when: AFV({ minYear: 2008 }),
    text: { ko: '할머니께 휴대전화로 돈을 부쳤어요. 받았다는 전화가 와서는 한 시간을 안 끊으셨어요.', en: 'You sent Grandmother money by phone. She called to say it had arrived, then talked for an hour.' } },

  // ── 아프리카 야영지 (7): 수렵 무리 다섯 + 가축 치는 집 둘 ──────────
  { id: 'l.loc.am.afcamp.ochre', stage: ['child', 'teen', 'adult'], when: AFC({ eraGroups: ['forager'] }),
    text: { ko: '붉은 흙돌을 갈아 기름에 개어 팔에 줄을 그었어요. 모닥불 빛에 줄이 반짝였어요.', en: 'You ground red ochre, mixed it with fat and drew lines on your arms. They glowed in the firelight.' } },
  // 바위 그늘 벽 그림 (−27000 뒤)
  { id: 'l.loc.am.afcamp.rockart', stage: ALL, when: AFC({ eraGroups: ['forager'], minYear: -27000 }),
    text: { ko: '어른 하나가 바위 그늘 벽에 영양을 그렸어요. 아이들은 숨소리도 안 냈어요.', en: 'An elder painted an antelope on the wall of the rock shelter. The children hardly breathed.' } },
  { id: 'l.loc.am.afcamp.dig', stage: ['child', 'teen', 'adult', 'middle'], tokens: true, when: AFC({ eraGroups: ['forager'] }),
    text: { ko: '아침 내내 땅파기 막대로 {crop:을} 캤어요. 손바닥보다 배가 먼저 기뻐했어요.', en: 'All morning you dug for {crop} with a digging stick. Your stomach was happier about it than your palms.' } },
  // 모래에 묻어 둔 타조알 물통 (−60000 뒤, 남부·동부)
  { id: 'l.loc.am.afcamp.flask', stage: ['teen', 'adult', 'middle', 'old'], when: AFC({ eraGroups: ['forager'], minYear: -60000, areas: ['south_africa', 'east_africa'] }),
    text: { ko: '할머니가 몇 해 전 모래에 묻어 둔 타조알 물통을 찾아냈어요. 물이 아직 차 있었어요.', en: 'You dug up an ostrich-egg water flask Grandmother had buried in the sand years before. It was still full.' } },
  { id: 'l.loc.am.afcamp.dance', stage: ALL, when: AFC({ eraGroups: ['forager'] }),
    text: { ko: '그날 밤 모두 모닥불을 돌며 새벽까지 춤을 췄어요. 아픈 사람이 낫기를 비는 춤이래요.', en: 'That night everyone danced around the fire until dawn. It was a dance to make the sick well, they said.' } },
  // 가축 치는 집: 나이 또래와 성년식, 풀을 따라 옮기기
  { id: 'l.loc.am.afcamp.ageset', stage: 'teen', when: AFC({ tags: ['herd'], eraGroups: ['ancient', 'medieval'], areas: ['east_africa', 'south_africa'] }),
    text: { ko: '또래들과 함께 성년식을 치렀어요. 그 뒤로 평생 같은 또래 이름으로 불렸어요.', en: 'You went through the coming-of-age rites with your age-mates. For life, you would share one age-set name.' } },
  { id: 'l.loc.am.afcamp.move', stage: ALL, when: AFC({ tags: ['herd'], eraGroups: ['ancient', 'medieval'] }),
    text: { ko: '새 풀을 찾아 야영지를 옮겼어요. 길은 사람보다 소들이 더 잘 알았어요.', en: 'The camp moved on in search of fresh grass. The cattle knew the way better than the people did.' } },

  // ── 동남아·오세아니아 마을 (7) ────────────────────────────────
  // 라피타 토기 (태평양, −1350~−500)
  { id: 'l.loc.am.seavil.lapita', stage: ALL, when: SEV({ areas: ['pacific'], minYear: -1350, maxYear: -500 }),
    text: { ko: '할머니가 톱니 같은 도구로 젖은 토기에 잔무늬를 찍었어요. 무늬는 한 줄도 비뚤지 않았어요.', en: 'Grandmother pressed fine patterns into the wet pot with a toothed tool. Not one row was crooked.' } },
  // 빵나무 열매를 구덩이에 묻어 삭힌다 (태평양)
  { id: 'l.loc.am.seavil.breadfruit', stage: ALL, when: SEV({ areas: ['pacific'], maxYear: 1900 }),
    text: { ko: '남는 빵나무 열매를 잎을 깐 구덩이에 묻었어요. 한 해를 간대요. 냄새도 한 해를 가요.', en: 'The spare breadfruit went into a leaf-lined pit. It keeps a year, they say. So does the smell.' } },
  // 청동 북 (동남아 대륙, −500~300)
  { id: 'l.loc.am.seavil.drum', stage: ALL, tokens: true, when: SEV({ areas: ['mainland_sea'], minYear: -500, maxYear: 300 }),
    text: { ko: '{feast}에 족장의 청동 북이 울렸어요. 북에 새긴 새들이 날아오를 것만 같았어요.', en: 'At {feast} the chief’s bronze drum was struck. The birds cast on its face looked ready to fly.' } },
  // 물 차례를 정하는 물길 모임 (발리의 수박이 본보기, 1050~1500). 땅 칸이 인도네시아 전체라 사제·물 사원은 말하지 않는다 (검토 m12)
  { id: 'l.loc.am.seavil.watertemple', stage: ['teen', 'adult', 'middle', 'old'], when: SEV({ areas: ['indonesia'], minYear: 1050, maxYear: 1500 }),
    text: { ko: '물길 모임이 작은 사당 앞에서 어느 논에 언제 물을 댈지 정했어요. 아무도 토를 달지 않았어요.', en: 'Meeting before the little shrine, the water society decided which paddies got water, and when. Nobody argued.' } },
  // 그림자 인형극 (자와, 900~)
  { id: 'l.loc.am.seavil.wayang', stage: ALL, when: SEV({ areas: ['indonesia'], minYear: 900 }),
    text: { ko: '그림자 인형극이 밤새 이어졌어요. 싸움 대목에서 잠들었다가 우스개 대목에 깼어요.', en: 'The shadow-puppet play ran all night. You fell asleep in the battle and woke up for the jokes.' } },
  // 항구의 새 기도처 (1400~1600)
  { id: 'l.loc.am.seavil.prayer', stage: ALL, when: SEV({ areas: ['indonesia', 'malay'], minYear: 1400, maxYear: 1600 }),
    text: { ko: '항구 쪽 새 기도처에서 기도 부르는 소리가 바람을 타고 왔어요. 처음엔 다들 귀를 기울였어요.', en: 'The call to prayer drifted over from the new prayer house by the harbor. At first, everyone stopped to listen.' } },
  // 마을의 첫 오토바이 (1975~2005)
  { id: 'l.loc.am.seavil.motorbike', stage: ['teen', 'adult', 'middle', 'old'], when: SEV({ areas: ['mainland_sea', 'indonesia', 'philippines', 'malay', 'pacific'], minYear: 1975, maxYear: 2005 }),   // 오스트레일리아·뉴질랜드 농가는 빼 둔다 (검토 I3)
    text: { ko: '마을에 첫 오토바이가 들어왔어요. 다들 한 번씩 타 보고 싶어 했어요. 닭들만 빼고요.', en: 'The first motorbike came to the village. Everyone wanted a ride. Except the chickens.' } },
];
