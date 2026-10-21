// 땅·자리 고유 작은 일 줄 (시뮬 2.0 설계 4.2): 남아시아 (문화권 southasia)
//   마을 15 · 큰 집 10 (앞마당 elite + 뒤뜰 serve) · 거리 8 · 야영지 7
// 모든 줄은 when.zones + when.setting 에 시대(eraGroups 나 minYear·maxYear)를 단다. 무거운 일(병·죽음)과 숫자·나이는 쓰지 않는다 (lines.js 머리말).
// 흉년 구호 공사 · 천장 부채 줄 같은 고된 일은 그 자리에 선 사람의 눈으로, 담담하게
const Z = ['southasia'];
const V = { zones: Z, setting: 'village' };
const E = { zones: Z, setting: 'estate' };
const S = { zones: Z, setting: 'street' };
const C = { zones: Z, setting: 'camp' };
// 벼를 심고 몬순을 기다리는 땅 (인더스는 밀 땅이라 뺀다)
const RICE = ['india', 'bengal', 'himalaya', 'lanka'];

export const LOCAL_LINES_SA = [
  // ── 남아시아 마을 (farm) ───────────────────────────────────────
  // 메르가르 (기원전 7000~5500 무렵): 활비비로 어금니를 뚫은 자국
  { id: 'l.loc.sa.v.drill', stage: ['adult', 'middle'], when: { ...V, areas: ['indus'], minYear: -7000, maxYear: -5500 }, text: { ko: '이가 아파 활비비를 잘 다루는 이웃을 찾아갔어요. 그 소리는 오래 잊히지 않았어요.', en: 'With a toothache, you went to the neighbor who was handy with a bow drill. You never forgot the sound.' } },
  // 하라파 도시의 벽돌은 크기 비가 1:2:4로 같았다
  { id: 'l.loc.sa.v.bricks', stage: ['child', 'teen'], when: { ...V, areas: ['indus', 'india'], minYear: -2600, maxYear: -1900 }, text: { ko: '처음 가 본 도시는 벽돌 크기가 다 똑같았어요. 누가 다 맞췄는지 궁금했어요.', en: 'In the first city you ever saw, every brick was the same size. You wondered who had measured them all.' } },
  // 베다는 글 없이 외워서 전했다
  { id: 'l.loc.sa.v.hymn', stage: ['child', 'teen'], when: { ...V, areas: ['india', 'indus'], minYear: -1500, maxYear: -500 }, text: { ko: '사제가 제사 불 앞에서 긴 노래를 외웠어요. 한 마디도 틀리지 않았어요.', en: 'The priest chanted a long hymn before the sacred fire without missing a single word.' } },
  { id: 'l.loc.sa.v.transplant', stage: ['teen', 'adult'], when: { ...V, areas: RICE, minYear: -1000 }, text: { ko: '물 댄 논에서 다 같이 노래하며 모를 꽂았어요. 노래가 끝나야 허리를 폈어요.', en: 'Everyone sang while planting rice in the flooded paddy. Only when the song ended did anyone straighten up.' } },
  { id: 'l.loc.sa.v.neem', stage: 'child', when: { ...V, areas: ['india', 'bengal', 'indus', 'lanka'], minYear: -1000 }, text: { ko: '님나무 가지를 씹어 이를 닦았어요. 쓴맛에 잠이 확 깼어요.', en: 'You chewed a neem twig to clean your teeth. The bitterness woke you right up.' } },
  { id: 'l.loc.sa.v.banyan', stage: 'old', when: { ...V, minYear: -3000 }, text: { ko: '반얀나무 아래 노인들 틈에 당신도 앉았어요. 할 말은 많고 들을 귀는 적었어요.', en: 'You joined the old folk under the banyan tree. Plenty to say, and few ears left to hear it.' } },
  // 소달구지 바퀴는 남아시아에서 기원전 2600년 무렵부터 (villageplan.js 와 같은 해)
  { id: 'l.loc.sa.v.cart', stage: ['adult', 'middle'], when: { ...V, minYear: -2600 }, text: { ko: '소달구지가 진창에 빠졌어요. 소보다 사람이 더 애를 썼어요.', en: 'The bullock cart sank in the mud. The people strained harder than the oxen did.' } },
  // 페르시아 수차 (사키야): 13~14세기 북인도에 들어와 인더스·야무나 너머 들판의 물 푸는 틀이 됐다
  { id: 'l.loc.sa.v.wheel', stage: ['adult', 'middle'], when: { ...V, areas: ['indus', 'india'], minYear: 1300, maxYear: 1950 }, text: { ko: '눈을 가린 소가 하루 종일 수차를 돌려 우물물을 퍼 올렸어요.', en: 'A blindfolded ox walked the water wheel round all day, lifting water from the well.' } },
  // 스리랑카 마을 저수지(웨와)는 마을 사람이 손봤다
  { id: 'l.loc.sa.v.tank', stage: ['adult', 'middle'], when: { ...V, areas: ['lanka'], minYear: -300, maxYear: 1500 }, text: { ko: '다 같이 저수지 둑을 손봤어요. 둑이 버티면 논도 버텨요.', en: 'The whole village patched the tank’s embankment. As long as the bund holds, so do the paddies.' } },
  // 1880년 기근 규정: 일할 수 있는 사람은 구호 공사(돌 깨기·흙일)에서 품삯을 받았다
  { id: 'l.loc.sa.v.relief', stage: ['adult', 'middle'], when: { ...V, areas: ['india', 'bengal', 'indus'], minYear: 1877, maxYear: 1945 }, text: { ko: '흉년이라 구호 공사장에서 돌을 깼어요. 품삯은 곡식 한 줌이었어요.', en: 'In the famine year you broke stones at the relief works. The wage was a handful of grain.' } },
  // 손 펌프 (인디아 마크 II, 1970년대 중반부터)
  { id: 'l.loc.sa.v.pump', stage: ['child', 'adult', 'middle', 'old'], when: { ...V, minYear: 1975 }, text: { ko: '마을에 손 펌프가 들어왔어요. 우물가 수다가 펌프 곁으로 옮겨 갔어요.', en: 'A hand pump arrived in the village. The gossip moved from the well to the pump.' } },
  // 라디오 크리켓 중계 (힌디어 중계는 1961년부터)
  { id: 'l.loc.sa.v.cricket', stage: ['child', 'teen', 'adult'], when: { ...V, minYear: 1961 }, text: { ko: '크리켓 중계가 있는 날엔 라디오 있는 집 앞에 온 동네가 모였어요.', en: 'On cricket days the whole village crowded outside the one house with a radio.' } },
  { id: 'l.loc.sa.v.monsoon', stage: ['adult', 'middle'], tokens: true, when: { ...V, areas: RICE, minYear: -1000 }, text: { ko: '첫 몬순 구름이 보이자 다들 연장을 챙겨 {land:으로} 달려 나갔어요.', en: 'When the first monsoon clouds appeared, everyone grabbed their tools and hurried out to the {land}.' } },
  // 대대로 일해 주는 집들(대장장이·도공·이발사)이 추수 때 곡식 몫을 받았다 (넓은 표현)
  { id: 'l.loc.sa.v.share', stage: ['middle', 'old'], when: { ...V, areas: ['india', 'bengal', 'himalaya'], minYear: 600, maxYear: 1900 }, text: { ko: '추수 날 대장장이와 도공이 한 해 몫 곡식을 받으러 왔어요.', en: 'On harvest day the blacksmith and the potter came round for their year’s share of grain.' } },
  { id: 'l.loc.sa.v.boat', stage: ['child', 'teen'], tokens: true, when: { ...V, areas: ['bengal'], minYear: -500 }, text: { ko: '물이 불어 배를 타고 {market}에 갔어요. 장보다 뱃길이 더 재미있었어요.', en: 'With the rivers high, you went to the {market} by boat. The ride beat the shopping.' } },

  // ── 남아시아 큰 집: 앞마당 (elite) ↔ 뒤뜰 (serve) ───────────────────────
  { id: 'l.loc.sa.e.fan', stage: ['adult', 'middle', 'old'], when: { ...E, tags: ['elite'], minYear: -1000, maxYear: 1947 }, text: { ko: '더운 오후, 하인이 큰 부채를 부쳐 줬어요. 부치는 사람이 졸면 바람도 졸았어요.', en: 'On hot afternoons a servant worked a great fan over you. When the fanner dozed, so did the breeze.' } },
  { id: 'l.loc.sa.e.smoke', stage: ['teen', 'adult', 'middle'], when: { ...E, tags: ['serve'], minYear: -2000, maxYear: 1947 }, text: { ko: '부엌 연기에 눈이 매웠어요. 앞마당 노랫소리는 연기 너머로 들렸어요.', en: 'Kitchen smoke stung your eyes. The singing in the front courtyard reached you through the haze.' } },
  { id: 'l.loc.sa.e.elephant', stage: ['child', 'teen'], when: { ...E, tags: ['elite'], minYear: -500, maxYear: 1857 }, text: { ko: '코끼리 등에 올라 축제 행렬을 따라갔어요. 아는 얼굴이 다 작아 보였어요.', en: 'You rode an elephant in the festival procession. Everyone you knew looked very small.' } },
  // 야자잎 책: 기원전 5세기 무렵부터 썼다
  { id: 'l.loc.sa.e.palm', stage: ['child', 'teen'], when: { ...E, tags: ['serve'], minYear: -300, maxYear: 1850 }, text: { ko: '주인집 아이가 버린 야자잎 책장을 주웠어요. 글자를 그림처럼 들여다봤어요.', en: 'You picked up a palm-leaf page the master’s child had thrown away, and studied the letters like pictures.' } },
  { id: 'l.loc.sa.e.stars', stage: ['baby', 'child'], when: { ...E, tags: ['elite'], minYear: -500, maxYear: 1947 }, text: { ko: '점성가가 당신 별자리를 오래 들여다봤어요. 좋은 말만 골라 하는 눈치였어요.', en: 'The astrologer studied your stars for a long time. He seemed to be picking out only the nice parts.' } },
  { id: 'l.loc.sa.e.sweep', stage: ['child', 'teen', 'adult', 'middle', 'old'], when: { ...E, tags: ['serve'], minYear: -2000, maxYear: 1947 }, text: { ko: '새벽마다 마당을 쓸었어요. 주인 식구가 깨기 전에 끝내야 했어요.', en: 'Every dawn you swept the courtyard. It had to be done before the family woke.' } },
  // 페르시아어는 델리 술탄국(1206~)부터 궁정 말이었고, 1837년에 공문 말에서 물러났다
  { id: 'l.loc.sa.e.persian', stage: ['child', 'teen'], when: { ...E, tags: ['elite'], areas: ['india', 'indus', 'bengal'], minYear: 1206, maxYear: 1837 }, text: { ko: '페르시아어 시를 외웠어요. 뜻보다 운율이 먼저 머리에 남았어요.', en: 'You memorized Persian verses. The rhythm stuck long before the meaning did.' } },
  // 천장 부채(풍카): 18세기 중엽~19세기 끝, 하인이 줄을 당겼다
  { id: 'l.loc.sa.e.punkah', stage: ['teen', 'adult'], when: { ...E, tags: ['serve'], areas: ['india', 'bengal'], minYear: 1760, maxYear: 1910 }, text: { ko: '밤새 천장 부채 줄을 당겼어요. 졸다 줄을 놓치면 안에서 기침 소리가 났어요.', en: 'All night you pulled the rope of the ceiling fan. If you dozed and let it drop, someone inside would cough.' } },
  // 하라파 도장: 짐을 묶은 줄의 진흙 덩이에 찍었다
  { id: 'l.loc.sa.e.seal', stage: ['teen', 'adult'], when: { ...E, tags: ['elite'], areas: ['indus', 'india'], minYear: -2600, maxYear: -1900 }, text: { ko: '짐 꾸러미를 묶고, 줄매듭 진흙에 집안 도장을 꾹 찍었어요.', en: 'You tied up the bundles of goods and pressed the family seal into the clay over the knot.' } },
  { id: 'l.loc.sa.e.babyback', stage: 'baby', when: { ...E, tags: ['serve'], minYear: -2000, maxYear: 1947 }, text: { ko: '어머니가 주인집 아기를 업고 일하는 동안, 당신은 부엌 바닥에서 놀았어요.', en: 'While your mother worked with the master’s baby on her back, you played on the kitchen floor.' } },

  // ── 남아시아 거리 (craft · trade · shop · pro · office) ─────────────────
  { id: 'l.loc.sa.s.kiln', stage: ['child', 'teen', 'adult'], when: { ...S, tags: ['craft'], areas: ['indus', 'india'], minYear: -2600, maxYear: -1900 }, text: { ko: '가마에서 벽돌을 구웠어요. 틀이 하나라 크기가 다 똑같았어요.', en: 'You fired bricks in the kiln. One mould, so every brick came out the same.' } },
  { id: 'l.loc.sa.s.hammer', stage: ['child', 'teen'], when: { ...S, tags: ['craft'], minYear: -1000, maxYear: 1850 }, text: { ko: '스승의 망치를 따라 치다 보니 박자가 먼저 손에 붙었어요.', en: 'Hammering along with your master, you learned the rhythm before you learned the craft.' } },
  { id: 'l.loc.sa.s.spice', stage: ['teen', 'adult', 'middle'], when: { ...S, tags: ['trade'], minYear: 600, maxYear: 1850 }, text: { ko: '향신료 골목이 매워 재채기가 났어요. 재채기 한 번에 흥정이 깨졌어요.', en: 'The spice lane made you sneeze. One sneeze, and the haggling fell apart.' } },
  { id: 'l.loc.sa.s.cloth', stage: ['teen', 'adult'], tokens: true, when: { ...S, tags: ['craft'], minYear: -500, maxYear: 1850 }, text: { ko: '베틀에서 {cloth} 한 필을 다 짰어요. 손으로 쓸어 보니 물처럼 매끄러웠어요.', en: 'You finished a whole bolt of {cloth} on the loom. It felt smooth as water under your hand.' } },
  // 전신은 1854년 무렵 큰 도시들을 이었고, 글자 수로 값을 받았다
  { id: 'l.loc.sa.s.telegraph', stage: ['adult', 'middle'], when: { ...S, areas: ['india', 'bengal', 'indus', 'lanka'], minYear: 1855, maxYear: 1947 }, text: { ko: '전신국 앞에 줄을 섰어요. 글자 수대로 값을 받아서 다들 말을 아꼈어요.', en: 'You queued at the telegraph office. They charged by the word, so everyone grew very brief.' } },
  // 철길은 1853년 봄베이~타네부터
  { id: 'l.loc.sa.s.rail', stage: ['adult', 'middle'], when: { ...S, areas: ['india', 'bengal', 'indus'], minYear: 1860, maxYear: 1947 }, text: { ko: '새 철길로 물건이 사흘 만에 닿았어요. 소달구지로는 한 달 길이었어요.', en: 'On the new railway your goods arrived in three days. By bullock cart it had been a month.' } },
  { id: 'l.loc.sa.s.filmsong', stage: ['teen', 'adult', 'middle'], when: { ...S, minYear: 1950 }, text: { ko: '가게 라디오에서 영화 노래가 흘러나왔어요. 손님도 따라 흥얼거렸어요.', en: 'A film song drifted from the shop radio, and the customers hummed along.' } },
  { id: 'l.loc.sa.s.powercut', stage: ['adult', 'middle', 'old'], when: { ...S, minYear: 1970 }, text: { ko: '또 정전이었어요. 골목 가게마다 등잔불이 하나둘 켜졌어요.', en: 'Another power cut. One by one, lamps flickered on in the shops along the lane.' } },

  // ── 남아시아 야영지 (band: 수렵 무리 · herd: 고대 목축) ─────────────────
  // 빔베트카 같은 바위 그늘 (그림은 구석기·중석기부터)
  { id: 'l.loc.sa.c.shelter', stage: ['child', 'teen'], when: { ...C, eraGroups: ['forager'] }, text: { ko: '비가 오면 온 무리가 바위 그늘로 모였어요. 벽의 짐승 그림이 불빛에 흔들렸어요.', en: 'When it rained, the whole band crowded under the overhang. The painted animals on the rock flickered in the firelight.' } },
  // 중석기 잔석기: 작은 돌날을 자루에 박아 쓴다
  { id: 'l.loc.sa.c.blades', stage: ['teen', 'adult'], when: { ...C, eraGroups: ['forager'] }, text: { ko: '손톱만 한 돌날 여러 개를 나무 자루에 박아 화살을 만들었어요.', en: 'You set a row of fingernail-sized stone blades into a wooden shaft to make an arrow.' } },
  // 인도코뿔소는 갠지스·인더스 평원에 살았다
  { id: 'l.loc.sa.c.rhino', stage: ['child', 'teen', 'adult'], when: { ...C, eraGroups: ['forager'], areas: ['india', 'bengal', 'indus'] }, text: { ko: '강가 진흙에 코뿔소 발자국이 깊게 찍혀 있었어요. 다들 멀찍이 돌아갔어요.', en: 'Rhino tracks were pressed deep into the riverbank mud. Everyone took the long way round.' } },
  { id: 'l.loc.sa.c.honeysong', stage: ['middle', 'old'], when: { ...C, eraGroups: ['forager'] }, text: { ko: '꿀 따러 가는 젊은이들에게 벌 달래는 노래를 가르쳐 줬어요.', en: 'You taught the young ones the song for calming the bees before a honey climb.' } },
  { id: 'l.loc.sa.c.voice', stage: ['child', 'teen', 'adult', 'middle'], tokens: true, when: { ...C, eraGroups: ['ancient'], tags: ['herd'] }, text: { ko: '{beast} 울음소리만 듣고도 어느 녀석인지 알았어요.', en: 'You could tell which of the {beast} it was just from the sound of its call.' } },
  { id: 'l.loc.sa.c.calf', stage: ['child', 'teen'], when: { ...C, eraGroups: ['ancient'], tags: ['herd'] }, text: { ko: '젖을 짜다가 송아지에게 머리를 받혔어요. 제 몫을 지키려던 거였어요.', en: 'While milking, you got butted by the calf. It was only defending its share.' } },
  { id: 'l.loc.sa.c.rain', stage: ['adult', 'middle', 'old'], when: { ...C, eraGroups: ['ancient'], tags: ['herd'] }, text: { ko: '건기 끝 첫 비 냄새에 소들이 사람보다 먼저 고개를 들었어요.', en: 'At the first smell of rain after the dry season, the cattle lifted their heads before anyone else did.' } },
];
