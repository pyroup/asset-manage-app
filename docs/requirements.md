# 資産管理アプリ 要件定義書

## 1. プロジェクト概要

### 1.1 プロジェクト名
資産管理システム（Shisan Kanri System）

### 1.2 目的
個人や家庭の資産（現金、株式、不動産、その他投資商品等）を一元管理し、資産状況の可視化とパフォーマンス分析を行うWebアプリケーション

### 1.3 対象ユーザー
- 個人投資家
- 家庭の資産管理を行いたい人
- 複数の投資商品を保有している人

## 2. 技術スタック

### 2.1 フロントエンド
- **フレームワーク**: Next.js (React)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **状態管理**: Zustand または React Context
- **UI コンポーネント**: shadcn/ui
- **フォーム**: React Hook Form + Zod

### 2.2 バックエンド
- **ランタイム**: Node.js
- **フレームワーク**: Express.js
- **言語**: TypeScript
- **認証**: JWT
- **バリデーション**: Zod
- **API ドキュメント**: Swagger/OpenAPI

### 2.3 データベース
- **開発環境**: SQLite
- **本番環境**: PostgreSQL（SQL Database）
- **ORM**: Prisma
- **パターン**: Repository Pattern

### 2.4 開発ツール
- **パッケージマネージャー**: npm/yarn
- **リンター**: ESLint + Prettier
- **テスト**: Jest + React Testing Library
- **バンドラー**: Next.js内蔵 + Express

### 2.5 デプロイメント・インフラ
- **フロントエンド**: Azure Static Web Apps または Azure App Service
- **バックエンド**: Azure App Service (Node.js ネイティブデプロイ)
- **データベース**: Azure Database for PostgreSQL
- **CI/CD**: GitHub Actions
- **監視**: Azure Application Insights

## 3. 機能要件

### 3.1 認証・認可機能
- ユーザー登録
- ログイン・ログアウト
- パスワードリセット
- セッション管理

### 3.2 資産管理機能
- **資産カテゴリ管理**
  - 現金・預金
  - 株式
  - 債券
  - 投資信託
  - 不動産
  - 暗号資産
  - その他

- **資産登録・編集・削除**
  - 資産名
  - カテゴリ
  - 数量
  - 単価
  - 取得日
  - 取得価格

### 3.3 ポートフォリオ機能
- 資産配分の可視化（円グラフ、棒グラフ）
- 資産総額の表示
- カテゴリ別資産額
- 損益計算

### 3.4 価格更新機能
- 外部API連携による株価取得
- 手動価格更新
- 価格履歴管理

### 3.5 レポート機能
- 月次・年次レポート
- パフォーマンス分析
- 資産推移グラフ

### 3.6 設定機能
- ユーザープロフィール編集
- 通知設定
- データエクスポート（CSV）

## 4. 非機能要件

### 4.1 パフォーマンス
- ページ読み込み時間: 3秒以内
- API レスポンス時間: 1秒以内

### 4.2 セキュリティ
- HTTPS通信
- SQLインジェクション対策
- XSS対策
- CSRF対策
- 認証トークンの適切な管理

### 4.3 可用性
- 稼働率: 99%以上
- バックアップ: 日次自動バックアップ

### 4.4 スケーラビリティ
- 同時接続ユーザー数: 100人
- データベース容量: 1GB（初期）

### 4.5 ユーザビリティ
- レスポンシブデザイン対応
- 直感的なUI/UX
- アクセシビリティ対応

## 5. システム構成

### 5.1 アーキテクチャ
```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└─────────────────┘
         │
    HTTP/HTTPS
         │
┌─────────────────┐
│   Backend       │
│   (Express.js)  │
└─────────────────┘
         │
    Repository
         │
┌─────────────────┐
│   Database      │
│ SQLite/Postgres │
└─────────────────┘
```

### 5.2 ディレクトリ構成
```
shisan-kanri/
├── frontend/          # Next.js アプリケーション
├── backend/           # Express.js API サーバー
├── shared/            # 共通の型定義・ユーティリティ
├── docs/              # ドキュメント
└── deployment/        # デプロイ設定ファイル（Azure App Service等）
    ├── azure/         # Azure関連設定
    │   ├── app-service-backend.json
    │   ├── app-service-frontend.json
    │   └── database-config.json
    ├── github/        # GitHub Actions ワークフロー
    │   ├── deploy-backend.yml
    │   ├── deploy-frontend.yml
    │   └── test.yml
    └── scripts/       # デプロイスクリプト
        ├── deploy-backend.sh
        ├── deploy-frontend.sh
        └── setup-azure.sh
```

### 5.3 Azure App Serviceデプロイ構成
```
┌─────────────────┐    ┌─────────────────┐
│  Static Web App │    │  App Service    │
│  (Frontend)     │◄───┤  (Backend API)  │
│  Next.js        │    │  Node.js        │
└─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ Azure Database  │
                       │ for PostgreSQL  │
                       └─────────────────┘
```

## 6. 開発フェーズ

### Phase 1: 基盤構築
- プロジェクト環境構築
- 認証システム
- 基本的なCRUD操作
- Azure App Service初期設定

### Phase 2: コア機能開発
- 資産管理機能
- ポートフォリオ表示
- 基本的なレポート

### Phase 3: 機能拡張
- 外部API連携
- 高度なレポート機能
- データエクスポート

### Phase 4: 最適化・テスト
- パフォーマンス最適化
- セキュリティ強化
- テスト充実
- 本番環境最適化

## 7. デプロイメント要件

### 7.1 Azure App Service設定
- **Node.js バージョン**: 18 LTS
- **スケーリング**: 自動スケーリング対応
- **環境変数**: Key Vaultでの秘匿情報管理
- **ログ**: Application Insightsとの連携

### 7.2 CI/CDパイプライン
- **ソースコード管理**: GitHub
- **自動テスト**: プルリクエスト時の自動実行
- **自動デプロイ**: メインブランチへのマージ時
- **ロールバック**: 前バージョンへの即座復旧

### 7.3 監視・運用
- **パフォーマンス監視**: Azure Application Insights
- **ログ管理**: Azure Log Analytics
- **アラート**: 異常検知時の自動通知
- **バックアップ**: データベースの定期バックアップ

## 8. 想定されるリスク

### 8.1 技術リスク
- 外部API制限・停止
- データベース移行の複雑性
- パフォーマンス問題
- Azure App Serviceの制限

### 8.2 ビジネスリスク
- ユーザー要求の変更
- セキュリティインシデント
- データ損失

### 8.3 対策
- API代替手段の準備
- 定期的なバックアップ
- セキュリティテストの実施
- Azure設定のベストプラクティス適用 