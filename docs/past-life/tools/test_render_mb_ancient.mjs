import { chromium } from 'playwright';

async function capture() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=d3d11']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

  console.log('Loading ancient mudbrick (year 200, pre-islamic shrine)...');
  await page.goto('http://localhost:8780/look-real.html?set=mudbrick&land=dry&area=iran&year=200&view=church&hud=0&post=0', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: 'p2_t3_mudbrick_shrine.png' });
  console.log('Saved p2_t3_mudbrick_shrine.png');

  await browser.close();
  console.log('Done ancient capture!');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
