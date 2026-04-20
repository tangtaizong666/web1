export type Conversation = {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

export type MessageAttachment = {
  id: string;
  originalName: string;
  mimeType: string;
  kind: 'image' | 'file' | 'audio';
  storagePath: string;
  extractedText: string | null;
  sizeBytes: number;
  created_at?: string;
};

export type PendingAttachment = {
  id: string;
  originalName: string;
  mimeType: string;
  kind: 'image' | 'file' | 'audio';
  storagePath: string;
  extractedText: string | null;
  sizeBytes: number;
  token: string;
};

export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  attachments: MessageAttachment[];
};
