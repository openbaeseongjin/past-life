// 건물·소품 세트 크기 표(kitdata.js KIT_DIMS·PROP_DIMS)가 Blender 가 내보낸 kits/*.dims.json 과 맞는지 (0.15 m 안)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { KIT_DIMS, KIT_POOL, PROP_DIMS } from '../kitdata.js';

test('KIT_DIMS 가 Blender 세트 크기(england.dims.json)와 0.15 m 안에서 같고, 고르기 주머니의 조각이 모두 세트에 있다', () => {
  const json = JSON.parse(fs.readFileSync(new URL('../assets/real/kits/england.dims.json', import.meta.url), 'utf8'));
  const pieces = json.pieces;
  assert.deepEqual(Object.keys(KIT_DIMS).sort(), Object.keys(pieces).sort());
  for (const [name, [x, z]] of Object.entries(KIT_DIMS)) {
    const [bx, bz] = pieces[name];
    assert.ok(Math.abs(x - bx) <= 0.15 && Math.abs(z - bz) <= 0.15, `${name}: KIT_DIMS [${x}, ${z}] ≠ Blender [${bx}, ${bz}]`);
  }
  for (const list of Object.values(KIT_POOL)) for (const p of list) assert.ok(p in pieces, `주머니의 ${p} 가 세트에 없다`);
});

test('PROP_DIMS 가 Blender 소품 세트 크기(props_england.dims.json)와 0.15 m 안에서 같다', () => {
  const json = JSON.parse(fs.readFileSync(new URL('../assets/real/kits/props_england.dims.json', import.meta.url), 'utf8'));
  const pieces = json.pieces;
  assert.deepEqual(Object.keys(PROP_DIMS).sort(), Object.keys(pieces).sort());
  for (const [name, dims] of Object.entries(PROP_DIMS)) {
    dims.forEach((v, i) => assert.ok(Math.abs(v - pieces[name][i]) <= 0.15, `${name}[${i}]: PROP_DIMS ${v} ≠ Blender ${pieces[name][i]}`));
  }
});

// ───────────────────────── 남아시아 세트 (작업 2-1) ─────────────────────────
import { KIT_DIMS_SA, KIT_POOL_SA, PROP_DIMS_SA, TREE_DIMS_SA, TREES_SA, BUSHES_SA, PROP_SWAP_SA, TREE_SWAP_SA, TREE_GLB_SA, TREE_MIX_SA, KIT_SETS, KIT_DIMS_MB, KIT_POOL_MB, PROP_DIMS_MB, TREE_DIMS_MB, TREE_SWAP_MB, TREE_MIX_MB } from '../kitdata.js';

const readJson = (rel) => JSON.parse(fs.readFileSync(new URL(rel, import.meta.url), 'utf8'));
// glb 의 JSON 덩어리 (meshopt 로 눌러도 accessor 개수·노드 이름은 JSON 에 있다)
function glbJson(rel) {
  const b = fs.readFileSync(new URL(rel, import.meta.url));
  assert.equal(b.readUInt32LE(0), 0x46546c67, `${rel}: glb 머리가 아니다`);
  const len = b.readUInt32LE(12);
  assert.equal(b.readUInt32LE(16), 0x4e4f534a, `${rel}: 첫 덩어리가 JSON 이 아니다`);
  return { json: JSON.parse(b.subarray(20, 20 + len).toString('utf8')), bytes: b.length };
}
const triCount = (j) => j.meshes.reduce((s, m) => s + m.primitives.reduce((t, p) => t + (p.indices != null ? j.accessors[p.indices].count : j.accessors[p.attributes.POSITION].count) / 3, 0), 0);
function sameDims(table, rel, n) {
  const pieces = readJson(rel).pieces;
  assert.deepEqual(Object.keys(table).sort(), Object.keys(pieces).sort());
  for (const [name, dims] of Object.entries(table)) {
    assert.equal(dims.length, n, `${name}: 값 ${n} 개`);
    dims.forEach((v, i) => assert.ok(Math.abs(v - pieces[name][i]) <= 0.15, `${name}[${i}]: 표 ${v} ≠ Blender ${pieces[name][i]}`));
  }
  return pieces;
}

test('남아시아 건물 KIT_DIMS_SA 가 southasia.dims.json 과 0.15 m 안에서 같고, 주머니의 조각이 모두 세트에 있다', () => {
  const pieces = sameDims(KIT_DIMS_SA, '../assets/real/kits/southasia.dims.json', 2);
  for (const name of ['hut_mud_a', 'hut_mud_b', 'house_courtyard', 'house_town', 'temple_small', 'shrine_tree', 'well_step', 'granary', 'market_stall_sa']) assert.ok(name in pieces, `${name} 가 없다`);
  for (const list of Object.values(KIT_POOL_SA)) for (const p of list) assert.ok(p in pieces, `주머니의 ${p} 가 세트에 없다`);
});

test('남아시아 소품 PROP_DIMS_SA·식생 TREE_DIMS_SA 가 Blender dims.json 과 0.15 m 안에서 같다', () => {
  const props = sameDims(PROP_DIMS_SA, '../assets/real/kits/props_southasia.dims.json', 3);
  for (const name of ['cart_bullock', 'water_pot', 'lota', 'charpai', 'haystack_sa', 'cow_zebu', 'buffalo', 'goat', 'chicken']) assert.ok(name in props, `${name} 가 없다`);
  const trees = sameDims(TREE_DIMS_SA, '../assets/real/kits/trees_southasia.dims.json', 3);
  for (const name of ['palm_coconut', 'palm_areca', 'banyan_roots']) assert.ok(name in trees, `${name} 가 없다`);
});

test('잉글랜드 → 남아시아 짝 표가 있는 조각·종만 가리키고, ez-tree 나무 프리셋이 바르다', () => {
  for (const [en, sa] of Object.entries(PROP_SWAP_SA)) {
    assert.ok(en in PROP_DIMS, `잉글랜드 소품 ${en} 가 없다`);
    if (sa !== null) assert.ok(sa in PROP_DIMS_SA, `남아시아 소품 ${sa} 가 없다`);
  }
  const PRESETS = ['Ash Small', 'Ash Medium', 'Ash Large', 'Aspen Small', 'Aspen Medium', 'Aspen Large', 'Bush 1', 'Bush 2', 'Bush 3', 'Oak Small', 'Oak Medium', 'Oak Large', 'Pine Small', 'Pine Medium', 'Pine Large'];
  const sps = new Set();
  for (const t of [...TREES_SA, ...BUSHES_SA]) {
    assert.ok(PRESETS.includes(t.preset), `ez-tree 1.1.0 에 없는 프리셋 ${t.preset}`);
    assert.ok(t.h > 0 && t.h < 30 && Number.isInteger(t.seed), `${t.sp || t.preset}: 키·씨앗`);
    if (t.opt?.leaves?.type) assert.ok(['ash', 'aspen', 'oak', 'pine'].includes(t.opt.leaves.type), `${t.sp}: 잎 종류 ${t.opt.leaves.type}`);
    if (t.roots) assert.ok(t.roots in TREE_DIMS_SA, `${t.sp}: 뿌리 조각 ${t.roots} 가 없다`);
    if (t.sp) { assert.ok(!sps.has(t.sp), `종 이름 겹침 ${t.sp}`); sps.add(t.sp); }
  }
  for (const g of TREE_GLB_SA) { assert.ok(g.glb in TREE_DIMS_SA, `glb 나무 ${g.glb} 가 식생 세트에 없다`); assert.ok(!sps.has(g.sp), `종 이름 겹침 ${g.sp}`); sps.add(g.sp); }
  for (const sa of Object.values(TREE_SWAP_SA)) assert.ok(sps.has(sa), `나무 짝 ${sa} 가 남아시아 나무 종에 없다`);
  for (const mix of Object.values(TREE_MIX_SA)) for (const sp of Object.keys(mix)) assert.ok(sps.has(sp), `종 무게의 ${sp} 가 남아시아 나무 종에 없다`);
  assert.equal(KIT_SETS.southasia.dims, KIT_DIMS_SA);
});

test('남아시아 glb 가 크기 예산 안이다 (세트마다 5 MB·삼각형 15만 이하, 노드 이름이 크기 표와 같다)', () => {
  for (const [file, table] of [['southasia', KIT_DIMS_SA], ['props_southasia', PROP_DIMS_SA], ['trees_southasia', TREE_DIMS_SA]]) {
    const { json, bytes } = glbJson(`../assets/real/kits/${file}.glb`);
    assert.ok(bytes <= 5 * 1024 * 1024, `${file}.glb ${(bytes / 1048576).toFixed(2)} MB > 5 MB`);
    const tris = triCount(json);
    assert.ok(tris <= 150000, `${file}.glb 삼각형 ${tris} > 150000`);
    const roots = json.scenes[json.scene ?? 0].nodes.map((i) => json.nodes[i].name).sort();
    assert.deepEqual(roots, Object.keys(table).sort(), `${file}.glb 뿌리 노드`);
  }
});

for (const who of ['villagers_southasia', 'villagers_seasia']) test(`${who}.glb 는 villagers.glb 와 변형·소품 노드, 뼈 이름, LOD 짜임이 같다 (realpeople.js 가 주소만 바꿔 쓴다)`, () => {
  const a = glbJson('../assets/real/people/villagers.glb').json, b = glbJson(`../assets/real/people/${who}.glb`).json;
  const roots = (j) => j.scenes[j.scene ?? 0].nodes.map((i) => j.nodes[i].name).sort();
  assert.deepEqual(roots(b), roots(a));
  const lods = (j) => j.nodes.map((n) => n.name).filter((n) => /_lod[01]$/.test(n)).sort();
  assert.deepEqual(lods(b), lods(a));
  const joints = (j) => j.skins.map((s) => s.joints.map((i) => j.nodes[i].name).join(','));
  assert.deepEqual(joints(b), joints(a));
  assert.deepEqual(b.materials.map((m) => m.name).sort(), a.materials.map((m) => m.name).sort());
  const { bytes } = glbJson(`../assets/real/people/${who}.glb`);
  assert.ok(bytes <= 5 * 1024 * 1024);
  // LOD0 ≈ 8천 (최대 1만 1천), LOD1 ≈ 2천 (최대 2천 6백)
  for (const n of b.nodes.filter((n) => /_lod[01]$/.test(n.name) && n.mesh != null)) {
    const t = triCount({ meshes: [b.meshes[n.mesh]], accessors: b.accessors });
    assert.ok(/_lod0$/.test(n.name) ? t <= 11000 : t <= 2600, `${n.name}: ${t} 삼각형`);
  }
});

// ───────────────────────── 남아시아 마을 요리법·사람 (작업 2-1 단계 B) ─────────────────────────
import { makeEnv, planAll, RECIPES, rng as vrng, obb as vobb, obbHas as vobbHas, SMITHY as VSMITHY } from '../villageplan.js';
import { planPeople, peopleSeed, PALETTES, HAIRS } from '../peopleplan.js';

test('남아시아 마을 (시드 12개): 남아시아 조각만 쓰고, 사원·가트·신당·우물·대장간이 정한 자리에 있으며, 집마다 뒤뜰이 있다', () => {
  const env = makeEnv(), R = RECIPES.southasia;
  assert.deepEqual(R.fixed.map((f) => f.piece).sort(), ['granary', 'house_courtyard', 'shrine_tree', 'smithy_sa', 'temple_small', 'well_kuan', 'well_step'].sort());
  for (let i = 0; i < 12; i++) {
    const seed = i === 0 ? 1329 : (i * 7919 + 13) >>> 0;
    const { layout, dressing } = planAll(seed, env, undefined, PROP_DIMS_SA, 'southasia');
    assert.ok(layout.houses.length >= 30, `시드 ${seed}: 집 ${layout.houses.length}`);
    for (const h of [...layout.houses, ...layout.farms]) assert.ok(h.piece in KIT_DIMS_SA, `시드 ${seed}: 세트에 없는 집 ${h.piece}`);
    for (const h of layout.houses) assert.ok(h.croft, '집마다 뒤뜰');
    for (const it of dressing.items) assert.ok(it.p in PROP_DIMS_SA, `시드 ${seed}: 세트에 없는 소품 ${it.p}`);
    const sps = new Set([...TREES_SA.map((t) => t.sp), ...TREE_GLB_SA.map((t) => t.sp)]);
    for (const t of dressing.trees) assert.ok(sps.has(t.sp), `시드 ${seed}: 나무 종 ${t.sp}`);
    assert.ok(dressing.trees.some((t) => t.sp === 'banyan'), '큰 반얀 (신당)');
    assert.ok(dressing.items.some((it) => it.p === 'cow_zebu') && dressing.items.some((it) => it.p === 'buffalo'), '혹소·물소');
    // 집이 정한 자리 조각과 겹치지 않는다
    for (const f of R.fixed) {
      const [L, D] = KIT_DIMS_SA[f.piece], o = vobb(f.x, f.z, f.rot, L / 2, D / 2);
      for (const h of layout.houses) assert.ok(!vobbHas(o, h.x, h.z, 0.5), `시드 ${seed}: ${h.piece} 가 ${f.piece} 안`);
    }
  }
});

test('남아시아 사람 (시드 12개): 남아시아 물감·검은 머리만, 대장장이는 모루 앞, 16명이면 일·걷기·이야기가 다 있다', () => {
  const env = makeEnv(), P = PALETTES.southasia;
  for (const h of P.hairs) assert.ok(Math.max(...h) < 0.15, '검정·짙은 갈색 머리만');
  for (const h of HAIRS) if (Math.max(...h) > 0.4) assert.ok(!P.hairs.some((q) => q.join() === h.join()), '금발·붉은 머리가 섞이지 않는다');
  for (let i = 0; i < 12; i++) {
    const seed = i === 0 ? 1329 : (i * 7919 + 13) >>> 0;
    const { layout, dressing } = planAll(seed, env, undefined, PROP_DIMS_SA, 'southasia');
    const ppl = planPeople(vrng(peopleSeed(seed)), 16, { layout, dressing, fieldAt: env.fieldAt, propDims: PROP_DIMS_SA, kit: 'southasia' });
    assert.equal(ppl.length, 16);
    for (const p of ppl) {
      if (p.variant !== 'elder') assert.ok(P.hairs.some((q) => q.join() === p.palette.hair.join()), `머리색 ${p.palette.hair}`);
      assert.ok(P.dyes.some((q) => q.join() === p.palette.prim.join()), '주색은 남아시아 물감');
    }
    const smith = ppl.find((p) => p.action === 'hammer');
    assert.ok(smith && smith.variant === 'm_smith' && vobbHas(vobb(VSMITHY.x, VSMITHY.z, VSMITHY.rot, 3.6, 3.5), smith.x, smith.z), '대장장이가 대장간 안 모루 앞');
    const acts = new Set(ppl.map((p) => p.action));
    for (const a of ['walk', 'talk', 'hammer']) assert.ok(acts.has(a), `시드 ${seed}: ${a}`);
  }
});

// ───────────────────────── 동아시아 세트 (작업 2-2) ─────────────────────────
import { KIT_DIMS_EA, KIT_DIMS_EA_KR, KIT_DIMS_EA_JP, KIT_POOL_EA, PROP_DIMS_EA, TREE_DIMS_EA, TREES_EA, BUSHES_EA } from '../kitdata.js';

const EA_KITS = [['eastasia', KIT_DIMS_EA], ['eastasia_korea', KIT_DIMS_EA_KR], ['eastasia_japan', KIT_DIMS_EA_JP]];
test('동아시아 건물 크기 표 셋(중국·한국·일본)이 각 dims.json 과 0.15 m 안에서 같고, 조각 이름이 같으며, 주머니의 조각이 모두 있다', () => {
  for (const [file, table] of EA_KITS) {
    const pieces = sameDims(table, `../assets/real/kits/${file}.dims.json`, 2);
    assert.deepEqual(Object.keys(table).sort(), Object.keys(KIT_DIMS_EA).sort(), `${file}: 조각 이름`);
    for (const name of ['house_thatch_ea', 'house_tile_ea', 'house_town_ea', 'temple_ea', 'pagoda_small', 'gate_ea', 'well_ea', 'granary_ea', 'pit_house_ea', 'camp_hearth']) assert.ok(name in pieces, `${file}: ${name}`);
    for (const list of Object.values(KIT_POOL_EA)) for (const p of list) assert.ok(p in pieces, `주머니의 ${p}`);
  }
  assert.equal(KIT_SETS.eastasia.dims, KIT_DIMS_EA);
  assert.equal(KIT_SETS.eastasia.flavors.korea.dims, KIT_DIMS_EA_KR);
  assert.equal(KIT_SETS.eastasia.flavors.japan.dims, KIT_DIMS_EA_JP);
});

test('동아시아 소품 PROP_DIMS_EA·식생 TREE_DIMS_EA 가 Blender dims.json 과 0.15 m 안에서 같고, ez-tree 프리셋이 바르다', () => {
  const props = sameDims(PROP_DIMS_EA, '../assets/real/kits/props_eastasia.dims.json', 3);
  for (const name of ['cart_ea', 'jangdok', 'rice_rack', 'ox_ea', 'pig', 'chicken', 'duck_ea']) assert.ok(name in props, `${name} 가 없다`);
  const trees = sameDims(TREE_DIMS_EA, '../assets/real/kits/trees_eastasia.dims.json', 3);
  for (const name of ['bamboo_grove', 'bamboo_small']) assert.ok(name in trees, `${name} 가 없다`);
  const PRESETS = ['Ash Small', 'Ash Medium', 'Ash Large', 'Aspen Small', 'Aspen Medium', 'Aspen Large', 'Bush 1', 'Bush 2', 'Bush 3', 'Oak Small', 'Oak Medium', 'Oak Large', 'Pine Small', 'Pine Medium', 'Pine Large'];
  for (const t of [...TREES_EA, ...BUSHES_EA]) {
    assert.ok(PRESETS.includes(t.preset), `ez-tree 1.1.0 에 없는 프리셋 ${t.preset}`);
    if (t.opt?.leaves?.type) assert.ok(['ash', 'aspen', 'oak', 'pine'].includes(t.opt.leaves.type), `${t.sp}: 잎 종류`);
    if (t.leafTex) assert.ok(fs.existsSync(new URL(`../assets/real/tex/${t.leafTex}`, import.meta.url)), `${t.sp}: 잎 그림 ${t.leafTex}`);
  }
});

test('동아시아 glb 가 크기 예산 안이다 (세트마다 5 MB·삼각형 15만 이하, 뿌리 노드 이름이 크기 표와 같다)', () => {
  for (const [file, table] of [...EA_KITS, ['props_eastasia', PROP_DIMS_EA], ['trees_eastasia', TREE_DIMS_EA]]) {
    const { json, bytes } = glbJson(`../assets/real/kits/${file}.glb`);
    assert.ok(bytes <= 5 * 1024 * 1024, `${file}.glb ${(bytes / 1048576).toFixed(2)} MB > 5 MB`);
    const tris = triCount(json);
    assert.ok(tris <= 150000, `${file}.glb 삼각형 ${tris} > 150000`);
    const roots = json.scenes[json.scene ?? 0].nodes.map((i) => json.nodes[i].name).sort();
    assert.deepEqual(roots, Object.keys(table).sort(), `${file}.glb 뿌리 노드`);
  }
});

for (const who of ['villagers_china', 'villagers_korea', 'villagers_japan']) test(`${who}.glb 는 villagers.glb 와 변형·소품 노드, 뼈 이름, LOD 짜임이 같다 (동아시아 갈래)`, () => {
  const a = glbJson('../assets/real/people/villagers.glb').json, { json: b, bytes } = glbJson(`../assets/real/people/${who}.glb`);
  const roots = (j) => j.scenes[j.scene ?? 0].nodes.map((i) => j.nodes[i].name).sort();
  assert.deepEqual(roots(b), roots(a));
  const lods = (j) => j.nodes.map((n) => n.name).filter((n) => /_lod[01]$/.test(n)).sort();
  assert.deepEqual(lods(b), lods(a));
  const joints = (j) => j.skins.map((s) => s.joints.map((i) => j.nodes[i].name).join(','));
  assert.deepEqual(joints(b), joints(a));
  assert.deepEqual(b.materials.map((m) => m.name).sort(), a.materials.map((m) => m.name).sort());
  assert.ok(bytes <= 5 * 1024 * 1024);
  for (const n of b.nodes.filter((n) => /_lod[01]$/.test(n.name) && n.mesh != null)) {
    const t = triCount({ meshes: [b.meshes[n.mesh]], accessors: b.accessors });
    assert.ok(/_lod0$/.test(n.name) ? t <= 11000 : t <= 2600, `${n.name}: ${t} 삼각형`);
  }
});

// ───────────────────────── 흙벽돌 세트 (실사 2단계 작업 3) ─────────────────────────
test('흙벽돌 건물 KIT_DIMS_MB 가 mudbrick.dims.json 과 0.15 m 안에서 같고, 주머니의 조각이 모두 세트에 있다', () => {
  const pieces = sameDims(KIT_DIMS_MB, '../assets/real/kits/mudbrick.dims.json', 2);
  for (const name of ['house_flat_a', 'house_flat_b', 'house_courtyard_mb', 'tower_wind', 'mosque_small', 'shrine_mb', 'well_mb', 'market_arcade', 'granary_mb', 'smithy_mb', 'gate_mb', 'palace_mb']) assert.ok(name in pieces, `${name} 가 없다`);
  for (const list of Object.values(KIT_POOL_MB)) for (const p of list) assert.ok(p in pieces, `주머니의 ${p} 가 세트에 없다`);
});

test('흙벽돌 소품 PROP_DIMS_MB·식생 TREE_DIMS_MB 가 Blender dims.json 과 0.15 m 안에서 같다', () => {
  const props = sameDims(PROP_DIMS_MB, '../assets/real/kits/props_mudbrick.dims.json', 3);
  for (const name of ['camel', 'donkey_mb', 'goat_mb', 'carpet_mb', 'loom_mb', 'pottery_mb', 'cart_mb', 'tent_bedouin', 'clay_oven', 'wall_mud', 'trough_mb']) assert.ok(name in props, `${name} 가 없다`);
  const trees = sameDims(TREE_DIMS_MB, '../assets/real/kits/trees_mudbrick.dims.json', 3);
  for (const name of ['palm_date_tall', 'palm_date_medium', 'olive_tree_mb', 'bush_desert_mb', 'reed_oasis']) assert.ok(name in trees, `${name} 가 없다`);
});

test('흙벽돌 glb 가 크기 예산 안이다 (세트마다 5 MB·삼각형 15만 이하, 노드 이름이 크기 표와 같다)', () => {
  for (const [file, table] of [['mudbrick', KIT_DIMS_MB], ['props_mudbrick', PROP_DIMS_MB], ['trees_mudbrick', TREE_DIMS_MB]]) {
    const { json, bytes } = glbJson(`../assets/real/kits/${file}.glb`);
    assert.ok(bytes <= 5 * 1024 * 1024, `${file}.glb ${(bytes / 1048576).toFixed(2)} MB > 5 MB`);
    const tris = triCount(json);
    assert.ok(tris <= 150000, `${file}.glb 삼각형 ${tris} > 150000`);
    const roots = json.scenes[json.scene ?? 0].nodes.map((i) => json.nodes[i].name).sort();
    assert.deepEqual(roots, Object.keys(table).sort(), `${file}.glb 뿌리 노드`);
  }
});

test('villagers_mudbrick.glb 는 villagers.glb 와 변형·소품 노드, 뼈 이름, LOD 짜임이 같다', () => {
  const a = glbJson('../assets/real/people/villagers.glb').json, { json: b, bytes } = glbJson('../assets/real/people/villagers_mudbrick.glb');
  const roots = (j) => j.scenes[j.scene ?? 0].nodes.map((i) => j.nodes[i].name).sort();
  assert.deepEqual(roots(b), roots(a));
  const lods = (j) => j.nodes.map((n) => n.name).filter((n) => /_lod[01]$/.test(n)).sort();
  assert.deepEqual(lods(b), lods(a));
  const joints = (j) => j.skins.map((s) => s.joints.map((i) => j.nodes[i].name).join(','));
  assert.deepEqual(joints(b), joints(a));
  assert.ok(bytes <= 5 * 1024 * 1024);
});
