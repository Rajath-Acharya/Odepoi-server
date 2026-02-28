// Import environment configuration FIRST before any other imports
import './config/env';

import Fastify from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import fastifyCookie from '@fastify/cookie';
import fastifyMultipart from '@fastify/multipart';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { connectToDatabase } from './lib/db';
import authRoutes from './routes/auth';
import filesRoutes from './routes/files';
import postsRoutes from './routes/posts';
import { errorHandler } from './middlewares/errorHandler';
import logger from './lib/logger';
import * as Sentry from '@sentry/node';
import './lib/sentry';

const clientUrl = process.env.CLIENT_URL || 'http://localhost:8081';

export default async function buildApp() {
  const app = Fastify({ logger: false, bodyLimit: 1048576 });

  Sentry.setupFastifyErrorHandler(app);

  app.addHook('onRequest', (request, _reply, done) => {
    const msg = `${request.method} ${request.url}`;
    logger.http(msg);
    done();
  });

  await app.register(fastifyHelmet, { global: true });
  await app.register(fastifyCors, {
    origin: clientUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  });
  await app.register(fastifyCookie);
  await app.register(fastifyMultipart, {
    limits: { fileSize: 6 * 1024 * 1024 },
  });

  await app.register(fastifySwagger, {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Odepoi Server API',
        version: '1.0.0',
        description: 'API documentation for the Odepoi server',
      },
      servers: [{ url: '/api/v1' }, { url: '/' }],
    },
  });
  await app.register(fastifySwaggerUi, {
    routePrefix: '/api-docs',
    uiConfig: { docExpansion: 'list', deepLinking: true },
  });

  app.setErrorHandler(errorHandler);

  app.get('/ping', async () => 'pong');

  app.get('/health', async (_request, reply) => {
    try {
      await connectToDatabase();
      return reply.send({ status: 'ok' });
    } catch (err) {
      logger.error(`Health check failed: ${err}`);
      return reply.status(500).send({ status: 'error' });
    }
  });

  app.get('/debug-sentry', function mainHandler(req, res) {
    // Send a log before throwing the error
    Sentry.logger.info('User triggered test error', {
      action: 'test_error_endpoint',
    });
    // Send a test metric before throwing the error
    Sentry.metrics.count('test_counter', 1);
    throw new Error('My first Sentry error!');
  });

  await app.register(authRoutes, { prefix: '/api/v1/auth' });
  await app.register(filesRoutes, { prefix: '/api/v1/files' });
  await app.register(postsRoutes, { prefix: '/api/v1/posts' });

  return app;
}
