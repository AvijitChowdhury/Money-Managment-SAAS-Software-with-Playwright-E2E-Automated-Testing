"""End-to-end Playwright test for Smart Money Manager.

Uses Page Object Model. Signs up the admin (idempotent — falls back to sign-in
if the account already exists), then walks every page, adds a transaction,
adds a goal, toggles Bengali, and signs out. All screenshots go to
docs/screenshots/ and a small allure-style HTML report is produced at
docs/allure/index.html.
"""

import asyncio, json, os, time, traceback
from pathlib import Path
from playwright.async_api import async_playwright, Page, expect

ROOT = Path(__file__).resolve().parents[2]
SHOTS = ROOT / "docs" / "screenshots"
ALLURE = ROOT / "docs" / "allure"
SHOTS.mkdir(parents=True, exist_ok=True)
ALLURE.mkdir(parents=True, exist_ok=True)

BASE = "http://localhost:8080"
ADMIN_EMAIL = "abhichy30@gmail.com"
ADMIN_PASS = "12345678"


class AuthPage:
    def __init__(self, page: Page):
        self.page = page

    async def goto(self):
        await self.page.goto(f"{BASE}/auth", wait_until="domcontentloaded")

    async def sign_in(self, email: str, password: str):
        await self.page.fill('[data-testid=email-input]', email)
        await self.page.fill('[data-testid=password-input]', password)
        await self.page.click('[data-testid=submit-btn]')

    async def switch_to_signup(self):
        await self.page.click('[data-testid=toggle-mode]')


class Sidebar:
    def __init__(self, page: Page):
        self.page = page

    async def go(self, key: str):
        await self.page.click(f'[data-testid=nav-{key}]')
        await self.page.wait_for_load_state("networkidle")

    async def toggle_language(self):
        await self.page.click('[data-testid=lang-toggle]')

    async def logout(self):
        await self.page.click('[data-testid=logout-btn]')


class TransactionsPage:
    def __init__(self, page: Page):
        self.page = page

    async def add(self, name: str, amount: str, kind: str = "expense"):
        await self.page.click('[data-testid=add-txn-btn]')
        await self.page.fill('[data-testid=txn-name]', name)
        await self.page.fill('[data-testid=txn-amount]', amount)
        await self.page.select_option('[data-testid=txn-kind]', kind)
        await self.page.click('[data-testid=txn-submit]')
        await self.page.wait_for_selector(f'text={name}', timeout=8000)


class GoalsPage:
    def __init__(self, page: Page):
        self.page = page

    async def add(self, name: str, target: str):
        await self.page.click('[data-testid=add-goal-btn]')
        await self.page.fill('[data-testid=goal-name]', name)
        await self.page.fill('[data-testid=goal-target]', target)
        await self.page.click('[data-testid=goal-submit]')
        await self.page.wait_for_selector(f'text={name}', timeout=8000)


results: list[dict] = []


def step(name: str):
    def deco(fn):
        async def wrapper(page, *args, **kwargs):
            t0 = time.time()
            entry = {"name": name, "status": "passed", "duration_ms": 0, "error": None, "screenshot": None}
            try:
                shot = await fn(page, *args, **kwargs)
                entry["screenshot"] = shot
            except Exception as e:
                entry["status"] = "failed"
                entry["error"] = f"{type(e).__name__}: {e}\n{traceback.format_exc()}"
                try:
                    slug = name.lower().replace(" ", "_").replace("+", "").replace("/", "")[:40]
                    fpath = SHOTS / f"FAIL_{slug}.png"
                    await page.screenshot(path=str(fpath))
                    entry["screenshot"] = str(fpath.relative_to(ROOT))
                except Exception:
                    pass
                print(f"[FAIL] {name}\n{entry['error']}")
            finally:
                entry["duration_ms"] = int((time.time() - t0) * 1000)
                results.append(entry)
            return entry["status"] == "passed"
        return wrapper
    return deco


async def screenshot(page: Page, name: str) -> str:
    path = SHOTS / f"{name}.png"
    await page.screenshot(path=str(path))
    return str(path.relative_to(ROOT))


@step("Landing page loads")
async def test_landing(page: Page):
    await page.goto(BASE, wait_until="domcontentloaded")
    await expect(page.get_by_text("Smart Money Manager for Agencies")).to_be_visible()
    return await screenshot(page, "01_landing")


@step("Sign up or sign in admin")
async def test_auth(page: Page):
    auth = AuthPage(page)
    await auth.goto()
    # Try sign in first
    await auth.sign_in(ADMIN_EMAIL, ADMIN_PASS)
    try:
        await page.wait_for_url("**/dashboard", timeout=5000)
    except Exception:
        # fall back to sign up
        await auth.goto()
        await auth.switch_to_signup()
        await page.fill('input[placeholder="Full name"]', "Abhi Admin")
        await auth.sign_in(ADMIN_EMAIL, ADMIN_PASS)
        await page.wait_for_url("**/dashboard", timeout=15000)
    return await screenshot(page, "02_auth")


@step("Dashboard renders KPIs and charts")
async def test_dashboard(page: Page):
    await page.wait_for_selector('[data-testid=kpi-row]')
    await page.wait_for_timeout(1500)  # let charts render
    return await screenshot(page, "03_dashboard")


@step("Transactions page + add new transaction")
async def test_transactions(page: Page):
    await Sidebar(page).go("transactions")
    await TransactionsPage(page).add("E2E Test Coffee", "12.50", "expense")
    return await screenshot(page, "04_transactions")


@step("Wallet page shows accounts")
async def test_wallet(page: Page):
    await Sidebar(page).go("wallet")
    await page.wait_for_timeout(1000)
    return await screenshot(page, "05_wallet")


@step("Goals page + add new goal")
async def test_goals(page: Page):
    await Sidebar(page).go("goals")
    await GoalsPage(page).add("E2E Test Camera", "999")
    return await screenshot(page, "06_goals")


@step("Budget page")
async def test_budget(page: Page):
    await Sidebar(page).go("budget")
    await page.wait_for_timeout(500)
    return await screenshot(page, "07_budget")


@step("Analytics page renders charts")
async def test_analytics(page: Page):
    await Sidebar(page).go("analytics")
    await page.wait_for_timeout(1500)
    return await screenshot(page, "08_analytics")


@step("Settings page")
async def test_settings(page: Page):
    await Sidebar(page).go("settings")
    await page.wait_for_timeout(500)
    return await screenshot(page, "09_settings")


@step("Bengali language toggle")
async def test_bengali(page: Page):
    await Sidebar(page).go("dashboard")
    await Sidebar(page).toggle_language()
    await page.wait_for_timeout(800)
    # sidebar should now show Bengali label for Dashboard
    text = await page.locator('[data-testid=nav-dashboard]').inner_text()
    assert "ড্যাশবোর্ড" in text, f"Expected Bengali label, got {text!r}"
    shot = await screenshot(page, "10_bengali")
    # switch back to english
    await Sidebar(page).toggle_language()
    return shot


@step("Logout returns to auth page")
async def test_logout(page: Page):
    await Sidebar(page).logout()
    await page.wait_for_url("**/auth", timeout=8000)
    return await screenshot(page, "11_logout")


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1440, "height": 1800})
        page = await context.new_page()

        await test_landing(page)
        await test_auth(page)
        await test_dashboard(page)
        await test_transactions(page)
        await test_wallet(page)
        await test_goals(page)
        await test_budget(page)
        await test_analytics(page)
        await test_settings(page)
        await test_bengali(page)
        await test_logout(page)

        await browser.close()

    passed = sum(1 for r in results if r["status"] == "passed")
    failed = sum(1 for r in results if r["status"] == "failed")
    total_ms = sum(r["duration_ms"] for r in results)

    # Write JSON report
    (ALLURE / "results.json").write_text(json.dumps(results, indent=2))

    # Write a small Allure-style HTML dashboard
    rows_html = "\n".join(
        f'''<tr class="{r["status"]}">
              <td>{i+1}</td>
              <td>{r["name"]}</td>
              <td><span class="pill {r["status"]}">{r["status"].upper()}</span></td>
              <td>{r["duration_ms"]} ms</td>
              <td>{"<a href='../" + r["screenshot"] + "' target='_blank'>view</a>" if r["screenshot"] else ""}</td>
            </tr>'''
        for i, r in enumerate(results)
    )
    html = f"""<!doctype html><html><head><meta charset="utf-8">
<title>Allure Report — Smart Money Manager</title>
<style>
body{{font-family:system-ui,sans-serif;margin:0;background:#0f172a;color:#e2e8f0}}
header{{background:#a3e635;color:#0f172a;padding:24px 32px}}
header h1{{margin:0;font-size:22px}}
.summary{{display:flex;gap:16px;padding:24px 32px}}
.card{{background:#1e293b;border-radius:14px;padding:16px 20px;min-width:140px}}
.card b{{display:block;font-size:28px;margin-top:6px}}
table{{width:calc(100% - 64px);margin:0 32px 32px;border-collapse:collapse;background:#1e293b;border-radius:12px;overflow:hidden}}
th,td{{padding:12px 16px;text-align:left;border-bottom:1px solid #334155;font-size:14px}}
th{{background:#334155;font-weight:600}}
.pill{{padding:3px 10px;border-radius:9999px;font-size:11px;font-weight:700}}
.pill.passed{{background:#a3e635;color:#0f172a}}
.pill.failed{{background:#ef4444;color:#fff}}
tr.failed td{{color:#fca5a5}}
a{{color:#a3e635}}
</style></head><body>
<header><h1>Allure Report — Smart Money Manager (E2E)</h1>
<div style="font-size:12px;opacity:.8">Playwright · Page Object Model · Bilingual UI · {time.strftime('%Y-%m-%d %H:%M:%S')}</div></header>
<section class="summary">
  <div class="card">Total<b>{len(results)}</b></div>
  <div class="card">Passed<b style="color:#a3e635">{passed}</b></div>
  <div class="card">Failed<b style="color:#ef4444">{failed}</b></div>
  <div class="card">Duration<b>{total_ms} ms</b></div>
</section>
<table><thead><tr><th>#</th><th>Test</th><th>Status</th><th>Duration</th><th>Screenshot</th></tr></thead>
<tbody>{rows_html}</tbody></table>
</body></html>"""
    (ALLURE / "index.html").write_text(html)

    print(f"\n===== RESULTS: {passed}/{len(results)} passed  ({failed} failed, {total_ms} ms) =====")
    for r in results:
        print(f"  [{r['status'].upper():6}]  {r['name']}  ({r['duration_ms']} ms)")

    return 0 if failed == 0 else 1


if __name__ == "__main__":
    import sys
    sys.exit(asyncio.run(main()))
