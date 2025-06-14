import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 データベースにシードデータを投入中...');

  // 資産カテゴリの作成
  const categories = [
    {
      id: 'cash',
      name: '現金・預金',
      description: '現金、普通預金、定期預金など',
      color: '#10B981',
      icon: 'cash',
    },
    {
      id: 'stocks',
      name: '株式',
      description: '国内株式、外国株式',
      color: '#3B82F6',
      icon: 'trending-up',
    },
    {
      id: 'bonds',
      name: '債券',
      description: '国債、社債、外国債券',
      color: '#8B5CF6',
      icon: 'file-text',
    },
    {
      id: 'funds',
      name: '投資信託・ETF',
      description: '投資信託、ETF、REIT',
      color: '#F59E0B',
      icon: 'pie-chart',
    },
    {
      id: 'real-estate',
      name: '不動産',
      description: '住宅、土地、投資用不動産',
      color: '#EF4444',
      icon: 'home',
    },
    {
      id: 'crypto',
      name: '暗号資産',
      description: 'ビットコイン、イーサリアムなど',
      color: '#F97316',
      icon: 'zap',
    },
    {
      id: 'commodities',
      name: '商品',
      description: '金、銀、原油など',
      color: '#84CC16',
      icon: 'star',
    },
    {
      id: 'others',
      name: 'その他',
      description: 'その他の投資・資産',
      color: '#6B7280',
      icon: 'more-horizontal',
    },
  ];

  for (const category of categories) {
    await prisma.assetCategory.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
    console.log(`✅ カテゴリ「${category.name}」を作成しました`);
  }

  console.log('🎉 シードデータの投入が完了しました！');
}

main()
  .catch((e) => {
    console.error('❌ シードデータの投入に失敗しました:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 