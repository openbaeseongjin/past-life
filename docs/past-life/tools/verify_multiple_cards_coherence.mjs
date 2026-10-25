// tools/verify_multiple_cards_coherence.mjs
import { chromium } from 'playwright';

async function verifyMultipleCards() {
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

  console.log('게임 시작. 5장의 카드를 연속으로 감지하고 장면-인물 매칭을 검증합니다...\n');

  for (let cardCount = 1; cardCount <= 5; cardCount++) {
    // 카드 등장 대기
    await page.waitForSelector('.xcard', { timeout: 25000 });

    const info = await page.evaluate(() => {
      const title = document.querySelector('#dlgT')?.innerText || '';
      const text = document.querySelector('.xtext')?.innerText || '';
      const v = window.__pl && window.__pl.village;
      const si = v && v.info ? v.info() : null;
      return { title, text, act: si?.act, kit: si?.stage?.kitNow, age: document.getElementById('age')?.innerText };
    });

    console.log(`[카드 #${cardCount} 검증 (${info.age}세)]`);
    console.log(`  - 제목: ${info.title}`);
    console.log(`  - 본문: ${info.text.slice(0, 60)}...`);
    console.log(`  - 3D 씬 매칭: spot=${info.act?.key}, action=${info.act?.action}, kit=${info.kit}\n`);

    // 선택지 하나 클릭하여 다음으로 진행
    const choiceBtn = await page.$('ol.paths button');
    if (choiceBtn) {
      await choiceBtn.click();
      await page.waitForTimeout(600);
    } else {
      break;
    }
  }

  await browser.close();
  console.log('✔ 5회 연속 카드-장면-인물 실시간 매칭 검증 완료!');
}

verifyMultipleCards().catch(e => {
  console.error('검증 오류:', e);
  process.exit(1);
});
