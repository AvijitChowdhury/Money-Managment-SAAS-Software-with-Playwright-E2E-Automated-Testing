import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { seedDemoDataIfEmpty } from "@/lib/seed-demo";
import { useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";
import { TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Smart Money Manager" },
      { name: "description", content: "Overview of balances, income, expenses, savings goals and recent transactions for your agency." },
      { property: "og:title", content: "Dashboard — Smart Money Manager" },
      { property: "og:description", content: "Agency finance overview at a glance." },
      { property: "og:url", content: "/dashboard" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/dashboard" }],
  }),
  component: Dashboard,
});

const CATEGORY_COLORS = ["#a3e635", "#f97316", "#3b82f6", "#eab308", "#ec4899", "#8b5cf6"];

function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) seedDemoDataIfEmpty(user.id).catch(console.error);
  }, [user?.id]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  const { data: txns = [] } = useQuery({
    queryKey: ["dashboard-txns", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("transactions").select("*").order("occurred_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["dashboard-goals", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("goals").select("*");
      return data ?? [];
    },
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ["dashboard-accts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("accounts").select("*");
      return data ?? [];
    },
  });

  const income = txns.filter((x) => x.kind === "income").reduce((s, x) => s + Number(x.amount), 0);
  const expense = txns.filter((x) => x.kind === "expense").reduce((s, x) => s + Number(x.amount), 0);
  const totalBalance = accounts.reduce((s, x) => s + Number(x.balance), 0);
  const totalSavings = goals.reduce((s, x) => s + Number(x.saved_amount), 0);

  // Monthly flow buckets
  const byMonth: Record<string, { m: string; income: number; expense: number }> = {};
  txns.forEach((tx) => {
    const d = new Date(tx.occurred_at);
    const key = d.toLocaleString("default", { month: "short" });
    byMonth[key] ??= { m: key, income: 0, expense: 0 };
    if (tx.kind === "income") byMonth[key].income += Number(tx.amount);
    else byMonth[key].expense += Number(tx.amount);
  });
  const flow = Object.values(byMonth);

  const byCat: Record<string, number> = {};
  txns.filter((x) => x.kind === "expense").forEach((x) => {
    const k = x.method?.split(" ")[0] ?? "Other";
    byCat[k] = (byCat[k] ?? 0) + Number(x.amount);
  });
  const catData = Object.entries(byCat).map(([name, value]) => ({ name, value }));

  const currency = profile?.preferred_currency ?? "USD";
  const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);

  return (
    <AppShell
      title={`${t("dashboard.welcome")}, ${profile?.full_name ?? user?.email?.split("@")[0] ?? ""}!`}
      subtitle={t("tagline")}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6" data-testid="kpi-row">
        {[
          { label: t("dashboard.totalBalance"), value: totalBalance, up: 18.2 },
          { label: t("dashboard.income"), value: income, up: 9.8 },
          { label: t("dashboard.expense"), value: expense, up: 11, negative: true },
          { label: t("dashboard.totalSavings"), value: totalSavings, up: 6.7 },
        ].map((k) => (
          <div key={k.label} className="bg-card border rounded-2xl p-5 shadow-sm">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="mt-2 text-2xl font-bold">{fmt(k.value)}</div>
            <div className={`mt-1 inline-flex items-center gap-1 text-xs ${k.negative ? "text-destructive" : "text-lime-foreground"} bg-lime/60 px-2 py-0.5 rounded-full`}>
              <TrendingUp className="h-3 w-3" /> {k.up}% {t("dashboard.vsLastMonth")}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-card border rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="font-semibold">{t("dashboard.moneyFlow")}</div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={flow}>
                <XAxis dataKey="m" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="income" stroke="#a3e635" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <div className="font-semibold mb-4">{t("dashboard.budget")}</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catData} innerRadius={55} outerRadius={90} dataKey="value" nameKey="name">
                  {catData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border rounded-2xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <div className="font-semibold">{t("dashboard.recentTransactions")}</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-lime text-lime-foreground">
                  <th className="text-left px-4 py-2 rounded-l-full">{t("transactions.date")}</th>
                  <th className="text-left px-4 py-2">{t("transactions.amount")}</th>
                  <th className="text-left px-4 py-2">{t("transactions.paymentName")}</th>
                  <th className="text-left px-4 py-2 rounded-r-full">{t("transactions.method")}</th>
                </tr>
              </thead>
              <tbody>
                {txns.slice(0, 6).map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0">
                    <td className="px-4 py-3">{new Date(tx.occurred_at).toLocaleDateString()}</td>
                    <td className={`px-4 py-3 font-semibold ${tx.kind === "income" ? "text-lime-foreground" : "text-destructive"}`}>
                      {tx.kind === "income" ? "+" : "-"}{fmt(Number(tx.amount))}
                    </td>
                    <td className="px-4 py-3">{tx.payment_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{tx.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <div className="font-semibold mb-4">{t("dashboard.savingGoals")}</div>
          <div className="flex flex-col gap-4">
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((Number(g.saved_amount) / Number(g.target_amount)) * 100));
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">{g.name}</span>
                    <span className="text-muted-foreground">{fmt(Number(g.target_amount))} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-lime" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
