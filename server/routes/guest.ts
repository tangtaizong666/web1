import { Router } from 'express';
import { ZodError, z } from 'zod';
import { AppError } from '../lib/errors';
import { generateAssistantReply } from '../lib/relayClient';
import type { RelayMessage } from '../lib/relayClient';

const guestMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1),
});

const guestChatSchema = z.object({
  messages: z.array(guestMessageSchema).min(1).max(40),
});

export const guestRouter = Router();

guestRouter.post('/messages', async (request, response, next) => {
  try {
    const { messages } = guestChatSchema.parse(request.body);
    const latestMessage = messages[messages.length - 1];

    if (latestMessage.role !== 'user') {
      throw new AppError(400, 'Last message must come from the user');
    }

    const relayMessages: RelayMessage[] = [
      {
        role: 'system',
        content: '你是校园旧衣循环平台的 AI 助手，回答应简洁、友好、对环保主题有帮助。',
      },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    const assistantContent = await generateAssistantReply(relayMessages);

    response.status(201).json({
      assistantMessage: {
        id: `guest-assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
        created_at: new Date().toISOString(),
        attachments: [],
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      next(new AppError(400, 'Invalid guest chat payload'));
      return;
    }

    next(error);
  }
});
