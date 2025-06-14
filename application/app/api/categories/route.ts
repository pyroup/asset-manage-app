import { NextResponse } from 'next/server';
import { prisma } from '@/lib/config/database';

// Next.jsの静的エクスポート設定用
export const dynamic = "auto";

export async function GET() {
  try {
    const categories = await prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    }, { status: 500 });
  }
} 