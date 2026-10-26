import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');

const ROOT = 'D:/Users/admin/Desktop/indigame/past-life-dev/docs/past-life';
const ARTIFACT_DIR = 'C:/Users/admin/.gemini/antigravity-cli/brain/da739ec6-9487-4b12-b066-d5b26a6263e8';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.glb': 'model/gltf-binary',
  '.svg': 'image/svg+xml',
};

function startServer(port = 8189) {
  const srv = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    const rel = decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname);
    const fp = path.join(ROOT, rel);
    if (!fp.startsWith(path.resolve(ROOT)) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
      res.writeHead(404);
      res.end('Not found: ' + rel);
      return;
    }
    const ext = path.extname(fp).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(fp).pipe(res);
  });
  return new Promise((resolve) => {
    srv.listen(port, '127.0.0.1', () => {
      resolve(srv);
    });
  });
}

async function run() {
  const server = await startServer(8189);
  console.log('Static server listening on 8189');

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=d3d11',
      '--enable-gpu',
      '--ignore-gpu-blocklist',
      '--no-sandbox',
    ],
  });

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, locale: 'ko-KR' });
  const page = await ctx.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error('[BROWSER ERROR]', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    errors.push(err.message);
    console.error('[PAGE ERROR]', err.message);
  });

  try {
    // Open game with seed, auto=1 (without fast=1)
    console.log('Navigating to game...');
    await page.goto('http://127.0.0.1:8189/?seed=T8-802&auto=1', { waitUntil: 'domcontentloaded' });

    // Wait until game app is visible and life is initialized
    await page.waitForFunction(() => {
      const app = document.getElementById('app');
      return app && !app.hidden && window.__pl && window.__pl.life;
    }, null, { timeout: 20000 });
    console.log('Game initialized and active!');

    // Grant wealth for testing
    await page.evaluate(() => {
      window.__pl.life.stats.wealth = 150;
      window.__pl.village.setPhase('day');
    });

    // Wait for 3D scene to finish rendering frame
    await page.waitForFunction(() => {
      try {
        const info = window.__pl.village.info();
        return info && info.scene && info.scene.calls > 0;
      } catch (e) { return false; }
    }, null, { timeout: 20000 });
    console.log('3D village stage ready!');
    await page.waitForTimeout(600);

    // Click #btnEstate to open Estate Drawer
    console.log('Opening Estate Drawer via DOM click...');
    await page.evaluate(() => {
      const btn = document.getElementById('btnEstate');
      if (btn) btn.click();
    });
    await page.waitForTimeout(800);

    // Verify modal
    const sheet = await page.$('.estate-sheet');
    console.log('Estate sheet visible:', !!sheet);

    // Take screenshot of Estate Drawer modal
    const drawerPath = path.join(ARTIFACT_DIR, 'estate_drawer_modal.png');
    await page.screenshot({ path: drawerPath });
    console.log('Captured estate drawer modal screenshot:', drawerPath);

    // Buy Livestock Tier 1 via DOM click
    console.log('Buying Livestock Tier 1 (토종닭과 오리장)...');
    await page.evaluate(() => {
      const btn = document.querySelector('.btn-buy-estate[data-slot="livestock"][data-tier="1"]');
      if (btn) btn.click();
    });
    await page.waitForTimeout(600);

    // Buy Household Tier 1 via DOM click
    console.log('Buying Household Tier 1 (곡물 옹기와 항아리)...');
    await page.evaluate(() => {
      const btn = document.querySelector('.btn-buy-estate[data-slot="household"][data-tier="1"]');
      if (btn) btn.click();
    });
    await page.waitForTimeout(600);

    // Check life estate state while drawer is open
    const estateMid = await page.evaluate(() => window.__pl.life.estate);
    console.log('Life Estate after purchases:', estateMid);

    // Close the drawer modal via DOM click
    console.log('Closing Estate Drawer...');
    await page.evaluate(() => {
      const btn = document.querySelector('[data-v="close"]');
      if (btn) btn.click();
    });
    await page.waitForTimeout(1500);

    // Pause game loop explicitly so life doesn't advance
    await page.evaluate(() => {
      window.__pl.S.paused = true;
    });

    // Capture screenshot of the 3D homestead scene with placed assets & character
    const scenePath = path.join(ARTIFACT_DIR, 'estate_homestead_3d_view.png');
    await page.screenshot({ path: scenePath });
    console.log('Captured 3D homestead scene screenshot:', scenePath);

    console.log('Test completed with error count:', errors.length);
    if (errors.length > 0) {
      throw new Error(`Browser console errors detected: ${errors.join(', ')}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((e) => {
  console.error('Test run failed:', e);
  process.exit(1);
});
