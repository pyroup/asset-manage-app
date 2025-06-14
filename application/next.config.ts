import type { NextConfig } from "next";

const isAzure = process.env.WEBSITE_INSTANCE_ID !== undefined;
const dev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  // 本番環境でも動的なAPIルートを使用するため、静的エクスポートを無効化
  trailingSlash: process.env.NODE_ENV === 'production',
  
  // 画像最適化の無効化
  images: {
    unoptimized: true,
  },
  
  // カスタムサーバー使用のためstandaloneモードを無効化
  // output: dev ? undefined : 'standalone',
  
  // 静的ファイルの配信設定
  assetPrefix: dev ? undefined : '',
  
  // Webpack設定の最適化
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // クライアント側でのチャンク読み込みエラー対策
      config.output.publicPath = '/_next/';
    }
    return config;
  },
  // Azure環境での最適化
  ...(isAzure && {
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
  })
};

export default nextConfig;
