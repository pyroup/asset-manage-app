// ユーザー関連の型定義
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

// 資産カテゴリ関連の型定義
export interface AssetCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

// 資産関連の型定義
export interface Asset {
  id: string;
  userId: string;
  categoryId: string;
  name: string;
  symbol?: string;
  quantity: number;
  acquisitionPrice: number;
  currentPrice: number;
  acquisitionDate: Date;
  currency: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetWithCategory extends Asset {
  category: AssetCategory;
}

export interface CreateAssetInput {
  categoryId: string;
  name: string;
  symbol?: string;
  quantity: number;
  acquisitionPrice: number;
  acquisitionDate: Date;
  currency?: string;
  notes?: string;
}

export interface UpdateAssetInput {
  name?: string;
  symbol?: string;
  quantity?: number;
  acquisitionPrice?: number;
  currentPrice?: number;
  acquisitionDate?: Date;
  currency?: string;
  notes?: string;
}

// 価格履歴関連の型定義
export interface PriceHistory {
  id: string;
  assetId: string;
  price: number;
  date: Date;
  source: 'manual' | 'api';
  createdAt: Date;
}

export interface CreatePriceHistoryInput {
  assetId: string;
  price: number;
  date: Date;
  source: 'manual' | 'api';
}

// ポートフォリオ関連の型定義
export interface PortfolioSnapshot {
  id: string;
  userId: string;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  snapshotDate: Date;
  createdAt: Date;
}

export interface PortfolioSummary {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  categories: CategoryBreakdown[];
  updatedAt: Date;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  color: string;
  value: number;
  percentage: number;
  gainLoss: number;
  gainLossPercent: number;
}

// API レスポンス関連の型定義
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// フィルター・ソート関連の型定義
export interface AssetFilters {
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: 'name' | 'acquisitionDate' | 'currentValue' | 'gainLoss';
  order?: 'asc' | 'desc';
}

export interface PortfolioFilters {
  period?: '1w' | '1m' | '3m' | '6m' | '1y' | 'all';
  type?: 'category' | 'asset';
}

// レポート関連の型定義
export interface MonthlyReport {
  year: number;
  month: number;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  categoryBreakdown: CategoryBreakdown[];
  assetPerformance: AssetPerformance[];
}

export interface YearlyReport {
  year: number;
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  monthlyData: MonthlyData[];
  bestPerformingAssets: AssetPerformance[];
  worstPerformingAssets: AssetPerformance[];
}

export interface AssetPerformance {
  assetId: string;
  assetName: string;
  category: string;
  gainLoss: number;
  gainLossPercent: number;
  currentValue: number;
}

export interface MonthlyData {
  month: number;
  totalValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

// ユーザーセッション関連の型定義
export interface UserSession {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

// エラー関連の型定義
export type ErrorCode = 
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INTERNAL_ERROR'
  | 'RATE_LIMIT_EXCEEDED';

export interface AppError extends Error {
  code: ErrorCode;
  statusCode: number;
  details?: any;
}

// チャート・可視化関連の型定義
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface PieChartData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

// 通貨関連の型定義
export type Currency = 'JPY' | 'USD' | 'EUR' | 'GBP' | 'CNY' | 'KRW';

export interface CurrencyRate {
  from: Currency;
  to: Currency;
  rate: number;
  date: Date;
}

// 外部API関連の型定義
export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  timestamp: Date;
}

export interface StockApiResponse {
  success: boolean;
  data: StockPrice[];
  source: string;
  updatedAt: Date;
} 