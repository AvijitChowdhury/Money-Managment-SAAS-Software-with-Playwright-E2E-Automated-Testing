import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { LayoutDashboard, ArrowLeftRight, Wallet, Target, PieChart, BarChart3, Settings, HelpCircle, LogOut, Languages } from "lucide-react";
import { useAuth } from "@/lib/auth";
import i18n from "@/lib/i18n";
import { useState, useEffect } from "react";

const NAV: { to: string; key: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { to: "/dashboard", key: "dashboard", icon: LayoutDashboard },
  { to: "/transactions", key: "transactions", icon: ArrowLeftRight },
  { to: "/wallet", key: "wallet", icon: Wallet },
  { to: "/goals", key: "goals", icon: Target },
  { to: "/budget", key: "budget", icon: PieChart },
  { to: "/analytics", key: "analytics", icon: BarChart3 },
  { to: "/settings", key: "settings", icon: Settings },
];

export function AppShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [lang, setLang] = useState<string>(i18n.language || "en");

  useEffect(() => {
    setLang(i18n.language);
  }, []);

  const toggleLang = () => {
    const next = lang === "en" ? "bn" : "en";
    i18n.changeLanguage(next);
    if (typeof window !== "undefined") localStorage.setItem("lang", next);
    setLang(next);
  };

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground p-5 gap-2 sticky top-0 h-screen">
        <div className="px-2 py-3 mb-4">
          <div className="text-xl font-bold tracking-tight text-lime">{t("brand")}</div>
        </div>
        <nav className="flex flex-col gap-1 flex-1" data-testid="sidebar-nav">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                data-testid={`nav-${item.key}`}
                className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-lime text-lime-foreground font-semibold"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(`nav.${item.key}`)}
              </Link>
            );
          })}
        </nav>
        <div className="flex flex-col gap-1 pt-4 border-t border-sidebar-border">
          <button
            onClick={toggleLang}
            data-testid="lang-toggle"
            className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent"
          >
            <Languages className="h-4 w-4" />
            {lang === "en" ? "বাংলা" : "English"}
          </button>
          <a href="#" className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent">
            <HelpCircle className="h-4 w-4" /> {t("nav.help")}
          </a>
          <button
            data-testid="logout-btn"
            onClick={async () => {
              await signOut();
              navigate({ to: "/auth" });
            }}
            className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm text-sidebar-foreground/80 hover:bg-sidebar-accent text-left"
          >
            <LogOut className="h-4 w-4" /> {t("nav.logout")}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-10 max-w-[1400px]">
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="page-title">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </header>
        {children}
      </main>
    </div>
  );
}
