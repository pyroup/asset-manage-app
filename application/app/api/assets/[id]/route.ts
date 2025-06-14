import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/config/database';
import { verifyToken } from '@/lib/middleware/auth';

// Next.jsの静的エクスポート設定用
export const dynamic = "force-static";

// バリデーションスキーマ
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

// 資産の取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const asset = await prisma.asset.findFirst({
      where: {
        id: (await params).id,
        userId: user.id, // ユーザーの資産のみ取得
      },
      include: {
        category: true,
      },
    });

    if (!asset) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '資産が見つかりません',
        },
      }, { status: 404, headers: { 'x-content-type-options': 'nosniff', 'x-powered-by': '' } });
    }

    // 計算フィールドの追加
    const currentValue = asset.quantity * asset.currentPrice;
    const acquisitionValue = asset.quantity * asset.acquisitionPrice;
    const gainLoss = currentValue - acquisitionValue;
    const gainLossPercent = acquisitionValue > 0 ? (gainLoss / acquisitionValue) * 100 : 0;

    const enhancedAsset = {
      ...asset,
      currentValue,
      acquisitionValue,
      gainLoss,
      gainLossPercent,
    };

    return NextResponse.json({
      success: true,
      data: enhancedAsset,
    }, { headers: { 'x-content-type-options': 'nosniff', 'x-powered-by': '' } });
  } catch (error) {
    console.error('Get asset error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    }, { status: 500, headers: { 'x-content-type-options': 'nosniff', 'x-powered-by': '' } });
  }
}

// 資産の更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const validatedData = UpdateAssetSchema.parse(body);

    // 資産の存在確認
    const existingAsset = await prisma.asset.findFirst({
      where: {
        id: (await params).id,
        userId: user.id,
      },
    });

    if (!existingAsset) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '資産が見つかりません',
        },
      }, { status: 404, headers: { 'x-content-type-options': 'nosniff', 'x-powered-by': '' } });
    }

    const updatedAsset = await prisma.asset.update({
      where: { id: (await params).id },
      data: validatedData,
      include: {
        category: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedAsset,
      message: '資産を更新しました',
    }, { headers: { 'x-content-type-options': 'nosniff', 'x-powered-by': '' } });
  } catch (error) {
    console.error('Update asset error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '入力データが正しくありません',
          details: error.errors,
        },
      }, { status: 400, headers: { 'x-content-type-options': 'nosniff', 'x-powered-by': '' } });
    }

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    }, { status: 500, headers: { 'x-content-type-options': 'nosniff', 'x-powered-by': '' } });
  }
}

// 資産の削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // 資産の存在確認
    const existingAsset = await prisma.asset.findFirst({
      where: {
        id: (await params).id,
        userId: user.id,
      },
    });

    if (!existingAsset) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: '資産が見つかりません',
        },
      }, { status: 404, headers: { 'x-content-type-options': 'nosniff', 'x-powered-by': '' } });
    }

    await prisma.asset.delete({
      where: { id: (await params).id },
    });

    return NextResponse.json({
      success: true,
      message: '資産を削除しました',
    }, { headers: { 'x-content-type-options': 'nosniff', 'x-powered-by': '' } });
  } catch (error) {
    console.error('Delete asset error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    }, { status: 500, headers: { 'x-content-type-options': 'nosniff', 'x-powered-by': '' } });
  }
}