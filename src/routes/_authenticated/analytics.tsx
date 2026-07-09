import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Smart Money Manager" },
      { name: "description", content: "Income vs expense trends and spending breakdown by category for your agency finances." },
      { property: "og:title", content: "Analytics — Smart Money Manager" },
      { property: "og:description", content: "Trends and category breakdowns for agency finances." },
      { property: "og:url", content: "/analytics" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/analytics" }],
  }),
  component: AnalyticsPage,
});

const COLORS = ["#a3e635", "#f97316", "#3b82f6", "#eab308", "#ec4899", "#8b5cf6", "#14b8a6"];

function AnalyticsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: txns = [] } = useQuery({
    queryKey: ["analytics-txns", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from("transactions").select("*").order("occurred_at")).data ?? [],
  });

  const byMonth: Record<string, { m: string; income: number; expense: number }> = {};
  txns.forEach((tx) => {
    const d = new Date(tx.occurred_at);
    const k = d.toLocaleString("en", { month: "short" });
    byMonth[k] ??= { m: k, income: 0, expense: 0 };
    if (tx.kind === "income") byMonth[k].income += Number(tx.amount);
    else byMonth[k].expense += Number(tx.amount);
  });

  const byCat: Record<string, number> = {};
  txns.filter((x) => x.kind === "expense").forEach((x) => {
    const k = x.payment_name;
    byCat[k] = (byCat[k] ?? 0) + Number(x.amount);
  });
  const catData = Object.entries(byCat).map(([name, value]) => ({ name, value }));

  return (
    <AppShell title={t("analytics.title")} subtitle={t("analytics.subtitle")}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <div className="font-semibold mb-3">{t("analytics.incomeVsExpense")}</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={Object.values(byMonth)}>
                <XAxis dataKey="m" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="income" stroke="#a3e635" fill="#a3e635" fillOpacity={0.3} />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <div className="font-semibold mb-3">{t("analytics.byCategory")}</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={catData} innerRadius={55} outerRadius={100} dataKey="value" nameKey="name" label>
                  {catData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
