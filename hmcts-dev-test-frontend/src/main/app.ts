import * as path from 'path';

import './types/express-session-augment';
import { HTTPError } from './HttpError';
import { Nunjucks } from './modules/nunjucks';

import * as bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import express from 'express';
import { glob } from 'glob';
import favicon from 'serve-favicon';
import session from 'express-session';

const { setupDev } = require('./development');

const env = process.env.NODE_ENV || 'development';
const developmentMode = env === 'development';

export const app = express();
app.locals.ENV = env;

new Nunjucks(developmentMode).enableFor(app);

app.use(favicon(path.join(__dirname, '/public/assets/images/favicon.ico')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
// In development, webpack assets must be registered before static files, otherwise
// stale public/main-dev.css and main-dev.js are served and override the in-memory build.
setupDev(app, developmentMode);
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate, no-store');
  next();
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'hmcts-task-manager-secret-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true },
  })
);

app.use((req, res, next) => {
  res.locals.actorName = req.session.actorName;
  next();
});

glob
  .sync(__dirname + '/routes/**/*.+(ts|js)')
  .map(filename => require(filename))
  .forEach(route => route.default(app));

// error handler - must have all 4 parameters for Express to treat it as an error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HTTPError, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Express error handler]', err.message || err);
  res.locals.message = err.message;
  res.locals.error = env === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});
