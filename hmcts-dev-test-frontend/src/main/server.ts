#!/usr/bin/env node
import 'dotenv/config';

import * as fs from 'fs';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';

import { app } from './app';

let listeningServer: http.Server | https.Server | null = null;

// used by shutdownCheck in readinessChecks
app.locals.shutdown = false;

// TODO: set the right port for your application
const port: number = parseInt(process.env.PORT || '3100', 10);

const useHttpInDev =
  process.env.DEV_USE_HTTP === 'true' || process.env.DEV_USE_HTTP === '1';

if (app.locals.ENV === 'development' && useHttpInDev) {
  listeningServer = app.listen(port, () => {
    console.log(`Application started: http://localhost:${port}`);
  });
} else if (app.locals.ENV === 'development') {
  const sslDirectory = path.join(__dirname, 'resources', 'localhost-ssl');
  const sslOptions = {
    cert: fs.readFileSync(path.join(sslDirectory, 'localhost.crt')),
    key: fs.readFileSync(path.join(sslDirectory, 'localhost.key')),
  };
  listeningServer = https.createServer(sslOptions, app);
  listeningServer.listen(port, () => {
    console.log(`Application started: https://localhost:${port}`);
  });
} else {
  listeningServer = app.listen(port, () => {
    console.log(`Application started: http://localhost:${port}`);
  });
}

function gracefulShutdownHandler(signal: string) {
  console.log(`⚠️ Caught ${signal}, gracefully shutting down. Setting readiness to DOWN`);
  // stop the server from accepting new connections
  app.locals.shutdown = true;

  setTimeout(() => {
    console.log('Shutting down application');
    listeningServer?.close(() => {
      console.log('HTTP(S) server closed');
    });
  }, 4000);
}

process.on('SIGINT', gracefulShutdownHandler);
process.on('SIGTERM', gracefulShutdownHandler);
