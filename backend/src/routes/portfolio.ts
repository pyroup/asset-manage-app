import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// 型定義 - Prismaの実際の型に合わせる
type AssetWithCategory = {
  id: string;
  categoryId: string;
  userId: string;
  name: string;
  symbol: string | null;  // nullに変更
  quantity: number;
  acquisitionPrice: number;
  currentPrice: number;
  acquisitionDate: Date;
  currency: string;
  notes: string | null;  // nullに変更
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    description: string | null;  // nullに変更
    color: string;
    icon: string | null;  // nullに変更
    createdAt: Date;  // 追加
    updatedAt: Date;  // 追加
  };
};

type AssetOnly = {
  id: string;
  categoryId: string;
  userId: string;
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

// バリデーションスキーマ
const PortfolioFiltersSchema = z.object({
  period: z.enum(['1w', '1m', '3m', '6m', '1y', 'all']).default('1y').optional(),
  type: z.enum(['category', 'asset']).default('category').optional(),
});

// ポートフォリオサマリーの取得
router.get('/summary', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    // ユーザーの全資産を取得
    const assets = await prisma.asset.findMany({
      where: { userId: req.user!.id },
      include: { category: true },
    });

    if (assets.length === 0) {
      return res.json({
        success: true,
        data: {
          totalValue: 0,
          totalGainLoss: 0,
          totalGainLossPercent: 0,
          categories: [],
          updatedAt: new Date(),
        },
      });
    }

    // 全体の計算
    let totalValue = 0;
    let totalAcquisitionValue = 0;
    const categoryMap = new Map();

    assets.forEach((asset: AssetWithCategory) => {
      const currentValue = asset.quantity * asset.currentPrice;
      const acquisitionValue = asset.quantity * asset.acquisitionPrice;
      
      totalValue += currentValue;
      totalAcquisitionValue += acquisitionValue;

      // カテゴリ別の集計
      const categoryId = asset.categoryId;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName: asset.category.name,
          color: asset.category.color,
          value: 0,
          acquisitionValue: 0,
        });
      }

      const categoryData = categoryMap.get(categoryId);
      categoryData.value += currentValue;
      categoryData.acquisitionValue += acquisitionValue;
    });

    const totalGainLoss = totalValue - totalAcquisitionValue;
    const totalGainLossPercent = totalAcquisitionValue > 0 ? (totalGainLoss / totalAcquisitionValue) * 100 : 0;

    // カテゴリ別データの完成
    const categories = Array.from(categoryMap.values()).map(category => {
      const gainLoss = category.value - category.acquisitionValue;
      const gainLossPercent = category.acquisitionValue > 0 ? (gainLoss / category.acquisitionValue) * 100 : 0;
      const percentage = totalValue > 0 ? (category.value / totalValue) * 100 : 0;

      return {
        ...category,
        gainLoss,
        gainLossPercent,
        percentage,
      };
    });

    res.json({
      success: true,
      data: {
        totalValue,
        totalGainLoss,
        totalGainLossPercent,
        categories,
        updatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ポートフォリオ履歴の取得
router.get('/history', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const filters = PortfolioFiltersSchema.parse(req.query);
    
    // 期間の計算
    const endDate = new Date();
    const startDate = new Date();
    
    switch (filters.period) {
      case '1w':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '1m':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case '3m':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case '6m':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'all':
        startDate.setFullYear(2000, 0, 1);
        break;
    }

    // ポートフォリオスナップショットの取得
    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: {
        userId: req.user!.id,
        snapshotDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { snapshotDate: 'asc' },
    });

    res.json({
      success: true,
      data: snapshots,
    });
  } catch (error) {
    next(error);
  }
});

// ポートフォリオスナップショットの作成
router.post('/snapshot', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    // 現在のポートフォリオサマリーを計算
    const assets = await prisma.asset.findMany({
      where: { userId: req.user!.id },
    });

    let totalValue = 0;
    let totalAcquisitionValue = 0;

    assets.forEach((asset: AssetOnly) => {
      const currentValue = asset.quantity * asset.currentPrice;
      const acquisitionValue = asset.quantity * asset.acquisitionPrice;
      
      totalValue += currentValue;
      totalAcquisitionValue += acquisitionValue;
    });

    const totalGainLoss = totalValue - totalAcquisitionValue;
    const totalGainLossPercent = totalAcquisitionValue > 0 ? (totalGainLoss / totalAcquisitionValue) * 100 : 0;

    // スナップショットの作成
    const snapshot = await prisma.portfolioSnapshot.create({
      data: {
        userId: req.user!.id,
        totalValue,
        totalGainLoss,
        totalGainLossPercent,
        snapshotDate: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      data: snapshot,
      message: 'ポートフォリオスナップショットを作成しました',
    });
  } catch (error) {
    next(error);
  }
});

// 資産パフォーマンス分析
router.get('/performance', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { userId: req.user!.id },
      include: { category: true },
    });

    // @ts-ignore
    const performance = assets.map((asset) => {
      const currentValue = asset.quantity * asset.currentPrice;
      const acquisitionValue = asset.quantity * asset.acquisitionPrice;
      const gainLoss = currentValue - acquisitionValue;
      const gainLossPercent = acquisitionValue > 0 ? (gainLoss / acquisitionValue) * 100 : 0;

      return {
        assetId: asset.id,
        assetName: asset.name,
        category: asset.category.name,
        gainLoss,
        gainLossPercent,
        currentValue,
      };
    });

    // パフォーマンス順にソート
    // @ts-ignore
    performance.sort((a, b) => b.gainLossPercent - a.gainLossPercent);

    res.json({
      success: true,
      data: {
        bestPerforming: performance.slice(0, 5),
        worstPerforming: performance.slice(-5).reverse(),
        all: performance,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router; 