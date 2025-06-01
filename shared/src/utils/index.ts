// 通貨フォーマット関連のユーティリティ
export const formatCurrency = (amount: number, currency: string = 'JPY'): string => {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
};

// 日付フォーマット関連のユーティリティ
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

// パーセンテージフォーマット
export const formatPercent = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

// 数値フォーマット
export const formatNumber = (value: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('ja-JP', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

// 損益の計算
export const calculateGainLoss = (currentValue: number, acquisitionValue: number) => {
  const gainLoss = currentValue - acquisitionValue;
  const gainLossPercent = acquisitionValue > 0 ? (gainLoss / acquisitionValue) * 100 : 0;
  
  return {
    gainLoss,
    gainLossPercent,
    isPositive: gainLoss >= 0,
  };
};

// 資産の現在価値計算
export const calculateCurrentValue = (quantity: number, currentPrice: number): number => {
  return quantity * currentPrice;
};

// 資産の取得価値計算
export const calculateAcquisitionValue = (quantity: number, acquisitionPrice: number): number => {
  return quantity * acquisitionPrice;
};

// パーセンテージの計算
export const calculatePercentage = (value: number, total: number): number => {
  return total > 0 ? (value / total) * 100 : 0;
};

// 色の明暗判定
export const isLightColor = (color: string): boolean => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // 輝度の計算 (0.299*R + 0.587*G + 0.114*B)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128;
};

// テキスト色の決定
export const getTextColor = (backgroundColor: string): string => {
  return isLightColor(backgroundColor) ? '#000000' : '#FFFFFF';
};

// URLからクエリパラメータの解析
export const parseQueryParams = (search: string): Record<string, string> => {
  const params = new URLSearchParams(search);
  const result: Record<string, string> = {};
  
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  
  return result;
};

// デバウンス関数
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void => {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    
    timeout = setTimeout(() => {
      func.apply(null, args);
    }, wait);
  };
};

// スロットル関数
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void => {
  let inThrottle: boolean = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// エラーメッセージの生成
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (error?.error?.message) {
    return error.error.message;
  }
  
  return 'エラーが発生しました';
};

// 成功メッセージの生成
export const getSuccessMessage = (action: string, target: string): string => {
  const actions: Record<string, string> = {
    create: '作成',
    update: '更新',
    delete: '削除',
    save: '保存',
  };
  
  const actionText = actions[action] || action;
  return `${target}を${actionText}しました`;
};

// UUIDの生成（簡易版）
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// 配列のユニーク化
export const unique = <T>(array: T[]): T[] => {
  return [...new Set(array)];
};

// 配列のグループ化
export const groupBy = <T, K extends keyof any>(
  array: T[],
  getKey: (item: T) => K
): Record<K, T[]> => {
  return array.reduce((result, item) => {
    const key = getKey(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
    return result;
  }, {} as Record<K, T[]>);
};

// 配列の合計
export const sum = (array: number[]): number => {
  return array.reduce((total, value) => total + value, 0);
};

// 配列の平均
export const average = (array: number[]): number => {
  return array.length > 0 ? sum(array) / array.length : 0;
};

// 深いコピー
export const deepClone = <T>(obj: T): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
};

// オブジェクトの空チェック
export const isEmpty = (obj: any): boolean => {
  if (obj == null) return true;
  if (typeof obj === 'string' || Array.isArray(obj)) return obj.length === 0;
  if (typeof obj === 'object') return Object.keys(obj).length === 0;
  return false;
};

// 期間の計算
export const calculatePeriodDates = (period: string): { startDate: Date; endDate: Date } => {
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '1w':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case '1m':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case '3m':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case '6m':
      startDate.setMonth(endDate.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    case 'all':
      startDate.setFullYear(2000, 0, 1);
      break;
    default:
      startDate.setFullYear(endDate.getFullYear() - 1);
  }
  
  return { startDate, endDate };
}; 