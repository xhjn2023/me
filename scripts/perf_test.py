"""页面加载性能测试脚本"""
from playwright.sync_api import sync_playwright
import time

BASE = "http://localhost:5173/me/"

def test_page_load(name, url, description=""):
    print(f"\n{'='*60}")
    print(f"测试: {name}")
    print(f"URL:  {url}")
    if description:
        print(f"说明: {description}")
    print(f"{'='*60}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # 收集控制台日志
        console_logs = []
        page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))

        # 测量加载时间
        start = time.time()
        page.goto(url, wait_until="domcontentloaded")
        dom_ready = (time.time() - start) * 1000

        page.wait_for_load_state("networkidle", timeout=30000)
        network_idle = (time.time() - start) * 1000

        # 截图
        page.screenshot(path=f"scripts/screenshots/{name.replace(' ', '_')}.png", full_page=True)

        # 获取性能指标
        perf = page.evaluate("""() => {
            const nav = performance.getEntriesByType('navigation')[0];
            const paint = performance.getEntriesByType('paint');
            const resources = performance.getEntriesByType('resource');
            const jsResources = resources.filter(r => r.initiatorType === 'script');
            const jsNames = jsResources.map(r => r.name.split('/').pop());
            const jsSizes = jsResources.map(r => Math.round(r.transferSize / 1024));
            return {
                domContentLoaded: Math.round(nav?.domContentLoadedEventEnd || 0),
                loadComplete: Math.round(nav?.loadEventEnd || 0),
                jsCount: jsResources.length,
                jsTotalKB: jsSizes.reduce((a,b) => a+b, 0),
                jsChunks: jsNames.join(', '),
                jsSizes: jsSizes.join(', ')
            };
        }""")

        # 分析结果
        errors = [l for l in console_logs if '[error]' in l]
        warnings = [l for l in console_logs if '[warning]' in l]

        print(f"\n  加载计时:")
        print(f"    DOM 就绪:     {dom_ready:.0f}ms")
        print(f"    网络空闲:     {network_idle:.0f}ms")
        print(f"    DOMContentLoaded: {perf['domContentLoaded']}ms")
        print(f"    Load 完成:       {perf['loadComplete']}ms")

        print(f"\n  JS 资源:")
        print(f"    文件数:  {perf['jsCount']}")
        print(f"    总大小:  {perf['jsTotalKB']}KB")
        if perf['jsChunks']:
            chunks = perf['jsChunks'].split(', ')
            sizes = perf['jsSizes'].split(', ')
            for c, s in zip(chunks, sizes):
                print(f"      - {c}: {s}KB")

        print(f"\n  控制台:")
        print(f"    错误:   {len(errors)} 条")
        print(f"    警告:   {len(warnings)} 条")
        if errors:
            for e in errors[:5]:
                print(f"      ❌ {e}")
        if warnings:
            for w in warnings[:5]:
                print(f"      ⚠️  {w}")

        browser.close()
        return {
            "name": name,
            "domReady": dom_ready,
            "networkIdle": network_idle,
            "jsCount": perf['jsCount'],
            "jsTotalKB": perf['jsTotalKB'],
            "errors": len(errors),
            "warnings": len(warnings)
        }

# 执行测试
results = []

# 测试首页（Dashboard）
results.append(test_page_load(
    "首页-Dashboard",
    BASE,
    "验证首屏代码分割效果"
))

# 测试工作页（首次加载，会触发 lazy chunk）
results.append(test_page_load(
    "工作页-Work",
    BASE + "#work",
    "首次切换到工作页，触发 lazy chunk 加载"
))

# 汇总
print(f"\n{'='*60}")
print(f"汇总报告")
print(f"{'='*60}")
print(f"{'页面':<20} {'DOM(ms)':<10} {'网络空闲(ms)':<12} {'JS文件':<8} {'JS(KB)':<8} {'错误'}")
print(f"{'-'*70}")
for r in results:
    print(f"{r['name']:<20} {r['domReady']:<10.0f} {r['networkIdle']:<12.0f} {r['jsCount']:<8} {r['jsTotalKB']:<8} {r['errors']}")