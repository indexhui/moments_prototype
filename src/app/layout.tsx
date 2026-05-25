import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "@/components/ui/provider";
import { IS_GAMEWORKS_TRIAL_BUILD } from "@/lib/game/demoBuild";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://example.com"
    : "http://localhost:3000");
const siteTitle = IS_GAMEWORKS_TRIAL_BUILD
  ? "Moment | GameWork 試玩版"
  : "Moment Prototype";
const siteDescription = IS_GAMEWORKS_TRIAL_BUILD
  ? "Moment 的外部試玩版本，收錄目前可玩的通勤日常流程與小日獸事件。"
  : "Mobile game prototype";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  robots: {
    index: !IS_GAMEWORKS_TRIAL_BUILD,
    follow: !IS_GAMEWORKS_TRIAL_BUILD,
    googleBot: {
      index: !IS_GAMEWORKS_TRIAL_BUILD,
      follow: !IS_GAMEWORKS_TRIAL_BUILD,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: siteUrl,
    siteName: "Moment",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
