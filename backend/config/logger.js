// config/logger.js
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file'; // Per la rotazione dei log

// Formatto i log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// Configuro i "transport" (destinazioni dei log)
const transports = [
  // Log su Console
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    )
  }),
  // Log su File (ruotati giornalmente)
  new DailyRotateFile({
    filename: 'logs/application-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '30d',
    format: logFormat
  })
];

// Creo il logger
const logger = winston.createLogger({
  level: 'info', // Livello minimo di log (error, warn, info, debug)
  transports,
  exceptionHandlers: [
    new DailyRotateFile({
      filename: 'logs/exceptions-%DATE%.log',
      datePattern: 'YYYY-MM-DD'
    })
  ]
});

export default logger;