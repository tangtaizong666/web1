import { Router } from 'express';
import { ZodError, z } from 'zod';
import { authRequired } from '../middleware/authRequired';
import { AppError } from '../lib/errors';
import {
  buildConversationTitle,
  createConversation,
  findBlankConversation,
  findConversationById,
  listConversations,
  touchConversationAt,
} from '../repositories/conversations';
import { createMessage } from '../repositories/messages';

export const conversationsRouter = Router();

conversationsRouter.use(authRequired);

const importedMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1),
  created_at: z.string().datetime().optional(),
});

const importConversationsSchema = z.object({
  conversations: z.array(
    z.object({
      title: z.string().trim().default('新对话'),
      messages: z.array(importedMessageSchema).default([]),
    }),
  ),
});

conversationsRouter.get('/', async (request, response, next) => {
  try {
    const conversations = await listConversations(request.authUserId!);
    response.json({ conversations });
  } catch (error) {
    next(error);
  }
});

conversationsRouter.post('/', async (request, response, next) => {
  try {
    const existingBlankConversation = await findBlankConversation(request.authUserId!);

    if (existingBlankConversation) {
      response.status(200).json({
        conversation: existingBlankConversation,
        created: false,
        message: '当前已经有一个空白新对话了，已为你切换过去。',
      });
      return;
    }

    const conversation = await createConversation(request.authUserId!);
    response.status(201).json({ conversation, created: true });
  } catch (error) {
    next(error);
  }
});

conversationsRouter.post('/import', async (request, response, next) => {
  try {
    const payload = importConversationsSchema.parse(request.body);
    let importedCount = 0;

    for (const importedConversation of payload.conversations) {
      const normalizedMessages = importedConversation.messages.filter((message) => message.content.trim().length > 0);

      if (normalizedMessages.length === 0) {
        continue;
      }

      const firstUserMessage = normalizedMessages.find((message) => message.role === 'user')?.content ?? '';
      const title =
        importedConversation.title === '新对话'
          ? buildConversationTitle(firstUserMessage)
          : importedConversation.title;
      const conversation = await createConversation(request.authUserId!, title);

      for (const message of normalizedMessages) {
        await createMessage(conversation.id, message.role, message.content, message.created_at);
      }

      const lastMessageTimestamp =
        normalizedMessages[normalizedMessages.length - 1]?.created_at ?? new Date().toISOString();
      await touchConversationAt(conversation.id, lastMessageTimestamp);
      importedCount += 1;
    }

    response.status(201).json({ importedCount });
  } catch (error) {
    if (error instanceof ZodError) {
      next(new AppError(400, 'Invalid conversation import payload'));
      return;
    }

    next(error);
  }
});

conversationsRouter.get('/:id', async (request, response, next) => {
  try {
    const conversation = await findConversationById(request.params.id);

    if (!conversation || conversation.user_id !== request.authUserId) {
      throw new AppError(404, 'Conversation not found');
    }

    response.json({ conversation });
  } catch (error) {
    next(error);
  }
});
