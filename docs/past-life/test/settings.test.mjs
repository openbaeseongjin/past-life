// 처음 하는 사람을 위한 다듬기: 설정 저장값과 안내·첫 화면 글 (한·영 짝)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makeStore } from '../soul.js';
import { t } from '../i18n.js';
import { phaseOf, PHASE_TIME } from '../phase.js';

const fakeLs = () => { const m = new Map(); return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

test('설정 저장: 빠르기·화질·안내 — 처음 값과 이상한 값은 기본으로', () => {
  const ls = fakeLs(), st = makeStore(ls);
  assert.equal(st.loadSpeed(), 'normal'); assert.equal(st.loadQuality(), 'normal'); assert.equal(st.loadCoach(), false);
  st.saveSpeed('fast'); st.saveQuality('low'); st.saveCoach(true);
  assert.equal(st.loadSpeed(), 'fast'); assert.equal(st.loadQuality(), 'low'); assert.equal(st.loadCoach(), true);
  ls.setItem('pl.speed', JSON.stringify('warp')); ls.setItem('pl.quality', JSON.stringify('ultra')); ls.setItem('pl.coach', 'nonsense');
  assert.equal(st.loadSpeed(), 'normal'); assert.equal(st.loadQuality(), 'normal'); assert.equal(st.loadCoach(), false);
  const none = makeStore(null);
  assert.equal(none.loadSpeed(), 'normal'); assert.equal(none.saveCoach(true), false, '저장소가 없어도 던지지 않는다');
});

test('첫 화면 세 줄과 3단계 안내: 한·영 짝, 빈 글 없음', () => {
  for (const k of ['lead', 'coach']) assert.equal(t('ko', k).length, t('en', k).length, k);
  assert.equal(t('ko', 'lead').length, 3);
  assert.equal(t('ko', 'coach').length, 3);
  for (const lang of ['ko', 'en']) {
    for (const x of t(lang, 'lead')) assert.ok(x.length > 8 && x.length < 90, x);
    for (const c of t(lang, 'coach')) assert.ok(c.t && c.d && c.d.length < 260, c.t);
    for (const k of ['stageLoading', 'setTitle', 'setQuality', 'qHigh', 'qNormal', 'qHint', 'setSpeed', 'setSound', 'setLang', 'setCoach', 'coachAgain', 'coachSkip', 'coachNext', 'coachDone']) assert.ok(t(lang, k), `${lang}.${k}`);
    assert.equal(t(lang, 'coachStep', 2, 3), '2 / 3');
  }
  assert.equal(t('en', 'f_era'), 'Era');
  assert.ok(!/KayKit/.test(t('ko', 'credit')) && !/KayKit/.test(t('en', 'credit')), '출처 줄은 지금 쓰는 3D 자산');
});

test('phase.js: 나이 → 하루의 때 (three 없이)', () => {
  assert.deepEqual([0, 13, 30, 50, 65].map(phaseOf), ['dawn', 'morning', 'noon', 'afternoon', 'dusk']);
  for (const k of ['dawn', 'morning', 'noon', 'afternoon', 'dusk', 'night']) assert.ok(PHASE_TIME[k] > 0);
});
