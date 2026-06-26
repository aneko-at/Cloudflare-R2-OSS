import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useTurnstile } from '../hooks/useTurnstile';

interface TurnstileModalProps {
  onSuccess: (token: string) => void;
  onClose: () => void;
}

export function TurnstileModal({ onSuccess, onClose }: TurnstileModalProps) {
  const { loadTurnstileScript, renderTurnstile, removeTurnstile } = useTurnstile();

  useEffect(() => {
    loadTurnstileScript();
    const timer = setTimeout(() => {
      renderTurnstile('turnstile-container', onSuccess);
    }, 300);
    return () => {
      clearTimeout(timer);
      removeTurnstile();
    };
  }, [loadTurnstileScript, renderTurnstile, removeTurnstile, onSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <div className="w-full max-w-sm mx-4 glass-strong rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
          <h3 className="text-base font-semibold text-[#1d1d1f]">人机验证</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#aeaeb2] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          <div className="w-14 h-14 rounded-2xl bg-black/5 flex items-center justify-center mb-4">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#1d1d1f]">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <p className="text-sm text-[#86868b] mb-5 text-center">
            请完成验证以继续操作
          </p>
          <div id="turnstile-container" className="min-h-[65px]" />
        </div>

        <div className="flex justify-end px-6 py-5 border-t border-black/5">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}