import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, Mail } from 'lucide-react';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { sendCode, loginWithCode, isLoading, error } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [msg, setMsg] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Countdown timer logic
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer); // Cleanup on unmount or re-render
    }
  }, [countdown]);

  const handleSendCode = async () => {
    setMsg('');
    if (!email) {
      setMsg('请输入邮箱地址');
      return;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setMsg('请输入有效的邮箱地址');
        return;
    }

    const success = await sendCode(email);
    if (success) {
      setCodeSent(true);
      setCountdown(60);
      setMsg('验证码已发送，请查收邮件');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    
    if (!code) {
      setMsg('请输入验证码');
      return;
    }

    try {
      await loginWithCode(email, code);
      navigate('/'); // Redirect to home on success
    } catch (err) {
      // Error handled in store
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative">
        <div className="text-center mb-8 mt-4">
          <h1 className="text-2xl font-bold text-slate-800">
            验证码登录
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            无需记忆密码，使用邮箱验证码快捷登录
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">邮箱地址</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
                placeholder="your-email@example.com"
                disabled={codeSent && countdown > 0} // Optional: lock email while countdown is active
              />
            </div>
          </div>

          {codeSent && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-300">
              <label className="block text-sm font-medium text-slate-700 mb-1">验证码</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.trim())}
                className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all tracking-widest text-center text-lg font-mono"
                placeholder="输入6位验证码"
                maxLength={6}
              />
            </div>
          )}

          {(error || msg) && (
            <div className={`text-sm text-center p-2 rounded-lg ${error ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
              {error || msg}
            </div>
          )}

          <div className="space-y-3">
            {!codeSent ? (
              <button
                type="button"
                onClick={handleSendCode}
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading && <Loader2 className="animate-spin" size={18} />}
                发送验证码
              </button>
            ) : (
              <>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading && <Loader2 className="animate-spin" size={18} />}
                  确认登录
                </button>
                
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={countdown > 0 || isLoading}
                  className="w-full py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `${countdown}秒后可重新发送` : '没有收到？重新发送'}
                </button>
              </>
            )}
          </div>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          未注册的邮箱将自动创建账号
        </div>
      </div>
    </div>
  );
};
