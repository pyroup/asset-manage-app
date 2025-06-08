import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番環境での静的エクスポート設定
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,
  distDir: 'out',
  
  // 画像最適化の無効化
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
