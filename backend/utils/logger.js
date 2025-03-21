import winston from 'winston';
import 'winston-daily-rotate-file';
import { pool } from '../config/db.js';

// Formattazione personalizzata migliorata
const logFormat = winston.format.printf(({ 
  timestamp, 
  level, 
  message, 
  stack, 
  userAgent,
  ip
}) => {
  let log = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  
  if (stack) {
    log += `\nStack Trace:\n${stack}`;
  }
  
  if (userAgent) {
    log += `\nUser Agent: ${userAgent}`;
  }
  
  if (ip) {
    log += `\nIP: ${ip}`;
  }
  
  return log;
});

// Configurazione logger principale
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
      level: process.env.NODE_ENV === 'development' ? 'debug' : 'info'
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: winston.format.combine(
        winston.format.uncolorize(),
        logFormat
      )
    })
  ]
});

// Logging query SQL in sviluppo
if (process.env.NODE_ENV === 'development') {
  pool.on('query', (query) => {
    logger.debug('SQL Query Executed', {
      sql: query.sql,
      params: query.values,
      duration: `${query.duration}ms`
    });
  });
}

// Gestione errori
logger.exceptions.handle(
  new winston.transports.DailyRotateFile({
    filename: 'logs/exceptions-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true
  })
);

logger.rejections.handle(
  new winston.transports.DailyRotateFile({
    filename: 'logs/rejections-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true
  })
);

// Stream per Morgan
export const morganStream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

export default logger;