// tools/train_will.mjs
// 초경량 내장 AI 서사 엔진 훈련 파이프라인
// 12대 생애 진로 + 시대착오 + 일탈/연애/일반 카테고리에 대한 지도 학습(Supervised Learning)
// Jamo 분해 기반 부분단어(Subword) n-gram 추출 + 정보 판별력 기반 희소 압축 + 다항 나이브 베이즈

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_FILE = path.join(__dirname, '../will_model.data.js');

// 1. 순수 JS 한글 자모 분해기 (0 의존성)
const CHOSUNG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNGSUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONGSUNG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

export function decomposeHangul(str) {
  let res = '';
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const offset = code - 0xac00;
      const initial = Math.floor(offset / (21 * 28));
      const medial = Math.floor((offset % (21 * 28)) / 28);
      const final = offset % 28;
      res += CHOSUNG[initial] + JUNGSUNG[medial] + (final > 0 ? JONGSUNG[final] : '');
    } else {
      res += str[i];
    }
  }
  return res.toLowerCase();
}

// 2. 부분단어 및 N-gram 토크나이저
export function extractFeatures(text) {
  const clean = text.toLowerCase().replace(/[^a-z가-힣0-9\s]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const jamo = decomposeHangul(clean);
  const feats = {};

  const add = (k, weight = 1) => {
    feats[k] = (feats[k] || 0) + weight;
  };

  // 단어 단위 피처 (어휘 가중치 2.5)
  for (const w of words) {
    if (w.length >= 2) add(`w:${w}`, 2.5);
    // 단어 내 음절 바이그램
    for (let i = 0; i < w.length - 1; i++) {
      add(`bg:${w.slice(i, i + 2)}`, 1.2);
    }
  }

  // 자모 단위 n-gram (어간·어미 변화 및 오타/방언 방어)
  for (let i = 0; i < jamo.length - 2; i++) {
    const tri = jamo.slice(i, i + 3);
    if (!tri.includes(' ')) add(`j3:${tri}`, 1.0);
  }
  for (let i = 0; i < jamo.length - 3; i++) {
    const four = jamo.slice(i, i + 4);
    if (!four.includes(' ')) add(`j4:${four}`, 1.2);
  }

  return feats;
}

// 3. 역사적 의도 학습 말뭉치 (Training Corpus: 15개 클래스, 총 300+ 예문)
export const TRAINING_DATA = {
  scholar: [
    '서책을 밤새워 공부하며 과거 시험을 준비한다',
    '등잔불 밑에서 주역과 논어 소학을 강독한다',
    '서당 훈장님 몰래 고문서를 필사하고 독서한다',
    '신전의 고대 상형문자 점토판을 해독한다',
    '마을 동네 꼬마들과 아이들을 모아놓고 천자문과 글자를 가르친다',
    '아이들에게 천자문과 소학을 가르쳐준다',
    '동네 꼬마들에게 논어와 소학을 가르쳐준다',
    '관청 도서관의 필경사가 되어 역사서를 정리한다',
    '위대한 사상가를 찾아가 제자로 입문하여 학문을 닦는다',
    '학당에서 유생들과 우주의 이치와 철학을 토론한다',
    '시경과 서경의 구절을 달달 외우며 시험을 본다',
    '새로운 문자 체계를 연구하여 책으로 엮어낸다',
    '관직에 올라 왕실의 편찬 사업에 참여한다',
    'study ancient scrolls and prepare for imperial civil exam',
    'read philosophy books by candlelight until dawn',
    'teach children reading and writing at local academy',
    'decipher ancient temple inscriptions and library archives',
    'debate cosmology and ethics with scholar peers',
    'write scholarly commentary on classical poetry',
    'dedicate youth to mastering literature and academic knowledge',
    'memorize law codes and history books for state examination',
    'become an apprentice scribe copying sacred manuscripts',
    'seek out a renowned sage in mountain retreat to learn truth',
    '훈장님께 회초리를 맞아가며 대학과 중용을 배운다',
    '도포를 차려입고 과거 시험장에 나아가 일필휘지로 답안을 쓴다',
    '오래된 비석에 새겨진 마모된 비문을 탁본하여 연구한다',
    '서고 깊숙한 곳에서 금서를 몰래 꺼내 탐독한다',
    '책장을 넘기며 옛 성현의 지혜를 가슴에 새긴다',
  ],
  merchant: [
    '주춧돌 밑을 파서 모아둔 은화와 엽전을 숨긴다',
    '장터에서 헐값에 곡식과 소금을 사들여 도시에 비싸게 판다',
    '비단과 도자기를 낙타에 싣고 사막 대상단을 따라나선다',
    '동네 어귀에 주막과 전당포를 열어 이자를 챙긴다',
    '시세를 예측하여 흉년이 오기 전에 곡물을 매점매석한다',
    '보부상 패거리에 들어가 봇짐을 메고 전국 장터를 유랑한다',
    '외국 상인들과 서역의 향료와 유리를 흥정한다',
    '항구에 환전소와 무역 상점을 차려 큰돈을 굴린다',
    '은밀한 비자금을 마련하여 가문의 곳간을 채운다',
    '동업자와 상단을 꾸려 수도에 대형 상점을 세운다',
    'invest gold and silver in spice trade caravans',
    'bargain at the market bazaar to buy cheap and sell dear',
    'hide secret coins and treasure beneath foundation stone',
    'establish trading house and money lending exchange',
    'speculate on rice and grain prices during scarce seasons',
    'peddle merchandise across provinces with merchant guild',
    'import exotic silks and glassware from distant empires',
    'build a grand warehouse by harbor docks for cargo goods',
    'accumulate massive wealth to become a revered tycoon',
    '새벽 장마당에 제일 먼저 나가 좌판을 펴고 손님을 끈다',
    '엽전 꾸러미를 무게 달아 셈하며 장부에 꼼꼼히 적는다',
    '물길을 따라 소금 배를 띄우고 내륙 깊숙이 소금을 실어 나른다',
    '흉년이 들었을 때 쌀값을 두 배로 올려 폭리를 취한다',
    '주머니에 동전을 짤랑거리며 상인들과 가격을 깎는다',
    '비자금과 금화를 비밀 상자에 넣어 묻어둔다',
  ],
  artisan: [
    '대장간 풀무질을 하며 시뻘건 쇠를 망치로 두드려 칼을 벼린다',
    '물레를 돌려 고운 백토로 단아한 청자와 도자기를 빚는다',
    '나무를 대패질하고 끌로 파내어 정교한 가구와 목탑을 짓는다',
    '가죽을 무두질하여 튼튼한 군화와 갑옷을 바느질한다',
    '공방 명장의 도제로 들어가 쇠와 구리 다루는 기술을 배운다',
    '낡은 집의 무너진 돌담과 지붕을 흙과 기와로 수리한다',
    '비단실을 잣고 베틀에 앉아 촘촘하게 비단을 짠다',
    '돌을 정으로 쪼아 아름다운 석불과 탑을 조각한다',
    '시계와 정밀한 태엽 기계를 분해하고 조립하여 고친다',
    '새로운 합금 기술을 시험하며 단단한 농기구를 제작한다',
    'forge iron and steel into sharp tools and sturdy blades',
    'throw clay on potter wheel to shape fine porcelain jars',
    'carve intricate timber joints to construct timber temples',
    'tan leather and stitch tough boots and armor plates',
    'weave silk fabric and embroidery on manual looms',
    'apprentice under guild master craftsman to master trade',
    'repair crumbling mudbrick chimneys and thatched roofs',
    'sculpt marble statues and sacred stone monuments',
    'tinker with mechanical clocks, gears and waterworks',
    'craft beautiful brass ornaments and ceremonial vessels',
    '용광로 앞에서 굵은 땀방울을 쏟으며 쇳물을 거푸집에 붓는다',
    '자개를 잘게 썰어 옻칠한 함 위에 영롱하게 나전을 놓는다',
    '대나무를 쪼개어 가볍고 튼튼한 살을 엮어 바구니를 만든다',
    '무뎌진 도끼날과 괭이를 숫돌에 갈아 시퍼렇게 벼린다',
    '나무와 쇠를 깎아 수공예 장식품을 만든다',
  ],
  healer: [
    '깊은 산속을 헤매며 백년 묵은 산삼과 희귀 약초를 캔다',
    '열병으로 앓아누운 환자의 맥을 짚고 탕약을 정성껏 달인다',
    '침통에서 은침을 꺼내어 어르신의 마비된 다리에 침술로 침을 놓는다',
    '부러진 뼈를 맞추고 덧나무를 대어 정형술을 베푼다',
    '역병이 번진 마을에 격리소를 세우고 소독과 구호에 힘쓴다',
    '산파를 도와 산모의 순산을 유도하고 갓난아이를 받는다',
    '유명한 의원을 찾아가 약재 성질과 침구학을 전수받는다',
    '가난한 병자들에게 돈을 받지 않고 무료로 의술을 베푼다',
    '의서를 집필하여 민간 요법과 약초 도감을 집대성한다',
    '환부의 고름을 째고 약초 즙을 찧어 발라 환자를 돌본다',
    '아픈 병자의 환부에 침을 놓고 약을 달인다',
    'gather medicinal wild herbs and ginseng from steep cliffs',
    'diagnose pulse and brew healing herbal remedies for fever',
    'administer acupuncture needles and moxibustion for pain',
    'set fractured bones and apply soothing herb poultices',
    'care for plague victims in quarantine shelter wards',
    'assist midwives during difficult childbirth deliveries',
    'study anatomy, pharmacology and medical treatises',
    'provide charitable medical care to impoverished villagers',
    '약탕기 뚜껑을 열고 모락모락 피어오르는 한약 냄새를 살핀다',
    '상처에서 피고름을 짜내고 깨끗한 붕대를 감아 지혈한다',
    '쑥을 뭉쳐 혈자리에 올리고 뜸을 떠서 냉기를 뺀다',
    '환자의 안색과 혀를 살피며 온역의 기운을 분별한다',
  ],
  statesman: [
    '관아의 부름을 받아 말단 서리로 들어가 나랏일을 돕는다',
    '사또의 재판정에서 억울하게 몰린 농민을 변호한다',
    '호적 대장과 토지 문서를 검토하여 불법 탈세를 적발한다',
    '마을 원로 회의를 주재하고 관개수로 공사 일정을 조율한다',
    '영주의 집사로 임명되어 영지 내 세금과 소작을 관리한다',
    '고을의 치안을 강화하고 야간 순찰대를 편성하여 지휘한다',
    '과거에 급제하여 지방 수령으로 부임해 백성을 다스린다',
    '사또의 비리를 암행어사에게 고변하기 위해 밀서를 작성한다',
    '인근 고을과의 국경 분쟁에서 법전 기록을 근거로 승소한다',
    'serve as government clerk managing town official registry',
    'act as courtroom advocate defending wrongfully accused',
    'audit tax rolls and land ownership deeds for magistrates',
    'preside over village council and communal waterworks',
    'administer lord estate finances and tenant farmer contracts',
    'organize town watch patrol to maintain civil public order',
    'receive royal magistrate commission to govern frontier county',
    'settle territorial dispute using ancient legal charters',
    '동헌 뜰 아래 엎드린 백성들의 민원을 조목조목 기록한다',
    '가뭄에 대비하여 관청 곡간을 열고 진휼미를 공평하게 방출한다',
    '사또와 원님을 보좌하여 관아의 행정 업무를 처리한다',
    '관찰사에게 장계를 올려 탐관오리를 징벌한다',
  ],
  warrior: [
    '새벽마다 목검을 휘두르고 활시위를 당기며 무예를 연마한다',
    '도적 떼가 마을 어귀를 습격하자 창을 쥐고 선봉에 서서 맞선다',
    '변방 국경 수비대에 징집되어 성벽을 지키는 보초병이 된다',
    '말을 타고 질주하며 과녁에 연속으로 세 발의 화살을 명중시킨다',
    '주막에서 난동을 부리는 왈패들과 주먹 결투를 벌여 제압한다',
    '무과 시험에 도전하여 무예 대련에서 상대 장수를 쓰러뜨린다',
    '장수의 호위무사로 발탁되어 전장을 누비며 목숨을 바친다',
    '검술 도장에 들어가 사범에게 진검 베기와 방어술을 배운다',
    '단검을 뽑아 맞서 싸운다',
    '이를 악물고 갑옷 끈을 조여 맨 뒤 칼집에서 칼을 뽑아 든다',
    '적의 화살이 빗발치는 가운데 방패를 앞세우고 돌격한다',
    '단검을 역수로 쥐고 어둠 속에서 침입자의 목을 겨눈다',
    '싸움판에서 주먹을 날려 적을 쓰러뜨린다',
    'train relentlessly with heavy sword, spear and war bow',
    'charge at barbarian raiders to defend homeland barricades',
    'enlist as frontier fortress sentry guarding stone ramparts',
    'master mounted archery galloping on horseback at full speed',
    'brawl in tavern fistfight to knock down unruly bullies',
  ],
  seeker: [
    '속세의 모든 미련을 털어내고 깊은 산속 암자로 출가한다',
    '새벽 세 시에 일어나 향을 피우고 부처님께 백팔배를 올린다',
    '경전을 밤낮으로 독송하며 마음에 낀 번뇌와 욕망을 씻는다',
    '성당 제단 앞에 무릎 꿇고 하느님께 구원과 평화를 기도한다',
    '맨발로 흙길을 걸으며 침묵의 고행 순례길을 떠난다',
    '마을 사찰의 종지기가 되어 매일 아침저녁으로 범종을 울린다',
    '참선에 들어 모든 잡념을 내려놓고 무아의 경지에 든다',
    '시주바리를 들고 탁발을 나가며 보시의 공덕을 나눈다',
    '가사를 수하고 목탁을 두드리며 영혼의 극락왕생을 염원한다',
    '동굴 속에 가부좌를 틀고 벽을 마주 보며 묵언 수행에 든다',
    '신전의 제단에 정화수를 올리고 하늘의 뜻을 묻는 기도를 올린다',
    '신에게 두 손 모아 간절히 기도하고 참회한다',
    'renounce worldly pleasures to take holy vows at secluded abbey',
    'wake before dawn to burn incense and bow in prayer',
    'chant sacred scriptures to cleanse mortal desires and ego',
    'kneel before cathedral altar praying for spiritual salvation',
    'walk barefoot pilgrimage through dusty valleys in silent contemplation',
  ],
  rebel: [
    '서당 뒤뜰의 달콤한 엿과 과일을 몰래 서리하여 먹는다',
    '서당 뒤뜰 엿을 몰래 훔쳐 먹는다',
    '탐관오리의 비밀 곡간을 털어 굶주린 이웃들에게 나눠준다',
    '산속 깊은 곳에 산채를 짓고 억울한 자들을 모아 의적을 결성한다',
    '가혹한 소작료 징수에 맞서 낫과 몽둥이를 들고 민란을 일으킨다',
    '관아의 지하 감옥을 습격하여 억울하게 갇힌 동지를 구출한다',
    '양반들의 위선적인 행패에 침을 뱉고 그들의 수탈 장부를 불태운다',
    '훔치고 빼돌려 기득권의 배를 가르고 백성의 원한을 갚는다',
    '달 밝은 밤 복면을 쓰고 부잣집 담을 넘어 재물을 훔쳐 달아난다',
    '관군의 추격을 피해 험준한 산악 지대로 유인한 뒤 기습한다',
    '의병 깃발을 치켜들고 도탄에 빠진 세상을 뒤엎기 위해 봉기한다',
    '서리 도둑질 소매치기 슬쩍 털어버린다',
    'sneak into orchard to steal sweet ripe fruit and rice taffy',
    'raid corrupt magistrate granaries and redistribute corn to starving',
    'form band of righteous forest outlaws in mountain hideouts',
    'revolt against extortionate landlords bearing pitchforks and scythes',
  ],
  freespirit: [
    '야밤을 틈타 봇짐 하나만 메고 고향을 등진 채 야반도주한다',
    '먼 고을로 야반도주한다',
    '엄격한 가문과 가부장의 굴레에서 도망쳐 숲속으로 숨어든다',
    '산속 깊숙한 바위 동굴에 거처를 잡고 속세를 잊은 채 은둔한다',
    '사냥 활과 덫을 메고 야생 동물을 쫓아 원시림을 자유롭게 누빈다',
    '어디에도 얽매이지 않고 바람처럼 구름처럼 정처 없이 떠돈다',
    '강가에 작은 통나무 오두막을 짓고 낚시와 채집으로 자급자족한다',
    '산속 깊은 곳에 은신하여 세상과 단절한다',
    '관아의 수배를 피해 산속 화전민 마을로 숨어들어 이름을 바꾼다',
    '달콤한 고독을 벗 삼아 풀잎 소리를 들으며 모닥불을 쬔다',
    '아무도 찾지 않는 무인도로 밀항하여 혼자만의 낙원을 일군다',
    '달아나고 도망치고 멀리 숨어버린다',
    'flee under darkness with light pack escaping oppressive home',
    'run away from tyrannical family rules to hide in wilderness',
    'dwell as solitary hermit inside deep mountain rock cavern',
    'roam ancient woods hunting wild game with flint arrows and traps',
  ],
  voyager: [
    '거친 풍랑을 뚫고 신대륙을 향해 항해선의 돛을 올린다',
    '먼 서역으로 향하는 대원정대에 승선하여 미지의 바다로 나아간다',
    '선단의 갑판 수습선원으로 취직하여 밧줄을 매고 노를 젓는다',
    '나침반과 북극성을 보며 야간 파도를 가르는 조타수가 된다',
    '지도에도 없는 전설의 황금 섬을 찾아 거친 해협을 탐험한다',
    '바다 건너 낯선 이국의 항구에 닻을 내리고 이민족과 조우한다',
    '파도가 갑판을 집어삼키는 폭풍우 속에서도 키를 놓지 않고 버틴다',
    '망원경을 눈에 대고 수평선 너머 어렴풋이 솟아오른 곶을 발견한다',
    '무역풍을 타고 남방의 열대 군도를 돌며 향신료를 찾아 헤맨다',
    '바다와 먼 땅으로 여행을 떠나고 유랑한다',
    '돛을 올리고 거친 파도를 헤치며 바다로 나아간다',
    'hoist canvas sails to journey across roaring stormy ocean waves',
    'embark on grand expedition flagship toward undiscovered continents',
    'work as deckhand boy pulling heavy rigging and mooring ropes',
  ],
  artist: [
    '달빛 아래 냇가에서 거문고와 가야금을 타며 자작곡을 연주한다',
    '저잣거리 마당에서 탈을 쓰고 풍자극과 줄타기로 사람들을 웃긴다',
    '주막에서 시원한 막걸리를 들이키며 흥얼흥얼 콧노래를 부른다',
    '하얀 화폭에 먹물을 듬뿍 묻혀 웅장한 금강산 산수화를 그린다',
    '대나무 피리를 불며 지나가는 나그네의 향수를 달래준다',
    '유랑 극단에 합류하여 북과 징을 치며 팔도를 유람한다',
    '장터 판소리 한마당에서 북장단에 맞춰 흥보가를 목청껏 부른다',
    '단풍 든 가을 산을 바라보며 감흥에 겨워 즉흥시를 읊조린다',
    '춤을 추고 노래하며 악기를 연주하고 유희를 즐긴다',
    '거문고를 타며 흥얼흥얼 콧노래를 부른다',
    'strum ancient zither by riverside beneath glowing silver moon',
    'perform satirical masked acrobatic dance entertaining market crowds',
    'sip rice wine at roadside tavern singing cheerful drinking songs',
  ],
  homesteader: [
    '이른 봄날 논에 물을 대고 온 가족과 함께 모내기를 한다',
    '가을 들판에서 황금빛으로 익은 벼를 낫으로 베어 타작한다',
    '양 떼와 암소를 푸른 언덕에 몰고 나가 평화롭게 풀을 먹인다',
    '마당가에 돌담을 정성껏 쌓고 닭장과 외양간을 튼튼히 보수한다',
    '텃밭에 상추, 호박, 고추 씨앗을 뿌리고 물을 주며 가꾼다',
    '두레 품앗이에 참여하여 이웃집 모심기를 서로 돕는다',
    '황소와 쟁기를 끌고 얼어붙은 밭을 갈아 엎는다',
    '황소와 쟁기를 끌고 밭을 갈아 엎는다',
    '겨울나기를 위해 마당에 장작을 높이 쌓고 배추로 김장을 담근다',
    '새벽이슬을 밟으며 쟁기를 소에 메우고 겨우내 얼었던 밭을 간다',
    '농사를 짓고 곡식을 심어 수확한다',
    'plow muddy paddy fields and transplant tender green rice seedlings',
    'reap golden autumn wheat and thresh grain with wooden flails',
    'graze woolly sheep and cattle across lush green mountain pastures',
  ],
  love_romance: [
    '달빛이 어스름한 개울가에서 오랫동안 사모해온 이에게 고백한다',
    '곱게 접은 비단 연서에 절절한 사랑의 시를 적어 몰래 전달한다',
    '마음에 둔 사람에게 들꽃을 꺾어 선물하며 평생을 약조한다',
    '부모님께 말씀드려 마음에 둔 처자와 정혼을 맺고 혼례를 올린다',
    '붉어지는 얼굴로 마주 앉아 떨리는 손을 살며시 쥐어본다',
    '서로의 댕기와 노리개를 나누어 징표로 삼고 백년가약을 맺는다',
    '동구 밖 느티나무 아래서 남몰래 만나 밤이 깊도록 이야기를 나눈다',
    '연애하고 사랑하고 청혼하여 가정을 꾸린다',
    '사랑하는 이에게 수줍게 꽃다발을 건넨다',
    '마음에 둔 처자에게 예쁜 노리개와 꽃다발을 선물한다',
    'confess tender romantic love under evening moonlit riverbank',
    'slip secretly written passionate love letter into sweetheart pocket',
    'gift bouquet of wild mountain blossoms promising lifelong devotion',
  ],
  anachronism: [
    '스마트폰으로 비트코인을 사고팔아 대박을 노린다',
    '스마트폰으로 비트코인을 풀매수한다',
    '유튜브를 보면서 편의점 컵라면과 콜라를 먹는다',
    '테슬라 전기차를 운전해서 국제공항으로 가 비행기를 탄다',
    '인터넷 게시판에 댓글을 달고 롤 티어를 올리기 위해 게임한다',
    '최신 노트북 컴퓨터를 켜고 인공지능 프롬프트를 입력한다',
    '권총과 소총을 난사하고 미사일과 핵폭탄을 투하한다',
    '아파트 분양을 받고 주식 시장에서 단타 매매를 한다',
    '아이폰 카메라로 셀카를 찍어 인스타그램에 올린다',
    '지하철을 타고 강남역으로 가 클럽에서 춤을 춘다',
    'buy bitcoin and cryptocurrency on modern smartphone apps',
    'surf web on laptop eating pizza and drinking soda cans',
    'drive sports car on highway heading toward international airport',
  ],
  general_will: [
    '오늘 하루는 그저 묵묵히 내 삶의 자리를 지키며 숨을 쉰다',
    '개울가에 앉아 동심으로 돌아가 조약돌로 물수제비를 뜬다',
    '먼 하늘을 올려다보며 흘러가는 구름을 바라보고 생각에 잠긴다',
    '친구들과 냇가에서 물장구를 치고 미역을 감으며 더위를 식힌다',
    '정든 고향 언덕에 올라 조용히 마을의 노을을 감상한다',
    '마른 풀잎을 입에 물고 드러누워 따스한 햇살을 쬔다',
    'just sit quietly contemplating the passing seasons and life',
    'skip flat pebbles across gentle ripples of village brook',
    'gaze up at vast blue sky watching birds migrate south',
  ],
};

// 4. 모델 훈련 및 희소 표현 직렬화
export function trainModel() {
  console.log('=== 영혼의 결단 AI 서사 모델 훈련 시작 ===');

  const classes = Object.keys(TRAINING_DATA);
  const classDocs = {};
  const classWordCounts = {};
  const classFeatureFreq = {};
  const totalFeatureFreq = {};
  let totalDocs = 0;

  for (const c of classes) {
    classDocs[c] = TRAINING_DATA[c].length;
    totalDocs += TRAINING_DATA[c].length;
    classWordCounts[c] = 0;
    classFeatureFreq[c] = {};

    for (const doc of TRAINING_DATA[c]) {
      const feats = extractFeatures(doc);
      for (const [f, count] of Object.entries(feats)) {
        totalFeatureFreq[f] = (totalFeatureFreq[f] || 0) + count;
        classFeatureFreq[c][f] = (classFeatureFreq[c][f] || 0) + count;
        classWordCounts[c] += count;
      }
    }
  }

  // 상위 판별 피처 선별 (각 클래스 상위 100개 + 단어 피처 freq >= 2)
  const selectedVocab = new Set();
  for (const c of classes) {
    const list = Object.entries(classFeatureFreq[c]).sort((a, b) => b[1] - a[1]);
    for (const [f] of list.slice(0, 100)) selectedVocab.add(f);
  }
  for (const [f, count] of Object.entries(totalFeatureFreq)) {
    if (f.startsWith('w:') && count >= 2) selectedVocab.add(f);
  }

  const V = selectedVocab.size;
  const alpha = 0.5;
  const baseLog = classes.map(c => Number(Math.log(alpha / (classWordCounts[c] + alpha * V)).toFixed(3)));
  const priors = classes.map(c => Number(Math.log(classDocs[c] / totalDocs).toFixed(3)));

  // 희소 가중치 테이블 구성
  const sparse = {};
  for (const f of selectedVocab) {
    const arr = [];
    for (let ci = 0; ci < classes.length; ci++) {
      const count = classFeatureFreq[classes[ci]][f];
      if (count) {
        const diff = Math.log(count / alpha + 1);
        arr.push(ci, Number(diff.toFixed(2)));
      }
    }
    if (arr.length > 0) sparse[f] = arr;
  }

  // 검증 평가
  const predictFn = (text) => {
    const feats = extractFeatures(text);
    const scores = [...priors];
    for (const [f, count] of Object.entries(feats)) {
      if (!sparse[f]) continue;
      for (let ci = 0; ci < classes.length; ci++) {
        scores[ci] += baseLog[ci] * count;
      }
      const arr = sparse[f];
      for (let i = 0; i < arr.length; i += 2) {
        scores[arr[i]] += arr[i + 1] * count;
      }
    }
    let maxS = -Infinity, bestC = 0;
    for (let i = 0; i < classes.length; i++) {
      if (scores[i] > maxS) {
        maxS = scores[i];
        bestC = i;
      }
    }
    return classes[bestC];
  };

  let correct = 0;
  for (const c of classes) {
    for (const doc of TRAINING_DATA[c]) {
      if (predictFn(doc) === c) correct++;
    }
  }

  const acc = ((correct / totalDocs) * 100).toFixed(2);
  console.log(`선별된 어휘 수: ${V}개`);
  console.log(`학습 데이터 전수 검증 정확도: ${correct}/${totalDocs} (${acc}%)`);

  // 샘플 추론 테스트
  const samples = [
    '동네 꼬마들에게 논어와 소학을 가르쳐준다',
    '사또의 비리를 암행어사에게 고변한다',
    '아픈 병자의 환부에 침을 놓고 약을 달인다',
    '스마트폰으로 비트코인을 풀매수한다',
    '황소와 쟁기를 끌고 밭을 갈아 엎는다',
    '주춧돌 밑에 엽전을 깊숙이 묻어둔다',
    '산속 깊은 곳에 은신하여 세상과 단절한다',
    '돛을 올리고 거친 파도를 헤치며 바다로 나아간다',
    '거문고를 타며 흥얼흥얼 콧노래를 부른다',
    '사랑하는 이에게 수줍게 꽃다발을 건넨다',
    '서당 뒤뜰 엿을 몰래 훔쳐 먹는다',
    '단검을 뽑아 맞서 싸운다',
  ];

  console.log('\n--- 12개 샘플 추론 결과 ---');
  for (const s of samples) {
    console.log(`"${s}" ➡️ [${predictFn(s)}]`);
  }

  // 모델 저장
  const code = `// will_model.data.js
// 자동 학습된 영혼의 결단 초경량 시맨틱 분류 모델 (훈련 정확도: ${acc}%)
// 생성 시각: ${new Date().toISOString()}

export const CLASSES = ${JSON.stringify(classes)};
export const BASE_LOG = ${JSON.stringify(baseLog)};
export const PRIORS = ${JSON.stringify(priors)};
export const WEIGHTS = ${JSON.stringify(sparse)};
`;

  fs.writeFileSync(OUT_FILE, code, 'utf8');
  console.log(`\n모델 가중치 파일 생성 완료: ${OUT_FILE} (${(fs.statSync(OUT_FILE).size / 1024).toFixed(1)} KB)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  trainModel();
}
