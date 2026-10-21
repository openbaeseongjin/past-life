// 시대의 바람 표 (설계 3.1·3.2): 문화권 8 × 시대 묶음 6 기본값, 땅 덮어쓰기, 사건 수정. three·DOM 없는 순수 데이터 (계산은 context.js)
// 값은 「게임용 어림」이다. 사실 줄은 CONTENT-SOURCES.md 에 칸마다 출처를 남긴다. 확인이 안 되는 것은 넓은 말로 쓴다.
// 낱말 규칙
//   한국어: 조사를 붙일 수 있게 늘 한글 음절로 끝난다 (괄호·영문으로 끝나지 않게)
//   영어: 소문자, 관사 없음. 다만 고유명사(Christmas·Diwali·Eid·Kaiser·Sapa Inca …)는 대문자로 쓴다.
//         ruler 는 관사 없는 단수 칭호·단수 집합 명사 (East India Company · council of elders, 복수 금지). feast 는 이름이면 대문자(New Year Festival), 일반 명사면 소문자(hunt feast):
//         영어 {feast} 자리는 tokens.js feastEn 이 일반 명사에만 the 를 붙인다. school 은 배우는 자리(fireside · elders' circle)
//         crop·staple·cloth 는 물질 명사, coin·coinUnit·land·landUnit·beast 는 복수, 나머지는 단수 (tokens.js 와 같다)
// 칸 모양 (C 로 만든다)
//   words{15} · status{system, ranks{집안: {ko,en,rank 1~5,bound}}} · disease{endemic[], add[], remove[], medicine} · war{level, name}
//   tech{level, items[]} · school · literacy · firstYear · values{품목: 재산 점수 한 단위 값} · names{품목 이름}
//   숫자(medicine·tech.level·war.level·school·literacy)는 수 하나이거나 [[그 해부터, 값], …] 계단이다
// status.ranks 는 「그 묶음의 집안」만 담는다 (contextOf 가 인자로 받은 집안이 그 묶음에 없으면 빌려서 하나 더). 뒤 코드는 ranks[그 생의 household] 로만 읽는다.
// 문화권 칸은 묶음 순서대로 앞 칸을 물려받는다 (forager 는 따로). 땅 칸은 그 묶음에만 덮는다(all 은 수렵 밖 모든 묶음).
// 고대 묶음(−8000~599)은 삶의 절반이라, 문화권마다 기간(spans)으로 시대 계단을 둔다: 신석기 마을 → 구리·청동기 → 철기 → 고전기.
// 농사·목축이 아직 닿지 않은 땅(FARM_FROM)은 고대·중세·근세 묶음이라도 수렵 무리의 낱말(PRE_FARM)을 쓴다.
// 기간(spans)은 해로 정하고, 수렵 묶음(forager)에는 groups 에 적지 않는 한 닿지 않는다.

const W = (ko, en) => ({ ko, en });
const ws = (o) => { const r = {}; for (const k of Object.keys(o)) r[k] = W(o[k][0], o[k][1]); return r; };
const rs = (o) => { const r = {}; for (const k of Object.keys(o)) { const [ko, en, rank, bound = false] = o[k]; r[k] = { ko, en, rank, bound }; } return r; };
const list = (a) => a.map(([ko, en]) => W(ko, en));
// 줄임 열쇠 → 칸 모양
function C(o) {
  const c = {};
  if (o.w) c.words = ws(o.w);
  if (o.sys || o.r) { c.status = {}; if (o.sys) c.status.system = W(...o.sys); if (o.r) c.status.ranks = rs(o.r); }
  if (o.dz || o.dzAdd || o.dzDel || o.med !== undefined) {
    c.disease = {};
    if (o.dz) c.disease.endemic = o.dz;
    if (o.dzAdd) c.disease.add = o.dzAdd;
    if (o.dzDel) c.disease.remove = o.dzDel;
    if (o.med !== undefined) c.disease.medicine = o.med;
  }
  if (o.war !== undefined || o.warName) { c.war = {}; if (o.war !== undefined) c.war.level = o.war; if (o.warName) c.war.name = W(...o.warName); }
  if (o.tech !== undefined || o.items) { c.tech = {}; if (o.tech !== undefined) c.tech.level = o.tech; if (o.items) c.tech.items = list(o.items); }
  if (o.school !== undefined) c.school = o.school;
  if (o.lit !== undefined) c.literacy = o.lit;
  if (o.first) c.firstYear = W(...o.first);
  if (o.values) c.values = o.values;
  if (o.names) c.names = ws(o.names);
  return c;
}
// 기간: from~to (둘 다 그 해 포함)
const S = (from, to, o, groups) => ({ from, to, ...(groups ? { groups } : {}), set: C(o) });
const I = Infinity;

// ── 40개 땅 → 문화권 ──
// lands.js 의 세트(kit)는 3D 무대 세트라 아메리카·동남아·오세아니아 세트가 아직 없다(가까운 세트를 빌려 쓴다). 문화권은 사람 사는 모습의 묶음이라 둘을 따로 둔다.
export const ZONES = ['europe', 'southasia', 'eastasia', 'mudbrick', 'africa', 'americas', 'seaoc', 'steppe'];
export const ZONE_OF = {
  china: 'eastasia', japan: 'eastasia', korea: 'eastasia', mongolia: 'steppe',
  india: 'southasia', bengal: 'southasia', indus: 'southasia', himalaya: 'southasia', lanka: 'southasia',
  anatolia: 'mudbrick', iran: 'mudbrick', nile: 'mudbrick', mesopotamia: 'mudbrick', arabia: 'mudbrick', maghreb: 'mudbrick', steppe: 'steppe',
  east_europe: 'europe', france: 'europe', italy: 'europe', germany: 'europe', iberia: 'europe', britain: 'europe', nordic: 'europe', balkans: 'europe',
  west_africa: 'africa', east_africa: 'africa', congo: 'africa', south_africa: 'africa',
  mesoamerica: 'americas', andes: 'americas', brazil: 'americas', north_america: 'americas', la_plata: 'americas', caribbean: 'americas',
  indonesia: 'seaoc', mainland_sea: 'seaoc', philippines: 'seaoc', malay: 'seaoc', australia: 'seaoc', pacific: 'seaoc',
};

// 농사(또는 유목)가 그 땅에 자리 잡은 해 (대략, 게임용). 이 해 전은 PRE_FARM. 출처: CONTENT-SOURCES.md 「농사가 닿은 해」
export const FARM_FROM = {
  china: -7000, japan: -900, korea: -3500, mongolia: -3000,
  india: -6500, bengal: -2500, indus: -7000, himalaya: -2000, lanka: -1000,
  anatolia: -8500, iran: -7500, nile: -5500, mesopotamia: -9000, arabia: -5000, maghreb: -5000, steppe: -4000,
  east_europe: -5000, france: -5500, italy: -6000, germany: -5500, iberia: -5500, britain: -4000, nordic: -3900, balkans: -6500,
  west_africa: -2500, east_africa: -3000, congo: -1000, south_africa: 300,
  mesoamerica: -2500, andes: -2500, brazil: -1000, north_america: -1000, la_plata: 1580, caribbean: -500,
  indonesia: -2000, mainland_sea: -2500, philippines: -2000, malay: -2000, australia: 1788, pacific: -5000,
};

// 병 이름 (disease.endemic 의 id)
export const DISEASES = {
  plague: W('흑사병', 'plague'), smallpox: W('천연두', 'smallpox'), measles: W('홍역', 'measles'), malaria: W('학질', 'malaria'),
  tb: W('결핵', 'tuberculosis'), cholera: W('콜레라', 'cholera'), dysentery: W('이질', 'dysentery'), typhus: W('발진티푸스', 'typhus'),
  typhoid: W('장티푸스', 'typhoid'), leprosy: W('한센병', 'leprosy'), yellowfever: W('황열', 'yellow fever'), sleeping: W('수면병', 'sleeping sickness'),
  influenza: W('독감', 'influenza'), schisto: W('주혈흡충증', 'bilharzia'), dengue: W('뎅기열', 'dengue'), hepatitis: W('간염', 'hepatitis'),
  hiv: W('에이즈', 'HIV/AIDS'), worms: W('기생충', 'parasitic worms'),
};
// 의술 수준 이름 (설계 3.2)
export const MEDICINE_NAMES = [
  W('주술과 약초', 'charms and herbs'), W('경험 의학', 'folk experience'), W('체계 의학', 'systematic medicine'),
  W('종두', 'vaccination'), W('세균설과 소독', 'germ theory and antisepsis'), W('항생제', 'antibiotics'),
];
// 전쟁 수준 이름 (사건이 이름을 주지 않을 때)
export const WAR_NAMES = [W('평화로운 편', 'mostly at peace'), W('국경 다툼', 'border skirmishes'), W('전쟁', 'war'), W('땅이 전장', 'the land is a battlefield')];

// ── 집안 ──
// 묶음마다 기본 신분 (문화권·땅 칸이 덮는다)
export const GENERIC_RANKS = {
  forager: rs({ band: ['무리의 한 사람', 'member of the band', 3] }),
  ancient: rs({ farm: ['농민', 'farmer', 2], herd: ['목자', 'herder', 2], fish: ['어부', 'fisher', 2], craft: ['장인', 'craftworker', 3], serve: ['종', 'servant', 1, true], elite: ['귀족', 'noble', 5] }),
  medieval: rs({ farm: ['농민', 'peasant', 2], fish: ['어부', 'fisher', 2], craft: ['장인', 'craftworker', 3], trade: ['상인', 'merchant', 3], serve: ['하인', 'servant', 1, true], elite: ['영주', 'lord', 5] }),
  early: rs({ farm: ['농민', 'peasant', 2], sail: ['뱃사람', 'sailor', 2], craft: ['장인', 'artisan', 3], trade: ['상인', 'merchant', 3], serve: ['하인', 'servant', 1], elite: ['지주', 'landlord', 5] }),
  industrial: rs({ farm: ['농민', 'farmer', 2], factory: ['공장 노동자', 'factory worker', 2], craft: ['장인', 'artisan', 3], trade: ['상인', 'merchant', 3], sail: ['선원', 'sailor', 2], serve: ['하인', 'domestic servant', 1], elite: ['부유층', 'the well-to-do', 5] }),
  modern: rs({ farm: ['농부', 'farmer', 2], factory: ['공장 노동자', 'factory worker', 2], office: ['회사원', 'office worker', 3], shop: ['가게 주인', 'shopkeeper', 3], sail: ['선원', 'sailor', 2], pro: ['전문직', 'professional', 4] }),
};
// 그 묶음에 없는 집안(앞 묶음에서 태어나 넘어온 생)이 빌려 쓸 집안 차례
export const HH_FALLBACK = {
  band: ['herd', 'farm'], farm: ['herd'], herd: ['farm'], fish: ['sail', 'farm'], sail: ['fish', 'farm'], craft: ['factory', 'shop', 'farm'],
  trade: ['shop', 'craft', 'farm'], shop: ['trade', 'craft', 'farm'], serve: ['factory', 'farm'], elite: ['pro', 'trade', 'farm'],
  factory: ['craft', 'serve', 'farm'], office: ['trade', 'pro', 'farm'], pro: ['elite', 'office', 'farm'],
};
// 배울 기회 배율 (school × 이것, 1 넘으면 1)
export const HH_SCHOOL = { band: 1, farm: 0.9, herd: 0.7, fish: 0.8, sail: 0.8, craft: 1.1, trade: 1.3, shop: 1.2, serve: 0.5, elite: 2, factory: 0.9, office: 1.4, pro: 1.6 };

// ── 살림 값표 (설계 2.4) ──
// 묶음마다 [품목, 그 품목을 갖는 집안들, 고정 이름·단위]. 차례가 채우는 순서다 (농사: 땅→가축→돈 · 유목: 가축→천막 · 공장·사무: 돈→집)
// land·beast·coin·home 의 이름은 words 에서, garb 는 「{cloth} 옷」이다
export const GOODS_UNITS = {
  beast: W('마리', 'head'), home: W('채', 'houses'), tent: W('채', 'tents'), boat: W('척', 'boats'), tools: W('벌', 'sets'),
  hides: W('장', 'hides'), shop: W('칸', 'stalls'), stock: W('짐', 'loads'), garb: W('벌', 'sets'),
};
export const GOODS_NAMES = { tent: W('천막', 'tent'), boat: W('배', 'boat'), tools: W('연장', 'tools'), hides: W('가죽', 'hides'), shop: W('가게', 'shop'), stock: W('팔 물건', 'wares') };
const MEDIEVAL_ALL = ['farm', 'fish', 'craft', 'trade', 'serve', 'elite'];
export const GOODS_TEMPLATE = {
  forager: [['tools', ['band'], { name: W('돌날', 'stone blades'), unit: W('개', 'pieces') }], ['hides', ['band']], ['coin', ['band']]],
  ancient: [['land', ['farm', 'elite']], ['beast', ['farm', 'herd', 'elite']], ['tent', ['herd']], ['boat', ['fish']], ['tools', ['craft']],
    ['coin', ['farm', 'herd', 'fish', 'craft', 'serve', 'elite']], ['garb', ['serve']], ['home', ['fish', 'craft', 'elite']]],
  medieval: [['land', ['farm', 'elite']], ['beast', ['farm', 'herd', 'elite']], ['tent', ['herd']], ['boat', ['fish']], ['tools', ['craft']], ['shop', ['craft', 'trade']], ['stock', ['trade']],
    ['coin', [...MEDIEVAL_ALL, 'herd']], ['garb', ['serve']], ['home', ['fish', 'craft', 'trade', 'elite']]],
  early: [['land', ['farm', 'elite']], ['beast', ['farm', 'herd', 'elite']], ['tent', ['herd']], ['boat', ['sail']], ['tools', ['craft']], ['shop', ['craft', 'trade']], ['stock', ['trade']],
    ['coin', ['farm', 'herd', 'sail', 'craft', 'trade', 'serve', 'elite']], ['garb', ['serve']], ['home', ['sail', 'craft', 'trade', 'elite']]],
  industrial: [['land', ['farm', 'elite']], ['beast', ['farm']], ['boat', ['sail']], ['tools', ['craft']], ['shop', ['craft', 'trade']], ['stock', ['trade']],
    ['coin', ['farm', 'factory', 'craft', 'trade', 'sail', 'serve', 'elite']], ['garb', ['serve', 'factory']], ['home', ['factory', 'craft', 'trade', 'sail', 'elite']]],
  modern: [['land', ['farm']], ['beast', ['farm']], ['boat', ['sail']], ['shop', ['shop']], ['stock', ['shop']],
    ['coin', ['farm', 'factory', 'office', 'shop', 'sail', 'pro']], ['home', ['factory', 'office', 'shop', 'sail', 'pro']]],
};
// 한 단위가 재산 점수 몇 점인가 (게임용 어림). 칸의 values 가 덮는다
export const GROUP_VALUES = {
  forager: { tools: 6, hides: 3, coin: 1 },
  ancient: { land: 2, beast: 4, tent: 8, boat: 10, tools: 5, coin: 1, garb: 2, home: 12 },
  medieval: { land: 2, beast: 4, tent: 8, boat: 10, tools: 5, shop: 12, stock: 3, coin: 1, garb: 2, home: 12 },
  early: { land: 2, beast: 4, tent: 8, boat: 10, tools: 5, shop: 12, stock: 3, coin: 1, garb: 2, home: 12 },
  industrial: { land: 2, beast: 3, boat: 12, tools: 4, shop: 12, stock: 3, coin: 1, garb: 2, home: 15 },
  modern: { land: 5, beast: 3, boat: 15, shop: 15, stock: 3, coin: 0.1, home: 20 },
};

// ── 수렵 칸 (모든 문화권의 바탕) ──
const FORAGER = {
  w: {
    crop: ['나무 열매', 'wild fruit'], staple: ['구운 고기', 'roast meat'], coin: ['조개 구슬', 'shell beads'], coinUnit: ['알', 'beads'],
    land: ['사냥터', 'hunting grounds'], landUnit: ['하루 걸음', "days' walk"], beast: ['사슴', 'deer'], home: ['가죽 천막', 'hide tent'],
    holy: ['성스러운 바위', 'sacred rock'], ruler: ['무리의 어른', 'band elder'], feast: ['사냥 잔치', 'hunt feast'], cloth: ['가죽', 'hide'],
    market: ['물물교환 모임', 'trading meet'], healer: ['주술사', 'shaman'], school: ['모닥불 곁', 'fireside'],
  },
  sys: ['무리', 'the band'], r: { band: ['무리의 한 사람', 'member of the band', 3] },
  dz: ['worms'], med: 0, war: 0, tech: 0, items: [['뗀석기', 'chipped stone tools'], ['활과 화살', 'bow and arrow'], ['불', 'fire']],
  school: 0.1, lit: 0,
  first: ['아이가 첫 해를 넘겼어요. 무리가 돌아가며 아이를 안아 보았어요.', 'The child made it through a first year. The whole band took turns holding it.'],
};
const forager = (w, extra = {}) => C({ ...FORAGER, ...extra, w: { ...FORAGER.w, ...w } });

// 신분제가 생기기 전 마을의 중립 신분 이름 (고대 묶음의 이른 계단)
const NEUTRAL = {
  farm: ['농사짓는 집', 'farming household', 2], herd: ['가축 치는 집', 'herding household', 2], fish: ['고기잡이 집', 'fishing household', 2],
  craft: ['장인 집', 'artisan household', 2], serve: ['남의 집에 매인 사람', 'bonded dependant', 1, true], elite: ['마을 어른 집안', "village elders' family", 4],
};
const SA_FIRST = ['첫 해를 넘긴 아이를 마을 어른들이 한 번씩 안아 보았어요.', 'Each village elder took a turn holding the child that had made it through a first year.'];
// 첫돌 케이크는 19세기 후반부터 농가에 퍼진 것으로 본다. 그 앞은 빵 줄
const BREAD = ['첫 생일이라고 따로 잔치는 없었어요. 그래도 그날 저녁 빵이 조금 더 하얬어요.', 'There was no party for a first birthday. Still, the bread that evening was a little whiter.'];
const CAKE = ['첫 생일에 작은 케이크가 나왔어요. 초는 하나였고, 아이는 그걸 먹으려 했어요.', 'There was a small cake on the first birthday. One candle, which the child tried to eat.'];

// ── 문화권 기본값 ──
export const ZONE_DATA = {
  // 유럽: 고대(기원전 600년 앞은 선사), 봉건제, 신분제, 산업·계급, 시민 사회
  europe: {
    forager: forager({ crop: ['개암', 'hazelnuts'], beast: ['붉은사슴', 'red deer'] }),
    ancient: C({
      w: {
        crop: ['밀', 'wheat'], staple: ['빵', 'bread'], coin: ['은화', 'silver coins'], coinUnit: ['닢', 'coins'], land: ['밭', 'fields'], landUnit: ['뙈기', 'plots'],
        beast: ['소', 'cattle'], home: ['초가집', 'thatched house'], holy: ['신전', 'temple'], ruler: ['족장', 'chieftain'], feast: ['수확 잔치', 'harvest feast'],
        cloth: ['모직', 'wool'], market: ['장터', 'market'], healer: ['약초꾼', 'herbalist'], school: ['선생의 집', "tutor's house"],
      },
      sys: ['자유민과 노예', 'free folk and slaves'],
      r: { farm: ['자유민 농부', 'free farmer', 2], herd: ['목자', 'herder', 2], fish: ['어부', 'fisher', 2], craft: ['장인', 'craftworker', 3], serve: ['노예', 'slave', 1, true], elite: ['귀족', 'noble', 5] },
      dz: ['malaria', 'tb', 'dysentery'], med: [[-8000, 1], [-400, 2]], war: 1,
      tech: [[-8000, 1], [-2200, 2]], items: [['쟁기', 'plough'], ['철 연장', 'iron tools'], ['돌림판', "potter's wheel"]],
      school: 0.08, lit: [[-8000, 0], [-700, 0.03], [-300, 0.06]],
      first: ['한 해를 넘긴 아이를 위해 집안 신들에게 작은 제물을 바쳤어요.', "For the child's first year, a small offering went to the household gods."],
    }),
    medieval: C({
      w: {
        coin: ['은화', 'silver pennies'], coinUnit: ['닢', 'pennies'], landUnit: ['뙈기', 'strips'], beast: ['소', 'oxen'], home: ['초가집', 'cottage'],
        holy: ['교회', 'church'], ruler: ['왕', 'king'], feast: ['성탄절', 'Christmas'], school: ['교회 학교', 'church school'],
      },
      sys: ['봉건제', 'feudalism'],
      r: { farm: ['자유농', 'free peasant', 2], fish: ['어부', 'fisherman', 2], craft: ['장인', 'craftsman', 3], trade: ['상인', 'merchant', 3], serve: ['농노', 'serf', 1, true], elite: ['영주', 'lord', 5] },
      dz: ['smallpox', 'tb', 'dysentery', 'leprosy'], med: 2, war: 1,
      tech: [[600, 2], [1050, 3]], items: [['무거운 쟁기', 'heavy plough'], ['물레방아', 'watermill'], ['풍차', 'windmill']],
      school: 0.08, lit: [[600, 0.03], [1300, 0.08]],
      first: ['생일을 따로 세지는 않았어요. 아이 이름을 딴 성인의 축일에 촛불을 하나 더 켰어요.', 'Nobody kept birthdays, but on the feast of the saint the child was named for, one more candle was lit.'],
    }),
    early: C({
      w: { coin: ['은화', 'silver coins'], coinUnit: ['닢', 'coins'], home: ['오두막', 'cottage'], healer: ['이발사 외과의', 'barber-surgeon'], school: ['교구 학교', 'parish school'] },
      sys: ['신분제', 'the estates of the realm'],
      r: { farm: ['농민', 'peasant', 2], sail: ['뱃사람', 'sailor', 2], craft: ['장인', 'artisan', 3], trade: ['상인', 'merchant', 3], serve: ['하인', 'servant', 1], elite: ['귀족', 'noble', 5] },
      dz: ['smallpox', 'tb', 'typhus', 'dysentery'], med: [[1500, 2], [1796, 3]],
      tech: 3, items: [['인쇄기', 'printing press'], ['화약', 'gunpowder'], ['범선', 'sailing ship']],
      school: 0.2, lit: [[1500, 0.1], [1650, 0.2], [1750, 0.3]],
      first: ['첫 생일이라고 따로 잔치는 없었어요. 그래도 그날 저녁 빵이 조금 더 하얬어요.', 'There was no party for a first birthday. Still, the bread that evening was a little whiter.'],
    }),
    industrial: C({
      w: {
        coin: ['동전', 'coins'], coinUnit: ['닢', 'coins'], beast: ['소', 'cows'], home: ['벽돌집', 'brick house'], cloth: ['면', 'cotton'],
        market: ['시장', 'market'], healer: ['의사', 'doctor'], school: ['학교', 'school'],
      },
      sys: ['계급 사회', 'class society'],
      r: { farm: ['농민', 'farmer', 2], factory: ['공장 노동자', 'factory hand', 2], craft: ['장인', 'artisan', 3], trade: ['가게 주인', 'shopkeeper', 3], sail: ['선원', 'sailor', 2], serve: ['하인', 'domestic servant', 1], elite: ['부유층', 'the well-to-do', 5] },
      dz: ['tb', 'cholera', 'typhoid', 'smallpox', 'measles'], med: [[1800, 3], [1870, 4], [1945, 5]],
      tech: [[1800, 4], [1920, 5]], items: [['증기 기관', 'steam engine'], ['철도', 'railway'], ['전신', 'telegraph']],
      school: [[1800, 0.3], [1880, 0.7]], lit: [[1800, 0.35], [1870, 0.55], [1910, 0.8]],
      first: BREAD,
    }),
    modern: C({
      w: {
        coin: ['지폐', 'banknotes'], coinUnit: ['장', 'notes'], landUnit: ['헥타르', 'hectares'], beast: ['젖소', 'dairy cows'], home: ['집', 'house'],
        ruler: ['정부', 'government'], market: ['슈퍼마켓', 'supermarket'],
      },
      sys: ['시민 사회', 'civil society'],
      dz: ['influenza'], med: 5, war: 0,
      tech: 5, items: [['전기', 'electricity'], ['텔레비전', 'television'], ['자동차', 'car']],
      school: 0.95, lit: [[1950, 0.93], [1980, 0.98]],
      first: ['첫 생일 케이크에 초 하나가 꽂혔어요. 사진이 여러 장 남았어요.', 'One candle on the first-birthday cake. Several photographs survive.'],
    }),
    spans: [
      S(-I, -601, {
        w: { staple: ['보리죽', 'barley porridge'], coin: ['보리', 'barley'], coinUnit: ['자루', 'sacks'], holy: ['선돌', 'standing stones'], healer: ['주술사', 'cunning man'], school: ['어른들의 이야기 자리', "elders' circle"] },
        sys: ['족장과 씨족', 'chieftains and clans'],
        first: ['첫 해를 넘긴 아이 목에 작은 구슬 하나를 걸어 주었어요.', 'A small bead was hung round the neck of the child who had passed its first year.'],
      }),
      // 고대 묶음 계단: 신석기(돌·토기) → 청동기(−2200) → 철기(−800) → 고전기(−600, 기본 칸)
      S(-I, -4001, { w: { holy: ['성스러운 샘', 'sacred spring'], cloth: ['아마포', 'linen'] }, items: [['간석기', 'polished stone axes'], ['토기', 'pottery'], ['뒤지개', 'digging stick']] }),
      S(-4000, -2201, { items: [['간석기', 'polished stone axes'], ['토기', 'pottery'], ['나무 쟁기', 'ard plough']] }),
      S(-2200, -801, { items: [['청동 도끼', 'bronze axes'], ['토기', 'pottery'], ['나무 쟁기', 'ard plough']] }),
      S(-800, -601, { items: [['철 연장', 'iron tools'], ['나무 쟁기', 'ard plough'], ['토기', 'pottery']] }),
      S(600, 1179, { items: [['무거운 쟁기', 'heavy plough'], ['물레방아', 'watermill'], ['낫', 'sickles']] }, ['medieval']),   // 유럽 풍차는 1180년대부터
      S(1347, 1720, { dzAdd: ['plague'] }),
      S(1800, 1829, { items: [['증기 기관', 'steam engine'], ['방적기', 'spinning frame'], ['운하', 'canal']] }),
      S(1830, 1849, { items: [['증기 기관', 'steam engine'], ['철도', 'railway'], ['증기선', 'steamship']] }),
      S(1870, 1949, { first: CAKE }, ['industrial']),
      S(1900, 1949, { items: [['전기', 'electricity'], ['철도', 'railway'], ['전화', 'telephone']] }),
      S(1990, I, { items: [['컴퓨터', 'computer'], ['휴대전화', 'mobile phone'], ['인터넷', 'internet']] }),
    ],
  },

  // 남아시아: 바르나와 자티, 라자, 바이디야(아유르베다), 비가, 루피
  southasia: {
    forager: forager({ crop: ['야생 열매', 'wild fruit'], home: ['바위 그늘', 'rock shelter'], holy: ['바위 그림', 'painted rock'] }),
    ancient: C({
      w: {
        crop: ['쌀', 'rice'], staple: ['밥', 'rice'], coin: ['은화', 'silver coins'], coinUnit: ['닢', 'coins'], land: ['논', 'paddies'], landUnit: ['뙈기', 'plots'],
        beast: ['소', 'cattle'], home: ['흙집', 'mud house'], holy: ['사원', 'temple'], ruler: ['라자', 'raja'], feast: ['수확 축제', 'harvest festival'],
        cloth: ['면', 'cotton'], market: ['장터', 'market'], healer: ['바이디야', 'vaidya'], school: ['구루의 집', "guru's house"],
      },
      sys: ['바르나와 자티', 'varna and jati'],
      r: {
        farm: ['농사짓는 자티', 'a farming jati', 2], herd: ['소 치는 자티', 'a herding jati', 2], fish: ['고기잡이 자티', 'a fishing jati', 2],
        craft: ['장인 자티', 'an artisan jati', 2], serve: ['남의 집에 매인 사람', 'bonded dependant', 1, true], elite: ['사제와 왕족', 'priests and royals', 5],
      },
      dz: ['malaria', 'dysentery', 'leprosy'], med: [[-8000, 1], [-500, 2]], war: 1,
      tech: [[-8000, 1], [-2600, 2]], items: [['쟁기', 'plough'], ['철 연장', 'iron tools'], ['베틀', 'loom']],
      school: 0.05, lit: [[-8000, 0], [-2600, 0.01], [-300, 0.03]],
      first: ['여섯 달 무렵, 아이 입에 처음으로 쌀밥을 넣어 주는 작은 의식을 치렀어요.', 'At about six months, the child was given its first mouthful of rice in a small rite.'],
    }),
    medieval: C({
      w: { landUnit: ['비가', 'bighas'], feast: ['디왈리', 'Diwali'], school: ['파트샬라', 'pathshala'] },
      r: {
        farm: ['농민 집(자티)', 'farming household (jati)', 2], fish: ['어부 자티', 'a fishing jati', 2], craft: ['장인 자티', 'an artisan jati', 2],
        trade: ['상인 자티', 'a merchant jati', 3], serve: ['남의 집에 매인 사람', 'bonded dependant', 1, true], elite: ['사제나 지주 집안', 'priestly or landholding family', 5],
      },
      dz: ['malaria', 'smallpox', 'dysentery', 'leprosy'], med: 2,
      tech: [[600, 2], [1300, 3]], items: [['페르시아 수차', 'Persian wheel'], ['물레', 'spinning wheel'], ['철 연장', 'iron tools']],
      school: 0.06, lit: 0.04,
    }),
    early: C({
      r: {
        farm: ['농민 집(자티)', 'farming household (jati)', 2], sail: ['뱃사람 자티', 'a seafaring jati', 2], craft: ['장인 자티', 'an artisan jati', 2],
        trade: ['상인 자티', 'a merchant jati', 3], serve: ['남의 집에 매인 사람', 'bonded dependant', 1, true], elite: ['지주 (자민다르)', 'zamindar (landholder)', 5],
      },
      dz: ['malaria', 'smallpox', 'dysentery', 'cholera'], med: 2,
      tech: 3, items: [['화약', 'gunpowder'], ['물레', 'spinning wheel'], ['손베틀', 'handloom']], school: 0.08, lit: 0.05,
    }),
    industrial: C({
      w: { coin: ['루피', 'rupees'], coinUnit: ['루피', 'rupees'], market: ['바자르', 'bazaar'] },
      sys: ['식민 통치 아래 자티', 'jati under colonial rule'],
      r: {
        farm: ['농민 집(자티)', 'farming household (jati)', 2], factory: ['방직 공장 노동자', 'mill hand', 2], craft: ['장인 자티', 'an artisan jati', 2],
        trade: ['상인 자티', 'a merchant jati', 3], sail: ['라스카르 선원', 'lascar sailor', 2], serve: ['남의 집에 매인 사람', 'bonded dependant', 1, true], elite: ['지주 (자민다르)', 'zamindar (landholder)', 5],
      },
      dz: ['cholera', 'malaria', 'smallpox', 'tb'], med: [[1800, 2], [1830, 3], [1920, 4]],
      tech: [[1800, 3], [1860, 4]], items: [['철도', 'railway'], ['전신', 'telegraph'], ['방직 공장', 'cotton mill']],
      school: [[1800, 0.06], [1900, 0.12], [1940, 0.2]], lit: [[1800, 0.04], [1900, 0.06], [1940, 0.12]],
    }),
    modern: C({
      w: { home: ['벽돌집', 'brick house'], ruler: ['정부', 'government'], healer: ['의사', 'doctor'], school: ['학교', 'school'] },
      values: { coin: 0.0002 },
      sys: ['법 앞의 평등, 남은 자티', 'equal by law, with jati lingering'],
      dz: ['tb', 'malaria', 'dengue'], med: 5, war: 0,
      tech: [[1950, 3], [1990, 4], [2005, 5]], items: [['라디오', 'radio'], ['펌프 우물', 'tube well'], ['재봉틀', 'sewing machine']],
      school: [[1950, 0.3], [1980, 0.55], [2000, 0.85]], lit: [[1950, 0.18], [1980, 0.4], [2000, 0.6], [2015, 0.72]],
      first: ['첫 생일에 케이크를 잘랐고, 할머니는 따로 작은 기도를 올렸어요.', 'There was a cake on the first birthday, and grandmother said a small prayer of her own.'],
    }),
    spans: [
      // 고대 묶음 계단: 마을(바르나 전) → 부족과 라자(−1200) → 바르나(−1000) → 바르나와 자티(300). 「바이샤」 같은 바르나 이름은 쓰지 않는다
      S(-I, -1201, {
        w: {
          crop: ['보리', 'barley'], staple: ['보리죽', 'barley porridge'], land: ['밭', 'fields'], ruler: ['마을 어른', 'village elder'], holy: ['신성한 나무', 'sacred tree'],
          healer: ['약초꾼', 'herbalist'], school: ['어른들의 이야기 자리', "elders' circle"],
        },
        sys: ['씨족과 마을', 'kin groups and villages'], r: NEUTRAL,
      }),
      S(-2000, -1201, { w: { crop: ['쌀', 'rice'], staple: ['밥', 'rice'], land: ['논', 'paddies'] } }),
      S(-I, -2001, { dzDel: ['leprosy'] }),   // 남아시아 한센병의 가장 이른 뼈 증거는 기원전 2000년 무렵
      S(-1200, -1001, { sys: ['부족과 라자', 'tribes and rajas'], r: NEUTRAL }),
      S(-1200, -501, { w: { holy: ['불 제단', 'fire altar'], healer: ['약초꾼', 'herbalist'] } }),
      S(-1000, 299, { sys: ['바르나', 'varna (the four estates)'], r: { ...NEUTRAL, elite: ['사제와 왕족', 'priests and royals', 5] } }),
      S(-500, 299, { w: { holy: ['성소', 'shrine'] } }),
      S(-I, -501, { w: { coin: ['조개', 'cowrie shells'], coinUnit: ['개', 'shells'] }, first: SA_FIRST }),
      S(-I, -2601, { items: [['간석기', 'polished stone tools'], ['토기', 'pottery'], ['뒤지개', 'digging stick']] }),
      S(-2600, -1201, { items: [['구리 연장', 'copper tools'], ['쟁기', 'plough'], ['토기', 'pottery']] }),
      S(1540, 1799, { w: { coin: ['루피', 'rupees'], coinUnit: ['루피', 'rupees'] } }),
      S(1800, 1852, { items: [['화약', 'gunpowder'], ['물레', 'spinning wheel'], ['손베틀', 'handloom']] }),
      S(1850, I, { w: { school: ['학교', 'school'] } }),
      S(1896, 1930, { dzAdd: ['plague'] }),
      S(2000, I, { items: [['펌프 우물', 'tube well'], ['오토바이', 'motorbike'], ['휴대전화', 'mobile phone']] }),
    ],
  },

  // 동아시아: 기장·쌀, 동전, 사당·절, 황제·임금, 사농공상과 노비 (중국을 바탕으로, 한반도·일본은 땅 덮어쓰기)
  eastasia: {
    forager: forager({ crop: ['도토리', 'acorns'], home: ['움집', 'pit house'] }, { items: [['뗀석기', 'chipped stone tools'], ['토기', 'pottery'], ['활과 화살', 'bow and arrow']] }),
    ancient: C({
      w: {
        crop: ['기장', 'millet'], staple: ['죽', 'porridge'], coin: ['동전', 'bronze coins'], coinUnit: ['닢', 'coins'], land: ['밭', 'fields'], landUnit: ['뙈기', 'plots'],
        beast: ['소', 'oxen'], home: ['초가', 'thatched hut'], holy: ['사당', 'ancestral shrine'], ruler: ['왕', 'king'], feast: ['설', 'New Year'],
        cloth: ['삼베', 'hemp cloth'], market: ['장터', 'market'], healer: ['무당', 'shaman'], school: ['스승의 집', "teacher's house"],
      },
      sys: ['귀족과 평민', 'nobles and commoners'],
      r: { farm: ['평민 농부', 'commoner farmer', 2], herd: ['목자', 'herder', 2], fish: ['어부', 'fisher', 2], craft: ['장인', 'artisan', 2], serve: ['노비', 'bondservant', 1, true], elite: ['귀족', 'noble', 5] },
      dz: ['malaria', 'dysentery'], med: [[-8000, 1], [-200, 2]], war: 1,
      tech: [[-8000, 1], [-1600, 2]], items: [['쟁기', 'plough'], ['철 연장', 'iron tools'], ['베틀', 'loom']],
      school: 0.05, lit: [[-8000, 0], [-1200, 0.01], [-200, 0.03]],
      first: ['아이가 한 해를 넘기자, 조상께 그 일을 고했어요.', 'When the child passed one year, the ancestors were told.'],
    }),
    medieval: C({
      w: {
        crop: ['쌀', 'rice'], staple: ['밥', 'steamed rice'], coin: ['동전', 'copper cash'], coinUnit: ['문', 'cash'], land: ['논', 'paddies'], landUnit: ['무', 'mu'],
        home: ['초가', 'thatched house'], holy: ['절', 'Buddhist temple'], ruler: ['황제', 'emperor'], healer: ['의원', 'herb doctor'], school: ['글방', 'village school'],
      },
      sys: ['사농공상', 'the four occupations'],
      r: { farm: ['농민', 'peasant', 2], fish: ['어부', 'fisher', 2], craft: ['장인', 'artisan', 2], trade: ['상인', 'merchant', 2], serve: ['노비', 'bondservant', 1, true], elite: ['관리 집안', 'official family', 5] },
      dz: ['smallpox', 'malaria', 'dysentery', 'tb'], med: 2,
      tech: 3, items: [['종이', 'paper'], ['목판 인쇄', 'woodblock printing'], ['물레방아', 'water wheel']],
      school: 0.1, lit: [[600, 0.05], [1000, 0.1]],
      first: ['첫돌에 아이 앞에 붓과 책, 자와 동전을 늘어놓고 무엇을 집는지 지켜봤어요.', 'On the first birthday they laid a brush, a book, a ruler and coins before the child and watched which it grabbed.'],
    }),
    early: C({
      w: { coin: ['은', 'silver'], coinUnit: ['냥', 'taels'], cloth: ['무명', 'cotton'] },
      values: { coin: 3 },
      r: { farm: ['농민', 'peasant', 2], sail: ['뱃사공', 'boatman', 2], craft: ['장인', 'artisan', 2], trade: ['상인', 'merchant', 2], serve: ['노비', 'bondservant', 1, true], elite: ['향신', 'gentry', 5] },
      dz: ['smallpox', 'measles', 'tb', 'dysentery', 'malaria'], med: 2,
      tech: 3, items: [['화약', 'gunpowder'], ['인쇄', 'printing'], ['나침반', 'compass']],
      school: 0.15, lit: 0.2,
    }),
    industrial: C({
      sys: ['무너지는 옛 질서', 'the old order crumbling'],
      r: { farm: ['농민', 'peasant', 2], factory: ['공장 노동자', 'mill hand', 2], craft: ['장인', 'artisan', 2], trade: ['상인', 'merchant', 3], sail: ['뱃사공', 'boatman', 2], serve: ['하인', 'servant', 1], elite: ['지주', 'landlord', 5] },
      dz: ['cholera', 'tb', 'smallpox', 'malaria'], med: [[1800, 2], [1880, 3], [1920, 4]],
      tech: [[1800, 3], [1900, 4]], items: [['증기선', 'steamship'], ['철도', 'railway'], ['전신', 'telegraph']],
      school: [[1800, 0.15], [1910, 0.3]], lit: [[1800, 0.2], [1930, 0.3]],
    }),
    modern: C({
      w: {
        coin: ['지폐', 'banknotes'], coinUnit: ['장', 'notes'], home: ['집', 'house'], ruler: ['정부', 'government'], cloth: ['면', 'cotton'],
        market: ['시장', 'market'], healer: ['의사', 'doctor'], school: ['학교', 'school'],
      },
      values: { coin: 0.1 },
      sys: ['현대 시민', 'modern citizens'],
      dz: ['tb', 'hepatitis'], med: 5, war: 0,
      tech: [[1950, 4], [1990, 5]], items: [['라디오', 'radio'], ['텔레비전', 'television'], ['냉장고', 'refrigerator']],
      school: [[1950, 0.6], [1980, 0.9]], lit: [[1950, 0.4], [1980, 0.8], [2000, 0.95]],
      first: ['첫돌 상 앞에서 아이가 돈을 집었어요. 다들 웃었어요.', 'At the first-birthday table, the child grabbed the money. Everyone laughed.'],
    }),
    spans: [
      S(-I, -501, { w: { coin: ['조개', 'cowrie shells'], coinUnit: ['개', 'shells'] } }),
      // 고대 묶음 계단: 신석기 마을 → 청동기(−1600, 상) → 철기(−500, 기본 칸)
      S(-I, -1601, {
        w: { home: ['움집', 'pit house'], ruler: ['마을 어른', 'village elder'], holy: ['제사터', 'ritual ground'], school: ['어른들의 이야기 자리', "elders' circle"] },
        sys: ['씨족과 마을', 'clans and villages'], r: NEUTRAL, items: [['간석기', 'polished stone tools'], ['토기', 'pottery'], ['돌칼', 'stone reaping knife']],
      }),
      S(-1600, -501, { items: [['청동 그릇', 'bronze vessels'], ['돌칼', 'stone reaping knife'], ['베틀', 'loom']] }),
      S(600, 699, { items: [['종이', 'paper'], ['물레방아', 'water wheel'], ['쟁기', 'plough']] }, ['medieval']),   // 목판 인쇄는 700년 무렵부터
      S(1800, 1871, { items: [['화약', 'gunpowder'], ['인쇄', 'printing'], ['물레', 'spinning wheel']] }),
      S(1990, I, { items: [['컴퓨터', 'computer'], ['휴대전화', 'mobile phone'], ['고속철도', 'high-speed rail']] }),
    ],
  },

  // 서아시아·북아프리카(흙벽돌): 보리·납작빵, 세켈·디르함, 신전·모스크, 왕·칼리프·술탄, 수크
  mudbrick: {
    forager: forager({ crop: ['야생 보리', 'wild barley'], beast: ['가젤', 'gazelles'], home: ['둥근 움막', 'round hut'], holy: ['조상의 무덤', "ancestors' graves"] }),
    ancient: C({
      w: {
        crop: ['보리', 'barley'], staple: ['납작빵', 'flatbread'], coin: ['은화', 'silver coins'], coinUnit: ['닢', 'coins'], land: ['밭', 'fields'], landUnit: ['뙈기', 'plots'],
        beast: ['양', 'sheep'], home: ['흙벽돌집', 'mud-brick house'], holy: ['신전', 'temple'], ruler: ['왕', 'king'], feast: ['새해 축제', 'New Year Festival'],
        cloth: ['모직', 'wool'], market: ['장터', 'market'], healer: ['치료사', 'healer'], school: ['서기 학교', 'scribal school'],
      },
      sys: ['자유민과 노예', 'free people and slaves'],
      r: { farm: ['농부', 'farmer', 2], herd: ['목자', 'herder', 2], fish: ['어부', 'fisher', 2], craft: ['장인', 'craftworker', 3], serve: ['노예', 'slave', 1, true], elite: ['사제와 귀족', 'priests and nobles', 5] },
      dz: ['malaria', 'dysentery'], med: [[-8000, 1], [-300, 2]], war: 1,
      tech: [[-8000, 1], [-3200, 2]], items: [['철 연장', 'iron tools'], ['수레바퀴', 'wheel'], ['관개 수로', 'irrigation canals']],
      school: 0.03, lit: [[-8000, 0], [-3200, 0.01]],
      first: ['한 해를 넘긴 아이 목에 나쁜 눈을 막는 부적을 걸어 주었어요.', 'For its first year, the child wore a charm against the evil eye.'],
    }),
    medieval: C({
      w: {
        crop: ['밀', 'wheat'], coin: ['디르함', 'dirhams'], holy: ['모스크', 'mosque'], ruler: ['술탄', 'sultan'], feast: ['이드', 'Eid'], cloth: ['면', 'cotton'],
        market: ['수크', 'souk'], healer: ['하킴', 'hakim'], school: ['쿠타브', 'kuttab'],
      },
      sys: ['무슬림·딤미·노예', 'Muslims, dhimmis and slaves'],
      r: { farm: ['농민', 'peasant', 2], fish: ['어부', 'fisher', 2], craft: ['장인', 'artisan', 3], trade: ['상인', 'merchant', 4], serve: ['노예', 'slave', 1, true], elite: ['관리와 학자 집안', 'officials and scholars', 5] },
      dz: ['smallpox', 'malaria', 'dysentery'], med: 2,
      tech: 3, items: [['종이', 'paper'], ['풍차', 'windmill'], ['아스트롤라베', 'astrolabe']],
      school: 0.1, lit: 0.05,
      first: ['첫 이가 나자 밀을 삶아 단것과 섞어 이웃과 나눴어요.', 'When the first tooth came, they boiled wheat with sweets and shared it with the neighbors.'],
    }),
    early: C({
      w: { coin: ['은화', 'silver coins'] },
      r: { farm: ['농민', 'peasant', 2], sail: ['뱃사람', 'sailor', 2], craft: ['장인', 'artisan', 3], trade: ['상인', 'merchant', 4], serve: ['노예', 'slave', 1, true], elite: ['관리와 학자 집안', 'officials and scholars', 5] },
      tech: 3, items: [['화약', 'gunpowder'], ['대포', 'cannon'], ['종이', 'paper']],
    }),
    industrial: C({
      sys: ['개혁과 식민 통치', 'reform and colonial rule'],
      r: { farm: ['농민', 'peasant', 2], factory: ['공장 노동자', 'factory worker', 2], craft: ['장인', 'artisan', 3], trade: ['상인', 'merchant', 3], sail: ['선원', 'sailor', 2], serve: ['하인', 'servant', 1], elite: ['지주', 'landowner', 5] },
      dz: ['cholera', 'smallpox', 'malaria', 'tb'], med: [[1800, 2], [1850, 3], [1920, 4]],
      tech: [[1800, 3], [1860, 4]], items: [['증기선', 'steamship'], ['철도', 'railway'], ['전신', 'telegraph']],
      school: [[1800, 0.1], [1900, 0.2], [1940, 0.3]], lit: [[1800, 0.05], [1900, 0.1], [1940, 0.2]],
    }),
    modern: C({
      w: { coin: ['지폐', 'banknotes'], coinUnit: ['장', 'notes'], home: ['시멘트 집', 'concrete house'], ruler: ['정부', 'government'], healer: ['의사', 'doctor'], school: ['학교', 'school'] },
      values: { coin: 0.1 },
      sys: ['현대 시민', 'modern citizens'],
      dz: ['tb', 'dysentery'], med: 5,
      tech: [[1950, 4], [1990, 5]], items: [['석유', 'oil'], ['라디오', 'radio'], ['텔레비전', 'television']],
      school: [[1950, 0.35], [1980, 0.7], [2000, 0.9]], lit: [[1950, 0.2], [1980, 0.5], [2000, 0.75], [2015, 0.85]],
      first: ['첫 생일 케이크 옆에, 할머니가 푸른 눈 부적을 슬쩍 달아 두었어요.', 'Next to the first-birthday cake, grandmother quietly pinned up a blue evil-eye charm.'],
    }),
    spans: [
      S(-I, -601, { w: { coin: ['은 조각', 'weighed silver'], coinUnit: ['세켈', 'shekels'] } }),
      // 고대 묶음 계단: 신석기 마을 → 신전 마을(−5500) → 왕과 도시(−3000) · 수레바퀴와 청동(−3500) → 철기(−1200, 기본 칸)
      S(-I, -5501, {
        w: { ruler: ['마을 어른', 'village elder'], holy: ['성소', 'shrine'] }, sys: ['씨족과 마을', 'kin groups and villages'], r: NEUTRAL,
        items: [['맷돌', 'grinding stone'], ['흑요석 칼', 'obsidian blades'], ['간석기', 'polished stone tools']],
      }),
      S(-5500, -3001, {
        w: { ruler: ['신전의 어른', 'temple council'] }, sys: ['신전과 마을', 'temples and villages'], r: NEUTRAL,
        items: [['관개 수로', 'irrigation canals'], ['토기', 'pottery'], ['나무 쟁기', 'ard plough']],
      }),
      S(-I, -3001, { w: { coin: ['보리', 'barley'], coinUnit: ['자루', 'sacks'] } }),
      S(-I, -3201, { w: { school: ['어른들의 이야기 자리', "elders' circle"] } }),
      S(-3500, -1201, { items: [['수레바퀴', 'wheel'], ['청동 연장', 'bronze tools'], ['관개 수로', 'irrigation canals']] }),
      S(600, 639, { w: { coin: ['은화', 'silver coins'], holy: ['성소', 'shrine'], ruler: ['왕', 'king'], feast: ['새해 축제', 'New Year Festival'], market: ['장터', 'market'], healer: ['치료사', 'healer'], school: ['스승의 집', "teacher's house"] }, sys: ['자유민과 노예', 'free people and slaves'] }),
      S(600, 799, { items: [['물레방아', 'water wheel'], ['관개 수로', 'irrigation canals'], ['아스트롤라베', 'astrolabe']] }, ['medieval']),   // 종이·풍차는 800년 무렵부터
      S(632, 999, { w: { ruler: ['칼리프', 'caliph'] } }),
      S(1347, 1877, { dzAdd: ['plague'] }),
      S(1800, 1854, { items: [['화약', 'gunpowder'], ['대포', 'cannon'], ['물레방아', 'water wheel']] }),
      S(1990, I, { items: [['석유', 'oil'], ['위성 안테나', 'satellite dish'], ['휴대전화', 'mobile phone']] }),
    ],
  },

  // 사하라 이남 아프리카: 수수·얌, 구슬·조개, 둥근 초가, 조상의 신당, 족장·왕, 성년식, 식민 통치(1885~), 독립(1960~)
  africa: {
    forager: forager({ crop: ['야생 덩이뿌리', 'wild tubers'], beast: ['영양', 'antelope'], home: ['풀 움막', 'grass shelter'] }),
    ancient: C({
      w: {
        crop: ['수수', 'sorghum'], staple: ['수수죽', 'sorghum porridge'], coin: ['구슬', 'beads'], coinUnit: ['줄', 'strings'], land: ['밭', 'fields'], landUnit: ['뙈기', 'plots'],
        beast: ['소', 'cattle'], home: ['둥근 초가집', 'round hut'], holy: ['조상의 신당', 'ancestor shrine'], ruler: ['족장', 'chief'], feast: ['수확 잔치', 'harvest festival'],
        cloth: ['나무껍질 천', 'barkcloth'], market: ['장터', 'market'], healer: ['약초 의사', 'herbal doctor'], school: ['성년식 배움터', 'initiation camp'],
      },
      sys: ['씨족과 나이 또래', 'lineages and age-sets'],
      r: {
        farm: ['농사짓는 씨족원', 'farming kin', 2], herd: ['소 치는 집', 'cattle-keeping kin', 3], fish: ['어부', 'fisher', 2],
        craft: ['대장장이나 장인', 'smith or craftworker', 3], serve: ['남의 집에 매인 사람', 'bonded dependant', 1, true], elite: ['족장의 집안', "the chief's kin", 5],
      },
      dz: ['malaria', 'sleeping', 'dysentery'], med: 1, war: 1,
      tech: [[-8000, 1], [-600, 2]], items: [['괭이', 'hoe'], ['철 연장', 'iron tools'], ['토기', 'pottery']],
      school: 0.05, lit: 0,
      first: ['아이가 첫 해를 넘겼어요. 할머니가 아이를 업고 이웃마다 인사를 다녔어요.', 'The child made it past the first year. Grandmother carried it on her back to greet every neighbor.'],
    }),
    medieval: C({
      w: { ruler: ['왕', 'king'] },
      sys: ['왕국과 씨족', 'kingdoms and lineages'],
      r: {
        farm: ['농사짓는 씨족원', 'farming kin', 2], fish: ['어부', 'fisher', 2], craft: ['대장장이나 장인', 'smith or craftworker', 3],
        trade: ['상인', 'trader', 3], serve: ['노예', 'slave', 1, true], elite: ['왕족과 족장', 'royals and chiefs', 5],
      },
      dz: ['malaria', 'sleeping', 'smallpox', 'dysentery'],
      tech: 2, items: [['철 괭이', 'iron hoe'], ['베틀', 'loom'], ['청동 주조', 'bronze casting']],
      lit: 0.01,
    }),
    early: C({
      r: {
        farm: ['농사짓는 씨족원', 'farming kin', 2], sail: ['뱃사람', 'boatman', 2], craft: ['대장장이나 장인', 'smith or craftworker', 3],
        trade: ['상인', 'trader', 3], serve: ['노예', 'slave', 1, true], elite: ['왕족과 족장', 'royals and chiefs', 5],
      },
      dz: ['malaria', 'smallpox', 'yellowfever', 'sleeping', 'dysentery'],
      items: [['총', 'muskets'], ['쇠 연장', 'iron tools'], ['베틀', 'loom']],
    }),
    industrial: C({
      w: { cloth: ['면', 'cotton cloth'] },
      r: {
        farm: ['농민', 'peasant', 2], factory: ['광산이나 공장 노동자', 'mine or factory worker', 2], craft: ['장인', 'craftworker', 3],
        trade: ['상인', 'trader', 3], sail: ['뱃사람', 'boatman', 2], serve: ['하인', 'servant', 1], elite: ['족장과 부유층', 'chiefs and the well-off', 5],
      },
      dz: ['malaria', 'smallpox', 'sleeping', 'tb'], med: [[1800, 1], [1880, 2], [1910, 3], [1935, 4]],
      tech: [[1800, 2], [1900, 3], [1935, 4]], items: [['철도', 'railway'], ['자전거', 'bicycle'], ['재봉틀', 'sewing machine']],
      school: [[1800, 0.05], [1900, 0.08], [1940, 0.15]], lit: [[1800, 0.01], [1900, 0.03], [1940, 0.08]],
    }),
    modern: C({
      w: {
        crop: ['옥수수', 'maize'], staple: ['옥수수죽', 'maize porridge'], coin: ['지폐', 'banknotes'], coinUnit: ['장', 'notes'], home: ['양철 지붕 집', 'tin-roofed house'],
        holy: ['교회', 'church'], ruler: ['정부', 'government'], market: ['시장', 'market'], healer: ['의사', 'doctor'], school: ['학교', 'school'],
      },
      values: { coin: 0.1 },
      sys: ['독립 국가의 시민', 'citizens of new nations'],
      dz: ['malaria', 'tb'], med: 5,
      tech: [[1950, 3], [1990, 4], [2010, 5]], items: [['라디오', 'radio'], ['자전거', 'bicycle'], ['재봉틀', 'sewing machine']],
      school: [[1950, 0.25], [1980, 0.55], [2000, 0.75]], lit: [[1950, 0.15], [1980, 0.35], [2000, 0.55], [2015, 0.65]],
      first: ['첫 생일에 친척들이 모여 노래를 불렀어요. 사진관에서 사진도 한 장 찍었어요.', 'Relatives gathered and sang on the first birthday. There was even a photo from the studio.'],
    }),
    spans: [
      S(-I, -601, { items: [['돌괭이', 'stone hoe'], ['토기', 'pottery'], ['맷돌', 'grinding stone']] }),   // 철은 기원전 600년 무렵부터
      S(1800, 1889, { items: [['총', 'muskets'], ['쇠 괭이', 'iron hoe'], ['베틀', 'loom']] }),
      S(1850, 1949, { w: { school: ['선교 학교', 'mission school'] } }),
      S(1885, 1959, { w: { ruler: ['총독', 'governor'] }, sys: ['식민 통치', 'colonial rule'] }),
      S(1900, 1949, { w: { coin: ['실링', 'shillings'], coinUnit: ['실링', 'shillings'], holy: ['예배당', 'house of prayer'] } }),
      S(1985, I, { dzAdd: ['hiv'] }),
      S(2000, I, { items: [['라디오', 'radio'], ['태양광 판', 'solar panel'], ['휴대전화', 'mobile phone']] }),
    ],
  },

  // 아메리카 (브라질·라플라타·카리브 바탕. 메소아메리카·안데스·북아메리카는 땅 덮어쓰기)
  americas: {
    forager: forager({ crop: ['야생 씨앗', 'wild seeds'], home: ['나뭇가지 움막', 'brush shelter'] }, { items: [['뗀석기', 'chipped stone tools'], ['창던지개', 'spear-thrower'], ['불', 'fire']] }),
    ancient: C({
      w: {
        crop: ['카사바', 'cassava'], staple: ['카사바 빵', 'cassava bread'], coin: ['조개 구슬', 'shell beads'], coinUnit: ['줄', 'strings'], land: ['밭', 'fields'], landUnit: ['뙈기', 'plots'],
        beast: ['사슴', 'deer'], home: ['초가 오두막', 'thatched hut'], holy: ['성소', 'shrine'], ruler: ['족장', 'chief'], feast: ['수확 잔치', 'harvest festival'],
        cloth: ['면', 'cotton'], market: ['교역 모임', 'trading gathering'], healer: ['주술사', 'shaman'], school: ['어른들의 이야기 자리', "elders' circle"],
      },
      sys: ['족장과 마을 사람들', 'chiefs and villagers'],
      r: { farm: ['농사짓는 마을 사람', 'village farmer', 2], herd: ['사냥하는 집', 'hunting family', 2], fish: ['어부', 'fisher', 2], craft: ['장인', 'craftworker', 3], serve: ['포로 출신 종', 'captive servant', 1, true], elite: ['족장 집안', "chief's family", 5] },
      dz: ['tb', 'dysentery'], med: 1, war: 1,
      tech: 1, items: [['돌도끼', 'stone axes'], ['토기', 'pottery'], ['통나무배', 'dugout canoe']],
      school: 0.05, lit: 0,
      first: ['아이가 첫 해를 넘겼어요. 해먹 위에서 할머니가 오래 흔들어 주었어요.', 'The child got through its first year. Grandmother rocked it a long while in the hammock.'],
    }),
    medieval: C({
      r: { farm: ['농사짓는 마을 사람', 'village farmer', 2], fish: ['어부', 'fisher', 2], craft: ['장인', 'craftworker', 3], trade: ['교역하는 집', 'trader', 3], serve: ['포로 출신 종', 'captive servant', 1, true], elite: ['족장 집안', "chief's family", 5] },
    }),
    early: C({
      w: {
        coin: ['레알', 'reales'], coinUnit: ['레알', 'reales'], beast: ['소', 'cattle'], home: ['흙벽돌집', 'adobe house'], holy: ['교회', 'church'], ruler: ['총독', 'viceroy'],
        feast: ['성인 축일', "saint's day"], market: ['장터', 'market'], healer: ['쿠란데로', 'curandero'], school: ['교리 학교', 'catechism school'],
      },
      sys: ['식민지 카스타 제도', 'the colonial casta system'],
      r: { farm: ['농민', 'peasant', 2], sail: ['뱃사람', 'sailor', 2], craft: ['장인', 'artisan', 3], trade: ['상인', 'merchant', 3], serve: ['노예', 'enslaved', 1, true], elite: ['대농장 주인', 'hacienda owner', 5] },
      dz: ['smallpox', 'measles', 'malaria', 'yellowfever', 'dysentery'], med: [[1500, 1], [1550, 2]],
      tech: 3, items: [['쇠 연장', 'iron tools'], ['화약', 'gunpowder'], ['사탕수수 압착기', 'sugar mill']],
      school: 0.05, lit: 0.05,
      first: ['아이가 첫 해를 넘겼어요. 대모가 작은 메달을 목에 걸어 주었어요.', 'The child passed its first year. Its godmother hung a small medal round its neck.'],
    }),
    industrial: C({
      w: { coin: ['페소', 'pesos'], coinUnit: ['페소', 'pesos'], ruler: ['대통령', 'president'], market: ['시장', 'market'] },
      sys: ['공화국과 대농장', 'republics and haciendas'],
      r: { farm: ['소작농 (페온)', 'peon', 2], factory: ['공장 노동자', 'factory worker', 2], craft: ['장인', 'artisan', 3], trade: ['상인', 'merchant', 3], sail: ['선원', 'sailor', 2], serve: ['하인', 'servant', 1], elite: ['대지주', 'great landowner', 5] },
      dz: ['yellowfever', 'malaria', 'smallpox', 'tb', 'cholera'], med: [[1800, 2], [1805, 3], [1900, 4]],
      tech: [[1800, 3], [1870, 4]], items: [['철도', 'railway'], ['전신', 'telegraph'], ['증기선', 'steamship']],
      school: [[1800, 0.05], [1900, 0.25], [1940, 0.45]], lit: [[1800, 0.08], [1900, 0.3], [1940, 0.5]],
    }),
    modern: C({
      w: {
        crop: ['옥수수', 'maize'], staple: ['쌀과 콩', 'rice and beans'], home: ['벽돌집', 'brick house'], feast: ['카니발', 'Carnival'],
        healer: ['의사', 'doctor'], school: ['학교', 'school'],
      },
      values: { coin: 0.001 },
      sys: ['공화국 시민', 'citizens of the republic'],
      dz: ['dengue', 'tb'], med: 5,
      tech: [[1950, 4], [1990, 5]], items: [['라디오', 'radio'], ['텔레비전', 'television'], ['버스', 'bus']],
      school: [[1950, 0.45], [1980, 0.8], [2000, 0.95]], lit: [[1950, 0.6], [1980, 0.8], [2000, 0.9]],
      first: ['첫 생일에 케이크와 노래가 있었어요. 사탕은 대부분 사촌들 몫이었어요.', 'There was cake and singing on the first birthday. Most of the sweets went to the cousins.'],
    }),
    spans: [
      S(1800, 1821, { w: { coin: ['레알', 'reales'], coinUnit: ['레알', 'reales'], ruler: ['총독', 'viceroy'] }, sys: ['식민지 카스타 제도', 'the colonial casta system'] }),
      S(1800, 1860, { r: { serve: ['노예', 'enslaved', 1, true] } }, ['industrial']),
      S(1800, 1849, { items: [['쇠 연장', 'iron tools'], ['화약', 'gunpowder'], ['사탕수수 압착기', 'sugar mill']] }),
      S(1870, I, { w: { school: ['학교', 'school'] } }),
      S(1990, I, { items: [['컴퓨터', 'computer'], ['휴대전화', 'mobile phone'], ['텔레비전', 'television']] }),
    ],
  },

  // 동남아시아·오세아니아: 쌀·물소·고상 가옥, 정령의 사당 → 사원, 빚종, 식민 통치(1850~)
  seaoc: {
    forager: forager({ crop: ['야생 얌', 'wild yams'], beast: ['물고기', 'fish'], home: ['나뭇잎 움막', 'leaf shelter'] }, { items: [['뗀석기', 'chipped stone tools'], ['그물', 'fishing nets'], ['불', 'fire']] }),
    ancient: C({
      w: {
        crop: ['쌀', 'rice'], staple: ['밥', 'rice'], coin: ['구슬', 'beads'], coinUnit: ['줄', 'strings'], land: ['논', 'paddies'], landUnit: ['뙈기', 'plots'],
        beast: ['물소', 'water buffalo'], home: ['고상 가옥', 'stilt house'], holy: ['정령의 사당', 'spirit shrine'], ruler: ['족장', 'chief'], feast: ['수확 잔치', 'harvest festival'],
        cloth: ['나무껍질 천', 'barkcloth'], market: ['장터', 'market'], healer: ['주술사', 'shaman'], school: ['어른들의 이야기 자리', "elders' circle"],
      },
      sys: ['족장과 평민, 빚종', 'chiefs, commoners and bondsmen'],
      r: { farm: ['평민 농부', 'commoner farmer', 2], herd: ['가축 치는 집', 'herding family', 2], fish: ['어부', 'fisher', 2], craft: ['장인', 'craftworker', 3], serve: ['빚종', 'debt-bondsman', 1, true], elite: ['족장 집안', "chief's family", 5] },
      dz: ['malaria', 'dysentery'], med: 1, war: 1,
      tech: [[-8000, 1], [-600, 2]], items: [['아웃리거 카누', 'outrigger canoe'], ['청동 북', 'bronze drums'], ['철 연장', 'iron tools']],
      school: 0.05, lit: 0,
      first: ['첫 해를 넘긴 아이를 마을 사람들이 돌아가며 안아 주었어요.', 'The villagers took turns holding the child who had made it through a first year.'],
    }),
    medieval: C({
      w: { coin: ['동전', 'copper coins'], coinUnit: ['닢', 'coins'], holy: ['사원', 'temple'], ruler: ['왕', 'king'], cloth: ['면', 'cotton'], school: ['사원 학교', 'temple school'] },
      sys: ['왕과 귀족, 빚종', 'kings, nobles and bondsmen'],
      r: { farm: ['평민 농부', 'commoner farmer', 2], fish: ['어부', 'fisher', 2], craft: ['장인', 'craftworker', 3], trade: ['상인', 'trader', 3], serve: ['빚종', 'debt-bondsman', 1, true], elite: ['귀족', 'noble', 5] },
      dz: ['malaria', 'smallpox', 'dysentery'],
      tech: 2, items: [['계단식 논', 'terraced paddies'], ['철 연장', 'iron tools'], ['돛배', 'sailing ships']],
      school: 0.06, lit: 0.03,
    }),
    early: C({
      w: { coin: ['은화', 'silver coins'] },
      sys: ['왕국과 무역항', 'kingdoms and trading ports'],
      r: { farm: ['평민 농부', 'commoner farmer', 2], sail: ['뱃사람', 'sailor', 2], craft: ['장인', 'craftworker', 3], trade: ['상인', 'trader', 3], serve: ['빚종', 'debt-bondsman', 1, true], elite: ['귀족', 'noble', 5] },
      tech: [[1500, 2], [1600, 3]], items: [['화약', 'gunpowder'], ['범선', 'sailing ship'], ['철 연장', 'iron tools']],
      school: 0.08, lit: 0.05,
    }),
    industrial: C({
      r: { farm: ['농민', 'peasant', 2], factory: ['농장이나 공장 노동자', 'plantation or factory worker', 2], craft: ['장인', 'craftworker', 3], trade: ['상인', 'trader', 3], sail: ['선원', 'sailor', 2], serve: ['하인', 'servant', 1], elite: ['지주와 관리', 'landowners and officials', 5] },
      dz: ['cholera', 'malaria', 'smallpox', 'tb'], med: [[1800, 1], [1850, 2], [1900, 3], [1930, 4]],
      tech: [[1800, 2], [1880, 3], [1920, 4]], items: [['증기선', 'steamship'], ['철도', 'railway'], ['재봉틀', 'sewing machine']],
      school: [[1800, 0.08], [1900, 0.12], [1940, 0.25]], lit: [[1800, 0.05], [1900, 0.1], [1940, 0.2]],
    }),
    modern: C({
      w: {
        coin: ['지폐', 'banknotes'], coinUnit: ['장', 'notes'], home: ['양철 지붕 집', 'tin-roofed house'], ruler: ['정부', 'government'], market: ['시장', 'market'],
        healer: ['의사', 'doctor'], school: ['학교', 'school'],
      },
      values: { coin: 0.1 },
      sys: ['독립 국가의 시민', 'citizens of new nations'],
      dz: ['malaria', 'dengue', 'tb'], med: 5,
      tech: [[1950, 3], [1980, 4], [2000, 5]], items: [['라디오', 'radio'], ['오토바이', 'motorbike'], ['재봉틀', 'sewing machine']],
      school: [[1950, 0.4], [1980, 0.8], [2000, 0.95]], lit: [[1950, 0.4], [1980, 0.75], [2000, 0.9]],
      first: ['첫 생일에 친척들이 모였어요. 아이는 잔치 내내 잠만 잤어요.', 'Relatives gathered for the first birthday. The child slept through the whole party.'],
    }),
    spans: [
      S(-I, -601, { items: [['간석기', 'polished stone tools'], ['토기', 'pottery'], ['아웃리거 카누', 'outrigger canoe']] }),   // 청동 북·철은 기원전 600년 무렵부터
      S(1800, 1869, { items: [['화약', 'gunpowder'], ['범선', 'sailing ship'], ['철 연장', 'iron tools']] }),
      S(1850, 1945, { w: { ruler: ['총독', 'governor'], school: ['학교', 'school'] }, sys: ['식민 통치', 'colonial rule'] }),
      S(2000, I, { items: [['오토바이', 'motorbike'], ['휴대전화', 'mobile phone'], ['인터넷', 'internet']] }),
    ],
  },

  // 초원(몽골 바탕. 중앙아시아 오아시스는 steppe 땅 덮어쓰기): 말·젖과 고기, 펠트 천막·게르, 돌무더기 제단(오보), 칸
  steppe: {
    forager: forager({ crop: ['야생 풀씨', 'wild grass seed'], beast: ['야생말', 'wild horses'] }),
    ancient: C({
      w: {
        crop: ['기장', 'millet'], staple: ['젖과 고기', 'milk and meat'], coin: ['비단', 'silk'], coinUnit: ['필', 'bolts'], land: ['목초지', 'pastures'], landUnit: ['자리', 'grazing grounds'],
        beast: ['말', 'horses'], home: ['펠트 천막', 'felt tent'], holy: ['돌무더기 제단', 'stone cairn'], ruler: ['칸', 'khan'], feast: ['여름 잔치', 'summer gathering'],
        cloth: ['펠트', 'felt'], market: ['교역 장터', 'trading post'], healer: ['무당', 'shaman'], school: ['어른들의 이야기 자리', "elders' circle"],
      },
      names: { tent: ['펠트 천막', 'felt tent'] },
      sys: ['씨족과 족장', 'clans and chieftains'],
      r: { farm: ['농사짓는 집', 'farming family', 2], herd: ['목자', 'herder', 3], fish: ['어부', 'fisher', 2], craft: ['대장장이', 'smith', 3], serve: ['종', 'bondsman', 1, true], elite: ['족장의 일족', "the chieftain's kin", 5] },
      dz: ['plague', 'dysentery'], med: 1, war: 1,
      tech: [[-8000, 1], [-2200, 2]], items: [['복합궁', 'composite bow'], ['철 재갈', 'iron bits'], ['펠트 짓기', 'felt-making']],
      school: 0.05, lit: [[-8000, 0], [-500, 0.01]],
      first: ['첫 해를 넘긴 아이를 아버지가 말 등에 잠깐 앉혀 보았어요.', 'The child got through its first year, and its father sat it on a horse for a moment.'],
    }),
    medieval: C({
      w: { home: ['게르', 'ger'] },
      names: { tent: ['게르', 'ger'] },
      sys: ['씨족과 칸', 'clans and the khan'],
      r: { farm: ['농사짓는 집', 'farming family', 2], fish: ['어부', 'fisher', 2], craft: ['대장장이', 'smith', 3], trade: ['대상 상인', 'caravan merchant', 3], serve: ['종', 'bondsman', 1, true], elite: ['칸의 일족', "the khan's kin", 5] },
      dz: ['plague', 'smallpox'],
      tech: 2, items: [['등자', 'stirrups'], ['복합궁', 'composite bow'], ['수레 천막', 'tent cart']],
      lit: 0.03,
    }),
    early: C({
      w: { coin: ['벽돌차', 'brick tea'], coinUnit: ['덩이', 'bricks'], holy: ['절', 'monastery'], feast: ['나담', 'Naadam'], healer: ['라마 의사', 'lama doctor'], school: ['절 학교', 'monastery school'] },
      r: { farm: ['농사짓는 집', 'farming family', 2], sail: ['뱃사람', 'boatman', 2], craft: ['대장장이', 'smith', 3], trade: ['대상 상인', 'caravan merchant', 3], serve: ['종', 'bondsman', 1, true], elite: ['칸의 일족', "the khan's kin", 5] },
      dz: ['plague', 'smallpox', 'tb'], med: [[1500, 1], [1600, 2]],
      items: [['화승총', 'matchlocks'], ['복합궁', 'composite bow'], ['펠트 짓기', 'felt-making']],
      school: 0.08, lit: 0.05,
    }),
    industrial: C({
      r: { farm: ['농사짓는 집', 'farming family', 2], factory: ['공장 노동자', 'factory worker', 2], craft: ['대장장이', 'smith', 3], trade: ['대상 상인', 'caravan merchant', 3], sail: ['뱃사람', 'boatman', 2], serve: ['종', 'bondsman', 1], elite: ['귀족 집안', 'noble family', 5] },
      med: [[1800, 1], [1870, 2], [1920, 3], [1935, 4]],
      tech: [[1800, 2], [1920, 3], [1940, 4]], items: [['소총', 'rifles'], ['트럭', 'trucks'], ['라디오', 'radio']],
      school: [[1800, 0.08], [1925, 0.2], [1940, 0.5]], lit: [[1800, 0.05], [1925, 0.1], [1945, 0.5]],
    }),
    modern: C({
      w: { coin: ['투그릭', 'tögrög'], coinUnit: ['투그릭', 'tögrög'], ruler: ['정부', 'government'], market: ['시장', 'market'], healer: ['의사', 'doctor'], school: ['학교', 'school'] },
      values: { coin: 0.0003 },
      sys: ['시민', 'citizens'],
      dz: ['plague', 'tb'], med: 5, war: 0,
      tech: [[1950, 4], [1990, 5]], items: [['라디오', 'radio'], ['오토바이', 'motorbike'], ['트럭', 'trucks']],
      school: [[1950, 0.7], [1980, 0.95]], lit: [[1950, 0.75], [1980, 0.97]],
      first: ['첫 생일에 게르 안이 손님으로 꽉 찼어요. 아이는 말젖술 냄새에 재채기를 했어요.', 'The ger was packed with guests on the first birthday. The child sneezed at the smell of mare’s-milk wine.'],
    }),
    spans: [
      // 고대 묶음 계단: 소 수레(−3000) → 전차·청동(−2000) → 철기와 기마(−800, 기본 칸)
      S(-I, -2001, { items: [['소 수레', 'ox wagons'], ['토기', 'pottery'], ['간석기', 'polished stone tools']] }),
      S(-2000, -801, { items: [['전차', 'chariot'], ['청동 칼', 'bronze knives'], ['펠트 짓기', 'felt-making']] }),
      S(-I, -201, { w: { coin: ['털가죽', 'furs'], coinUnit: ['장', 'pelts'] } }),
      S(-I, -210, { w: { ruler: ['족장', 'chieftain'] } }),
      S(1800, 1919, { items: [['소총', 'rifles'], ['펠트 짓기', 'felt-making'], ['수레', 'carts']] }),
      S(-209, 215, { w: { ruler: ['선우', 'chanyu'] }, sys: ['씨족과 선우', 'clans and the chanyu'], r: { elite: ['선우의 일족', "the chanyu's kin", 5] } }),
      S(216, 599, { sys: ['씨족과 칸', 'clans and the khan'], r: { elite: ['칸의 일족', "the khan's kin", 5] } }),   // 칸 칭호는 3세기 무렵부터
      S(1206, 1499, { w: { coin: ['은 덩이', 'silver ingots'], coinUnit: ['덩이', 'ingots'], feast: ['나담', 'Naadam'] }, r: { elite: ['노얀 (귀족)', 'noyan (noble)', 5] } }),
      S(1500, 1575, { w: { holy: ['돌무더기 제단', 'stone cairn'], healer: ['무당', 'shaman'], school: ['어른들의 이야기 자리', "elders' circle"] } }),
      S(1691, 1911, { sys: ['청의 기 제도', 'the Qing banner system'] }),
      S(1924, 1990, { w: { ruler: ['정부', 'government'] }, sys: ['사회주의 인민 공화국', "the socialist people's republic"], r: { herd: ['협동조합 목자', 'collective herder', 2] } }),
      S(1925, 1949, { w: { coin: ['투그릭', 'tögrög'], coinUnit: ['투그릭', 'tögrög'], school: ['학교', 'school'] } }),
      S(2000, I, { items: [['오토바이', 'motorbike'], ['태양광 판', 'solar panel'], ['휴대전화', 'mobile phone']] }),
    ],
  },
};

// ── 땅 덮어쓰기 ──
// 조선 낱말·신분 (한반도 1392~1894)
const JOSEON_W = {
  crop: ['쌀', 'rice'], staple: ['밥', 'rice'], land: ['논', 'paddies'], landUnit: ['마지기', 'majigi'], beast: ['소', 'oxen'], home: ['초가', 'thatched house'],
  holy: ['사당', 'ancestral shrine'], ruler: ['임금', 'king'], feast: ['한가위', 'Hangawi'], cloth: ['무명', 'cotton'], market: ['장시', 'five-day market'],
  healer: ['의원', 'herb doctor'], school: ['서당', 'seodang'],
};
const JOSEON_S = {
  sys: ['양천제', 'the yangcheon system (free and base)'],
  r: {
    farm: ['상민', 'sangmin (commoner)', 2], fish: ['어민 · 상민', 'fisher (sangmin)', 2], sail: ['뱃사람 · 상민', 'boatman (sangmin)', 2], craft: ['장인 · 상민', 'artisan (sangmin)', 2],
    trade: ['상인 · 상민', 'merchant (sangmin)', 2], serve: ['노비', 'nobi (bondservant)', 1, true], elite: ['양반', 'yangban', 5],
  },
};
const DOLJABI = ['첫돌 상에 실과 붓, 쌀을 올려 두고 아이가 무엇을 집는지 지켜봤어요.', 'For the first birthday they set thread, a brush and rice on the table and watched what the child would grab.'];
// 이슬람 동남아 (인도네시아·말레이, 1500~)
const ISLAM_SEA = {
  w: { holy: ['모스크', 'mosque'], ruler: ['술탄', 'sultan'], feast: ['르바란', 'Lebaran'], market: ['파사르', 'pasar'], healer: ['두쿤', 'dukun'], school: ['쿠란 학교', 'Quran school'] },
};
const FIRST_STEP = ['아이가 처음 땅을 밟는 날, 작은 사다리를 오르게 하는 의식을 치렀어요.', 'On the day the child first set foot on the earth, it was helped up a little ladder in a small rite.'];
// 남아시아 이슬람 땅 (인더스 1000~, 벵골 1600~)
const ISLAM_SOUTH = { holy: ['모스크', 'mosque'], feast: ['이드', 'Eid'], healer: ['하킴', 'hakim'], school: ['막타브', 'maktab'] };
const SWEETS = ['아이가 첫 해를 넘기자, 단것을 지어 이웃에 돌렸어요.', 'When the child passed its first year, sweets were made and sent round to the neighbors.'];
// 농사·목축이 닿기 전(FARM_FROM)의 땅: 고대·중세·근세 묶음이라도 수렵 무리로 산다.
// 낱말은 그 문화권 수렵 칸(context.js 가 넣는다)에 이것을 덮고, 땅마다 preFarm 으로 한 번 더 덧칠한다
export const PRE_FARM = C({
  sys: ['무리와 친족', 'bands and kin'],
  r: {
    farm: ['채집하는 집', 'gathering family', 3], herd: ['사냥하는 집', 'hunting family', 3], fish: ['고기잡이 집', 'fishing family', 3], craft: ['도구 만드는 집', 'toolmaking family', 3],
    trade: ['물물교환하는 집', 'trading family', 3], sail: ['카누 타는 집', 'canoe family', 3], serve: ['무리의 한 사람', 'member of the band', 3], elite: ['어른들의 집안', "elders' family", 4],
    factory: ['무리의 한 사람', 'member of the band', 3],
  },
  dz: ['worms'], med: 0, war: 0, tech: 0, school: 0.1, lit: 0,
  first: ['아이가 첫 해를 넘겼어요. 무리가 돌아가며 아이를 안아 보았어요.', 'The child made it through a first year. The whole band took turns holding it.'],
});
// 오스트레일리아 원주민 (1788년 전)
const AUS_PREFARM = {
  w: {
    crop: ['야생 씨앗', 'wild seeds'], beast: ['캥거루', 'kangaroos'], home: ['나무껍질 움막', 'bark shelter'], ruler: ['어른들', 'council of elders'],
    feast: ['모임 잔치', 'gathering feast'], healer: ['주술사', 'healer'],
  },
  tech: 1, items: [['부메랑', 'boomerang'], ['돌도끼', 'stone axe'], ['불 놓기', 'fire-stick farming']],
};

// 아메리카 정복 전 (초기 근세 묶음 1500년부터 땅마다 식민 지배가 닿은 해까지)
const AMER_NATIVE = {
  w: {
    coin: ['조개 구슬', 'shell beads'], coinUnit: ['줄', 'strings'], beast: ['사슴', 'deer'], home: ['초가 오두막', 'thatched hut'], holy: ['성소', 'shrine'], ruler: ['족장', 'chief'],
    feast: ['수확 잔치', 'harvest festival'], market: ['교역 모임', 'trading gathering'], healer: ['주술사', 'shaman'], school: ['어른들의 이야기 자리', "elders' circle"],
  },
  sys: ['족장과 마을 사람들', 'chiefs and villagers'],
  r: { farm: ['농사짓는 마을 사람', 'village farmer', 2], sail: ['카누 타는 집', 'canoe family', 2], craft: ['장인', 'craftworker', 3], trade: ['교역하는 집', 'trader', 3], serve: ['포로 출신 종', 'captive servant', 1, true], elite: ['족장 집안', "chief's family", 5] },
  dz: ['tb', 'dysentery'], tech: 1, items: [['돌도끼', 'stone axes'], ['토기', 'pottery'], ['통나무배', 'dugout canoe']], lit: 0,
  first: ['아이가 첫 해를 넘겼어요. 해먹 위에서 할머니가 오래 흔들어 주었어요.', 'The child got through its first year. Grandmother rocked it a long while in the hammock.'],
};

export const AREA_DATA = {
  // ── 동아시아 ──
  china: {
    all: C({ w: { home: ['흙집', 'rammed-earth house'], landUnit: ['무', 'mu'] } }),
    ancient: C({ r: { elite: ['관리와 호족', 'officials and great clans', 5] }, school: 0.06 }),
    medieval: C({ w: { school: ['사숙', 'family school'] } }),
    early: C({ w: { school: ['사숙', 'family school'] } }),
    industrial: C({ w: { coin: ['은', 'silver'], coinUnit: ['냥', 'taels'] }, lit: [[1800, 0.2], [1930, 0.25]] }),
    modern: C({
      w: { coin: ['위안', 'yuan'], coinUnit: ['위안', 'yuan'] }, values: { coin: 0.001 },
      tech: [[1950, 3], [1980, 4], [2000, 5]], school: [[1950, 0.4], [1980, 0.85], [2000, 0.95]], lit: [[1950, 0.2], [1982, 0.66], [2000, 0.9], [2010, 0.95]],
    }),
    spans: [
      S(-600, -222, { w: { coin: ['칼돈', 'knife money'], coinUnit: ['닢', 'pieces'] } }),
      S(-475, -221, { war: 2, warName: ['전국 시대', 'the Warring States'] }),
      S(-400, 599, { sys: ['사농공상', 'the four occupations'] }),
      S(-221, -119, { w: { coin: ['반량전', 'banliang coins'], ruler: ['황제', 'emperor'] } }),
      S(-118, 599, { w: { coin: ['오수전', 'wuzhu coins'], ruler: ['황제', 'emperor'] } }),
      S(-200, 599, { w: { healer: ['의원', 'physician'] } }),
      S(400, 599, { w: { holy: ['절', 'Buddhist temple'] } }),
      S(960, 1499, { r: { elite: ['사대부', 'scholar-official', 5] }, items: [['목판 인쇄', 'woodblock printing'], ['종이', 'paper'], ['화약', 'gunpowder']] }),
      S(1040, 1499, { items: [['활자 인쇄', 'movable type'], ['나침반', 'compass'], ['화약', 'gunpowder']] }),
      S(1912, 1949, { w: { ruler: ['민국 정부', 'Republican government'] } }),
      S(1914, 1949, { w: { coin: ['위안', 'yuan'], coinUnit: ['위안', 'yuan'] }, values: { coin: 1 } }),
      S(1949, I, { w: { feast: ['춘절', 'Spring Festival'] } }),   // 「춘절」이라는 이름은 1914년 제안, 1949년 뒤 자리 잡음
      S(1958, I, { sys: ['호구 제도', 'the hukou registration system'] }),
      S(1958, 1983, { r: { farm: ['인민공사 농민', 'commune farmer', 2, true] } }),
    ],
  },
  korea: {
    ancient: C({
      w: { crop: ['쌀', 'rice'], staple: ['밥', 'rice'], coin: ['베', 'hemp cloth'], coinUnit: ['필', 'bolts'], land: ['논', 'paddies'], holy: ['소도', 'sodo sanctuary'], feast: ['한가위', 'Hangawi'] },
      sys: ['귀족과 평민, 노비', 'nobles, commoners and bondservants'], tech: [[-8000, 1], [-1000, 2]],
    }),
    medieval: C({
      w: {
        coin: ['베', 'hemp cloth'], coinUnit: ['필', 'bolts'], landUnit: ['결', 'gyeol'], ruler: ['임금', 'king'], feast: ['한가위', 'Hangawi'], cloth: ['삼베', 'hemp cloth'],
        healer: ['무당', 'shaman'],
      },
      values: { land: 4 },
      sys: ['귀족과 양인, 천민', 'aristocrats, commoners and the lowborn'],
      r: { farm: ['양인 농민', 'commoner farmer', 2], serve: ['노비', 'nobi (bondservant)', 1, true], elite: ['문벌 귀족', 'aristocratic clan', 5] },
      first: ['아이가 첫 해를 넘겼어요. 할머니가 조용히 삼신께 감사 인사를 올렸어요.', 'The child passed its first year. Grandmother quietly gave thanks to Samsin, the birth spirit.'],
    }),
    early: C({ w: JOSEON_W, values: { land: 1 } }),
    industrial: C({ w: { ...JOSEON_W, coin: ['엽전', 'brass cash'], coinUnit: ['냥', 'nyang'] }, lit: [[1800, 0.2], [1930, 0.25]] }),
    modern: C({
      w: {
        coin: ['원', 'won'], coinUnit: ['원', 'won'], landUnit: ['평', 'pyeong'], holy: ['절', 'temple'], ruler: ['정부', 'government'], feast: ['추석', 'Chuseok'],
        market: ['시장', 'market'], healer: ['의사', 'doctor'], school: ['학교', 'school'], crop: ['쌀', 'rice'], staple: ['밥', 'rice'],
      },
      values: { coin: 0.00002, land: 0.01 },
      tech: [[1950, 3], [1975, 4], [1995, 5]], lit: [[1950, 0.6], [1970, 0.9], [1990, 0.98]], school: [[1950, 0.6], [1970, 0.85], [1990, 0.98]],
      first: ['돌잔치에서 아이가 연필을 집었어요. 할아버지가 제일 크게 웃었어요.', 'At the first-birthday party the child grabbed the pencil. Grandfather laughed loudest.'],
    }),
    spans: [
      // 고대 묶음 계단: 빗살무늬 토기 마을 → 청동기·고인돌(−1000) → 철기·삼한(−300)
      S(-I, -1001, {
        w: { crop: ['조', 'foxtail millet'], staple: ['죽', 'porridge'], land: ['밭', 'fields'], ruler: ['마을 어른', 'village elder'], holy: ['제사터', 'ritual ground'] },
        sys: ['씨족과 마을', 'clans and villages'], r: NEUTRAL, items: [['빗살무늬 토기', 'comb-pattern pottery'], ['간석기', 'polished stone tools'], ['갈돌', 'grinding stone']],
      }),
      S(-1000, -301, {
        w: { holy: ['고인돌', 'dolmen'], ruler: ['족장', 'chieftain'] }, sys: ['족장과 마을', 'chiefs and villages'],
        items: [['청동 검', 'bronze daggers'], ['반달 돌칼', 'half-moon stone knife'], ['민무늬 토기', 'plain pottery']],
      }),
      S(372, 599, { w: { holy: ['절', 'Buddhist temple'] } }),
      S(1392, 1894, { w: JOSEON_W, ...JOSEON_S, first: DOLJABI, values: { land: 1 } }),
      S(1400, 1499, { w: { cloth: ['무명', 'cotton'] } }),
      S(1500, 1677, { w: { coin: ['무명', 'cotton cloth'], coinUnit: ['필', 'bolts'] } }),
      S(1678, 1901, { w: { coin: ['엽전', 'brass cash'], coinUnit: ['냥', 'nyang'] } }),
      S(1800, 1884, { items: [['화약', 'gunpowder'], ['금속 활자', 'metal movable type'], ['물레', 'spinning wheel']] }),
      S(1895, 1949, {
        w: { school: ['학교', 'school'] }, sys: ['신분제가 없어진 뒤', 'after the abolition of rank'],
        r: { farm: ['소작농', 'tenant farmer', 2], serve: ['머슴', 'farmhand', 1], elite: ['지주', 'landlord', 5], craft: ['장인', 'artisan', 2], trade: ['상인', 'merchant', 3], sail: ['뱃사람', 'boatman', 2] },
        first: DOLJABI,
      }),
      S(1897, 1910, { w: { ruler: ['황제', 'emperor'] } }),
      S(1902, 1949, { w: { coin: ['원', 'won'], coinUnit: ['원', 'won'] } }),
      S(1910, 1945, { w: { ruler: ['총독부', 'Government-General'] }, sys: ['식민 통치', 'colonial rule'] }),
      S(1946, 1949, { w: { ruler: ['정부', 'government'] } }),
      S(1975, I, { w: { home: ['아파트', 'apartment'] } }),
    ],
  },
  japan: {
    ancient: C({
      w: {
        crop: ['쌀', 'rice'], staple: ['밥', 'rice'], coin: ['베', 'hemp cloth'], coinUnit: ['필', 'bolts'], land: ['논', 'paddies'], home: ['움집', 'pit dwelling'],
        holy: ['제사터', 'ritual ground'], ruler: ['대왕', 'great king'], feast: ['모내기 잔치', 'rice-planting festival'], healer: ['주술사', 'diviner'],
      },
      sys: ['호족과 백성', 'clan chiefs and commoners'],
      r: { farm: ['백성', 'commoner farmer', 2], serve: ['노비', 'bondservant', 1, true], elite: ['호족', 'clan chief', 5] },
      tech: [[-8000, 1], [-300, 2]],
    }),
    // 조몬 (벼농사 전): 도토리·움집·돌 둘레
    preFarm: C({
      w: { crop: ['도토리', 'acorns'], home: ['움집', 'pit dwelling'], holy: ['돌 둘레', 'stone circle'] },
      tech: 1, items: [['조몬 토기', 'Jōmon pottery'], ['간석기', 'polished stone tools'], ['활과 화살', 'bow and arrow']],
    }),
    medieval: C({
      w: {
        coin: ['베', 'hemp cloth'], coinUnit: ['필', 'bolts'], landUnit: ['단', 'tan'], holy: ['신사', 'shrine'], ruler: ['천황', 'emperor'], feast: ['오봉', 'Obon'],
        healer: ['의원', 'physician'], school: ['절', 'temple school'],
      },
      values: { land: 1 },
      sys: ['율령 신분', 'ritsuryō ranks'],
      r: { farm: ['백성', 'commoner farmer', 2], serve: ['하인', 'bonded servant', 1, true], elite: ['귀족', 'court noble', 5] },
    }),
    early: C({
      w: {
        coin: ['동전', 'copper coins'], coinUnit: ['문', 'mon'], landUnit: ['단', 'tan'], holy: ['신사', 'shrine'], ruler: ['쇼군', 'shogun'], feast: ['오봉', 'Obon'],
        healer: ['의원', 'herb doctor'], school: ['데라코야', 'terakoya'],
      },
      values: { coin: 1, land: 1 },
      sys: ['무사·농민·장인·상인', 'samurai, farmers, artisans, merchants'],
      r: { farm: ['농민 (백성)', 'peasant (hyakushō)', 2, true], sail: ['뱃사람', 'boatman', 2], craft: ['장인', 'artisan', 2], trade: ['상인', 'merchant', 2], serve: ['하인', 'servant', 1], elite: ['무사', 'samurai', 5] },
      school: 0.3, lit: [[1500, 0.1], [1700, 0.3]],
      first: ['첫 생일에 떡 한 되를 아이 등에 지웠어요. 아이가 주저앉자 다들 손뼉을 쳤어요.', 'On the first birthday they strapped a big rice cake to the child’s back. When it sat down hard, everyone clapped.'],
    }),
    industrial: C({
      w: { coin: ['엔', 'yen'], coinUnit: ['엔', 'yen'], landUnit: ['단', 'tan'], holy: ['신사', 'shrine'], ruler: ['천황', 'emperor'], feast: ['오봉', 'Obon'], healer: ['의원', 'herb doctor'], school: ['소학교', 'elementary school'] },
      values: { land: 1 },
      sys: ['사민평등', 'the four classes made equal'],
      r: { elite: ['화족과 부자', 'peers and the rich', 5] },
      med: [[1800, 2], [1850, 3], [1885, 4]], tech: [[1800, 3], [1872, 4], [1930, 5]],
      school: [[1800, 0.3], [1880, 0.6], [1905, 0.95]], lit: [[1800, 0.35], [1890, 0.6], [1910, 0.9]],
      first: ['첫 생일에 떡 한 되를 아이 등에 지웠어요. 아이가 주저앉자 다들 손뼉을 쳤어요.', 'On the first birthday they strapped a big rice cake to the child’s back. When it sat down hard, everyone clapped.'],
    }),
    modern: C({
      w: { coin: ['엔', 'yen'], coinUnit: ['엔', 'yen'], landUnit: ['단', 'tan'], holy: ['신사', 'shrine'], feast: ['오봉', 'Obon'], market: ['슈퍼마켓', 'supermarket'] },
      values: { coin: 0.0001, land: 1 },
      tech: 5, school: 0.98, lit: 0.99,
      first: ['첫 생일에 떡 한 되를 아이 등에 지웠어요. 아이가 주저앉자 다들 손뼉을 쳤어요.', 'On the first birthday they strapped a big rice cake to the child’s back. When it sat down hard, everyone clapped.'],
    }),
    spans: [
      // 야요이(−900~) → 철기(−300~) → 고분(250~)
      S(-I, 249, { w: { ruler: ['족장', 'chieftain'] }, sys: ['족장과 마을', 'chiefs and villages'], r: { elite: ['족장 집안', "chief's family", 5] } }),
      S(-I, -301, { items: [['반달 돌칼', 'stone reaping knife'], ['토기', 'pottery'], ['높은 곳간', 'raised granary']] }),
      S(-300, 249, { items: [['철 연장', 'iron tools'], ['청동 방울', 'bronze bells'], ['높은 곳간', 'raised granary']] }),
      S(400, 599, { w: { holy: ['신사', 'shrine'] } }),
      S(1150, 1499, { w: { coin: ['동전', 'copper coins'], coinUnit: ['문', 'mon'] } }),
      S(1185, 1499, { sys: ['무사와 백성', 'warriors and commoners'], r: { elite: ['무사', 'samurai', 5] } }),
      S(1192, 1867, { w: { ruler: ['쇼군', 'shogun'] } }),
      S(1467, 1590, { war: 2, warName: ['전국 시대', 'the Sengoku era'] }),
      S(1800, 1870, { w: { coin: ['동전', 'copper coins'], coinUnit: ['문', 'mon'], school: ['데라코야', 'terakoya'] }, sys: ['무사·농민·장인·상인', 'samurai, farmers, artisans, merchants'], r: { elite: ['무사', 'samurai', 5] } }),
      S(1880, 1949, { w: { healer: ['의사', 'doctor'] } }),
    ],
  },

  // ── 남아시아 ──
  india: {
    early: C({ w: { ruler: ['라자', 'raja'] } }),
    spans: [
      S(320, 550, { w: { ruler: ['마하라자', 'maharaja'] } }),
      S(1206, 1525, { w: { ruler: ['술탄', 'sultan'] } }),
      S(1526, 1757, { w: { ruler: ['황제', 'emperor'] } }),
      S(1800, 1857, { w: { ruler: ['동인도회사', 'East India Company'] } }),
      S(1858, 1947, { w: { ruler: ['총독', 'viceroy'] } }),
      S(1948, 1949, { w: { ruler: ['정부', 'government'] } }),
    ],
  },
  bengal: {
    all: C({
      w: { coin: ['조개', 'cowrie shells'], coinUnit: ['개', 'shells'], landUnit: ['비가', 'bighas'], home: ['초가', 'thatched hut'], market: ['하트', 'haat'], healer: ['카비라지', 'kaviraj'] },
    }),
    medieval: C({ w: { cloth: ['모슬린', 'muslin'] }, dzAdd: ['cholera'] }),
    early: C({ w: { cloth: ['모슬린', 'muslin'] }, dzAdd: ['cholera'] }),
    industrial: C({ w: { coin: ['루피', 'rupees'], coinUnit: ['루피', 'rupees'] }, dzAdd: ['cholera'] }),
    modern: C({ w: { coin: ['루피', 'rupees'], coinUnit: ['루피', 'rupees'] }, dzAdd: ['cholera'] }),
    spans: [
      S(-2000, I, { w: { staple: ['밥과 생선', 'rice and fish'] } }),
      S(1204, 1575, { w: { ruler: ['술탄', 'sultan'] } }),
      S(1576, 1716, { w: { ruler: ['황제', 'emperor'] } }),
      S(1600, I, {
        w: ISLAM_SOUTH, first: SWEETS,
        r: { farm: ['농민 집', 'farming household', 2], fish: ['어부 집', 'fishing household', 2], sail: ['뱃사람 집', 'boatman household', 2], craft: ['장인 집', 'artisan household', 2], trade: ['상인 집', 'merchant household', 3] },
      }),
      S(1600, 1799, { sys: ['무슬림과 힌두 이웃', 'Muslim and Hindu neighbours'] }),
      S(1800, 1834, { w: { coin: ['조개', 'cowrie shells'], coinUnit: ['개', 'shells'] } }),
      S(1800, 1947, { sys: ['식민 통치', 'colonial rule'] }),
      S(1948, I, { sys: ['현대 시민', 'modern citizens'] }),
      S(1717, 1764, { w: { ruler: ['나와브', 'nawab'] } }),
      S(1765, 1857, { w: { ruler: ['동인도회사', 'East India Company'] } }),
      S(1858, 1947, { w: { ruler: ['총독', 'viceroy'] } }),
      S(1880, I, { w: { school: ['학교', 'school'] } }),
      S(1948, I, { w: { ruler: ['정부', 'government'], healer: ['의사', 'doctor'] } }),
      S(1972, I, { w: { coin: ['타카', 'taka'], coinUnit: ['타카', 'taka'] } }),
    ],
  },
  indus: {
    all: C({ w: { crop: ['밀', 'wheat'], staple: ['로티', 'roti'] } }),
    ancient: C({ w: { land: ['밭', 'fields'] } }),
    medieval: C({ w: { land: ['밭', 'fields'] } }),
    early: C({ w: { land: ['밭', 'fields'] } }),
    industrial: C({ w: { land: ['밭', 'fields'], landUnit: ['에이커', 'acres'] } }),
    modern: C({ w: { land: ['밭', 'fields'], landUnit: ['에이커', 'acres'] }, war: 1, lit: [[1950, 0.15], [1980, 0.26], [2000, 0.45], [2015, 0.58]] }),
    spans: [
      S(-2600, -1900, {
        w: { home: ['구운 벽돌집', 'fired-brick house'], ruler: ['도시의 어른들', 'city council'] }, sys: ['도시와 마을', 'cities and villages'],
        items: [['구운 벽돌', 'fired bricks'], ['돌 도장', 'stone seals'], ['소 수레', 'bullock carts']],
      }),
      S(-250, 500, { w: { holy: ['절', 'Buddhist monastery'] } }),
      S(1000, I, {
        w: { ...ISLAM_SOUTH, ruler: ['술탄', 'sultan'] }, first: SWEETS,
        r: { farm: ['농민 집', 'farming household', 2], fish: ['어부 집', 'fishing household', 2], sail: ['뱃사람 집', 'boatman household', 2], craft: ['장인 집', 'artisan household', 2], trade: ['상인 집', 'merchant household', 3] },
      }),
      S(1000, 1848, { sys: ['왕조 아래 마을 공동체', 'village communities under dynasties'] }),
      S(1849, 1947, { sys: ['식민 통치', 'colonial rule'] }),
      S(1948, I, { sys: ['현대 시민', 'modern citizens'] }),
      S(1526, 1739, { w: { ruler: ['황제', 'emperor'] } }),
      S(1740, 1799, { w: { ruler: ['왕', 'king'] } }),
      S(1800, 1848, { w: { ruler: ['마하라자', 'maharaja'] } }),
      S(1849, 1947, { w: { ruler: ['총독', 'viceroy'] } }),
      S(1880, I, { w: { school: ['학교', 'school'] } }),
      S(1948, I, { w: { ruler: ['정부', 'government'], healer: ['의사', 'doctor'] } }),
    ],
  },
  lanka: {
    all: C({
      sys: ['가문과 신분', 'clans and rank'],
      r: {
        farm: ['농민 집', 'farming household', 2], herd: ['가축 치는 집', 'herding household', 2], fish: ['어부 집', 'fishing household', 2], craft: ['장인 집', 'artisan household', 2],
        trade: ['상인 집', 'merchant household', 3], sail: ['뱃사람 집', 'boatman household', 2], serve: ['남의 집에 매인 사람', 'bonded dependant', 1, true], elite: ['왕족과 귀족', 'royals and nobles', 5],
      },
    }),
    spans: [
      S(-250, I, { w: { holy: ['절', 'Buddhist temple'], feast: ['웨삭', 'Vesak'] } }),
      S(1796, 1947, { w: { ruler: ['총독', 'governor'] }, sys: ['식민 통치', 'colonial rule'] }),
      S(1948, I, { w: { ruler: ['정부', 'government'] }, sys: ['현대 시민', 'modern citizens'] }),
    ],
  },

  // ── 서아시아·북아프리카 ──
  nile: {
    all: C({ w: { crop: ['밀', 'wheat'], cloth: ['아마포', 'linen'], land: ['강가 밭', 'floodplain fields'] }, dzAdd: ['schisto'] }),
    ancient: C({
      w: { staple: ['빵과 맥주', 'bread and beer'], ruler: ['파라오', 'pharaoh'], feast: ['범람 축제', 'flood festival'], landUnit: ['아루라', 'arouras'] },
      values: { land: 1 },
      sys: ['파라오 아래의 신분', 'ranks under pharaoh'], r: { farm: ['농부', 'peasant', 2], elite: ['사제와 서기', 'priests and scribes', 5] },
      first: ['한 해를 넘긴 아이 목에 눈 모양 부적을 걸어 주었어요.', 'For its first year, the child wore an eye-shaped amulet.'],
    }),
    medieval: C({ w: { landUnit: ['페단', 'feddans'] }, values: { land: 2 } }),
    early: C({ w: { landUnit: ['페단', 'feddans'], ruler: ['파샤', 'pasha'] }, values: { land: 2 } }),
    industrial: C({ w: { landUnit: ['페단', 'feddans'], coin: ['피아스터', 'piastres'], coinUnit: ['피아스터', 'piastres'] }, values: { land: 2 } }),
    modern: C({ w: { landUnit: ['페단', 'feddans'], coin: ['파운드', 'pounds'], coinUnit: ['파운드', 'pounds'] }, values: { land: 2, coin: 0.01 }, dzAdd: ['hepatitis'] }),
    spans: [
      S(-I, -3101, { w: { ruler: ['족장', 'chieftain'] }, sys: ['족장과 마을', 'chiefs and villages'], r: { elite: ['족장 집안', "chief's family", 5] } }),
      S(-I, -333, { w: { coin: ['구리', 'copper'], coinUnit: ['데벤', 'deben'] } }),
      S(-2700, 599, { w: { healer: ['의사', 'physician'] } }),
      S(-332, 599, { w: { coin: ['드라크마', 'drachmas'], coinUnit: ['닢', 'coins'] } }),
      S(-30, 639, { w: { ruler: ['황제', 'emperor'] } }),
      S(390, 639, { w: { holy: ['교회', 'church'], feast: ['부활절', 'Easter'] } }),
      S(969, 1170, { w: { ruler: ['칼리프', 'caliph'] } }),
      S(1800, 1866, { w: { ruler: ['파샤', 'pasha'] } }),
      S(1867, 1913, { w: { ruler: ['케디브', 'khedive'] } }),
      S(1914, 1921, { w: { ruler: ['술탄', 'sultan'] } }),
      S(1922, 1952, { w: { ruler: ['왕', 'king'] } }),
      S(1940, 1942, { war: 3, warName: ['북아프리카 전선', 'the North African front'] }),
      S(1953, I, { w: { ruler: ['대통령', 'president'] } }),
    ],
  },
  anatolia: {
    all: C({ w: { crop: ['밀', 'wheat'] } }),
    ancient: C({}),
    medieval: C({
      w: { holy: ['교회', 'church'], ruler: ['황제', 'emperor'], feast: ['부활절', 'Easter'], coin: ['은화', 'silver coins'], market: ['장터', 'market'], healer: ['의사', 'physician'], school: ['수도원', 'monastery'] },
      sys: ['황제의 신민', 'subjects of the emperor'], r: { serve: ['노예', 'slave', 1, true] },
    }),
    early: C({
      w: { coin: ['악체', 'akçes'], coinUnit: ['악체', 'akçes'], market: ['바자르', 'bazaar'], school: ['막타브', 'maktab'] },
      sys: ['오스만 신민', 'Ottoman subjects'], r: { farm: ['농민 (라야)', 'peasant (reaya)', 2], craft: ['장인 · 길드', 'guild artisan', 3] },
    }),
    industrial: C({ w: { coin: ['쿠루쉬', 'kuruş'], coinUnit: ['쿠루쉬', 'kuruş'], market: ['바자르', 'bazaar'], school: ['막타브', 'maktab'] }, lit: [[1800, 0.05], [1927, 0.1], [1945, 0.3]] }),
    modern: C({ w: { coin: ['리라', 'lira'], coinUnit: ['리라', 'lira'], market: ['바자르', 'bazaar'] }, values: { coin: 0.003 }, lit: [[1950, 0.33], [1980, 0.68], [2000, 0.87], [2015, 0.96]] }),
    spans: [
      S(-2000, -547, { w: { ruler: ['왕', 'king'] } }),
      S(-546, -334, { w: { ruler: ['대왕', 'Great King'] } }),
      S(-133, 599, { w: { ruler: ['황제', 'emperor'] } }),
      S(-300, 599, { w: { healer: ['의사', 'physician'] } }),
      S(390, 599, { w: { holy: ['교회', 'church'], feast: ['부활절', 'Easter'] } }),
      S(1071, 1499, { w: { ruler: ['술탄', 'sultan'] } }),
      S(1200, 1499, { w: { holy: ['모스크', 'mosque'], feast: ['이드', 'Eid'], market: ['바자르', 'bazaar'], healer: ['하킴', 'hakim'], school: ['막타브', 'maktab'] }, sys: ['무슬림·딤미·노예', 'Muslims, dhimmis and slaves'] }),
      S(1330, 1499, { w: { coin: ['악체', 'akçes'], coinUnit: ['악체', 'akçes'] } }),
      S(1690, 1799, { w: { coin: ['쿠루쉬', 'kuruş'], coinUnit: ['쿠루쉬', 'kuruş'] } }),
      S(1923, 1949, { w: { coin: ['리라', 'lira'], coinUnit: ['리라', 'lira'], ruler: ['대통령', 'president'], school: ['학교', 'school'] }, sys: ['공화국 시민', 'citizens of the republic'] }),
    ],
  },
  iran: {
    all: C({ w: { feast: ['노루즈', 'Nowruz'] } }),
    medieval: C({ w: { market: ['바자르', 'bazaar'], school: ['막타브', 'maktab'] } }),
    early: C({ w: { ruler: ['샤', 'shah'], market: ['바자르', 'bazaar'], school: ['막타브', 'maktab'] } }),
    industrial: C({ w: { ruler: ['샤', 'shah'], market: ['바자르', 'bazaar'], school: ['막타브', 'maktab'] } }),
    modern: C({ w: { ruler: ['샤', 'shah'], market: ['바자르', 'bazaar'], coin: ['리알', 'rials'], coinUnit: ['리알', 'rials'] }, values: { coin: 0.00001 } }),
    spans: [
      S(-550, 650, { w: { ruler: ['샤', 'shah'], holy: ['불 제단', 'fire altar'] } }),
      S(224, 650, { w: { holy: ['불의 신전', 'fire temple'] } }),
      S(1979, I, { w: { ruler: ['정부', 'government'] } }),
    ],
  },

  maghreb: { spans: [S(1940, 1943, { war: 3, warName: ['북아프리카 전선', 'the North African front'] })] },

  // ── 유럽 ──
  britain: {
    medieval: C({ w: { landUnit: ['에이커', 'acres'] } }),
    early: C({ w: { coin: ['실링', 'shillings'], coinUnit: ['실링', 'shillings'], landUnit: ['에이커', 'acres'] }, lit: [[1500, 0.1], [1650, 0.3], [1750, 0.45]] }),
    industrial: C({
      w: { coin: ['실링', 'shillings'], coinUnit: ['실링', 'shillings'], landUnit: ['에이커', 'acres'], home: ['벽돌 연립주택', 'terraced house'] },
      r: { elite: ['신사 계급', 'the gentry', 5] },
      tech: [[1800, 4], [1910, 5]], school: [[1800, 0.35], [1870, 0.75], [1890, 0.95]], lit: [[1800, 0.5], [1870, 0.75], [1900, 0.95]],
    }),
    modern: C({ w: { coin: ['파운드', 'pounds'], coinUnit: ['파운드', 'pounds'], landUnit: ['에이커', 'acres'], ruler: ['왕', 'king'] }, values: { coin: 0.01 } }),
    spans: [
      S(43, 410, { w: { ruler: ['황제', 'emperor'] } }),
      S(1553, 1603, { w: { ruler: ['여왕', 'queen'] } }),
      S(1702, 1714, { w: { ruler: ['여왕', 'queen'] } }),
      S(1769, 1799, { tech: 4, items: [['증기 기관', 'steam engine'], ['방적기', 'spinning frame'], ['운하', 'canal']] }),
      S(1837, 1900, { w: { ruler: ['여왕', 'queen'] } }),
      S(1952, 2022, { w: { ruler: ['여왕', 'queen'] } }),
    ],
  },
  france: {
    medieval: C({ w: { landUnit: ['아르팡', 'arpents'], coinUnit: ['드니에', 'deniers'] } }),
    early: C({ w: { landUnit: ['아르팡', 'arpents'], coin: ['수', 'sous'], coinUnit: ['수', 'sous'] } }),
    industrial: C({ w: { landUnit: ['헥타르', 'hectares'], coin: ['프랑', 'francs'], coinUnit: ['프랑', 'francs'] }, values: { land: 5 }, lit: [[1800, 0.4], [1870, 0.65], [1900, 0.85]] }),
    modern: C({ w: { coin: ['프랑', 'francs'], coinUnit: ['프랑', 'francs'], ruler: ['대통령', 'president'], staple: ['바게트', 'baguette'] }, values: { coin: 0.01 } }),
    spans: [
      S(-600, -51, { w: { holy: ['신성한 숲', 'sacred grove'], healer: ['드루이드', 'druid'] } }),   // 철기 갈리아
      S(-50, 476, { w: { ruler: ['황제', 'emperor'] } }),
      S(1800, 1814, { w: { ruler: ['황제', 'emperor'] } }),
      S(1848, 1851, { w: { ruler: ['대통령', 'president'] } }),
      S(1852, 1870, { w: { ruler: ['황제', 'emperor'] } }),
      S(1871, 1939, { w: { ruler: ['대통령', 'president'] } }),
      S(1880, I, { w: { feast: ['혁명 기념일', 'Bastille Day'] } }),
      S(1940, 1946, { w: { ruler: ['정부', 'government'] } }),
      S(2002, I, { w: { coin: ['유로', 'euros'], coinUnit: ['유로', 'euros'] } }),
    ],
  },
  germany: {
    medieval: C({ w: { crop: ['호밀', 'rye'], staple: ['호밀빵', 'rye bread'], landUnit: ['모르겐', 'morgen'], coinUnit: ['페니히', 'pfennigs'] } }),
    early: C({
      w: { crop: ['호밀', 'rye'], staple: ['호밀빵', 'rye bread'], landUnit: ['모르겐', 'morgen'], coin: ['탈러', 'thalers'], coinUnit: ['탈러', 'thalers'], ruler: ['제후', 'prince'], school: ['마을 학교', 'village school'] },
      lit: [[1500, 0.1], [1650, 0.2], [1750, 0.4]],
    }),
    industrial: C({
      w: { crop: ['감자', 'potatoes'], staple: ['호밀빵', 'rye bread'], landUnit: ['모르겐', 'morgen'], coin: ['탈러', 'thalers'], coinUnit: ['탈러', 'thalers'], ruler: ['왕', 'king'] },
      school: [[1800, 0.5], [1870, 0.85]], lit: [[1800, 0.5], [1870, 0.8], [1900, 0.95]],
    }),
    modern: C({ w: { coin: ['마르크', 'marks'], coinUnit: ['마르크', 'marks'] }, values: { coin: 0.01 } }),
    spans: [
      S(-800, 599, { w: { holy: ['신성한 숲', 'sacred grove'] } }),   // 철기 게르만
      S(600, 779, { w: { holy: ['신성한 숲', 'sacred grove'] } }),
      S(800, 1499, { w: { ruler: ['황제', 'emperor'] } }),
      S(1871, 1918, { w: { ruler: ['황제', 'Kaiser'] } }),
      S(1873, 1949, { w: { coin: ['마르크', 'marks'], coinUnit: ['마르크', 'marks'], landUnit: ['헥타르', 'hectares'] }, values: { land: 5 } }),
      S(1919, 1932, { w: { ruler: ['대통령', 'president'] } }),
      S(1933, 1945, { w: { ruler: ['독재 정권', 'dictatorship'] } }),
      S(1946, 1949, { w: { ruler: ['점령 당국', 'occupation authority'] } }),
      S(2002, I, { w: { coin: ['유로', 'euros'], coinUnit: ['유로', 'euros'] } }),
    ],
  },
  italy: {
    ancient: C({ lit: [[-8000, 0], [-300, 0.1], [400, 0.06]] }),
    medieval: C({ w: { ruler: ['영주', 'lord'], market: ['광장 장터', 'piazza market'] }, sys: ['도시 공동체와 봉건 영주', 'city communes and feudal lords'], r: { trade: ['상인', 'merchant', 4] }, lit: [[600, 0.03], [1300, 0.12]] }),
    early: C({ w: { coin: ['스쿠도', 'scudi'], coinUnit: ['스쿠도', 'scudi'], ruler: ['군주', 'prince'] } }),
    industrial: C({ w: { coin: ['스쿠도', 'scudi'], coinUnit: ['스쿠도', 'scudi'], ruler: ['군주', 'prince'] }, lit: [[1800, 0.2], [1870, 0.3], [1910, 0.6]], school: [[1800, 0.2], [1880, 0.5]] }),
    modern: C({ w: { coin: ['리라', 'lire'], coinUnit: ['리라', 'lire'], staple: ['파스타', 'pasta'] }, values: { coin: 0.0001 } }),
    spans: [
      S(-600, 599, {
        w: { landUnit: ['유게룸', 'iugera'], home: ['농가', 'farmhouse'], market: ['포룸', 'forum'], healer: ['의사', 'physician'], school: ['문법 선생의 학당', "grammarian's school"] },
        values: { land: 1 }, sys: ['로마 시민과 노예', 'Roman citizens and slaves'], r: { elite: ['원로원 귀족', 'senatorial noble', 5] },
      }),
      S(-300, 599, { items: [['수도교', 'aqueducts'], ['포장도로', 'paved roads'], ['철 연장', 'iron tools']] }),
      S(-800, -510, { w: { ruler: ['왕', 'king'] } }),
      S(-509, -28, { w: { ruler: ['원로원', 'Senate'] } }),
      S(-27, 476, { w: { ruler: ['황제', 'emperor'] } }),
      S(477, 599, { w: { ruler: ['왕', 'king'] } }),
      S(-211, 300, { w: { coin: ['데나리우스', 'denarii'] } }),
      S(301, 599, { w: { coin: ['동전', 'bronze coins'] } }),
      S(-500, 380, { w: { feast: ['사투르날리아', 'Saturnalia'] } }),
      S(381, 599, { w: { holy: ['교회', 'church'], feast: ['성탄절', 'Christmas'] } }),
      S(1861, 1949, { w: { coin: ['리라', 'lire'], coinUnit: ['리라', 'lire'], ruler: ['왕', 'king'], landUnit: ['헥타르', 'hectares'] }, values: { land: 5 } }),
      S(1922, 1943, { w: { ruler: ['독재 정권', 'dictatorship'] } }),
      S(1946, 1949, { w: { ruler: ['정부', 'government'] } }),
      S(2002, I, { w: { coin: ['유로', 'euros'], coinUnit: ['유로', 'euros'] }, values: { coin: 0.01 } }),
    ],
  },
  east_europe: {
    ancient: C({ w: { crop: ['기장', 'millet'] } }),
    medieval: C({
      w: {
        crop: ['호밀', 'rye'], staple: ['메밀죽', 'kasha'], home: ['통나무집', 'log house'], coin: ['은 덩이', 'silver ingots'], coinUnit: ['그리브나', 'grivnas'],
        ruler: ['대공', 'grand prince'], feast: ['부활절', 'Easter'], school: ['수도원', 'monastery'],
      },
      values: { coin: 5 },
      r: { farm: ['자유 농민', 'free peasant', 2], serve: ['종', 'bondsman', 1, true] },
    }),
    early: C({
      w: { crop: ['호밀', 'rye'], staple: ['메밀죽', 'kasha'], home: ['통나무집', 'log house'], coin: ['코페이카', 'kopecks'], coinUnit: ['코페이카', 'kopecks'], landUnit: ['데샤티나', 'desyatinas'], ruler: ['대공', 'grand prince'], feast: ['부활절', 'Easter'] },
      values: { land: 5 },
      sys: ['농노제', 'serfdom'], r: { farm: ['농노', 'serf', 1, true], serve: ['집안 농노', 'household serf', 1, true], craft: ['장인', 'artisan', 2] },
      lit: [[1500, 0.03], [1750, 0.06]], school: 0.06,
    }),
    industrial: C({
      w: { crop: ['호밀', 'rye'], staple: ['메밀죽', 'kasha'], home: ['통나무집', 'log house'], coin: ['루블', 'roubles'], coinUnit: ['루블', 'roubles'], landUnit: ['데샤티나', 'desyatinas'], ruler: ['차르', 'tsar'], feast: ['부활절', 'Easter'] },
      values: { land: 5 },
      tech: [[1800, 3], [1860, 4], [1930, 5]], school: [[1800, 0.05], [1900, 0.25], [1930, 0.6]], lit: [[1800, 0.08], [1870, 0.15], [1900, 0.25], [1930, 0.6]],
    }),
    modern: C({ w: { coin: ['루블', 'roubles'], coinUnit: ['루블', 'roubles'], staple: ['메밀죽', 'kasha'], feast: ['새해 전야', "New Year's Eve"] }, values: { coin: 0.01 } }),
    spans: [
      S(-800, 988, { w: { holy: ['신성한 숲', 'sacred grove'] } }),   // 철기 뒤 슬라브·발트 땅
      S(1547, 1799, { w: { ruler: ['차르', 'tsar'] } }),
      S(1800, 1861, { sys: ['농노제', 'serfdom'], r: { farm: ['농노', 'serf', 1, true], serve: ['집안 농노', 'household serf', 1, true] } }),
      S(1918, 1991, { w: { ruler: ['소비에트 정부', 'Soviet government'], market: ['국영 상점', 'state store'] }, sys: ['소비에트 체제', 'the Soviet system'] }),
      S(1930, 1974, { r: { farm: ['콜호스 농민', 'collective farmer', 2, true] } }),
      S(1992, I, { w: { ruler: ['정부', 'government'] } }),
    ],
  },
  nordic: {
    all: C({ w: { crop: ['보리', 'barley'], staple: ['귀리죽', 'oat porridge'], feast: ['율', 'Yule'] } }),
    medieval: C({ w: { home: ['긴 집', 'longhouse'] } }),
    industrial: C({ w: { coin: ['크로나', 'kronor'], coinUnit: ['크로나', 'kronor'] } }),
    modern: C({ w: { coin: ['크로나', 'kronor'], coinUnit: ['크로나', 'kronor'] }, values: { coin: 0.001 } }),
    spans: [
      S(600, 1049, { w: { holy: ['제사터', 'sacrificial site'] } }),
      S(600, 899, { w: { ruler: ['족장', 'chieftain'] } }),
      S(750, 1050, { w: { coin: ['은 조각', 'hacksilver'], coinUnit: ['조각', 'pieces'] } }),
    ],
  },
  iberia: {
    early: C({ w: { coin: ['레알', 'reales'], coinUnit: ['레알', 'reales'] } }),
    industrial: C({ w: { coin: ['레알', 'reales'], coinUnit: ['레알', 'reales'] } }),
    modern: C({ w: { coin: ['페세타', 'pesetas'], coinUnit: ['페세타', 'pesetas'] }, values: { coin: 0.001 }, lit: [[1950, 0.75], [1980, 0.92], [2000, 0.97]] }),
    spans: [
      S(711, 1200, {
        w: { holy: ['모스크', 'mosque'], ruler: ['아미르', 'emir'], coin: ['디르함', 'dirhams'], coinUnit: ['닢', 'coins'], market: ['수크', 'souk'], feast: ['이드', 'Eid'], healer: ['하킴', 'hakim'], school: ['쿠타브', 'kuttab'] },
        sys: ['무슬림·딤미·노예', 'Muslims, dhimmis and slaves'],
      }),
      S(929, 1031, { w: { ruler: ['칼리프', 'caliph'] } }),
      S(1868, 1949, { w: { coin: ['페세타', 'pesetas'], coinUnit: ['페세타', 'pesetas'] } }),
      S(1931, 1938, { w: { ruler: ['공화국 정부', 'republican government'] } }),
      S(1939, 1975, { w: { ruler: ['독재 정권', 'dictatorship'] } }),
      S(2002, I, { w: { coin: ['유로', 'euros'], coinUnit: ['유로', 'euros'] }, values: { coin: 0.01 } }),
    ],
  },
  balkans: {
    spans: [
      S(-600, -147, { w: { market: ['아고라', 'agora'], coin: ['드라크마', 'drachmas'] } }),
      S(-146, 1203, { w: { ruler: ['황제', 'emperor'] } }),
      S(1460, 1878, { w: { ruler: ['술탄', 'sultan'] }, sys: ['오스만 신민', 'Ottoman subjects'] }),
      S(1460, 1689, { w: { coin: ['악체', 'akçes'], coinUnit: ['악체', 'akçes'] } }),
      S(1690, 1878, { w: { coin: ['쿠루쉬', 'kuruş'], coinUnit: ['쿠루쉬', 'kuruş'] } }),
    ],
  },

  // ── 사하라 이남 아프리카 ──
  west_africa: {
    all: C({ w: { crop: ['얌', 'yams'], staple: ['푸푸', 'fufu'], beast: ['염소', 'goats'], home: ['흙벽 집', 'mud-walled compound'], cloth: ['면', 'cotton'], feast: ['얌 축제', 'New Yam Festival'] } }),
    ancient: C({ w: { cloth: ['라피아 천', 'raffia cloth'] } }),
    medieval: C({ w: { coin: ['조개', 'cowrie shells'], coinUnit: ['개', 'shells'] }, items: [['청동 주조', 'bronze casting'], ['베틀', 'loom'], ['철 괭이', 'iron hoe']] }),
    early: C({ w: { coin: ['마닐라', 'manillas'], coinUnit: ['개', 'manillas'] } }),
    industrial: C({ w: { coin: ['마닐라', 'manillas'], coinUnit: ['개', 'manillas'] } }),
    modern: C({ w: { coin: ['파운드', 'pounds'], coinUnit: ['파운드', 'pounds'], holy: ['예배당', 'house of prayer'], staple: ['푸푸', 'fufu'], crop: ['얌', 'yams'] }, values: { coin: 0.05 }, lit: [[1950, 0.1], [1980, 0.33], [2000, 0.55], [2015, 0.62]] }),
    spans: [
      S(1200, 1896, {
        w: { ruler: ['왕', 'king'] }, sys: ['왕국과 길드', 'kingdoms and guilds'],
        r: { craft: ['장인 · 왕의 길드', "artisan in the king's guild", 3] },
      }),
      // 땅이 「나이지리아·가나 일대」 하나라 베냉만 가를 수 없다. 설계 2.3 의 예(1500 베냉 장인)를 지키려고 베냉 제국 전성기 장인 줄에만 「오바」를 남긴다
      S(1440, 1600, { r: { craft: ['장인 · 오바의 길드', "artisan in the oba's guild", 3] } }),
      S(1897, 1959, { w: { ruler: ['총독', 'governor'] }, sys: ['식민 통치', 'colonial rule'] }),
      S(1913, 1949, { w: { coin: ['실링', 'shillings'], coinUnit: ['실링', 'shillings'] } }),
      S(1973, I, { w: { coin: ['나이라', 'naira'], coinUnit: ['나이라', 'naira'] }, values: { coin: 0.0001 } }),
    ],
  },

  congo: {
    spans: [
      S(1885, 1907, { w: { ruler: ['자유국 당국', 'Free State administration'] } }),
      S(1887, 1966, { w: { coin: ['프랑', 'francs'], coinUnit: ['프랑', 'francs'] } }),
      S(1900, 1959, { w: { holy: ['교회', 'church'] } }),
      S(1967, 1997, { w: { coin: ['자이르', 'zaires'], coinUnit: ['자이르', 'zaires'] } }),
      S(1998, I, { w: { coin: ['프랑', 'francs'], coinUnit: ['프랑', 'francs'] } }),
    ],
  },
  // 에티오피아는 분할기에 식민지가 되지 않았다 (1936~41 점령만). 케냐·탄자니아는 식민지 → 넓은 말로
  east_africa: {
    spans: [
      S(1885, 1959, { w: { ruler: ['총독이나 황제', 'governor or emperor'] }, sys: ['열강의 지배와 독립 제국', 'colonial rule beside an independent empire'] }),
      S(1900, 1949, { w: { coin: ['은화', 'silver coins'], coinUnit: ['닢', 'coins'] } }),
    ],
  },
  // 남아프리카: 연방(1910)의 인종 차별 법 → 아파르트헤이트(1948~1994) → 민주 공화국. 신분은 집안으로만 정하므로 차별을 겪은 다수의 자리에서 담담하게 쓴다
  south_africa: {
    spans: [
      S(1910, 1947, { w: { ruler: ['정부', 'government'], coin: ['파운드', 'pounds'], coinUnit: ['파운드', 'pounds'] }, sys: ['인종으로 갈린 연방', 'a union divided by race'] }),
      S(1948, 1993, {
        w: { ruler: ['정부', 'government'] }, sys: ['아파르트헤이트 (인종 분리 제도)', 'apartheid (racial segregation)'],
        r: {
          farm: ['지정 구역 농민 · 인종 분류에 묶임', 'farmer in a designated area, bound by racial classification', 1, true],
          factory: ['통행법에 묶인 노동자', 'worker bound by the pass laws', 1, true], craft: ['장인 · 인종 분류에 묶임', 'artisan, bound by racial classification', 2, true],
          serve: ['가사 노동자 · 통행법에 묶임', 'domestic worker bound by the pass laws', 1, true], trade: ['상인', 'trader', 3], shop: ['가게 주인', 'shopkeeper', 2],
          office: ['사무원', 'clerk', 3], sail: ['선원', 'sailor', 2], elite: ['부유층', 'the well-to-do', 5], pro: ['전문직', 'professional', 4],
        },
      }),
      S(1987, 1993, {
        r: {
          factory: ['노동자 · 인종 분류에 묶임', 'worker, bound by racial classification', 1, true],
          serve: ['가사 노동자 · 인종 분류에 묶임', 'domestic worker, bound by racial classification', 1, true],
        },
      }),   // 통행법 폐지(1986) 뒤
      S(1948, 1960, { w: { coin: ['파운드', 'pounds'], coinUnit: ['파운드', 'pounds'] } }),
      S(1961, I, { w: { coin: ['랜드', 'rand'], coinUnit: ['랜드', 'rand'] }, values: { coin: 0.01 } }),
      S(1994, I, { w: { ruler: ['정부', 'government'] }, sys: ['민주 공화국의 시민', 'citizens of a democratic republic'] }),
    ],
  },

  // ── 아메리카 ──
  mesoamerica: {
    all: C({ w: { crop: ['옥수수', 'maize'], staple: ['토르티야', 'tortillas'], land: ['밀파', 'milpa'] } }),
    ancient: C({
      w: {
        beast: ['칠면조', 'turkeys'], home: ['초가', 'thatched hut'], holy: ['피라미드 신전', 'pyramid temple'],
        ruler: ['왕', 'king'], feast: ['신들의 축일', 'festival of the gods'], market: ['장터', 'market'], healer: ['치료사', 'curer'],
      },
      sys: ['귀족과 평민', 'nobles and commoners'], r: { farm: ['평민 농부', 'commoner farmer', 2], serve: ['노예', 'slave', 1, true], elite: ['귀족', 'noble', 5] },
      tech: 2, items: [['돌 연장', 'stone tools'], ['달력', 'calendar'], ['그림 글자', 'glyph writing']], lit: [[-8000, 0], [-300, 0.01]],
      first: ['아이가 첫 해를 넘겼어요. 태어난 날의 이름이 좋은 날이라며 어른들이 기뻐했어요.', 'The child passed its first year. The elders were pleased: its birth-day name was a lucky one.'],
    }),
    medieval: C({
      w: {
        beast: ['칠면조', 'turkeys'], home: ['초가', 'thatched hut'], holy: ['피라미드 신전', 'pyramid temple'],
        ruler: ['왕', 'king'], feast: ['신들의 축일', 'festival of the gods'], healer: ['치료사', 'curer'],
      },
      sys: ['귀족과 평민', 'nobles and commoners'], r: { farm: ['평민 농부', 'commoner farmer', 2], serve: ['노예', 'slave', 1, true], elite: ['귀족', 'noble', 5] },
      tech: 2, items: [['돌 연장', 'stone tools'], ['달력', 'calendar'], ['그림 글자', 'glyph writing']], lit: 0.01,
      first: ['아이가 첫 해를 넘겼어요. 태어난 날의 이름이 좋은 날이라며 어른들이 기뻐했어요.', 'The child passed its first year. The elders were pleased: its birth-day name was a lucky one.'],
    }),
    early: C({
      w: { beast: ['칠면조', 'turkeys'], feast: ['죽은 자의 날', 'Day of the Dead'], market: ['티앙기스', 'tianguis'] },
      r: { farm: ['원주민 마을 농민', 'Indigenous village farmer', 2], serve: ['빚에 묶인 일꾼', 'debt-bound laborer', 1, true] },
    }),
    industrial: C({ w: { feast: ['죽은 자의 날', 'Day of the Dead'], market: ['티앙기스', 'tianguis'] }, r: { farm: ['아시엔다의 페온', 'hacienda peon', 1, true] } }),
    modern: C({
      w: { feast: ['죽은 자의 날', 'Day of the Dead'], market: ['티앙기스', 'tianguis'], home: ['시멘트 블록집', 'cinder-block house'] },
      first: ['첫 생일에 피냐타가 터졌어요. 사탕은 대부분 사촌들 몫이었어요.', 'A piñata burst on the first birthday. Most of the sweets went to the cousins.'],
    }),
    spans: [
      S(-I, -1001, { w: { holy: ['성소', 'shrine'], ruler: ['족장', 'chief'] }, tech: 1, items: [['돌 연장', 'stone tools'], ['토기', 'pottery'], ['맷돌', 'grinding stone']] }),
      S(-1000, -301, { items: [['돌 연장', 'stone tools'], ['토기', 'pottery'], ['옥 구슬', 'jade beads']] }),
      S(250, 1499, { w: { coin: ['카카오 콩', 'cacao beans'], coinUnit: ['알', 'beans'] } }),
      S(1500, 1521, {
        w: {
          coin: ['카카오 콩', 'cacao beans'], coinUnit: ['알', 'beans'], home: ['초가', 'thatched hut'], holy: ['피라미드 신전', 'pyramid temple'], feast: ['신들의 축일', 'festival of the gods'],
          healer: ['치료사', 'curer'], school: ['어른들의 이야기 자리', "elders' circle"],
        },
        dz: ['tb', 'dysentery'], med: 1, tech: 2, items: [['돌 연장', 'stone tools'], ['달력', 'calendar'], ['그림 글자', 'glyph writing']], lit: 0.01,
        first: ['아이가 첫 해를 넘겼어요. 태어난 날의 이름이 좋은 날이라며 어른들이 기뻐했어요.', 'The child passed its first year. The elders were pleased: its birth-day name was a lucky one.'],
      }),
      S(1428, 1521, {
        w: { ruler: ['틀라토아니', 'tlatoani'], market: ['티앙기스', 'tianguis'], school: ['텔포치칼리', 'telpochcalli'] }, sys: ['피필틴과 마세우알틴', 'pipiltin and macehualtin'],
        r: { farm: ['마세우알리 (평민)', 'macehualli (commoner)', 2], serve: ['틀라코틀리 (노예)', 'tlacotli (slave)', 1, true], elite: ['필리 (귀족)', 'pilli (noble)', 5] },
      }),
      S(1917, 1949, { r: { farm: ['에히도 농민', 'ejido farmer', 2] } }),
    ],
  },
  andes: {
    all: C({ w: { crop: ['감자', 'potatoes'], staple: ['추뇨', 'chuño'], beast: ['라마', 'llamas'], cloth: ['알파카 털', 'alpaca wool'] }, first: ['아이가 첫 해를 넘겼어요. 친척들은 벌써 첫 머리 깎기 잔치에 가져올 선물을 의논했어요.', 'The child passed its first year. The relatives were already arguing over gifts for the first-haircut feast.'] }),
    ancient: C({
      w: { coin: ['옷감', 'woven cloth'], coinUnit: ['필', 'bolts'], home: ['돌집', 'stone house'], holy: ['와카', 'huaca'], ruler: ['군주', 'lord'], market: ['물물교환 장', 'barter fair'], healer: ['치료사', 'curer'] },
      sys: ['아이유 (친족 공동체)', 'the ayllu (kin community)'],
      r: { farm: ['아이유의 농민', 'ayllu farmer', 2], herd: ['라마 치는 집', 'llama herders', 2], serve: ['평생 하인', 'lifelong servant', 1, true], elite: ['군주의 집안', "lord's kin", 5] },
      tech: 2, items: [['돌 연장', 'stone tools'], ['계단밭', 'terraces'], ['관개 수로', 'irrigation canals']],
    }),
    medieval: C({
      w: { coin: ['옷감', 'woven cloth'], coinUnit: ['필', 'bolts'], home: ['돌집', 'stone house'], holy: ['와카', 'huaca'], ruler: ['군주', 'lord'], market: ['물물교환 장', 'barter fair'], healer: ['치료사', 'curer'] },
      sys: ['아이유 (친족 공동체)', 'the ayllu (kin community)'],
      r: { farm: ['아이유의 농민', 'ayllu farmer', 2], serve: ['평생 하인', 'lifelong servant', 1, true], elite: ['군주의 집안', "lord's kin", 5] },
      tech: 2, items: [['돌 연장', 'stone tools'], ['계단밭', 'terraces'], ['키푸', 'quipu']],
    }),
    early: C({
      w: { feast: ['성인 축일', "saint's day"] }, sys: ['식민지 카스타와 미타 부역', 'colonial castas and the mita draft'],
      items: [['쇠 연장', 'iron tools'], ['화약', 'gunpowder'], ['은광', 'silver mines']],
      r: { farm: ['원주민 농민 · 미타 부역', 'Indigenous commoner owing mita labor', 1, true] },
    }),
    modern: C({ w: { coin: ['솔', 'soles'], coinUnit: ['솔', 'soles'] }, values: { coin: 0.003 } }),
    spans: [
      S(-I, -1001, { items: [['돌 연장', 'stone tools'], ['관개 수로', 'irrigation canals'], ['토기', 'pottery']] }),
      S(-1000, I, { w: { land: ['계단밭', 'terraces'] } }),
      S(1500, 1532, {
        w: { coin: ['옷감', 'woven cloth'], coinUnit: ['필', 'bolts'], home: ['돌집', 'stone house'], holy: ['와카', 'huaca'], market: ['물물교환 장', 'barter fair'], healer: ['치료사', 'curer'], school: ['어른들의 이야기 자리', "elders' circle"] },
        r: { farm: ['아이유의 농민', 'ayllu farmer', 2] }, dz: ['tb', 'dysentery'], med: 1, tech: 2, items: [['돌 연장', 'stone tools'], ['계단밭', 'terraces'], ['키푸', 'quipu']], lit: 0,
      }),
      S(1438, 1532, {
        w: { ruler: ['사파 잉카', 'Sapa Inca'], feast: ['인티 라이미', 'Inti Raymi'] }, sys: ['아이유와 미타 부역', "ayllu and mit'a labor"],
        r: { serve: ['야나 (평생 하인)', 'yana (lifelong servant)', 1, true], elite: ['잉카 귀족', 'Inca noble', 5] },
      }),
      S(1863, 1949, { w: { coin: ['솔', 'soles'], coinUnit: ['솔', 'soles'] } }),
      S(1944, I, { w: { feast: ['인티 라이미', 'Inti Raymi'] } }),
    ],
  },
  north_america: {
    ancient: C({
      w: {
        crop: ['호박', 'squash'], staple: ['사슴 고기', 'venison'], land: ['숲 속 밭', 'forest clearings'], home: ['나무껍질 집', 'bark house'], holy: ['흙 둔덕', 'earthen mound'],
        cloth: ['사슴 가죽', 'deerskin'], healer: ['주술사', 'medicine person'],
      },
      first: ['아이가 첫 해를 넘겼어요. 요람판에 묶인 채로 온 마을 구경을 다녔어요.', 'The child passed its first year, carried round the whole village laced to its cradleboard.'],
    }),
    medieval: C({
      w: {
        crop: ['옥수수', 'maize'], staple: ['옥수수 죽', 'hominy'], land: ['숲 속 밭', 'forest clearings'], home: ['나무껍질 집', 'bark house'], holy: ['흙 둔덕', 'platform mound'],
        cloth: ['사슴 가죽', 'deerskin'], healer: ['주술사', 'medicine person'],
      },
      tech: 2, items: [['활과 화살', 'bow and arrow'], ['돌괭이', 'stone hoe'], ['토기', 'pottery']],
      first: ['아이가 첫 해를 넘겼어요. 요람판에 묶인 채로 온 마을 구경을 다녔어요.', 'The child passed its first year, carried round the whole village laced to its cradleboard.'],
    }),
    early: C({
      w: {
        crop: ['옥수수', 'maize'], staple: ['옥수수 죽', 'hominy'], coin: ['조개 구슬', 'shell beads'], coinUnit: ['줄', 'strings'], land: ['숲 속 밭', 'forest clearings'], landUnit: ['뙈기', 'plots'],
        beast: ['사슴', 'deer'], home: ['나무껍질 집', 'bark house'], holy: ['성소', 'shrine'], ruler: ['족장', 'chief'], feast: ['옥수수 축제', 'green corn festival'],
        cloth: ['사슴 가죽', 'deerskin'], market: ['교역 모임', 'trading gathering'], healer: ['주술사', 'medicine person'], school: ['어른들의 이야기 자리', "elders' circle"],
      },
      sys: ['족장과 마을 사람들', 'chiefs and villagers'], tech: 2, med: 1,
      items: [['활과 화살', 'bow and arrow'], ['돌괭이', 'stone hoe'], ['토기', 'pottery']],
      r: { farm: ['농사짓는 마을 사람', 'village farmer', 2], sail: ['카누 타는 집', 'canoe family', 2], craft: ['장인', 'craftworker', 3], trade: ['교역하는 집', 'trader', 3], serve: ['포로 출신 종', 'captive servant', 1, true], elite: ['족장 집안', "chief's family", 5] },
      first: ['아이가 첫 해를 넘겼어요. 요람판에 묶인 채로 온 마을 구경을 다녔어요.', 'The child passed its first year, carried round the whole village laced to its cradleboard.'],
    }),
    industrial: C({
      w: {
        crop: ['옥수수', 'corn'], staple: ['옥수수빵', 'cornbread'], coin: ['달러', 'dollars'], coinUnit: ['달러', 'dollars'], landUnit: ['에이커', 'acres'], home: ['농가', 'farmhouse'],
        feast: ['독립기념일', 'the Fourth of July'], market: ['잡화점', 'general store'], healer: ['의사', 'doctor'], school: ['학교', 'schoolhouse'],
      },
      sys: ['계급 사회', 'class society'],
      r: { farm: ['자영농', 'homesteader', 2], elite: ['부유층', 'the well-to-do', 5] },
      med: [[1800, 3], [1880, 4]], tech: [[1800, 3], [1840, 4], [1920, 5]],
      school: [[1800, 0.3], [1870, 0.6], [1910, 0.85]], lit: [[1800, 0.6], [1870, 0.8], [1910, 0.92]],
      first: BREAD,
    }),
    modern: C({
      w: {
        crop: ['옥수수', 'corn'], staple: ['빵', 'bread'], coin: ['달러', 'dollars'], coinUnit: ['달러', 'dollars'], landUnit: ['에이커', 'acres'], home: ['교외 주택', 'suburban house'],
        feast: ['추수감사절', 'Thanksgiving'], cloth: ['데님', 'denim'], market: ['슈퍼마켓', 'supermarket'],
      },
      values: { coin: 0.01, land: 2 },
      tech: 5, school: 0.98, lit: 0.99,
      first: ['첫 생일 케이크를 아이가 두 손으로 먹었어요. 사진이 여러 장 남았어요.', 'The child ate the first-birthday cake with both hands. Many photographs survive.'],
    }),
    spans: [
      S(1500, 1699, { dzAdd: ['smallpox', 'measles'], dzDel: ['malaria', 'yellowfever'] }),
      S(1700, 1799, {
        w: {
          crop: ['옥수수', 'corn'], staple: ['옥수수빵', 'cornbread'], coin: ['실링', 'shillings'], coinUnit: ['실링', 'shillings'], land: ['밭', 'fields'], landUnit: ['에이커', 'acres'],
          beast: ['소', 'cattle'], home: ['나무집', 'wooden house'], holy: ['교회', 'church'], ruler: ['총독', 'governor'], feast: ['추수 감사 예배', 'harvest thanksgiving'],
          cloth: ['모직', 'homespun wool'], market: ['장터', 'market'], healer: ['의사', 'doctor'], school: ['마을 학교', 'town school'],
        },
        sys: ['식민지 신분과 노예제', 'colonial ranks and slavery'],
        r: { farm: ['자영농', 'freeholder', 3], sail: ['뱃사람', 'sailor', 2], craft: ['장인', 'artisan', 3], trade: ['상인', 'merchant', 3], serve: ['노예나 계약 하인', 'enslaved or indentured servant', 1, true], elite: ['대농장주나 신사', 'planter or gentleman', 5] },
        tech: 3, items: [['쇠 연장', 'iron tools'], ['화약', 'gunpowder'], ['범선', 'sailing ship']], lit: [[1700, 0.4], [1750, 0.5]], school: 0.3,
        first: ['첫 생일이라고 따로 잔치는 없었어요. 그래도 그날 저녁 빵이 조금 더 하얬어요.', 'There was no party for a first birthday. Still, the bread that evening was a little whiter.'],
      }),
      S(1776, 1788, { w: { ruler: ['의회', 'Congress'] } }),
      S(1789, I, { w: { ruler: ['대통령', 'president'] } }),
      S(1800, 1865, { sys: ['노예제와 자유 노동', 'slavery and free labor'], r: { serve: ['노예', 'enslaved', 1, true] } }),
      S(1866, 1949, { r: { serve: ['하인', 'domestic servant', 1] } }),
      S(1800, 1829, { items: [['운하', 'canal'], ['조면기', 'cotton gin'], ['범선', 'sailing ship']] }),
      S(1830, 1849, { items: [['증기선', 'steamboat'], ['철도', 'railway'], ['조면기', 'cotton gin']] }),
      S(1870, 1949, { first: ['첫 생일에 작은 케이크가 나왔어요. 초는 하나였어요.', 'There was a small cake on the first birthday, with a single candle.'] }),
    ],
  },
  brazil: {
    early: C({ w: { coin: ['헤이스', 'réis'], coinUnit: ['헤이스', 'réis'], staple: ['카사바 가루', 'manioc flour'], ruler: ['총독', 'governor-general'] } }),
    industrial: C({ w: { coin: ['헤이스', 'réis'], coinUnit: ['헤이스', 'réis'], staple: ['카사바 가루', 'manioc flour'], feast: ['카니발', 'Carnival'] }, values: { coin: 0.01 } }),
    modern: C({ w: { coin: ['크루제이루', 'cruzeiros'], coinUnit: ['크루제이루', 'cruzeiros'] }, values: { coin: 0.001 } }),
    spans: [
      S(1500, 1549, { ...AMER_NATIVE, w: { ...AMER_NATIVE.w, staple: ['카사바 가루', 'manioc flour'] } }),
      S(1800, 1888, { r: { serve: ['노예', 'enslaved', 1, true] } }),
      S(1822, 1889, { w: { ruler: ['황제', 'emperor'] } }),
      S(1942, 1993, { w: { coin: ['크루제이루', 'cruzeiros'], coinUnit: ['크루제이루', 'cruzeiros'] } }),
      S(1994, I, { w: { coin: ['헤알', 'reais'], coinUnit: ['헤알', 'reais'] }, values: { coin: 0.003 } }),
    ],
  },
  la_plata: {
    preFarm: C({ w: { beast: ['과나코', 'guanacos'] } }),
    early: C({ w: { crop: ['밀', 'wheat'], staple: ['빵', 'bread'] }, items: [['쇠 연장', 'iron tools'], ['화약', 'gunpowder'], ['소 목장', 'cattle ranches']] }),
    industrial: C({ w: { crop: ['밀', 'wheat'], staple: ['소고기', 'beef'] } }),
    modern: C({ w: { crop: ['밀', 'wheat'], staple: ['아사도', 'asado'] } }),
  },
  caribbean: {
    early: C({ w: { coin: ['은화', 'silver coins'], coinUnit: ['닢', 'coins'], home: ['오두막', 'hut'], ruler: ['총독', 'governor'] } }),
    industrial: C({ w: { crop: ['사탕수수', 'sugarcane'], home: ['오두막', 'hut'] }, r: { farm: ['소농', 'smallholder', 2] } }),
    modern: C({ w: { crop: ['사탕수수', 'sugarcane'] } }),
    spans: [
      S(1500, 1519, { items: [['쇠 연장', 'iron tools'], ['화약', 'gunpowder'], ['범선', 'sailing ship']] }),
      S(1520, 1799, {
        w: { crop: ['사탕수수', 'sugarcane'] }, sys: ['농장 노예제', 'plantation slavery'],
        r: { farm: ['사탕수수 농장의 노예', 'enslaved on a sugar plantation', 1, true], serve: ['노예', 'enslaved', 1, true], elite: ['농장주', 'planter', 5] },
      }),
      S(1800, 1838, { sys: ['농장 노예제', 'plantation slavery'], r: { farm: ['사탕수수 농장의 노예', 'enslaved on a sugar plantation', 1, true], serve: ['노예', 'enslaved', 1, true] } }),
    ],
  },

  // ── 동남아시아·오세아니아 ──
  indonesia: {
    medieval: C({ w: { ruler: ['라자', 'raja'] }, first: FIRST_STEP }),
    early: C({ ...ISLAM_SEA, first: FIRST_STEP }),
    industrial: C({ w: { ...ISLAM_SEA.w, coin: ['휠던', 'guilders'], coinUnit: ['휠던', 'guilders'], ruler: ['총독', 'governor-general'] }, first: FIRST_STEP }),
    modern: C({ w: { ...ISLAM_SEA.w, coin: ['루피아', 'rupiah'], coinUnit: ['루피아', 'rupiah'], ruler: ['정부', 'government'] }, values: { coin: 0.000001 }, first: FIRST_STEP }),
    spans: [S(1600, I, { w: { cloth: ['바틱', 'batik'] } })],
  },
  malay: {
    medieval: C({ w: { ruler: ['라자', 'raja'] } }),
    early: C({ ...ISLAM_SEA, first: FIRST_STEP }),
    industrial: C({ w: { ...ISLAM_SEA.w, coin: ['달러', 'Straits dollars'], coinUnit: ['달러', 'dollars'] }, first: FIRST_STEP }),
    modern: C({ w: { ...ISLAM_SEA.w, coin: ['링깃', 'ringgit'], coinUnit: ['링깃', 'ringgit'], ruler: ['정부', 'government'] }, values: { coin: 0.003 }, first: FIRST_STEP }),
    spans: [S(1400, 1499, { w: ISLAM_SEA.w })],
  },
  philippines: {
    medieval: C({ w: { ruler: ['다투', 'datu'], holy: ['아니토 사당', 'anito shrine'], school: ['어른들의 이야기 자리', "elders' circle"] } }),
    early: C({ w: { ruler: ['다투', 'datu'], holy: ['아니토 사당', 'anito shrine'] } }),
    industrial: C({ w: { coin: ['페소', 'pesos'], coinUnit: ['페소', 'pesos'], holy: ['교회', 'church'], feast: ['피에스타', 'fiesta'], healer: ['아르브랄리오', 'albularyo'], ruler: ['총독', 'governor-general'] } }),
    modern: C({ w: { coin: ['페소', 'pesos'], coinUnit: ['페소', 'pesos'], holy: ['교회', 'church'], feast: ['피에스타', 'fiesta'], ruler: ['대통령', 'president'] }, values: { coin: 0.002 } }),
    spans: [
      S(1565, 1799, {
        w: { holy: ['교회', 'church'], ruler: ['총독', 'governor-general'], feast: ['피에스타', 'fiesta'], coin: ['레알', 'reales'], coinUnit: ['레알', 'reales'], healer: ['아르브랄리오', 'albularyo'], school: ['교리 학교', 'catechism school'] },
      }),
    ],
  },
  mainland_sea: {
    all: C({ w: { holy: ['절', 'Buddhist temple'], feast: ['새해 축제', 'New Year Festival'] } }),
    medieval: C({ w: { school: ['절 학교', 'temple school'], healer: ['약초 의원', 'herb doctor'] } }),
    early: C({ w: { ruler: ['왕', 'king'], school: ['절 학교', 'temple school'], healer: ['약초 의원', 'herb doctor'] } }),
    spans: [S(-I, 99, { w: { holy: ['정령의 사당', 'spirit shrine'] } })],
  },
  australia: {
    forager: C({ w: { beast: ['캥거루', 'kangaroos'], home: ['나무껍질 움막', 'bark shelter'] }, items: [['부메랑', 'boomerang'], ['돌도끼', 'stone axe'], ['불', 'fire']] }),
    preFarm: C(AUS_PREFARM),
    industrial: C({
      w: {
        crop: ['밀', 'wheat'], staple: ['빵', 'bread'], coin: ['실링', 'shillings'], coinUnit: ['실링', 'shillings'], land: ['목장', 'sheep runs'], landUnit: ['에이커', 'acres'],
        beast: ['양', 'sheep'], home: ['양철 지붕 집', 'tin-roofed house'], holy: ['교회', 'church'], ruler: ['총독', 'governor'], feast: ['성탄절', 'Christmas'],
        cloth: ['모직', 'wool'], market: ['시장', 'market'], healer: ['의사', 'doctor'], school: ['학교', 'school'],
      },
      sys: ['식민지 사회', 'colonial society'],
      r: { farm: ['농부', 'farmer', 2], factory: ['공장 노동자', 'factory worker', 2], craft: ['장인', 'artisan', 3], trade: ['상인', 'merchant', 3], sail: ['선원', 'sailor', 2], serve: ['하인', 'domestic servant', 1], elite: ['목장주', 'squatter', 5] },
      dz: ['tb', 'typhoid', 'measles'], med: [[1800, 2], [1830, 3], [1880, 4]], tech: [[1800, 3], [1860, 4], [1920, 5]],
      school: [[1800, 0.3], [1880, 0.8]], lit: [[1800, 0.5], [1900, 0.9]],
      first: BREAD,
    }),
    modern: C({
      w: {
        crop: ['밀', 'wheat'], staple: ['빵', 'bread'], coin: ['달러', 'dollars'], coinUnit: ['달러', 'dollars'], land: ['목장', 'sheep runs'], landUnit: ['헥타르', 'hectares'],
        beast: ['양', 'sheep'], home: ['교외 주택', 'suburban house'], holy: ['교회', 'church'], feast: ['한여름 성탄절', 'Midsummer Christmas'], cloth: ['모직', 'wool'],
        market: ['슈퍼마켓', 'supermarket'],
      },
      values: { coin: 0.01 },
      sys: ['시민 사회', 'civil society'], dz: ['influenza'], tech: 5, school: 0.98, lit: 0.99,
      first: ['첫 생일 케이크에 초 하나가 꽂혔어요. 사진이 여러 장 남았어요.', 'One candle on the first-birthday cake. Several photographs survive.'],
    }),
    spans: [
      S(1788, 1799, {
        w: { crop: ['밀', 'wheat'], staple: ['빵', 'bread'], coin: ['실링', 'shillings'], coinUnit: ['실링', 'shillings'], beast: ['양', 'sheep'], home: ['오두막', 'hut'], holy: ['교회', 'church'], ruler: ['총독', 'governor'], landUnit: ['에이커', 'acres'], land: ['밭', 'fields'] },
        sys: ['죄수 식민지', 'penal colony'], r: { serve: ['죄수 일꾼', 'convict laborer', 1, true], elite: ['장교와 관리', 'officers and officials', 5] }, med: 2, tech: 3, items: [['쇠 연장', 'iron tools'], ['화약', 'gunpowder'], ['범선', 'sailing ship']],
      }),
      S(1800, 1849, { sys: ['죄수 식민지', 'penal colony'], r: { serve: ['죄수 일꾼', 'convict laborer', 1, true] } }),
      S(1901, 1949, { w: { ruler: ['정부', 'government'] }, sys: ['연방 시민', 'citizens of the federation'] }),
      S(1870, 1949, { first: CAKE }),
      S(1950, 1965, { w: { coin: ['파운드', 'pounds'], coinUnit: ['파운드', 'pounds'] } }),
    ],
  },
  pacific: {
    ancient: C({
      w: {
        crop: ['타로', 'taro'], staple: ['구운 타로', 'baked taro'], coin: ['조개 화폐', 'shell money'], coinUnit: ['줄', 'strings'], beast: ['돼지', 'pigs'], home: ['초가 오두막', 'thatched hut'],
        holy: ['정령의 집', 'spirit house'], ruler: ['족장', 'chief'], feast: ['돼지 잔치', 'pig feast'], cloth: ['타파 천', 'tapa cloth'], market: ['교역 모임', 'trading gathering'],
      },
      sys: ['족장과 친족', 'chiefs and kin'], tech: 1, items: [['돌도끼', 'stone adze'], ['토란 밭 도랑', 'taro ditches'], ['통나무배', 'dugout canoe']],
    }),
    medieval: C({
      w: {
        crop: ['타로', 'taro'], staple: ['구운 타로', 'baked taro'], coin: ['조개 화폐', 'shell money'], coinUnit: ['줄', 'strings'], beast: ['돼지', 'pigs'], home: ['초가 오두막', 'thatched hut'],
        holy: ['정령의 집', 'spirit house'], ruler: ['족장', 'chief'], feast: ['돼지 잔치', 'pig feast'], cloth: ['타파 천', 'tapa cloth'], market: ['교역 모임', 'trading gathering'], school: ['어른들의 이야기 자리', "elders' circle"],
      },
      sys: ['족장과 친족', 'chiefs and kin'], tech: 1, items: [['아웃리거 카누', 'outrigger canoe'], ['돌도끼', 'stone adze'], ['토란 밭 도랑', 'taro ditches']],
    }),
    early: C({
      w: {
        crop: ['고구마', 'sweet potatoes'], staple: ['구운 타로', 'baked taro'], coin: ['조개 화폐', 'shell money'], coinUnit: ['줄', 'strings'], beast: ['돼지', 'pigs'], home: ['초가 오두막', 'thatched hut'],
        holy: ['정령의 집', 'spirit house'], ruler: ['족장', 'chief'], feast: ['돼지 잔치', 'pig feast'], cloth: ['타파 천', 'tapa cloth'], market: ['교역 모임', 'trading gathering'], school: ['어른들의 이야기 자리', "elders' circle"],
      },
      sys: ['족장과 친족', 'chiefs and kin'], tech: 1, items: [['아웃리거 카누', 'outrigger canoe'], ['돌도끼', 'stone adze'], ['토란 밭 도랑', 'taro ditches']],
    }),
    industrial: C({ w: { crop: ['고구마', 'sweet potatoes'], staple: ['구운 타로', 'baked taro'], beast: ['돼지', 'pigs'], holy: ['교회', 'church'], feast: ['돼지 잔치', 'pig feast'], coin: ['실링', 'shillings'], coinUnit: ['실링', 'shillings'] } }),
    modern: C({ w: { crop: ['고구마', 'sweet potatoes'], staple: ['구운 타로', 'baked taro'], beast: ['돼지', 'pigs'], holy: ['교회', 'church'], feast: ['돼지 잔치', 'pig feast'] } }),
    spans: [
      S(-1500, 599, { items: [['아웃리거 카누', 'outrigger canoe'], ['돌도끼', 'stone adze'], ['토란 밭 도랑', 'taro ditches']] }),
      S(-I, 1799, { r: { serve: ['족장의 식구', "a chief's dependant", 1, true] } }),
      S(1975, I, { w: { coin: ['키나', 'kina'], coinUnit: ['키나', 'kina'] }, values: { coin: 0.01 } }),
    ],
  },

  // ── 초원 ──
  steppe: {
    all: C({ w: { crop: ['밀', 'wheat'], staple: ['난', 'flatbread'], home: ['흙벽돌집', 'mud-brick house'], beast: ['양', 'sheep'], cloth: ['면', 'cotton'], market: ['바자르', 'bazaar'], land: ['오아시스 밭', 'oasis fields'], landUnit: ['뙈기', 'plots'] }, values: { land: 2 } }),
    ancient: C({
      w: { coin: ['은화', 'silver coins'], coinUnit: ['닢', 'coins'], holy: ['불의 신전', 'fire temple'], ruler: ['왕', 'king'] },
      sys: ['오아시스 도시와 유목 씨족', 'oasis towns and nomad clans'], r: { farm: ['오아시스 농부', 'oasis farmer', 2] },
    }),
    medieval: C({
      w: { coin: ['디르함', 'dirhams'], coinUnit: ['닢', 'coins'], holy: ['모스크', 'mosque'], feast: ['노루즈', 'Nowruz'], healer: ['하킴', 'hakim'], school: ['마드라사', 'madrasa'] },
      r: { farm: ['오아시스 농부', 'oasis farmer', 2] },
      med: 2,
    }),
    early: C({
      w: { coin: ['탕가', 'tangas'], coinUnit: ['탕가', 'tangas'], holy: ['모스크', 'mosque'], feast: ['노루즈', 'Nowruz'], healer: ['하킴', 'hakim'], school: ['마드라사', 'madrasa'] },
      sys: ['칸국과 오아시스 도시', 'khanates and oasis towns'], r: { farm: ['오아시스 농부', 'oasis farmer', 2] }, med: 2,
    }),
    industrial: C({
      w: { coin: ['탕가', 'tangas'], coinUnit: ['탕가', 'tangas'], holy: ['모스크', 'mosque'], feast: ['노루즈', 'Nowruz'], healer: ['하킴', 'hakim'], school: ['마드라사', 'madrasa'] },
      sys: ['칸국과 오아시스 도시', 'khanates and oasis towns'],
    }),
    modern: C({ w: { coin: ['루블', 'roubles'], coinUnit: ['루블', 'roubles'], holy: ['모스크', 'mosque'], feast: ['노루즈', 'Nowruz'], staple: ['플로프', 'plov'] }, values: { coin: 0.01 } }),
    spans: [
      S(-I, -601, { w: { holy: ['성소', 'shrine'], coin: ['보리', 'barley'], coinUnit: ['자루', 'sacks'], ruler: ['족장', 'chieftain'] } }),
      S(600, 749, { w: { holy: ['불의 신전', 'fire temple'], ruler: ['왕', 'king'], coin: ['은화', 'silver coins'], school: ['스승의 집', "teacher's house"] } }),
      S(750, 899, { w: { school: ['쿠타브', 'kuttab'] } }),
      S(1867, 1917, { sys: ['러시아 식민 통치', 'Russian colonial rule'] }),
      S(750, 999, { w: { ruler: ['아미르', 'emir'] } }),
      S(1867, 1917, { w: { ruler: ['총독', 'governor-general'], coin: ['루블', 'roubles'], coinUnit: ['루블', 'roubles'] } }),
      S(1918, 1991, { w: { ruler: ['소비에트 정부', 'Soviet government'], school: ['학교', 'school'], coin: ['루블', 'roubles'], coinUnit: ['루블', 'roubles'] }, sys: ['소비에트 체제', 'the Soviet system'] }),
      S(1992, I, { w: { coin: ['지폐', 'banknotes'], coinUnit: ['장', 'notes'] }, sys: ['시민', 'citizens'], values: { coin: 0.1 } }),
    ],
  },
};

// ── 사건 수정 (옛 자리) ──
// Task 5 에서 사건마다 war·warAt·warName·econ·disease·after 필드를 events.js 에 직접 두었다. context.js 는 events.js 필드를 먼저 읽고,
// 없을 때만 여기를 본다. 그래서 지금은 비어 있다. 새 사건의 수정값은 events.js 에 적는다.
export const EVENT_MODS = {};
