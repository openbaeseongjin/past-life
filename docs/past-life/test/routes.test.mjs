import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTES, ROUTE_STEPS, HYBRID_TITLES, getRouteBadge, setLifeRoute, routeWeightBonus, careerSummary } from '../routes.js';

test('12대 루트와 4단계 칭호가 누락 없이 정의되어 있다', () => {
  const ids = Object.keys(ROUTES);
  assert.equal(ids.length, 12);
  for (const id of ids) {
    assert.ok(ROUTES[id].ko && ROUTES[id].en);
    assert.ok(ROUTES[id].icon);
    assert.equal(ROUTE_STEPS[id].length, 4, `${id} 4단계 칭호`);
    for (const step of ROUTE_STEPS[id]) {
      assert.ok(step.ko && step.en);
    }
  }
});

test('setLifeRoute: 루트 진입 및 단계 성장', () => {
  const life = { age: 16, year: 1520, flags: {} };
  setLifeRoute(life, { id: 'artisan', step: 1 });
  assert.equal(life.route.id, 'artisan');
  assert.equal(life.route.step, 1);
  assert.ok(life.flags['route:artisan']);
  assert.ok(life.flags.hasRoute);

  const badge = getRouteBadge(life, 'ko');
  assert.equal(badge.id, 'artisan');
  assert.equal(badge.stepName, '수습 도제');
  assert.equal(badge.fullTitle, '🔨 [장인의 길: 수습 도제]');

  // 승급
  setLifeRoute(life, { id: 'artisan', step: 2 });
  assert.equal(life.route.step, 2);
  const badge2 = getRouteBadge(life, 'ko');
  assert.equal(badge2.stepName, '공방 장인');
});

test('진로 전환(Career Pivot) 및 하이브리드 칭호', () => {
  const life = { age: 16, year: 1200, flags: {} };
  setLifeRoute(life, { id: 'healer', step: 2 });
  assert.equal(life.route.id, 'healer');

  // 중년에 구도의 길로 피벗
  life.age = 35;
  setLifeRoute(life, { id: 'seeker', step: 2 });
  assert.equal(life.route.id, 'seeker');
  assert.equal(life.route.secondary, 'healer');
  assert.ok(life.route.pivoted);

  const badge = getRouteBadge(life, 'ko');
  assert.equal(badge.title, '성스러운 치료사');
  assert.equal(badge.fullTitle, '🕯️ [구도의 길: 성스러운 치료사]');
});

test('routeWeightBonus: 다음 단계 카드는 가중치 5배 부스트', () => {
  const route = { id: 'scholar', step: 1 };
  assert.equal(routeWeightBonus({ route: 'scholar', routeStep: 2 }, route), 5);
  assert.equal(routeWeightBonus({ route: 'scholar', routeStep: 1 }, route), 3);
  assert.equal(routeWeightBonus({ route: 'scholar', routeStep: 3 }, route), 2);
  assert.equal(routeWeightBonus({ route: 'artisan', routeStep: 2 }, route), 1);
  assert.equal(routeWeightBonus({ id: 'plain' }, route), 1);
});

test('careerSummary: 생애 족적 요약', () => {
  const life = { age: 65, year: 1850, flags: {} };
  assert.ok(careerSummary(life, 'ko').includes('소박하게'));

  setLifeRoute(life, { id: 'warrior', step: 3 });
  const summaryKo = careerSummary(life, 'ko');
  assert.ok(summaryKo.includes('⚔️'));
  assert.ok(summaryKo.includes('수비대장'));
  assert.ok(summaryKo.includes('존경'));

  const summaryEn = careerSummary(life, 'en');
  assert.ok(summaryEn.includes('Garrison Commander'));
});
