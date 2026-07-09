import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — Smart Money Manager" },
      { name: "description", content: "Log, filter and export your agency's income and expense transactions." },
      { property: "og:title", content: "Transactions — Smart Money Manager" },
      { property: "og:description", content: "Agency transaction ledger with CSV export." },
      { property: "og:url", content: "/transactions" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/transactions" }],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ payment_name: "", amount: "", kind: "expense", method: "VISA * 4511", status: "successful" });

  const { data: txns = [] } = useQuery({
    queryKey: ["txns", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase.from("transactions").select("*").order("occurred_at", { ascending: false });
      return data ?? [];
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("transactions").insert({
      user_id: user!.id,
      payment_name: form.payment_name,
      amount: Number(form.amount),
      kind: form.kind,
      method: form.method,
      status: form.status,
      occurred_at: new Date().toISOString(),
    });
    if (error) return toast.error(error.message);
    toast.success("Transaction added");
    setOpen(false);
    setForm({ payment_name: "", amount: "", kind: "expense", method: "VISA * 4511", status: "successful" });
    qc.invalidateQueries({ queryKey: ["txns"] });
    qc.invalidateQueries({ queryKey: ["dashboard-txns"] });
  };

  const exportCsv = () => {
    const csvCell = (v: unknown) => {
      const s = v == null ? "" : String(v);
      const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const header = ["date", "amount", "kind", "payment_name", "method", "status"].map(csvCell).join(",") + "\n";
    const rows = txns
      .map((t) => [t.occurred_at, t.amount, t.kind, t.payment_name, t.method ?? "", t.status].map(csvCell).join(","))
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
  };

  return (
    <AppShell title={t("transactions.title")} subtitle={t("transactions.subtitle")}>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={exportCsv} className="rounded-full border px-4 py-2 text-sm">{t("transactions.exportCsv")}</button>
        <button
          onClick={() => setOpen(true)}
          data-testid="add-txn-btn"
          className="rounded-full bg-lime text-lime-foreground font-semibold px-4 py-2 text-sm"
        >
          {t("transactions.addNew")}
        </button>
      </div>

      <div className="bg-card border rounded-2xl p-4 shadow-sm overflow-x-auto">
        {txns.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">{t("transactions.empty")}</div>
        ) : (
          <table className="w-full text-sm" data-testid="txn-table">
            <thead>
              <tr className="bg-lime text-lime-foreground">
                <th className="text-left px-4 py-2 rounded-l-full">{t("transactions.date")}</th>
                <th className="text-left px-4 py-2">{t("transactions.amount")}</th>
                <th className="text-left px-4 py-2">{t("transactions.paymentName")}</th>
                <th className="text-left px-4 py-2">{t("transactions.method")}</th>
                <th className="text-left px-4 py-2 rounded-r-full">{t("transactions.status")}</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((tx) => (
                <tr key={tx.id} className="border-b last:border-0">
                  <td className="px-4 py-3">{new Date(tx.occurred_at).toLocaleString()}</td>
                  <td className={`px-4 py-3 font-semibold ${tx.kind === "income" ? "text-lime-foreground" : "text-destructive"}`}>
                    {tx.kind === "income" ? "+" : "-"}${Number(tx.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">{tx.payment_name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{tx.method}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-lime/40 text-lime-foreground text-xs px-2 py-0.5 rounded-full">{tx.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <form onSubmit={submit} className="bg-card rounded-2xl p-6 w-full max-w-md flex flex-col gap-3" data-testid="add-txn-form">
            <h2 className="text-lg font-bold">New transaction</h2>
            <input required placeholder="Payment name" aria-label="Payment name" className="rounded-full border px-4 py-2 text-sm" value={form.payment_name} data-testid="txn-name" onChange={(e) => setForm({ ...form, payment_name: e.target.value })} />
            <input required type="number" step="0.01" placeholder="Amount" aria-label="Amount" className="rounded-full border px-4 py-2 text-sm" value={form.amount} data-testid="txn-amount" onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <select aria-label="Transaction kind" className="rounded-full border px-4 py-2 text-sm" value={form.kind} data-testid="txn-kind" onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
            <input placeholder="Method" aria-label="Payment method" className="rounded-full border px-4 py-2 text-sm" value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border px-4 py-2 text-sm">{t("common.cancel")}</button>
              <button type="submit" data-testid="txn-submit" className="rounded-full bg-lime text-lime-foreground font-semibold px-4 py-2 text-sm">{t("common.save")}</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
