import { useRef, useState } from 'react';
import type { PendingAttachment } from '../../types/chat';
import { AttachmentPreview } from './AttachmentPreview';

const uploadOptions = [
  { label: '文件', accept: 'text/plain' },
  { label: '图片', accept: 'image/png,image/jpeg,image/webp' },
  { label: '语音', accept: 'audio/mpeg,audio/wav,audio/webm' },
] as const;

export function ChatComposer({
  sending,
  attachments,
  uploadsEnabled,
  uploadHelperText,
  onUpload,
  onRemoveAttachment,
  onSubmit,
}: {
  sending: boolean;
  attachments: PendingAttachment[];
  uploadsEnabled: boolean;
  uploadHelperText?: string;
  onUpload: (file: File) => Promise<void>;
  onRemoveAttachment: (attachmentId: string) => void;
  onSubmit: (content: string) => Promise<void>;
}) {
  const [content, setContent] = useState('');
  const [fileAccept, setFileAccept] = useState(uploadOptions[0].accept);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const trimmedContent = content.trim();
  const canSubmit = Boolean(trimmedContent || attachments.length > 0);

  function openUploadPicker(accept: string) {
    setFileAccept(accept);
    fileInputRef.current?.click();
  }

  return (
    <div className="min-w-0 border-t border-[#E0D5C1]/70 bg-[#F6F1E5]/60 px-3 py-2.5 backdrop-blur-md md:px-4 md:py-3">
      <div className="mx-auto w-full max-w-4xl min-w-0 rounded-[1.5rem] border border-[#E0D5C1] bg-white/85 px-3 py-2.5 shadow-[0_15px_40px_rgba(120,95,60,0.12)] md:rounded-[2rem] md:px-4">
        <AttachmentPreview attachments={attachments} onRemove={onRemoveAttachment} />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="给 AI 智能环保助手发送消息..."
          className="min-h-[52px] w-full resize-none bg-transparent text-[15px] leading-6 text-[#362A1F] outline-none placeholder:text-[#B3A38D]"
        />
        <div className="mt-1.5 flex min-w-0 flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center md:flex md:flex-row md:flex-wrap md:justify-between md:gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={fileAccept}
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void onUpload(file);
                }
                event.currentTarget.value = '';
              }}
            />
            {uploadOptions.map((option) => (
              <button
                key={option.label}
                type="button"
                disabled={!uploadsEnabled}
                onClick={() => openUploadPicker(option.accept)}
                className="rounded-full border border-[#DECFBE] px-2.5 py-1.5 text-xs text-[#986E4B] transition-colors hover:bg-[#986E4B]/10 disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm"
              >
                {option.label}
              </button>
            ))}
          </div>
          {uploadHelperText ? (
            <div className="hidden min-w-0 flex-1 text-xs text-[#8A7866] md:block">{uploadHelperText}</div>
          ) : null}
          <button
            disabled={sending || !canSubmit}
            onClick={() => {
              if (!canSubmit) {
                return;
              }
              const nextContent = trimmedContent;
              setContent('');
              void (async () => {
                try {
                  await onSubmit(nextContent);
                } catch {
                  // Errors are rendered by the page message area; restore the draft so the user can retry.
                  setContent(nextContent);
                }
              })();
            }}
            className="w-full shrink-0 rounded-full bg-[#986E4B] px-4 py-2 text-sm text-white transition-colors hover:bg-[#86603F] disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto sm:w-auto"
          >
            {sending ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}
