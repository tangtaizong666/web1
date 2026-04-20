import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../lib/errors';

export function errorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  void _next;

  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: error.message });
    return;
  }

  console.error(error);
  response.status(500).json({ error: 'Internal Server Error' });
}
