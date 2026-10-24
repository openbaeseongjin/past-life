import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = 'docs/past-life/assets/real/preview/estate';
fs.mkdirSync(OUT_DIR, { recursive: true });

const SHOTS = [
  { name: 'england_manor_wide', url: 'http://localhost:8780/estate-preview.html?kit=england&area=britain&year=1329&household=elite&view=wide' },
  { name: 'england_manor_elite', url: 'http://localhost:8780/estate-preview.html?kit=england&area=britain&year=1329&household=elite&view=close' },
  { name: 'england_manor_serve', url: 'http://localhost:8780/estate-preview.html?kit=england&area=britain&year=1329&household=serve&view=close' },

  { name: 'southasia_haveli_wide', url: 'http://localhost:8780/estate-preview.html?kit=southasia&area=india&year=1300&household=elite&view=wide' },
  { name: 'southasia_haveli_elite', url: 'http://localhost:8780/estate-preview.html?kit=southasia&area=india&year=1300&household=elite&view=close' },
  { name: 'southasia_haveli_serve', url: 'http://localhost:8780/estate-preview.html?kit=southasia&area=india&year=1300&household=serve&view=close' },

  { name: 'eastasia_korea_wide', url: 'http://localhost:8780/estate-preview.html?kit=eastasia&area=korea&year=1700&household=elite&view=wide' },
  { name: 'eastasia_korea_elite', url: 'http://localhost:8780/estate-preview.html?kit=eastasia&area=korea&year=1700&household=elite&view=close' },
  { name: 'eastasia_korea_serve', url: 'http://localhost:8780/estate-preview.html?kit=eastasia&area=korea&year=1700&household=serve&view=close' },

  { name: 'mudbrick_palace_wide', url: 'http://localhost:8780/estate-preview.html?kit=mudbrick&area=mesopotamia&year=1100&household=elite&view=wide' },
  { name: 'mudbrick_palace_elite', url: 'http://localhost:8780/estate-preview.html?kit=mudbrick&area=mesopotamia&year=1100&household=elite&view=close' },
  { name: 'mudbrick_palace_serve', url: 'http://localhost:8780/estate-preview.html?kit=mudbrick&area=mesopotamia&year=1100&household=serve&view=close' },
];

async function main() {
  console.log('[estate-shots] 브라우저 실행 중...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--enable-webgl', '--use-gl=angle', '--use-angle=d3d11', '--no-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  for (const shot of SHOTS) {
    console.log(`[estate-shots] 촬영 중: ${shot.name} (${shot.url})`);
    await page.goto(shot.url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });
    // 렌더링 안정화 대기 (프레임 렌더)
    await page.waitForTimeout(1500);
    const outPath = path.join(OUT_DIR, `${shot.name}.png`);
    await page.screenshot({ path: outPath });
    console.log(`[estate-shots] 저장 완료: ${outPath}`);
  }

  await browser.close();
  console.log('[estate-shots] 모든 스크린샷 촬영 완료!');
}

main().catch((err) => {
  console.error('[estate-shots] 오류:', err);
  process.exit(1);
});
