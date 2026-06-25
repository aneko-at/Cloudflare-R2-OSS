import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPreviewUrl } from '../utils/api';
import { getFileExtension } from '../utils/format';

interface PreviewModalProps {
  fileKey: string;
  onClose: () => void;
}

export function PreviewModal({ fileKey, onClose }: PreviewModalProps) {
  const [url, setUrl] = useState<string>('');
  const [textContent, setTextContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const ext = getFileExtension(fileKey);
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext.toLowerCase());
  const isText = ['txt', 'md', 'json', 'xml', 'yaml', 'yml', 'csv', 'log', 'env', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'py', 'vue', 'sql'].includes(ext.toLowerCase());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const previewUrl = await getPreviewUrl(fileKey);
        if (cancelled) {
          URL.revokeObjectURL(previewUrl);
          return;
        }
        if (isText) {
          const res = await fetch(previewUrl);
          const text = await res.text();
          if (!cancelled) setTextContent(text);
          URL.revokeObjectURL(previewUrl);
        } else {
          if (!cancelled) setUrl(previewUrl);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '预览失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [fileKey, isImage, isText]);

  const fileName = fileKey.split('/').pop() || fileKey;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-3xl max-h-[85vh] mx-4 glass-strong rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-black/5">
          <h3 className="text-base font-semibold text-[#1d1d1f] truncate">{fileName}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-[#aeaeb2] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-auto max-h-[70vh]">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-10 h-10 rounded-full border-2 border-black/20 border-t-black animate-spin" />
            </div>
          )}

          {error && <p className="text-[#ff3b30] text-center py-8">{error}</p>}

          {!loading && !error && isImage && url && (
            <img src={url} alt={fileName} className="max-w-full max-h-[60vh] mx-auto rounded-2xl" />
          )}

          {!loading && !error && isText && textContent && (
            <pre className="bg-black/[0.02] rounded-2xl p-5 text-sm text-[#1d1d1f] overflow-x-auto whitespace-pre-wrap border border-black/5">
              {textContent}
            </pre>
          )}

          {!loading && !error && !isImage && !isText && (
            <p className="text-[#aeaeb2] text-center py-8">该文件类型不支持预览</p>
          )}
        </div>
      </div>
    </div>
  );
}