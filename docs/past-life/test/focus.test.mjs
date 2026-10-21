// 올해의 패 한 해 효과 (focus.js focusYearEffects): 엔진(life.js endYear)과 화면(ui.js 올해의 패)이 같이 쓰는 식 하나.
// 작업 4 수정 1차에서 두 곳에 있던 식을 하나로 모았다. 예전 식(아래 OLD, 작업 3 수정 1차 그대로)과 값이 같고, 엔진이 실제로 그 값을 더하는지 본다.
import test from 'node:test';
import assert from 'node:assert/strict';
import { FOCI, FOCUS_EFFECT, FOCUS_ATTR, focusStage, attrGain, skillMul, charmMul, focusYearEffects } from '../focus.js';
import { drawBirth } from '../birth.js';
import { createLife, advance, setFocus } from '../life.js';
import { sub } from '../rng.js';

// 옮기기 전의 식 (life.js endYear · ui.js focusEffects 에 따로 있던 것) — 바꾸지 않는다
function OLD(life, f, w) {
  const st = focusStage(life.age), out = {};
  for (const [k, v] of Object.entries(FOCUS_EFFECT[f][st])) {
    const m = v <= 0 ? 1 : k === 'wealth' && f === 'work' ? w.econ.wage * skillMul(life.attrs.skill) : k === 'family' ? charmMul(life.attrs.charm) : 1;
    out[k] = v * m;
  }
  for (const [k, v] of Object.entries(FOCUS_ATTR[f] || {})) out[k] = attrGain(k === 'know' ? v * w.school : v, life.attrs[k]);
  return out;
}

test('focusYearEffects = 예전 식: 생 120개 × 패 다섯 × 나이 6~95 × 능력치 흔들기', () => {
  let n = 0;
  for (let i = 0; i < 120; i++) {
    const life = createLife({ birth: drawBirth('FX-' + i), noDeath: true, quiet: true });
    const r = sub('FX-' + i, 'shake');
    for (let age = 6; age <= 95; age += 1 + r.int(9)) {
      life.age = age; life.year = life.birth.year + age;
      for (const k of ['luck', 'charm', 'know', 'skill']) life.attrs[k] = r.int(101);
      for (const f of FOCI) { assert.deepEqual(focusYearEffects(life, f), OLD(life, f, life.ctx()), `${life.birth.seed} ${age} ${f}`); n++; }
    }
  }
  assert.ok(n > 5000, String(n));
});

test('엔진이 그 값을 더한다: 한 해 넘긴 뒤 변화 = focusYearEffects (되돌림 6% 를 빼고)', () => {
  for (let i = 0; i < 30; i++) {
    for (const f of FOCI) {
      for (const age of [7, 20, 45, 70]) {
        const life = createLife({ birth: drawBirth('FY-' + i), noDeath: true, quiet: true });
        life.age = age; life.year = life.birth.year + age; life.step = 3;
        life.flags.married = true; life.kids = 6;   // 혼인·아이 굴림이 곁을 건드리지 않게
        const s = life.stats; s.health = 50; s.family = 50; s.happy = 50; s.wealth = life.base.wealth;
        for (const k of ['charm', 'know', 'skill']) life.attrs[k] = 30 + (i * 7 + age) % 50;
        setFocus(life, f);
        const before = { ...s }, attrs = { ...life.attrs }, fx = focusYearEffects(life, f);
        advance(life, [], { lines: [], yearly: true });
        for (const k of ['health', 'wealth', 'family', 'happy']) {
          if (Math.abs(before[k] + (fx[k] || 0) - 50) > 49) continue;   // 0~100 자르기에 걸리면 건너뛴다
          assert.ok(Math.abs((s[k] - before[k]) / 0.94 - (fx[k] || 0)) < 1e-9, `${i} ${f} ${age} ${k}: ${s[k] - before[k]} vs ${fx[k]}`);
        }
        for (const k of Object.keys(FOCUS_ATTR[f] || {})) assert.ok(Math.abs(life.attrs[k] - (attrs[k] + fx[k])) < 1e-9, `${i} ${f} ${age} ${k}`);
      }
    }
  }
});
