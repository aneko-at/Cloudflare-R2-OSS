import { useState } from 'react';
import { Key, X } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { verifyAccessCodeApi } from '../utils/api';

interface AccessCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccessCodeModal({ isOpen, onClose }: AccessCodeModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const setIsAuthenticated = useAppStore((s) => s.setIsAuthenticated);
  const setAccessCode = useAppStore((s) => s.setAccessCode);

  const handleVerify = async () => {
    if (!code.trim()) {
      setError('请输入访问码');
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const result = await verifyAccessCodeApi(code.trim());
      if (result.valid) {
        setAccessCode(code.trim());
        setIsAuthenticated(true);
        onClose();
        setCode('');
        setError('');
      } else {
        setError('访问码错误');
      }
    } catch {
      setError('验证失败，请重试');
    } finally {
      setVerifying(false);
    }
  };

  const handleClose = () => {
    setCode('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-sm mx-4 glass-strong rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
          <h3 className="text-base font-semibold text-[#1d1d1f]">管理员登录</h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-[#aeaeb2] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-center mb-5">
            <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center">
              <Key size={28} className="text-[#1d1d1f]" />
            </div>
          </div>

          <label className="block text-sm text-[#86868b] mb-2 font-medium">请输入管理员访问码</label>
          <input
            type="password"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(''); }}
            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
            className="w-full px-4 py-3 rounded-xl bg-black/[0.02] border border-black/10 text-[#1d1d1f] text-sm placeholder-[#aeaeb2] focus:outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5 transition-all"
            placeholder="输入访问码..."
            autoFocus
          />

          {error && (
            <p className="text-[#ff3b30] text-xs mt-2.5">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 py-5 border-t border-black/5">
          <button
            onClick={handleClose}
            className="px-5 py-2.5 rounded-xl text-sm text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleVerify}
            disabled={verifying}
            className="px-6 py-2.5 rounded-xl text-sm font-medium bg-[#1d1d1f] text-white hover:bg-black disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            {verifying ? '验证中...' : '确认'}
          </button>
        </div>
      </div>
    </div>
  );
}