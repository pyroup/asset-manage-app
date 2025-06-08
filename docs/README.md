# 資産管理システム（Shisan Kanri System）

## 📋 プロジェクト概要

個人や家庭の資産（現金、株式、不動産、その他投資商品等）を一元管理し、資産状況の可視化とパフォーマンス分析を行うWebアプリケーションです。

## 🎯 主な機能

- **資産管理**: 様々な資産カテゴリの登録・編集・削除
- **ポートフォリオ分析**: 資産配分の可視化と損益計算
- **価格追跡**: 手動・自動での価格更新と履歴管理
- **レポート生成**: 月次・年次レポートとパフォーマンス分析
- **データエクスポート**: CSV形式でのデータ出力

## 🛠 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **React 18** + **TypeScript**
- **Tailwind CSS** + **shadcn/ui**
- **Zustand** (状態管理)
- **TanStack Query** (データフェッチング)
- **React Hook Form** + **Zod** (フォーム管理)
- **Recharts** (データ可視化)

### バックエンド
- **Node.js** + **Express.js**
- **TypeScript**
- **Prisma** (ORM)
- **JWT** (認証)
- **Zod** (バリデーション)

### データベース
- **SQLite** (開発環境)
- **PostgreSQL** (本番環境)
- **Repository Pattern** による抽象化

### デプロイメント
- **Azure App Service** (ネイティブNode.jsデプロイ)
- **Azure Database for PostgreSQL** (本番DB)
- **GitHub Actions** (CI/CD)

## 📁 プロジェクト構成

```
shisan-kanri/
├── app/               # Next.js フルスタックアプリケーション（フロントエンド+API）
├── shared/            # 共通の型定義・ユーティリティ
├── docs/              # プロジェクトドキュメント
│   ├── requirements.md      # 要件定義書
│   ├── database-design.md   # データベース設計書
│   ├── api-design.md        # API設計書
│   ├── app-design.md        # フロントエンド設計書
│   ├── setup-guide.md       # 開発環境セットアップガイド
│   └── README.md           # プロジェクト概要
└── deployment/        # デプロイ設定ファイル（Azure App Service等）
    ├── azure/         # Azure関連設定
    ├── github/        # GitHub Actions ワークフロー
    └── scripts/       # デプロイスクリプト
```

## 🚀 クイックスタート

### 前提条件
- Node.js 18.17.0 以上
- npm 9.0.0 以上
- Git

### 1. リポジトリクローン
```bash
git clone <repository-url>
cd shisan-kanri
```

### 2. 依存関係インストール
```bash
npm run install:all
```

### 3. 環境変数設定
```bash
# app/.env ファイルを作成
cp app/.env.example app/.env
```

### 4. データベース初期化
```bash
cd app
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. 開発サーバー起動
```bash
npm run dev
```

- アプリケーション: http://localhost:3000
- API: http://localhost:3000/api
- Prisma Studio: http://localhost:5555

## 📚 ドキュメント

詳細な設計書と開発ガイドは `docs/` ディレクトリに格納されています：

- **[要件定義書](./requirements.md)**: 機能要件・非機能要件の詳細
- **[データベース設計書](./database-design.md)**: テーブル設計とRepository Pattern
- **[API設計書](./api-design.md)**: RESTful APIエンドポイント仕様
- **[フロントエンド設計書](./app-design.md)**: コンポーネント設計とUI/UX
- **[セットアップガイド](./setup-guide.md)**: 開発環境構築の詳細手順

## 🏗 開発フェーズ

### Phase 1: 基盤構築 ✅
- [x] プロジェクト環境構築
- [x] 認証システム設計
- [x] 基本的なCRUD操作設計

### Phase 2: コア機能開発 🚧
- [ ] 資産管理機能実装
- [ ] ポートフォリオ表示機能
- [ ] 基本的なレポート機能

### Phase 3: 機能拡張 📋
- [ ] 外部API連携
- [ ] 高度なレポート機能
- [ ] データエクスポート機能

### Phase 4: 最適化・テスト 📋
- [ ] パフォーマンス最適化
- [ ] セキュリティ強化
- [ ] テスト充実

## 🧪 テスト

```bash
# 全テスト実行
npm run test

# アプリケーションテスト
cd app && npm run test
```

## 📦 ビルド・デプロイ

### ローカルビルド
```bash
# 本番ビルド
npm run build

# アプリケーションのみ
npm run build
```

### Azure App Serviceデプロイ
```bash
# Azure CLIを使用したデプロイ
az webapp up --name shisan-kanri-app --resource-group rg-shisan-kanri
```

## 🔧 開発ツール

### 推奨VS Code拡張機能
- TypeScript
- Tailwind CSS IntelliSense
- Prisma
- Prettier
- ESLint
- Jest
- Azure App Service

### コード品質
```bash
# リンター実行
npm run lint

# フォーマッター実行
npm run format
```

## 🛡 セキュリティ

- JWT認証による安全なAPI
- HTTPS通信の強制
- SQLインジェクション対策（Prisma）
- XSS・CSRF対策
- レート制限の実装
- Azure App Serviceの組み込みセキュリティ機能

## 🌐 対応ブラウザ

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📱 レスポンシブ対応

- デスクトップ (1280px+)
- タブレット (768px - 1279px)
- スマートフォン (320px - 767px)

## ☁️ クラウドアーキテクチャ

```
┌─────────────────┐    ┌─────────────────┐
│   Azure CDN     │    │  Azure App      │
│   (Static Web)  │    │  Service        │
│   App           │◄───┤   App API       │
└─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Azure Database  │
                       │ for PostgreSQL  │
                       └─────────────────┘
```

## 🤝 コントリビューション

1. フォークを作成
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルを参照してください。

## 📞 サポート

質問や問題がある場合は、以下の方法でお問い合わせください：

- GitHub Issues: プロジェクトのIssueページ
- Email: support@shisan-kanri.com
- Discord: [開発者コミュニティ](https://discord.gg/shisan-kanri)

## 🙏 謝辞

このプロジェクトは以下のオープンソースプロジェクトに支えられています：

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [Prisma](https://www.prisma.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

**資産管理システム** - あなたの資産を賢く管理しましょう 💰 