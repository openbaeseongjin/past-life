// tools/debug_screen.mjs
import { chromium } from 'playwright';

async function debugScreen() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:8780/index.html?fast=1', { waitUntil: 'networkidle' });

  await page.evaluate(() => {
    localStorage.setItem('pl.coach', 'true');
  });
  await page.reload({ waitUntil: 'networkidle' });

  await page.waitForSelector('button[data-v="start"]');
  await page.click('button[data-v="start"]');

  await page.waitForSelector('button[data-v="go"]');
  await page.click('button[data-v="go"]');

  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:/Users/admin/.gemini/antigravity-cli/brain/da739ec6-9487-4b12-b066-d5b26a6263e8/debug_screen_state.png' });

  const html = await page.evaluate(() => {
    const screen = document.getElementById('screen');
    const modal = document.getElementById('modal');
    return {
      screenHtml: screen ? screen.innerHTML.slice(0, 500) : '',
      screenClass: screen ? screen.className : '',
      modalHtml: modal ? modal.innerHTML.slice(0, 500) : '',
      modalClass: modal ? modal.className : '',
      modalHidden: modal ? modal.hidden : null,
      appHidden: document.getElementById('app')?.hidden
    };
  });
  console.log('Screen state:', html);

  await browser.close();
}

debugScreen();
