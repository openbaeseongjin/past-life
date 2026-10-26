// estate.js
// 재산 기반 실물 살림 장만 및 3D 마당 배치 시스템

export const ESTATE_SLOTS = ['livestock', 'transport', 'household', 'prestige'];

export const ESTATE_CATALOG = {
  livestock: [
    {
      tier: 1,
      id: 'chicken',
      name: { ko: '토종닭과 오리장', en: 'Chicken & Duck Coop' },
      cost: 10,
      propByKit: {
        eastasia: 'duck_ea',
        england: 'chicken',
        southasia: 'chicken',
        mudbrick: 'chicken',
      },
      bonus: { happy: 2 },
      desc: { ko: '매일 아침 달걀과 고기를 식구들에게 보탭니다 (행복 +2).', en: 'Fresh eggs and meat for the family (Happy +2).' },
    },
    {
      tier: 2,
      id: 'pig',
      name: { ko: '토종 돼지우리', en: 'Pig Pen' },
      cost: 25,
      propByKit: {
        eastasia: 'pig',
        england: 'sheep',
        southasia: 'sheep',
        mudbrick: 'sheep',
      },
      bonus: { wealthIncome: 0.1 },
      desc: { ko: '가축을 길러 장터에 내다팔아 수입을 늘립니다 (품삯 +10%).', en: 'Raise livestock for market sale (+10% wage).' },
    },
    {
      tier: 3,
      id: 'ox',
      name: { ko: '누렁소 외양간', en: 'Ox & Stable' },
      cost: 60,
      propByKit: {
        eastasia: 'ox_ea',
        england: 'cow',
        southasia: 'cow',
        mudbrick: 'horse',
      },
      bonus: { wealthIncome: 0.25, skill: 5 },
      desc: { ko: '밭갈이와 짐 운반을 도맡는 가문의 귀한 자산입니다 (품삯 +25%, 손재주 +5).', en: 'Plows fields and hauls heavy loads (+25% wage, Skill +5).' },
    },
  ],
  transport: [
    {
      tier: 1,
      id: 'woodpile',
      name: { ko: '땔나무와 곡식 가마니', en: 'Woodpile & Grain Sacks' },
      cost: 8,
      propByKit: {
        eastasia: 'woodpile_ea',
        england: 'woodpile',
        southasia: 'woodpile',
        mudbrick: 'woodpile',
      },
      bonus: { health: 3 },
      desc: { ko: '겨울 추위를 이겨낼 땔감과 식량을 넉넉히 비축합니다 (건강 +3).', en: 'Firewood and stored grain for winter (Health +3).' },
    },
    {
      tier: 2,
      id: 'cart',
      name: { ko: '튼튼한 손수레', en: 'Sturdy Handcart' },
      cost: 30,
      propByKit: {
        eastasia: 'cart_ea',
        england: 'cart',
        southasia: 'cart',
        mudbrick: 'cart',
      },
      bonus: { skill: 4, wealthIncome: 0.1 },
      desc: { ko: '곡식과 짐을 싣고 장터를 수월하게 오갑니다 (손재주 +4, 품삯 +10%).', en: 'Haul goods easily to and from the market (Skill +4, +10% wage).' },
    },
    {
      tier: 3,
      id: 'wagon',
      name: { ko: '지붕 달린 대형 달구지', en: 'Covered Wagon' },
      cost: 75,
      propByKit: {
        eastasia: 'cart_ea',
        england: 'cart',
        southasia: 'cart',
        mudbrick: 'cart',
      },
      bonus: { wealthIncome: 0.3, charm: 5 },
      desc: { ko: '먼 고을로 교역을 떠나는 부상의 위세 있는 운송 수단입니다 (품삯 +30%, 친화 +5).', en: 'Long-distance trade wagon of a wealthy merchant (+30% wage, Charm +5).' },
    },
  ],
  household: [
    {
      tier: 1,
      id: 'jars',
      name: { ko: '곡물 옹기와 항아리', en: 'Grain Jars & Barrels' },
      cost: 12,
      propByKit: {
        eastasia: 'jars_ea',
        england: 'barrel',
        southasia: 'sacks',
        mudbrick: 'barrel',
      },
      bonus: { health: 2, happy: 2 },
      desc: { ko: '발효 음식과 맑은 물을 갈무리하여 살림을 정돈합니다.', en: 'Clean storage for food and fresh water.' },
    },
    {
      tier: 2,
      id: 'jangdok',
      name: { ko: '정갈한 장독대 군락', en: 'Jangdokdae Jars Cluster' },
      cost: 35,
      propByKit: {
        eastasia: 'jangdok',
        england: 'sacks',
        southasia: 'sacks',
        mudbrick: 'sacks',
      },
      bonus: { family: 5, health: 5 },
      desc: { ko: '가양주와 장을 담그며 집안의 식단을 든든히 지킵니다 (가족 +5, 건강 +5).', en: 'Fermented condiments and rice wine (Family +5, Health +5).' },
    },
    {
      tier: 3,
      id: 'bench',
      name: { ko: '처마 밑 넓은 나무 평상', en: 'Spacious Porch Bench' },
      cost: 70,
      propByKit: {
        eastasia: 'bench_ea',
        england: 'bench',
        southasia: 'bench',
        mudbrick: 'bench',
      },
      bonus: { family: 8, charm: 6 },
      desc: { ko: '이웃과 친척들이 둘러앉아 담소를 나누는 사랑방 쉼터입니다 (가족 +8, 친화 +6).', en: 'Gathering place for neighbors and family (Family +8, Charm +6).' },
    },
  ],
  prestige: [
    {
      tier: 1,
      id: 'vegetable_bed',
      name: { ko: '마당 텃밭 채소상자', en: 'Kitchen Garden Bed' },
      cost: 15,
      propByKit: {
        eastasia: 'veg_bed_ea',
        england: 'vegetable_bed',
        southasia: 'vegetable_bed',
        mudbrick: 'vegetable_bed',
      },
      bonus: { health: 4 },
      desc: { ko: '사철 신선한 나물과 채소를 손수 가꿉니다 (건강 +4).', en: 'Fresh homegrown vegetables and herbs (Health +4).' },
    },
    {
      tier: 2,
      id: 'flower_patch',
      name: { ko: '조경석과 볏짚가리', en: 'Garden Flowers & Stones' },
      cost: 45,
      propByKit: {
        eastasia: 'straw_stack',
        england: 'flower_patch',
        southasia: 'flower_patch',
        mudbrick: 'flower_patch',
      },
      bonus: { happy: 6, charm: 4 },
      desc: { ko: '사계절 풍요로운 마당 풍경과 운치를 만듭니다 (행복 +6, 친화 +4).', en: 'Seasonal beauty creating an elegant yard (Happy +6, Charm +4).' },
    },
    {
      tier: 3,
      id: 'shrine',
      name: { ko: '가문 신표 돌담과 석물', en: 'Family Shrine & Stele' },
      cost: 100,
      propByKit: {
        eastasia: 'stones_ea',
        england: 'stone_wall',
        southasia: 'stone_wall',
        mudbrick: 'stone_wall',
      },
      bonus: { prestige: 15, happy: 8 },
      desc: { ko: '가문의 번창과 선조의 음덕을 기리는 석물입니다 (가문 명망 +15).', en: 'Ancestral stones honoring generations (Family Prestige +15).' },
    },
  ],
};

export function canBuyEstate(life, slot, targetTier) {
  if (!life || !life.stats) return false;
  const currentTier = (life.estate && life.estate[slot]) || 0;
  const nextTier = targetTier ?? (currentTier + 1);
  if (nextTier !== currentTier + 1) return false;
  const item = ESTATE_CATALOG[slot]?.find((x) => x.tier === nextTier);
  if (!item) return false;
  return (life.stats.wealth || 0) >= item.cost;
}

export function buyEstate(life, slot, targetTier) {
  const currentTier = (life.estate && life.estate[slot]) || 0;
  const nextTier = targetTier ?? (currentTier + 1);
  if (!canBuyEstate(life, slot, nextTier)) return null;
  const item = ESTATE_CATALOG[slot].find((x) => x.tier === nextTier);
  life.estate = life.estate || { livestock: 0, transport: 0, household: 0, prestige: 0 };
  life.estate[slot] = nextTier;
  life.stats.wealth -= item.cost;

  // 보너스 효과 적용
  if (item.bonus.happy) life.stats.happy = Math.min(100, (life.stats.happy || 50) + item.bonus.happy);
  if (item.bonus.health) life.stats.health = Math.min(100, (life.stats.health || 50) + item.bonus.health);
  if (item.bonus.family) life.stats.family = Math.min(100, (life.stats.family || 50) + item.bonus.family);
  if (item.bonus.skill && life.attrs) life.attrs.skill = Math.min(100, (life.attrs.skill || 50) + item.bonus.skill);
  if (item.bonus.charm && life.attrs) life.attrs.charm = Math.min(100, (life.attrs.charm || 50) + item.bonus.charm);
  if (item.bonus.prestige && life.dynasty) life.dynasty.prestige = (life.dynasty.prestige || 0) + item.bonus.prestige;

  return { ok: true, slot, tier: nextTier, cost: item.cost, ...item };
}

export function getEstatePropName(slot, tier, kit = 'eastasia') {
  if (!tier || tier <= 0) return null;
  const item = ESTATE_CATALOG[slot]?.find((x) => x.tier === tier);
  if (!item) return null;
  const byKit = item.propByKit || {};
  return byKit[kit] || byKit.eastasia || byKit.england || null;
}

export function getInspectMessage(slot, tier, lang = 'ko') {
  const msgs = {
    livestock: {
      1: { ko: '🐔 닭과 오리들이 모이를 쪼며 정겹게 울어댑니다. (행복 +1)', en: '🐔 The chickens and ducks peck happily in the yard. (Happy +1)' },
      2: { ko: '🐷 돼지우리에서 건강한 가축들이 평화롭게 숨을 쉽니다. (행복 +1)', en: '🐷 The healthy livestock in the pen rest peacefully. (Happy +1)' },
      3: { ko: '🐂 우직한 누렁소의 따뜻한 등을 다정하게 어루만졌습니다. (행복 +1)', en: '🐂 You pat the gentle ox affectionately on its warm back. (Happy +1)' },
    },
    transport: {
      1: { ko: '🪵 가지런히 쌓인 장작더미에서 은은한 소나무 향이 납니다. (건강 +1)', en: '🪵 Fresh pine aroma rises from the neatly stacked firewood. (Health +1)' },
      2: { ko: '🛒 튼튼한 손수레바퀴를 굴리며 장터에 나설 채비를 점검합니다. (손재주 +1)', en: '🛒 You test the sturdy cart wheels, prepared for the market. (Skill +1)' },
      3: { ko: '🐎 위세 있는 대형 달구지를 어루만지며 먼 교역길을 가늠합니다. (친화 +1)', en: '🐎 Touching the covered wagon, you envision the grand trade route. (Charm +1)' },
    },
    household: {
      1: { ko: '🏺 서늘한 옹기 항아리에 맑은 샘물이 가득 차 있습니다. (건강 +1)', en: '🏺 Cool spring water fills the earthenware storage jars. (Health +1)' },
      2: { ko: '🍶 장독대 뚜껑을 열자 깊게 익은 그윽한 된장 향이 차오릅니다. (가족 +1)', en: '🍶 Lifting the jar lid, rich fermented aromas greet you warmly. (Family +1)' },
      3: { ko: '🪑 처마 밑 평상에 걸터앉아 부드러운 바람을 맞으며 숨을 고릅니다. (행복 +1)', en: '🪑 Sitting on the porch bench, you savor the soothing breeze. (Happy +1)' },
    },
    prestige: {
      1: { ko: '🥬 텃밭 나물 잎사귀에 맺힌 맑은 아침 이슬을 텁니다. (건강 +1)', en: '🥬 You brush fresh morning dew off the kitchen garden greens. (Health +1)' },
      2: { ko: '🌸 조경석 곁에 피어난 소담스러운 꽃잎을 감상합니다. (행복 +1)', en: '🌸 You admire the elegant garden blossoms blooming by the stones. (Happy +1)' },
      3: { ko: '🪨 선대의 음덕이 서린 가문 빗돌을 경건하게 어루만집니다. (명망 +1)', en: '🪨 Reverently touching the ancestral stele, you honor your lineage. (Prestige +1)' },
    },
  };
  const m = msgs[slot]?.[tier] || msgs[slot]?.[1];
  return (m && m[lang]) || (m && m.ko) || '✨ 마당의 살림을 정성스레 보살폈습니다.';
}
