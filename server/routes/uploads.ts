import { Router } from 'express';
import type { Request } from 'express';
import { authRequired } from '../middleware/authRequired';
import { createAttachmentToken, detectAttachmentKind, upload } from '../lib/uploads';
import { saveUploadedBuffer } from '../lib/storage';
import { transcribeAudio } from '../lib/transcription';

type UploadFile = {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
};

async function extractReadableText(file: UploadFile, kind: ReturnType<typeof detectAttachmentKind>) {
  if (kind === 'audio') {
    return null;
  }

  if (file.mimetype === 'text/plain') {
    return file.buffer.toString('utf-8');
  }

  return null;
}

export const uploadsRouter = Router();

uploadsRouter.use(authRequired);

uploadsRouter.post('/', upload.single('file'), async (request, response, next) => {
  try {
    const uploadRequest = request as Request & { file?: UploadFile };

    if (!uploadRequest.file) {
      response.status(400).json({ error: 'File is required' });
      return;
    }

    const kind = detectAttachmentKind(uploadRequest.file.mimetype);
    const storagePath = await saveUploadedBuffer(uploadRequest.file.originalname, uploadRequest.file.buffer);
    const extractedText =
      kind === 'audio'
        ? await transcribeAudio(storagePath)
        : await extractReadableText(uploadRequest.file, kind);

    const attachment = {
      id: storagePath,
      kind,
      originalName: uploadRequest.file.originalname,
      mimeType: uploadRequest.file.mimetype,
      sizeBytes: uploadRequest.file.size,
      storagePath,
      extractedText,
    };
    const token = createAttachmentToken({
      userId: request.authUserId,
      kind: attachment.kind,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType,
      sizeBytes: attachment.sizeBytes,
      storagePath: attachment.storagePath,
      extractedText: attachment.extractedText,
    });

    response.status(201).json({
      attachment: {
        ...attachment,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
});
