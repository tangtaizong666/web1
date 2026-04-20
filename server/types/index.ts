export type UserRecord = {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
};

export type ConversationRecord = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
};

export type MessageRole = 'user' | 'assistant';

export type MessageRecord = {
  id: string;
  conversation_id: string;
  role: MessageRole;
  content: string;
  created_at: string;
};

export type AttachmentKind = 'image' | 'file' | 'audio';

export type AttachmentRecord = {
  id: string;
  message_id: string;
  kind: AttachmentKind;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  storage_path: string;
  extracted_text: string | null;
  created_at: string;
};
