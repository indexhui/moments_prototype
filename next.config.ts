import type { NextConfig } from "next";

const isGameWorksTrialBuild = process.env.NEXT_PUBLIC_GAMEWORKS_TRIAL === "1";

const nextConfig: NextConfig = {
  // SEO 相關配置
  trailingSlash: false,

  // 圖片優化
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 壓縮
  compress: true,

  // 安全標頭
  async headers() {
    const baseHeaders = [
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "origin-when-cross-origin",
      },
    ];

    return [
      {
        source: "/(.*)",
        headers: isGameWorksTrialBuild
          ? baseHeaders
          : [
              {
                key: "X-Frame-Options",
                value: "DENY",
              },
              ...baseHeaders,
            ],
      },
    ];
  },
};

export default nextConfig;
