'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Activity, 
  PieChart as PieChartIcon,
  BarChart3,
  Wallet
} from 'lucide-react';
import type { AssetWithCategory, AssetCategory } from 'shared/types';

// 色定義
const COLORS = [
  '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', 
  '#EF4444', '#8B5A2B', '#6B7280', '#EC4899'
];

// 分析データの型定義
interface CategoryAnalysis {
  categoryId: string;
  categoryName: string;
  color: string;
  totalValue: number;
  totalGainLoss: number;
  gainLossPercent: number;
  percentage: number;
  assetCount: number;
  assets: AssetWithCategory[];
}

interface PerformanceData {
  name: string;
  value: number;
  gainLoss: number;
  gainLossPercent: number;
}

export default function PortfolioPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<AssetWithCategory[]>([]);
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTab, setSelectedTab] = useState<'overview' | 'categories' | 'performance'>('overview');

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoading(true);
        const [assetsResponse, categoriesResponse] = await Promise.all([
          apiClient.getAssets(),
          apiClient.getCategories()
        ]);

        if (assetsResponse.success && assetsResponse.data && categoriesResponse.success && categoriesResponse.data) {
          // カテゴリ情報をマッピング
          const categoriesMap = new Map<string, AssetCategory>();
          categoriesResponse.data.forEach(cat => categoriesMap.set(cat.id, cat));

          const assetsWithCategories: AssetWithCategory[] = assetsResponse.data.items.map(asset => ({
            ...asset,
            category: categoriesMap.get(asset.categoryId) || { 
              id: 'unknown', 
              name: '不明', 
              color: '#gray', 
              createdAt: new Date(), 
              updatedAt: new Date() 
            }
          }));
          
          setAssets(assetsWithCategories);
          
          // 分析データの生成
          generateAnalysis(assetsWithCategories);
        }
      } catch (error) {
        setError('データの取得に失敗しました');
        console.error('Portfolio data fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // 分析データの生成
  const generateAnalysis = (assets: AssetWithCategory[]) => {
    if (assets.length === 0) return;

    // カテゴリ別分析
    const categoryMap = new Map<string, CategoryAnalysis>();
    let totalPortfolioValue = 0;

    assets.forEach(asset => {
      const currentValue = asset.quantity * asset.currentPrice;
      const acquisitionValue = asset.quantity * asset.acquisitionPrice;
      const gainLoss = currentValue - acquisitionValue;
      
      totalPortfolioValue += currentValue;

      const categoryId = asset.categoryId;
      if (!categoryMap.has(categoryId)) {
        categoryMap.set(categoryId, {
          categoryId,
          categoryName: asset.category.name,
          color: asset.category.color,
          totalValue: 0,
          totalGainLoss: 0,
          gainLossPercent: 0,
          percentage: 0,
          assetCount: 0,
          assets: []
        });
      }

      const category = categoryMap.get(categoryId)!;
      category.totalValue += currentValue;
      category.totalGainLoss += gainLoss;
      category.assetCount += 1;
      category.assets.push(asset);
    });

    // パーセンテージと収益率の計算
    const categoryAnalysisArray: CategoryAnalysis[] = [];
    categoryMap.forEach(category => {
      category.percentage = (category.totalValue / totalPortfolioValue) * 100;
      const totalAcquisitionValue = category.assets.reduce((sum, asset) => 
        sum + (asset.quantity * asset.acquisitionPrice), 0);
      category.gainLossPercent = totalAcquisitionValue > 0 
        ? (category.totalGainLoss / totalAcquisitionValue) * 100 
        : 0;
      categoryAnalysisArray.push(category);
    });

    // パフォーマンスデータの生成（資産別）
    const performanceArray: PerformanceData[] = assets.map(asset => {
      const currentValue = asset.quantity * asset.currentPrice;
      const acquisitionValue = asset.quantity * asset.acquisitionPrice;
      const gainLoss = currentValue - acquisitionValue;
      const gainLossPercent = acquisitionValue > 0 ? (gainLoss / acquisitionValue) * 100 : 0;

      return {
        name: asset.name,
        value: currentValue,
        gainLoss,
        gainLossPercent
      };
    }).sort((a, b) => b.gainLossPercent - a.gainLossPercent);

    setCategoryAnalysis(categoryAnalysisArray.sort((a, b) => b.totalValue - a.totalValue));
    setPerformanceData(performanceArray);
  };

  // 通貨フォーマット
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  // パーセンテージフォーマット
  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  const totalValue = categoryAnalysis.reduce((sum, cat) => sum + cat.totalValue, 0);
  const totalGainLoss = categoryAnalysis.reduce((sum, cat) => sum + cat.totalGainLoss, 0);
  const totalGainLossPercent = totalValue > 0 && assets.length > 0
    ? (totalGainLoss / (totalValue - totalGainLoss)) * 100
    : 0;

  return (
    <DashboardLayout>
      <div className="h-full">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-xl font-bold text-gray-900">ポートフォリオ分析</h1>
            <p className="text-gray-600 text-sm">資産配分とパフォーマンスを分析できます</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {assets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">まだ資産が登録されていません</h3>
            <p className="text-gray-500 mb-6">資産を登録して、ポートフォリオ分析を始めましょう。</p>
            <button
              onClick={() => router.push('/assets')}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              資産を登録する
            </button>
          </div>
        ) : (
          <>
            {/* サマリーカード */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">総資産額</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(totalValue)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    totalGainLoss >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {totalGainLoss >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">総損益</p>
                    <p className={`text-2xl font-bold ${
                      totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(totalGainLoss)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    totalGainLossPercent >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <Percent className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">損益率</p>
                    <p className={`text-2xl font-bold ${
                      totalGainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercent(totalGainLossPercent)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">資産数</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {assets.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* タブナビゲーション */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'overview', name: '概要', icon: PieChartIcon },
                    { id: 'categories', name: 'カテゴリ分析', icon: BarChart3 },
                    { id: 'performance', name: 'パフォーマンス', icon: Activity }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedTab(tab.id as 'overview' | 'categories' | 'performance')}
                      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                        selectedTab === tab.id
                          ? 'border-indigo-500 text-indigo-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <tab.icon className="w-5 h-5 mr-2" />
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {selectedTab === 'overview' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* 資産配分円グラフ */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">資産配分</h3>
                      {categoryAnalysis.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={categoryAnalysis}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="totalValue"
                              label={({ categoryName, percentage }) => 
                                `${categoryName} (${percentage.toFixed(1)}%)`
                              }
                            >
                              {categoryAnalysis.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-64 text-gray-500">
                          データがありません
                        </div>
                      )}
                    </div>

                    {/* カテゴリ別サマリー */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">カテゴリ別サマリー</h3>
                      <div className="space-y-4">
                        {categoryAnalysis.map((category, index) => (
                          <div key={category.categoryId} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div 
                                className="w-4 h-4 rounded-full mr-3"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                              />
                              <div>
                                <p className="font-medium text-gray-900">{category.categoryName}</p>
                                <p className="text-sm text-gray-500">{category.assetCount}件</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatCurrency(category.totalValue)}
                              </p>
                              <p className={`text-sm ${
                                category.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatPercent(category.gainLossPercent)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === 'categories' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">カテゴリ別詳細分析</h3>
                    
                    {/* カテゴリ別棒グラフ */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">カテゴリ別資産額</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={categoryAnalysis}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="categoryName" />
                          <YAxis tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`} />
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="totalValue" fill="#8B5CF6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* カテゴリ詳細テーブル */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">詳細データ</h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-3 px-4 font-medium text-gray-900">カテゴリ</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-900">資産額</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-900">構成比</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-900">損益</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-900">損益率</th>
                              <th className="text-right py-3 px-4 font-medium text-gray-900">資産数</th>
                            </tr>
                          </thead>
                          <tbody>
                            {categoryAnalysis.map((category) => (
                              <tr key={category.categoryId} className="border-b border-gray-100">
                                <td className="py-3 px-4">
                                  <span className="font-medium text-gray-900">{category.categoryName}</span>
                                </td>
                                <td className="py-3 px-4 text-right font-semibold">
                                  {formatCurrency(category.totalValue)}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {category.percentage.toFixed(1)}%
                                </td>
                                <td className={`py-3 px-4 text-right font-medium ${
                                  category.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatCurrency(category.totalGainLoss)}
                                </td>
                                <td className={`py-3 px-4 text-right font-medium ${
                                  category.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {formatPercent(category.gainLossPercent)}
                                </td>
                                <td className="py-3 px-4 text-right">{category.assetCount}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTab === 'performance' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">パフォーマンス分析</h3>
                    
                    {/* パフォーマンス棒グラフ */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-md font-medium text-gray-900 mb-4">資産別損益率</h4>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={performanceData.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                          <Tooltip 
                            formatter={(value: number) => [`${value.toFixed(2)}%`, '損益率']}
                            labelFormatter={(label) => `資産: ${label}`}
                          />
                          <Bar 
                            dataKey="gainLossPercent" 
                            fill="#8B5CF6"
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* ベスト・ワーストパフォーマー */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-green-50 rounded-lg p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                          <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                          ベストパフォーマー
                        </h4>
                        <div className="space-y-3">
                          {performanceData
                            .filter(item => item.gainLossPercent > 0)
                            .slice(0, 5)
                            .map((item, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">{item.name}</span>
                                <span className="text-green-600 font-semibold">
                                  {formatPercent(item.gainLossPercent)}
                                </span>
                              </div>
                            ))}
                          {performanceData.filter(item => item.gainLossPercent > 0).length === 0 && (
                            <p className="text-gray-500 text-sm">プラスの資産がありません</p>
                          )}
                        </div>
                      </div>

                      <div className="bg-red-50 rounded-lg p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                          <TrendingDown className="w-5 h-5 mr-2 text-red-600" />
                          ワーストパフォーマー
                        </h4>
                        <div className="space-y-3">
                          {performanceData
                            .filter(item => item.gainLossPercent < 0)
                            .slice(-5)
                            .reverse()
                            .map((item, index) => (
                              <div key={index} className="flex justify-between items-center">
                                <span className="font-medium text-gray-900">{item.name}</span>
                                <span className="text-red-600 font-semibold">
                                  {formatPercent(item.gainLossPercent)}
                                </span>
                              </div>
                            ))}
                          {performanceData.filter(item => item.gainLossPercent < 0).length === 0 && (
                            <p className="text-gray-500 text-sm">マイナスの資産がありません</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 