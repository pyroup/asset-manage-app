# データベース設計書

## 1. 概要

資産管理アプリのデータベース設計書です。Repository Patternを採用し、SQLite（開発環境）とPostgreSQL（本番環境）の両方に対応できる設計としています。

## 2. データベース構成

### 2.1 使用技術
- **ORM**: Prisma
- **開発DB**: SQLite
- **本番DB**: PostgreSQL
- **マイグレーション**: Prisma Migrate

### 2.2 Repository Pattern構成
```
repositories/
├── interfaces/        # リポジトリインターface
├── sqlite/           # SQLite実装
├── postgresql/       # PostgreSQL実装
└── factory.ts        # リポジトリファクトリ
```

## 3. テーブル設計

### 3.1 ユーザー管理

#### users テーブル
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|----|----|-----------|------|
| id | TEXT | NO | - | ユーザーID（UUID） |
| email | TEXT | NO | - | メールアドレス |
| password_hash | TEXT | NO | - | ハッシュ化されたパスワード |
| name | TEXT | NO | - | ユーザー名 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

### 3.2 資産カテゴリ管理

#### asset_categories テーブル
```sql
CREATE TABLE asset_categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    icon TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|----|----|-----------|------|
| id | TEXT | NO | - | カテゴリID（UUID） |
| name | TEXT | NO | - | カテゴリ名 |
| description | TEXT | YES | - | カテゴリ説明 |
| color | TEXT | NO | #3B82F6 | 表示色（HEX） |
| icon | TEXT | YES | - | アイコン名 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

#### 初期データ
```sql
INSERT INTO asset_categories (id, name, description, color, icon) VALUES
('cash', '現金・預金', '普通預金、定期預金、現金等', '#22C55E', 'banknotes'),
('stocks', '株式', '国内株式、海外株式', '#EF4444', 'trending-up'),
('bonds', '債券', '国債、社債、地方債', '#8B5CF6', 'file-text'),
('funds', '投資信託', 'インデックスファンド、アクティブファンド', '#F59E0B', 'pie-chart'),
('realestate', '不動産', '住宅、投資用不動産', '#84CC16', 'home'),
('crypto', '暗号資産', 'ビットコイン、イーサリアム等', '#F97316', 'coins'),
('other', 'その他', 'その他の投資商品', '#6B7280', 'more-horizontal');
```

### 3.3 資産管理

#### assets テーブル
```sql
CREATE TABLE assets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT,
    quantity DECIMAL(20, 8) NOT NULL DEFAULT 0,
    acquisition_price DECIMAL(20, 2) NOT NULL,
    current_price DECIMAL(20, 2) NOT NULL DEFAULT 0,
    acquisition_date DATE NOT NULL,
    currency TEXT DEFAULT 'JPY',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES asset_categories(id)
);
```

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|----|----|-----------|------|
| id | TEXT | NO | - | 資産ID（UUID） |
| user_id | TEXT | NO | - | ユーザーID |
| category_id | TEXT | NO | - | カテゴリID |
| name | TEXT | NO | - | 資産名 |
| symbol | TEXT | YES | - | ティッカーシンボル |
| quantity | DECIMAL(20, 8) | NO | 0 | 数量 |
| acquisition_price | DECIMAL(20, 2) | NO | - | 取得価格 |
| current_price | DECIMAL(20, 2) | NO | 0 | 現在価格 |
| acquisition_date | DATE | NO | - | 取得日 |
| currency | TEXT | NO | JPY | 通貨 |
| notes | TEXT | YES | - | メモ |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |
| updated_at | DATETIME | NO | CURRENT_TIMESTAMP | 更新日時 |

### 3.4 価格履歴

#### price_history テーブル
```sql
CREATE TABLE price_history (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    price DECIMAL(20, 2) NOT NULL,
    date DATE NOT NULL,
    source TEXT DEFAULT 'manual',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
    UNIQUE(asset_id, date)
);
```

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|----|----|-----------|------|
| id | TEXT | NO | - | 履歴ID（UUID） |
| asset_id | TEXT | NO | - | 資産ID |
| price | DECIMAL(20, 2) | NO | - | 価格 |
| date | DATE | NO | - | 価格日付 |
| source | TEXT | NO | manual | 価格ソース（manual/api） |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |

### 3.5 ポートフォリオスナップショット

#### portfolio_snapshots テーブル
```sql
CREATE TABLE portfolio_snapshots (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    total_value DECIMAL(20, 2) NOT NULL,
    total_gain_loss DECIMAL(20, 2) NOT NULL,
    total_gain_loss_percent DECIMAL(10, 4) NOT NULL,
    snapshot_date DATE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, snapshot_date)
);
```

| カラム名 | 型 | NULL | デフォルト | 説明 |
|---------|----|----|-----------|------|
| id | TEXT | NO | - | スナップショットID（UUID） |
| user_id | TEXT | NO | - | ユーザーID |
| total_value | DECIMAL(20, 2) | NO | - | 総資産額 |
| total_gain_loss | DECIMAL(20, 2) | NO | - | 総損益金額 |
| total_gain_loss_percent | DECIMAL(10, 4) | NO | - | 総損益率 |
| snapshot_date | DATE | NO | - | スナップショット日付 |
| created_at | DATETIME | NO | CURRENT_TIMESTAMP | 作成日時 |

### 3.6 セッション管理

#### user_sessions テーブル
```sql
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## 4. インデックス設計

```sql
-- ユーザー検索用
CREATE INDEX idx_users_email ON users(email);

-- 資産検索用
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_assets_category_id ON assets(category_id);
CREATE INDEX idx_assets_symbol ON assets(symbol);

-- 価格履歴検索用
CREATE INDEX idx_price_history_asset_id ON price_history(asset_id);
CREATE INDEX idx_price_history_date ON price_history(date);

-- ポートフォリオスナップショット検索用
CREATE INDEX idx_portfolio_snapshots_user_id ON portfolio_snapshots(user_id);
CREATE INDEX idx_portfolio_snapshots_date ON portfolio_snapshots(snapshot_date);

-- セッション検索用
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
```

## 5. Repository Pattern実装

### 5.1 インターフェース定義
```typescript
// repositories/interfaces/IUserRepository.ts
export interface IUserRepository {
  create(user: CreateUserInput): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: UpdateUserInput): Promise<User>;
  delete(id: string): Promise<void>;
}

// repositories/interfaces/IAssetRepository.ts
export interface IAssetRepository {
  create(asset: CreateAssetInput): Promise<Asset>;
  findById(id: string): Promise<Asset | null>;
  findByUserId(userId: string): Promise<Asset[]>;
  update(id: string, data: UpdateAssetInput): Promise<Asset>;
  delete(id: string): Promise<void>;
  findByUserIdWithCategory(userId: string): Promise<AssetWithCategory[]>;
}
```

### 5.2 ファクトリパターン
```typescript
// repositories/factory.ts
export class RepositoryFactory {
  private static instance: RepositoryFactory;
  private dbType: 'sqlite' | 'postgresql';

  constructor(dbType: 'sqlite' | 'postgresql') {
    this.dbType = dbType;
  }

  static getInstance(dbType?: 'sqlite' | 'postgresql'): RepositoryFactory {
    if (!RepositoryFactory.instance) {
      RepositoryFactory.instance = new RepositoryFactory(
        dbType || process.env.DB_TYPE as 'sqlite' | 'postgresql'
      );
    }
    return RepositoryFactory.instance;
  }

  getUserRepository(): IUserRepository {
    switch (this.dbType) {
      case 'sqlite':
        return new SqliteUserRepository();
      case 'postgresql':
        return new PostgresqlUserRepository();
      default:
        throw new Error(`Unsupported database type: ${this.dbType}`);
    }
  }

  getAssetRepository(): IAssetRepository {
    switch (this.dbType) {
      case 'sqlite':
        return new SqliteAssetRepository();
      case 'postgresql':
        return new PostgresqlAssetRepository();
      default:
        throw new Error(`Unsupported database type: ${this.dbType}`);
    }
  }
}
```

## 6. マイグレーション戦略

### 6.1 環境別設定
- 開発環境：SQLiteファイルベース
- ステージング環境：PostgreSQL
- 本番環境：PostgreSQL

### 6.2 データ移行
1. スキーマ移行：Prisma Migrateを使用
2. データ移行：カスタムスクリプトで実装
3. バックアップ：移行前の自動バックアップ

## 7. パフォーマンス最適化

### 7.1 クエリ最適化
- 適切なインデックスの設定
- N+1問題の回避
- バッチ処理の活用

### 7.2 キャッシュ戦略
- 頻繁にアクセスされるデータのメモリキャッシュ
- 価格データのキャッシュ（Redis検討）

## 8. セキュリティ考慮事項

### 8.1 データ保護
- パスワードのハッシュ化（bcrypt）
- 個人情報の暗号化検討
- SQLインジェクション対策（Prismaによる自動対策）

### 8.2 アクセス制御
- ユーザー単位でのデータ分離
- 適切な外部キー制約
- 論理削除の検討（必要に応じて） 