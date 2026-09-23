import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/state/AppProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { AppShell } from "@/components/app/AppShell";

export const metadata: Metadata = {
  title: "NutriTrack - nutrition tracking, simply",
  description:
    "Log meals by describing them, watch your calories and macros update, and follow your nutrition trends over time.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f7f3" },
    { media: "(prefers-color-scheme: dark)", color: "#0c110e" },
  ],
};

/** Applies the saved theme before first paint so there is no flash. */
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("nutritrack:theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.dataset.theme=d?"dark":"light";document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>
        <AppProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
