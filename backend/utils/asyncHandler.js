// utils/asyncHandler.js
import logger from './logger.js';

/**
 * Middleware per gestire funzioni asincrone in Express
 * @param {Function} fn - Funzione asincrona da wrappare
 * @returns {Function} Middleware Express con gestione errori
 */
export const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    // Log dettagliato solo in ambiente di sviluppo
    logger.error({
      message: `Async Error: ${error.message}`,
      method: req.method,
      path: req.path,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        body: req.body
      })
    });
    
    next(error); // Passa l'errore al middleware centralizzato
  }
};