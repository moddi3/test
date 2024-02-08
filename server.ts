import 'zone.js/node';

import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import bootstrap from './src/main.server';
import { ISRHandler } from '@rx-angular/isr';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  console.log(import.meta.url);
  console.log('fileTourl', fileURLToPath(import.meta.url));
  console.log('dirname', dirname(fileURLToPath(import.meta.url)));

  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  const isr = new ISRHandler({
    indexHtml,
    invalidateSecretToken: '123', // replace with env secret key ex. process.env.REVALIDATE_SECRET_TOKEN
    enableLogging: true,
    serverDistFolder,
    browserDistFolder,
    bootstrap,
    commonEngine,
    buildId: Date.now().toString(),
  });



  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  server.use(express.json());

  server.post(
    '/api/invalidate',
    async (req, res) => {
      console.log('invalidate')
      return await isr.invalidate(req, res);
    }
  );

  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get(
    '*.*',
    express.static(browserDistFolder, {
      maxAge: '1y',
    }),
  );

  server.get(
    '*',
    // Serve page if it exists in cache
    async (req, res, next) => await isr.serveFromCache(req, res, next, {
      modifyCachedHtml: (req, cachedHtml) => {
        return `${cachedHtml}<!-- Hello, I'm a modification to the original cache! -->`;
      }
    }),
    // Server side render the page and add to cache if needed
    async (req, res, next) => {
      console.log('HOST', req.get('host'));
      console.log('HOSTNAME', req.hostname);
      console.log('URL', req.originalUrl);

      console.log('default cache');
      return await isr.render(req, res, next, {
        modifyGeneratedHtml: (req, html) => {
          return `${html}<!-- Hello, I'm modifying the generatedHtml before caching it! ID: ${req.hostname + req.originalUrl}-->`;
        },
      });
    }
  );

  // All regular routes use the Angular engine
  // server.get('*', (req, res, next) => {
  //   const { protocol, originalUrl, baseUrl, headers } = req;

  //   commonEngine
  //     .render({
  //       bootstrap,
  //       documentFilePath: indexHtml,
  //       url: `${protocol}://${headers.host}${originalUrl}`,
  //       publicPath: distFolder,
  //       providers: [{ provide: APP_BASE_HREF, useValue: baseUrl }],
  //     })
  //     .then((html) => res.send(html))
  //     .catch((err) => next(err));
  // });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// // Webpack will replace 'require' with '__webpack_require__'
// // '__non_webpack_require__' is a proxy to Node 'require'
// // The below code is to ensure that the server is run only when not requiring the bundle.
// declare const __non_webpack_require__: NodeRequire;
// const mainModule = __non_webpack_require__.main;
// const moduleFilename = (mainModule && mainModule.filename) || '';
// if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
// }

run();

export default bootstrap;
