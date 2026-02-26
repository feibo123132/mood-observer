import { useState } from 'react';
import { db } from '../lib/cloudbase';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, X, AlertTriangle, Database, CheckCircle2 } from 'lucide-react';

interface DataMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataMigrationModal = ({ isOpen, onClose }: DataMigrationModalProps) => {
  const { user } = useAuthStore();
  const [oldEmail, setOldEmail] = useState('');
  const [isMigrating, setIsMigrating] = useState(false);
  const [progress, setProgress] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  if (!isOpen) return null;

  const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

  const handleMigrate = async () => {
    if (!oldEmail || !user?.email) return;
    if (oldEmail === user.email) {
      addLog('❌ 旧邮箱不能与当前邮箱相同');
      return;
    }

    setIsMigrating(true);
    setLogs([]);
    addLog(`🚀 开始迁移：${oldEmail} -> ${user.email}`);

    try {
      // 1. Migrate Mood Records
      await migrateCollection('mood_records', oldEmail, user.email, '情绪记录');
      
      // 2. Migrate Surgery Records
      await migrateCollection('socratic_records', oldEmail, user.email, '思想手术');
      
      // 3. Migrate Reports
      await migrateCollection('mood_reports', oldEmail, user.email, '周报');

      addLog('✅ 所有数据迁移完成！即将刷新页面...');
      setTimeout(() => {
        window.location.reload();
      }, 2000);

    } catch (err: any) {
      console.error(err);
      addLog(`❌ 迁移过程中出错: ${err.message}`);
      setIsMigrating(false);
    }
  };

  const migrateCollection = async (collectionName: string, oldUid: string, newUid: string, label: string) => {
    setProgress(`正在扫描 ${label}...`);
    
    // 1. Query old data (Limit 1000 to cover legacy data)
    const res = await db.collection(collectionName)
      .where({ userId: oldUid })
      .limit(1000)
      .get();

    if (!res.data || res.data.length === 0) {
      addLog(`⚠️ 未发现旧的 ${label}`);
      return;
    }

    const total = res.data.length;
    addLog(`📦 发现 ${total} 条 ${label}，准备迁移...`);

    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < total; i++) {
      const oldRecord = res.data[i];
      setProgress(`正在迁移 ${label} (${i + 1}/${total})`);

      try {
        // 2. Duplicate Check (Check if same business ID exists for new user)
        // Note: 'mood_reports' uses 'year' and 'week' as composite key, others use 'id'
        let exists = false;
        
        if (collectionName === 'mood_reports') {
             const checkRes = await db.collection(collectionName).where({
                userId: newUid,
                year: oldRecord.year,
                week: oldRecord.week
             }).count();
             exists = checkRes.total > 0;
        } else if (oldRecord.id) {
             const checkRes = await db.collection(collectionName).where({
                userId: newUid,
                id: oldRecord.id
             }).count();
             exists = checkRes.total > 0;
        }

        if (exists) {
          skipCount++;
          continue;
        }

        // 3. Clean Data (Remove system fields)
        const { _id, _openid, ...businessData } = oldRecord;
        
        // 4. Write New Data
        await db.collection(collectionName).add({
          ...businessData,
          userId: newUid, // Re-assign owner
          migratedFrom: oldUid, // Audit trail
          migratedAt: new Date().toISOString()
        });
        
        successCount++;

      } catch (e) {
        console.error(`Migrate item failed:`, e);
      }
    }

    addLog(`✨ ${label}: 成功 ${successCount} 条，跳过 ${skipCount} 条`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <Database size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">找回旧数据</h2>
              <p className="text-xs text-slate-500">将旧账号数据合并到当前账号</p>
            </div>
          </div>
          {!isMigrating && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <X size={20} />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {!isMigrating ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">使用说明</p>
                  <p className="opacity-90">
                    如果您之前使用了非真实邮箱（如 1@qq.com）作为账号，请输入该邮箱。
                    系统会将该邮箱下的所有数据<strong>复制</strong>到您当前登录的账号 ({user?.email}) 下。
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  旧邮箱地址 (Old Email)
                </label>
                <input
                  type="text"
                  value={oldEmail}
                  onChange={(e) => setOldEmail(e.target.value)}
                  placeholder="例如: 1@qq.com"
                  className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-indigo-600 font-medium">
                 <Loader2 className="animate-spin" size={20} />
                 <span>{progress}</span>
              </div>
              
              <div className="bg-slate-900 rounded-xl p-4 h-64 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className="border-b border-slate-800/50 pb-1 last:border-0 last:pb-0">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isMigrating && (
          <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleMigrate}
              disabled={!oldEmail.trim()}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <CheckCircle2 size={16} />
              开始迁移
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
