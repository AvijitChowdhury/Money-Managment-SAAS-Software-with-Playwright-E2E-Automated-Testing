import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

function AuthPage() {
  const { t, i18n: i18nInst } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || email.split("@")[0] },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        toast.success("Account created");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md bg-card border rounded-3xl shadow-xl p-8">
        <div className="text-lime font-bold text-xl mb-1">{t("brand")}</div>
        <h1 className="text-2xl font-bold" data-testid="auth-title">{t("auth.welcome")}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t("auth.subtitle")}</p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          {mode === "signup" && (
            <input
              className="rounded-full border px-4 py-2.5 text-sm bg-background"
              placeholder={t("auth.fullName")}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          )}
          <input
            type="email"
            required
            data-testid="email-input"
            className="rounded-full border px-4 py-2.5 text-sm bg-background"
            placeholder={t("auth.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            data-testid="password-input"
            className="rounded-full border px-4 py-2.5 text-sm bg-background"
            placeholder={t("auth.password")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            data-testid="submit-btn"
            className="rounded-full bg-lime text-lime-foreground font-semibold px-4 py-2.5 text-sm hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "..." : mode === "signin" ? t("auth.signin") : t("auth.signup")}
          </button>
        </form>

        <div className="mt-4 text-sm text-center text-muted-foreground">
          {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
          <button
            data-testid="toggle-mode"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            className="text-foreground font-semibold underline"
          >
            {mode === "signin" ? t("auth.signup") : t("auth.signin")}
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 text-xs text-muted-foreground">
          <button onClick={() => i18nInst.changeLanguage("en")} className="underline">English</button>
          <button onClick={() => i18nInst.changeLanguage("bn")} className="underline">বাংলা</button>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs text-muted-foreground underline">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}
