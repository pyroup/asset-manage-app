import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import path from 'path';

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

// セキュリティミドルウェア（一時的に無効化）
if (process.env.ENABLE_HELMET === 'true') {
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        connectSrc: ["'self'", "https:", "wss:"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https:"],
        frameSrc: ["'self'"],
        formAction: ["'self'"],
        baseUri: ["'self'"],
      },
    } : false,
    crossOriginEmbedderPolicy: false,
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin"
    }
  }));
} else {
  console.log('🔓 Helmetは無効化されています（トラブルシューティング用）');
}

// CORS設定
const corsOrigins: (string | RegExp)[] = process.env.NODE_ENV === 'production' 
  ? [
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
      /\.azurewebsites\.net$/,  // Azure App Service ドメイン
    ]
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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

// 本番環境でフロントエンドの静的ファイルを配信
if (process.env.NODE_ENV === 'production') {
  // Next.js exportの静的ファイル配信（より詳細な設定）
  const frontendPath = path.join(__dirname, '../../frontend/out');
  
  app.use(express.static(frontendPath, {
    index: false, // 自動的にindex.htmlを返さない
    maxAge: '1h', // キャッシュ設定
    setHeaders: (res, path) => {
      // セキュリティヘッダーを緩和
      res.set('X-Content-Type-Options', 'nosniff');
      if (path.endsWith('.html')) {
        res.set('Cache-Control', 'no-cache');
      }
    },
  }));
  
  console.log(`📁 静的ファイル配信設定: ${frontendPath}`);
}

// ヘルスチェックエンドポイント
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// デバッグ用エンドポイント（本番環境でのトラブルシューティング用）
app.get('/debug', (req, res) => {
  const fs = require('fs');
  const frontendOutPath = path.join(__dirname, '../../frontend/out');
  const frontendIndexPath = path.join(frontendOutPath, 'index.html');
  
  const debugInfo = {
    environment: process.env.NODE_ENV,
    currentPath: __dirname,
    frontendOutPath,
    frontendIndexExists: fs.existsSync(frontendIndexPath),
    frontendOutExists: fs.existsSync(frontendOutPath),
    frontendOutContents: fs.existsSync(frontendOutPath) ? 
      fs.readdirSync(frontendOutPath).slice(0, 10) : 'Directory not found',
    helmet: 'enabled with custom CSP',
    port: process.env.PORT || 3002,
  };
  
  res.json(debugInfo);
});

// APIルート
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetsRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/reports', reportsRoutes);

// 本番環境でNext.jsアプリのルートハンドリング
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res, next) => {
    // APIリクエストはスキップ
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    // 静的ファイル（拡張子あり）はスキップ
    if (req.path.includes('.') && !req.path.endsWith('/')) {
      return next();
    }
    
    // SPAのルーティング用にindex.htmlを返す
    const indexPath = path.join(__dirname, '../../frontend/out/index.html');
    res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Index.html送信エラー:', err);
        res.status(500).json({ error: 'ページの読み込みに失敗しました' });
      }
    });
  });
}

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