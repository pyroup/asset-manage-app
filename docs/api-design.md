# API設計書

## 1. 概要

資産管理アプリのREST API設計書です。Express.jsとTypeScriptで実装し、JWT認証によるセキュアなAPIを提供します。

## 2. API基本仕様

### 2.1 ベースURL
- **開発環境**: `http://localhost:3001/api/v1`
- **本番環境**: `https://api.shisan-kanri.com/api/v1`

### 2.2 認証方式
- **認証方式**: JWT Bearer Token
- **ヘッダー**: `Authorization: Bearer <token>`
- **トークン有効期限**: 24時間

### 2.3 共通レスポンス形式

#### 成功レスポンス
```json
{
  "success": true,
  "data": {},
  "message": "操作が成功しました"
}
```

#### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "バリデーションエラーが発生しました",
    "details": [
      {
        "field": "email",
        "message": "有効なメールアドレスを入力してください"
      }
    ]
  }
}
```

### 2.4 HTTPステータスコード
- `200` OK - 成功
- `201` Created - 作成成功
- `400` Bad Request - リクエストエラー
- `401` Unauthorized - 認証エラー
- `403` Forbidden - 権限エラー
- `404` Not Found - リソース未発見
- `409` Conflict - 競合エラー
- `422` Unprocessable Entity - バリデーションエラー
- `500` Internal Server Error - サーバーエラー

## 3. 認証・ユーザー管理API

### 3.1 ユーザー登録
```
POST /auth/register
```

**リクエストボディ**
```json
{
  "name": "山田太郎",
  "email": "yamada@example.com",
  "password": "password123"
}
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "name": "山田太郎",
      "email": "yamada@example.com"
    },
    "token": "jwt_token"
  },
  "message": "ユーザー登録が完了しました"
}
```

### 3.2 ログイン
```
POST /auth/login
```

**リクエストボディ**
```json
{
  "email": "yamada@example.com",
  "password": "password123"
}
```

### 3.3 ログアウト
```
POST /auth/logout
Authorization: Bearer <token>
```

### 3.4 トークン更新
```
POST /auth/refresh
Authorization: Bearer <token>
```

### 3.5 パスワードリセット要求
```
POST /auth/forgot-password
```

**リクエストボディ**
```json
{
  "email": "yamada@example.com"
}
```

### 3.6 パスワードリセット実行
```
POST /auth/reset-password
```

**リクエストボディ**
```json
{
  "token": "reset_token",
  "password": "new_password123"
}
```

## 4. ユーザー情報API

### 4.1 ユーザー情報取得
```
GET /users/me
Authorization: Bearer <token>
```

### 4.2 ユーザー情報更新
```
PUT /users/me
Authorization: Bearer <token>
```

**リクエストボディ**
```json
{
  "name": "山田次郎"
}
```

### 4.3 ユーザー削除
```
DELETE /users/me
Authorization: Bearer <token>
```

## 5. 資産カテゴリAPI

### 5.1 カテゴリ一覧取得
```
GET /categories
Authorization: Bearer <token>
```

**レスポンス**
```json
{
  "success": true,
  "data": [
    {
      "id": "cash",
      "name": "現金・預金",
      "description": "普通預金、定期預金、現金等",
      "color": "#22C55E",
      "icon": "banknotes"
    }
  ]
}
```

### 5.2 カテゴリ詳細取得
```
GET /categories/:id
Authorization: Bearer <token>
```

## 6. 資産管理API

### 6.1 資産一覧取得
```
GET /assets
Authorization: Bearer <token>
```

**クエリパラメータ**
- `category_id`: カテゴリフィルター
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20）
- `sort`: ソート項目（name, acquisition_date, current_value）
- `order`: ソート順（asc, desc）

**レスポンス**
```json
{
  "success": true,
  "data": {
    "assets": [
      {
        "id": "uuid",
        "name": "トヨタ自動車",
        "symbol": "7203",
        "category": {
          "id": "stocks",
          "name": "株式",
          "color": "#EF4444"
        },
        "quantity": 100,
        "acquisition_price": 2000,
        "current_price": 2100,
        "acquisition_date": "2024-01-15",
        "current_value": 210000,
        "gain_loss": 10000,
        "gain_loss_percent": 5.0,
        "currency": "JPY"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "pages": 3
    }
  }
}
```

### 6.2 資産詳細取得
```
GET /assets/:id
Authorization: Bearer <token>
```

### 6.3 資産登録
```
POST /assets
Authorization: Bearer <token>
```

**リクエストボディ**
```json
{
  "name": "トヨタ自動車",
  "symbol": "7203",
  "category_id": "stocks",
  "quantity": 100,
  "acquisition_price": 2000,
  "acquisition_date": "2024-01-15",
  "currency": "JPY",
  "notes": "長期保有予定"
}
```

### 6.4 資産更新
```
PUT /assets/:id
Authorization: Bearer <token>
```

### 6.5 資産削除
```
DELETE /assets/:id
Authorization: Bearer <token>
```

### 6.6 資産価格更新
```
PUT /assets/:id/price
Authorization: Bearer <token>
```

**リクエストボディ**
```json
{
  "current_price": 2150,
  "source": "manual"
}
```

## 7. ポートフォリオAPI

### 7.1 ポートフォリオサマリー取得
```
GET /portfolio/summary
Authorization: Bearer <token>
```

**レスポンス**
```json
{
  "success": true,
  "data": {
    "total_value": 1500000,
    "total_gain_loss": 150000,
    "total_gain_loss_percent": 11.11,
    "categories": [
      {
        "category_id": "stocks",
        "category_name": "株式",
        "value": 800000,
        "percentage": 53.33,
        "gain_loss": 100000,
        "gain_loss_percent": 14.29
      }
    ],
    "updated_at": "2024-01-20T10:30:00Z"
  }
}
```

### 7.2 ポートフォリオチャートデータ取得
```
GET /portfolio/chart
Authorization: Bearer <token>
```

**クエリパラメータ**
- `period`: 期間（1w, 1m, 3m, 6m, 1y, all）

### 7.3 資産配分データ取得
```
GET /portfolio/allocation
Authorization: Bearer <token>
```

**クエリパラメータ**
- `type`: 配分タイプ（category, asset）

## 8. レポートAPI

### 8.1 月次レポート取得
```
GET /reports/monthly
Authorization: Bearer <token>
```

**クエリパラメータ**
- `year`: 年（必須）
- `month`: 月（必須）

### 8.2 年次レポート取得
```
GET /reports/yearly
Authorization: Bearer <token>
```

**クエリパラメータ**
- `year`: 年（必須）

### 8.3 パフォーマンス分析取得
```
GET /reports/performance
Authorization: Bearer <token>
```

**クエリパラメータ**
- `period`: 分析期間（1m, 3m, 6m, 1y）

## 9. 価格履歴API

### 9.1 価格履歴取得
```
GET /assets/:id/price-history
Authorization: Bearer <token>
```

**クエリパラメータ**
- `from`: 開始日（YYYY-MM-DD）
- `to`: 終了日（YYYY-MM-DD）
- `limit`: 取得件数制限

### 9.2 価格履歴追加
```
POST /assets/:id/price-history
Authorization: Bearer <token>
```

**リクエストボディ**
```json
{
  "price": 2150,
  "date": "2024-01-20",
  "source": "manual"
}
```

## 10. データエクスポートAPI

### 10.1 資産データエクスポート
```
GET /export/assets
Authorization: Bearer <token>
```

**クエリパラメータ**
- `format`: エクスポート形式（csv, json）
- `category_id`: カテゴリフィルター

**レスポンス**
- CSV形式の場合: `Content-Type: text/csv`
- JSON形式の場合: `Content-Type: application/json`

### 10.2 ポートフォリオデータエクスポート
```
GET /export/portfolio
Authorization: Bearer <token>
```

## 11. 外部API連携

### 11.1 株価取得（管理者用）
```
POST /admin/prices/update
Authorization: Bearer <admin_token>
```

**リクエストボディ**
```json
{
  "symbols": ["7203", "6758", "9984"]
}
```

## 12. ミドルウェア

### 12.1 認証ミドルウェア
```typescript
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  // JWT トークン検証ロジック
};
```

### 12.2 バリデーションミドルウェア
```typescript
export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Zod バリデーションロジック
  };
};
```

### 12.3 エラーハンドリングミドルウェア
```typescript
export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  // エラーレスポンス生成ロジック
};
```

## 13. レート制限

### 13.1 API レート制限
- **一般API**: 100リクエスト/分/ユーザー
- **認証API**: 5リクエスト/分/IP
- **エクスポートAPI**: 10リクエスト/時/ユーザー

### 13.2 レート制限ヘッダー
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1640995200
```

## 14. API バージョニング

### 14.1 バージョン管理方針
- URLパスでのバージョン指定: `/api/v1/`
- 後方互換性の維持期間: 1年間
- 非推奨警告ヘッダー: `X-API-Deprecated: true`

### 14.2 バージョン移行
- 新機能は新バージョンで提供
- 破壊的変更は必ず新バージョン
- 移行ガイドの提供

## 15. テスト戦略

### 15.1 APIテスト
- **単体テスト**: Jest + Supertest
- **統合テスト**: 実際のデータベースを使用
- **E2Eテスト**: Postman/Newman

### 15.2 テストデータ
- **テストユーザー**: 自動生成
- **モックデータ**: factory-bot類似ライブラリ
- **テストDB**: 別途SQLiteファイル 