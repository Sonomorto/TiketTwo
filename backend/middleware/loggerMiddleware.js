import { logger } from '../utils/logger.js';

// Log delle richieste HTTP con dettagli avanzati
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      user: req.user?.id || 'guest',
      ip: req.ip // Aggiunto indirizzo IP del client
    };

    // Differenzia il livello di log in base allo status code
    if (res.statusCode >= 500) {
      logger.error(logData);
    } else if (res.statusCode >= 400) {
      logger.warn(logData); // Logga come warning per errori 4xx
    } else {
      logger.info(logData);
    }
  });

  next();
};

// Log degli errori con formattazione migliorata
export const errorLogger = (err, req, res, next) => {
  logger.error({
    message: err.message,
    path: req.path,
    stack: process.env.NODE_ENV === 'development' ? err.stack : '🔒 Nascosto in produzione',
    user: req.user?.id || 'guest' // Aggiunto contesto utente
  });
  
  next(err);
};