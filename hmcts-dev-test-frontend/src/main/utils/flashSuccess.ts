import { Request } from 'express';

export function setSuccessFlash(req: Request, message: string): void {
  req.session.successMessage = message;
}

export function consumeSuccessFlash(req: Request): string | undefined {
  const message = req.session.successMessage;
  delete req.session.successMessage;
  return message;
}

export function setErrorFlash(req: Request, message: string): void {
  req.session.flashError = message;
}

export function consumeErrorFlash(req: Request): string | undefined {
  const message = req.session.flashError;
  delete req.session.flashError;
  return message;
}
