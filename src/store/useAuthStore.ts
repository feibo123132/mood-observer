import { create } from 'zustand';
import { auth, ENV_ID } from '../lib/cloudbase';
import { useMoodStore } from './useMoodStore';

interface User {
  uid: string;
  email?: string;
  isAnonymous?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  verificationContext: any | null; // Stores the context returned by getVerification

  initAuth: () => Promise<void>;
  sendCode: (email: string) => Promise<boolean>;
  loginWithCode: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  error: null,
  verificationContext: null,

  initAuth: async () => {
    if (!ENV_ID) {
      set({ isLoading: false });
      return;
    }

    // Monitor login state changes
    auth.onLoginStateChanged((loginState) => {
      // 安全修复：严格校验 loginState 和 loginState.user 是否同时存在
      if (loginState && loginState.user) {
        // [Data Bridge] 同步邮箱到 LocalStorage，确保 useMoodStore 等能读取到旧数据
        if (loginState.user.email) {
          localStorage.setItem('mood_user_email', loginState.user.email);
        }
        
        set({
          user: {
            uid: loginState.user.uid,
            email: loginState.user.email,
            isAnonymous: loginState.user.isAnonymous
          },
          isLoading: false
        });
      } else {
        // 未登录或 loginState 数据不完整时，清空用户信息
        // [Data Bridge] 移除本地存储的邮箱 Key
        localStorage.removeItem('mood_user_email');
        set({ user: null, isLoading: false });
      }
    });

    // Check initial login state
    const loginState = await auth.getLoginState();
    // 同样对 getLoginState 的结果进行安全校验
    if (!loginState || !loginState.user) {
       // If not logged in or invalid state, just stop loading
       set({ isLoading: false });
    } else {
       // 如果已有有效登录态，这里其实不需要做额外操作，
       // 因为 onLoginStateChanged 会自动触发并更新 store
       // 但为了稳健，我们也可以不在这里手动 set user，完全依赖监听器
    }
  },

  sendCode: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      // 1. Get verification code context
      const response = await auth.getVerification({
        email: email
      });

      // 2. Store the verification context for later use in login
      // The response usually contains { verificationId: '...', ... }
      if (response) {
         set({ verificationContext: response });
         return true;
      }
      return false;

    } catch (err: any) {
      console.error('Send code failed:', err);
      set({ error: err.message || '发送验证码失败，请稍后重试' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithCode: async (email: string, code: string) => {
    set({ isLoading: true, error: null });
    
    const context = get().verificationContext;
    if (!context) {
        set({ error: '验证上下文丢失，请重新发送验证码', isLoading: false });
        return;
    }

    try {
      // 0. Safety: Clear local data before login to avoid data merging issues
      useMoodStore.getState().clearLocalData();

      // 1. Sign in with email and code
      // CRITICAL: Explicitly pass verificationInfo as per user requirement
      await auth.signInWithEmail({
        email: email,
        verificationCode: code,
        verificationInfo: context
      });

      // Login success is handled by onLoginStateChanged
      // We can clear the context
      set({ verificationContext: null });

    } catch (err: any) {
      console.error('Login failed:', err);
      set({ error: err.message || '登录失败，验证码可能已过期' });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await auth.signOut();
      // [Data Bridge] 登出时立即移除本地存储的邮箱 Key
      localStorage.removeItem('mood_user_email');
      // Safety: Clear local data immediately after logout
      useMoodStore.getState().clearLocalData();
      set({ user: null });
    } catch (err) {
      console.error('Logout failed:', err);
    }
  }
}));
