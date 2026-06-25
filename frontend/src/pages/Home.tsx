import { useState, useCallback } from 'react';
import { useFiles } from '../hooks/useFiles';
import { useAppStore } from '../store/appStore';
import { downloadFile, deleteFile as deleteFileApi, createFolder } from '../utils/api';
import { Breadcrumb } from '../components/Breadcrumb';
import { Toolbar } from '../components/Toolbar';
import { FileList } from '../components/FileList';
import { UploadZone } from '../components/UploadZone';
import { TurnstileModal } from '../components/TurnstileModal';
import { PreviewModal } from '../components/PreviewModal';
import { AccessCodeModal } from '../components/AccessCodeModal';
import { EmptyState } from '../components/EmptyState';
import type { R2ObjectInfo } from '../types';


export default function Home() {
  const { files, loading, error } = useFiles();
  const [showUpload, setShowUpload] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [folderName, setFolderName] = useState('');

  const prefix = useAppStore((s) => s.prefix);
  const setPrefix = useAppStore((s) => s.setPrefix);
  const triggerRefresh = useAppStore((s) => s.triggerRefresh);
  const accessCode = useAppStore((s) => s.accessCode);
  const turnstileToken = useAppStore((s) => s.turnstileToken);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const setTurnstileToken = useAppStore((s) => s.setTurnstileToken);
  const showTurnstile = useAppStore((s) => s.showTurnstile);
  const setShowTurnstile = useAppStore((s) => s.setShowTurnstile);
  const showPreview = useAppStore((s) => s.showPreview);
  const setShowPreview = useAppStore((s) => s.setShowPreview);
  const previewFile = useAppStore((s) => s.previewFile);
  const setPreviewFile = useAppStore((s) => s.setPreviewFile);
  const showAccessCode = useAppStore((s) => s.showAccessCode);
  const setShowAccessCode = useAppStore((s) => s.setShowAccessCode);

  const requireTurnstile = useCallback((action: () => void) => {
    // 管理员登录后跳过 Turnstile
    if (isAuthenticated) {
      action();
      return;
    }
    if (turnstileToken) {
      action();
    } else {
      setPendingAction(() => action);
      setShowTurnstile(true);
    }
  }, [isAuthenticated, turnstileToken]);

  const handleTurnstileSuccess = useCallback((token: string) => {
    setTurnstileToken(token);
    setShowTurnstile(false);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  }, [pendingAction, setTurnstileToken]);

  const handleNavigate = (folder: string) => {
    setPrefix(folder);
    setTurnstileToken('');
    triggerRefresh();
  };

  const handleDelete = (file: R2ObjectInfo) => {
    if (!isAuthenticated) {
      alert('请先登录管理员账号');
      return;
    }
    if (!confirm(`确定要删除 "${file.key}" 吗？${file.isFolder ? '这将删除文件夹内所有文件。' : ''}`)) return;
    (async () => {
      try {
        await deleteFileApi(file.key, accessCode, '');
        triggerRefresh();
      } catch (e) {
        alert(e instanceof Error ? e.message : '删除失败');
      }
    })();
  };

  const handlePreview = async (file: R2ObjectInfo) => {
    setPreviewFile({ key: file.key, url: '' });
    setShowPreview(true);
  };

  const handleDownload = async (file: R2ObjectInfo) => {
    try {
      await downloadFile(file.key);
    } catch (e) {
      alert(e instanceof Error ? e.message : '下载失败');
    }
  };

  const handleNewFolder = async () => {
    if (!isAuthenticated) {
      alert('请先登录管理员账号');
      return;
    }
    if (!showNewFolder) {
      setShowNewFolder(true);
      setFolderName('');
      return;
    }
    if (!folderName.trim()) {
      alert('请输入文件夹名称');
      return;
    }
    try {
      await createFolder(folderName.trim(), prefix, accessCode, '');
      setShowNewFolder(false);
      setFolderName('');
      triggerRefresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : '创建文件夹失败');
    }
  };

  const handleUpload = () => {
    requireTurnstile(() => {
      setShowUpload(true);
    });
  };

  return (
    <div className="min-h-screen relative">
      {/* 头部 */}
      <header className="relative glass-strong border-b border-black/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3 mb-3">
            <img src="/favicon.ico" alt="Aneko" className="w-10 h-10 rounded-2xl object-cover shadow-lg shadow-blue-500/20" />
            <div>
              <h1 className="text-lg font-semibold text-[#1d1d1f] tracking-tight">Aneko - r2 oss</h1>
              <p className="text-xs text-[#86868b]">基于 Cloudflare Workers 和 R2 的轻量对象存储管理</p>
            </div>
          </div>
          <Breadcrumb />
        </div>
      </header>

      {/* 主体 */}
      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* 工具栏 */}
        <div className="mb-5">
          <Toolbar
            onUpload={handleUpload}
            onNewFolder={handleNewFolder}
            onRefresh={triggerRefresh}
          />
        </div>

        {/* 新建文件夹输入 */}
        {showNewFolder && (
          <div className="mb-4 animate-fade-in">
            <div className="glass-subtle rounded-2xl p-4 flex items-center gap-2">
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNewFolder()}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/80 border border-black/10 text-[#1d1d1f] text-sm placeholder-[#aeaeb2] focus:outline-none focus:border-black/30 focus:ring-2 focus:ring-black/5 transition-all"
                placeholder="文件夹名称..."
                autoFocus
              />
              <button
                onClick={handleNewFolder}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-[#1d1d1f] text-white hover:bg-black shadow-sm transition-all"
              >
                创建
              </button>
              <button
                onClick={() => setShowNewFolder(false)}
                className="px-4 py-2.5 rounded-xl text-sm text-[#86868b] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 rounded-full border-2 border-black/20 border-t-black animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-subtle rounded-2xl p-8 text-center">
            <p className="text-[#ff3b30] text-sm mb-4">{error}</p>
            <button
              onClick={triggerRefresh}
              className="px-4 py-2 rounded-xl text-sm bg-[#ff3b30]/10 text-[#ff3b30] hover:bg-[#ff3b30]/15 transition-colors"
            >
              重试
            </button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && files.length === 0 && <EmptyState />}

        {/* File List */}
        {!loading && !error && files.length > 0 && (
          <div className="animate-fade-in">
            <FileList
              files={files}
              onNavigate={handleNavigate}
              onDelete={handleDelete}
              onPreview={handlePreview}
              onDownload={handleDownload}
            />
          </div>
        )}
      </main>

      {/* 模态框 */}
      {showUpload && <UploadZone onClose={() => setShowUpload(false)} />}

      {showTurnstile && (
        <TurnstileModal
          onSuccess={handleTurnstileSuccess}
          onClose={() => {
            setShowTurnstile(false);
            setPendingAction(null);
          }}
        />
      )}

      {showPreview && previewFile && (
        <PreviewModal
          fileKey={previewFile.key}
          onClose={() => {
            setShowPreview(false);
            setPreviewFile(null);
          }}
        />
      )}

      <AccessCodeModal
        isOpen={showAccessCode}
        onClose={() => setShowAccessCode(false)}
      />
    </div>
  );
}