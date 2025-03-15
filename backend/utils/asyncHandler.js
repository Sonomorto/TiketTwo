// utils/asyncHandler.js
import logger from './logger.js';

/**
 * Middleware per gestire funzioni asincrone in Express
 * @param {Function} fn - Funzione asincrona da wrappare
 * @returns {Function} Middleware Express con gestione errori
 */
export const asyncHandler = (fn) => async (req, res, next) => {
  try {
    // Esegui la funzione asincrona e attendi il risultato
    await fn(req, res, next);
  } catch (error) {
    // Log dell'errore con contesto della richiesta
    logger.error({
      message: `Async Error: ${error.message}`,
      method: req.method,
      path: req.path,
      stack: error.stack,
      body: req.body
    });
    
    // Passa l'errore al middleware di gestione errori
    next(error);
  }
};