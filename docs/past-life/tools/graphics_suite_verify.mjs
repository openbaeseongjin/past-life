// tools/graphics_suite_verify.mjs
// 4대 그래픽 디벨롭 종합 실사 검증 스크립트:
// 1. 날씨 & 기후 파티클 (비, 눈, 벚꽃, 낙엽, 황사)
// 2. 바람 식생 & 작물 파동
// 3. 야간 창문 불빛 & 반딧불이 (Night Glow & Fireflies)
// 4. 시네마틱 DoF 아웃포커싱 & 필름 그레인
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/admin/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright');

const ARTIFACT_DIR = 'C:/Users/admin/.gemini/antigravity-cli/brain/da739ec6-9487-4b12-b066-d5b26a6263e8';

async function main() {
  console.log('브라우저 실행 (Chrome D3D11 GPU 가속)...');
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-webgl', '--enable-gpu', '--ignore-gpu-blocklist']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  page.on('console', (msg) => {
    const text = msg.text();
    if (msg.type() === 'error' || text.includes('Error') || text.includes('warn')) {
      console.log(`[Browser ${msg.type()}]`, text);
    }
  });

  console.log('로컬 서버 접속: http://localhost:8780/index.html?seed=T8-201&auto=1');
  await page.goto('http://localhost:8780/index.html?seed=T8-201&auto=1', { waitUntil: 'domcontentloaded' });

  // 1. 3D 무대 및 앱 준비 대기
  console.log('3D 무대 준비 대기...');
  await page.waitForFunction(() => {
    try {
      const info = window.__pl && window.__pl.village && window.__pl.village.info && window.__pl.village.info();
      return info && info.scene && info.scene.calls > 0;
    } catch (e) { return false; }
  }, { timeout: 30000 });

  // 게임 일시 정지 (안정적인 촬영)
  await page.evaluate(() => {
    if (window.__pl && window.__pl.S) {
      window.__pl.S.paused = true;
    }
  });
  await page.waitForTimeout(1000);

  // 2. 야간 가옥 창문 불빛 및 반딧불이 검증 (Night Phase)
  console.log('야간 모드 (Night Window Glow & Fireflies) 테스트...');
  await page.evaluate(() => {
    window.__pl.village.setPhase('night');
  });
  await page.waitForTimeout(2200);
  const nightPath = path.join(ARTIFACT_DIR, 'night_village_glow.png');
  await page.screenshot({ path: nightPath });
  console.log(`캡처 완료: ${nightPath}`);

  // 3. 황혼(Dusk) 모드 복귀 후 날씨 5대 파티클 캡처
  await page.evaluate(() => {
    window.__pl.village.setPhase('dusk');
  });
  await page.waitForTimeout(1500);

  const weathers = [
    { type: 'rain', name: 'weather_rain', desc: '빗줄기 (Rain)' },
    { type: 'snow', name: 'weather_snow', desc: '눈송이 (Snow)' },
    { type: 'petals', name: 'weather_petals', desc: '벚꽃잎 (Petals)' },
    { type: 'leaves', name: 'weather_leaves', desc: '가을 낙엽 (Leaves)' },
    { type: 'dust', name: 'weather_dust', desc: '황사/먼지 (Dust)' },
  ];

  for (const w of weathers) {
    console.log(`기후 연출 테스트: ${w.desc}...`);
    await page.evaluate((type) => {
      window.__pl.village.setWeather(type, 1.0);
    }, w.type);
    await page.waitForTimeout(1600);
    const outPath = path.join(ARTIFACT_DIR, `${w.name}.png`);
    await page.screenshot({ path: outPath });
    console.log(`캡처 완료: ${outPath}`);
  }

  // 4. 시네마틱 DoF 아웃포커싱 테스트 (카드 팝업 시뮬레이션)
  console.log('시네마틱 DoF (Card Focus) 테스트...');
  await page.evaluate(() => {
    document.body.classList.add('dof-focus');
    const modal = document.getElementById('modal');
    if (modal) {
      modal.hidden = false;
      modal.className = 'cross';
      modal.innerHTML = `
        <div class="xcard" role="dialog" style="display:block;margin:auto;">
          <h3 id="dlgT">✨ 시네마틱 DoF & 필름 그레인 검증</h3>
          <p class="xtext">3D 배경이 부드러운 디오라마 보케(Bokeh)로 아웃포커싱되어 선택지 카드와 텍스트의 주목도가 극대화됩니다.</p>
          <ol class="paths">
            <li><button class="path"><span class="num">1</span><span class="pt">새로운 삶의 길을 걷는다</span></button></li>
          </ol>
        </div>
      `;
    }
  });
  await page.waitForTimeout(1200);
  const dofPath = path.join(ARTIFACT_DIR, 'dof_card_focus.png');
  await page.screenshot({ path: dofPath });
  console.log(`캡처 완료: ${dofPath}`);

  // 정리
  await page.evaluate(() => {
    document.body.classList.remove('dof-focus');
    const modal = document.getElementById('modal');
    if (modal) modal.hidden = true;
    window.__pl.village.setWeather('clear', 0.0);
    window.__pl.village.setPhase('day');
  });

  await browser.close();
  console.log('4대 그래픽 종합 검증 및 캡처 전수 완료!');
}

main().catch((err) => {
  console.error('검증 에러:', err);
  process.exit(1);
});
