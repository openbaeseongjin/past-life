// tools/verify_live_card_scene.mjs
import { chromium } from 'playwright';

async function verifyLiveCardScene() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  await page.goto('http://localhost:8780/index.html?fast=1', { waitUntil: 'networkidle' });
  await page.evaluate(() => localStorage.setItem('pl.coach', 'true'));
  await page.reload({ waitUntil: 'networkidle' });

  await page.waitForSelector('button[data-v="start"]');
  await page.click('button[data-v="start"]');

  await page.waitForSelector('button[data-v="go"]');
  await page.click('button[data-v="go"]');

  await page.waitForTimeout(500);
  await page.waitForSelector('button[data-v="go"]');
  await page.click('button[data-v="go"]');

  console.log('In game started. Waiting for card modal...');
  await page.waitForSelector('.xcard', { timeout: 15000 });

  const result = await page.evaluate(() => {
    const cardTitle = document.querySelector('#dlgT')?.innerText;
    const cardText = document.querySelector('.xtext')?.innerText;
    const v = window.__pl && window.__pl.village;
    const sceneInfo = v && v.info ? v.info() : null;
    return {
      cardTitle,
      cardText,
      sceneAct: sceneInfo?.act,
      sceneFocus: sceneInfo?.focus,
      sceneKit: sceneInfo?.stage?.kitNow,
      sceneErrors: sceneInfo?.errors
    };
  });

  console.log('\n=== 카드-장면-인물 실시간 매칭 라이브 검증 결과 ===');
  console.log('카드 제목:', result.cardTitle);
  console.log('카드 본문:', result.cardText);
  console.log('3D 씬 동작(act):', result.sceneAct);
  console.log('3D 씬 포커스:', result.sceneFocus);
  console.log('3D 씬 세트:', result.sceneKit);
  console.log('3D 씬 오류:', result.sceneErrors);

  // 스크린샷 캡처
  await page.screenshot({ path: 'C:/Users/admin/.gemini/antigravity-cli/brain/da739ec6-9487-4b12-b066-d5b26a6263e8/live_card_scene_verified.png' });
  console.log('✔ 스크린샷 저장 완료: live_card_scene_verified.png\n');

  await browser.close();
}

verifyLiveCardScene().catch(e => {
  console.error('검증 오류:', e);
  process.exit(1);
});
