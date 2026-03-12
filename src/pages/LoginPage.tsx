import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Lock, Mail } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const DAILY_QUOTES = [
  '今天的你，已经比昨天更进一步。',
  '允许自己慢一点，但不要停止前进。',
  '当你愿意面对情绪，改变就已经开始。',
  '照顾好自己，是一切变好的起点。',
  '每次认真记录，都是在和更好的自己相遇。'
];

const QUOTE_SOURCE = ['解忧宇宙', '解忧宇宙', '解忧宇宙', '解忧宇宙', '解忧宇宙'];
const LOGIN_LOGO_SRC = '/images/login-logo.png';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

type LoginMode = 'code' | 'password' | 'setup';

export const LoginPage = () => {
  const navigate = useNavigate();
  const {
    sendCode,
    loginWithCode,
    loginWithPassword,
    requestPasswordSetup,
    confirmPasswordSetup,
    isLoading,
    error
  } = useAuthStore();

  const [mode, setMode] = useState<LoginMode>('code');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [setupCode, setSetupCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [setupCodeSent, setSetupCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [setupCountdown, setSetupCountdown] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [logoLoadError, setLogoLoadError] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (setupCountdown <= 0) return;
    const timer = setTimeout(() => setSetupCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [setupCountdown]);

  useEffect(() => {
    const now = new Date();
    const daySerial = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / (24 * 60 * 60 * 1000));
    const index = ((daySerial % DAILY_QUOTES.length) + DAILY_QUOTES.length) % DAILY_QUOTES.length;
    setQuoteIndex(index);
  }, []);

  useEffect(() => {
    setMsg('');
  }, [mode]);

  const validateEmail = () => {
    if (!email) {
      setMsg('请输入邮箱地址');
      return false;
    }
    if (!EMAIL_REGEX.test(email)) {
      setMsg('请输入有效的邮箱地址');
      return false;
    }
    return true;
  };

  const handleSendCode = async () => {
    setMsg('');
    if (!validateEmail()) return;

    const success = await sendCode(email);
    if (success) {
      setCodeSent(true);
      setCountdown(60);
      setMsg('验证码已发送，请查收邮件');
    }
  };

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (!validateEmail()) return;
    if (!code) {
      setMsg('请输入验证码');
      return;
    }

    try {
      await loginWithCode(email, code);
      navigate('/');
    } catch {
      // error is handled in store
    }
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    if (!validateEmail()) return;
    if (!password) {
      setMsg('请输入密码');
      return;
    }

    try {
      await loginWithPassword(email, password);
      navigate('/');
    } catch {
      // error is handled in store
    }
  };

  const handleSendSetupCode = async () => {
    setMsg('');
    if (!validateEmail()) return;

    const success = await requestPasswordSetup(email);
    if (success) {
      setSetupCodeSent(true);
      setSetupCountdown(60);
      setMsg('密码设置验证码已发送，请查收邮件');
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');

    if (!setupCode) {
      setMsg('请输入验证码');
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setMsg(`密码长度至少 ${MIN_PASSWORD_LENGTH} 位`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg('两次输入的密码不一致');
      return;
    }

    try {
      const result = await confirmPasswordSetup(email, setupCode, newPassword);
      if (result.autoLoggedIn) {
        setMsg('密码设置成功，已自动登录');
        navigate('/');
        return;
      }

      // 密码已设置成功，但当前环境未开启密码登录
      setMode('code');
      setPassword('');
      setSetupCode('');
      setNewPassword('');
      setConfirmPassword('');
      setSetupCodeSent(false);
      setSetupCountdown(0);
      setMsg('密码已设置成功，请先使用验证码登录。');
    } catch {
      // error is handled in store
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md mb-6 flex flex-col items-center text-center px-4">
        <div className="w-28 h-28 rounded-full bg-white border border-slate-200 shadow-sm overflow-hidden flex items-center justify-center mb-5">
          {!logoLoadError ? (
            <img
              src={LOGIN_LOGO_SRC}
              alt="JIEYOU Logo"
              className="w-full h-full object-cover rounded-full"
              onError={() => setLogoLoadError(true)}
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-indigo-300 text-indigo-400 flex items-center justify-center text-xs font-medium">
              LOGO
            </div>
          )}
        </div>
        <p className="text-base text-slate-600 leading-relaxed min-h-[48px]">{DAILY_QUOTES[quoteIndex]}</p>
        <p className="text-sm text-slate-400 mt-2">- {QUOTE_SOURCE[quoteIndex]}</p>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 relative">
        <div className="text-center mb-8 mt-4">
          <h1 className="text-2xl font-bold text-slate-800">
            {mode === 'code' && '验证码登录'}
            {mode === 'password' && '账号密码登录'}
            {mode === 'setup' && '设置/重置密码'}
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            {mode === 'code' && '无需记忆密码，使用邮箱验证码快捷登录'}
            {mode === 'password' && '使用邮箱和密码直接登录'}
            {mode === 'setup' && '通过邮箱验证码设置或重置密码'}
          </p>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode('code')}
            className={`rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === 'code' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            验证码
          </button>
          <button
            type="button"
            onClick={() => setMode('password')}
            className={`rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === 'password' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            密码
          </button>
          <button
            type="button"
            onClick={() => setMode('setup')}
            className={`rounded-lg py-2 text-sm font-medium transition-colors ${
              mode === 'setup' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            设置密码
          </button>
        </div>

        {(mode === 'code' || mode === 'password') && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-1">邮箱地址</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
                placeholder="your-email@example.com"
                disabled={mode === 'code' && codeSent && countdown > 0}
              />
            </div>
          </div>
        )}

        {mode === 'code' && (
          <form onSubmit={handleCodeLogin} className="space-y-6">
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
              <div
                className={`text-sm text-center p-2 rounded-lg ${
                  error ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                }`}
              >
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
                    {countdown > 0 ? `${countdown} 秒后可重新发送` : '没有收到？重新发送'}
                  </button>
                </>
              )}
            </div>
          </form>
        )}

        {mode === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
                  placeholder="请输入密码"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {(error || msg) && (
              <div
                className={`text-sm text-center p-2 rounded-lg ${
                  error ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                }`}
              >
                {error || msg}
              </div>
            )}

            <div className="space-y-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading && <Loader2 className="animate-spin" size={18} />}
                登录
              </button>
              <button
                type="button"
                onClick={() => setMode('setup')}
                className="w-full py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors"
              >
                忘记密码？去设置/重置
              </button>
            </div>
          </form>
        )}

        {mode === 'setup' && (
          <form onSubmit={handleSetupPassword} className="space-y-6">
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
                  disabled={setupCodeSent && setupCountdown > 0}
                />
              </div>
            </div>

            {setupCodeSent && (
              <>
                <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                  <label className="block text-sm font-medium text-slate-700 mb-1">验证码</label>
                  <input
                    type="text"
                    value={setupCode}
                    onChange={(e) => setSetupCode(e.target.value.trim())}
                    className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all tracking-widest text-center text-lg font-mono"
                    placeholder="输入验证码"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">新密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
                      placeholder={`至少 ${MIN_PASSWORD_LENGTH} 位`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">确认密码</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-400 transition-all"
                      placeholder="请再次输入新密码"
                    />
                  </div>
                </div>
              </>
            )}

            {(error || msg) && (
              <div
                className={`text-sm text-center p-2 rounded-lg ${
                  error ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                }`}
              >
                {error || msg}
              </div>
            )}

            <div className="space-y-3">
              {!setupCodeSent ? (
                <button
                  type="button"
                  onClick={handleSendSetupCode}
                  disabled={isLoading}
                  className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading && <Loader2 className="animate-spin" size={18} />}
                  发送设置验证码
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isLoading && <Loader2 className="animate-spin" size={18} />}
                    确认设置密码
                  </button>
                  <button
                    type="button"
                    onClick={handleSendSetupCode}
                    disabled={setupCountdown > 0 || isLoading}
                    className="w-full py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {setupCountdown > 0 ? `${setupCountdown} 秒后可重新发送` : '没有收到？重新发送'}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setMode('password')}
                className="w-full py-2 text-slate-500 text-sm hover:text-slate-700 transition-colors"
              >
                返回密码登录
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center text-xs text-slate-400">首次登录可先用验证码，再到“设置密码”完成绑定</div>
      </div>
    </div>
  );
};
