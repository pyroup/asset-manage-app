import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { connectDatabase, disconnectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

// ルーターのインポート
import authRoutes from './routes/auth';
import assetsRoutes from './routes/assets';
import categoriesRoutes from './routes/categories';
import portfolioRoutes from './routes/portfolio';
import reportsRoutes from './routes/reports';

// 環境変数の読み込み
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

// セキュリティミドルウェア
app.use(helmet());

// CORS設定
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// レート制限
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15分
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 最大100リクエスト
  message: {
    error: 'リクエストが多すぎます。しばらく待ってから再試行してください。',
  },
});
app.use('/api', limiter);

// 基本ミドルウェア
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// APIルート
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/reports', reportsRoutes);

// エラーハンドリング
app.use(notFoundHandler);
app.use(errorHandler);

// サーバー起動
const startServer = async () => {
  try {
    // データベース接続
    await connectDatabase();
    
    // サーバー起動
    const server = app.listen(PORT, () => {
      console.log(`🚀 サーバーがポート ${PORT} で起動しました`);
      console.log(`📊 環境: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 フロントエンドURL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
    });

    // グレースフルシャットダウン
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} を受信しました。サーバーを終了します...`);
      
      server.close(async () => {
        console.log('HTTP サーバーを終了しました');
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('❌ サーバー起動エラー:', error);
    process.exit(1);
  }
};

startServer(); 