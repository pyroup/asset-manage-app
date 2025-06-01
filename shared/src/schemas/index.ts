import { z } from 'zod';

// ユーザー関連のスキーマ
export const CreateUserSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'パスワードは大文字・小文字・数字を含む必要があります'),
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
});

export const UpdateUserSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください').optional(),
  email: z.string().email('有効なメールアドレスを入力してください').optional(),
});

export const LoginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードは必須です'),
});

// 資産関連のスキーマ
export const CreateAssetSchema = z.object({
  categoryId: z.string().min(1, 'カテゴリは必須です'),
  name: z.string().min(1, '資産名は必須です').max(200, '資産名は200文字以内で入力してください'),
  symbol: z.string().max(20, 'シンボルは20文字以内で入力してください').optional(),
  quantity: z.number().positive('数量は正の数で入力してください'),
  acquisitionPrice: z.number().positive('取得価格は正の数で入力してください'),
  acquisitionDate: z.coerce.date(),
  currency: z.string().length(3, '通貨コードは3文字で入力してください').default('JPY').optional(),
  notes: z.string().max(1000, 'メモは1000文字以内で入力してください').optional(),
});

export const UpdateAssetSchema = z.object({
  name: z.string().min(1, '資産名は必須です').max(200, '資産名は200文字以内で入力してください').optional(),
  symbol: z.string().max(20, 'シンボルは20文字以内で入力してください').optional(),
  quantity: z.number().positive('数量は正の数で入力してください').optional(),
  acquisitionPrice: z.number().positive('取得価格は正の数で入力してください').optional(),
  currentPrice: z.number().nonnegative('現在価格は0以上で入力してください').optional(),
  acquisitionDate: z.coerce.date().optional(),
  currency: z.string().length(3, '通貨コードは3文字で入力してください').optional(),
  notes: z.string().max(1000, 'メモは1000文字以内で入力してください').optional(),
});

export const UpdateAssetPriceSchema = z.object({
  currentPrice: z.number().nonnegative('現在価格は0以上で入力してください'),
  source: z.enum(['manual', 'api']).default('manual'),
});

// 価格履歴関連のスキーマ
export const CreatePriceHistorySchema = z.object({
  assetId: z.string().min(1, '資産IDは必須です'),
  price: z.number().nonnegative('価格は0以上で入力してください'),
  date: z.coerce.date(),
  source: z.enum(['manual', 'api']).default('manual'),
});

// フィルター・クエリパラメータのスキーマ
export const AssetFiltersSchema = z.object({
  categoryId: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20).optional(),
  sort: z.enum(['name', 'acquisitionDate', 'currentValue', 'gainLoss']).default('name').optional(),
  order: z.enum(['asc', 'desc']).default('asc').optional(),
});

export const PortfolioFiltersSchema = z.object({
  period: z.enum(['1w', '1m', '3m', '6m', '1y', 'all']).default('1y').optional(),
  type: z.enum(['category', 'asset']).default('category').optional(),
});

export const ReportFiltersSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2099),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

// パスワードリセット関連のスキーマ
export const ForgotPasswordSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'リセットトークンは必須です'),
  password: z
    .string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'パスワードは大文字・小文字・数字を含む必要があります'),
});

// 資産カテゴリ関連のスキーマ
export const CreateAssetCategorySchema = z.object({
  id: z.string().min(1, 'カテゴリIDは必須です'),
  name: z.string().min(1, 'カテゴリ名は必須です').max(100, 'カテゴリ名は100文字以内で入力してください'),
  description: z.string().max(500, '説明は500文字以内で入力してください').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '色は#ffffffの形式で入力してください').default('#3B82F6'),
  icon: z.string().max(50, 'アイコン名は50文字以内で入力してください').optional(),
});

export const UpdateAssetCategorySchema = z.object({
  name: z.string().min(1, 'カテゴリ名は必須です').max(100, 'カテゴリ名は100文字以内で入力してください').optional(),
  description: z.string().max(500, '説明は500文字以内で入力してください').optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, '色は#ffffffの形式で入力してください').optional(),
  icon: z.string().max(50, 'アイコン名は50文字以内で入力してください').optional(),
});

// 外部API関連のスキーマ
export const UpdateStockPricesSchema = z.object({
  symbols: z.array(z.string().min(1, 'シンボルは必須です')).min(1, '最低1つのシンボルが必要です'),
});

// 通貨関連のスキーマ
export const CurrencySchema = z.enum(['JPY', 'USD', 'EUR', 'GBP', 'CNY', 'KRW']);

// バリデーション結果の型推論
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type CreateAssetInput = z.infer<typeof CreateAssetSchema>;
export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>;
export type UpdateAssetPriceInput = z.infer<typeof UpdateAssetPriceSchema>;
export type CreatePriceHistoryInput = z.infer<typeof CreatePriceHistorySchema>;
export type AssetFilters = z.infer<typeof AssetFiltersSchema>;
export type PortfolioFilters = z.infer<typeof PortfolioFiltersSchema>;
export type ReportFilters = z.infer<typeof ReportFiltersSchema>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
export type CreateAssetCategoryInput = z.infer<typeof CreateAssetCategorySchema>;
export type UpdateAssetCategoryInput = z.infer<typeof UpdateAssetCategorySchema>;
export type UpdateStockPricesInput = z.infer<typeof UpdateStockPricesSchema>;
export type Currency = z.infer<typeof CurrencySchema>; 