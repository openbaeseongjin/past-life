// 마을 사람 고르기(peopleplan.js, three 없는 순수 모듈)를 여러 시드로 시험한다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeEnv, planAll, rng, obbHas, SMITHY } from '../villageplan.js';
import fs from 'node:fs';
import { planPeople, peopleSeed, VARIANTS, ACTIONS, PEOPLE_MIN, PEOPLE_MAX, PEOPLE_DEFAULT } from '../peopleplan.js';
import { PROP_DIMS } from '../kitdata.js';

const env = makeEnv();
const SEEDS = [1329, 7, 424242, ...Array.from({ length: 27 }, (_, i) => (i * 104729 + 17) >>> 0)];
const ctxOf = (s) => { const { layout, dressing } = planAll(s, env, undefined, PROP_DIMS); return { layout, dressing, fieldAt: env.fieldAt, propDims: PROP_DIMS }; };
const CTX = new Map(SEEDS.map((s) => [s, ctxOf(s)]));

test('같은 시드면 같은 사람들(변형·동작·자리·경로·물감)이 나오고, 시드가 다르면 달라진다', () => {
  for (const s of [1329, 7]) {
    const a = JSON.stringify(planPeople(rng(peopleSeed(s)), 16, CTX.get(s))), b = JSON.stringify(planPeople(rng(peopleSeed(s)), 16, ctxOf(s)));
    assert.equal(a, b, `시드 ${s}`);
  }
  assert.notEqual(JSON.stringify(planPeople(rng(peopleSeed(1329)), 16, CTX.get(1329))), JSON.stringify(planPeople(rng(peopleSeed(7)), 16, CTX.get(7))));
});

test('사람 수는 10~20 으로 맞추고, 변형·동작은 정해진 이름만 쓴다', () => {
  for (const [count, want] of [[3, PEOPLE_MIN], [10, 10], [16, 16], [20, 20], [40, PEOPLE_MAX], [NaN, PEOPLE_DEFAULT], [undefined, PEOPLE_DEFAULT], [Infinity, PEOPLE_DEFAULT]]) {
    const ps = planPeople(rng(peopleSeed(1329)), count, CTX.get(1329));
    assert.equal(ps.length, want, `count ${count}`);
    for (const p of ps) {
      assert.ok(VARIANTS.includes(p.variant), p.variant);
      assert.ok(ACTIONS.includes(p.action), p.action);
      assert.ok(Number.isFinite(p.x) && Number.isFinite(p.z) && Number.isFinite(p.face));
      for (const c of [p.palette.prim, p.palette.sec, p.palette.hair, p.palette.linen]) assert.ok(c.length === 3 && c.every((v) => v >= 0.05 && v <= 0.75), `물감 ${c}`);   // 새하얀 천·형광색 없음
      assert.ok(p.palette.skin.length === 3 && p.palette.skin.every((v) => v >= 0.85 && v <= 1.11), `살빛 ${p.palette.skin}`);
      assert.ok(p.palette.nat >= 0.9 && p.palette.nat <= 1.08);
    }
  }
});

test('시드 30개: 대장장이가 모루 앞에서 망치질하고, 16명이면 걷기·서기·이야기·망치질·들기·괭이질이 다 있다', () => {
  for (const [s, ctx] of CTX) {
    const ps = planPeople(rng(peopleSeed(s)), 16, ctx);
    const smith = ps.filter((p) => p.action === 'hammer');
    assert.equal(smith.length, 1, `시드 ${s} 망치질`);
    assert.equal(smith[0].variant, 'm_smith');
    assert.ok(Math.hypot(smith[0].x - SMITHY.x, smith[0].z - SMITHY.z) < 3, `시드 ${s} 대장장이 자리`);
    const acts = new Set(ps.map((p) => p.action));
    for (const a of ['walk', 'stand', 'talk', 'hammer', 'carry', 'hoe']) assert.ok(acts.has(a), `시드 ${s}: ${a} 없음 (${[...acts]})`);
    assert.ok(new Set(ps.map((p) => p.variant)).size >= 5, `시드 ${s} 변형 가짓수`);
  }
});

test('시드 30개: 서 있는 사람은 집 안에 서지 않고, 걷는 사람은 3점 넘는 경로를 갖는다', () => {
  for (const [s, ctx] of CTX) {
    const feet = [...ctx.layout.houses, ...ctx.layout.farms].map((h) => h.foot);
    for (const p of planPeople(rng(peopleSeed(s)), 20, ctx)) {
      if (p.path) { assert.ok(p.path.length >= 3, `시드 ${s} 경로`); assert.ok(p.speed > 0.3 && p.speed < 2); continue; }
      if (p.action === 'hammer') continue;
      assert.ok(!feet.some((o) => obbHas(o, p.x, p.z, 0.1)), `시드 ${s}: ${p.variant}/${p.action} 이 집 안 (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`);
    }
  }
});

test('시드 30개 × 20명: 걸상에 앉은 사람(sit)이 넉넉한 몫의 시드에 나오고, 앉은 자리는 걸상 위다', () => {
  let got = 0;
  for (const [s, ctx] of CTX) {
    const ps = planPeople(rng(peopleSeed(s)), 20, ctx), sit = ps.filter((p) => p.action === 'sit');
    if (!sit.length) continue;
    got++;
    for (const p of sit) {
      const b = ctx.dressing.items.filter((it) => it.p === 'bench').sort((a, c) => Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(c.x - p.x, c.z - p.z))[0];
      assert.ok(Math.hypot(b.x - p.x, b.z - p.z) < 0.2, `시드 ${s}: 앉은 자리가 걸상에서 멀다`);
      assert.ok(p.sitOn > 0.3 && p.sitOn < 0.6);
    }
  }
  assert.ok(got >= 12, `sit 이 나온 시드 ${got}/30`);
});

test('villagers.glb 의 변형 노드(v_*)가 peopleplan.js 의 VARIANTS 와 같다', () => {
  const b = fs.readFileSync(new URL('../assets/real/people/villagers.glb', import.meta.url));
  assert.equal(b.readUInt32LE(0), 0x46546c67, 'glTF 머리글');
  const len = b.readUInt32LE(12), json = JSON.parse(b.subarray(20, 20 + len).toString('utf8'));
  const names = json.nodes.map((n) => n.name).filter((n) => /^v_/.test(n)).map((n) => n.slice(2)).sort();
  assert.deepEqual(names, [...VARIANTS].sort());
  for (const v of VARIANTS) for (const lod of ['_lod0', '_lod1']) assert.ok(json.nodes.some((n) => n.name === v + lod), v + lod);
  for (const p of ['prop_hammer', 'prop_hoe', 'prop_staff', 'prop_sack']) assert.ok(json.nodes.some((n) => n.name === p), p);
});
