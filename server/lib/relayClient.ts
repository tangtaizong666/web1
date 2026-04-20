import { env } from '../config/env';
import { AppError } from './errors';
import { readStoredFile } from './storage';

type RelayContentPart =
  | {
      type: 'text';
      text: string;
    }
  | {
      type: 'image_url';
      image_url: {
        url: string;
      };
    };

type RelayMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string | RelayContentPart[];
};

type RelayChoice = {
  message?: {
    content?: string;
  };
  delta?: {
    content?: string | null;
  };
};

type RelayResponse = {
  choices?: RelayChoice[];
};

type StoredAttachment = {
  kind: 'image' | 'file' | 'audio';
  mimeType: string;
  storagePath: string;
  extractedText: string | null;
  originalName: string;
};

function relayContentToText(content: RelayMessage['content']) {
  if (typeof content === 'string') {
    return content.trim();
  }

  return content
    .filter((part) => part.type === 'text')
    .map((part) => part.text.trim())
    .filter(Boolean)
    .join('\n')
    .trim();
}

function buildFallbackAssistantReply(messages: RelayMessage[]) {
  const latestUserText =
    [...messages]
      .reverse()
      .find((message) => message.role === 'user' && relayContentToText(message.content))?.content ?? '';
  const normalizedText = relayContentToText(latestUserText).replace(/\s+/g, ' ').trim();
  const lowerText = normalizedText.toLowerCase();

  if (!normalizedText) {
    return '当前智能服务暂时未连接，但你可以先告诉我旧衣种类、数量和所在位置，我会继续帮你整理投递建议。';
  }

  if (/(你好|hi|hello|在吗|嗨)/i.test(normalizedText)) {
    return '当前智能服务暂时未连接，我先为你提供基础帮助。你可以继续问我旧衣回收流程、投递点查找、积分估算，或者捐赠前怎么整理衣物。';
  }

  if (/(地图|定位|位置|附近|回收点|回收箱|投递点)/.test(lowerText)) {
    return `当前智能服务暂时未连接，我先给你基础建议。你可以先去回收模块打开地图，输入学校或宿舍位置并点击自动定位，优先选择“可用”的回收点再前往投递。如果你告诉我你现在的大致位置，我也可以继续帮你梳理怎么找最近的点。`;
  }

  if (/(积分|估分|奖励|返利)/.test(lowerText)) {
    return `当前智能服务暂时未连接，我先给你基础建议。旧衣积分通常和衣物重量、材质、完整度有关。像你现在这类情况，可以先把可穿着衣物、可回收织物和明显破损衣物分开，再称一下大概重量，这样后续估分会更准确。`;
  }

  if (/(捐赠| donate |公益|送人)/.test(` ${lowerText} `)) {
    return `当前智能服务暂时未连接，我先给你基础建议。适合捐赠的衣物最好满足“干净、完整、可继续穿着”这三个条件；如果有轻微磨损，建议单独说明或走回收渠道。打包前最好按上衣、裤装、外套分类，投递会更快。`;
  }

  if (/(回收|旧衣|衣服|闲置|整理|清洗|打包)/.test(lowerText)) {
    return `当前智能服务暂时未连接，我先给你基础建议。处理旧衣时可以按这一步来：1. 先筛出还能穿的衣物。2. 清洗并晾干。3. 按上衣、裤装、外套分袋。4. 再去回收模块查看附近可用回收点。如果你愿意，可以继续告诉我衣物种类和数量，我能进一步帮你细化。`;
  }

  return `当前智能服务暂时未连接，我先根据你的问题给一个基础建议：${normalizedText}。如果这和旧衣回收、投递、积分或捐赠有关，你可以把场景再说具体一点，比如“我有多少件衣服、是否干净、想捐赠还是回收、现在在哪个校区”，我就能继续帮你细化。`;
}

async function requestRelayCompletion(messages: RelayMessage[], stream = false) {
  return fetch(`${env.AI_RELAY_BASE_URL}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.AI_RELAY_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.AI_MODEL,
      messages,
      ...(stream ? { stream: true } : {}),
    }),
  });
}

async function readStreamedAssistantReply(response: Response) {
  const rawText = await response.text();
  const contentChunks: string[] = [];

  for (const rawLine of rawText.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line.startsWith('data:')) {
      continue;
    }

    const payload = line.slice(5).trim();

    if (!payload || payload === '[DONE]') {
      continue;
    }

    try {
      const parsedChunk = JSON.parse(payload) as RelayResponse;
      const deltaContent = parsedChunk.choices?.[0]?.delta?.content;

      if (typeof deltaContent === 'string' && deltaContent.length > 0) {
        contentChunks.push(deltaContent);
      }
    } catch {
      // Ignore malformed stream fragments and keep collecting the valid chunks.
    }
  }

  return contentChunks.join('').trim();
}

export async function buildRelayUserContent(
  content: string,
  attachments: StoredAttachment[] = [],
): Promise<string | RelayContentPart[]> {
  const normalizedBaseText = content.trim();
  const textParts = normalizedBaseText ? [normalizedBaseText] : [];

  for (const attachment of attachments) {
    if (attachment.kind === 'file' && attachment.extractedText) {
      textParts.push(`附件文本（${attachment.originalName}）:\n${attachment.extractedText}`);
      continue;
    }

    if (
      attachment.kind === 'audio' &&
      attachment.extractedText &&
      attachment.extractedText.trim() !== normalizedBaseText
    ) {
      textParts.push(`附件转写（${attachment.originalName}）:\n${attachment.extractedText}`);
    }
  }

  const normalizedText = textParts.filter(Boolean).join('\n\n').trim();
  const imageAttachments = attachments.filter((attachment) => attachment.kind === 'image');

  if (imageAttachments.length === 0) {
    return normalizedText;
  }

  const contentParts: RelayContentPart[] = [];

  if (normalizedText) {
    contentParts.push({ type: 'text', text: normalizedText });
  }

  for (const attachment of imageAttachments) {
    const fileBuffer = await readStoredFile(attachment.storagePath);
    const dataUrl = `data:${attachment.mimeType};base64,${fileBuffer.toString('base64')}`;
    contentParts.push({
      type: 'image_url',
      image_url: {
        url: dataUrl,
      },
    });
  }

  return contentParts;
}

export async function generateAssistantReply(messages: RelayMessage[]) {
  const allowFallback = env.NODE_ENV !== 'production' || env.AI_RELAY_API_KEY === 'development-key';

  try {
    const response = await requestRelayCompletion(messages);

    if (!response.ok) {
      if (allowFallback) {
        return buildFallbackAssistantReply(messages);
      }

      throw new AppError(502, 'AI 服务暂时不可用，请稍后再试');
    }

    const data = (await response.json()) as RelayResponse;
    const content = data.choices?.[0]?.message?.content?.trim();

    if (content) {
      return content;
    }

    const streamedResponse = await requestRelayCompletion(messages, true);

    if (streamedResponse.ok) {
      const streamedContent = await readStreamedAssistantReply(streamedResponse);

      if (streamedContent) {
        return streamedContent;
      }
    }

    if (allowFallback) {
      return buildFallbackAssistantReply(messages);
    }

    throw new AppError(502, 'AI 服务暂时不可用，请稍后再试');
  } catch (error) {
    if (allowFallback) {
      console.warn('[ai] Relay unavailable, using local fallback reply.');
      return buildFallbackAssistantReply(messages);
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(502, 'AI 服务暂时不可用，请稍后再试');
  }
}

export type { RelayContentPart, RelayMessage, StoredAttachment };
