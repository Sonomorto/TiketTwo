// app.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';

import { httpLogger, errorLogger } from './middleware/loggerMiddleware.js';
import mainRouter from './routes/index.js';
import pool from './config/db.js';
import { handleDatabaseError, getErrorMessage } from './utils/helpers.js';

// Caricamento variabili d'ambiente
dotenv.config();

// Configurazione base Express
const app = express();
const PORT = process.env.PORT_Server;

// Configurazione CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Rate limiting per sicurezza
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 100, // Limite per IP
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware
app.use(httpLogger); // Logging richieste
app.use(cors(corsOptions));
app.use(helmet());
app.use(limiter);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// Connessione al database
pool.getConnection()
  .then(() => console.log('✅ Connesso al database MySQL'))
  .catch(err => console.error('❌ Errore connessione database:', err.message));

// Routes principali
app.use('/api', mainRouter);

// Gestione route non trovate
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Risorsa non trovata',
    path: req.originalUrl
  });
});

// Middleware gestione errori
app.use(errorLogger); // Log errori
app.use((err, req, res, next) => {
  // Gestione specifica errori database
  if (err.code && err.code.startsWith('ER_')) {
    const dbError = handleDatabaseError(err);
    return res.status(dbError.code).json({
      status: 'error',
      message: dbError.message
    });
  }

  // Formattazione risposta errori
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Errore interno del server' : getErrorMessage(err);
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Avvio server
app.listen(PORT, () => {
  console.log(`🚀 Server in ascolto sulla porta ${PORT}`);
  console.log(`🔵 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});