# フロントエンド設計書

## 1. 概要

資産管理アプリのフロントエンド設計書です。Next.js（App Router）とReact、TypeScriptを使用してモダンで使いやすいUIを提供します。

## 2. 技術スタック

### 2.1 コア技術
- **フレームワーク**: Next.js 14 (App Router)
- **ライブラリ**: React 18
- **言語**: TypeScript 5
- **スタイリング**: Tailwind CSS 3
- **UI コンポーネント**: shadcn/ui + Radix UI

### 2.2 状態管理・データフェッチング
- **状態管理**: Zustand
- **データフェッチング**: TanStack Query (React Query)
- **フォーム**: React Hook Form + Zod

### 2.3 チャート・可視化
- **チャートライブラリ**: Recharts
- **アイコン**: Lucide React
- **日付操作**: date-fns

### 2.4 開発ツール
- **リンター**: ESLint + Prettier
- **型チェック**: TypeScript
- **テスト**: Jest + React Testing Library
- **ストーリーブック**: Storybook（検討）

## 3. ディレクトリ構成

```
app/
├── app/                          # App Router (Next.js 13+)
│   ├── (auth)/                   # 認証関連ページグループ
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/              # ダッシュボードページグループ
│   │   ├── assets/
│   │   ├── portfolio/
│   │   ├── reports/
│   │   └── settings/
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   └── page.tsx
├── components/                   # 再利用可能なコンポーネント
│   ├── ui/                       # shadcn/ui コンポーネント
│   ├── charts/                   # チャートコンポーネント
│   ├── forms/                    # フォームコンポーネント
│   ├── layout/                   # レイアウトコンポーネント
│   └── features/                 # 機能別コンポーネント
├── lib/                          # ユーティリティ・設定
│   ├── api.ts                    # API クライアント
│   ├── auth.ts                   # 認証ロジック
│   ├── utils.ts                  # 共通ユーティリティ
│   └── validations.ts            # バリデーションスキーマ
├── hooks/                        # カスタムフック
├── stores/                       # Zustand ストア
├── types/                        # 型定義
├── public/                       # 静的ファイル
└── styles/                       # グローバルスタイル
```

## 4. ページ構成・ルーティング

### 4.1 ページ一覧
```
/                           # ホーム・ダッシュボード
/login                      # ログイン
/register                   # ユーザー登録
/assets                     # 資産一覧
/assets/new                 # 資産登録
/assets/[id]               # 資産詳細
/assets/[id]/edit          # 資産編集
/portfolio                 # ポートフォリオ
/reports                   # レポート
/reports/monthly           # 月次レポート
/reports/yearly            # 年次レポート
/settings                  # 設定
/settings/profile          # プロフィール設定
/settings/categories       # カテゴリ設定
```

### 4.2 認証ガード
```typescript
// app/(dashboard)/layout.tsx
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();
  
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto py-8">
        {children}
      </main>
    </div>
  );
}
```

## 5. コンポーネント設計

### 5.1 レイアウトコンポーネント

#### Navigation
```typescript
// components/layout/Navigation.tsx
interface NavigationProps {
  user?: User;
}

export function Navigation({ user }: NavigationProps) {
  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Logo />
          <NavigationMenu />
          <UserMenu user={user} />
        </div>
      </div>
    </nav>
  );
}
```

#### Sidebar
```typescript
// components/layout/Sidebar.tsx
export function Sidebar() {
  const pathname = usePathname();
  
  const navigationItems = [
    { href: '/', label: 'ダッシュボード', icon: LayoutDashboard },
    { href: '/assets', label: '資産管理', icon: TrendingUp },
    { href: '/portfolio', label: 'ポートフォリオ', icon: PieChart },
    { href: '/reports', label: 'レポート', icon: BarChart3 },
    { href: '/settings', label: '設定', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white shadow-sm border-r min-h-screen">
      <nav className="p-4">
        {navigationItems.map((item) => (
          <SidebarItem
            key={item.href}
            {...item}
            isActive={pathname === item.href}
          />
        ))}
      </nav>
    </aside>
  );
}
```

### 5.2 データ表示コンポーネント

#### AssetCard
```typescript
// components/features/assets/AssetCard.tsx
interface AssetCardProps {
  asset: Asset;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function AssetCard({ asset, onEdit, onDelete }: AssetCardProps) {
  const gainLossColor = asset.gain_loss >= 0 ? 'text-green-600' : 'text-red-600';
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-3">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: asset.category.color }}
          />
          <CardTitle className="text-lg">{asset.name}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onEdit?.(asset.id)}>
              編集
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete?.(asset.id)}>
              削除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">現在価値</p>
            <p className="text-xl font-bold">
              {formatCurrency(asset.current_value)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">損益</p>
            <p className={`text-xl font-bold ${gainLossColor}`}>
              {formatCurrency(asset.gain_loss)}
              <span className="text-sm ml-1">
                ({asset.gain_loss_percent.toFixed(2)}%)
              </span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### PortfolioChart
```typescript
// components/charts/PortfolioChart.tsx
interface PortfolioChartProps {
  data: PortfolioData[];
  period: string;
}

export function PortfolioChart({ data, period }: PortfolioChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>ポートフォリオ推移</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              formatter={(value) => formatCurrency(value)}
              labelFormatter={(date) => formatDate(date)}
            />
            <Line 
              type="monotone" 
              dataKey="totalValue" 
              stroke="#3B82F6" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```

### 5.3 フォームコンポーネント

#### AssetForm
```typescript
// components/forms/AssetForm.tsx
const assetSchema = z.object({
  name: z.string().min(1, '資産名は必須です'),
  category_id: z.string().min(1, 'カテゴリを選択してください'),
  quantity: z.number().positive('数量は正の数で入力してください'),
  acquisition_price: z.number().positive('取得価格は正の数で入力してください'),
  acquisition_date: z.date(),
  symbol: z.string().optional(),
  notes: z.string().optional(),
});

type AssetFormData = z.infer<typeof assetSchema>;

interface AssetFormProps {
  defaultValues?: Partial<AssetFormData>;
  onSubmit: (data: AssetFormData) => void;
  isLoading?: boolean;
}

export function AssetForm({ defaultValues, onSubmit, isLoading }: AssetFormProps) {
  const { data: categories } = useCategories();
  
  const form = useForm<AssetFormData>({
    resolver: zodResolver(assetSchema),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>資産名</FormLabel>
              <FormControl>
                <Input placeholder="例: トヨタ自動車" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="category_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>カテゴリ</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="カテゴリを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span>{category.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 他のフィールド... */}

        <Button type="submit" disabled={isLoading}>
          {isLoading ? '保存中...' : '保存'}
        </Button>
      </form>
    </Form>
  );
}
```

## 6. 状態管理

### 6.1 Zustand ストア設計

#### Auth Store
```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  
  login: async (email: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
    } catch (error) {
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  register: async (data: RegisterData) => {
    try {
      const response = await apiClient.post('/auth/register', data);
      const { user, token } = response.data.data;
      
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true });
    } catch (error) {
      throw error;
    }
  },
}));
```

#### UI Store
```typescript
// stores/uiStore.ts
interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
}));
```

### 6.2 React Query フック

#### Assets Query
```typescript
// hooks/useAssets.ts
export function useAssets(filters?: AssetFilters) {
  return useQuery({
    queryKey: ['assets', filters],
    queryFn: () => apiClient.get('/assets', { params: filters }),
    select: (data) => data.data.data,
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ['assets', id],
    queryFn: () => apiClient.get(`/assets/${id}`),
    select: (data) => data.data.data,
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateAssetData) => apiClient.post('/assets', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}
```

## 7. レスポンシブデザイン

### 7.1 ブレークポイント
```typescript
// lib/breakpoints.ts
export const breakpoints = {
  sm: '640px',   // スマートフォン
  md: '768px',   // タブレット
  lg: '1024px',  // デスクトップ
  xl: '1280px',  // 大画面
};
```

### 7.2 レスポンシブコンポーネント
```typescript
// components/layout/ResponsiveLayout.tsx
export function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {isMobile ? (
        <MobileLayout>{children}</MobileLayout>
      ) : (
        <DesktopLayout>{children}</DesktopLayout>
      )}
    </div>
  );
}
```

## 8. テーマ・スタイリング

### 8.1 カラーパレット
```css
/* styles/globals.css */
:root {
  --primary: 214 100% 50%;          /* Blue-500 */
  --primary-foreground: 0 0% 98%;   /* White */
  --secondary: 210 40% 96%;         /* Gray-100 */
  --secondary-foreground: 222.2 84% 4.9%; /* Gray-900 */
  --success: 142 76% 36%;           /* Green-600 */
  --warning: 38 92% 50%;            /* Orange-500 */
  --error: 0 84% 60%;               /* Red-500 */
  --background: 0 0% 100%;          /* White */
  --foreground: 222.2 84% 4.9%;     /* Gray-900 */
}

[data-theme="dark"] {
  --primary: 214 100% 50%;
  --primary-foreground: 0 0% 98%;
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
}
```

### 8.2 カスタムコンポーネント
```typescript
// components/ui/currency-display.tsx
interface CurrencyDisplayProps {
  amount: number;
  currency?: string;
  variant?: 'default' | 'large' | 'small';
  showSign?: boolean;
}

export function CurrencyDisplay({ 
  amount, 
  currency = 'JPY', 
  variant = 'default',
  showSign = false 
}: CurrencyDisplayProps) {
  const formattedAmount = formatCurrency(amount, currency);
  const isPositive = amount >= 0;
  
  const sizeClasses = {
    small: 'text-sm',
    default: 'text-base',
    large: 'text-xl font-bold',
  };
  
  const colorClasses = showSign 
    ? isPositive 
      ? 'text-green-600' 
      : 'text-red-600'
    : 'text-foreground';

  return (
    <span className={cn(sizeClasses[variant], colorClasses)}>
      {showSign && isPositive && '+'}
      {formattedAmount}
    </span>
  );
}
```

## 9. パフォーマンス最適化

### 9.1 コード分割
```typescript
// 動的インポートでコード分割
const PortfolioChart = dynamic(() => import('@/components/charts/PortfolioChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,
});

const AssetTable = dynamic(() => import('@/components/features/assets/AssetTable'), {
  loading: () => <TableSkeleton />,
});
```

### 9.2 画像最適化
```typescript
// components/ui/optimized-image.tsx
import Image from 'next/image';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
}

export function OptimizedImage({ src, alt, width, height, priority }: OptimizedImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      priority={priority}
      className="rounded-lg shadow-sm"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
    />
  );
}
```

## 10. アクセシビリティ

### 10.1 WAI-ARIA対応
```typescript
// 適切なARIAラベルの使用
<button
  aria-label="資産を削除"
  aria-describedby="delete-description"
  onClick={handleDelete}
>
  <Trash2 className="h-4 w-4" />
</button>

<div id="delete-description" className="sr-only">
  この操作は取り消せません
</div>
```

### 10.2 キーボードナビゲーション
```typescript
// キーボードショートカット対応
useEffect(() => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey) {
      switch (event.key) {
        case 'n':
          event.preventDefault();
          router.push('/assets/new');
          break;
        case 'k':
          event.preventDefault();
          // 検索モーダルを開く
          break;
      }
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [router]);
```

## 11. テスト戦略

### 11.1 コンポーネントテスト
```typescript
// __tests__/components/AssetCard.test.tsx
import { render, screen } from '@testing-library/react';
import { AssetCard } from '@/components/features/assets/AssetCard';

const mockAsset = {
  id: '1',
  name: 'Test Asset',
  current_value: 100000,
  gain_loss: 10000,
  gain_loss_percent: 10,
  category: { id: 'stocks', name: '株式', color: '#EF4444' },
};

describe('AssetCard', () => {
  it('資産情報が正しく表示される', () => {
    render(<AssetCard asset={mockAsset} />);
    
    expect(screen.getByText('Test Asset')).toBeInTheDocument();
    expect(screen.getByText('¥100,000')).toBeInTheDocument();
    expect(screen.getByText('+¥10,000')).toBeInTheDocument();
  });
});
```

### 11.2 統合テスト
```typescript
// __tests__/pages/assets.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AssetsPage from '@/app/assets/page';

describe('Assets Page', () => {
  it('資産一覧が表示される', async () => {
    const queryClient = new QueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <AssetsPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('資産一覧')).toBeInTheDocument();
    });
  });
});
```

## 12. SEO・メタデータ

### 12.1 メタデータ設定
```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    template: '%s | 資産管理システム',
    default: '資産管理システム',
  },
  description: '個人の資産を一元管理し、パフォーマンス分析を行うWebアプリケーション',
  keywords: ['資産管理', '投資', 'ポートフォリオ', '株式'],
  authors: [{ name: 'Shisan Kanri Team' }],
  openGraph: {
    title: '資産管理システム',
    description: '個人の資産を一元管理',
    type: 'website',
    locale: 'ja_JP',
  },
};
```

### 12.2 構造化データ
```typescript
// components/StructuredData.tsx
export function StructuredData() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: '資産管理システム',
    description: '個人の資産を一元管理するアプリケーション',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'All',
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
} 