import { Router } from 'express';
import { z } from 'zod';
import { authRequired } from '../middleware/authRequired';
import { AppError } from '../lib/errors';
import { buildRelayUserContent, generateAssistantReply } from '../lib/relayClient';
import { verifyAttachmentToken } from '../lib/uploads';
import {
  buildConversationTitle,
  findConversationById,
  touchConversation,
  updateConversationTitle,
} from '../repositories/conversations';
import { createAttachment, listAttachmentsByMessageIds } from '../repositories/attachments';
import { createMessage, listMessages } from '../repositories/messages';

const attachmentSchema = z.object({
  token: z.string().min(1),
});

const sendMessageSchema = z.object({
  content: z.string().trim().default(''),
  attachments: z.array(attachmentSchema).default([]),
});

type MessageAttachmentInput = {
  token: string;
};

type SendMessageInput = {
  content: string;
  attachments: MessageAttachmentInput[];
};

function normalizeAttachment(attachment: {
  id?: string;
  kind: 'image' | 'file' | 'audio';
  original_name?: string;
  originalName?: string;
  mime_type?: string;
  mimeType?: string;
  size_bytes?: number;
  sizeBytes?: number;
  storage_path?: string;
  storagePath?: string;
  extracted_text?: string | null;
  extractedText?: string | null;
  created_at?: string;
}) {
  return {
    id: attachment.id ?? attachment.storage_path ?? attachment.storagePath ?? '',
    kind: attachment.kind,
    originalName: attachment.original_name ?? attachment.originalName ?? '',
    mimeType: attachment.mime_type ?? attachment.mimeType ?? '',
    sizeBytes: attachment.size_bytes ?? attachment.sizeBytes ?? 0,
    storagePath: attachment.storage_path ?? attachment.storagePath ?? '',
    extractedText: attachment.extracted_text ?? attachment.extractedText ?? null,
    created_at: attachment.created_at,
  };
}

function verifyAttachments(attachments: MessageAttachmentInput[], userId: string) {
  return attachments.map((attachment) =>
    normalizeAttachment(verifyAttachmentToken(attachment.token, userId)),
  );
}

async function hydrateMessagesWithAttachments(
  messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
  }>,
) {
  const attachments = await listAttachmentsByMessageIds(messages.map((message) => message.id));
  const attachmentsByMessageId = new Map<string, ReturnType<typeof normalizeAttachment>[]>();

  for (const attachment of attachments) {
    const current = attachmentsByMessageId.get(attachment.message_id) ?? [];
    current.push(normalizeAttachment(attachment));
    attachmentsByMessageId.set(attachment.message_id, current);
  }

  return messages.map((message) => ({
    ...message,
    attachments: attachmentsByMessageId.get(message.id) ?? [],
  }));
}

function resolveUserMessageContent(
  content: string,
  attachments: Array<ReturnType<typeof normalizeAttachment>>,
) {
  const trimmedContent = content.trim();

  if (trimmedContent) {
    return trimmedContent;
  }

  const audioTranscript = attachments.find(
    (attachment) => attachment.kind === 'audio' && attachment.extractedText?.trim(),
  )?.extractedText;

  return audioTranscript?.trim() ?? '';
}

export const messagesRouter = Router();

messagesRouter.use(authRequired);

messagesRouter.get('/conversations/:id/messages', async (request, response, next) => {
  try {
    const conversation = await findConversationById(request.params.id);

    if (!conversation || conversation.user_id !== request.authUserId) {
      throw new AppError(404, 'Conversation not found');
    }

    const messages = await listMessages(conversation.id);
    response.json({ messages: await hydrateMessagesWithAttachments(messages) });
  } catch (error) {
    next(error);
  }
});

messagesRouter.post('/conversations/:id/messages', async (request, response, next) => {
  try {
    const conversation = await findConversationById(request.params.id);

    if (!conversation || conversation.user_id !== request.authUserId) {
      throw new AppError(404, 'Conversation not found');
    }

    const { content, attachments } = sendMessageSchema.parse(request.body) as SendMessageInput;
    const verifiedAttachments = verifyAttachments(attachments, request.authUserId);
    const userContent = resolveUserMessageContent(content, verifiedAttachments);

    if (!userContent) {
      throw new AppError(400, 'Message content is required');
    }

    const existingMessages = await listMessages(conversation.id);
    const userMessage = await createMessage(conversation.id, 'user', userContent);

    await Promise.all(
      verifiedAttachments.map((attachment) =>
        createAttachment(
          userMessage.id,
          attachment.kind,
          attachment.originalName,
          attachment.mimeType,
          attachment.sizeBytes,
          attachment.storagePath,
          attachment.extractedText,
        ),
      ),
    );

    const normalizedAttachments = verifiedAttachments;

    if (existingMessages.length === 0 && conversation.title === '新对话') {
      await updateConversationTitle(conversation.id, buildConversationTitle(userContent));
    }

    const relayMessages = [
      {
        role: 'system' as const,
        content: '你是校园旧衣循环平台的 AI 助手，回答应简洁、友好、对环保主题有帮助。',
      },
      ...existingMessages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        role: 'user' as const,
        content: await buildRelayUserContent(userContent, normalizedAttachments),
      },
    ];

    const assistantContent = await generateAssistantReply(relayMessages);
    const assistantMessage = await createMessage(conversation.id, 'assistant', assistantContent);

    await touchConversation(conversation.id);

    response.status(201).json({
      userMessage: {
        ...userMessage,
        attachments: normalizedAttachments,
      },
      assistantMessage: {
        ...assistantMessage,
        attachments: [],
      },
    });
  } catch (error) {
    next(error);
  }
});
