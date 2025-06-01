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

// バリデーションスキーマ
const CreateAssetSchema = z.object({
  categoryId: z.string().min(1, 'カテゴリは必須です'),
  name: z.string().min(1, '資産名は必須です').max(200, '資産名は200文字以内で入力してください'),
  symbol: z.string().max(20, 'シンボルは20文字以内で入力してください').optional(),
  quantity: z.number().positive('数量は正の数で入力してください'),
  acquisitionPrice: z.number().positive('取得価格は正の数で入力してください'),
  acquisitionDate: z.coerce.date(),
  currency: z.string().length(3, '通貨コードは3文字で入力してください').default('JPY').optional(),
  notes: z.string().max(1000, 'メモは1000文字以内で入力してください').optional(),
});

const UpdateAssetSchema = z.object({
  name: z.string().min(1, '資産名は必須です').max(200, '資産名は200文字以内で入力してください').optional(),
  symbol: z.string().max(20, 'シンボルは20文字以内で入力してください').optional(),
  quantity: z.number().positive('数量は正の数で入力してください').optional(),
  acquisitionPrice: z.number().positive('取得価格は正の数で入力してください').optional(),
  currentPrice: z.number().nonnegative('現在価格は0以上で入力してください').optional(),
  acquisitionDate: z.coerce.date().optional(),
  currency: z.string().length(3, '通貨コードは3文字で入力してください').optional(),
  notes: z.string().max(1000, 'メモは1000文字以内で入力してください').optional(),
});

const AssetFiltersSchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['name', 'acquisitionDate', 'currentValue', 'gainLoss']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

// 資産一覧の取得
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const filters = AssetFiltersSchema.parse(req.query);
    
    // フィルター条件の構築
    const where: any = {
      userId: req.user!.id,
    };

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { symbol: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // ソート条件の構築
    let orderBy: any = {};
    switch (filters.sort) {
      case 'acquisitionDate':
        orderBy = { acquisitionDate: filters.order };
        break;
      case 'currentValue':
      case 'gainLoss':
        // これらは計算フィールドなので、後でソート
        orderBy = { name: 'asc' };
        break;
      default:
        orderBy = { [filters.sort]: filters.order };
    }

    // 総件数の取得
    const total = await prisma.asset.count({ where });

    // データ取得
    const assets = await prisma.asset.findMany({
      where,
      include: {
        category: true,
      },
      orderBy,
      skip: (filters.page - 1) * filters.limit,
      take: filters.limit,
    });

    // 計算フィールドの追加
    const enhancedAssets = assets.map((asset: AssetWithCategory) => {
      const currentValue = asset.quantity * asset.currentPrice;
      const acquisitionValue = asset.quantity * asset.acquisitionPrice;
      const gainLoss = currentValue - acquisitionValue;
      const gainLossPercent = acquisitionValue > 0 ? (gainLoss / acquisitionValue) * 100 : 0;

      return {
        ...asset,
        currentValue,
        acquisitionValue,
        gainLoss,
        gainLossPercent,
      };
    });

    // 計算フィールドでのソート
    if (filters.sort === 'currentValue') {
      enhancedAssets.sort((a: typeof enhancedAssets[0], b: typeof enhancedAssets[0]) => 
        filters.order === 'desc' ? b.currentValue - a.currentValue : a.currentValue - b.currentValue
      );
    } else if (filters.sort === 'gainLoss') {
      enhancedAssets.sort((a: typeof enhancedAssets[0], b: typeof enhancedAssets[0]) => 
        filters.order === 'desc' ? b.gainLoss - a.gainLoss : a.gainLoss - b.gainLoss
      );
    }

    res.json({
      success: true,
      data: {
        items: enhancedAssets,
        pagination: {
          page: filters.page,
          limit: filters.limit,
          total,
          pages: Math.ceil(total / filters.limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// 資産の作成
router.post('/', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validatedData = CreateAssetSchema.parse(req.body);

    // カテゴリの存在確認
    const category = await prisma.assetCategory.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'カテゴリが見つかりません',
        },
      });
    }

    const asset = await prisma.asset.create({
      data: {
        ...validatedData,
        userId: req.user!.id,
        currentPrice: validatedData.acquisitionPrice, // 初期値として取得価格を設定
      },
      include: {
        category: true,
      },
    });

    res.status(201).json({
      success: true,
      data: asset,
      message: '資産を作成しました',
    });
  } catch (error) {
    next(error);
  }
});

// 資産の取得
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const asset = await prisma.asset.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        category: true,
        priceHistory: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '資産が見つかりません',
        },
      });
    }

    // 計算フィールドの追加
    const currentValue = asset.quantity * asset.currentPrice;
    const acquisitionValue = asset.quantity * asset.acquisitionPrice;
    const gainLoss = currentValue - acquisitionValue;
    const gainLossPercent = acquisitionValue > 0 ? (gainLoss / acquisitionValue) * 100 : 0;

    res.json({
      success: true,
      data: {
        ...asset,
        currentValue,
        acquisitionValue,
        gainLoss,
        gainLossPercent,
      },
    });
  } catch (error) {
    next(error);
  }
});

// 資産の更新
router.put('/:id', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const validatedData = UpdateAssetSchema.parse(req.body);

    const asset = await prisma.asset.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '資産が見つかりません',
        },
      });
    }

    const updatedAsset = await prisma.asset.update({
      where: { id: req.params.id },
      data: validatedData,
      include: {
        category: true,
      },
    });

    res.json({
      success: true,
      data: updatedAsset,
      message: '資産を更新しました',
    });
  } catch (error) {
    next(error);
  }
});

// 資産の削除
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const asset = await prisma.asset.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '資産が見つかりません',
        },
      });
    }

    await prisma.asset.delete({
      where: { id: req.params.id },
    });

    res.json({
      success: true,
      message: '資産を削除しました',
    });
  } catch (error) {
    next(error);
  }
});

// 資産価格の更新
router.patch('/:id/price', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const { currentPrice } = req.body;

    if (typeof currentPrice !== 'number' || currentPrice < 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '有効な価格を入力してください',
        },
      });
    }

    const asset = await prisma.asset.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '資産が見つかりません',
        },
      });
    }

    // 価格履歴の追加
    await prisma.priceHistory.create({
      data: {
        assetId: asset.id,
        price: currentPrice,
        date: new Date(),
        source: 'manual',
      },
    });

    // 資産の現在価格を更新
    const updatedAsset = await prisma.asset.update({
      where: { id: req.params.id },
      data: { currentPrice },
      include: {
        category: true,
      },
    });

    res.json({
      success: true,
      data: updatedAsset,
      message: '価格を更新しました',
    });
  } catch (error) {
    next(error);
  }
});

export default router; 