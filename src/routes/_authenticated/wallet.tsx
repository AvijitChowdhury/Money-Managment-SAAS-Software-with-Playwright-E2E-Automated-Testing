import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — Smart Money Manager" },
      { name: "description", content: "Account balances, cards and daily cash flow overview for your agency." },
      { property: "og:title", content: "Wallet — Smart Money Manager" },
      { property: "og:description", content: "Balances, cards and daily flow for your agency." },
      { property: "og:url", content: "/wallet" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/wallet" }],
  }),
  component: WalletPage,
});

function WalletPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from("accounts").select("*")).data ?? [],
  });
  const { data: txns = [] } = useQuery({
    queryKey: ["wallet-txns", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from("transactions").select("*").order("occurred_at", { ascending: false })).data ?? [],
  });

  const total = accounts.reduce((s, a) => s + Number(a.balance), 0);
  const byDay: Record<string, { d: string; income: number; expense: number }> = {};
  txns.forEach((tx) => {
    const d = new Date(tx.occurred_at).toLocaleDateString("en", { day: "2-digit" });
    byDay[d] ??= { d, income: 0, expense: 0 };
    if (tx.kind === "income") byDay[d].income += Number(tx.amount);
    else byDay[d].expense += Number(tx.amount);
  });

  return (
    <AppShell title={t("wallet.title")} subtitle={t("wallet.subtitle")}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-card border rounded-2xl p-5 shadow-sm">
          <div className="text-xs text-muted-foreground">{t("dashboard.totalBalance")}</div>
          <div className="mt-2 text-3xl font-bold">${total.toFixed(2)}</div>
        </div>
        <div className="lg:col-span-2 bg-card border rounded-2xl p-5 shadow-sm">
          <div className="font-semibold mb-3">{t("wallet.yourAccounts")}</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {accounts.map((a) => (
              <div key={a.id} className="bg-sidebar text-sidebar-foreground rounded-2xl p-4">
                <div className="text-xs opacity-70">{a.name}</div>
                <div className="text-xl font-bold mt-1">${Number(a.balance).toFixed(2)}</div>
                <div className="text-xs opacity-70 mt-2">{a.masked_number}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-5 shadow-sm mb-6">
        <div className="font-semibold mb-3">{t("wallet.overview")}</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={Object.values(byDay)}>
              <XAxis dataKey="d" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Bar dataKey="income" fill="#a3e635" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border rounded-2xl p-5 shadow-sm">
        <div className="font-semibold mb-3">{t("dashboard.recentTransactions")}</div>
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
            {txns.slice(0, 5).map((tx) => (
              <tr key={tx.id} className="border-b last:border-0">
                <td className="px-4 py-3">{new Date(tx.occurred_at).toLocaleDateString()}</td>
                <td className={`px-4 py-3 font-semibold ${tx.kind === "income" ? "text-lime-foreground" : "text-destructive"}`}>
                  {tx.kind === "income" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                </td>
                <td className="px-4 py-3">{tx.payment_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{tx.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
