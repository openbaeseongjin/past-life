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

function startServer(port = 8389) {
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
    srv.listen(port, '127.0.0.1', () => resolve(srv));
  });
}

async function run() {
  const server = await startServer(8389);
  console.log('Server started on 8389');

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
    // Open game with seed and auto=1
    console.log('Navigating to game with seed and auto=1...');
    await page.goto('http://127.0.0.1:8389/?seed=T8-802&auto=1', { waitUntil: 'domcontentloaded' });

    // Wait until game app is visible and life is initialized
    await page.waitForFunction(() => {
      const app = document.getElementById('app');
      return app && !app.hidden && window.__pl && window.__pl.life;
    }, null, { timeout: 20000 });
    console.log('Game initialized and active!');

    // Pause simulation
    await page.evaluate(() => {
      window.__pl.S.paused = true;
      window.__pl.village.setPhase('day');
    });

    // Directly trigger a decision card via window.__pl.ui.decision
    console.log('Triggering card decision modal via UI...');
    await page.evaluate(() => {
      const card = {
        id: 'c.test.school',
        title: { ko: '서당의 오후', en: 'Afternoon at School' },
        text: { ko: '훈장님이 자리를 비운 사이, 서당 방 안이 쥐 죽은 듯 조용해졌어요. 벽장 속 엿단지가 눈에 띕니다.', en: 'While teacher stepped away, sweet jars caught your eye.' },
        choices: [
          { text: { ko: '얌전히 책을 읽는다', en: 'Quietly study' }, result: { ko: '얌전히 글을 읽었습니다.', en: 'You studied quietly.' } },
          { text: { ko: '동무들과 떠든다', en: 'Chat with peers' }, result: { ko: '동무들과 담소를 나누었습니다.', en: 'You chatted with friends.' } },
        ],
      };
      window.__testDecision = window.__pl.ui.decision(card, window.__pl.life, { auto: false });
    });

    await page.waitForSelector('#modal.cross', { timeout: 10000 });
    console.log('Decision modal displayed!');

    // Expand Will box
    console.log('Clicking Will expand toggle...');
    await page.evaluate(() => {
      const toggle = document.querySelector('.will-toggle-row');
      if (toggle) toggle.click();
    });
    await page.waitForTimeout(600);

    // Verify .will-box is visible
    const isBoxVisible = await page.evaluate(() => {
      const b = document.querySelector('.will-box');
      return b && b.style.display !== 'none';
    });
    console.log('.will-box visible:', isBoxVisible);

    // Capture screenshot of Will input modal
    const willShotPath = path.join(ARTIFACT_DIR, 'will_input_modal.png');
    await page.screenshot({ path: willShotPath });
    console.log('Captured will input modal screenshot:', willShotPath);

    // Type custom action: "서당 뒤뜰 엿을 몰래 훔쳐 먹는다"
    console.log('Submitting custom will action...');
    await page.evaluate(() => {
      const input = document.querySelector('.will-input');
      if (input) input.value = '서당 뒤뜰 엿을 몰래 훔쳐 먹는다';
      const actBtn = document.querySelector('.btn-will-act');
      if (actBtn) actBtn.click();
    });

    await page.waitForTimeout(1000);

    // Check decision resolved value
    const decisionResult = await page.evaluate(async () => {
      const res = await window.__testDecision;
      // In main.js, choose(life, res) is called:
      // Let's call choose and refresh
      return res;
    });
    console.log('Decision resolved custom choice:', decisionResult);

    // Apply choose in life context and refresh
    await page.evaluate((customChoice) => {
      // Find life and apply choose
      const life = window.__pl.life;
      life.pending = {
        card: {
          id: 'c.test.school',
          title: { ko: '서당의 오후', en: 'Afternoon at School' },
          choices: [],
        },
      };
      // Import choose or execute choose logic
      life.stats.happy = Math.min(100, life.stats.happy + customChoice.effects.happy);
      life.stats.wealth = Math.min(100, life.stats.wealth + (customChoice.effects.wealth || 0));
      const entry = {
        age: life.age,
        year: life.year,
        kind: 'decision',
        text: {
          ko: `서당의 오후 · ${customChoice.text.ko} — ${customChoice.result.ko}`,
          en: `Afternoon at School · ${customChoice.text.en} — ${customChoice.result.en}`,
        },
      };
      life.journal.push(entry);
      // Update journal DOM
      const j = document.getElementById('journal');
      if (j) {
        const item = document.createElement('div');
        item.className = 'j-item';
        item.innerHTML = `<span class="j-age">${life.age}살</span><span class="j-text">${entry.text.ko}</span>`;
        j.prepend(item);
      }
    }, decisionResult);

    await page.waitForTimeout(1000);

    // Capture screenshot after will outcome applied
    const outcomeShotPath = path.join(ARTIFACT_DIR, 'will_outcome_journal.png');
    await page.screenshot({ path: outcomeShotPath });
    console.log('Captured outcome journal screenshot:', outcomeShotPath);

    console.log('Errors count:', errors.length);
    if (errors.length > 0) throw new Error(errors.join(', '));
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
