import fastify from 'fastify';
import fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { config } from './config/config';
import { logger } from './utils/logger';
import { db } from './config/database';
// // import { serviceContainer } from './services/service-container';
import { healthRoutes } from './routes/health.routes';
import { surveysRoutes } from './routes/surveys.routes';
import { questionsRoutes } from './routes/questions.routes';
import { responsesRoutes } from './routes/responses.routes';
import { analyticsRoutes } from './routes/analytics.routes';
import { operationsRoutes } from './routes/operations.routes';
import { loggingMiddleware } from './middleware/logging';
import { errorHandler } from './middleware/errorHandler';

const server = fastify({
  logger: true,
});

async function buildServer(): Promise<typeof server> {
  // Security middleware
  await server.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  // CORS
  await server.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
  });

  // Rate limiting
  await server.register(rateLimit, {
    max: 100,
    timeWindow: '15 minutes',
  });

  // Swagger documentation
  await server.register(swagger, {
    swagger: {
      info: {
        title: 'Organization Survey API',
        description: 'API for anonymous employee engagement surveys',
        version: '1.0.0',
      },
      externalDocs: {
        url: 'https://swagger.io',
        description: 'Find more info here',
      },
      host: `localhost:${config.port}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'health', description: 'Health check endpoints' },
        { name: 'surveys', description: 'Survey management endpoints' },
        { name: 'responses', description: 'Survey response endpoints' },
        { name: 'analytics', description: 'Analytics endpoints' },
      ],
    },
  });

  await server.register(swaggerUI, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
  });

  // Global middleware
  server.addHook('onRequest', loggingMiddleware);

  // Error handler
  server.setErrorHandler(errorHandler);

  // Register routes
  await server.register(healthRoutes, { prefix: '/api' });
  await server.register(surveysRoutes, { prefix: '/api' });
  await server.register(operationsRoutes, { prefix: '/api' });
  await server.register(questionsRoutes, { prefix: '/api' });
  await server.register(responsesRoutes, { prefix: '/api' });
  // await server.register(analyticsRoutes, { prefix: '/api' });

  return server;
}

async function start(): Promise<void> {
  try {
    // Initialize service container
    // await serviceContainer.initialize();
    // logger.info('Service container initialized successfully');

    // Test database connection
    const dbConnected = await db.testConnection();
    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    const app = await buildServer();

    await app.listen({
      port: config.port,
      host: '0.0.0.0',
    });

    logger.info(`Server listening on http://0.0.0.0:${config.port}`);
    logger.info(`API Documentation available at http://localhost:${config.port}/documentation`);
  } catch (error) {
    logger.error(error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  void (async () => {
    logger.info('SIGTERM received, shutting down gracefully');
    await server.close();
    // await serviceContainer.shutdown();
    process.exit(0);
  })();
});

process.on('SIGINT', () => {
  void (async () => {
    logger.info('SIGINT received, shutting down gracefully');
    await server.close();
    // await serviceContainer.shutdown();
    process.exit(0);
  })();
});

void start();
