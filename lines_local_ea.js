// 땅·자리 고유 작은 일 줄 (시뮬 2.0 설계 4.2): 동아시아 (중국·한반도·일본). 작업 7 EA
// 묶음: 동아시아 마을(village) · 동아시아 거리(street) · 동아시아 큰 집(estate, 귀족 쪽 + 하인 쪽)
// 모든 줄은 when.zones ['eastasia'] + setting + 해(minYear·maxYear) + 땅(areas)으로 묶는다. 무거운 일(병·죽음)은 쓰지 않는다. 출처는 CONTENT-SOURCES-local-ea.md
const EA = ['eastasia'];
const V = (areas, minYear, maxYear, more = {}) => ({ zones: EA, setting: 'village', areas, minYear, maxYear, ...more });
const S = (areas, minYear, maxYear, more = {}) => ({ zones: EA, setting: 'street', areas, minYear, maxYear, ...more });
const E = (areas, minYear, maxYear, more = {}) => ({ zones: EA, setting: 'estate', areas, minYear, maxYear, ...more });
const GROWN = ['teen', 'adult', 'middle', 'old'];
const ALL = ['child', 'teen', 'adult', 'middle', 'old'];

export const LOCAL_LINES_EA = [
  // ══ 동아시아 마을 ══════════════════════════════════════════════
  // ── 중국 ──
  { id: 'l.loc.ea.millet_dogs', stage: ['child', 'teen'], when: V(['china'], -6000, 599),
    text: { ko: '해 질 녘 마을 개들이 기장 말리는 마당을 지켰어요. 새들이 개보다 빨랐어요.', en: 'At dusk the village dogs guarded the yard where the millet was drying. The birds were faster than the dogs.' } },
  { id: 'l.loc.ea.silkworm', stage: ALL, when: V(['china'], -2000, 1799),
    text: { ko: '누에 치는 방에서는 큰 소리를 내면 안 된대요. 뽕잎 갉는 소리만 비처럼 들렸어요.', en: 'No loud voices in the silkworm room, they say. The only sound was the leaves being munched, like rain.' } },
  { id: 'l.loc.ea.tea_slope', stage: GROWN, when: V(['china'], 700, 1949),
    text: { ko: '차 따는 철이라 새벽이슬이 마르기 전에 산비탈로 올라갔어요.', en: 'It was tea-picking season, so you climbed the slopes before the dawn dew dried.' } },
  { id: 'l.loc.ea.cave_home', stage: ALL, when: V(['china'], 600, 1990),
    text: { ko: '북쪽 친척 집은 황토 언덕을 파 들어간 굴집이었어요. 겨울에 가 보니 신기하게 따뜻했어요.', en: 'Your relatives up north lived in a home dug into a loess hillside. Visiting in winter, you found it surprisingly warm.' } },
  { id: 'l.loc.ea.lijia_turn', stage: ['adult', 'middle'], when: V(['china'], 1381, 1644),
    text: { ko: '올해는 우리 집이 이갑의 세금 걷는 차례래요. 장부를 받아 든 어른이 한숨부터 쉬었어요.', en: 'This year your household gathers the lijia group’s taxes. The elder who took the ledger sighed before anything else.' } },
  { id: 'l.loc.ea.after_taiping', stage: GROWN, when: V(['china'], 1864, 1885),
    text: { ko: '난리가 지나간 뒤 마을에 빈집이 많아요. 남은 사람들이 주인 없는 밭을 나눠 갈아요.', en: 'Since the rebellion passed through, many houses stand empty. Those who are left share out the ownerless fields.' } },
  { id: 'l.loc.ea.furnace', stage: ['child', 'teen', 'adult', 'middle'], when: V(['china'], 1958, 1959),
    text: { ko: '쇠를 만든다며 마을 뒤에 흙 용광로를 쌓았어요. 집에 있던 솥도 그리로 들어갔어요.', en: 'They built a clay furnace behind the village to make steel. The family cooking pot went in too.' } },
  // ── 한반도 ──
  { id: 'l.loc.ea.stone_knife', stage: GROWN, when: V(['korea'], -1500, -100),
    text: { ko: '반달 모양 돌칼로 이삭만 똑똑 땄어요. 손에 익으니 소리가 경쾌했어요.', en: 'You plucked grain heads one by one with a half-moon stone knife. Once your hand learned it, the snapping had a rhythm.' } },
  { id: 'l.loc.ea.jangdok', stage: GROWN, when: V(['korea'], 1392, 2000),
    text: { ko: '장 담그는 날, 메주를 독에 넣고 숯을 띄웠어요. 장독대가 반짝반짝 닦였어요.', en: 'On soy-making day, bean blocks went into the crock with charcoal floating on top. The crock terrace was scrubbed bright.' } },
  { id: 'l.loc.ea.ondol', stage: ALL, when: V(['korea'], 1400, 1990),
    text: { ko: '아궁이에 불을 넣자 아랫목부터 따뜻해졌어요. 식구들이 하나둘 그쪽으로 모였어요.', en: 'Once the fire was lit, the floor nearest the hearth warmed first. One by one, the family drifted over.' } },
  { id: 'l.loc.ea.dure', stage: GROWN, when: V(['korea'], 1700, 1950),
    text: { ko: '두레 깃발을 앞세우고 풍물을 치며 김매러 나갔어요. 일이 놀이 같았어요.', en: 'The work team marched out to weed behind its banner, drums and gongs going. The work felt like play.' } },
  { id: 'l.loc.ea.city_letter', stage: ['child', 'teen', 'adult', 'middle'], when: V(['korea'], 1965, 1990),
    text: { ko: '서울 공장에 간 형제가 월급을 쪼개 부쳐 왔어요. 편지 끝에 「보고 싶다」가 세 번 있었어요.', en: 'A sibling at a Seoul factory sent home part of the wages. The letter ended with “I miss you” three times.' } },
  // ── 일본 ──
  { id: 'l.loc.ea.granary', stage: ALL, when: V(['japan'], -900, 600),
    text: { ko: '높은 기둥 위 곳간에 볍씨를 넣었어요. 기둥에 끼운 판자 때문에 쥐가 못 올라갔어요.', en: 'The seed rice went into the storehouse up on tall posts. Boards fitted around the posts kept the mice from climbing.' } },
  { id: 'l.loc.ea.planting_drum', stage: GROWN, when: V(['japan'], 900, 1945),
    text: { ko: '모내기 날, 북 장단에 맞춰 줄지어 모를 꽂았어요. 노래가 끝나면 허리를 폈어요.', en: 'On planting day you set the seedlings in rows to the beat of a drum. When the song ended, you straightened your back.' } },
  { id: 'l.loc.ea.bon_dance', stage: ALL, when: V(['japan'], 1500, 2000),
    text: { ko: '오봉 밤에 마을 사람들이 둥글게 돌며 춤을 췄어요. 조상들도 같이 도는 것 같았어요.', en: 'On Obon night the villagers danced in a slow circle. It felt as if the ancestors were circling too.' } },
  { id: 'l.loc.ea.draft_exam', stage: ['teen', 'adult'], when: V(['japan'], 1873, 1945),
    text: { ko: '마을 청년들이 징병 검사를 받으러 읍내로 갔어요. 돌아오는 길에는 다들 말이 없었어요.', en: 'The village youths went to town for their conscription physicals. Nobody said much on the way back.' } },

  // ══ 동아시아 거리 ══════════════════════════════════════════════
  { id: 'l.loc.ea.market_measure', stage: GROWN, when: S(['china'], -400, 599),
    text: { ko: '장터 관리가 저울과 되를 검사하러 돌았어요. 다들 되 바닥을 슬쩍 살폈어요.', en: 'The market official made his rounds checking scales and measures. Everyone peeked at the bottom of their measures.' } },
  { id: 'l.loc.ea.market_gong', stage: ALL, when: S(['china'], 618, 960),
    text: { ko: '해 지기 전에 장 닫는 징이 울렸어요. 다들 흥정을 서둘러 끝냈어요.', en: 'Before sunset the gong sounded to close the market. Everyone hurried to finish haggling.' } },
  { id: 'l.loc.ea.storyteller', stage: ALL, when: S(['china'], 1000, 1279),
    text: { ko: '저녁 놀이터에서 이야기꾼이 옛 싸움 이야기를 했어요. 다음 대목은 내일이래요.', en: 'At the evening pleasure grounds, a storyteller told of old battles. The next episode, he said, would be tomorrow.' } },
  { id: 'l.loc.ea.byeongnando', stage: GROWN, when: S(['korea'], 1000, 1392),
    text: { ko: '벽란도에 들어온 배에서 처음 맡아 보는 향료 냄새가 났어요.', en: 'A ship in at Byeongnando port smelled of spices you had never smelled before.' } },
  { id: 'l.loc.ea.peddler_news', stage: ALL, when: S(['korea'], 1700, 1905),
    text: { ko: '등짐장수가 다음 장터로 떠나기 전에 먼 고을 소식을 한 보따리 풀어놓았어요.', en: 'Before heading to the next market town, the peddler unpacked a whole bundle of news from distant counties.' } },
  { id: 'l.loc.ea.fire_watch', stage: ALL, when: S(['japan'], 1650, 1867),
    text: { ko: '밤중에 딱따기 소리가 「불조심」을 외치며 골목을 돌았어요.', en: 'At night the wooden clappers went round the alleys, calling out “Mind your fires.”' } },
  { id: 'l.loc.ea.bike_river', stage: ['teen', 'adult', 'middle'], when: S(['china'], 1960, 1995),
    text: { ko: '출근길 자전거 물결에 끼어 따르릉 종을 울렸어요. 다들 같은 쪽으로 흘러갔어요.', en: 'You joined the river of bicycles on the way to work, ringing your bell. Everyone flowed the same way.' } },
  { id: 'l.loc.ea.pojangmacha', stage: ['adult', 'middle'], when: S(['korea'], 1975, 2005),
    text: { ko: '퇴근길 포장마차에서 동료들과 소주잔을 기울였어요. 넥타이가 점점 느슨해졌어요.', en: 'On the way home you shared soju with coworkers at a tented street stall. The neckties got looser and looser.' } },

  // ══ 동아시아 큰 집 (귀족 쪽 · 하인 쪽) ═══════════════════════════
  { id: 'l.loc.ea.kitchen_feast', stage: GROWN, when: E(['china', 'korea'], 600, 1910, { tags: ['serve'] }),
    text: { ko: '주인댁 잔치 날 부엌에서 쉰 가지 음식을 날랐어요. 남은 국물이 하인들 몫이었어요.', en: 'On the master’s feast day you carried fifty dishes out of the kitchen. The leftover broth was the servants’ share.' } },
  { id: 'l.loc.ea.ancestral_hall', stage: ALL, when: E(['china'], 1500, 1949, { tags: ['elite'] }),
    text: { ko: '사당에 새 위패가 하나 늘었어요. 족보를 고쳐 쓰는 일은 맏손자 몫이었어요.', en: 'A new spirit tablet joined the others in the ancestral hall. Updating the genealogy fell to the eldest grandson.' } },
  { id: 'l.loc.ea.celadon', stage: GROWN, when: E(['korea'], 1150, 1392, { tags: ['elite'] }),
    text: { ko: '찻상에 오른 비색 청자 잔에 구름과 학이 상감되어 있었어요. 아무도 함부로 들지 않았어요.', en: 'On the tea tray sat a jade-green celadon cup inlaid with clouds and cranes. Nobody dared pick it up carelessly.' } },
  { id: 'l.loc.ea.sarangchae', stage: ALL, when: E(['korea'], 1550, 1910, { tags: ['elite'] }),
    text: { ko: '사랑채에서는 손님 글 읽는 소리가, 안채에서는 다듬이 소리가 났어요.', en: 'From the men’s quarters came the sound of guests reciting; from the inner quarters, the beat of laundry paddles.' } },
  { id: 'l.loc.ea.haengrang', stage: GROWN, when: E(['korea'], 1400, 1910, { tags: ['serve'] }),
    text: { ko: '행랑채 아궁이 앞에서 새벽마다 주인댁 세숫물을 데웠어요.', en: 'Every dawn, at the hearth of the servants’ wing, you heated the masters’ washing water.' } },
  { id: 'l.loc.ea.nobi_chest', stage: GROWN, when: E(['korea'], 1400, 1885, { tags: ['serve'] }),
    text: { ko: '노비 문서가 든 궤짝은 늘 주인 방 깊숙이 있었어요. 그 자물쇠 소리에 귀가 먼저 갔어요.', en: 'The chest holding the slave papers always sat deep in the master’s room. Your ears pricked at the sound of its lock.' } },
  { id: 'l.loc.ea.waka_paper', stage: ['teen', 'adult', 'middle'], when: E(['japan'], 794, 1185, { tags: ['elite'] }),
    text: { ko: '어젯밤 손님이 남긴 시에 답가를 써야 해요. 종이 빛깔을 고르는 데만 한나절이 걸렸어요.', en: 'You must answer the poem last night’s visitor left. Choosing the color of the paper alone took half the day.' } },
  { id: 'l.loc.ea.two_swords', stage: ['child', 'teen'], when: E(['japan'], 1600, 1876, { tags: ['elite'] }),
    text: { ko: '대문을 나서는 어른들 허리에 두 자루 칼이 반짝였어요. 칼집 닦기는 아이들 몫이었어요.', en: 'Two swords gleamed at the men’s hips as they went out the gate. Polishing the scabbards was the children’s job.' } },
  { id: 'l.loc.ea.service_term', stage: ['teen', 'adult'], when: E(['japan'], 1650, 1867, { tags: ['serve'] }),
    text: { ko: '봉공 기한이 한 해 남았대요. 벌써 고향 마을 오봉 춤이 그리웠어요.', en: 'One more year left on your service contract. You already missed the Obon dancing back home.' } },
  // 큰 집 보강 (검토 Minor 11): 중국 하인 쪽 589년 뒤, 일본 귀족 쪽 1185~1650, 일본 하인 쪽 1590~1867
  { id: 'l.loc.ea.sale_paper', stage: GROWN, when: E(['china'], 618, 907, { tags: ['serve'] }),
    text: { ko: '새로 사 온 아이의 문서에는 태어난 곳과 판 사람 이름이 적혀 있었어요.', en: 'The papers for the newly bought child listed where the child was born and the name of the seller.' } },
  { id: 'l.loc.ea.adopted_son', stage: GROWN, when: E(['china'], 1368, 1644, { tags: ['serve'] }),
    text: { ko: '벼슬 없는 주인댁은 종을 둘 수 없대요. 그래서 문서에 당신은 수양 자식이에요. 밥상은 따로고요.', en: 'With no official rank, the household may not keep bondservants. So on paper you are an adopted child, who eats apart.' } },
  { id: 'l.loc.ea.month_money', stage: GROWN, when: E(['china'], 1644, 1909, { tags: ['serve'] }),
    text: { ko: '그믐이면 집사 방 앞에 줄을 서서 달삯 몇 푼을 받았어요. 줄 순서도 서열이었어요.', en: 'At each month’s end you lined up outside the steward’s room for a few coins of pay. Even the line had a pecking order.' } },
  { id: 'l.loc.ea.inuoumono', stage: ['teen', 'adult'], when: E(['japan'], 1185, 1550, { tags: ['elite'] }),
    text: { ko: '둥근 줄 안에 개를 풀고 말 위에서 뭉툭한 화살을 쐈어요. 개가 다치지 않는 화살이었어요.', en: 'Dogs were let loose inside a roped ring, and you shot at them from horseback with blunt arrows made not to hurt them.' } },
  { id: 'l.loc.ea.renga', stage: ['adult', 'middle', 'old'], when: E(['japan'], 1450, 1600, { tags: ['elite'] }),
    text: { ko: '연가 모임에서 열 사람이 백 구를 이어 지었어요. 당신 차례만 오면 머리가 하얘졌어요.', en: 'At the linked-verse party, ten people strung together a hundred verses. Your mind went blank whenever your turn came.' } },
  { id: 'l.loc.ea.castle_repair', stage: GROWN, when: E(['japan'], 1615, 1700, { tags: ['elite'] }),
    text: { ko: '성벽 한 귀퉁이가 무너졌어요. 돌 하나 고치려 해도 먼저 에도에 알려야 한대요.', en: 'A corner of the castle wall has collapsed. Before a single stone is fixed, word has to go to Edo.' } },
  { id: 'l.loc.ea.ten_years', stage: ['teen', 'adult'], when: E(['japan'], 1620, 1698, { tags: ['serve'] }),
    text: { ko: '봉공 문서는 열 해를 넘길 수 없는 게 막부 법이래요. 당신 문서엔 딱 열 해가 적혀 있었어요.', en: 'By shogunate law, a service contract may not run past ten years. Yours said exactly ten.' } },
  { id: 'l.loc.ea.broker_seal', stage: GROWN, when: E(['japan'], 1650, 1867, { tags: ['serve'] }),
    text: { ko: '인숙 주인이 보증인 도장을 찍어 주고, 도장값은 꼬박꼬박 챙겨 갔어요.', en: 'The hiring broker stamped his seal as your guarantor, and never once forgot to charge for it.' } },
  { id: 'l.loc.ea.yabuiri', stage: ['child', 'teen', 'adult'], when: E(['japan'], 1700, 1867, { tags: ['serve'] }),
    text: { ko: '야부이리라 주인댁이 준 새 옷을 입고 집에 갔어요. 한 해에 두 번뿐인 휴일이었어요.', en: 'It was Yabuiri, so you went home in new clothes from the household. It was one of only two days off a year.' } },
];
