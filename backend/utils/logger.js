import winston from 'winston';
import 'winston-daily-rotate-file';
import { pool } from '../config/db.js'; // Import aggiunto per il logging delle query

// Formattazione personalizzata per i log
const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
});

// Configurazione del logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    logFormat
  ),
  transports: [
    // Log su console (dettagliato in sviluppo)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
    }),
    // Log rotativo giornaliero (solo errori e info in produzione)
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'info'
    })
  ]
});

// Log delle query SQL in sviluppo
if (process.env.NODE_ENV === 'development') {
  pool.on('query', (query) => {
    logger.debug(`SQL Query: ${query.sql} | Params: ${JSON.stringify(query.values)}`);
  });
}

// Gestione eccezioni non catturate
logger.exceptions.handle(
  new winston.transports.DailyRotateFile({
    filename: 'logs/exceptions-%DATE%.log',
    datePattern: 'YYYY-MM-DD'
  })
);

export default logger;