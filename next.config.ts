import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 靜態匯出：產生純靜態檔到 out/，供 miniserve 等靜態 server 服務
  output: "export",
  trailingSlash: true,

  // 圖片優化
  images: {
    formats: ["image/webp", "image/avif"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 壓縮
  compress: true,
};

export default nextConfig;
