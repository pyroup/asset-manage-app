import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/middleware/auth';

// Next.jsの静的エクスポート設定用
export const dynamic = "auto";

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

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        user,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'サーバーエラーが発生しました',
      },
    }, { status: 500 });
  }
} 