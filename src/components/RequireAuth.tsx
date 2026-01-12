import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

interface RequireAuthProps {
  children: JSX.Element;
}

export const RequireAuth = ({ children }: RequireAuthProps) => {
  const { user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    // 简单的加载状态，避免 auth 初始化还没完成就跳转
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Loading...</div>;
  }

  if (!user) {
    // 重定向到登录页，但保存当前位置，以便登录后跳回
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};
