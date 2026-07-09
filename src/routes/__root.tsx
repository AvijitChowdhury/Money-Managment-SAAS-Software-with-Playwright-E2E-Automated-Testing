import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import "@/lib/i18n";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { property: "og:site_name", content: "Smart Money Manager" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { title: "Smart Money Manager — Agency finance, bilingual" },
      { property: "og:title", content: "Smart Money Manager — Agency finance, bilingual" },
      { name: "twitter:title", content: "Smart Money Manager — Agency finance, bilingual" },
      { name: "description", content: "Bilingual (English/Bengali) money management SaaS for digital, creative and software agencies. Track cash flow, invoices, budgets and goals." },
      { property: "og:description", content: "Bilingual (English/Bengali) money management SaaS for digital, creative and software agencies. Track cash flow, invoices, budgets and goals." },
      { name: "twitter:description", content: "Bilingual (English/Bengali) money management SaaS for digital, creative and software agencies. Track cash flow, invoices, budgets and goals." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/256898ed-c468-4dd1-a81c-7cf8a21cb6b1" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/256898ed-c468-4dd1-a81c-7cf8a21cb6b1" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <p className="mt-2 text-muted-foreground">Page not found</p>
        <a href="/" className="mt-4 inline-block rounded-full bg-lime text-lime-foreground px-5 py-2 text-sm font-semibold">Home</a>
      </div>
    </div>
  ),
  errorComponent: ({ error }) => {
    console.error(error);
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  },
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
