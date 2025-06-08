import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 本番環境での静的エクスポート設定
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,
  
  // APIリクエストのリライト設定
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*', // 同一オリジンのAPIエンドポイントに転送
      },
    ];
  },
};

export default nextConfig;
