// tools/debug_ingame.mjs
import { chromium } from 'playwright';

async function debugIngame() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  await page.goto('http://localhost:8780/index.html?fast=1', { waitUntil: 'networkidle' });

  await page.evaluate(() => {
    localStorage.setItem('pl.coach', 'true');
  });
  await page.reload({ waitUntil: 'networkidle' });

  await page.waitForSelector('button[data-v="start"]');
  await page.click('button[data-v="start"]');

  await page.waitForSelector('button[data-v="go"]');
  await page.click('button[data-v="go"]');

  await page.waitForTimeout(500);
  await page.waitForSelector('button[data-v="go"]');
  await page.click('button[data-v="go"]');

  console.log('Clicked both go buttons. Waiting 3 seconds...');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'C:/Users/admin/.gemini/antigravity-cli/brain/da739ec6-9487-4b12-b066-d5b26a6263e8/debug_ingame.png' });

  const state = await page.evaluate(() => {
    const age = document.getElementById('age')?.innerText;
    const isPaused = document.querySelector('button[data-act="play"]')?.innerText;
    const appHidden = document.getElementById('app')?.hidden;
    const modalHidden = document.getElementById('modal')?.hidden;
    const modalHtml = document.getElementById('modal')?.innerHTML;
    return { age, isPaused, appHidden, modalHidden, modalHtml: modalHtml ? modalHtml.slice(0, 300) : '' };
  });
  console.log('State:', state);

  await browser.close();
}

debugIngame();
