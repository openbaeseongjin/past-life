// 출생 수 (PRB 2022 표 1) 와 뽑기 (설계 3장)
import test from 'node:test';
import assert from 'node:assert/strict';
import { TOTAL, END, cumBirths, yearAt, drawYear, ERAS, eraOf, groupOf } from '../births.js';
import { createRng } from '../rng.js';
import { fmtYear } from '../i18n.js';

test('전체 출생 수는 PRB 표 합 (약 1,170억)', () => {
  assert.ok(Math.abs(TOTAL - 117020448575) < 10, String(TOTAL));
});

test('기준 해 사이 출생 수가 PRB 행과 같다', () => {
  assert.ok(Math.abs(cumBirths(1) - cumBirths(-8000) - 46025332354) < 1);
  assert.ok(Math.abs(cumBirths(1950) - cumBirths(1900) - 3390198215) < 1);
});

test('yearAt 은 cumBirths 의 역함수', () => {
  for (const t of [-150000, -60000, -9000, -1210, 500, 1347, 1890, 1990, 2015]) assert.ok(Math.abs(yearAt(cumBirths(t)) - t) < 1e-3, String(t));
});

test('2만 번 뽑으면 시대 비율이 PRB 와 ±1.5%p 안', () => {
  const r = createRng('births');
  const n = 20000;
  let anc = 0, mod = 0;
  for (let i = 0; i < n; i++) { const y = drawYear(r); if (y >= -8000 && y < 1) anc++; if (y >= 1950) mod++; }
  assert.ok(Math.abs(anc / n - 0.3933) < 0.015, `기원전 8000~기원후 1: ${anc / n}`);
  assert.ok(Math.abs(mod / n - 0.0779) < 0.015, `1950 이후: ${mod / n}`);
});

test('after 다음 해부터만 뽑고, 남은 사람이 없으면 null', () => {
  const r = createRng('after');
  for (let i = 0; i < 500; i++) assert.ok(drawYear(r, 1347) > 1347);
  assert.equal(drawYear(r, END), null);
});

test('시대 12개와 큰 묶음 6개', () => {
  assert.equal(ERAS.length, 12);
  assert.equal(eraOf(-50000).id, 1);
  assert.equal(eraOf(1347).id, 8);
  assert.equal(eraOf(2010).id, 12);
  assert.equal(groupOf(-9000), 'forager');
  assert.equal(groupOf(1347), 'medieval');
  assert.equal(groupOf(1700), 'early');
  assert.equal(groupOf(1900), 'industrial');
  assert.equal(groupOf(1990), 'modern');
});

test('연도 표기: 0 이하는 기원전 1−y, 1만 년보다 옛날은 100년 단위 「무렵」', () => {
  assert.equal(fmtYear(1347, 'ko'), '1347년');
  assert.equal(fmtYear(1347, 'en'), '1347');
  assert.equal(fmtYear(-1209, 'ko'), '기원전 1210년');
  assert.equal(fmtYear(-1209, 'en'), '1210 BCE');
  assert.equal(fmtYear(0, 'en'), '1 BCE');
  assert.equal(fmtYear(-62999, 'ko'), '기원전 63,000년 무렵');
  assert.equal(fmtYear(-62999, 'en'), 'c. 63,000 BCE');
});
