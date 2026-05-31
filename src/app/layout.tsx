import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Provider } from "@/components/ui/provider";
import { IS_EXTERNAL_TRIAL_BUILD, TRIAL_BUILD_LABEL } from "@/lib/game/demoBuild";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://example.com"
    : "http://localhost:3000");
const siteTitle = IS_EXTERNAL_TRIAL_BUILD
  ? `Moment | ${TRIAL_BUILD_LABEL}`
  : "Moment Prototype";
const siteDescription = IS_EXTERNAL_TRIAL_BUILD
  ? "Moment 的外部試玩版本，收錄目前可玩的通勤日常流程與小日獸事件。"
  : "Mobile game prototype";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  robots: {
    index: !IS_EXTERNAL_TRIAL_BUILD,
    follow: !IS_EXTERNAL_TRIAL_BUILD,
    googleBot: {
      index: !IS_EXTERNAL_TRIAL_BUILD,
      follow: !IS_EXTERNAL_TRIAL_BUILD,
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW" suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="/images/logo/logo_svg.svg" />
      </head>
      <body>
        <Provider>{children}</Provider>
      </body>
    </html>
  );
}
