import type { Metadata } from "next";
import "./globals.css";
import { Provider } from "@/components/ui/provider";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://example.com"
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "moment_prototype",
  description: "Mobile game prototype",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: siteUrl,
    siteName: "moment_prototype",
    title: "moment_prototype",
    description: "Mobile game prototype",
  },
  twitter: {
    card: "summary_large_image",
    title: "moment_prototype",
    description: "Mobile game prototype",
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
