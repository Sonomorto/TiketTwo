// app.js
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from 'dotenv';
import logger from './utils/logger.js';
import { pool, testConnection } from './config/db.js';
import { errorHandler } from './utils/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

// Caricamento variabili d'ambiente
config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

// Configurazione iniziale
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Connessione al Database
(async () => {
  try {
    await testConnection();
    logger.info('✅ Connessione al database stabilita con successo');
  } catch (error) {
    logger.error('❌ Connessione al database fallita:', error.message);
    process.exit(1);
  }
})();

// 2. Middleware base
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Logging avanzato
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan((tokens, req, res) => {
    logger.http(`[${tokens.method(req, res)}] ${tokens.url(req, res)} - ${tokens.status(req, res)}`, {
      responseTime: `${tokens['response-time'](req, res)}ms`,
      userAgent: tokens['user-agent'](req, res)
    });
    return null;
  }));
}

// 4. Rotte principali
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/notifications', notificationRoutes);

// 5. Gestione errori e rotte non trovate
app.all('*', (req, res) => {
  logger.warn(`Route non trovata: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    status: 'error',
    message: 'Risorsa non trovata'
  });
});

app.use(errorHandler);

// 6. Gestione shutdown graceful
const server = app.listen(PORT, () => {
  logger.info(`🚀 Server avviato sulla porta ${PORT} (${process.env.NODE_ENV})`);
});

const shutdown = async (signal) => {
  logger.warn(`🛑 Ricevuto segnale ${signal}. Arresto del server...`);
  await pool.end();
  server.close(() => {
    logger.info('🔥 Connessioni chiuse con successo');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Export per testing
export default app;