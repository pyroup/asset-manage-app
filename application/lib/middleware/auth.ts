import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import { Request, Response, NextFunction } from 'express';

export interface User {
  id: string;
  email: string;
  name: string;
}

export const verifyToken = async (request: NextRequest): Promise<User | null> => {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return null;
    }

    // JWTトークンの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return null;
    }

    // セッションの確認
    const session = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
};

// Express用の従来のミドルウェア（後方互換性のため）
export interface AuthenticatedRequest extends Request {
  user: User;  // ユーザー情報
}

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Express.jsのリクエストヘッダーは小文字を使用
    const authHeader = req.headers.authorization;
    const token = authHeader && typeof authHeader === 'string' ? authHeader.split(' ')[1] : null; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'アクセストークンが必要です',
        },
      });
    }

    // JWTトークンの検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      email: string;
    };

    // ユーザーの存在確認
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'ユーザーが見つかりません',
        },
      });
    }

    // セッションの確認
    const session = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'セッションが無効です',
        },
      });
    }    (req as AuthenticatedRequest).user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: '無効なトークンです',
        },
      });
    }

    next(error);
  }
}; 