# 開発環境セットアップガイド

## 1. 前提条件

### 1.1 必要なソフトウェア
- **Node.js**: 18.17.0 以上
- **npm**: 9.0.0 以上 または **yarn**: 1.22.0 以上
- **Git**: 最新版
- **VS Code**: 推奨エディタ（拡張機能含む）
- **Azure CLI**: Azure App Serviceへのデプロイ用（オプション）

### 1.2 推奨環境
- **OS**: Windows 10/11, macOS 12+, Ubuntu 20.04+
- **メモリ**: 8GB以上
- **ストレージ**: 5GB以上の空き容量

## 2. プロジェクト構造作成

### 2.1 ルートディレクトリ作成
```bash
mkdir shisan-kanri
cd shisan-kanri
```

### 2.2 初期ディレクトリ構成
```bash
mkdir -p app shared docs deployment
mkdir -p docs/{images,diagrams}
mkdir -p deployment/{azure,github,scripts}
```

### 2.3 Git初期化
```bash
git init
echo "node_modules/\n.env\n.env.local\n*.log\ndist/\nbuild/\n.DS_Store" > .gitignore
```

## 3. アプリケーション環境構築

### 3.1 Next.js プロジェクト作成
```bash
cd app
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### 3.2 追加パッケージインストール
```bash
# UI & スタイリング
npm install @radix-ui/react-alert-dialog @radix-ui/react-avatar
npm install @radix-ui/react-button @radix-ui/react-card
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu
npm install @radix-ui/react-form @radix-ui/react-label
npm install @radix-ui/react-select @radix-ui/react-separator
npm install @radix-ui/react-tabs @radix-ui/react-toast
npm install lucide-react class-variance-authority clsx tailwind-merge

# 状態管理・データフェッチング
npm install zustand @tanstack/react-query
npm install react-hook-form @hookform/resolvers zod

# チャート・可視化
npm install recharts date-fns

# 開発ツール
npm install -D @types/node eslint-config-next
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D jest-environment-jsdom
```

### 3.3 shadcn/ui初期設定
```bash
npx shadcn-ui@latest init
```

基本的なコンポーネントをインストール：
```bash
npx shadcn-ui@latest add button card input label
npx shadcn-ui@latest add form select dropdown-menu
npx shadcn-ui@latest add dialog alert-dialog toast
npx shadcn-ui@latest add avatar separator tabs
```

## 4. 開発用コマンド作成

### 4.1 ルートディレクトリのpackage.json
```json
{
  "name": "shisan-kanri",
  "version": "1.0.0",
  "scripts": {
    "dev": "cd app && npm run dev",
    "build": "cd app && npm run build",
    "start": "cd app && npm start",
    "install:all": "npm install && cd app && npm install && cd ../shared && npm install",
    "lint": "cd app && npm run lint",
    "test": "cd app && npm run test",
    "db:generate": "cd app && npm run db:generate",
    "db:push": "cd app && npm run db:push",
    "db:migrate": "cd app && npm run db:migrate",
    "db:seed": "cd app && npm run db:seed",
    "db:studio": "cd app && npm run db:studio"
  }
}
```



## 5. Azure App Service デプロイ設定

### 5.1 Azure CLI設定（オプション）
```bash
# Azure CLIインストール（未インストールの場合）
# Windows: 
# winget install Microsoft.AzureCLI
# macOS: 
# brew install azure-cli
# Ubuntu: 
# curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Azureにログイン
az login
```

### 5.2 デプロイ設定ファイル作成

#### deployment/azure/app-service-app.json
```json
{
  "name": "shisan-kanri-web",
  "resourceGroup": "rg-shisan-kanri",
  "location": "Japan East",
  "runtime": "node|18-lts",
  "sku": "B1",
  "buildCommand": "npm run build",
  "startCommand": "npm start"
}
```

### 5.3 GitHub Actions ワークフロー

#### .github/workflows/deploy-app.yml
```yaml
name: Deploy App to Azure App Service

on:
  push:
    branches: [ main ]
    paths: [ 'app/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: |
        cd app
        npm ci
        
    - name: Build
      run: |
        cd app
        npm run build
        
    - name: Deploy to Azure App Service
      uses: azure/webapps-deploy@v2
      with:
        app-name: 'shisan-kanri-web'
        publish-profile: ${{ secrets.AZURE_WEBAPP_PUBLISH_PROFILE_APP }}
        package: './app'
```

## 6. 開発開始

### 6.1 全依存関係インストール
```bash
npm run install:all
```

### 6.2 環境変数設定
```bash
# app/.env ファイルを作成
cd app
cp .env.example .env
# 必要な環境変数を設定
```

### 6.3 データベース初期化
```bash
cd app
npx prisma generate
npx prisma db push
```

### 6.4 開発サーバー起動
```bash
npm run dev
```

これでアプリケーション（フロントエンド+バックエンド統合）が起動します：
- アプリケーション: http://localhost:3000

### 6.5 動作確認
1. ブラウザで http://localhost:3000 にアクセス
2. 「資産管理システム」のページが表示されることを確認
3. http://localhost:3000/api/health にアクセスして API が動作することを確認

## 7. Azure App Service デプロイ手順

### 7.1 リソースグループ作成
```bash
az group create --name rg-shisan-kanri --location "Japan East"
```

### 7.2 App Serviceプラン作成
```bash
az appservice plan create \
  --name plan-shisan-kanri \
  --resource-group rg-shisan-kanri \
  --sku B1 \
  --is-linux
```

### 7.3 App Service作成
```bash
az webapp create \
  --resource-group rg-shisan-kanri \
  --plan plan-shisan-kanri \
  --name shisan-kanri-app \
  --runtime "NODE|18-lts" \
  --deployment-local-git
```

### 7.4 PostgreSQLデータベース作成
```bash
az postgres flexible-server create \
  --resource-group rg-shisan-kanri \
  --name shisan-kanri-db \
  --location "Japan East" \
  --admin-user adminuser \
  --admin-password <your-password> \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32
```

## 8. 次のステップ

1. **認証システムの実装**
2. **資産管理機能の実装**
3. **ポートフォリオ機能の実装**
4. **テストの実装**
5. **Azure App Serviceへのデプロイ**
6. **監視・ログ設定**

## 9. トラブルシューティング

### 9.1 Azure App Service関連
```bash
# ログの確認
az webapp log tail --name shisan-kanri-app --resource-group rg-shisan-kanri

# アプリケーション設定の確認
az webapp config appsettings list --name shisan-kanri-app --resource-group rg-shisan-kanri
```

### 9.2 Node.jsバージョン確認
```bash
# Azure App Serviceで利用可能なNode.jsバージョン確認
az webapp list-runtimes --linux | grep -i node
```

これで資産管理アプリの開発環境が完全にセットアップされ、Azure App Serviceへのデプロイ準備も整いました！ 