import { Upload, FolderPlus, RefreshCw, LogIn, LogOut } from 'lucide-react';
import { useAppStore } from '../store/appStore';

interface ToolbarProps {
  onUpload: () => void;
  onNewFolder: () => void;
  onRefresh: () => void;
}

export function Toolbar({ onUpload, onNewFolder, onRefresh }: ToolbarProps) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const setIsAuthenticated = useAppStore((s) => s.setIsAuthenticated);
  const setAccessCode = useAppStore((s) => s.setAccessCode);
  const setShowAccessCode = useAppStore((s) => s.setShowAccessCode);
  const uploading = useAppStore((s) => s.uploading);

  const btnGlass =
    'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium glass-subtle transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={onUpload}
        disabled={!isAuthenticated || uploading}
        className={`${btnGlass} text-[#1d1d1f] hover:bg-white/80 hover:shadow-md`}
      >
        <Upload size={15} />
        <span className="hidden sm:inline">上传</span>
      </button>

      <button
        onClick={onNewFolder}
        disabled={!isAuthenticated}
        className={`${btnGlass} text-[#1d1d1f] hover:bg-white/80 hover:shadow-md`}
      >
        <FolderPlus size={15} />
        <span className="hidden sm:inline">新建文件夹</span>
      </button>

      <button
        onClick={onRefresh}
        className={`${btnGlass} text-[#86868b] hover:text-[#1d1d1f] hover:bg-white/80`}
      >
        <RefreshCw size={15} />
        <span className="hidden sm:inline">刷新</span>
      </button>

      <div className="ml-auto">
        {isAuthenticated ? (
          <button
            onClick={() => {
              setIsAuthenticated(false);
              setAccessCode('');
            }}
            className={`${btnGlass} text-[#34c759] hover:bg-white/80 hover:shadow-md`}
          >
            <LogOut size={15} />
            <span className="hidden sm:inline">已登录</span>
          </button>
        ) : (
          <button
            onClick={() => setShowAccessCode(true)}
            className={`${btnGlass} text-[#86868b] hover:text-[#1d1d1f] hover:bg-white/80`}
          >
            <LogIn size={15} />
            <span className="hidden sm:inline">管理员登录</span>
          </button>
        )}
      </div>
    </div>
  );
}