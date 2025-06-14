import { PrismaClient } from '@prisma/client';

// Prismaクライアントのシングルトンインスタンス
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// データベース接続の確認
export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ データベースに接続しました');
  } catch (error) {
    console.error('❌ データベース接続エラー:', error);
    process.exit(1);
  }
};

// データベース接続の切断
export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('✅ データベース接続を切断しました');
  } catch (error) {
    console.error('❌ データベース切断エラー:', error);
  }
}; 