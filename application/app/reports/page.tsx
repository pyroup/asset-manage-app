'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api';
import { exportReportAsPDF, exportAssetsAsExcel } from '@/lib/exportUtils';
import { 
  LineChart, 
  Line, 
  AreaChart,
  Area,
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  BarChart3,
  PieChartIcon,
  FileText,
  RefreshCw,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import type { AssetWithCategory, AssetCategory } from 'shared/types';

// 色定義
const COLORS = [
  '#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', 
  '#EF4444', '#8B5A2B', '#6B7280', '#EC4899'
];

// レポートデータの型定義
interface TimeSeriesData {
  date: string;
  totalValue: number;
  totalGainLoss: number;
  gainLossPercent: number;
  assetCount: number;
}

interface CategoryPerformance {
  categoryName: string;
  currentValue: number;
  gainLoss: number;
  gainLossPercent: number;
  percentage: number;
  color: string;
}

interface MonthlyAnalysis {
  month: string;
  value: number;
  change: number;
  changePercent: number;
}

export default function ReportsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<AssetWithCategory[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<CategoryPerformance[]>([]);
  const [monthlyAnalysis, setMonthlyAnalysis] = useState<MonthlyAnalysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL' | 'CUSTOM'>('3M');
  const [selectedReport, setSelectedReport] = useState<'overview' | 'trends' | 'performance' | 'monthly'>('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  // レポートデータ生成関数 - 依存配列の前に定義
  const generateReportData = useCallback((assets: AssetWithCategory[]) => {
    if (assets.length === 0) return;

    // カスタム期間の処理
    const getFilteredPeriod = () => {
      const now = new Date();
      
      if (selectedPeriod === 'CUSTOM') {
        if (customStartDate && customEndDate) {
          return {
            startDate: new Date(customStartDate),
            endDate: new Date(customEndDate)
          };
        } else {
          // カスタム期間が設定されていない場合は3ヶ月をデフォルトに
          const start = new Date();
          start.setMonth(start.getMonth() - 3);
          return { startDate: start, endDate: now };
        }
      }
      
      // 標準期間の処理
      const start = new Date();
      
      switch (selectedPeriod) {
        case '1M':
          start.setMonth(start.getMonth() - 1);
          break;
        case '3M':
          start.setMonth(start.getMonth() - 3);
          break;
        case '6M':
          start.setMonth(start.getMonth() - 6);
          break;
        case '1Y':
          start.setFullYear(start.getFullYear() - 1);
          break;
        case 'ALL':
          // 全期間の場合は最も古い資産の取得日を開始日とする
          if (assets.length > 0) {
            const dates = assets.map(asset => new Date(asset.acquisitionDate).getTime());
            const oldestDate = new Date(Math.min(...dates));
            return { startDate: oldestDate, endDate: now };
          }
          // デフォルトは1年
          start.setFullYear(start.getFullYear() - 1);
          break;
      }
      
      return { startDate: start, endDate: now };
    };

    // 期間のフィルタリング
    const { startDate, endDate } = getFilteredPeriod();
    
    // 時系列データの生成（日次）
    const generateTimeSeriesData = () => {
      const data: TimeSeriesData[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // 日付の範囲があまりにも広い場合は週次または月次にする
      const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      let step = 1; // デフォルトは日次
      
      if (diffDays > 180) {
        step = 7; // 半年以上は週次
      } else if (diffDays > 60) {
        step = 3; // 2ヶ月以上は3日ごと
      }
      
      for (let d = start; d <= end; d.setDate(d.getDate() + step)) {
        const date = new Date(d);
        const formattedDate = date.toISOString().split('T')[0];
        
        // その日までの資産のみを対象に
        const relevantAssets = assets.filter(
          asset => new Date(asset.acquisitionDate) <= date
        );
        
        if (relevantAssets.length === 0) continue;
        
        // 合計価値と損益の計算
        let totalValue = 0;
        let totalCost = 0;
        
        relevantAssets.forEach(asset => {
          // その日の価値の推定（現在の価格と購入時の価格から線形補間）
          const acquiredDate = new Date(asset.acquisitionDate).getTime();
          const now = new Date().getTime();
          const currentDate = date.getTime();
          
          // 経過率の計算（0-1の範囲）
          const progress = now === acquiredDate 
            ? 1 
            : (currentDate - acquiredDate) / (now - acquiredDate);
          
          // 価格の線形補間
          const estimatedPrice = asset.acquisitionPrice + 
            (asset.currentPrice - asset.acquisitionPrice) * Math.min(1, Math.max(0, progress));
          
          const value = asset.quantity * estimatedPrice;
          const cost = asset.quantity * asset.acquisitionPrice;
          
          totalValue += value;
          totalCost += cost;
        });
        
        const totalGainLoss = totalValue - totalCost;
        const gainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
        
        data.push({
          date: formattedDate,
          totalValue,
          totalGainLoss,
          gainLossPercent,
          assetCount: relevantAssets.length
        });
      }
      
      return data;
    };
    
    // カテゴリパフォーマンスの計算
    const generateCategoryPerformance = () => {
      const categories: Record<string, CategoryPerformance> = {};
      let totalValue = 0;
      
      assets.forEach(asset => {
        const currentValue = asset.quantity * asset.currentPrice;
        const acquisitionValue = asset.quantity * asset.acquisitionPrice;
        const gainLoss = currentValue - acquisitionValue;        // 計算結果は使用していないが、将来的な拡張のために残しておく
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _gainLossPercent = acquisitionValue > 0 ? (gainLoss / acquisitionValue) * 100 : 0;
        
        if (!categories[asset.categoryId]) {
          categories[asset.categoryId] = {
            categoryName: asset.category.name,
            currentValue: 0,
            gainLoss: 0,
            gainLossPercent: 0,
            percentage: 0,
            color: asset.category.color || COLORS[Object.keys(categories).length % COLORS.length]
          };
        }
        
        categories[asset.categoryId].currentValue += currentValue;
        categories[asset.categoryId].gainLoss += gainLoss;
        
        totalValue += currentValue;
      });
      
      // パーセンテージと損益率の計算
      Object.values(categories).forEach(category => {
        category.percentage = totalValue > 0 ? (category.currentValue / totalValue) * 100 : 0;
        category.gainLossPercent = category.currentValue > 0 ? 
          (category.gainLoss / (category.currentValue - category.gainLoss)) * 100 : 0;
      });
      
      // 金額順にソート
      return Object.values(categories).sort((a, b) => b.currentValue - a.currentValue);
    };
    
    // 月次分析の生成
    const generateMonthlyAnalysis = () => {
      // 初期化はしているが実際に使っていない、将来の拡張のために残しておく
      const months: Record<string, MonthlyAnalysis> = {};
      
      // 対象期間内の資産を月ごとにグループ化
      assets.forEach(asset => {
        const acquiredDate = new Date(asset.acquisitionDate);
        if (acquiredDate < startDate || acquiredDate > endDate) return;
        
        const monthKey = `${acquiredDate.getFullYear()}-${String(acquiredDate.getMonth() + 1).padStart(2, '0')}`;
        const month = `${acquiredDate.getFullYear()}年${acquiredDate.getMonth() + 1}月`;
        
        const currentValue = asset.quantity * asset.currentPrice;
        const acquisitionValue = asset.quantity * asset.acquisitionPrice;
        const gainLoss = currentValue - acquisitionValue;
        
        if (!months[monthKey]) {
          months[monthKey] = {
            month,
            value: 0,
            change: 0,
            changePercent: 0
          };
        }
        
        months[monthKey].value += currentValue;
        months[monthKey].change += gainLoss;
      });
      
      // 月ごとのパーセンテージ計算
      Object.values(months).forEach(month => {
        month.changePercent = month.value - month.change > 0 ? 
          (month.change / (month.value - month.change)) * 100 : 0;
      });
      
      // 配列に変換して日付順にソート
      return Object.entries(months)
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
        .map(([, data]) => data);
    };
    
    // データの生成と状態の更新
    const timeSeriesData = generateTimeSeriesData();
    const categoryPerformance = generateCategoryPerformance();
    const monthlyAnalysis = generateMonthlyAnalysis();
    
    setTimeSeriesData(timeSeriesData);
    setCategoryPerformance(categoryPerformance);
    setMonthlyAnalysis(monthlyAnalysis);
  }, [selectedPeriod, customStartDate, customEndDate]);

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
          
          // レポートデータの生成
          generateReportData(assetsWithCategories);
        }
      } catch (error) {
        setError('データの取得に失敗しました');
        console.error('Reports data fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated, selectedPeriod, generateReportData]);

    // カスタム期間の適用
  const handleCustomPeriodApply = () => {
    if (customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      
      if (startDate > endDate) {
        alert('開始日は終了日より前の日付を選択してください。');
        return;
      }
      
      setSelectedPeriod('CUSTOM');
      setShowCustomDatePicker(false);
      // データを再生成
      if (assets.length > 0) {
        generateReportData(assets);
      }
    } else {
      alert('開始日と終了日を両方選択してください。');
    }
  };

  // 通貨フォーマット
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
  };

  // パーセンテージフォーマット
  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  // 日付フォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // PDFエクスポート
  const handlePdfExport = async () => {
    try {
      setIsExporting(true);
      
      // レンダリング完了を待つ
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await exportReportAsPDF('report-content');
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDFの生成に失敗しました。再度お試しください。');
    } finally {
      setIsExporting(false);
    }
  };

  // Excelエクスポート
  const handleExcelExport = () => {
    try {
      setIsExporting(true);
      exportAssetsAsExcel(assets);
    } catch (error) {
      console.error('Excel export failed:', error);
      alert('Excelファイルの出力に失敗しました。再度お試しください。');
    } finally {
      setIsExporting(false);
    }
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

  const currentValue = assets.reduce((sum, asset) => sum + (asset.quantity * asset.currentPrice), 0);
  const totalGainLoss = assets.reduce((sum, asset) => {
    const current = asset.quantity * asset.currentPrice;
    const acquisition = asset.quantity * asset.acquisitionPrice;
    return sum + (current - acquisition);
  }, 0);

  return (
    <DashboardLayout>
      <div className="h-full">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-xl font-bold text-gray-900">レポート</h1>
            <p className="text-gray-600 text-sm">詳細な資産分析レポートを確認できます</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* PDF出力 */}
            <button
              className={`
                ${assets.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'}
                bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors
                flex items-center gap-3
              `}
              disabled={assets.length === 0 || isExporting}
              onClick={handlePdfExport}
            >
              {isExporting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              PDF出力
            </button>

            {/* Excel出力 */}
            <button
              className={`
                ${assets.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-700'}
                bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors
                flex items-center gap-3
              `}
              disabled={assets.length === 0 || isExporting}
              onClick={handleExcelExport}
            >
              {isExporting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-5 w-5" />
              )}
              Excel出力
            </button>

            <button
              onClick={() => window.location.reload()}
              disabled={isExporting}
              className="flex items-center px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              更新
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {assets.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">レポートを生成できません</h3>
            <p className="text-gray-500 mb-6">資産を登録してからレポートを確認してください。</p>
            <button
              onClick={() => router.push('/assets')}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
            >
              資産を登録する
            </button>
          </div>
        ) : (
          <>
            {/* エクスポート状態の表示 */}
            {isExporting && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin mr-3" />
                  <p className="text-blue-700 font-medium">ファイルを生成中です...</p>
                </div>
              </div>
            )}

            {/* レポートコンテンツ */}
            <div id="report-content">
              {/* 期間選択とサマリー */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
                  <div className="mb-4 lg:mb-0">
                    <h3 className="text-lg font-semibold text-gray-900">期間選択</h3>
                    <p className="text-sm text-gray-600">分析する期間を選択してください</p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <div className="flex space-x-2">
                      {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((period) => (
                        <button
                          key={period}
                          onClick={() => {
                            setSelectedPeriod(period);
                            setShowCustomDatePicker(false);
                          }}
                          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                            selectedPeriod === period
                              ? 'bg-indigo-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {period === 'ALL' ? '全期間' : period}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setShowCustomDatePicker(!showCustomDatePicker);
                          if (selectedPeriod !== 'CUSTOM') {
                            setSelectedPeriod('CUSTOM');
                          }
                        }}
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                          selectedPeriod === 'CUSTOM'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        カスタム期間
                      </button>
                    </div>
                    
                    {/* カスタム期間選択UI */}
                    {showCustomDatePicker && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              開始日
                            </label>
                            <input
                              type="date"
                              value={customStartDate}
                              onChange={(e) => setCustomStartDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              終了日
                            </label>
                            <input
                              type="date"
                              value={customEndDate}
                              onChange={(e) => setCustomEndDate(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                          </div>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setShowCustomDatePicker(false)}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors duration-200"
                          >
                            キャンセル
                          </button>
                          <button
                            onClick={handleCustomPeriodApply}
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors duration-200"
                          >
                            適用
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* 選択中のカスタム期間表示 */}
                    {selectedPeriod === 'CUSTOM' && customStartDate && customEndDate && (
                      <div className="text-sm text-gray-600">
                        選択期間: {new Date(customStartDate).toLocaleDateString('ja-JP')} ～ {new Date(customEndDate).toLocaleDateString('ja-JP')}
                      </div>
                    )}
                  </div>
                </div>

                {/* クイックサマリー */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">現在の総資産</p>
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(currentValue)}</p>
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-lg p-4 ${totalGainLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        totalGainLoss >= 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {totalGainLoss >= 0 ? (
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">総損益</p>
                        <p className={`text-xl font-bold ${
                          totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(totalGainLoss)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-600">資産数</p>
                        <p className="text-xl font-bold text-gray-900">{assets.length}件</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* レポートタブ */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6">
                    {[
                      { id: 'overview', name: '概要', icon: PieChartIcon },
                      { id: 'trends', name: '推移', icon: TrendingUp },
                      { id: 'performance', name: 'パフォーマンス', icon: BarChart3 },
                      { id: 'monthly', name: '月次分析', icon: Calendar }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setSelectedReport(tab.id as 'overview' | 'trends' | 'performance' | 'monthly')}
                        className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                          selectedReport === tab.id
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
                  {selectedReport === 'overview' && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* カテゴリ別配分 */}
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">カテゴリ別配分</h3>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={categoryPerformance}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="currentValue"
                                label={({ categoryName, percentage }) => 
                                  `${categoryName} (${percentage.toFixed(1)}%)`
                                }
                              >
                                {categoryPerformance.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => formatCurrency(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* カテゴリ別パフォーマンス */}
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 mb-4">カテゴリ別パフォーマンス</h3>
                          <div className="space-y-4">
                            {categoryPerformance.slice(0, 5).map((category, index) => (
                              <div key={category.categoryName} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div 
                                    className="w-4 h-4 rounded-full mr-3"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                                  <div>
                                    <p className="font-medium text-gray-900">{category.categoryName}</p>
                                    <p className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-gray-900">
                                    {formatCurrency(category.currentValue)}
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
                    </div>
                  )}

                  {selectedReport === 'trends' && (
                    <div className="space-y-8">
                      {timeSeriesData.length <= 2 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                          <Calendar className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">履歴データが不足しています</h3>
                          <p className="text-gray-600 mb-4">
                            資産の登録から日数が浅いため、推移グラフを表示するのに十分なデータがありません。
                          </p>
                          <p className="text-sm text-gray-500">
                            数日後に再度確認してください。現在の資産情報は「概要」タブでご確認いただけます。
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* 資産価値推移 */}
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">資産価値推移</h3>
                            <ResponsiveContainer width="100%" height={400}>
                              <AreaChart data={timeSeriesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickFormatter={formatDate} />
                                <YAxis tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`} />
                                <Tooltip 
                                  formatter={(value: number) => formatCurrency(value)}
                                  labelFormatter={(label) => `日付: ${formatDate(label)}`}
                                />
                                <Area 
                                  type="monotone" 
                                  dataKey="totalValue" 
                                  stroke="#8B5CF6" 
                                  fill="#8B5CF6" 
                                  fillOpacity={0.3}
                                  name="総資産額"
                                />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>

                          {/* 損益推移 */}
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">損益推移</h3>
                            <ResponsiveContainer width="100%" height={300}>
                              <LineChart data={timeSeriesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickFormatter={formatDate} />
                                <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                                <Tooltip 
                                  formatter={(value: number) => [`${value.toFixed(2)}%`, '損益率']}
                                  labelFormatter={(label) => `日付: ${formatDate(label)}`}
                                />
                                <Line 
                                  type="monotone" 
                                  dataKey="gainLossPercent" 
                                  stroke="#10B981" 
                                  strokeWidth={2}
                                  name="損益率"
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {selectedReport === 'performance' && (
                    <div className="space-y-8">
                      {/* カテゴリ別パフォーマンス棒グラフ */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">カテゴリ別損益率</h3>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={categoryPerformance}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="categoryName" />
                            <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                            <Tooltip 
                              formatter={(value: number) => [`${value.toFixed(2)}%`, '損益率']}
                            />
                            <Bar dataKey="gainLossPercent" fill="#8B5CF6" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* パフォーマンステーブル */}
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">詳細パフォーマンス</h3>
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-3 px-4 font-medium text-gray-900">カテゴリ</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-900">現在価値</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-900">損益</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-900">損益率</th>
                                <th className="text-right py-3 px-4 font-medium text-gray-900">構成比</th>
                              </tr>
                            </thead>
                            <tbody>
                              {categoryPerformance.map((category) => (
                                <tr key={category.categoryName} className="border-b border-gray-100">
                                  <td className="py-3 px-4">
                                    <span className="font-medium text-gray-900">{category.categoryName}</span>
                                  </td>
                                  <td className="py-3 px-4 text-right font-semibold">
                                    {formatCurrency(category.currentValue)}
                                  </td>
                                  <td className={`py-3 px-4 text-right font-medium ${
                                    category.gainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {formatCurrency(category.gainLoss)}
                                  </td>
                                  <td className={`py-3 px-4 text-right font-medium ${
                                    category.gainLossPercent >= 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {formatPercent(category.gainLossPercent)}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    {category.percentage.toFixed(1)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedReport === 'monthly' && (
                    <div className="space-y-8">
                      {monthlyAnalysis.length <= 1 ? (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                          <Calendar className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">月次データが不足しています</h3>
                          <p className="text-gray-600 mb-4">
                            月次分析を表示するには、最低2ヶ月分のデータが必要です。
                          </p>
                          <p className="text-sm text-gray-500">
                            来月以降に再度確認してください。現在の資産情報は「概要」タブでご確認いただけます。
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* 月次推移グラフ */}
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">月次資産価値推移</h3>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={monthlyAnalysis}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(value) => `¥${(value / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Bar dataKey="value" fill="#06B6D4" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* 月次変動率 */}
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">月次変動率</h3>
                            <ResponsiveContainer width="100%" height={300}>
                              <BarChart data={monthlyAnalysis}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis tickFormatter={(value) => `${value.toFixed(1)}%`} />
                                <Tooltip 
                                  formatter={(value: number) => [`${value.toFixed(2)}%`, '変動率']}
                                />
                                <Bar 
                                  dataKey="changePercent" 
                                  fill="#8B5CF6"
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>

                          {/* 月次サマリーテーブル */}
                          <div className="bg-gray-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">月次サマリー</h3>
                            <div className="overflow-x-auto">
                              <table className="min-w-full">
                                <thead>
                                  <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-medium text-gray-900">月</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-900">資産価値</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-900">前月比</th>
                                    <th className="text-right py-3 px-4 font-medium text-gray-900">変動率</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {monthlyAnalysis.map((month) => (
                                    <tr key={month.month} className="border-b border-gray-100">
                                      <td className="py-3 px-4">
                                        <span className="font-medium text-gray-900">{month.month}</span>
                                      </td>
                                      <td className="py-3 px-4 text-right font-semibold">
                                        {formatCurrency(month.value)}
                                      </td>
                                      <td className={`py-3 px-4 text-right font-medium ${
                                        month.change >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {formatCurrency(month.change)}
                                      </td>
                                      <td className={`py-3 px-4 text-right font-medium ${
                                        month.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {formatPercent(month.changePercent)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
} 