import { Application } from 'express';

export default function (app: Application): void {
  app.get('/', (req, res) => {
    if (req.session?.actorName) {
      res.redirect('/tasks');
    } else {
      res.redirect('/welcome');
    }
  });
}
