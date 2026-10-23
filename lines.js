// 작은 일 줄 (설계 12장): 한 해에 한 줄쯤 인생 기록에 남는다. 카드와 같은 stage/when 규칙
// 누구나 66 · 시대 묶음 72 (묶음마다 12) · 지역 14. 무거운 일(병·죽음)과 숫자·나이는 쓰지 않는다
// 어른·중년·노년은 길어서 누구나 줄을 단계마다 12개 넘게 둔다 (두 단계에 걸친 줄도 센다)
// 시대·지역 줄은 그 물건·풍습이 있던 때와 땅에서만 나온다 (아래 땅 목록)
// 누구나 줄 가운데 땅·시대 말이 들어갈 자리가 있는 줄은 {home}·{feast} 같은 자리를 두고 tokens: true 로 표시한다 (sim2 설계 4.1, 화면이 그 줄이 적힌 해의 맥락으로 채운다)
import { LOCAL_LINES_SA } from './lines_local_sa.js';
import { LOCAL_LINES_EA } from './lines_local_ea.js';
import { LOCAL_LINES_EU } from './lines_local_eu.js';
import { LOCAL_LINES_AM } from './lines_local_am.js';

// ── 땅 목록 (when.areas) ─────────────────────────────────────────
// ancient: 신전 축제가 뚜렷한 땅 (철기·고대 제국 시대만 eras 로 연다)
const ANC_TEMPLE = ['mesopotamia', 'nile', 'anatolia', 'iran', 'italy', 'balkans', 'mesoamerica', 'andes'];
// ancient: 집짐승(소·양·염소·돼지·라마)을 치던 땅. 일본·콩고·아프리카 남부·아메리카 대부분·섬들은 뺀다
const ANC_LIVESTOCK = ['china', 'korea', 'mongolia', 'india', 'bengal', 'indus', 'himalaya', 'lanka', 'anatolia', 'iran', 'nile', 'mesopotamia', 'arabia', 'maghreb', 'steppe', 'east_europe', 'france', 'italy', 'germany', 'iberia', 'britain', 'nordic', 'balkans', 'west_africa', 'east_africa', 'andes', 'mainland_sea'];
// ancient: 이삭 곡식(밀·보리·쌀·조·수수)을 거두던 땅. 일본은 벼농사가 시대 4 에야 들어와 뺀다
const ANC_GRAIN = ['china', 'korea', 'india', 'bengal', 'indus', 'himalaya', 'lanka', 'anatolia', 'iran', 'nile', 'mesopotamia', 'arabia', 'maghreb', 'steppe', 'east_europe', 'france', 'italy', 'germany', 'iberia', 'britain', 'nordic', 'balkans', 'west_africa', 'east_africa'];
// ancient: 신석기(시대 2)부터 흙벽돌로 집을 짓던 마른 땅 (차탈회위크·메르가르·제이툰 등)
const ANC_MUDBRICK = ['mesopotamia', 'nile', 'indus', 'anatolia', 'iran', 'steppe'];
// ancient: 곡식을 마당에 말리던 땅 (이삭 곡식 땅 + 옥수수·벼 땅)
const ANC_DRYING = [...ANC_GRAIN, 'mesoamerica', 'andes', 'mainland_sea'];
// medieval: 성지를 찾아가는 순례가 있던 땅
const MED_PILGRIM = ['china', 'japan', 'korea', 'india', 'bengal', 'indus', 'himalaya', 'lanka', 'anatolia', 'iran', 'nile', 'mesopotamia', 'arabia', 'maghreb', 'steppe', 'east_europe', 'france', 'italy', 'germany', 'iberia', 'britain', 'nordic', 'balkans', 'west_africa', 'east_africa', 'mainland_sea', 'mesoamerica', 'andes'];
// medieval: 겨울이 길어 먹을거리를 광에 갈무리하던 땅 (동아시아는 지역 줄 「채소 절이기」가 맡는다)
const MED_COLD = ['anatolia', 'iran', 'steppe', 'himalaya', 'east_europe', 'france', 'italy', 'germany', 'iberia', 'britain', 'nordic', 'balkans'];
// medieval: 장이 서던 땅
const MED_MARKET = ['china', 'japan', 'korea', 'india', 'bengal', 'indus', 'himalaya', 'lanka', 'anatolia', 'iran', 'nile', 'mesopotamia', 'arabia', 'maghreb', 'steppe', 'east_europe', 'france', 'italy', 'germany', 'iberia', 'britain', 'nordic', 'balkans', 'west_africa', 'east_africa', 'mesoamerica', 'mainland_sea', 'indonesia', 'malay'];
// medieval: 물레방아가 곡식을 빻던 땅 (한반도·일본은 더 뒤라 뺀다)
const MED_MILL = ['china', 'anatolia', 'iran', 'mesopotamia', 'maghreb', 'steppe', 'east_europe', 'france', 'italy', 'germany', 'iberia', 'britain', 'nordic', 'balkans'];
// medieval: 성벽 두른 고을이 있던 땅
const MED_WALLED = ['china', 'korea', 'india', 'bengal', 'indus', 'lanka', 'anatolia', 'iran', 'nile', 'mesopotamia', 'arabia', 'maghreb', 'steppe', 'east_europe', 'france', 'italy', 'germany', 'iberia', 'britain', 'balkans', 'west_africa', 'mainland_sea'];
// medieval: 절 종소리 (불교 절이 있던 땅)
const MED_TEMPLE_BELL = ['china', 'japan', 'korea', 'mainland_sea', 'lanka', 'himalaya'];
// early: 고추가 1500년대에 일찍 들어온 땅 (중국·한반도·일본은 16세기 끝 무렵에야 들어와 뺀다)
const EARLY_CHILI = ['iberia', 'italy', 'balkans', 'anatolia', 'india', 'bengal', 'indus', 'lanka', 'mainland_sea', 'malay', 'indonesia', 'philippines', 'west_africa', 'congo', 'east_africa'];
// early: 찍어 낸 그림(목판·동판)이 흔하던 땅 (오스만 아래 발칸은 인쇄가 막혀 뺀다)
const EARLY_PRINT = ['china', 'japan', 'east_europe', 'france', 'italy', 'germany', 'iberia', 'britain', 'nordic'];
// early: 책을 소리 내어 읽어 주던 땅 (찍은 책이 돌던 곳)
const EARLY_BOOK = ['china', 'japan', 'korea', 'east_europe', 'france', 'italy', 'germany', 'iberia', 'britain', 'nordic'];
// early: 먼바다 큰 배가 드나들던 항구 땅. 노예 무역을 겪은 아프리카·아메리카 바닷가는 뺀다
const EARLY_SHIP = ['china', 'japan', 'india', 'bengal', 'lanka', 'anatolia', 'arabia', 'iran', 'mesopotamia', 'nile', 'maghreb', 'east_europe', 'france', 'italy', 'germany', 'iberia', 'britain', 'nordic', 'balkans', 'indonesia', 'malay', 'philippines', 'mainland_sea'];
// early: 1500년대부터 커피를 마시던 땅 (유럽은 1650년 무렵부터라 뺀다)
const EARLY_COFFEE = ['arabia', 'nile', 'anatolia', 'mesopotamia', 'iran', 'maghreb', 'balkans'];
// early: 차를 날마다 마시던 땅 (영국은 1700년대에야 퍼져 뺀다)
const EARLY_TEA = ['china', 'japan', 'mongolia'];
// early: 감자·고구마·카사바가 1500~1600년대에 들어온 땅 (프랑스·독일·북유럽·한반도는 1700년대라 뺀다)
const EARLY_TUBER = ['iberia', 'britain', 'china', 'japan', 'philippines', 'indonesia', 'west_africa', 'congo'];
// early: 지도를 그리고 찍던 땅
const EARLY_MAP = ['china', 'japan', 'korea', 'anatolia', 'east_europe', 'france', 'italy', 'germany', 'iberia', 'britain', 'nordic'];
// industrial (1850~): 1880년 전에 철길이 놓인 땅. 1890년대 뒤에야 놓인 땅(중국·한반도·필리핀·말레이·동남아 대륙·
// 메소포타미아·중앙아시아, 남부를 뺀 아프리카)과 철길이 없던 땅(태평양 섬·히말라야·몽골·아라비아·이란 고원)은 뺀다
const IND_RAIL = ['japan', 'india', 'bengal', 'indus', 'lanka', 'anatolia', 'nile', 'maghreb', 'east_europe', 'france', 'italy', 'germany', 'iberia', 'britain', 'nordic', 'balkans', 'south_africa', 'mesoamerica', 'andes', 'brazil', 'north_america', 'la_plata', 'caribbean', 'indonesia', 'australia'];
// industrial (1850~): 사진관이 1860년대부터 있던 땅 (철길 땅 + 상하이·홍콩, 이란 궁정, 베이루트·바그다드, 마닐라)
const IND_PHOTO = [...IND_RAIL, 'china', 'iran', 'mesopotamia', 'philippines'];
// industrial (1850~): 신문이 1850년대부터 돌던 땅 (중국·한반도는 1870~80년대라 뺀다)
const IND_NEWS = [...IND_RAIL, 'mesopotamia', 'west_africa', 'philippines', 'malay'];
// industrial (1850~): 1850년대에 가스등이 거리를 밝히던 도시가 있던 땅 (일본은 1870년대라 뺀다)
const IND_GAS = ['britain', 'france', 'germany', 'italy', 'iberia', 'nordic', 'east_europe', 'north_america', 'la_plata', 'brazil', 'australia'];
// industrial (1850~): 1850년대에 이미 공장 굴뚝이 줄지어 선 땅
const IND_CHIMNEY = ['britain', 'france', 'germany', 'iberia', 'east_europe', 'north_america'];
// industrial (1850~): 아이들 대부분이 학교(일본은 데라코야)에 가던 땅
const IND_SCHOOL = ['east_europe', 'france', 'italy', 'germany', 'iberia', 'britain', 'nordic', 'balkans', 'north_america', 'la_plata', 'australia', 'japan'];
// 도시 쪽 집안 (농사짓는 집은 뺀다)
const IND_TOWN = ['factory', 'craft', 'trade', 'serve', 'elite', 'sea'];
const MOD_TOWN = ['factory', 'office', 'trade', 'sea', 'elite'];

export const LINES = [
  // ── 누구나: 아기 ──────────────────────────────────────────────
  { id: 'l.u.baby.step', stage: 'baby', tokens: true, text: { ko: '첫걸음을 뗐어요. 그리고 바로 {home} 바닥에 주저앉았어요.', en: 'You took your first step, then promptly sat down on the floor of the {home}.' } },
  { id: 'l.u.baby.word', stage: 'baby', text: { ko: '처음으로 말을 했어요. 무슨 뜻인지 몰라도 다들 기뻐했어요.', en: 'You said your first word. Nobody knew what it meant; everyone cheered.' } },
  { id: 'l.u.baby.tooth', stage: 'baby', tokens: true, text: { ko: '첫니가 났어요. 처음 깨문 것은 {staple:이} 아니라 어머니 손가락이었어요.', en: 'Your first tooth came in. The first thing it bit was not the {staple} but your mother’s finger.' } },
  { id: 'l.u.baby.nap', stage: 'baby', tokens: true, text: { ko: '낮잠에서 깨어 혼자인 줄 알고 울었어요. 다들 {home} 바로 바깥에 있었어요.', en: 'You woke from a nap, thought you were alone, and wailed. Everyone was right outside the {home}.' } },
  { id: 'l.u.baby.lullaby', stage: 'baby', text: { ko: '자장가만 들으면 금세 잠들었어요. 부르던 사람이 먼저 잠든 날도 있었어요.', en: 'A lullaby always put you straight to sleep. Some nights the singer nodded off first.' } },
  { id: 'l.u.baby.grab', stage: 'baby', tokens: true, text: { ko: '다른 아이 손에 든 {staple:을} 빼앗으려다 둘 다 울음을 터뜨렸어요.', en: 'You tried to snatch the {staple} from another child, and you both burst into tears.' } },
  { id: 'l.u.baby.dirt', stage: 'baby', tokens: true, text: { ko: '{home} 앞 흙을 한 움큼 집어 먹었어요. 맛은 별로였어요.', en: 'You ate a fistful of dirt from outside the {home}. It was not very good.' } },
  { id: 'l.u.baby.laugh', stage: 'baby', text: { ko: '처음으로 소리 내어 깔깔 웃었어요. 다들 그 소리를 또 들으려고 우스꽝스러운 표정을 지었어요.', en: 'You laughed out loud for the first time. Everyone pulled silly faces to hear it again.' } },

  // ── 누구나: 어린 시절 ─────────────────────────────────────────
  { id: 'l.u.child.stars', stage: 'child', tokens: true, text: { ko: '{home} 밖에 누워 별을 세다가 잠들었어요. 백까지는 셌어요.', en: 'You fell asleep outside the {home}, counting stars. You made it to a hundred.' } },
  { id: 'l.u.child.nickname', stage: 'child', tokens: true, text: { ko: '{market} 아이들이 지어 준 별명이 생겼어요. 마음에 안 들었지만 평생 따라다녔어요.', en: 'The kids at the {market} gave you a nickname. You didn’t like it, but it stuck with you for life.' } },
  { id: 'l.u.child.sleepover', stage: 'child', tokens: true, text: { ko: '친구네 {home}에서 하룻밤 잤어요. 남의 집 냄새가 낯설고 좋았어요.', en: 'You spent a night in a friend’s {home}. It smelled strange and wonderful.' } },
  { id: 'l.u.child.errand', stage: 'child', tokens: true, text: { ko: '처음으로 혼자 {market}에 심부름을 갔어요. 가다가 뭘 하러 가는 길인지 잊어버렸어요.', en: 'You were sent to the {market} alone for the first time. Halfway there, you forgot what for.' } },
  { id: 'l.u.child.lost', stage: 'child', tokens: true, text: { ko: '{market}에서 놀다가 길을 잃었어요. 해 질 녘 이름을 부르는 소리가 그렇게 반가울 수 없었어요.', en: 'You got lost playing around the {market}. At dusk, nothing ever sounded so good as someone calling your name.' } },
  { id: 'l.u.child.tree', stage: 'child', tokens: true, text: { ko: '{holy} 옆 나무에 오르다 손바닥이 다 까졌어요. 그래도 꼭대기까지는 올라갔어요.', en: 'You scraped your palms raw climbing the tree by the {holy}. You still made it to the top.' } },
  { id: 'l.u.child.bird', stage: 'child', text: { ko: '둥지에서 떨어진 새끼 새를 주워 돌봤어요. 어느 날 아침 훌쩍 날아가 버렸어요.', en: 'You looked after a fledgling that fell from its nest. One morning, it simply flew away.' } },
  { id: 'l.u.child.song', stage: 'child', tokens: true, text: { ko: '{feast} 노래를 따라 부르다 가사를 엉터리로 외웠어요. 아무도 고쳐 주지 않았어요.', en: 'You learned a song for {feast} with all the words wrong. Nobody corrected you.' } },
  { id: 'l.u.child.feast', stage: 'child', tokens: true, text: { ko: '{feast} 밤에는 늦게까지 놀아도 아무도 뭐라 하지 않았어요.', en: 'On the night of {feast} you stayed up late, and nobody said a word.' } },
  { id: 'l.u.child.sibling', stage: 'child', tokens: true, text: { ko: '형제와 크게 싸웠어요. 저녁 {staple:이} 나올 무렵엔 왜 싸웠는지 둘 다 잊었어요.', en: 'You had a huge fight with a sibling. By the time the {staple} came out, neither of you remembered why.' } },

  // ── 누구나: 청소년 ────────────────────────────────────────────
  { id: 'l.u.teen.taller', stage: 'teen', tokens: true, text: { ko: '한 해 사이에 키가 훌쩍 컸어요. {cloth} 옷이 다 짧아졌어요.', en: 'You shot up in a year. Every garment of {cloth} you owned got short.' } },
  { id: 'l.u.teen.journey', stage: 'teen', tokens: true, text: { ko: '처음으로 혼자 먼 길을 다녀왔어요. 돌아와 보니 {home:이} 조금 작아 보였어요.', en: 'You made a long trip on your own for the first time. When you got back, the {home} looked a little smaller.' } },
  { id: 'l.u.teen.shelter', stage: 'teen', tokens: true, text: { ko: '{holy} 근처에서 비를 피하다 낯선 또래와 한참 이야기를 나눴어요.', en: 'Sheltering from the rain near the {holy}, you talked for ages with a stranger your own age.' } },
  { id: 'l.u.teen.overhear', stage: 'teen', tokens: true, text: { ko: '어른들이 {coin:으로} 셈하는 소리를 몰래 엿들었어요. 다 알아듣지는 못했지만 다 아는 척했어요.', en: 'You eavesdropped on the grown-ups doing sums in {coin}. You didn’t follow all of it, but acted as if you did.' } },
  { id: 'l.u.teen.work', stage: 'teen', text: { ko: '처음으로 어른들 일에 한몫 끼었어요. 칭찬은 없었지만 내쫓지도 않았어요.', en: 'For the first time, you were let in on the grown-ups’ work. Nobody praised you, but nobody sent you off either.' } },
  { id: 'l.u.teen.backtalk', stage: 'teen', tokens: true, text: { ko: '어른에게 말대꾸를 했어요. 그날 저녁 {staple:은} 아주 조용히 먹었어요.', en: 'You talked back to an elder. That night, everyone ate the {staple} in total silence.' } },
  { id: 'l.u.teen.night', stage: 'teen', tokens: true, text: { ko: '{feast} 밤 친구들과 놀다 새벽에 몰래 들어왔어요. 누군가 잠도 안 자고 기다리고 있었어요.', en: 'You stayed out all night with friends after {feast} and crept home at dawn. Someone had waited up.' } },
  { id: 'l.u.teen.sleep', stage: 'teen', text: { ko: '잠이 부쩍 늘었어요. 해가 중천에 떠도 일어나지 않았어요.', en: 'You slept more than ever. Even with the sun high, you would not get up.' } },

  // ── 누구나: 어른 ──────────────────────────────────────────────
  { id: 'l.u.adult.tired', stage: 'adult', tokens: true, text: { ko: '고된 한 해였어요. 그래도 저녁 {staple} 앞에서는 웃을 일이 하나는 있었어요.', en: 'A hard year. Still, each evening over the {staple}, there was one thing to laugh about.' } },
  { id: 'l.u.adult.dance', stage: 'adult', tokens: true, text: { ko: '{feast}에 춤추다 발을 여러 번 밟혔어요. 그래도 끝까지 췄어요.', en: 'Dancing at {feast}, you got your feet trodden on again and again. You danced to the end anyway.' } },
  { id: 'l.u.adult.directions', stage: ['adult', 'middle'], tokens: true, text: { ko: '낯선 사람에게 {market} 가는 길을 가르쳐 줬어요. 한참 뒤에야 엉뚱한 길이었다는 게 떠올랐어요.', en: 'You gave a stranger directions to the {market}. Much later, you realized you had sent them the wrong way.' } },
  { id: 'l.u.adult.putoff', stage: 'adult', tokens: true, text: { ko: '오래 미뤄 둔 {home} 손질을 드디어 끝냈어요. 해 보니 반나절 일이었어요.', en: 'You finally fixed up the {home}, a job you had put off for ages. It took half a day.' } },
  { id: 'l.u.adult.dream', stage: ['adult', 'middle'], tokens: true, text: { ko: '{market}에 가는 길 내내 간밤 꿈 이야기를 했어요. 끝까지 들어 준 사람은 없었어요.', en: 'All the way to the {market}, you told everyone about last night’s dream. Nobody heard you out.' } },
  // 일하며 부르는 노래는 기계 앞 일터가 흔해진 현대 묶음(1950~)에서 뺀다. 현대의 농사·유목 집안도 함께 빠지는 것은 일부러 둔 단순화다 (maxYear 는 가중치 ×2 를 붙이지 않는다)
  { id: 'l.u.adult.worksong', stage: 'adult', when: { maxYear: 1949 }, text: { ko: '일하면서 부르는 노래를 새로 배웠어요. 노래에 맞춰 손이 절로 빨라졌어요.', en: 'You learned a new work song. Your hands sped up to keep time with it.' } },
  { id: 'l.u.adult.guest', stage: 'adult', tokens: true, text: { ko: '먼 데서 온 손님이 {home}에 묵어 갔어요. 떠날 때 보니 짐이 올 때보다 늘어 있었어요.', en: 'A guest from far away stayed in your {home}. When they left, they were carrying more than when they came.' } },
  { id: 'l.u.adult.stream', stage: 'adult', tokens: true, text: { ko: '날이 좋아 일을 일찍 마치고 {staple:을} 싸 들고 냇가에 가서 발을 담갔어요.', en: 'The weather was fine, so you finished early, packed some {staple} and dangled your feet in the stream.' } },
  { id: 'l.u.adult.tool', stage: 'adult', tokens: true, text: { ko: '이웃 {home}에 빌려 준 연장을 돌려받으러 갔다가 다른 걸 하나 더 빌려 주고 왔어요.', en: 'You went to the neighbors’ {home} for a tool you had lent, and came home having lent out another.' } },
  { id: 'l.u.adult.shower', stage: 'adult', tokens: true, text: { ko: '{market}에 나서자마자 비가 쏟아졌어요. 돌아오자 거짓말처럼 개었어요.', en: 'The moment you set out for the {market}, the rain came pouring down. The moment you got back, it cleared.' } },
  { id: 'l.u.adult.feastfood', stage: 'adult', tokens: true, text: { ko: '처음으로 {feast} 음식을 맡았어요. 하나도 남지 않았으니 잘된 거였어요.', en: 'For the first time, you cooked for {feast}. Nothing was left over, so it went well.' } },
  { id: 'l.u.adult.waist', stage: 'adult', tokens: true, text: { ko: '{market}까지 다녀오며 온종일 찾아 헤맨 물건이 내내 허리춤에 있었어요.', en: 'You hunted all day, all the way to the {market} and back. The thing had been at your waist the whole time.' } },
  { id: 'l.u.adult.baby', stage: 'adult', when: { flags: ['kids'] }, text: { ko: '아이가 밤새 보채서 한숨도 못 잤어요. 아침엔 아이 혼자 멀쩡했어요.', en: 'The little one kept you up all night. By morning, the child was the only one feeling fine.' } },
  { id: 'l.u.adult.spat', stage: 'adult', when: { flags: ['married'] }, text: { ko: '같이 사는 사람과 사소한 일로 다퉜어요. 먼저 웃는 쪽이 지는 싸움이었어요.', en: 'You and your partner squabbled over nothing. Whoever laughed first would lose.' } },

  // ── 누구나: 중년 ──────────────────────────────────────────────
  { id: 'l.u.middle.grey', stage: 'middle', text: { ko: '머리에 흰 줄이 보이기 시작했어요. 못 본 척했어요.', en: 'Grey hairs began to show. You pretended not to see them.' } },
  { id: 'l.u.middle.friend', stage: 'middle', tokens: true, text: { ko: '{market}에서 오랜 친구를 다시 만났어요. 둘 다 많이 변했는데 웃음소리는 그대로였어요.', en: 'You ran into an old friend at the {market}. You had both changed a lot, but the laugh was the same.' } },
  { id: 'l.u.middle.worn', stage: ['middle', 'old'], tokens: true, text: { ko: '오래 입은 {cloth} 옷이 끝내 해졌어요. 버리지 못하고 한참을 두었어요.', en: 'The {cloth} you had worn for years finally wore through. You could not bring yourself to throw it out.' } },
  { id: 'l.u.middle.season', stage: ['middle', 'old'], text: { ko: '바람 냄새만 맡고도 계절이 바뀌는 걸 알았어요. 다른 사람들은 며칠 뒤에야 알았어요.', en: 'You could smell the season changing on the wind. Everyone else noticed days later.' } },
  { id: 'l.u.middle.advice', stage: ['middle', 'old'], text: { ko: '젊은이들이 조언을 구하러 왔어요. 젊을 적 듣고 흘려버린 그 말을 그대로 해 줬어요.', en: 'Young people came to you for advice. You gave them the same advice you ignored at their age.' } },
  { id: 'l.u.middle.voice', stage: 'middle', text: { ko: '자기도 모르게 부모님 말투가 그대로 튀어나왔어요. 듣고 나서 스스로 놀랐어요.', en: 'Without meaning to, you said something exactly the way your parents used to. It gave you quite a start.' } },
  { id: 'l.u.middle.empty', stage: 'middle', tokens: true, when: { flags: ['kids'] }, text: { ko: '아이가 다 커서 집을 떠났어요. {home:이} 갑자기 조용해졌어요.', en: 'Your child grew up and left home. The {home} went suddenly quiet.' } },
  { id: 'l.u.middle.hill', stage: 'middle', tokens: true, text: { ko: '{holy}에 가는 언덕길이 해마다 조금씩 가팔라지는 것 같았어요.', en: 'The hill path to the {holy} seemed to get a little steeper every year.' } },
  { id: 'l.u.middle.slang', stage: 'middle', text: { ko: '젊은이들 하는 말을 반쯤 못 알아듣기 시작했어요. 그래도 고개는 끄덕였어요.', en: 'You began to miss half of what the young people said. You nodded along anyway.' } },
  { id: 'l.u.middle.peace', stage: 'middle', tokens: true, text: { ko: '{holy} 앞에서 오래 사이가 틀어졌던 사람과 화해했어요. 생각보다 말 몇 마디면 됐어요.', en: 'Outside the {holy}, you made peace with an old enemy. It took fewer words than you had feared.' } },
  { id: 'l.u.middle.busy', stage: 'middle', tokens: true, text: { ko: '눈코 뜰 새 없는 한 해였어요. 정신을 차려 보니 또 {feast:이} 돌아와 있었어요.', en: 'A year so busy you barely looked up. When you did, {feast} had come round again.' } },
  { id: 'l.u.middle.blind', stage: 'middle', text: { ko: '손에 익은 일은 눈을 감고도 했어요. 그걸 남에게 설명하기는 오히려 어려웠어요.', en: 'You could do your work with your eyes shut now. Explaining it to anyone else was another matter.' } },
  { id: 'l.u.middle.elder', stage: 'middle', text: { ko: '젊은이들이 어른이라고 부르기 시작했어요. 처음엔 누굴 부르는지 몰라 두리번거렸어요.', en: 'Young people started calling you “elder”. At first you looked around to see who they meant.' } },

  // ── 누구나: 노년 ──────────────────────────────────────────────
  { id: 'l.u.old.sun', stage: 'old', tokens: true, text: { ko: '{home} 앞 양지바른 곳에 앉아 있는 시간이 길어졌어요.', en: 'You spent longer and longer sitting in the sun outside the {home}.' } },
  { id: 'l.u.old.naming', stage: 'old', when: { flags: ['kids'] }, text: { ko: '손주 이름을 지어 달라는 부탁을 받았어요. 오래 고민하다 처음 떠오른 이름으로 했어요.', en: 'You were asked to name a grandchild. After long thought, you chose the first name that had come to mind.' } },
  { id: 'l.u.old.knees', stage: 'old', tokens: true, text: { ko: '무릎이 쑤시면 이튿날 꼭 비가 왔어요. {healer}보다도 잘 맞혔어요.', en: 'Whenever your knees ached, rain came the next day. Not even the {healer} forecast better.' } },
  { id: 'l.u.old.story', stage: 'old', tokens: true, text: { ko: '{feast}마다 같은 이야기를 또 했어요. 다들 처음 듣는 척해 줬어요.', en: 'Every time {feast} came round, you told the same story again. Everyone kindly pretended it was new.' } },
  { id: 'l.u.old.dawn', stage: 'old', tokens: true, text: { ko: '잠이 줄어 늘 가장 먼저 일어났어요. 동틀 녘 {home:은} 혼자 차지였어요.', en: 'You slept less and were always up first. At dawn the whole {home} was yours.' } },
  { id: 'l.u.old.clear', stage: 'old', text: { ko: '어릴 적 일은 또렷한데 어제 일은 가물가물했어요.', en: 'Your childhood was crystal clear. Yesterday, less so.' } },
  { id: 'l.u.old.handover', stage: 'old', text: { ko: '손에 익은 일을 젊은이에게 넘겼어요. 한동안은 옆에서 훈수만 뒀어요.', en: 'You handed your work over to someone younger. For a while, you just stood by and offered pointers.' } },
  { id: 'l.u.old.mixup', stage: 'old', text: { ko: '아이들 이름을 자꾸 바꿔 불렀어요. 나중엔 아이들이 비슷한 이름이면 다 대답했어요.', en: 'You kept mixing up the children’s names. In the end they answered to whichever came closest.' } },
  { id: 'l.u.old.flowers', stage: 'old', tokens: true, text: { ko: '걸음이 느려지니 {holy} 가는 길에 늘 지나치던 들꽃이 눈에 들어왔어요.', en: 'Walking slowly now, you noticed the wildflowers on the way to the {holy} that you had always hurried past.' } },
  { id: 'l.u.old.hands', stage: 'old', text: { ko: '손이 예전만큼 빠르지 않았어요. 대신 실수가 줄었어요.', en: 'Your hands were not as quick as they had been. They made fewer mistakes, though.' } },
  { id: 'l.u.old.oldsong', stage: 'old', tokens: true, text: { ko: '옛 {feast} 노래를 흥얼거리자 젊은이들이 처음 듣는다며 가르쳐 달라고 했어요.', en: 'You hummed an old song for {feast}. The young ones had never heard it and begged to learn.' } },
  { id: 'l.u.old.nag', stage: 'old', text: { ko: '잔소리가 늘었다는 말을 들었어요. 할 말이 늘었을 뿐이라고 했어요.', en: 'People said you had started to nag. You said you simply had more to say.' } },
  { id: 'l.u.old.rules', stage: 'old', text: { ko: '아이들 놀이에 규칙이 틀렸다고 끼어들었어요. 아이들은 요즘은 이렇게 한다고 했어요.', en: 'You cut into the children’s game to say they had the rules wrong. They said this was how it was done now.' } },

  // ── 수렵채집 (forager, −8000 전) ─────────────────────────────────
  { id: 'l.for.child.berries', stage: 'child', when: { eraGroups: ['forager'] }, text: { ko: '산딸기 덤불을 찾아냈어요. 무리에서 한동안 유명했어요.', en: 'You found a berry patch and were briefly famous in the band.' } },
  { id: 'l.for.child.tales', stage: 'child', when: { eraGroups: ['forager'] }, text: { ko: '불가에서 사냥 이야기를 들을 때마다 짐승이 조금씩 더 커졌어요.', en: 'Each time the hunting story was told by the fire, the beast got a little bigger.' } },
  // 바위 그림은 사람이 살던 모든 땅에 남아 있다
  { id: 'l.for.child.rockart', stage: 'child', when: { eraGroups: ['forager'] }, text: { ko: '바위벽에 그려진 짐승들을 처음 봤어요. 불빛에 흔들려 살아 움직이는 것 같았어요.', en: 'You saw the animals painted on the rock wall for the first time. In the firelight they seemed to move.' } },
  { id: 'l.for.teen.knife', stage: 'teen', when: { eraGroups: ['forager'] }, text: { ko: '돌칼을 잃어버렸어요. 한참 찾다가 새로 만드는 게 더 빠르다는 걸 깨달았어요.', en: 'You lost your stone knife. After a long search, you realized it was quicker to make a new one.' } },
  { id: 'l.for.teen.stars', stage: 'teen', when: { eraGroups: ['forager'] }, text: { ko: '별을 보고 길을 찾는 법을 배웠어요. 첫날 밤엔 엉뚱한 언덕에 닿았어요.', en: 'You learned to find your way by the stars. The first night, you ended up on the wrong hill.' } },
  { id: 'l.for.adult.herd', stage: 'adult', when: { eraGroups: ['forager'] }, text: { ko: '짐승 떼가 지나가는 동안 땅이 하루 종일 울렸어요. 다들 바위 뒤에 바짝 붙어 지켜봤어요.', en: 'A great herd went by, and the ground rumbled all day. Everyone pressed close behind the rocks and watched.' } },
  { id: 'l.for.adult.feast', stage: 'adult', when: { eraGroups: ['forager'] }, text: { ko: '사냥이 아주 잘된 날이었어요. 다들 배가 불러 그대로 드러누웠어요.', en: 'A very good hunt. Everyone ate until they had to lie down.' } },
  { id: 'l.for.adult.honey', stage: 'adult', when: { eraGroups: ['forager'] }, text: { ko: '들벌 둥지를 찾아 꿀을 땄어요. 여기저기 쏘였지만 하나도 아깝지 않았어요.', en: 'You found a wild bees’ nest and took the honey. You were stung all over, and it was worth it.' } },
  { id: 'l.for.middle.plants', stage: 'middle', when: { eraGroups: ['forager'] }, text: { ko: '아이들에게 먹는 풀과 못 먹는 풀을 가르쳤어요. 아이들은 맛을 보고 확인하려 들었어요.', en: 'You taught the children which plants were food and which were not. They wanted to check by tasting.' } },
  { id: 'l.for.middle.water', stage: 'middle', when: { eraGroups: ['forager'] }, text: { ko: '처음 만난 무리와 물웅덩이를 나눠 쓰기로 했어요. 손짓만으로 한나절이 걸렸어요.', en: 'You agreed to share a waterhole with a band you had just met. With only gestures, it took half a day.' } },
  { id: 'l.for.old.grounds', stage: 'old', when: { eraGroups: ['forager'] }, text: { ko: '젊은 사냥꾼들이 옛 사냥터를 물으러 왔어요. 기억이 흐릿한 데는 적당히 보태서 일러 줬어요.', en: 'Young hunters came asking about the old hunting grounds. Your memory was hazy, so you filled in the gaps.' } },
  { id: 'l.for.old.load', stage: 'old', when: { eraGroups: ['forager'] }, text: { ko: '무리가 옮겨 갈 때 젊은이들이 짐을 나눠 져 줬어요. 대신 길잡이는 당신 몫이었어요.', en: 'When the band moved on, the young ones split your load. In return, you led the way.' } },

  // ── 고대 (ancient, −8000~600) ────────────────────────────────────
  // 신전 축제: 철기·고대 제국 시대(시대 4·5)의 신전 땅만
  { id: 'l.anc.child.festival', stage: 'child', when: { eraGroups: ['ancient'], eras: [4, 5], areas: ANC_TEMPLE }, text: { ko: '신전 축제에 처음 따라갔어요. 신보다 사람 구경이 더 재미있었어요.', en: 'You went to the temple festival for the first time. The crowd was more interesting than the gods.' } },
  { id: 'l.anc.child.kid', stage: 'child', when: { eraGroups: ['ancient'], tags: ['farm', 'herd'], areas: ANC_LIVESTOCK }, text: { ko: '집짐승이 새끼를 낳았어요. 이름은 지어 주지 말라는 말을 들었어요.', en: 'One of the animals gave birth. You were told not to give the little one a name.' } },
  { id: 'l.anc.child.glean', stage: 'child', when: { eraGroups: ['ancient'], tags: ['farm'], areas: ANC_GRAIN }, text: { ko: '추수하는 날 어른들 뒤를 따라다니며 이삭을 주웠어요. 주운 것보다 흘린 게 많았어요.', en: 'At harvest you followed the reapers, picking up fallen grain. You dropped more than you gathered.' } },
  { id: 'l.anc.teen.harvest', stage: 'teen', when: { eraGroups: ['ancient'], tags: ['farm'] }, text: { ko: '처음으로 직접 심은 것을 거뒀어요. 한 줌뿐이었지만 가장 맛있었어요.', en: 'You harvested the first thing you had planted with your own hands. Just a handful, but the best you ever tasted.' } },
  // 토기: 카드 「진흙 빚기」와 같은 땅
  { id: 'l.anc.teen.pot', stage: 'teen', when: { eraGroups: ['ancient'], regions: ['east', 'south', 'west', 'europe', 'africa'] }, text: { ko: '혼자 빚은 그릇이 처음으로 깨지지 않고 불에서 나왔어요. 다들 한 번씩 두드려 봤어요.', en: 'For the first time, a pot you made yourself came out of the fire whole. Everyone gave it a tap.' } },
  { id: 'l.anc.adult.silt', stage: 'adult', when: { eraGroups: ['ancient'], tags: ['farm'], areas: ['china', 'korea', 'india', 'bengal', 'indus', 'himalaya', 'nile', 'mesopotamia', 'steppe', 'east_europe', 'france', 'germany', 'balkans', 'west_africa', 'congo', 'brazil', 'north_america', 'la_plata', 'mainland_sea'] }, text: { ko: '강물이 넘쳤다가 빠지자 밭흙이 검고 기름졌어요.', en: 'The river flooded and fell back, leaving the fields dark and rich.' } },
  { id: 'l.anc.adult.well', stage: 'adult', when: { eraGroups: ['ancient'], regions: ['east', 'south', 'west', 'europe', 'africa'] }, text: { ko: '마을 사람들과 우물을 팠어요. 물이 솟자 다들 흙탕물을 뒤집어쓴 채 웃었어요.', en: 'You dug a well with the whole village. When the water came up, everyone laughed, filthy and soaked.' } },
  { id: 'l.anc.adult.brick', stage: 'adult', when: { eraGroups: ['ancient'], areas: ANC_MUDBRICK }, text: { ko: '흙벽돌을 찍어 볕에 말렸어요. 다 마를 때까지 비가 오지 않기만 빌었어요.', en: 'You shaped mud bricks and set them out in the sun, praying it would not rain until they dried.' } },
  { id: 'l.anc.middle.stone', stage: 'middle', when: { eraGroups: ['ancient'], tags: ['farm'] }, text: { ko: '이웃과 밭 경계 돌을 두고 다퉜어요. 돌은 밤마다 조금씩 자리를 옮기는 것 같았어요.', en: 'You and a neighbor quarreled over a boundary stone. It seemed to move a little every night.' } },
  { id: 'l.anc.middle.habits', stage: 'middle', when: { eraGroups: ['ancient'], tags: ['farm', 'herd'], areas: ANC_LIVESTOCK }, text: { ko: '기르는 짐승마다 버릇을 다 꿰게 됐어요. 식구들 버릇보다 더 잘 알았어요.', en: 'You knew every one of the animals by its habits. Better, frankly, than you knew your family’s.' } },
  { id: 'l.anc.old.birds', stage: 'old', when: { eraGroups: ['ancient'], tags: ['farm'], areas: ANC_DRYING }, text: { ko: '곡식 말리는 마당에서 새 쫓는 일을 맡았어요. 새들은 금방 당신을 얕보았어요.', en: 'You were put in charge of shooing birds off the drying grain. The birds soon stopped taking you seriously.' } },
  { id: 'l.anc.old.well', stage: 'old', when: { eraGroups: ['ancient'], regions: ['east', 'south', 'west', 'europe', 'africa'] }, text: { ko: '우물가에 앉아 있으면 물 길러 온 사람들이 온갖 소식을 다 털어놓고 갔어요.', en: 'Sitting by the well, you heard all the news from everyone who came for water.' } },

  // ── 중세 (medieval, 600~1500) ────────────────────────────────────
  { id: 'l.med.child.pilgrims', stage: 'child', when: { eraGroups: ['medieval'], areas: MED_PILGRIM }, text: { ko: '순례자 무리가 마을을 지나갔어요. 막대기를 하나 짚고 한참을 따라 걸었어요.', en: 'Pilgrims passed through the village. You followed them a long way, leaning on a stick of your own.' } },
  { id: 'l.med.child.stores', stage: 'child', when: { eraGroups: ['medieval'], areas: MED_COLD }, text: { ko: '겨울 먹을거리를 넣어 둔 광에 몰래 드나들었어요. 겨울이 오기도 전에 들켰어요.', en: 'You kept sneaking into the winter stores. You were caught well before winter came.' } },
  { id: 'l.med.child.wall', stage: 'child', when: { eraGroups: ['medieval'], areas: MED_WALLED }, text: { ko: '성벽 위에 올라가 멀리까지 내다봤어요. 내려오자마자 크게 혼났어요.', en: 'You climbed up on the town wall and looked out a long way. The moment you came down, you were in big trouble.' } },
  { id: 'l.med.teen.trade', stage: 'teen', when: { eraGroups: ['medieval'], areas: MED_MARKET }, text: { ko: '장날에 처음으로 혼자 물건을 바꿔 왔어요. 잘 바꾼 건지는 끝내 몰랐어요.', en: 'On market day you made your first trade on your own. Whether it was a good one, you never found out.' } },
  { id: 'l.med.teen.flour', stage: 'teen', when: { eraGroups: ['medieval'], areas: MED_MILL }, text: { ko: '물방앗간 일을 거들었어요. 머리부터 발끝까지 하얗게 돼서 돌아왔어요.', en: 'You helped out at the mill and came home white from head to toe.' } },
  { id: 'l.med.adult.wall', stage: 'adult', when: { eraGroups: ['medieval'], areas: MED_WALLED }, text: { ko: '성벽 쌓는 일에 불려 나갔어요. 돌을 아무리 날라도 성벽은 그대로인 것 같았어요.', en: 'You were called up to work on the town wall. However many stones you hauled, it never seemed any taller.' } },
  { id: 'l.med.adult.stores', stage: 'adult', when: { eraGroups: ['medieval'], areas: MED_COLD }, text: { ko: '겨울 먹을거리를 광에 갈무리했어요. 무엇을 어디 두었는지는 혼자만 알았어요.', en: 'You laid in the food for winter. Only you knew what was stored where.' } },
  { id: 'l.med.adult.pilgrimage', stage: 'adult', when: { eraGroups: ['medieval'], areas: MED_PILGRIM }, text: { ko: '평생 한 번은 가 보라던 성지에 다녀왔어요. 돌아와서는 발바닥 이야기만 했어요.', en: 'You finally made the pilgrimage everyone said to make once in a lifetime. Back home, you talked only about your feet.' } },
  { id: 'l.med.middle.miller', stage: 'middle', when: { eraGroups: ['medieval'], areas: MED_MILL }, text: { ko: '방앗간 주인과 오래 실랑이하다 보니 친구가 됐어요. 그래도 가루는 꼭 달아 봤어요.', en: 'Years of haggling with the miller made the two of you friends. You still weighed your flour, though.' } },
  { id: 'l.med.middle.spot', stage: 'middle', when: { eraGroups: ['medieval'], areas: MED_MARKET }, text: { ko: '장날 좋은 자리를 잡으려고 새벽같이 나갔어요. 옆 사람은 전날 밤부터 와 있었어요.', en: 'You set out before dawn to get a good spot on market day. The person next to you had been there since the night before.' } },
  { id: 'l.med.old.water', stage: 'old', when: { eraGroups: ['medieval'], areas: MED_PILGRIM }, text: { ko: '지나가는 순례자들에게 물을 떠 주는 게 일이 됐어요. 다들 먼 곳 소식으로 값을 치렀어요.', en: 'Giving water to passing pilgrims became your job. They paid you in news from far away.' } },
  { id: 'l.med.old.bell', stage: 'old', when: { eraGroups: ['medieval'], areas: MED_TEMPLE_BELL }, text: { ko: '절 종소리가 예전보다 작게 들렸어요. 종이 아니라 귀가 달라진 거였어요.', en: 'The temple bell sounded fainter than it used to. It was your ears that had changed, not the bell.' } },

  // ── 근세 (early, 1500~1800) ──────────────────────────────────────
  { id: 'l.early.child.pepper', stage: 'child', when: { eraGroups: ['early'], areas: EARLY_CHILI, minYear: 1540 }, text: { ko: '빨간 고추를 처음으로 깨물었어요. 혀에 불이 난 줄 알았어요.', en: 'You bit into a red chili for the first time. You thought your tongue was on fire.' } },
  // 품에 넣는 작은 시계는 1500년대 유럽에서 나왔다
  { id: 'l.early.child.watch', stage: 'child', when: { eraGroups: ['early'], regions: ['europe'] }, text: { ko: '부잣집 어른이 품에서 작은 시계를 꺼내 봤어요. 시간을 넣고 다니는 사람인 줄 알았어요.', en: 'You saw someone rich pull a little clock from a pocket. You thought they carried time around with them.' } },
  { id: 'l.early.child.print', stage: 'child', when: { eraGroups: ['early'], areas: EARLY_PRINT }, text: { ko: '찍어 낸 그림 한 장을 얻어 벽에 붙였어요. 빛이 바래도 떼지 않았어요.', en: 'You were given a printed picture and stuck it on the wall. It faded, but you never took it down.' } },
  { id: 'l.early.teen.song', stage: 'teen', when: { eraGroups: ['early'], coast: true, areas: EARLY_SHIP }, text: { ko: '뱃사람들한테서 낯선 노래를 배웠어요. 무슨 뜻인지는 끝내 몰랐어요.', en: 'You picked up a strange song from the sailors. You never did learn what it meant.' } },
  { id: 'l.early.teen.coffee', stage: 'teen', when: { eraGroups: ['early'], areas: EARLY_COFFEE, minYear: 1555 }, text: { ko: '어른들 몰래 커피를 한 모금 마셨어요. 그날 밤 눈이 말똥말똥했어요.', en: 'You sneaked a sip of the grown-ups’ coffee. You lay wide awake all night.' } },
  { id: 'l.early.adult.tuber', stage: 'adult', when: { eraGroups: ['early'], tags: ['farm'], areas: EARLY_TUBER }, text: { ko: '바다 건너 왔다는 작물을 처음 심어 봤어요. 캐 보니 땅속에 알이 주렁주렁 달려 있었어요.', en: 'You tried planting a crop said to come from across the sea. When you dug it up, lumps hung all over the roots.' } },
  { id: 'l.early.adult.sailor', stage: 'adult', when: { eraGroups: ['early'], coast: true, areas: EARLY_SHIP }, text: { ko: '먼바다로 나갔던 이웃이 여러 해 만에 돌아왔어요. 다들 한참 만에야 알아봤어요.', en: 'A neighbor who went to sea came home after many years. It took everyone a while to recognize them.' } },
  { id: 'l.early.adult.map', stage: 'adult', when: { eraGroups: ['early'], areas: EARLY_MAP }, text: { ko: '새로 그린 지도에서 우리 고장을 찾아봤어요. 아무리 봐도 없었어요.', en: 'You looked for your home on a newly drawn map. No matter how hard you looked, it wasn’t there.' } },
  { id: 'l.early.middle.reading', stage: 'middle', when: { eraGroups: ['early'], areas: EARLY_BOOK }, text: { ko: '저녁이면 누가 책을 소리 내어 읽고 다들 둘러앉아 들었어요. 같은 대목에서 다 같이 숨을 죽였어요.', en: 'In the evenings someone read aloud and everyone listened. At the same point in the story, everyone held their breath.' } },
  { id: 'l.early.middle.tea', stage: 'middle', when: { eraGroups: ['early'], areas: EARLY_TEA }, text: { ko: '일하다 차 한 잔 마시며 쉬는 짬이 하루 중 가장 좋았어요.', en: 'The break for a cup of tea became the best part of your working day.' } },
  // 광장 시계: 카드 「시계탑」과 같은 유럽
  { id: 'l.early.old.clock', stage: 'old', when: { eraGroups: ['early'], regions: ['europe'] }, text: { ko: '광장 시계가 늘 조금씩 늦게 갔어요. 이제는 당신 걸음도 그랬어요.', en: 'The town clock always ran a little slow. These days, so did you.' } },
  { id: 'l.early.old.mapkids', stage: 'old', when: { eraGroups: ['early'], areas: EARLY_MAP }, text: { ko: '아이들이 지도를 펴 놓고 가 본 곳을 짚어 보라고 했어요. 손가락이 별로 움직이지 않았어요.', en: 'Some children spread out a map and asked you to point to where you had been. Your finger barely moved.' } },

  // ── 근대 (industrial, 1800~1950). 기차·신문·사진·가스등은 1850년부터(시대 11) ──
  { id: 'l.ind.child.lamps', stage: 'child', when: { eraGroups: ['industrial'], eras: [11], tags: IND_TOWN, areas: IND_GAS }, text: { ko: '저녁마다 가스등 켜는 사람을 따라다녔어요. 등이 하나 켜질 때마다 손뼉을 쳤어요.', en: 'Every evening you trailed after the lamplighter, clapping each time another lamp came on.' } },
  { id: 'l.ind.child.hats', stage: 'child', when: { eraGroups: ['industrial'], eras: [11], tags: IND_TOWN, areas: IND_NEWS }, text: { ko: '어른들이 다 읽은 신문으로 모자를 접어 썼어요. 머리에 세상 소식을 이고 다녔어요.', en: 'You folded the grown-ups’ old newspapers into hats. You went about wearing the world’s news on your head.' } },
  // 학교에 다닌 아이만 (카드 「학교」에서 글을 배우면 literate)
  { id: 'l.ind.child.bell', stage: 'child', when: { eraGroups: ['industrial'], flags: ['literate'] }, text: { ko: '학교 종이 울리면 늘 제일 먼저 뛰어나갔어요.', en: 'When the school bell rang, you were always first out the door.' } },
  { id: 'l.ind.teen.train', stage: 'teen', when: { eraGroups: ['industrial'], eras: [11], areas: IND_RAIL }, text: { ko: '처음으로 기차를 탔어요. 창밖이 너무 빨리 지나가서 하나도 못 봤어요.', en: 'You rode a train for the first time. Everything outside went by too fast to see.' } },
  { id: 'l.ind.teen.chimney', stage: 'teen', when: { eraGroups: ['industrial'], eras: [11], areas: IND_CHIMNEY }, text: { ko: '공장 굴뚝을 세어 보는 버릇이 생겼어요. 셀 때마다 하나씩 늘어 있었어요.', en: 'You got into the habit of counting the factory chimneys. Every time, there was one more.' } },
  { id: 'l.ind.adult.machines', stage: 'adult', when: { eraGroups: ['industrial'], tags: ['factory'] }, text: { ko: '공장 기계 소리가 귀에 배어서 집에 와서도 들렸어요.', en: 'The factory machines rang in your ears long after you got home.' } },
  { id: 'l.ind.adult.news', stage: 'adult', when: { eraGroups: ['industrial'], eras: [11], areas: IND_NEWS }, text: { ko: '신문에 난 먼 나라 소식을 두고 이웃들과 밤늦도록 입씨름했어요. 그 나라에 가 본 사람은 없었어요.', en: 'You argued with the neighbors late into the night over news from a far-off country. None of you had ever been there.' } },
  { id: 'l.ind.adult.school', stage: 'adult', when: { eraGroups: ['industrial'], eras: [11], flags: ['kids'], areas: IND_SCHOOL }, text: { ko: '아이를 처음 학교에 보냈어요. 아이보다 당신이 더 떨렸어요.', en: 'You sent your child off to school for the first time. You were more nervous than they were.' } },
  // 오래 가만히 있어야 했던 옛 사진
  { id: 'l.ind.middle.photo', stage: 'middle', when: { eraGroups: ['industrial'], eras: [11], areas: IND_PHOTO }, text: { ko: '사진 찍는 날, 눈을 감을까 봐 끝까지 눈을 부릅떴어요. 사진 속 얼굴이 화난 사람 같았어요.', en: 'On photograph day you were so afraid of blinking that you glared the whole time. In the picture, you looked furious.' } },
  { id: 'l.ind.middle.gas', stage: 'middle', when: { eraGroups: ['industrial'], eras: [11], tags: ['craft', 'trade', 'elite'], areas: IND_GAS }, text: { ko: '집에 가스등을 들였어요. 밤이 이렇게 환해도 되나 싶었어요.', en: 'You had gas lighting put in at home. It seemed almost too bright for night.' } },
  { id: 'l.ind.old.railway', stage: 'old', when: { eraGroups: ['industrial'], eras: [11], areas: IND_RAIL }, text: { ko: '철길이 놓인 뒤로 고장이 몰라보게 바뀌었어요. 좋아진 건지는 끝내 알 수 없었어요.', en: 'Since the railway came, the place had changed beyond recognition. Whether for the better, you never could decide.' } },
  { id: 'l.ind.old.photo', stage: 'old', when: { eraGroups: ['industrial'], eras: [11], areas: IND_PHOTO }, text: { ko: '오래전에 찍은 사진을 꺼내 봤어요. 사진 속에서 자기를 찾는 데 한참 걸렸어요.', en: 'You dug out a photograph taken long ago. It took you a while to spot yourself in it.' } },

  // ── 현대 (modern, 1950~) ─────────────────────────────────────────
  // 물건이 퍼진 해부터만 (minYear): 냉장고 1960 · 텔레비전 1965~1970 · 집 전화 1960~1975 · 화면·일터 컴퓨터 1985 · 비행기 여행 1975(도시 집안)
  { id: 'l.mod.child.phone', stage: 'child', when: { eraGroups: ['modern'], minYear: 1975 }, text: { ko: '처음으로 전화를 받았어요. 저쪽 목소리에 대고 고개만 끄덕였어요.', en: 'You answered the phone for the first time and just nodded at the voice on the other end.' } },
  { id: 'l.mod.child.plane', stage: 'child', when: { eraGroups: ['modern'] }, text: { ko: '비행기 소리가 나면 하늘부터 올려다봤어요. 언젠가 꼭 타 보리라 마음먹었어요.', en: 'At the sound of a plane you always looked up. Someday, you promised yourself, you would ride in one.' } },
  // 냉장고·버스 출근·일터 컴퓨터는 도시 쪽 집안만 (농사짓는 집은 뺀다)
  { id: 'l.mod.child.fridge', stage: 'child', when: { eraGroups: ['modern'], tags: MOD_TOWN, minYear: 1960 }, text: { ko: '냉장고 문을 열어 놓고 한참 서 있다가 혼났어요.', en: 'You got told off for standing in front of the open fridge.' } },
  { id: 'l.mod.teen.screen', stage: 'teen', when: { eraGroups: ['modern'], minYear: 1985 }, text: { ko: '밤늦게까지 화면을 들여다보다가 혼났어요.', en: 'You got scolded for staring at a screen past midnight.' } },
  { id: 'l.mod.teen.call', stage: 'teen', when: { eraGroups: ['modern'], tags: MOD_TOWN, minYear: 1960 }, text: { ko: '누군가의 전화를 기다리느라 저녁 내내 전화기 곁을 떠나지 못했어요.', en: 'You hovered by the phone all evening, waiting for one particular call.' } },
  { id: 'l.mod.adult.bus', stage: 'adult', when: { eraGroups: ['modern'], tags: MOD_TOWN }, text: { ko: '날마다 꽉 찬 버스에 끼여 일하러 갔어요. 선 채로 조는 법을 익혔어요.', en: 'Every day you squeezed onto a packed bus to work. You learned to doze standing up.' } },
  { id: 'l.mod.adult.computer', stage: 'adult', when: { eraGroups: ['modern'], tags: MOD_TOWN, minYear: 1985 }, text: { ko: '하필 가장 바쁜 날 일터 컴퓨터가 멈췄어요. 다들 아는 처방은 껐다 켜기뿐이었어요.', en: 'The computer at work froze on the busiest day of all. The only cure anyone knew was to switch it off and on again.' } },
  { id: 'l.mod.adult.serial', stage: 'adult', when: { eraGroups: ['modern'], minYear: 1970 }, text: { ko: '텔레비전 연속극 할 시간에 맞춰 저녁을 먹었어요. 그 시간엔 동네가 조용했어요.', en: 'Supper was timed around the evening TV serial. While it was on, the whole street went quiet.' } },
  { id: 'l.mod.middle.flight', stage: 'middle', when: { eraGroups: ['modern'], tags: MOD_TOWN, minYear: 1975 }, text: { ko: '처음으로 비행기를 탔어요. 구름 위는 생각보다 조용했어요.', en: 'You flew for the first time. Above the clouds, it was quieter than you had imagined.' } },
  { id: 'l.mod.middle.fridge', stage: 'middle', when: { eraGroups: ['modern'], tags: MOD_TOWN, minYear: 1960 }, text: { ko: '냉장고 안에 언제 넣었는지 모를 것들이 자꾸 늘어 갔어요.', en: 'The fridge kept filling up with things nobody remembered putting there.' } },
  { id: 'l.mod.old.tv', stage: 'old', when: { eraGroups: ['modern'], minYear: 1970 }, text: { ko: '텔레비전을 켜 놓은 채 잠드는 날이 늘었어요. 끄면 바로 깼어요.', en: 'More and more often you dozed off with the TV on. Turn it off, and you woke right up.' } },
  { id: 'l.mod.old.bus', stage: 'old', when: { eraGroups: ['modern'] }, text: { ko: '버스 기사가 내릴 곳을 알아서 챙겨 줬어요. 문도 조금 더 오래 열어 줬어요.', en: 'The bus driver knew your stop by heart and held the door a little longer for you.' } },

  // ── 지역 (지역마다 2줄). 같은 주제의 지역 카드와 단계가 겹치지 않게 했다 ──
  { id: 'l.r.east.kite', stage: ['child', 'teen'], when: { regions: ['east'], areas: ['china', 'korea', 'japan'], eraGroups: ['medieval', 'early', 'industrial', 'modern'] }, text: { ko: '설날에 연을 날렸어요. 줄이 끊겨 연이 산 너머로 갔어요.', en: 'You flew a kite at New Year. The string snapped and it sailed over the hill.' } },
  { id: 'l.r.east.pickle', stage: ['teen', 'adult', 'middle', 'old'], when: { regions: ['east'], areas: ['china', 'korea', 'japan'], eraGroups: ['medieval', 'early', 'industrial', 'modern'] }, text: { ko: '겨울을 앞두고 식구들과 채소를 소금에 절여 독에 담았어요. 손끝이 며칠이나 쓰라렸어요.', en: 'Before winter, you and the family salted vegetables and packed them into crocks. Your fingertips stung for days.' } },
  { id: 'l.r.south.damp', stage: ['teen', 'adult', 'middle', 'old'], when: { regions: ['south'], areas: ['india', 'bengal', 'lanka', 'himalaya'], eraGroups: ['ancient', 'medieval', 'early', 'industrial', 'modern'] }, text: { ko: '몬순 철 내내 아무것도 마르지 않았어요. 빨래는 포기하고 눅눅한 채로 지냈어요.', en: 'All monsoon long, nothing would dry. You gave up on the washing and just stayed damp.' } },
  // 등불 축제는 기록이 뚜렷한 중세부터
  { id: 'l.r.south.lamps', stage: ['child', 'adult', 'middle', 'old'], when: { regions: ['south'], areas: ['india', 'bengal', 'lanka', 'himalaya'], eraGroups: ['medieval', 'early', 'industrial', 'modern'] }, text: { ko: '등불 축제 밤, 바람에 꺼진 등잔을 다시 켜느라 늦게까지 바빴어요.', en: 'On the night of the lamp festival, you were busy till late relighting the lamps the wind blew out.' } },
  // 대추야자는 메소포타미아·아라비아·나일·이란·마그레브의 오아시스와 강가
  { id: 'l.r.west.dates', stage: ['child', 'teen'], when: { regions: ['west'], areas: ['mesopotamia', 'arabia', 'nile', 'iran', 'maghreb'], eraGroups: ['ancient', 'medieval', 'early', 'industrial', 'modern'] }, text: { ko: '대추야자 따는 철이었어요. 바구니보다 입에 들어간 게 더 많았어요.', en: 'It was date-picking season. More dates went into your mouth than into the basket.' } },
  // 낙타 대상: 카드 「낙타 행렬」과 같이 철기 시대(시대 4)부터 1950년 전까지
  { id: 'l.r.west.bells', stage: ['child', 'adult', 'middle', 'old'], when: { regions: ['west'], eraGroups: ['ancient', 'medieval', 'early', 'industrial'], eras: [4, 5, 6, 7, 8, 9, 10, 11] }, text: { ko: '낙타 행렬이 마을을 지나갔어요. 방울 소리가 멀어질 때까지 귀를 기울였어요.', en: 'A camel caravan passed through. You listened until the last of its bells had faded.' } },
  // 문이 막힐 만큼 눈이 쌓이는 북쪽·동쪽 유럽과 알프스
  { id: 'l.r.europe.snow', stage: ['teen', 'adult', 'middle', 'old'], when: { regions: ['europe'], areas: ['east_europe', 'germany', 'nordic'], eraGroups: ['ancient', 'medieval', 'early', 'industrial', 'modern'] }, text: { ko: '밤새 눈이 쌓여 문이 꿈쩍도 안 했어요. 누가 먼저 파고 나갈지를 두고 한참 다퉜어요.', en: 'Snow piled up overnight and the door wouldn’t budge. There was a long argument over who would dig out first.' } },
  // 교회 종: 북유럽·동유럽까지 교회가 선 1000년(시대 7)부터. 오스만 아래에서 종을 못 치던 발칸은 뺀다
  { id: 'l.r.europe.bell', stage: ['child', 'teen', 'adult', 'middle', 'old'], when: { regions: ['europe'], areas: ['east_europe', 'france', 'italy', 'germany', 'iberia', 'britain', 'nordic'], eraGroups: ['medieval', 'early', 'industrial', 'modern'], eras: [7, 8, 9, 10, 11, 12] }, text: { ko: '성당 종이 울리면 다들 하던 일을 멈추고 잠깐 고개를 들었어요.', en: 'When the church bell rang, everyone paused what they were doing and looked up for a moment.' } },
  { id: 'l.r.africa.drums', stage: ['teen', 'adult', 'middle', 'old'], when: { regions: ['africa'], eraGroups: ['ancient', 'medieval', 'early', 'industrial', 'modern'] }, text: { ko: '밤늦도록 먼 마을에서 북소리가 들려왔어요. 무슨 일인지는 아침에야 알았어요.', en: 'Drums sounded from a distant village late into the night. Only in the morning did you learn why.' } },
  // 비를 기다리는 건기는 어느 시대에나 있다. 비가 늘 많은 콩고 숲은 뺀다
  { id: 'l.r.africa.rain', stage: ['child', 'teen', 'middle', 'old'], when: { regions: ['africa'], areas: ['west_africa', 'east_africa', 'south_africa'] }, text: { ko: '기다리던 비가 마침내 왔어요. 다들 밖으로 나가 그냥 비를 맞고 서 있었어요.', en: 'The long-awaited rain finally came. Everyone went outside and simply stood in it.' } },
  // 옥수수는 중세에는 아메리카 거의 모든 땅에 퍼져 있었다. 손으로 껍질 벗기기는 1950년 전까지
  { id: 'l.r.americas.husk', stage: ['teen', 'adult', 'middle', 'old'], when: { regions: ['americas'], eraGroups: ['medieval', 'early', 'industrial'] }, text: { ko: '옥수수를 거둔 밤, 다 같이 둘러앉아 껍질을 벗겼어요. 옥수수보다 이야기가 더 많았어요.', en: 'The night the maize came in, everyone sat in a circle husking. There was more talk than corn.' } },
  // 다리 없이 큰 강을 건너던 때 (카드 「불어난 강」과 같은 땅)
  { id: 'l.r.americas.ford', stage: ['child', 'teen', 'middle', 'old'], when: { regions: ['americas'], areas: ['north_america', 'brazil', 'la_plata'], eraGroups: ['forager', 'ancient', 'medieval', 'early', 'industrial'] }, text: { ko: '불어난 강을 건너야 했어요. 건너편에 닿고서야 숨이 제대로 쉬어졌어요.', en: 'You had to cross a swollen river. Only on the far bank could you breathe properly again.' } },
  // 계단 논은 중세부터 (카드 「계단 논」과 같은 땅)
  { id: 'l.r.seaoc.water', stage: ['child', 'teen', 'middle', 'old'], when: { regions: ['seaoc'], areas: ['indonesia', 'mainland_sea', 'philippines'], eraGroups: ['medieval', 'early', 'industrial', 'modern'] }, text: { ko: '계단 논에 물을 대는 날이었어요. 맨 아래 논 주인이 제일 오래 기다렸어요.', en: 'It was the day to let water into the terraces. The family with the lowest paddy waited longest.' } },
  // 섬과 섬 사이를 카누로 오가던 땅
  { id: 'l.r.seaoc.canoe', stage: ['adult', 'middle'], when: { regions: ['seaoc'], areas: ['indonesia', 'philippines', 'malay', 'pacific'], eraGroups: ['ancient', 'medieval', 'early', 'industrial', 'modern'] }, text: { ko: '카누를 저어 이웃 섬에 다녀왔어요. 돌아오는 길엔 팔이 남의 팔 같았어요.', en: 'You paddled a canoe to the next island and back. On the return trip, your arms felt like someone else’s.' } },
];

// 잠시 멈춤 질문 (플레이어 자신에게 묻는다)
// 땅·자리 고유 줄 (작업 7)
for (const l of [...LOCAL_LINES_SA, ...LOCAL_LINES_EA, ...LOCAL_LINES_EU, ...LOCAL_LINES_AM]) { if (l.weight == null) l.weight = 3; LINES.push(l); }   // 고유 줄도 가중치 3 (deck.js LOCAL_WEIGHT 와 같은 값)

export const PAUSE_Q = {
  5: { ko: '당신이 다섯 살 때 가장 좋아했던 것은 무엇이었나요?', en: 'What did you love most when you were five?' },
  15: { ko: '열다섯의 당신은 무엇을 가장 걱정했나요?', en: 'What did you worry about most at fifteen?' },
  30: { ko: '서른의 당신이 꼭 지키고 싶은 것은 무엇인가요?', en: 'At thirty, what do you most want to keep safe?' },
  50: { ko: '쉰이 되면 무엇을 내려놓고 싶나요?', en: 'At fifty, what would you like to let go of?' },
  70: { ko: '일흔의 당신에게 지금 한마디 한다면요?', en: 'What would you say now to yourself at seventy?' },
};
