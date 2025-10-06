import { ConnectionPool, createOptimizedPoolConfig } from '../database/connection-pool';
import { ResponseService } from './response.service';
import { SessionService } from './session.service';
import { AnalyticsService } from './analytics.service';
import { CacheManager } from './cache-manager';
// TODO: Fix ReportService dependencies (puppeteer, exceljs)
// import { ReportService } from './report.service';
import { logger } from '../utils/logger';

/**
 * Service container for dependency injection and service management
 */
export class ServiceContainer {
  private static instance: ServiceContainer;
  private connectionPool!: ConnectionPool;
  private cacheManager!: CacheManager;
  private responseService!: ResponseService;
  private sessionService!: SessionService;
  private analyticsService!: AnalyticsService;
  // private reportService!: ReportService;
  private isInitialized = false;

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ServiceContainer {
    if (!ServiceContainer.instance) {
      ServiceContainer.instance = new ServiceContainer();
    }
    return ServiceContainer.instance;
  }

  /**
   * Initialize all services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      logger.info('Initializing service container...');

      // Initialize database connection pool
      const poolConfig = createOptimizedPoolConfig();
      this.connectionPool = new ConnectionPool(poolConfig);

      // Test database connection
      const isHealthy = await this.connectionPool.isHealthy();
      if (!isHealthy) {
        throw new Error('Database connection failed');
      }

      // Initialize services
      this.cacheManager = new CacheManager(this.connectionPool);
      this.sessionService = new SessionService(this.connectionPool);
      this.responseService = new ResponseService({
        pool: this.connectionPool,
      });
      this.analyticsService = new AnalyticsService(this.connectionPool, this.cacheManager);
      // TODO: Fix ReportService dependencies (puppeteer, exceljs)
      // this.reportService = new ReportService(this.connectionPool);

      this.isInitialized = true;
      logger.info('Service container initialized successfully');

    } catch (error) {
      logger.error('Failed to initialize service container', { error });
      throw error;
    }
  }

  /**
   * Get connection pool
   */
  getConnectionPool(): ConnectionPool {
    this.ensureInitialized();
    return this.connectionPool;
  }

  /**
   * Get response service
   */
  getResponseService(): ResponseService {
    this.ensureInitialized();
    return this.responseService;
  }

  /**
   * Get session service
   */
  getSessionService(): SessionService {
    this.ensureInitialized();
    return this.sessionService;
  }

  /**
   * Get cache manager
   */
  getCacheManager(): CacheManager {
    this.ensureInitialized();
    return this.cacheManager;
  }

  /**
   * Get analytics service
   */
  getAnalyticsService(): AnalyticsService {
    this.ensureInitialized();
    return this.analyticsService;
  }

  /**
   * Get report service
   */
  // TODO: Fix ReportService dependencies (puppeteer, exceljs)
  // getReportService(): ReportService {
  //   this.ensureInitialized();
  //   return this.reportService;
  // }

  /**
   * Graceful shutdown of all services
   */
  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      logger.info('Shutting down service container...');

      // Shutdown connection pool
      if (this.connectionPool) {
        await this.connectionPool.gracefulShutdown();
      }

      this.isInitialized = false;
      logger.info('Service container shutdown completed');

    } catch (error) {
      logger.error('Error during service container shutdown', { error });
      throw error;
    }
  }

  /**
   * Health check for all services
   */
  async healthCheck(): Promise<{
    database: boolean;
    services: boolean;
    overall: boolean;
  }> {
    try {
      const databaseHealthy = this.connectionPool ? await this.connectionPool.isHealthy() : false;
      const servicesHealthy = this.isInitialized && !!this.responseService && !!this.sessionService && !!this.analyticsService && !!this.cacheManager;

      return {
        database: databaseHealthy,
        services: servicesHealthy,
        overall: databaseHealthy && servicesHealthy,
      };

    } catch (error) {
      logger.error('Health check failed', { error });
      return {
        database: false,
        services: false,
        overall: false,
      };
    }
  }

  /**
   * Get service metrics
   */
  async getMetrics(): Promise<{
    database: any;
    sessions: any;
  }> {
    try {
      const databaseMetrics = this.connectionPool ? this.connectionPool.getMetrics() : null;
      const sessionMetrics = this.sessionService ? await this.sessionService.getSessionMetrics() : null;

      return {
        database: databaseMetrics,
        sessions: sessionMetrics,
      };

    } catch (error) {
      logger.error('Failed to get service metrics', { error });
      return {
        database: null,
        sessions: null,
      };
    }
  }

  /**
   * Ensure services are initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Service container not initialized. Call initialize() first.');
    }
  }
}

// Export singleton instance
export const serviceContainer = ServiceContainer.getInstance();