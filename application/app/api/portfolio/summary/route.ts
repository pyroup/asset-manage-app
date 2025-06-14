import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { verifyToken } from '@/lib/middleware/auth';

// Prismaクライアントから型をインポート
type Asset = {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  symbol: string | null;
  quantity: number;
  acquisitionPrice: number;
  currentPrice: number;
  acquisitionDate: Date;
  currency: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type AssetCategory = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// リレーション含むAsset型
type AssetWithCategory = Asset & {
  category: AssetCategory;
};

// Next.jsの静的エクスポート設定用
export const dynamic = "auto";

export async function GET(request: NextRequest) {
  try {
    // トークンの検証
    const user = await verifyToken(request);
    
    if (!user) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: '認証が必要です',
        },
      }, { status: 401 });    }

    // ユーザーの資産を取得
    const assets = await prisma.asset.findMany({
      where: { userId: user.id },
      include: {
        category: true,
      },    });    // ポートフォリオサマリーを計算
    const totalValue = assets.reduce((sum: number, asset: AssetWithCategory) => sum + (asset.currentPrice * asset.quantity), 0);
    const totalCost = assets.reduce((sum: number, asset: AssetWithCategory) => sum + (asset.acquisitionPrice * asset.quantity), 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    // カテゴリ別の分布
    interface CategoryDistributionItem {
      categoryId: string;
      categoryName: string;
      value: number;
      percentage: number;
    }    const categoryDistribution = assets.reduce((acc: Record<string, CategoryDistributionItem>, asset: AssetWithCategory) => {
      const categoryId = asset.categoryId;
      const value = asset.currentPrice * asset.quantity;
      
      if (!acc[categoryId]) {
        acc[categoryId] = {
          categoryId,
          categoryName: asset.category.name,
          value: 0,
          percentage: 0,
        };
      }
      
      acc[categoryId].value += value;
      return acc;
    }, {} as Record<string, CategoryDistributionItem>);// パーセンテージを計算
    const categoryArray: CategoryDistributionItem[] = Object.values(categoryDistribution);
    categoryArray.forEach((item: CategoryDistributionItem) => {
      item.percentage = totalValue > 0 ? (item.value / totalValue) * 100 : 0;
    });

    const portfolioSummary = {
      totalAssets: assets.length,
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      categoryDistribution: Object.values(categoryDistribution),
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: portfolioSummary,
    });
  } catch (error) {
    console.error('Get portfolio summary error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    }, { status: 500 });
  }
} 