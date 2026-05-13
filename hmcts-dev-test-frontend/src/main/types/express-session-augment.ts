import 'express-session';

declare module 'express-session' {
  interface SessionData {
    actorName: string;
  }
}

export {};
