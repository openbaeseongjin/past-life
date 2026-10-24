import { chromium } from 'playwright';

const KITS = [
  { kit: 'southasia', area: 'india', year: 183, households: ['serve', 'elite', 'farm'] },
  { kit: 'england', area: 'britain', year: 1329, households: ['serve', 'elite', 'farm'] },
  { kit: 'eastasia', area: 'korea', year: 1700, households: ['serve', 'elite', 'farm'] },
  { kit: 'mudbrick', area: 'mesopotamia', year: 1100, households: ['serve', 'elite', 'farm'] },
];

const AGES = [4, 7, 10, 25, 65];

async function runComprehensiveAudit() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-gl=angle', '--use-angle=d3d11', '--no-sandbox']
  });

  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('http://localhost:8780/estate-preview.html');
  await page.waitForFunction(() => window.__ready === true, { timeout: 30000 });

  let totalCases = 0;
  let overlappingCases = 0;
  const issues = [];

  for (const k of KITS) {
    for (const hh of k.households) {
      for (const age of AGES) {
        totalCases++;
        const res = await page.evaluate(async ({ kit, area, year, household, age }) => {
          const stage = window.__stage;
          stage.setLife({
            year,
            region: kit === 'england' ? 'england' : area,
            area,
            household,
            sex: 'm',
            seed: 42 + age * 13,
          });
          stage.setAge(age, year);
          await stage.whenReady();
          await new Promise(r => setTimeout(r, 80));

          const info = stage.info();
          const act = info.act;
          const sc = stage.scene;
          const items = sc.dressing.items;

          // Find me
          let mePos = null;
          sc.scene.traverse(o => {
            if (o.isSkinnedMesh) {
              let root = o;
              while (root.parent && root.parent !== sc.scene) root = root.parent;
              // Check if it has 'you' place or close to act spot
              if (act && act.spot && Math.hypot(root.position.x - act.spot.x, root.position.z - act.spot.z) < 1.0) {
                mePos = [root.position.x, root.position.y, root.position.z];
              }
            }
          });

          if (!mePos && act && act.spot) mePos = [act.spot.x, 0, act.spot.z];
          if (!mePos) return { ok: true };

          // Check if overlapping with beds/benches when action != 'sit'
          if (act.action !== 'sit') {
            const hit = items.find(it => {
              const isFurniture = it.p === 'charpai' || it.p === 'bench' || it.p === 'bench_ea' || it.p === 'carpet_mb' || (it.p && it.p.includes('bed'));
              if (!isFurniture) return false;
              const d = Math.hypot(it.x - mePos[0], it.z - mePos[2]);
              return d < 0.75; // inside the furniture
            });
            if (hit) {
              return { ok: false, prop: hit.p, dist: Math.hypot(hit.x - mePos[0], hit.z - mePos[2]), act };
            }
          }

          return { ok: true };
        }, { kit: k.kit, area: k.area, year: k.year, household: hh, age });

        if (!res.ok) {
          overlappingCases++;
          issues.push({ ...k, household: hh, age, issue: res });
        }
      }
    }
  }

  console.log(`\n=== 전수 감사 결과 (Comprehensive Audit Result) ===`);
  console.log(`총 검사 케이스: ${totalCases}개`);
  console.log(`충돌/파묻힘 발생: ${overlappingCases}개`);
  if (issues.length > 0) {
    console.log('발견된 이슈:', JSON.stringify(issues, null, 2));
  } else {
    console.log('✅ 전 문화권, 전 신분, 전 연령대에서 가구/소품 파묻힘(Clipping/Embedding) 0건! 완벽 무결 통과!');
  }

  await browser.close();
}

runComprehensiveAudit().catch(console.error);
