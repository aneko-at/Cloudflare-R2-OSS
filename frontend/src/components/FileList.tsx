import { useMemo } from 'react';
import { Folder, File, Download, Trash2, Eye } from 'lucide-react';
import type { R2ObjectInfo } from '../types';
import { formatFileSize, formatDate, getDisplayName, getFileExtension, getFileTypeIcon } from '../utils/format';
import { useAppStore } from '../store/appStore';

interface FileListProps {
  files: R2ObjectInfo[];
  onNavigate: (folder: string) => void;
  onDelete: (file: R2ObjectInfo) => void;
  onPreview: (file: R2ObjectInfo) => void;
  onDownload: (file: R2ObjectInfo) => void;
}

const fileTypeColors: Record<string, string> = {
  image: 'text-[#ff6b6b]',
  video: 'text-[#845ef7]',
  audio: 'text-[#339af0]',
  document: 'text-[#f06595]',
  code: 'text-[#51cf66]',
  archive: 'text-[#f59f00]',
  file: 'text-[#adb5bd]',
};

export function FileList({ files, onNavigate, onDelete, onPreview, onDownload }: FileListProps) {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const prefix = useAppStore((s) => s.prefix);

  const sorted = useMemo(() => {
    const folders = files.filter((f) => f.isFolder);
    const regularFiles = files.filter((f) => !f.isFolder);
    return [...folders, ...regularFiles];
  }, [files]);

  function getIcon(file: R2ObjectInfo) {
    if (file.isFolder) {
      return <Folder size={18} className="text-[#339af0] shrink-0" />;
    }
    const ext = getFileExtension(file.key);
    const type = getFileTypeIcon(ext);
    const color = fileTypeColors[type] || fileTypeColors.file;
    return <File size={18} className={`${color} shrink-0`} />;
  }

  function canPreview(file: R2ObjectInfo): boolean {
    if (file.isFolder) return false;
    const ext = getFileExtension(file.key);
    const type = getFileTypeIcon(ext);
    return type === 'image' || type === 'code';
  }

  return (
    <div className="overflow-hidden rounded-2xl glass shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/5 text-left">
              <th className="py-3.5 px-5 text-[#aeaeb2] font-medium text-xs uppercase tracking-wider">名称</th>
              <th className="py-3.5 px-5 text-[#aeaeb2] font-medium text-xs uppercase tracking-wider hidden sm:table-cell">大小</th>
              <th className="py-3.5 px-5 text-[#aeaeb2] font-medium text-xs uppercase tracking-wider hidden md:table-cell">修改时间</th>
              <th className="py-3.5 px-5 text-[#aeaeb2] font-medium text-xs uppercase tracking-wider w-24">操作</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((file, i) => {
              const displayName = getDisplayName(file.key, file.isFolder ? prefix : prefix);
              return (
                <tr
                  key={file.key}
                  className="border-b border-black/[0.03] hover:bg-black/[0.02] transition-colors group"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <td className="py-3 px-5">
                    {file.isFolder ? (
                      <button
                        onClick={() => onNavigate(file.key)}
                        className="flex items-center gap-2.5 text-[#1d1d1f] hover:text-[#339af0] transition-colors font-medium"
                      >
                        {getIcon(file)}
                        <span className="truncate max-w-[280px]">{displayName}</span>
                      </button>
                    ) : (
                      <span className="flex items-center gap-2.5 text-[#3a3a3c]">
                        {getIcon(file)}
                        <span className="truncate max-w-[280px]">{displayName}</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-5 text-[#aeaeb2] hidden sm:table-cell text-xs">
                    {file.isFolder ? '-' : formatFileSize(file.size)}
                  </td>
                  <td className="py-3 px-5 text-[#aeaeb2] hidden md:table-cell text-xs">
                    {file.isFolder ? '-' : formatDate(file.lastModified)}
                  </td>
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {canPreview(file) && (
                        <button
                          onClick={() => onPreview(file)}
                          className="p-1.5 rounded-lg text-[#aeaeb2] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors"
                          title="预览"
                        >
                          <Eye size={15} />
                        </button>
                      )}
                      {!file.isFolder && (
                        <button
                          onClick={() => onDownload(file)}
                          className="p-1.5 rounded-lg text-[#aeaeb2] hover:text-[#1d1d1f] hover:bg-black/5 transition-colors"
                          title="下载"
                        >
                          <Download size={15} />
                        </button>
                      )}
                      {isAuthenticated && (
                        <button
                          onClick={() => onDelete(file)}
                          className="p-1.5 rounded-lg text-[#aeaeb2] hover:text-[#ff3b30] hover:bg-black/5 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}