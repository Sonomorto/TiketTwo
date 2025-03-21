import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import logger from './utils/logger.js';
import { pool, testConnection } from './config/db.js';
import { errorHandler } from './utils/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Configurazione ambiente
config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Connessione Database
(async () => {
  try {
    await testConnection();
    logger.info('✅ Connessione al database riuscita');
    
    if (process.env.NODE_ENV === 'development') {
      pool.on('query', (query) => {
        logger.debug('SQL Debug', {
          sql: query.sql,
          params: query.values,
          duration: query.duration
        });
      });
    }
  } catch (error) {
    logger.error('❌ Connessione database fallita', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
})();

// 2. Middleware Base
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', { ip: req.ip });
    res.status(429).json({
      status: 'error',
      message: 'Troppe richieste, riprova più tardi'
    });
  }
});

// 4. Logging HTTP
app.use(morgan(':method :url :status :response-time ms - :res[content-length]', {
  stream: logger.morganStream
}));

// 5. Routes
app.use('/api/v1/auth', apiLimiter, authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// 6. Gestione errori
app.use((req, res, next) => {
  logger.warn(`Route non trovata: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: 'Risorsa non trovata'
  });
});

app.use(errorHandler);

// Avvio server
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server in ascolto sulla porta ${PORT} (${process.env.NODE_ENV})`);
});

// Gestione shutdown
const shutdown = async () => {
  logger.info('🔌 Arresto server in corso...');
  await pool.end();
  server.close(() => {
    logger.info('✅ Server arrestato correttamente');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);