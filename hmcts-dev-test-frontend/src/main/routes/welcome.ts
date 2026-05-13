import { Application } from 'express';

import { formatActorName } from '../utils/formatActorName';

export default function (app: Application): void {
  app.get('/welcome', (req, res) => {
    if (req.session?.actorName) {
      res.redirect('/tasks');
      return;
    }
    res.render('welcome', { errors: [] });
  });

  app.post('/welcome', (req, res) => {
    const name = (req.body.actorName || '').trim();

    if (!name) {
      res.render('welcome', {
        errors: [{ text: 'Enter your name to continue' }],
        value: name,
      });
      return;
    }

    if (name.length > 100) {
      res.render('welcome', {
        errors: [{ text: 'Name must be 100 characters or fewer' }],
        value: name,
      });
      return;
    }

    req.session.actorName = formatActorName(name);
    res.redirect('/tasks');
  });
}
