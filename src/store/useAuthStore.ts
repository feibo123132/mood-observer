import { create } from 'zustand';
import { auth, ENV_ID } from '../lib/cloudbase';
import { useMoodStore } from './useMoodStore';

interface User {
  uid: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  initAuth: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,

  initAuth: async () => {
    if (!ENV_ID) {
      set({ isLoading: false });
      return;
    }
    
    // 1. 启动匿名登录确保连接
    try {
      const loginState = await auth.getLoginState();
      if (!loginState) {
        await auth.signInAnonymously();
      }
    } catch (err) {
      console.error('Anonymous login failed:', err);
    }

    // 2. 恢复本地存储的"软身份"
    const savedEmail = localStorage.getItem('mood_user_email');
    if (savedEmail) {
      set({ 
        user: { 
          uid: savedEmail, // 使用邮箱作为逻辑上的 UID
          email: savedEmail 
        } 
      });
    }

    set({ isLoading: false });
  },

  login: async (email, pass) => {
    // 0. 安全时序：登录前先清空本地数据，确保白纸一张
    useMoodStore.getState().clearLocalData();

    // 纯逻辑登录，不调用 auth.signIn...
    // 这里忽略密码验证（或者您可以硬编码一个简单的密码校验）
    set({ isLoading: true, error: null });
    
    try {
      // 确保底层连接是通的
      const loginState = await auth.getLoginState();
      if (!loginState) {
        await auth.signInAnonymously();
      }

      // 保存软身份
      localStorage.setItem('mood_user_email', email);
      set({ 
        user: { 
          uid: email, 
          email: email 
        } 
      });
      
    } catch (err: any) {
      console.error('Soft login failed:', err);
      set({ error: '连接云端失败，请检查网络' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    // 登出只清除本地身份，不切断底层连接
    localStorage.removeItem('mood_user_email');
    set({ user: null });
    
    // 安全时序：登出后立即清空本地数据
    useMoodStore.getState().clearLocalData();
  }
}));
