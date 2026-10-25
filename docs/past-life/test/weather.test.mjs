// test/weather.test.mjs
// 동적 날씨 시스템 및 카드 연동 단위 테스트
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cardWeatherOf, seasonalWeatherOf, WEATHER_TYPES } from '../weather.js';
import { DECK } from '../deck.js';
import { EVENT_CARDS } from '../cards_event.js';

test('WEATHER_TYPES: 6대 기본 기후 타입 정의', () => {
  assert.deepEqual(WEATHER_TYPES, ['clear', 'rain', 'snow', 'petals', 'leaves', 'dust']);
});

test('cardWeatherOf: 키워드 기반 날씨 정확 매핑', () => {
  // 1. 눈 / 혹한
  assert.equal(cardWeatherOf({ text: { ko: '혹한의 추위가 닥쳐 얼어붙었다' } }), 'snow');
  assert.equal(cardWeatherOf({ text: { en: 'A harsh winter blizzard swept the village' } }), 'snow');
  assert.equal(cardWeatherOf({ title: { ko: '폭설과 굶주림' } }), 'snow');

  // 2. 비 / 폭우 / 홍수
  assert.equal(cardWeatherOf({ text: { ko: '장마철 폭우가 쏟아져 강이 넘쳤다' } }), 'rain');
  assert.equal(cardWeatherOf({ text: { en: 'Heavy storm and flood destroyed the bridge' } }), 'rain');
  assert.equal(cardWeatherOf({ text: { ko: '세찬 빗줄기 속에 논을 지켰다' } }), 'rain');

  // 3. 가뭄 / 황사 / 사막
  assert.equal(cardWeatherOf({ text: { ko: '극심한 가뭄으로 대지가 메마르고 갈라졌다' } }), 'dust');
  assert.equal(cardWeatherOf({ text: { en: 'The desert sandstorm blinded the caravan' } }), 'dust');
  assert.equal(cardWeatherOf({ text: { ko: '거센 황사가 하늘을 뒤덮었다' } }), 'dust');

  // 4. 봄 / 꽃잎 / 벚꽃 / 혼례
  assert.equal(cardWeatherOf({ text: { ko: '화창한 봄날 벚꽃이 흩날리는 혼례를 올렸다' } }), 'petals');
  assert.equal(cardWeatherOf({ text: { en: 'Cherry blossom petals danced in the spring wind' } }), 'petals');

  // 5. 가을 / 단풍 / 낙엽 / 추수
  assert.equal(cardWeatherOf({ text: { ko: '풍요로운 가을 추수철에 붉은 단풍이 들었다' } }), 'leaves');
  assert.equal(cardWeatherOf({ text: { en: 'Foliage and golden autumn leaves carpet the path' } }), 'leaves');

  // 6. 명시적 오버라이드
  assert.equal(cardWeatherOf({ weather: 'snow', text: { ko: '평범한 날' } }), 'snow');

  // 7. 일반 일상 카드 -> null (자연 순환 날씨에 위임)
  assert.equal(cardWeatherOf({ text: { ko: '평범하게 글을 읽고 잠자리에 들었다' } }), null);
});

test('seasonalWeatherOf: 문화권 및 나이·연도별 자연 기후 순환', () => {
  const dummyLifeEa = { age: 10, year: 1400, birth: { region: 'ea' } };
  const dummyLifeSa = { age: 20, year: 1500, birth: { region: 'sa' } };

  // 결정론적 일관성: 같은 조건이면 같은 날씨
  assert.equal(seasonalWeatherOf(dummyLifeEa), seasonalWeatherOf(dummyLifeEa));
  assert.equal(seasonalWeatherOf(dummyLifeSa), seasonalWeatherOf(dummyLifeSa));

  // 유효한 날씨 타입만 반환
  for (let age = 0; age < 80; age++) {
    const wEa = seasonalWeatherOf({ age, year: 1000 + age, birth: { region: 'ea' } });
    assert.ok(WEATHER_TYPES.includes(wEa), `유효하지 않은 날씨: ${wEa}`);
    const wEu = seasonalWeatherOf({ age, year: 1200 + age, birth: { region: 'eu' } });
    assert.ok(WEATHER_TYPES.includes(wEu), `유효하지 않은 날씨: ${wEu}`);
    const wSa = seasonalWeatherOf({ age, year: 1600 + age, birth: { region: 'sa' } });
    assert.ok(WEATHER_TYPES.includes(wSa), `유효하지 않은 날씨: ${wSa}`);
  }
});

test('전체 덱(DECK + EVENT_CARDS) cardWeatherOf 안정성 전수 검사', () => {
  const allCards = [...DECK, ...EVENT_CARDS];
  const validWeathers = new Set([...WEATHER_TYPES, null]);

  let matchedWeatherCount = 0;
  for (const card of allCards) {
    const w = cardWeatherOf(card);
    assert.ok(validWeathers.has(w), `카드 ${card.id} 의 날씨 값(${w})이 비정상입니다.`);
    if (w) matchedWeatherCount++;
  }
  // 전체 덱 중 최소 수십 개 이상의 카드가 기후 서사와 연동됨을 확인
  assert.ok(matchedWeatherCount >= 15, `날씨 연동 카드가 너무 적습니다: ${matchedWeatherCount}`);
});
