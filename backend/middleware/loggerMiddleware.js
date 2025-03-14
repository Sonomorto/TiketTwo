import { logger } from '../utils/logger.js';

// Log delle richieste HTTP
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      user: req.user?.id || 'guest'
    });
  });

  next();
};

// Log degli errori
export const errorLogger = (err, req, res, next) => {
  logger.error({
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path
  });
  next(err);
};