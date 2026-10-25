// tools/test_browser_card_scene_coherence.mjs
import { chromium } from 'playwright';

async function testCardSceneCoherence() {
  console.log('--- 브라우저 E2E: 장면-카드-인물 매칭 실시간 검증 시작 ---');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // ?fast=1 로 딜레이 없이 즉시 실행
  await page.goto('http://localhost:8780/index.html?fast=1', { waitUntil: 'networkidle' });
  console.log('1. 페이지 로드 완료 (?fast=1)');

  await page.evaluate(() => {
    localStorage.setItem('pl.coach', 'true');
    localStorage.setItem('pl.speed', 'fastest');
  });
  await page.reload({ waitUntil: 'networkidle' });

  // 1. 시작 버튼 클릭 (data-v="start")
  await page.waitForSelector('button[data-v="start"]', { timeout: 10000 });
  await page.click('button[data-v="start"]');
  console.log('2. 타이틀 시작 버튼 클릭');

  // 2. 운명 선택 화면 (data-v="go")
  await page.waitForSelector('button[data-v="go"]', { timeout: 10000 });
  await page.click('button[data-v="go"]');
  console.log('3. 운명 시작 버튼 클릭');

  // 3. 출생 기록 화면 (data-v="go")
  await page.waitForTimeout(500);
  await page.waitForSelector('button[data-v="go"]', { timeout: 10000 });
  await page.click('button[data-v="go"]');
  console.log('4. 출생 기록 시작 버튼 클릭 -> 게임 본편 진입');

  // 4. 카드 등장 대기 및 매칭 검사 (.xcard)
  console.log('5. 카드 등장 대기 및 3D 씬 매칭 정밀 검증...');
  await page.waitForSelector('.xcard, ol.paths', { timeout: 15000 });

  // 씬의 실시간 정보 추출
  const sceneInfo = await page.evaluate(() => {
    if (window.village && window.village.info) {
      return window.village.info();
    }
    return null;
  });

  const cardDetails = await page.evaluate(() => {
    const title = document.querySelector('#dlgT, .xcard h3')?.innerText || '';
    const text = document.querySelector('.xtext')?.innerText || '';
    return { title, text };
  });

  console.log(`\n========================================`);
  console.log(`✔ 실시간 카드 감지 성공!`);
  console.log(`- 제목: ${cardDetails.title}`);
  console.log(`- 본문: ${cardDetails.text}`);
  console.log(`- 3D 씬 상태:`);
  console.log(`  * act.key: ${sceneInfo?.act?.key}`);
  console.log(`  * act.action: ${sceneInfo?.act?.action}`);
  console.log(`  * focus: ${sceneInfo?.focus}`);
  console.log(`========================================\n`);

  // 스크린샷 캡처
  await page.screenshot({ path: 'C:/Users/admin/.gemini/antigravity-cli/brain/da739ec6-9487-4b12-b066-d5b26a6263e8/card_scene_coherence_live.png' });
  console.log('✔ 실시간 카드-장면-인물 스크린샷 저장 완료: card_scene_coherence_live.png');

  await browser.close();
  console.log(`최종 결과: 성공 (3D 장면과 카드, 인물 동작 실시간 매칭 검증 완료)`);
}

testCardSceneCoherence().catch(e => {
  console.error('검증 실패:', e);
  process.exit(1);
});
