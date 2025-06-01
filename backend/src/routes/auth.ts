import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// バリデーションスキーマ
const CreateUserSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'パスワードは大文字・小文字・数字を含む必要があります'),
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
});

const LoginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードは必須です'),
});

// ユーザー登録
router.post('/register', async (req, res, next) => {
  try {
    const validatedData = CreateUserSchema.parse(req.body);
    
    // パスワードのハッシュ化
    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    
    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        name: validatedData.name,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    // JWTトークン生成
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // セッション作成
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7日後

    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash: await bcrypt.hash(token, 10),
        expiresAt,
      },
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
      message: 'ユーザー登録が完了しました',
    });
  } catch (error) {
    next(error);
  }
});

// ログイン
router.post('/login', async (req, res, next) => {
  try {
    const validatedData = LoginSchema.parse(req.body);
    
    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'メールアドレスまたはパスワードが正しくありません',
        },
      });
    }

    // パスワード検証
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_ERROR',
          message: 'メールアドレスまたはパスワードが正しくありません',
        },
      });
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

    res.json({
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
    next(error);
  }
});

// ログアウト
router.post('/logout', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    // セッション削除
    await prisma.userSession.deleteMany({
      where: { userId: req.user!.id },
    });

    res.json({
      success: true,
      message: 'ログアウトしました',
    });
  } catch (error) {
    next(error);
  }
});

// 現在のユーザー情報取得
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// トークンの検証
router.post('/verify', authenticateToken, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    data: {
      valid: true,
      user: req.user,
    },
  });
});

export default router; 