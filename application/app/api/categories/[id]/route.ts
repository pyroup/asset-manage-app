import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';

// Next.jsの静的エクスポート設定用
export const dynamic = "auto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const category = await prisma.assetCategory.findUnique({
      where: { id: (await params).id },
      include: {
        _count: {
          select: { assets: true },
        },
      },
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

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Get category error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    }, { status: 500 });
  }
}