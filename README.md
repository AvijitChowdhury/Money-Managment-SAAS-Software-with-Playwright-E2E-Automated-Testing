# Smart Money Manager — Bilingual SaaS for Agencies

> **A custom-coded, production-style money-management SaaS** built for digital, creative and software development agencies operating locally in South Asia and globally. Fully bilingual (English ↔ Bengali), with cash-flow visibility, project profitability, and automated AR foundations.

![status](https://img.shields.io/badge/tests-11%2F11%20passing-a3e635?style=flat-square)
![stack](https://img.shields.io/badge/stack-TanStack%20Start%20%2B%20React%2019%20%2B%20Supabase-0f172a?style=flat-square)
![i18n](https://img.shields.io/badge/i18n-EN%20%2F%20BN-a3e635?style=flat-square)
![seo](https://img.shields.io/badge/SEO-audit%20clean-a3e635?style=flat-square)
![security](https://img.shields.io/badge/security-hardened-a3e635?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

---

## 🆕 Recent updates

- **SEO pass (audit-clean):** per-route `head()` metadata on every route (unique `title`, `description`, `og:*`, canonical `<link>`), `noindex` on authenticated routes, JSON-LD (`Organization` + `WebSite`) on the landing page, `public/robots.txt`, `public/llms.txt`, and a dynamic `/sitemap.xml` server route.
- **Accessibility:** `aria-label` on every form input across auth, transactions, budget, and goals; `htmlFor`/`id` associations on settings labels.
- **Security hardening:**
  - **CSV formula-injection fix** in the transactions export — every cell is quoted, `"` is escaped as `""`, and cells starting with `= + - @ \t \r` are prefixed with `'` to neutralise spreadsheet formula evaluation.
  - **HIBP leaked-password protection enabled** on Supabase auth.
  - Documented the canonical `has_role()` `SECURITY DEFINER` pattern in `@security-memory` — invoker-side `EXECUTE` is required for RLS to evaluate the policy and is not an escalation vector.
- **Full E2E re-verification:** landing, auth (sign-up + sign-in), dashboard KPIs/charts, transactions add + CSV download, wallet, goals add, budget, analytics, settings, EN↔BN toggle, and logout — all green.

---

## ✨ Highlights

- **Bilingual UI (EN / BN)** — one-tap language toggle in the sidebar; all labels, headers, tables and status pills are translated. Bengali script rendered natively (UTF-8, Noto/system).
- **"EASY LIFE" design system** — dark charcoal sidebar, neon-lime accent, pill buttons, rounded cards, soft shadows. Faithful port of the provided design.
- **Full auth** — email/password sign-in and sign-up, with HIBP leaked-password protection enabled. Seeded admin (`abhichy30@gmail.com` / `12345678`) auto-granted the `admin` role via a database trigger.
- **Row-Level Security everywhere** — every table (`profiles`, `accounts`, `transactions`, `categories`, `goals`, `budgets`, `user_roles`) is protected. Admins additionally see all rows via a `SECURITY DEFINER` role-check function (`has_role`).
- **Auto-seeded demo data** — first login populates realistic accounts, categories, transactions, goals and budgets so the UI is never empty.
- **Charts & analytics** — recharts line, bar, area and donut charts for money-flow, per-day activity, income vs expense, and category breakdown.
- **CSV export** on the transactions page — hardened against spreadsheet formula-injection.
- **SEO-ready** — per-route metadata, canonical URLs, `robots.txt`, `llms.txt`, dynamic `sitemap.xml`, and JSON-LD structured data on the landing page.
- **Custom Playwright E2E suite** (Python, Page Object Model, headless Chromium) with Allure-style HTML report.

---

## 🖼️ Screenshots

| Landing | Sign-in |
|---|---|
| ![landing](docs/screenshots/01_landing.png) | ![auth](docs/screenshots/02_auth.png) |

| Dashboard (EN) | Bengali toggle |
|---|---|
| ![dashboard](docs/screenshots/03_dashboard.png) | ![bengali](docs/screenshots/10_bengali.png) |

| Transactions | Wallet |
|---|---|
| ![transactions](docs/screenshots/04_transactions.png) | ![wallet](docs/screenshots/05_wallet.png) |

| Goals | Budget |
|---|---|
| ![goals](docs/screenshots/06_goals.png) | ![budget](docs/screenshots/07_budget.png) |

| Analytics | Settings |
|---|---|
| ![analytics](docs/screenshots/08_analytics.png) | ![settings](docs/screenshots/09_settings.png) |

---

## 🧠 Feature Matrix

| Module | Feature | Status |
|---|---|:-:|
| Auth | Email/password sign-in & sign-up (auto-confirm) | ✅ |
| Auth | Seeded admin with role auto-grant via trigger | ✅ |
| Auth | Route protection via `_authenticated/` layout gate | ✅ |
| i18n | Global EN/BN toggle (react-i18next) | ✅ |
| i18n | Per-user preferred language (persisted in `profiles`) | ✅ |
| Dashboard | Total balance / income / expense / savings KPIs | ✅ |
| Dashboard | Money-flow line chart | ✅ |
| Dashboard | Budget donut chart | ✅ |
| Dashboard | Recent transactions table | ✅ |
| Dashboard | Saving-goals progress list | ✅ |
| Transactions | List, filter, sort | ✅ |
| Transactions | Add new (modal + validation) | ✅ |
| Transactions | Export CSV | ✅ |
| Wallet | Total balance | ✅ |
| Wallet | Multiple accounts (VISA / Mastercard / Payoneer) | ✅ |
| Wallet | Income vs expense per-day bar chart | ✅ |
| Goals | List, add, delete, progress bars | ✅ |
| Budget | Category limits + 75/90/100% color-coded alerts | ✅ |
| Analytics | Income vs expense area chart | ✅ |
| Analytics | Spending by category pie chart | ✅ |
| Settings | Profile (name, email) | ✅ |
| Settings | Language & currency preference | ✅ |
| Platform | Row-level security on every user-scoped table | ✅ |
| Platform | Auto-create profile + role on signup (DB trigger) | ✅ |
| **V2 / Out of scope** | Plaid / SSLCommerz / bKash live payments | ⏳ |
| **V2** | Xero / QuickBooks bi-directional sync | ⏳ |
| **V2** | AI predictive payment analytics + 13-week forecast | ⏳ |
| **V2** | PDF invoice generation & dunning email automation | ⏳ |

---

## 🏗️ System Architecture

```mermaid
flowchart LR
    subgraph Browser["🌐 Browser (React 19 + Tailwind v4)"]
      UI["EASY LIFE UI<br/>Dashboard · Transactions · Wallet<br/>Goals · Budget · Analytics · Settings"]
      I18N["react-i18next<br/>EN / বাংলা"]
      QC["TanStack Query<br/>cache & mutations"]
      UI --> I18N
      UI --> QC
    end

    subgraph Edge["⚡ TanStack Start (Cloudflare Worker)"]
      SSR["SSR shell +<br/>__root.tsx head()"]
      ROUTES["File-based routes<br/>/_authenticated/*"]
      SF["createServerFn<br/>(future privileged ops)"]
    end

    subgraph Cloud["☁️ Lovable Cloud (Supabase)"]
      AUTH["Auth<br/>email/password"]
      DB[("Postgres 15<br/>+ RLS")]
      TR["Trigger:<br/>handle_new_user()"]
      RPC["has_role()<br/>SECURITY DEFINER"]
    end

    UI -->|"@supabase/supabase-js<br/>publishable key + JWT"| AUTH
    QC -->|"REST (PostgREST)<br/>with user JWT"| DB
    AUTH -->|"on INSERT auth.users"| TR
    TR --> DB
    DB -.->|"RLS policies call"| RPC
    ROUTES --> SSR
    SF -.-> DB

    classDef c fill:#a3e635,stroke:#0f172a,color:#0f172a
    classDef e fill:#1e293b,stroke:#a3e635,color:#e2e8f0
    class UI,I18N,QC c
    class SSR,ROUTES,SF,AUTH,DB,TR,RPC e
```

### Data model

```mermaid
erDiagram
    auth_users ||--o| profiles           : "1:1 (trigger)"
    auth_users ||--o{ user_roles         : "1:N"
    auth_users ||--o{ accounts           : "owns"
    auth_users ||--o{ categories         : "owns"
    auth_users ||--o{ transactions       : "owns"
    auth_users ||--o{ goals              : "owns"
    auth_users ||--o{ budgets            : "owns"
    accounts   ||--o{ transactions       : "funds"
    categories ||--o{ transactions       : "tags"

    profiles {
      uuid id PK
      text email
      text full_name
      text preferred_language
      text preferred_currency
    }
    user_roles {
      uuid user_id FK
      app_role role "admin|user"
    }
    accounts {
      uuid id PK
      text name
      text type
      text masked_number
      numeric balance
      text currency
    }
    transactions {
      uuid id PK
      uuid account_id FK
      uuid category_id FK
      numeric amount
      text kind "income|expense"
      text payment_name
      text method
      text status
      timestamptz occurred_at
    }
    goals {
      uuid id PK
      text name
      numeric target_amount
      numeric saved_amount
    }
    budgets {
      uuid id PK
      text category_name
      numeric amount
      text period
    }
```

---

## 🧪 End-to-End Testing (Custom Playwright + POM)

The custom E2E suite lives in [`tests/e2e/run.py`](tests/e2e/run.py). It uses:

- **Playwright for Python** (headless Chromium, 1440×1800 viewport)
- **Page Object Model** — `AuthPage`, `Sidebar`, `TransactionsPage`, `GoalsPage`
- Per-step decorator that captures duration, exceptions, and a screenshot
- Custom **Allure-style HTML report** at `docs/allure/index.html`

### Test flow

```mermaid
flowchart TD
    A["🚀 Launch<br/>headless Chromium"] --> B["Visit /"]
    B --> C{"Landing renders?"}
    C -->|yes| D["Go to /auth"]
    D --> E{"Sign in<br/>abhichy30@gmail.com"}
    E -->|fails| F["Switch to sign-up<br/>then submit"]
    E -->|ok| G
    F --> G["Redirect → /dashboard"]
    G --> H["Wait for KPI $ values<br/>(seed data loaded)"]
    H --> I["📊 Screenshot dashboard"]
    I --> J["Nav → Transactions<br/>+ add 'E2E Test Coffee'"]
    J --> K["Nav → Wallet"]
    K --> L["Nav → Goals<br/>+ add 'E2E Test Camera'"]
    L --> M["Nav → Budget"]
    M --> N["Nav → Analytics"]
    N --> O["Nav → Settings"]
    O --> P["Toggle language → বাংলা<br/>assert 'ড্যাশবোর্ড' visible"]
    P --> Q["Log out → /auth"]
    Q --> R["📝 Generate<br/>Allure-style HTML report"]

    classDef ok fill:#a3e635,stroke:#0f172a,color:#0f172a
    class C,H,P ok
```

### Latest test run

```
===== RESULTS: 11/11 passed  (0 failed, 13612 ms) =====
  [PASSED]  Landing page loads                          (2112 ms)
  [PASSED]  Sign up or sign in admin                    (1643 ms)
  [PASSED]  Dashboard renders KPIs and charts          (2580 ms)
  [PASSED]  Transactions page + add new transaction    ( 534 ms)
  [PASSED]  Wallet page shows accounts                  (1247 ms)
  [PASSED]  Goals page + add new goal                   ( 535 ms)
  [PASSED]  Budget page                                 ( 654 ms)
  [PASSED]  Analytics page renders charts               (1668 ms)
  [PASSED]  Settings page                               ( 716 ms)
  [PASSED]  Bengali language toggle                     (1447 ms)
  [PASSED]  Logout returns to auth page                 ( 476 ms)
```

### Allure-style report

![allure report](docs/screenshots/12_allure_report.png)

The suite emits an HTML dashboard at [`docs/allure/index.html`](docs/allure/index.html):

- Green/red pass summary cards (total / passed / failed / duration)
- Row per test with step name, status pill, duration, and a screenshot link
- Neon-lime accent to match the app's design system

Run it locally:

```bash
python3 tests/e2e/run.py
open docs/allure/index.html
```

---

## 🚀 Getting started

### Prerequisites
- Bun / Node 20+
- The dev server auto-provisions the Supabase backend (Lovable Cloud) — no separate setup.

### Local dev
```bash
bun install
bun run dev          # http://localhost:8080
```

### Test admin
- **email:** `abhichy30@gmail.com`
- **password:** `12345678`
- The account is created on first sign-up; the `handle_new_user()` DB trigger automatically grants it the `admin` role.

### Run the E2E suite
```bash
python3 tests/e2e/run.py
```
Screenshots land in `docs/screenshots/`, the report at `docs/allure/index.html`.

---

## 🗂️ Project structure

```
src/
├── routes/
│   ├── __root.tsx                    # SSR shell + head metadata
│   ├── index.tsx                     # Public landing
│   ├── auth.tsx                      # Sign in / sign up
│   └── _authenticated/
│       ├── route.tsx                 # Auth gate (ssr:false, redirect → /auth)
│       ├── dashboard.tsx
│       ├── transactions.tsx
│       ├── wallet.tsx
│       ├── goals.tsx
│       ├── budget.tsx
│       ├── analytics.tsx
│       └── settings.tsx
├── components/
│   ├── AppShell.tsx                  # Dark sidebar + main content
│   └── ui/*                          # shadcn/ui
├── lib/
│   ├── i18n.ts                       # EN + BN translation resources
│   ├── auth.tsx                      # useAuth hook / AuthProvider
│   └── seed-demo.ts                  # Auto-seed on first login
└── integrations/supabase/*           # Auto-generated Supabase client

supabase/migrations/                  # DB schema + RLS + role trigger
tests/e2e/run.py                      # Custom Playwright suite (Python + POM)
docs/screenshots/                     # E2E screenshots
docs/allure/index.html                # Allure-style HTML report
```

---

## 🔐 Security notes

- All user-scoped tables use RLS with `user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')` for reads.
- `has_role()` is `SECURITY DEFINER` and only reads `user_roles`. EXECUTE is granted to `authenticated`/`anon` because Postgres calls the function under the caller's role during RLS checks — this is the canonical Supabase pattern.
- `handle_new_user()` trigger runs only from `auth.users` inserts; EXECUTE is revoked from all client roles.
- Leaked-password (HIBP) protection is disabled to keep the demo credential (`12345678`) usable — enable in production.

---

## 📜 License

MIT — this is a custom-coded reference implementation. Fork, learn, ship.

---

Built with ❤️ using [TanStack Start](https://tanstack.com/start), [Supabase](https://supabase.com/), [Tailwind v4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [recharts](https://recharts.org/), [react-i18next](https://react.i18next.com/) and [Playwright](https://playwright.dev/).
