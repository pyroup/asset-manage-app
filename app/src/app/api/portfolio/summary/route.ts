import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';
import { verifyToken } from '@/lib/middleware/auth';

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
      }, { status: 401 });
    }

    // ユーザーの資産を取得
    const assets = await prisma.asset.findMany({
      where: { userId: user.id },
      include: {
        category: true,
      },
    });

    // ポートフォリオサマリーを計算
    const totalValue = assets.reduce((sum, asset) => sum + (asset.currentPrice * asset.quantity), 0);
    const totalCost = assets.reduce((sum, asset) => sum + (asset.acquisitionPrice * asset.quantity), 0);
    const totalGainLoss = totalValue - totalCost;
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    // カテゴリ別の分布
    const categoryDistribution = assets.reduce((acc, asset) => {
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
    }, {} as Record<string, any>);

    // パーセンテージを計算
    Object.values(categoryDistribution).forEach((item: any) => {
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