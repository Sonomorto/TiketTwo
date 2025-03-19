// utils/logger.js
import winston from 'winston';
import 'winston-daily-rotate-file';
import { pool } from '../config/db.js'; // Percorso corretto

// Formattazione personalizzata per i log
const logFormat = winston.format.printf(({ timestamp, level, message, ...metadata }) => {
  let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (metadata.stack) {
    log += `\n${metadata.stack}`;
  }
  
  if (metadata.userAgent) {
    log += ` | User Agent: ${metadata.userAgent}`;
  }
  
  return log;
});

// Configurazione del logger principale
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json(),
    logFormat
  ),
  transports: [
    // Log su console (colorato in sviluppo)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
    }),
    // Log rotativo giornaliero
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'info',
      format: winston.format.combine(
        winston.format.uncolorize(),
        logFormat
      )
    })
  ]
});

// Log delle query SQL solo in ambiente di sviluppo
if (process.env.NODE_ENV === 'development') {
  pool.on('query', (query) => {
    logger.debug('SQL Query Executed', {
      sql: query.sql,
      params: query.values,
      duration: `${query.duration}ms`
    });
  });
}

// Gestione eccezioni non catturate
logger.exceptions.handle(
  new winston.transports.DailyRotateFile({
    filename: 'logs/exceptions-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m'
  })
);

// Gestione promise rejection non gestite
logger.rejections.handle(
  new winston.transports.DailyRotateFile({
    filename: 'logs/rejections-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true
  })
);

// Stream per il logging di morgan
export const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

export default logger;