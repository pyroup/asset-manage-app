import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// 型定義
type PortfolioSnapshot = {
  id: string;
  userId: string;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  snapshotDate: Date;
  createdAt: Date;
};

// 型定義 - Prismaの実際の型に合わせる
type AssetWithCategory = {
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
  category: {
    id: string;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

type CategoryData = {
  categoryId: string;
  categoryName: string;
  color: string;
  value: number;
  acquisitionValue: number;
  gainLoss?: number;
  gainLossPercent?: number;
  percentage?: number;
};

type AssetPerformance = {
  assetId: string;
  assetName: string;
  category: string;
  gainLoss: number;
  gainLossPercent: number;
  currentValue: number;
};

// バリデーションスキーマ
const ReportFiltersSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2099),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

// 月次レポートの取得
router.get('/monthly', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const filters = ReportFiltersSchema.parse(req.query);
    
    if (!filters.month) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '月の指定が必要です',
        },
      });
    }

    // 指定月の開始・終了日
    const startDate = new Date(filters.year, filters.month - 1, 1);
    const endDate = new Date(filters.year, filters.month, 0);

    // 指定月のスナップショットを取得
    const snapshots = await prisma.portfolioSnapshot.findMany({
      where: {
        userId: req.user!.id,
        snapshotDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { snapshotDate: 'desc' },
      take: 1,
    });

    let monthlyData = null;
    if (snapshots.length > 0) {
      monthlyData = snapshots[0];
    } else {
      // スナップショットがない場合は現在のデータで計算
      const assets = await prisma.asset.findMany({
        where: { userId: req.user!.id },
        include: { category: true },
      });

      let totalValue = 0;
      let totalAcquisitionValue = 0;
      const categoryBreakdown: CategoryData[] = [];
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

      Array.from(categoryMap.values()).forEach((category: CategoryData) => {
        const gainLoss = category.value - category.acquisitionValue;
        const gainLossPercent = category.acquisitionValue > 0 ? (gainLoss / category.acquisitionValue) * 100 : 0;
        const percentage = totalValue > 0 ? (category.value / totalValue) * 100 : 0;

        categoryBreakdown.push({
          ...category,
          gainLoss,
          gainLossPercent,
          percentage,
        });
      });

      const totalGainLoss = totalValue - totalAcquisitionValue;
      const totalGainLossPercent = totalAcquisitionValue > 0 ? (totalGainLoss / totalAcquisitionValue) * 100 : 0;

      monthlyData = {
        totalValue,
        totalGainLoss,
        totalGainLossPercent,
        categoryBreakdown,
      };
    }

    // 資産パフォーマンス
    const assets = await prisma.asset.findMany({
      where: { userId: req.user!.id },
      include: { category: true },
    });

    const assetPerformance = assets.map((asset: AssetWithCategory) => {
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

    res.json({
      success: true,
      data: {
        year: filters.year,
        month: filters.month,
        ...monthlyData,
        assetPerformance,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 年次レポートの取得
router.get('/yearly', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const filters = ReportFiltersSchema.parse(req.query);
    
    // 指定年の開始・終了日
    const startDate = new Date(filters.year, 0, 1);
    const endDate = new Date(filters.year, 11, 31);

    // 年間のスナップショットを取得
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

    // 月別データの作成
    const monthlyData = [];
    for (let month = 1; month <= 12; month++) {
      const monthSnapshots = snapshots.filter((snapshot: PortfolioSnapshot) => 
        snapshot.snapshotDate.getMonth() + 1 === month
      );

      if (monthSnapshots.length > 0) {
        const lastSnapshot = monthSnapshots[monthSnapshots.length - 1];
        monthlyData.push({
          month,
          totalValue: lastSnapshot.totalValue,
          gainLoss: lastSnapshot.totalGainLoss,
          gainLossPercent: lastSnapshot.totalGainLossPercent,
        });
      } else {
        monthlyData.push({
          month,
          totalValue: 0,
          gainLoss: 0,
          gainLossPercent: 0,
        });
      }
    }

    // 現在の資産パフォーマンス
    const assets = await prisma.asset.findMany({
      where: { userId: req.user!.id },
      include: { category: true },
    });

    const assetPerformance = assets.map((asset: AssetWithCategory) => {
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

    // ベスト・ワーストパフォーマンス
    assetPerformance.sort((a: AssetPerformance, b: AssetPerformance) => b.gainLossPercent - a.gainLossPercent);
    const bestPerformingAssets = assetPerformance.slice(0, 5);
    const worstPerformingAssets = assetPerformance.slice(-5).reverse();

    // 年間サマリー
    const lastSnapshot = snapshots[snapshots.length - 1];
    const yearSummary = lastSnapshot ? {
      totalValue: lastSnapshot.totalValue,
      totalGainLoss: lastSnapshot.totalGainLoss,
      totalGainLossPercent: lastSnapshot.totalGainLossPercent,
    } : {
      totalValue: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
    };

    res.json({
      success: true,
      data: {
        year: filters.year,
        ...yearSummary,
        monthlyData,
        bestPerformingAssets,
        worstPerformingAssets,
      },
    });
  } catch (error) {
    next(error);
  }
});

// CSVエクスポート
router.get('/export/csv', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { userId: req.user!.id },
      include: { category: true },
    });

    // CSVヘッダー
    const csvHeader = [
      '資産名',
      'カテゴリ',
      'シンボル',
      '数量',
      '取得価格',
      '現在価格',
      '取得日',
      '通貨',
      '現在価値',
      '取得価値',
      '損益',
      '損益率(%)',
      'メモ'
    ].join(',');

    // CSVデータ
    const csvData = assets.map((asset: AssetWithCategory) => {
      const currentValue = asset.quantity * asset.currentPrice;
      const acquisitionValue = asset.quantity * asset.acquisitionPrice;
      const gainLoss = currentValue - acquisitionValue;
      const gainLossPercent = acquisitionValue > 0 ? (gainLoss / acquisitionValue) * 100 : 0;

      return [
        `"${asset.name}"`,
        `"${asset.category.name}"`,
        `"${asset.symbol || ''}"`,
        asset.quantity,
        asset.acquisitionPrice,
        asset.currentPrice,
        asset.acquisitionDate.toISOString().split('T')[0],
        asset.currency,
        currentValue.toFixed(2),
        acquisitionValue.toFixed(2),
        gainLoss.toFixed(2),
        gainLossPercent.toFixed(2),
        `"${asset.notes || ''}"`
      ].join(',');
    }).join('\n');

    const csv = `${csvHeader}\n${csvData}`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="assets-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csv); // BOM付きで文字化け対策
  } catch (error) {
    next(error);
  }
});

// 資産サマリーを取得
router.get('/summary', authenticateToken, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: '認証が必要です' });
    }

    // 資産データを取得
    const assets = await prisma.asset.findMany({
      where: { userId },
      include: {
        category: true
      }
    });

    // サマリー計算
    const totalValue = assets.reduce((sum: number, asset: any) => sum + (asset.quantity * asset.currentPrice), 0);
    const totalGainLoss = assets.reduce((sum: number, asset: any) => {
      const currentValue = asset.quantity * asset.currentPrice;
      const acquisitionValue = asset.quantity * asset.acquisitionPrice;
      return sum + (currentValue - acquisitionValue);
    }, 0);
    const totalGainLossPercent = totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0;

    // カテゴリ別サマリー
    const categoryMap = new Map();
    assets.forEach((asset: any) => {
      const categoryId = asset.categoryId;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          name: asset.category.name,
          totalValue: 0,
          totalGainLoss: 0,
          assetCount: 0
        });
      }
      
      const category = categoryMap.get(categoryId);
      const currentValue = asset.quantity * asset.currentPrice;
      const acquisitionValue = asset.quantity * asset.acquisitionPrice;
      
      category.totalValue += currentValue;
      category.totalGainLoss += (currentValue - acquisitionValue);
      category.assetCount += 1;
    });

    const categorySummary = Array.from(categoryMap.values()).map((category: any) => ({
      ...category,
      percentage: totalValue > 0 ? (category.totalValue / totalValue) * 100 : 0,
      gainLossPercent: category.totalValue > 0 ? (category.totalGainLoss / (category.totalValue - category.totalGainLoss)) * 100 : 0
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalValue,
          totalGainLoss,
          totalGainLossPercent,
          assetCount: assets.length
        },
        categorySummary,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('レポートサマリー取得エラー:', error);
    res.status(500).json({ 
      success: false, 
      message: 'レポートサマリーの取得に失敗しました' 
    });
  }
});

export default router; 