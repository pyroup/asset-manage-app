import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/config/database';
import { verifyToken } from '@/lib/middleware/auth';

// Next.jsの静的エクスポート設定用
export const dynamic = "auto";

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

const AssetFiltersSchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['name', 'acquisitionDate', 'currentValue', 'gainLoss']).default('name'),
  order: z.enum(['asc', 'desc']).default('asc'),
});

// 資産一覧の取得
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

    // URLパラメータの取得
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const filters = AssetFiltersSchema.parse(queryParams);
    // フィルター条件の構築
    type WhereCondition = {
      userId: string;
      categoryId?: string;
      OR?: Array<{name: { contains: string; mode: 'insensitive' }} | {symbol: { contains: string; mode: 'insensitive' }}>;
    };
    
    const where: WhereCondition = {
      userId: user.id,
    };

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { symbol: { contains: filters.search, mode: 'insensitive' } },
      ];
    }// ソート条件の構築
    let orderBy: Record<string, 'asc' | 'desc'> = {};
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
    });    // 計算フィールドの追加
    // AssetWithCategoryの型をインポートせずに定義
    interface Asset {
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
    }
    
    interface AssetCategory {
      id: string;
      name: string;
      description: string | null;
      color: string;
      icon: string | null;
      createdAt: Date;
      updatedAt: Date;
    }
    
    interface AssetWithCategory extends Asset {
      category: AssetCategory;
    }
    
    interface EnhancedAsset extends AssetWithCategory {
      currentValue: number;
      acquisitionValue: number;
      gainLoss: number;
      gainLossPercent: number;
    }
    
    const enhancedAssets = assets.map((asset: AssetWithCategory): EnhancedAsset => {
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
      } as EnhancedAsset;    });    // 計算フィールドでのソート
    if (filters.sort === 'currentValue') {
      enhancedAssets.sort((a: EnhancedAsset, b: EnhancedAsset) => 
        filters.order === 'desc' ? b.currentValue - a.currentValue : a.currentValue - b.currentValue
      );
    } else if (filters.sort === 'gainLoss') {
      enhancedAssets.sort((a: EnhancedAsset, b: EnhancedAsset) => 
        filters.order === 'desc' ? b.gainLoss - a.gainLoss : a.gainLoss - b.gainLoss
      );
    }

    return NextResponse.json({
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
    console.error('Get assets error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力データが正しくありません',
          details: error.errors,
        },
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    }, { status: 500 });
  }
}

// 資産の作成
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const validatedData = CreateAssetSchema.parse(body);

    // カテゴリの存在確認
    const category = await prisma.assetCategory.findUnique({
      where: { id: validatedData.categoryId },
    });

    if (!category) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'カテゴリが見つかりません',
        },
      }, { status: 404 });
    }

    const asset = await prisma.asset.create({
      data: {
        ...validatedData,
        userId: user.id,
        currentPrice: validatedData.acquisitionPrice, // 初期値として取得価格を設定
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: asset,
      message: '資産を作成しました',
    }, { status: 201 });
  } catch (error) {
    console.error('Create asset error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力データが正しくありません',
          details: error.errors,
        },
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    }, { status: 500 });
  }
}