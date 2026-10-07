import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if ((err as { name?: string }).name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  if ((err as { code?: number }).code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry',
    });
  }

  console.error(err);

  return res.status(500).json({
    success: false,
    message: env.nodeEnv === 'production' ? 'Internal server error' : err.message,
  });
}

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'Route not found' });
}
