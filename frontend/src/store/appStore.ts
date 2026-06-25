import { create } from 'zustand';

interface AppState {
  // 当前路径前缀
  prefix: string;
  setPrefix: (prefix: string) => void;

  // Access Code
  accessCode: string;
  setAccessCode: (code: string) => void;
  isAuthenticated: boolean;
  setIsAuthenticated: (val: boolean) => void;

  // Turnstile Token
  turnstileToken: string;
  setTurnstileToken: (token: string) => void;

  // 上传队列
  uploading: boolean;
  setUploading: (val: boolean) => void;
  uploadProgress: number;
  setUploadProgress: (val: number) => void;

  // 模态框
  showTurnstile: boolean;
  setShowTurnstile: (val: boolean) => void;
  showPreview: boolean;
  setShowPreview: (val: boolean) => void;
  previewFile: { key: string; url: string } | null;
  setPreviewFile: (file: { key: string; url: string } | null) => void;

  // 刷新
  refreshKey: number;
  triggerRefresh: () => void;

  // Access Code 模态框
  showAccessCode: boolean;
  setShowAccessCode: (val: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  prefix: '',
  setPrefix: (prefix) => set({ prefix }),

  accessCode: '',
  setAccessCode: (accessCode) => set({ accessCode }),
  isAuthenticated: false,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

  turnstileToken: '',
  setTurnstileToken: (turnstileToken) => set({ turnstileToken }),

  uploading: false,
  setUploading: (uploading) => set({ uploading }),
  uploadProgress: 0,
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),

  showTurnstile: false,
  setShowTurnstile: (showTurnstile) => set({ showTurnstile }),
  showPreview: false,
  setShowPreview: (showPreview) => set({ showPreview }),
  previewFile: null,
  setPreviewFile: (previewFile) => set({ previewFile }),

  refreshKey: 0,
  triggerRefresh: () => set((s) => ({ refreshKey: s.refreshKey + 1 })),

  showAccessCode: false,
  setShowAccessCode: (showAccessCode) => set({ showAccessCode }),
}));