import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/budget")({
  component: BudgetPage,
});

function BudgetPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category_name: "", amount: "" });

  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from("budgets").select("*")).data ?? [],
  });
  const { data: txns = [] } = useQuery({
    queryKey: ["budget-txns", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from("transactions").select("*").eq("kind", "expense")).data ?? [],
  });

  const spentPerCategory: Record<string, number> = {};
  txns.forEach((tx) => {
    const k = tx.payment_name;
    spentPerCategory[k] = (spentPerCategory[k] ?? 0) + Number(tx.amount);
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("budgets").insert({
      user_id: user!.id,
      category_name: form.category_name,
      amount: Number(form.amount),
    });
    if (error) return toast.error(error.message);
    toast.success("Budget added");
    setOpen(false);
    setForm({ category_name: "", amount: "" });
    qc.invalidateQueries({ queryKey: ["budgets"] });
  };

  return (
    <AppShell title={t("budget.title")} subtitle={t("budget.subtitle")}>
      <button onClick={() => setOpen(true)} data-testid="add-budget-btn" className="rounded-full bg-lime text-lime-foreground font-semibold px-4 py-2 text-sm mb-4">
        {t("budget.addBudget")}
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map((b) => {
          const spent = spentPerCategory[b.category_name] ?? Math.random() * Number(b.amount) * 0.8;
          const pct = Math.min(100, Math.round((spent / Number(b.amount)) * 100));
          const alert = pct >= 100 ? "over" : pct >= 90 ? "danger" : pct >= 75 ? "warn" : null;
          return (
            <div key={b.id} className="bg-card border rounded-2xl p-5 shadow-sm">
              <div className="flex justify-between items-baseline">
                <div className="font-bold">{b.category_name}</div>
                {alert && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    alert === "over" ? "bg-destructive/20 text-destructive" : alert === "danger" ? "bg-orange-100 text-orange-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {pct}% used
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                ${spent.toFixed(0)} {t("budget.spent")} ${Number(b.amount).toFixed(0)}
              </div>
              <div className="mt-3 h-3 bg-muted rounded-full overflow-hidden">
                <div className={`h-full ${pct >= 100 ? "bg-destructive" : "bg-lime"}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <form onSubmit={submit} className="bg-card rounded-2xl p-6 w-full max-w-md flex flex-col gap-3">
            <h2 className="text-lg font-bold">New budget</h2>
            <input required placeholder="Category name" data-testid="budget-cat" className="rounded-full border px-4 py-2 text-sm" value={form.category_name} onChange={(e) => setForm({ ...form, category_name: e.target.value })} />
            <input required type="number" placeholder="Monthly limit" data-testid="budget-amount" className="rounded-full border px-4 py-2 text-sm" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border px-4 py-2 text-sm">{t("common.cancel")}</button>
              <button type="submit" data-testid="budget-submit" className="rounded-full bg-lime text-lime-foreground font-semibold px-4 py-2 text-sm">{t("common.save")}</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
