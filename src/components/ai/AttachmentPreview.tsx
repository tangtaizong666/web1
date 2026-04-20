import type { PendingAttachment } from '../../types/chat';

export function AttachmentPreview({
  attachments,
  onRemove,
}: {
  attachments: PendingAttachment[];
  onRemove: (attachmentId: string) => void;
}) {
  if (attachments.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {attachments.map((attachment) => (
        <div
          key={attachment.id}
          className="flex items-center gap-2 rounded-full border border-[#DECFBE] bg-[#F4F0E8] px-3 py-1.5 text-xs text-[#4A3D30]"
        >
          <span>{attachment.originalName}</span>
          <button onClick={() => onRemove(attachment.id)} className="text-[#986E4B]">
            移除
          </button>
        </div>
      ))}
    </div>
  );
}
