import { Application, Request, Response } from 'express';

export default function (app: Application): void {
  app.post('/sign-out', (req: Request, res: Response) => {
    req.session.destroy(err => {
      if (err) {
        console.error('[sign-out] session destroy failed', err);
        res.status(500).send('Could not sign out');
        return;
      }
      res.redirect(303, '/welcome');
    });
  });
}
