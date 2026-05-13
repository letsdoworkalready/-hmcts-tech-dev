import { Request, Response, NextFunction } from 'express';

export function requireActor(req: Request, res: Response, next: NextFunction): void {
  if (!req.session?.actorName) {
    res.redirect('/welcome');
    return;
  }
  res.locals.actorName = req.session.actorName;
  next();
}
