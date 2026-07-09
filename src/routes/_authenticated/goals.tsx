import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/goals")({
  component: GoalsPage,
});

function GoalsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", target_amount: "", saved_amount: "" });

  const { data: goals = [] } = useQuery({
    queryKey: ["goals", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from("goals").select("*")).data ?? [],
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("goals").insert({
      user_id: user!.id,
      name: form.name,
      target_amount: Number(form.target_amount),
      saved_amount: Number(form.saved_amount || 0),
    });
    if (error) return toast.error(error.message);
    toast.success("Goal added");
    setOpen(false);
    setForm({ name: "", target_amount: "", saved_amount: "" });
    qc.invalidateQueries({ queryKey: ["goals"] });
  };

  const remove = async (id: string) => {
    await supabase.from("goals").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["goals"] });
  };

  return (
    <AppShell title={t("goals.title")} subtitle={t("goals.subtitle")}>
      <button onClick={() => setOpen(true)} data-testid="add-goal-btn" className="rounded-full bg-lime text-lime-foreground font-semibold px-4 py-2 text-sm mb-4">
        {t("goals.addGoal")}
      </button>

      {goals.length === 0 ? (
        <div className="bg-card border rounded-2xl p-16 text-center text-muted-foreground">{t("goals.empty")}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const pct = Math.min(100, Math.round((Number(g.saved_amount) / Number(g.target_amount)) * 100));
            return (
              <div key={g.id} className="bg-card border rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold">{g.name}</div>
                    <div className="text-xs text-muted-foreground">{t("goals.target")}: ${Number(g.target_amount).toFixed(0)}</div>
                  </div>
                  <button onClick={() => remove(g.id)} className="text-xs text-destructive underline">{t("common.delete")}</button>
                </div>
                <div className="mt-4">
                  <div className="text-sm font-semibold">${Number(g.saved_amount).toFixed(0)} <span className="text-muted-foreground text-xs font-normal">({pct}%)</span></div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-lime" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <form onSubmit={submit} className="bg-card rounded-2xl p-6 w-full max-w-md flex flex-col gap-3">
            <h2 className="text-lg font-bold">New goal</h2>
            <input required placeholder="Goal name" data-testid="goal-name" className="rounded-full border px-4 py-2 text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input required type="number" placeholder="Target amount" data-testid="goal-target" className="rounded-full border px-4 py-2 text-sm" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} />
            <input type="number" placeholder="Already saved" className="rounded-full border px-4 py-2 text-sm" value={form.saved_amount} onChange={(e) => setForm({ ...form, saved_amount: e.target.value })} />
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border px-4 py-2 text-sm">{t("common.cancel")}</button>
              <button type="submit" data-testid="goal-submit" className="rounded-full bg-lime text-lime-foreground font-semibold px-4 py-2 text-sm">{t("common.save")}</button>
            </div>
          </form>
        </div>
      )}
    </AppShell>
  );
}
