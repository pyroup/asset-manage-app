import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '@/lib/config/database';

const LoginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードは必須です'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = LoginSchema.parse(body);
    
    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'メールアドレスまたはパスワードが正しくありません',
        },
      }, { status: 401 });
    }

    // パスワード検証
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    
    if (!isValidPassword) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'メールアドレスまたはパスワードが正しくありません',
        },
      }, { status: 401 });
    }

    // JWTトークン生成
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // 既存セッションの削除
    await prisma.userSession.deleteMany({
      where: { userId: user.id },
    });

    // 新しいセッション作成
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7日後

    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash: await bcrypt.hash(token, 10),
        expiresAt,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        token,
      },
      message: 'ログインしました',
    });
  } catch (error) {
    console.error('Login error:', error);
    
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