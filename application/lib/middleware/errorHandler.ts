import { Request, Response, NextFunction } from 'express';
// 必要な場合のみアンコメントしてください
// import { ZodError } from 'zod';
// import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

// Prismaエラー用インタフェース
interface PrismaError {
  code?: string;
  name?: string;
}

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
) => {
  const err = error as Error & PrismaError;
  console.error('エラーが発生しました:', error);
  // バリデーションエラー
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: err.message || 'バリデーションエラーが発生しました',
      },
    });
  }

  // Prismaエラー
  if (err.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_ERROR',
        message: '重複するデータが存在します',
      },
    });
  }

  // JWT エラー
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: '無効なトークンです',
      },
    });
  }

  // その他のエラー
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'サーバー内部エラーが発生しました',
    },
  });
}; 