import 'zone.js/dist/zone-node';

import { ngExpressEngine } from '@nguniversal/express-engine';
import * as express from 'express';
import { existsSync } from 'fs';
import { join } from 'path';

import { ISRHandler } from 'ngx-isr';
import { RedisCacheHandler } from './redis-chache-handler';
import bootstrap from './src/main.server';

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/contstructor-with-isr/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? 'index.original.html'
    : 'index';


  //  const INVALIDATE_TOKEN = process.env['INVALIDATE_TOKEN'] || '';

  //  Step 0 (optional): Create FileSystemCacheHandler with required options.
  //  const fsCacheHandler = new FileSystemCacheHandler({
  //    cacheFolderPath: join(distFolder, '/cache'),
  //    prerenderedPagesPath: distFolder,
  //    addPrerenderedPagesToCache: true,
  //  });


  const REDIS_CONNECTION_STRING =
    'redis://default:0cfbecce38c7400c973e2056e805562b@sterling-tomcat-33150.upstash.io:33150';
  const redisCacheHandler = REDIS_CONNECTION_STRING
    ? new RedisCacheHandler({ connectionString: REDIS_CONNECTION_STRING, })
    : undefined;

  const isr = new ISRHandler({
    // cache:fsCacheHandler
    cache:redisCacheHandler,
    indexHtml,
    invalidateSecretToken: "123", // replace with env secret key ex. process.env.REVALIDATE_SECRET_TOKEN
    enableLogging: true,
    // buildId: '123',
  });
  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/main/modules/express-engine)
  server.engine(
    'html',
    ngExpressEngine({
      bootstrap,
    })
  );

  server.set('view engine', 'html');
  server.set('views', distFolder);

  server.use(express.json());
  server.post(
    '/api/invalidate',
    async (req, res) => await isr.invalidate(req, res)
  );
  // Example Express Rest API endpoints
  // server.get('/api/**', (req, res) => { });
  // Serve static files from /browser
  server.get(
    '*.*',
    express.static(distFolder, {
      maxAge: '1y',
    })
  );

  // All regular routes use the Universal engine
  // server.get('*', (req, res) => {
  //   res.render(indexHtml, {
  //     req,
  //     providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }],
  //   });
  // });

  server.get(
    '*',
    // Serve page if it exists in cache
    async (req, res, next) =>
      await isr.serveFromCache(req, res, next, {
        modifyCachedHtml: (req, cachedHtml) => {
          return `${cachedHtml}<!-- Hello, I'm a modification to the original cache! -->`;
        },
      }),
    // Server side render the page and add to cache if needed
    async (req, res, next) =>
      {
        // console.log('setting prefix', req.get('host'))
        // if (
        //   req.get('host') === '570c-188-163-20-2.ngrok-free.app'
        // ) {
        // console.log('setting prefix', req.get('host'));

          RedisCacheHandler.prefix = req.get('host')!;
          return await isr.render(req, res, next);
        // }
        console.log('default cache')
        return await isr.render(req, res, next, {
          modifyGeneratedHtml: (req, html) => {
            return `${html}<!-- Hello, I'm modifying the generatedHtml before caching it! -->`;
          },
        });
      }
  );

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

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = (mainModule && mainModule.filename) || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export default bootstrap;
