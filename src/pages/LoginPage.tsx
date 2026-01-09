import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { ArrowLeft, Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    
    if (!email || !password) {
      setMsg('请输入邮箱和密码');
      return;
    }

    try {
      await login(email, password);
      navigate('/'); // 登录成功跳转首页
    } catch (err) {
      // 错误信息已经在 store 中处理
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative">
        <button 
          onClick={() => navigate('/')}
          className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="text-center mb-8 mt-4">
          <h1 className="text-2xl font-bold text-slate-800">
            登录 / 同步
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            输入任意邮箱以标识您的身份（无需注册）
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">邮箱 / 身份ID</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
              placeholder="your-email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密码 (可选)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
              placeholder="任意输入即可"
            />
          </div>

          {(error || msg) && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
              {error || msg}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="animate-spin" size={18} />}
            登 录
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          如需新账号，请联系管理员手动创建
        </div>
      </div>
    </div>
  );
};
