import axios, { AxiosInstance, AxiosResponse } from 'axios';

// 共有ライブラリから型をインポート
import type { 
  User, 
  Asset, 
  AssetCategory, 
  ApiResponse,
  AssetFilters,
  PortfolioSummary,
  PortfolioSnapshot,
  MonthlyReport,
  YearlyReport
} from 'shared/types';

// ページネーション用の型定義
interface PaginationData {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// パフォーマンス用の型定義
interface AssetPerformance {
  id: string;
  name: string;
  symbol?: string;
  categoryName: string;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
}

// APIクライアントクラス
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NODE_ENV === 'production' 
        ? '/api' // 本番環境では相対パス
        : (process.env.NEXT_PUBLIC_API_URL || '/api'), // Next.js統合により相対パス
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    });

    // リクエストインターセプター（認証トークンの追加）
    this.client.interceptors.request.use((config) => {
      const token = this.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // レスポンスインターセプター（エラーハンドリング）
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // ネットワークエラーの場合
        if (!error.response) {
          console.error('ネットワークエラー: バックエンドサーバーに接続できません');
          console.error('API URL:', this.client.defaults.baseURL);
          console.error('原因: サーバーが起動していないか、URLが間違っている可能性があります');
        } else if (error.response?.status === 401) {
          this.removeToken();
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // トークン管理
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  private removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  // 認証API
  async register(data: { email: string; password: string; name: string }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = await this.client.post('/auth/register', data);
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
    }
    return response.data;
  }

  async login(data: { email: string; password: string }): Promise<ApiResponse<{ user: User; token: string }>> {
    const response: AxiosResponse<ApiResponse<{ user: User; token: string }>> = await this.client.post('/auth/login', data);
    if (response.data.success && response.data.data) {
      this.setToken(response.data.data.token);
    }
    return response.data;
  }

  async logout(): Promise<ApiResponse<null>> {
    const response: AxiosResponse<ApiResponse<null>> = await this.client.post('/auth/logout');
    this.removeToken();
    return response.data;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response: AxiosResponse<ApiResponse<User>> = await this.client.get('/auth/me');
    return response.data;
  }

  async verifyToken(): Promise<ApiResponse<{ valid: boolean; user: User }>> {
    const response: AxiosResponse<ApiResponse<{ valid: boolean; user: User }>> = await this.client.post('/auth/verify');
    return response.data;
  }

  // カテゴリAPI
  async getCategories(): Promise<ApiResponse<AssetCategory[]>> {
    const response: AxiosResponse<ApiResponse<AssetCategory[]>> = await this.client.get('/categories');
    return response.data;
  }

  async getCategory(id: string): Promise<ApiResponse<AssetCategory>> {
    const response: AxiosResponse<ApiResponse<AssetCategory>> = await this.client.get(`/categories/${id}`);
    return response.data;
  }

  // 資産API
  async getAssets(filters?: AssetFilters): Promise<ApiResponse<{ items: Asset[]; pagination: PaginationData }>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
    }
    const response: AxiosResponse<ApiResponse<{ items: Asset[]; pagination: PaginationData }>> = await this.client.get(`/assets?${params}`);
    return response.data;
  }

  async getAsset(id: string): Promise<ApiResponse<Asset>> {
    const response: AxiosResponse<ApiResponse<Asset>> = await this.client.get(`/assets/${id}`);
    return response.data;
  }

  async createAsset(data: {
    categoryId: string;
    name: string;
    symbol?: string;
    quantity: number;
    acquisitionPrice: number;
    acquisitionDate: Date;
    currency?: string;
    notes?: string;
  }): Promise<ApiResponse<Asset>> {
    const response: AxiosResponse<ApiResponse<Asset>> = await this.client.post('/assets', data);
    return response.data;
  }

  async updateAsset(id: string, data: Partial<{
    name: string;
    symbol: string;
    quantity: number;
    acquisitionPrice: number;
    currentPrice: number;
    acquisitionDate: Date;
    currency: string;
    notes: string;
  }>): Promise<ApiResponse<Asset>> {
    const response: AxiosResponse<ApiResponse<Asset>> = await this.client.put(`/assets/${id}`, data);
    return response.data;
  }

  async deleteAsset(id: string): Promise<ApiResponse<null>> {
    const response: AxiosResponse<ApiResponse<null>> = await this.client.delete(`/assets/${id}`);
    return response.data;
  }

  async updateAssetPrice(id: string, currentPrice: number): Promise<ApiResponse<Asset>> {
    const response: AxiosResponse<ApiResponse<Asset>> = await this.client.patch(`/assets/${id}/price`, { currentPrice });
    return response.data;
  }

  // ポートフォリオAPI
  async getPortfolioSummary(): Promise<ApiResponse<PortfolioSummary>> {
    const response: AxiosResponse<ApiResponse<PortfolioSummary>> = await this.client.get('/portfolio/summary');
    return response.data;
  }

  async getPortfolioHistory(filters?: { period?: string; type?: string }): Promise<ApiResponse<PortfolioSnapshot[]>> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value);
        }
      });
    }
    const response: AxiosResponse<ApiResponse<PortfolioSnapshot[]>> = await this.client.get(`/portfolio/history?${params}`);
    return response.data;
  }

  async createPortfolioSnapshot(): Promise<ApiResponse<PortfolioSnapshot>> {
    const response: AxiosResponse<ApiResponse<PortfolioSnapshot>> = await this.client.post('/portfolio/snapshot');
    return response.data;
  }

  async getPortfolioPerformance(): Promise<ApiResponse<{
    bestPerforming: AssetPerformance[];
    worstPerforming: AssetPerformance[];
    all: AssetPerformance[];
  }>> {
    const response = await this.client.get('/portfolio/performance');
    return response.data;
  }

  // レポートAPI
  async getMonthlyReport(year: number, month: number): Promise<ApiResponse<MonthlyReport>> {
    const response: AxiosResponse<ApiResponse<MonthlyReport>> = await this.client.get(`/reports/monthly?year=${year}&month=${month}`);
    return response.data;
  }

  async getYearlyReport(year: number): Promise<ApiResponse<YearlyReport>> {
    const response: AxiosResponse<ApiResponse<YearlyReport>> = await this.client.get(`/reports/yearly?year=${year}`);
    return response.data;
  }

  async exportCsv(): Promise<Blob> {
    const response = await this.client.get('/reports/export/csv', {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();