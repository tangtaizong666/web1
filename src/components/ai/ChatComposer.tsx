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
    <div className="border-t border-[#DECFBE] bg-[#FDFBF7] px-4 py-2.5">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-[#DECFBE] bg-white px-4 py-2.5 shadow-sm">
        <AttachmentPreview attachments={attachments} onRemove={onRemoveAttachment} />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="给 AI 智能环保助手发送消息..."
          className="min-h-[52px] w-full resize-none bg-transparent text-[15px] leading-6 outline-none"
        />
        <div className="mt-1.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
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
                className="rounded-full border border-[#DECFBE] px-3 py-1.5 text-sm text-[#986E4B] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {option.label}
              </button>
            ))}
          </div>
          {uploadHelperText ? (
            <div className="hidden text-xs text-[#7F6B58] md:block">{uploadHelperText}</div>
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
            className="rounded-full bg-[#986E4B] px-4 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sending ? '发送中...' : '发送'}
          </button>
        </div>
      </div>
    </div>
  );
}
