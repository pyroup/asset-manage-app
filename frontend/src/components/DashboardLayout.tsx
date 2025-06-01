'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LayoutDashboard, 
  Wallet, 
  PieChart, 
  FileText, 
  LogOut, 
  Menu,
  X,
  User
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'ダッシュボード', href: '/dashboard', icon: LayoutDashboard },
  { name: '資産管理', href: '/assets', icon: Wallet },
  { name: 'ポートフォリオ', href: '/portfolio', icon: PieChart },
  { name: 'レポート', href: '/reports', icon: FileText },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* モバイル用サイドバーオーバーレイ */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* サイドバー */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:flex lg:flex-shrink-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col w-64 h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="ml-3 text-xl font-semibold text-gray-900">資産管理</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex-1 mt-8 px-4 pb-32">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200
                        ${isActive 
                          ? 'bg-indigo-100 text-indigo-700 border-r-2 border-indigo-700' 
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                        }
                      `}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-indigo-700' : 'text-gray-500'}`} />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* ユーザー情報とログアウト */}
          <div className="absolute bottom-0 left-0 right-0 min-h-[120px] p-4 border-t border-gray-200 bg-white">
            <div className="flex items-start mb-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate leading-5" title={user?.name}>
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate mt-1 leading-4" title={user?.email}>
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <LogOut className="mr-3 h-4 w-4" />
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* メインコンテンツエリア */}
      <div className="flex-1 flex flex-col min-w-0 lg:overflow-hidden">
        {/* モバイル用ヘッダー */}
        <header className="bg-white lg:hidden">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-12">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="hidden sm:block lg:hidden">
                  <p className="text-sm text-gray-600">
                    ようこそ、<span className="font-medium text-gray-900">{user?.name}</span>さん
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* ページコンテンツ */}
        <main className="flex-1 px-6 py-6 lg:px-4 lg:py-4 lg:overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
} 