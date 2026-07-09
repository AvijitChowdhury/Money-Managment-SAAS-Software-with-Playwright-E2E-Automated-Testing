import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import i18n from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Smart Money Manager" },
      { name: "description", content: "Manage profile, language and currency preferences for your workspace." },
      { property: "og:title", content: "Settings — Smart Money Manager" },
      { property: "og:description", content: "Profile, language and currency preferences." },
      { property: "og:url", content: "/settings" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/settings" }],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile-settings", user?.id],
    enabled: !!user?.id,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  const [fullName, setFullName] = useState("");
  const [lang, setLang] = useState("en");
  const [currency, setCurrency] = useState("USD");

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setLang(profile.preferred_language ?? "en");
      setCurrency(profile.preferred_currency ?? "USD");
    }
  }, [profile]);

  const save = async () => {
    const { error } = await supabase.from("profiles").update({
      full_name: fullName,
      preferred_language: lang,
      preferred_currency: currency,
    }).eq("id", user!.id);
    if (error) return toast.error(error.message);
    i18n.changeLanguage(lang);
    if (typeof window !== "undefined") localStorage.setItem("lang", lang);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["profile-settings"] });
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  return (
    <AppShell title={t("settings.title")} subtitle={t("settings.subtitle")}>
      <div className="bg-card border rounded-2xl p-6 shadow-sm max-w-2xl">
        <div className="grid gap-4">
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="settings-email">{t("auth.email")}</label>
            <div id="settings-email" className="mt-1 text-sm">{user?.email}</div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="settings-fullname">{t("auth.fullName")}</label>
            <input id="settings-fullname" className="mt-1 w-full rounded-full border px-4 py-2 text-sm" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="settings-language">{t("settings.language")}</label>
            <select id="settings-language" className="mt-1 w-full rounded-full border px-4 py-2 text-sm bg-background" value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">English</option>
              <option value="bn">বাংলা (Bengali)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground" htmlFor="settings-currency">{t("settings.currency")}</label>
            <select id="settings-currency" className="mt-1 w-full rounded-full border px-4 py-2 text-sm bg-background" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option value="USD">USD ($)</option>
              <option value="BDT">BDT (৳)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
          <button onClick={save} data-testid="save-settings" className="mt-2 rounded-full bg-lime text-lime-foreground font-semibold px-6 py-2 text-sm self-start">
            {t("settings.save")}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
