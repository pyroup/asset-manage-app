'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import type { User } from 'shared/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // 初期化時にトークンを検証
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // トークンが存在しない場合は検証をスキップ
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setIsLoading(false);
          return;
        }

        const response = await apiClient.verifyToken();
        if (response.success && response.data?.valid && response.data.user) {
          setUser(response.data.user);
        } else {
          // トークンが無効な場合はクリア
          localStorage.removeItem('auth_token');
        }
      } catch (error: unknown) {
        console.error('認証トークンの検証に失敗しました:', error);
        
        // ネットワークエラーの場合は詳細をログに記録
        if (error instanceof Error && (error.message?.includes('Network Error') || error.message?.includes('ECONNREFUSED'))) {
          console.error('バックエンドサーバーに接続できません。サーバーが起動しているか確認してください。');
        }
        
        // エラーが発生した場合はトークンをクリア
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await apiClient.login({ email, password });
      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error?.message || 'ログインに失敗しました' 
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response && 
        'data' in error.response && 
        typeof error.response.data === 'object' && error.response.data &&
        'error' in error.response.data &&
        typeof error.response.data.error === 'object' && error.response.data.error &&
        'message' in error.response.data.error
        ? String(error.response.data.error.message)
        : 'ログインに失敗しました';
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await apiClient.register({ email, password, name });
      if (response.success && response.data) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error?.message || 'ユーザー登録に失敗しました' 
        };
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error && 
        typeof error.response === 'object' && error.response && 
        'data' in error.response && 
        typeof error.response.data === 'object' && error.response.data &&
        'error' in error.response.data &&
        typeof error.response.data.error === 'object' && error.response.data.error &&
        'message' in error.response.data.error
        ? String(error.response.data.error.message)
        : 'ユーザー登録に失敗しました';
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('ログアウトエラー:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('ユーザー情報の取得に失敗しました:', error);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
} 