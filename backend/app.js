import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from 'dotenv';
import logger from '../utils/logger.js';
import { pool, testConnection } from '../config/db.js';
import { errorHandler } from '../utils/errorHandler.js';
import authRoutes from '../routes/authRoutes.js';
import eventRoutes from '../routes/eventRoutes.js';
import ticketRoutes from '../routes/ticketRoutes.js';
import notificationRoutes from '../routes/notificationRoutes.js';

// Caricamento variabili d'ambiente
config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

// Configurazione iniziale
const app = express();
const PORT = process.env.PORT || 3000;

// 1. Connessione al Database e logging query SQL in sviluppo
(async () => {
  try {
    await testConnection();
    logger.info('✅ Connessione al database stabilita con successo');

    // Log delle query SQL solo in sviluppo
    if (process.env.NODE_ENV === 'development') {
      pool.on('query', (query) => {
        logger.debug(`📝 SQL Query: ${query.sql} | Params: ${JSON.stringify(query.values)}`);
      });
    }
  } catch (error) {
    logger.error('❌ Connessione al database fallita:', error.message);
    process.exit(1);
  }
})();

// 2. Middleware base
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 
          (process.env.NODE_ENV === 'development' ? '*' : 'https://yourdomain.com'),
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Rate limiting per prevenire brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // Limite di 100 richieste per finestra
  message: 'Troppe richieste da questo IP. Riprova più tardi.',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/v1/auth', authLimiter);

// 4. Logging avanzato
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan((tokens, req, res) => {
    logger.http(`[${tokens.method(req, res)}] ${tokens.url(req, res)} - ${tokens.status(req, res)}`, {
      responseTime: `${tokens['response-time'](req, res)}ms`,
      userAgent: tokens['user-agent'](req, res),
      ip: req.ip
    });
    return null;
  }));
}

// 5. Rotte principali
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/events', eventRoutes);