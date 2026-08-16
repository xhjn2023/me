import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'http://localhost:5173/me/';
mkdirSync('scripts/screenshots', { recursive: true });

async function testPage(name, url, description) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`测试: ${name}`);
  console.log(`URL:  ${url}`);
  if (description) console.log(`说明: ${description}`);
  console.log(`${'='.repeat(60)}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  const start = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const domReady = Date.now() - start;

  await page.waitForLoadState('networkidle', { timeout: 30000 });
  const networkIdle = Date.now() - start;

  await page.screenshot({ path: `scripts/screenshots/${name.replace(/\s/g, '_')}.png`, fullPage: true });

  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const resources = performance.getEntriesByType('resource');
    const jsResources = resources.filter(r => r.initiatorType === 'script');
    const jsNames = jsResources.map(r => r.name.split('/').pop());
    const jsSizes = jsResources.map(r => Math.round(r.transferSize / 1024));
    return {
      domContentLoaded: Math.round(nav?.domContentLoadedEventEnd || 0),
      loadComplete: Math.round(nav?.loadEventEnd || 0),
      jsCount: jsResources.length,
      jsTotalKB: jsSizes.reduce((a, b) => a + b, 0),
      jsChunks: jsNames.join(', '),
      jsSizes: jsSizes.join(', ')
    };
  });

  const errors = consoleLogs.filter(l => l.includes('[error]'));
  const warnings = consoleLogs.filter(l => l.includes('[warning]'));

  console.log(`\n  加载计时:`);
  console.log(`    DOM 就绪:             ${domReady}ms`);
  console.log(`    网络空闲:             ${networkIdle}ms`);
  console.log(`    DOMContentLoaded:     ${perf.domContentLoaded}ms`);
  console.log(`    Load 完成:            ${perf.loadComplete}ms`);

  console.log(`\n  JS 资源:`);
  console.log(`    文件数:  ${perf.jsCount}`);
  console.log(`    总大小:  ${perf.jsTotalKB}KB`);
  if (perf.jsChunks) {
    const chunks = perf.jsChunks.split(', ');
    const sizes = perf.jsSizes.split(', ');
    chunks.forEach((c, i) => console.log(`      - ${c}: ${sizes[i]}KB`));
  }

  console.log(`\n  控制台:`);
  console.log(`    错误:   ${errors.length} 条`);
  console.log(`    警告:   ${warnings.length} 条`);
  if (errors.length) errors.slice(0, 5).forEach(e => console.log(`      ❌ ${e}`));
  if (warnings.length) warnings.slice(0, 5).forEach(w => console.log(`      ⚠️  ${w}`));

  await browser.close();
  return { name, domReady, networkIdle, jsCount: perf.jsCount, jsTotalKB: perf.jsTotalKB, errors: errors.length, warnings: warnings.length };
}

// 执行测试
const results = [];

results.push(await testPage('首页-Dashboard', BASE, '验证首屏代码分割效果'));
results.push(await testPage('工作页-Work', BASE + '#work', '首次切换到工作页，触发 lazy chunk 加载'));

// 汇总
console.log(`\n${'='.repeat(60)}`);
console.log(`汇总报告`);
console.log(`${'='.repeat(60)}`);
console.log(`${'页面'.padEnd(20)} ${'DOM(ms)'.padEnd(10)} ${'网络空闲(ms)'.padEnd(14)} ${'JS文件'.padEnd(8)} ${'JS(KB)'.padEnd(8)} 错误`);
console.log(`${'-'.repeat(70)}`);
for (const r of results) {
  console.log(`${r.name.padEnd(20)} ${String(r.domReady).padEnd(10)} ${String(r.networkIdle).padEnd(14)} ${String(r.jsCount).padEnd(8)} ${String(r.jsTotalKB).padEnd(8)} ${r.errors}`);
}