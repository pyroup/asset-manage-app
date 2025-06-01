'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api';
import { TrendingUp, TrendingDown, Wallet, PieChart, Eye, EyeOff } from 'lucide-react';
import type { PortfolioSummary } from 'shared/types';

export default function DashboardPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [portfolioData, setPortfolioData] = useState<PortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showValues, setShowValues] = useState(true);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // ポートフォリオデータの取得
  useEffect(() => {
    const fetchPortfolioData = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoading(true);
        const response = await apiClient.getPortfolioSummary();
        if (response.success && response.data) {
          setPortfolioData(response.data);
        } else {
          setError('ポートフォリオデータの取得に失敗しました');
        }
      } catch (error) {
        setError('ポートフォリオデータの取得に失敗しました');
        console.error('Portfolio fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPortfolioData();
  }, [isAuthenticated]);

  const formatCurrency = (amount: number) => {
    return showValues ? `¥${amount.toLocaleString()}` : '****';
  };

  const formatPercent = (percent: number) => {
    return showValues ? `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%` : '**%';
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

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            再読み込み
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-full">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6 lg:mb-4">
          <div>
            <h1 className="text-2xl lg:text-lg font-bold text-gray-900">ダッシュボード</h1>
            <p className="text-gray-600 text-sm lg:text-xs">資産の概要を確認できます</p>
          </div>
          <button
            onClick={() => setShowValues(!showValues)}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 lg:px-3 lg:py-1 lg:text-xs"
          >
            {showValues ? (
              <>
                <EyeOff className="w-4 h-4 mr-2 lg:w-3 lg:h-3 lg:mr-1" />
                金額を隠す
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2 lg:w-3 lg:h-3 lg:mr-1" />
                金額を表示
              </>
            )}
          </button>
        </div>

        {/* サマリーカード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 lg:gap-4 lg:mb-6">
          {/* 総資産額 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center lg:w-10 lg:h-10">
                <Wallet className="w-6 h-6 text-blue-600 lg:w-5 lg:h-5" />
              </div>
              <div className="ml-4 lg:ml-3">
                <p className="text-sm font-medium text-gray-600 lg:text-xs">総資産額</p>
                <p className="text-2xl font-bold text-gray-900 lg:text-xl">
                  {formatCurrency(portfolioData?.totalValue || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* 総損益 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-4">
            <div className="flex items-center">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center lg:w-10 lg:h-10 ${
                (portfolioData?.totalGainLoss || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {(portfolioData?.totalGainLoss || 0) >= 0 ? (
                  <TrendingUp className="w-6 h-6 text-green-600 lg:w-5 lg:h-5" />
                ) : (
                  <TrendingDown className="w-6 h-6 text-red-600 lg:w-5 lg:h-5" />
                )}
              </div>
              <div className="ml-4 lg:ml-3">
                <p className="text-sm font-medium text-gray-600 lg:text-xs">総損益</p>
                <p className={`text-2xl font-bold lg:text-xl ${
                  (portfolioData?.totalGainLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(portfolioData?.totalGainLoss || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* 損益率 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-4">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center lg:w-10 lg:h-10">
                <PieChart className="w-6 h-6 text-purple-600 lg:w-5 lg:h-5" />
              </div>
              <div className="ml-4 lg:ml-3">
                <p className="text-sm font-medium text-gray-600 lg:text-xs">損益率</p>
                <p className={`text-2xl font-bold lg:text-xl ${
                  (portfolioData?.totalGainLossPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercent(portfolioData?.totalGainLossPercent || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* カテゴリ別構成 */}
        {portfolioData && portfolioData.categories && portfolioData.categories.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:p-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-6 lg:text-lg lg:mb-4">カテゴリ別構成</h2>
            <div className="space-y-4">
              {portfolioData.categories.map((category) => (
                <div key={category.categoryId} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-sm font-medium text-gray-900">
                      {category.categoryName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      {category.percentage.toFixed(1)}%
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(category.value)}
                    </span>
                    <span className={`text-sm font-medium ${
                      category.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatPercent(category.gainLossPercent)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center lg:p-8">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4 lg:w-12 lg:h-12 lg:mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2 lg:text-base lg:mb-1">まだ資産が登録されていません</h3>
            <p className="text-gray-500 mb-6 lg:text-sm lg:mb-4">
              最初の資産を登録して、ポートフォリオの管理を始めましょう。
            </p>
            <button
              onClick={() => router.push('/assets')}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200 lg:px-4 lg:py-2 lg:text-sm"
            >
              資産を登録する
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 