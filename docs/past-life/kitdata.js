// 건물 세트(kits/england.glb, tools/blender/kit_england.py)·소품 세트(kits/props_england.glb, tools/blender/kit_props.py) 자료: three 없이 읽히는 작은 모듈.
// 남아시아 세트(kits/southasia.glb·props_southasia.glb·trees_southasia.glb, people/villagers_southasia.glb)는 파일 아래쪽 (작업 2-1).
// KIT_DIMS = 조각 바닥 크기 [x 길이(용마루), z 깊이(앞뒤)] m — 처마·굴뚝 포함, 활짝 연 문짝 제외.
//   Blender 가 함께 내보내는 kits/england.dims.json 과 0.15 m 안에서 같아야 한다 (test/kit.test.mjs).
//   세트를 다시 만들어 크기가 바뀌면 여기를 그 값으로 고친다.
export const KIT_DIMS = {
  cottage_a: [7.97, 5.55], cottage_b: [10.44, 5.79], cottage_c: [7.0, 5.41], house_jetty: [7.97, 6.28], longhouse: [15.04, 6.63],
  barn: [14.1, 8.3], smithy: [7.01, 6.97], church: [30.7, 12.6], mill: [9.15, 8.7], well: [2.96, 2.96], market_stall: [3.4, 2.41],
  manor: [16.16, 9.53],
};
// 프로토타입 집 종류 → 고를 수 있는 조각 (시드로 섞은 뒤 앞에서부터, 길·강에 걸리면 다음 것)
export const KIT_POOL = {
  timber: ['cottage_a', 'house_jetty', 'cottage_c', 'cottage_a', 'house_jetty', 'cottage_c', 'cottage_a'],
  plaster: ['cottage_a', 'cottage_c', 'house_jetty', 'cottage_c', 'cottage_a', 'house_jetty'],
  stone: ['cottage_b', 'longhouse', 'cottage_b', 'longhouse'],
  barn: ['barn'],
};
// PROP_DIMS = 소품·가축 조각 크기 [x 길이, z 깊이, 높이] m (마을 꾸미기 규칙이 자리 다툼에 쓴다).
//   kits/props_england.dims.json 과 0.15 m 안에서 같아야 한다 (test/kit.test.mjs). 울타리·담은 X 로 이어 붙는 조각이다.
export const PROP_DIMS = {
  cart: [3.84, 1.89, 1.52], barrel: [0.67, 0.66, 0.86], crate: [0.74, 0.52, 0.54], woodpile: [3.18, 0.98, 1.09], haystack: [3.96, 3.96, 4.75],
  sacks: [1.14, 1.04, 0.68], wattle_fence: [1.96, 0.1, 1.12], stone_wall: [2.0, 0.74, 1.06], rail_fence: [2.65, 0.18, 1.22], trough: [1.95, 0.68, 0.64],
  anvil: [0.72, 0.61, 0.85], tool_rack: [1.84, 0.59, 1.86], market_goods: [2.56, 1.92, 1.1], cloth_awning: [3.76, 3.29, 2.7], bench: [1.6, 0.37, 0.45],
  flower_patch: [1.35, 1.12, 1.27], vegetable_bed: [3.06, 1.27, 1.5], sheep: [1.4, 0.59, 0.86], cow: [2.07, 0.62, 1.3], horse: [2.21, 0.51, 1.93],
  chicken: [0.39, 0.19, 0.42], duck: [0.45, 0.22, 0.26],
};

// ───────────────────────── 남아시아 세트 (작업 2-1) ─────────────────────────
// 넓은잎 나무: ez-tree 1.1.0(MIT) 프리셋 + 고친 값 (realscene PRESETS.trees 와 같은 꼴: sp·preset·seed·h(키 m)·opt·tint·barkTint).
//   잎 모양: 둥근·끝 뾰족(aspen) = 반얀·보리수, 넓적(oak) = 망고, 깃꼴(ash) = 님·아카시아(바불). roots = 밑에 함께 놓는 trees_southasia.glb 조각.
//   미리보기: docs/past-life/tools/trees_preview.html → kits/preview/southasia_eztrees.png
export const TREES_SA = [
  { sp: 'banyan', preset: 'Oak Large', seed: 101, h: 14, tint: 0x5f8238, barkTint: [0.7, 0.68, 0.64], roots: 'banyan_roots',
    opt: { branch: { angle: { 1: 76, 2: 52, 3: 40 }, children: { 0: 9, 1: 4, 2: 3 }, length: { 0: 30, 1: 38, 2: 18, 3: 8 }, radius: { 0: 4.4 }, force: { strength: -0.06 }, start: { 1: 0.3 } },
      leaves: { type: 'aspen', count: 12, size: 4.3, angle: 30 } } },
  { sp: 'peepal', preset: 'Oak Large', seed: 131, h: 16, tint: 0x5f9a3a, barkTint: [0.78, 0.76, 0.72],
    opt: { branch: { angle: { 1: 50, 2: 45 }, children: { 0: 9, 1: 5, 2: 3 }, force: { strength: -0.01 } }, leaves: { type: 'aspen', count: 14, size: 3.3 } } },
  { sp: 'mango', preset: 'Oak Medium', seed: 151, h: 11, tint: 0x4a6a2a, barkTint: [0.52, 0.48, 0.44],
    opt: { branch: { angle: { 1: 48, 2: 42 }, children: { 0: 11, 1: 5, 2: 4 } }, leaves: { type: 'oak', count: 26, size: 3.1 } } },
  { sp: 'neem', preset: 'Ash Medium', seed: 171, h: 12, tint: 0x86a64c, barkTint: [0.6, 0.55, 0.5],
    opt: { branch: { children: { 0: 10, 1: 5, 2: 3 }, angle: { 1: 46 } }, leaves: { type: 'ash', count: 22, size: 3.0 } } },
  { sp: 'babul', preset: 'Ash Small', seed: 191, h: 7, tint: 0x8a965a, barkTint: [0.45, 0.4, 0.36],
    opt: { branch: { angle: { 1: 66, 2: 55 }, force: { strength: -0.05 }, gnarliness: { 1: 0.3, 2: 0.3 } }, leaves: { type: 'ash', count: 12, size: 2.0 } } },
];
// 덤불 (계절풍 = 짙은 초록, 마른 땅 = 올리브 회색은 장면이 땅 모습 leaf 배수로 곱한다)
export const BUSHES_SA = [
  { preset: 'Bush 1', seed: 21, h: 2.2, bush: true, tint: 0x5f7f3a }, { preset: 'Bush 2', seed: 25, h: 2.8, bush: true, tint: 0x6b8a40 },
  { preset: 'Bush 3', seed: 29, h: 1.5, bush: true, tint: 0x8a8f55 },
];
// 건물 세트 kits/southasia.glb (tools/blender/kit_southasia.py): 바닥 크기 [x 길이, z 깊이] m — kits/southasia.dims.json 과 0.15 m 안 (test/kit.test.mjs).
//   well_step(가트)은 뒤 단이 땅 높이 0, 계단이 앞(+z)으로 2 m 내려간다 → 물가(강·못 가장자리)에 앞을 물 쪽으로 놓는다.
//   shrine_tree 는 'shrine_tree_trunk' 빈 노드 자리에 반얀·보리수(TREES_SA)를 세운다. haveli(큰 집) 이름은 작업 4 몫으로 비워 둔다.
//   smithy_sa(대장간)는 잉글랜드 smithy 와 같은 자리 약속 (모루 로컬 (0.55, 0.6), smithy_forge 빈 노드) — 사람 계획이 그대로 쓴다.
export const KIT_DIMS_SA = {
  hut_mud_a: [6.27, 5.97], hut_mud_b: [6.65, 6.87], house_courtyard: [12.71, 12.02], house_town: [6.51, 9.28], temple_small: [6.3, 9.9],
  shrine_tree: [5.34, 5.72], well_step: [6.14, 6.52], well_kuan: [4.49, 4.48], granary: [3.94, 4.0], market_stall_sa: [3.5, 2.72], smithy_sa: [7.22, 6.89],
  haveli: [16.9, 14.55],
};
// 고르기 주머니 (마을 서민 집 · 큰 집 마당 · 거리)
export const KIT_POOL_SA = {
  mud: ['hut_mud_a', 'hut_mud_b', 'hut_mud_a', 'hut_mud_a', 'hut_mud_b'],
  courtyard: ['house_courtyard'],
  town: ['house_town'],
  store: ['granary'],
};
// 소품·가축 kits/props_southasia.glb (tools/blender/kit_props_southasia.py): [x 길이, z 깊이, 높이] m — kits/props_southasia.dims.json 과 0.15 m 안.
export const PROP_DIMS_SA = {
  cart_bullock: [4.42, 1.9, 1.75], water_pot: [0.81, 0.63, 0.78], lota: [0.15, 0.15, 0.17], charpai: [1.95, 0.97, 0.68], haystack_sa: [3.19, 3.16, 3.85],
  sacks_sa: [1.15, 1.03, 0.68], basket_sa: [1.6, 0.7, 0.52], dung_cakes: [1.35, 1.34, 1.11], chulha: [1.09, 0.53, 0.53], loom: [2.48, 1.55, 1.57],
  wall_mud: [2.0, 0.54, 1.22], fence_bamboo: [2.02, 0.08, 1.23], trough_sa: [1.7, 0.76, 0.4],
  cow_zebu: [2.12, 0.56, 1.47], buffalo: [2.27, 0.85, 1.43], goat: [1.0, 0.31, 0.97], chicken: [0.42, 0.19, 0.42],
};
// 식생 kits/trees_southasia.glb (tools/blender/kit_trees_southasia.py): [x, z, 높이] m — kits/trees_southasia.dims.json 과 0.15 m 안.
//   banyan_roots 는 TREES_SA banyan(키 14 m)의 밑에 같은 자리·같은 돌림으로 놓는다 (뿌리 반지름 ~8 m).
export const TREE_DIMS_SA = {
  palm_coconut: [7.0, 7.0, 11.28], palm_areca: [3.98, 4.3, 12.47], palm_date: [6.25, 5.42, 8.18], banana: [3.82, 3.43, 3.29],
  bamboo_clump: [5.35, 5.96, 9.63], banyan_roots: [15.37, 15.56, 7.53], grass_tall: [1.54, 1.99, 2.35], grass_dry: [1.1, 1.02, 0.56],
};
// 잉글랜드 꾸미기 규칙(villageplan.js)의 소품·나무 이름 → 남아시아 짝 (작업 2-1 단계 3 의 RECIPES.southasia 가 쓴다). null = 남아시아에서는 놓지 않는다.
export const PROP_SWAP_SA = {
  cart: 'cart_bullock', barrel: 'water_pot', crate: 'basket_sa', woodpile: 'dung_cakes', haystack: 'haystack_sa', sacks: 'sacks_sa',
  wattle_fence: 'fence_bamboo', stone_wall: 'wall_mud', rail_fence: 'fence_bamboo', trough: 'trough_sa', anvil: null, tool_rack: null,
  market_goods: 'basket_sa', cloth_awning: null, bench: 'charpai', flower_patch: null, vegetable_bed: null,
  sheep: 'goat', cow: 'cow_zebu', horse: 'buffalo', chicken: 'chicken', duck: null,
};
export const TREE_SWAP_SA = { oak: 'mango', ash: 'neem', willow: 'coconut', birch: 'peepal', hawthorn: 'babul', apple: 'banana' };
// glb 나무 종 (trees_southasia.glb 조각 → 장면의 나무 종 이름). 넓은잎 나무와 같은 틀(가까이 InstancedMesh, 멀리 빌보드)로 그린다
export const TREE_GLB_SA = [
  { sp: 'coconut', glb: 'palm_coconut' }, { sp: 'areca', glb: 'palm_areca' }, { sp: 'date', glb: 'palm_date' }, { sp: 'bamboo', glb: 'bamboo_clump' }, { sp: 'banana', glb: 'banana' },
];
// 땅 모습마다 남아시아 나무 종 무게 (잉글랜드 LAND_LOOK.mix 대신): 숲·공유지·두렁 나무를 고를 때
export const TREE_MIX_SA = {
  monsoon: { mango: 2, neem: 1.2, coconut: 1.2, areca: 0.5, bamboo: 0.4, peepal: 0.4, banyan: 0.25 },
  dry: { babul: 2.5, neem: 1.5, date: 1.2, mango: 0.4, peepal: 0.3 },
  tropical: { coconut: 2, mango: 1.5, areca: 1, banana: 0.6, neem: 0.5, banyan: 0.3 },
};
// 세트 묶음 (장면이 kit 이름으로 고른다): glb 이름 + 크기 표
export const KIT_SETS = {
  england: { kit: 'england', props: 'props_england', people: 'villagers', dims: KIT_DIMS, pool: KIT_POOL, propDims: PROP_DIMS },
  southasia: { kit: 'southasia', props: 'props_southasia', trees: 'trees_southasia', people: 'villagers_southasia', dims: KIT_DIMS_SA, pool: KIT_POOL_SA,
    propDims: PROP_DIMS_SA, treeDims: TREE_DIMS_SA, ezTrees: TREES_SA, bushes: BUSHES_SA, propSwap: PROP_SWAP_SA, treeSwap: TREE_SWAP_SA,
    treeGlb: TREE_GLB_SA, treeMix: TREE_MIX_SA,
    // 갈래 (수정 1차): 남아시아 세트로 그리는 동남아 땅(villageplan.js SA_FLAVOR_OF)은 사람 옷·물감만 다르다 (사롱·머리 수건, 터번·사리 없음)
    flavors: { seasia: { people: 'villagers_seasia', palette: 'seasia' } } },
};

// ───────────────────────── 동아시아 세트 (작업 2-2) ─────────────────────────
// 건물: 땅 갈래마다 glb 하나 (같은 조각 이름) — kits/eastasia.glb(중국) · eastasia_korea.glb · eastasia_japan.glb (tools/blender/kit_eastasia.py KIT_VARIANT).
//   크기 [x 길이, z 깊이] m — 각 dims.json 과 0.15 m 안 (test/kit.test.mjs). shrine_ea 는 원점(가운데)에 장면이 마을 나무를 세운다 (shrine_ea_trunk).
//   smithy_ea·camp_hearth 는 잉글랜드 smithy 와 같은 자리 약속 (모루 로컬 (0.55, 0.6), smithy_forge 빈 노드).
export const KIT_DIMS_EA = {
  house_thatch_ea: [8.18, 5.69], house_tile_ea: [10.6, 8.39], house_town_ea: [8.75, 7.82], temple_ea: [13.8, 13.45], pagoda_small: [5.2, 5.8], gate_ea: [4.45, 2.6],
  well_ea: [3, 3], granary_ea: [3.54, 3.73], smithy_ea: [7.21, 7.03], shrine_ea: [3.2, 5], stall_ea: [3.7, 2.81], pit_house_ea: [6.04, 6.5], camp_hearth: [5.4, 3.6],
  courtyard_estate: [16.12, 14.05],
};
export const KIT_DIMS_EA_KR = {
  house_thatch_ea: [8.86, 6.61], house_tile_ea: [12.88, 9.52], house_town_ea: [11.24, 7.64], temple_ea: [13.92, 13.66], pagoda_small: [3.16, 3.16], gate_ea: [4.52, 3.1],
  well_ea: [3, 3], granary_ea: [4.39, 3.96], smithy_ea: [7.21, 7.03], shrine_ea: [5.58, 3.86], stall_ea: [3.7, 2.81], pit_house_ea: [6.04, 6.5], camp_hearth: [5.4, 3.6],
  courtyard_estate: [17.73, 14.66],
};
export const KIT_DIMS_EA_JP = {
  house_thatch_ea: [10.5, 7.7], house_tile_ea: [12.1, 8.2], house_town_ea: [7.76, 8.9], temple_ea: [13.7, 12.88], pagoda_small: [7.2, 7.2], gate_ea: [4.16, 2.5],
  well_ea: [3, 3], granary_ea: [4.51, 4.25], smithy_ea: [7.26, 7.2], shrine_ea: [3.2, 5.34], stall_ea: [3.7, 2.81], pit_house_ea: [6.04, 6.5], camp_hearth: [5.4, 3.6],
  courtyard_estate: [17.1, 14.25],
};
// 고르기 주머니: 초가(서민) · 기와집 · 가게 딸린 집 · 움집(신석기~고대·농사 전) · 곳간 — 몫은 villageplan.js HOUSE_MIX.eastasia (땅·해마다)
export const KIT_POOL_EA = {
  thatch: ['house_thatch_ea'], tile: ['house_tile_ea'], town: ['house_town_ea'], pit: ['pit_house_ea'], store: ['granary_ea'],
};
// 소품·가축 kits/props_eastasia.glb (tools/blender/kit_props_eastasia.py, 세 땅이 함께 쓴다): [x 길이, z 깊이, 높이] m
export const PROP_DIMS_EA = {
  cart_ea: [4.05, 1.81, 1.51], jangdok: [2.4, 1.46, 0.87], jars_ea: [1.53, 1.2, 0.84], taru_ea: [1.27, 0.68, 1], rice_rack: [4.91, 0.57, 1.85],
  straw_stack: [2.25, 2.32, 2.82], bales_ea: [1.79, 0.71, 0.87], basket_ea: [1.72, 0.71, 0.5], mortar_ea: [1.41, 0.69, 1.25], woodpile_ea: [2.94, 0.64, 1.21],
  bench_ea: [1.8, 1.2, 0.42], veg_bed_ea: [3.15, 1.45, 0.55], trough_ea: [1.7, 0.6, 0.56], stones_ea: [10.67, 1.1, 0.32], wall_stone_ea: [2, 0.7, 1.43],
  wall_earth_ea: [2, 0.84, 1.8], fence_ea: [2, 0.08, 1.35], ox_ea: [2.11, 0.59, 1.4], buffalo_ea: [2.26, 0.85, 1.43], pig: [1.08, 0.44, 0.6],
  chicken: [0.42, 0.19, 0.42], duck_ea: [0.58, 0.22, 0.3],
};
// 식생 kits/trees_eastasia.glb (tools/blender/kit_trees_eastasia.py): [x, z, 높이] m — 대숲·작은 대 포기 = 나무 틀(가까이 InstancedMesh, 멀리 빌보드), 억새·갈대 = 덤불 틀
export const TREE_DIMS_EA = { bamboo_grove: [6.2, 6, 10.39], bamboo_small: [3.53, 3.51, 5.48], grass_silver: [1.62, 1.67, 1.95], reed_ea: [1.53, 1.44, 2.31] };
// 넓은잎·바늘잎 나무: ez-tree 1.1.0(MIT) 프리셋 + 고친 값. leafTex = 잎 그림을 바꿔 끼운다 (assets/real/tex, docs/past-life/tools/make_leaf_tex.py 가 그린 CC0)
//   소나무: 붉은 껍질·바늘잎, 굽은 줄기와 위로 퍼진 우산꼴 가지 · 느티나무: 마을 큰 나무, 넓게 퍼진 수관 · 버드나무: 개울가 늘어진 가지
//   감나무: 짙은 잎 + 주황 감 (잎 그림에 그려 넣음) · 단풍나무: 일본·한국 산기슭 (붉은 잎 빛)
export const TREES_EA = [
  { sp: 'pine', preset: 'Oak Medium', seed: 211, h: 13, tint: 0x56743a, barkTint: [0.78, 0.5, 0.36],
    opt: { bark: { type: 'pine' }, branch: { angle: { 1: 64, 2: 48, 3: 40 }, children: { 0: 7, 1: 4, 2: 3 }, gnarliness: { 0: 0.12, 1: 0.3, 2: 0.25 }, length: { 0: 26, 1: 16, 2: 9, 3: 5 },
      force: { strength: 0.02 }, start: { 1: 0.5 } }, leaves: { type: 'pine', count: 26, size: 2.6, angle: 20, start: 0.1 } } },
  { sp: 'zelkova', preset: 'Oak Large', seed: 223, h: 15, tint: 0x5e7e36, barkTint: [0.62, 0.6, 0.56],
    opt: { branch: { angle: { 1: 58, 2: 46, 3: 40 }, children: { 0: 10, 1: 4, 2: 3 }, length: { 0: 28, 1: 30, 2: 16, 3: 8 }, start: { 1: 0.35 } },
      leaves: { type: 'ash', count: 16, size: 3.0 } } },
  { sp: 'willow', preset: 'Ash Medium', seed: 53, h: 10, droop: 2.2, tint: 0xa6bc7a, barkTint: [0.66, 0.64, 0.58],
    opt: { bark: { type: 'willow' }, branch: { angle: { 1: 30, 2: 40, 3: 40 }, children: { 0: 9, 1: 4, 2: 3 }, length: { 0: 30, 1: 24, 2: 10, 3: 5 } }, leaves: { type: 'ash', count: 22, size: 2.4, angle: 25 } } },
  { sp: 'persimmon', preset: 'Oak Small', seed: 241, h: 7, tint: 0xdfe7c8, barkTint: [0.42, 0.38, 0.34], leafTex: 'ea_persimmon_leaf.png',
    opt: { branch: { angle: { 1: 56, 2: 48 }, length: { 0: 18, 1: 12, 2: 8, 3: 5 }, children: { 0: 7, 1: 4, 2: 3 }, gnarliness: { 1: 0.2, 2: 0.22 } },
      leaves: { type: 'oak', count: 14, size: 2.6 } } },
  { sp: 'maple', preset: 'Ash Small', seed: 263, h: 8, tint: 0xa8743c, barkTint: [0.5, 0.48, 0.46],
    opt: { branch: { angle: { 1: 55, 2: 45 }, children: { 0: 8, 1: 4, 2: 3 } }, leaves: { type: 'oak', count: 18, size: 2.2 } } },
];
export const BUSHES_EA = [
  { preset: 'Bush 1', seed: 31, h: 2.0, bush: true, tint: 0x6a8a44 }, { preset: 'Bush 2', seed: 35, h: 2.4, bush: true, tint: 0x5f7f3c },
  { preset: 'Bush 3', seed: 39, h: 1.4, bush: true, tint: 0x7c8c50 },
];
export const TREE_GLB_EA = [{ sp: 'bamboo', glb: 'bamboo_grove' }, { sp: 'bamboo_s', glb: 'bamboo_small' }];
// 잉글랜드 꾸미기 규칙의 나무 이름 → 동아시아 짝 (숲·공유지·두렁 나무), 땅 갈래마다 종 무게
export const TREE_SWAP_EA = { oak: 'zelkova', ash: 'pine', willow: 'willow', birch: 'pine', hawthorn: 'persimmon', apple: 'persimmon' };
export const TREE_MIX_EA = {
  china: { pine: 1.2, zelkova: 1, willow: 1.2, persimmon: 0.6, bamboo: 0.8, maple: 0.2 },
  korea: { pine: 2.6, zelkova: 1, persimmon: 0.8, willow: 0.5, maple: 0.4, bamboo: 0.25 },
  japan: { pine: 1.6, maple: 0.9, zelkova: 0.7, bamboo: 1.0, persimmon: 0.6, willow: 0.4 },
};
KIT_SETS.eastasia = {
  kit: 'eastasia', props: 'props_eastasia', trees: 'trees_eastasia', people: 'villagers_china', dims: KIT_DIMS_EA, pool: KIT_POOL_EA, propDims: PROP_DIMS_EA,
  treeDims: TREE_DIMS_EA, treeSwap: TREE_SWAP_EA, treeMix: { monsoon: TREE_MIX_EA.china },
  // 갈래: 한국·일본은 건물 glb·크기 표·사람 옷·물감·나무 무게가 다르다 (villageplan.js EA_FLAVOR_OF)
  flavors: {
    korea: { kit: 'eastasia_korea', dims: KIT_DIMS_EA_KR, people: 'villagers_korea', palette: 'korea', treeMix: TREE_MIX_EA.korea },
    japan: { kit: 'eastasia_japan', dims: KIT_DIMS_EA_JP, people: 'villagers_japan', palette: 'japan', treeMix: TREE_MIX_EA.japan },
  },
};

// ───────────────────────── 흙벽돌 세트 (서아시아·북아프리카·나일·이란) ─────────────────────────
export const KIT_DIMS_MB = {
  house_flat_a: [7.85, 6.1],
  house_flat_b: [8.99, 6.84],
  house_courtyard_mb: [13.3, 12.69],
  tower_wind: [7.6, 6.24],
  mosque_small: [9.45, 9.45],
  shrine_mb: [8.0, 8.0],
  well_mb: [4.7, 4.4],
  market_arcade: [8.0, 5.6],
  granary_mb: [4.8, 4.8],
  smithy_mb: [7.6, 7.44],
  gate_mb: [5.2, 2.7],
  palace_mb: [16.2, 15.14],
};

export const KIT_POOL_MB = {
  mud: ['house_flat_a', 'house_flat_b', 'house_flat_a'],
  courtyard: ['house_courtyard_mb'],
  town: ['tower_wind', 'house_flat_b'],
  store: ['granary_mb'],
};

export const PROP_DIMS_MB = {
  camel: [3.43, 1.04, 2.52],
  donkey_mb: [2.1, 1.11, 1.8],
  goat_mb: [1.37, 0.48, 1.21],
  carpet_mb: [2.56, 1.6, 0.03],
  loom_mb: [1.9, 0.8, 2.1],
  pottery_mb: [1.74, 1.47, 0.95],
  cart_mb: [3.53, 2.45, 1.25],
  tent_bedouin: [5.4, 3.8, 1.9],
  clay_oven: [1.3, 1.3, 0.93],
  wall_mud: [2.1, 0.44, 1.62],
  trough_mb: [1.8, 0.9, 0.52],
};

export const TREE_DIMS_MB = {
  palm_date_tall: [9.37, 7.24, 8.81],
  palm_date_medium: [10.21, 5.47, 6.0],
  olive_tree_mb: [3.7, 3.7, 4.5],
  bush_desert_mb: [1.8, 1.7, 1.3],
  reed_oasis: [1.83, 1.83, 2.1],
};

export const TREE_SWAP_MB = {
  oak: 'olive_tree_mb',
  ash: 'palm_date_tall',
  willow: 'reed_oasis',
  birch: 'palm_date_medium',
  hawthorn: 'bush_desert_mb',
  apple: 'olive_tree_mb',
};

export const TREE_MIX_MB = {
  dry: { palm_date_tall: 2.0, palm_date_medium: 1.5, olive_tree_mb: 1.0, bush_desert_mb: 1.2, reed_oasis: 0.6 },
};

KIT_SETS.mudbrick = {
  kit: 'mudbrick',
  props: 'props_mudbrick',
  trees: 'trees_mudbrick',
  people: 'villagers_mudbrick',
  dims: KIT_DIMS_MB,
  pool: KIT_POOL_MB,
  propDims: PROP_DIMS_MB,
  treeDims: TREE_DIMS_MB,
  treeSwap: TREE_SWAP_MB,
  treeMix: TREE_MIX_MB,
};

