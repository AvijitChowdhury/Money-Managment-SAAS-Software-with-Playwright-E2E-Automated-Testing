# Smart Money Manager — Build Plan

This PRD is very large. I'll build a working MVP that covers the core user-facing modules from the design specs, seed a demo admin, and produce the requested test + docs. Deep enterprise features (Plaid, bKash, Xero/QuickBooks sync, AI predictive analytics, 13-week forecasting engine) will be stubbed with clear UI placeholders — building real integrations is out of scope for a single iteration.

## Scope — In

1. **Backend ( Supabase)**
  - Enable Supabase.
  - Tables: `profiles`, `user_roles` (admin/user enum), `accounts`, `transactions`, `categories`, `goals`, `budgets`.
  - RLS: users see only their rows; admins see all via `has_role()`.
  - Seed admin user `abhichy30@gmail.com` / `12345678` via migration + seed demo data.
2. **Auth**
  - Email/password sign-in & sign-up (auto-confirm), `/auth` route.
  - Protected app under `_authenticated/`.
3. **App shell — "EASY LIFE" design system**
  - Dark charcoal sidebar, white content area, neon-lime accent, pill buttons, rounded 16–24px cards, soft shadows.
  - Sidebar: Dashboard, Transactions, Wallet, Goals, Budget, Analytics, Settings, Help, Log out.
  - Global EN/BN language toggle (react-i18next) — full UI translated.
4. **Pages**
  - **Dashboard**: total balance, income, expense, savings KPIs; money-flow line chart; budget donut; recent transactions; saving-goals list.
  - **Transactions**: filterable table (date range, type, category, method, status), add-new modal, CSV export.
  - **Wallet**: total balance, account cards (VISA / Mastercard / Payoneer), income vs expense chart, recent transactions.
  - **Goals**: goal cards with progress bars, add/edit/delete.
  - **Budget**: category budgets with progress + alerts at 75/90/100%.
  - **Analytics**: income/expense trends, category breakdown (recharts).
  - **Settings**: profile, language, currency.
5. **Testing & Docs**
  - Playwright Python E2E script under `tests/e2e/` covering: login as admin → visit each page → add a transaction → add a goal → toggle to Bengali → logout.
  - Capture screenshots into `docs/screenshots/`.
  - Generate a placeholder "allure-style" HTML report screenshot (real Allure runner isn't installed in-sandbox; I'll produce an HTML summary + screenshots that mirror Allure's layout).
  - **README.md**: project overview, features, tech stack, screenshots gallery, mermaid **system architecture diagram**, mermaid **E2E testing flow diagram**, test report screenshots, setup instructions.

## Scope — Out (documented in README as V2)

Plaid / bKash / SSLCommerz / Stripe live payments, Xero/QuickBooks sync, AI predictive payment analytics, 13-week rolling forecast engine, dunning email automation, PDF invoice generation, multi-tenant agency org model. Build these later on request.

## Technical notes

- Stack: Nextjs + React 19 + Tailwind v4 + shadcn + Supabase+ recharts + react-i18next.
- Currency: single-user preference (USD default; BDT selectable). No FX conversion in MVP.
- Seed demo transactions/accounts/goals for the admin account so the UI is populated on first login.
- Test runs via `python tests/e2e/run.py` against `http://localhost:8080` using the pre-installed Playwright. Use Page object model

Reply "go" to proceed and I'll implement end-to-end.