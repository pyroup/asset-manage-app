import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// 全カテゴリの取得
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
});

// 特定カテゴリの取得
router.get('/:id', async (req, res, next) => {
  try {
    const category = await prisma.assetCategory.findUnique({
      where: { id: req.params.id },
      include: {
        _count: {
          select: { assets: true },
        },
      },
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

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    next(error);
  }
});

export default router; 