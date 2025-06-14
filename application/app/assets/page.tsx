'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { apiClient } from '@/lib/api';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import type { AssetCategory, AssetWithCategory } from 'shared/types';

export default function AssetsPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<AssetWithCategory[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetWithCategory | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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

        if (assetsResponse.success && assetsResponse.data) {
          // カテゴリ情報をマッピング
          const categoriesMap = new Map<string, AssetCategory>();
          if (categoriesResponse.success && categoriesResponse.data) {
            categoriesResponse.data.forEach(cat => categoriesMap.set(cat.id, cat));
            setCategories(categoriesResponse.data);
          }

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
        }
      } catch (error) {
        setError('データの取得に失敗しました');
        console.error('Data fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // 資産削除
  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('この資産を削除しますか？')) return;
    
    try {
      const response = await apiClient.deleteAsset(assetId);
      if (response.success) {
        setAssets(assets.filter(asset => asset.id !== assetId));
      } else {
        setError('削除に失敗しました');
      }
    } catch (error) {
      setError('削除に失敗しました');
      console.error('Delete error:', error);
    }
  };

  // フィルタリングされた資産リスト
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (asset.symbol && asset.symbol.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || asset.categoryId === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // 通貨フォーマット
  const formatCurrency = (amount: number) => {
    return `¥${amount.toLocaleString()}`;
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

  return (
    <DashboardLayout>
      <div className="h-full">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-xl font-bold text-gray-900">資産管理</h1>
            <p className="text-gray-600 text-sm">資産の登録・編集・削除を行えます</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            資産を追加
          </button>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="資産名またはシンボルで検索..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                >
                  <option value="all">すべてのカテゴリ</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* 資産一覧 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredAssets.length === 0 ? (
            <div className="p-12 text-center">
              <Plus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedCategory !== 'all' ? '該当する資産が見つかりません' : 'まだ資産が登録されていません'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedCategory !== 'all' ? '検索条件を変更してください。' : '最初の資産を登録して、ポートフォリオの管理を始めましょう。'}
              </p>
              {!searchTerm && selectedCategory === 'all' && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                >
                  資産を追加
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      資産名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      カテゴリ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      数量
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      取得価格
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      現在価格
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      評価額
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      損益
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAssets.map((asset) => {
                    const currentValue = asset.quantity * asset.currentPrice;
                    const acquisitionValue = asset.quantity * asset.acquisitionPrice;
                    const gainLoss = currentValue - acquisitionValue;
                    const gainLossPercent = ((gainLoss / acquisitionValue) * 100);
                    
                    return (
                      <tr key={asset.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                            {asset.symbol && (
                              <div className="text-sm text-gray-500">{asset.symbol}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {asset.category.name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {asset.quantity.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(asset.acquisitionPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(asset.currentPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(currentValue)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(gainLoss)}
                            <div className="text-xs">
                              ({gainLoss >= 0 ? '+' : ''}{gainLossPercent.toFixed(2)}%)
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setEditingAsset(asset)}
                              className="text-indigo-600 hover:text-indigo-900 p-1"
                              title="編集"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteAsset(asset.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="削除"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 新規追加フォーム */}
      {showAddForm && (
        <AssetFormModal
          categories={categories}
          onClose={() => setShowAddForm(false)}
          onSuccess={(newAsset) => {
            setAssets([...assets, newAsset]);
            setShowAddForm(false);
          }}
        />
      )}

      {/* 編集フォーム */}
      {editingAsset && (
        <AssetFormModal
          categories={categories}
          asset={editingAsset}
          onClose={() => setEditingAsset(null)}
          onSuccess={(updatedAsset) => {
            setAssets(assets.map(asset => 
              asset.id === updatedAsset.id ? updatedAsset : asset
            ));
            setEditingAsset(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

// 資産フォームモーダルコンポーネント
interface AssetFormModalProps {
  categories: AssetCategory[];
  asset?: AssetWithCategory;
  onClose: () => void;
  onSuccess: (asset: AssetWithCategory) => void;
}

function AssetFormModal({ categories, asset, onClose, onSuccess }: AssetFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    symbol: asset?.symbol || '',
    categoryId: asset?.categoryId || (categories[0]?.id || ''),
    quantity: asset?.quantity || 0,
    acquisitionPrice: asset?.acquisitionPrice || 0,
    currentPrice: asset?.currentPrice || 0,
    acquisitionDate: asset?.acquisitionDate 
      ? new Date(asset.acquisitionDate).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0],
    notes: asset?.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = '資産名は必須です';
    if (!formData.categoryId) newErrors.categoryId = 'カテゴリを選択してください';
    if (formData.quantity <= 0) newErrors.quantity = '数量は1以上である必要があります';
    if (formData.acquisitionPrice <= 0) newErrors.acquisitionPrice = '取得価格は0より大きい値である必要があります';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const assetData = {
        name: formData.name,
        symbol: formData.symbol || undefined,
        categoryId: formData.categoryId,
        quantity: formData.quantity,
        acquisitionPrice: formData.acquisitionPrice,
        currentPrice: formData.currentPrice || formData.acquisitionPrice,
        acquisitionDate: new Date(formData.acquisitionDate),
        notes: formData.notes || undefined
      };

      let response;
      if (asset) {
        // 更新の場合
        response = await apiClient.updateAsset(asset.id, {
          name: formData.name,
          symbol: formData.symbol || undefined,
          quantity: formData.quantity,
          acquisitionPrice: formData.acquisitionPrice,
          currentPrice: formData.currentPrice,
          acquisitionDate: new Date(formData.acquisitionDate),
          notes: formData.notes || undefined
        });
      } else {
        // 新規作成の場合
        response = await apiClient.createAsset(assetData);
      }

      if (response.success && response.data) {
        // カテゴリ情報を追加
        const categoryInfo = categories.find(cat => cat.id === formData.categoryId);
        const assetWithCategory: AssetWithCategory = {
          ...response.data,
          category: categoryInfo || { 
            id: 'unknown', 
            name: '不明', 
            color: '#gray', 
            createdAt: new Date(), 
            updatedAt: new Date() 
          }
        };
        onSuccess(assetWithCategory);
      } else {
        setErrors({ submit: '保存に失敗しました' });
      }
    } catch (error) {
      setErrors({ submit: '保存に失敗しました' });
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {asset ? '資産を編集' : '新しい資産を追加'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  資産名 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="例: トヨタ自動車"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  シンボル
                </label>
                <input
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="例: 7203"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  カテゴリ *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.categoryId ? 'border-red-300' : 'border-gray-300'}`}
                >
                  <option value="">カテゴリを選択</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-red-500 text-xs mt-1">{errors.categoryId}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  数量 *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.quantity ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  取得価格 *
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.acquisitionPrice}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData({ 
                      ...formData, 
                      acquisitionPrice: value,
                      // 現在価格が0の場合、取得価格と同じ値に自動設定
                      currentPrice: formData.currentPrice === 0 ? value : formData.currentPrice
                    });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.acquisitionPrice ? 'border-red-300' : 'border-gray-300'}`}
                />
                {errors.acquisitionPrice && <p className="text-red-500 text-xs mt-1">{errors.acquisitionPrice}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  現在価格（省略可）
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={formData.currentPrice}
                  onChange={(e) => setFormData({ ...formData, currentPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="空欄の場合は取得価格と同じ値になります"
                />
                <p className="text-xs text-gray-500 mt-1">空欄の場合、取得価格と同じ値に設定されます</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  取得日
                </label>
                <input
                  type="date"
                  value={formData.acquisitionDate}
                  onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メモ
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="任意のメモを入力..."
                />
              </div>
            </div>

            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '保存中...' : asset ? '更新' : '追加'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 