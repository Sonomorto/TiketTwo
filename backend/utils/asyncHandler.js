// utils/asyncHandler.js
import logger from './logger.js';
import { ApiError } from './apiResponse.js';

/**
 * Middleware per gestire funzioni asincrone in Express con migliorie aggiuntive
 * @param {Function} fn - Funzione asincrona da wrappare
 * @returns {Function} Middleware Express con gestione errori avanzata
 */
export const asyncHandler = (fn) => async (req, res, next) => {
  const abortController = new AbortController();
  const timeoutDuration = process.env.ASYNC_HANDLER_TIMEOUT || 10000; // 10 secondi default
  
  const timeout = setTimeout(() => {
    abortController.abort();
    const error = new ApiError(504, `Request timed out after ${timeoutDuration}ms`);
    error.isOperational = true;
    next(error);
  }, timeoutDuration);

  try {
    // Aggiunta gestione segnale di aborto
    req.abortSignal = abortController.signal;
    
    // Traccia il tempo di esecuzione
    const start = Date.now();
    await fn(req, res, next);
    const executionTime = Date.now() - start;

    // Log di performance solo per richieste lente
    if (executionTime > 2000) { // 2 secondi
      logger.warn(`Slow request detected: ${req.method} ${req.path} (${executionTime}ms)`);
    }

    clearTimeout(timeout);
  } catch (error) {
    clearTimeout(timeout);
    
    // Gestione specifica degli errori di timeout
    if (error.name === 'AbortError') {
      error = new ApiError(504, 'Request timeout');
      error.isOperational = true;
    }

    // Costruisci oggetto di log avanzato
    const logData = {
      message: `Async Error: ${error.message}`,
      method: req.method,
      path: req.path,
      statusCode: error.statusCode || 500,
      user: req.user?.id || 'anonymous',
      ip: req.ip
    };

    // Dettagli aggiuntivi solo in sviluppo
    if (process.env.NODE_ENV === 'development') {
      logData.stack = error.stack;
      logData.body = req.body;
      logData.query = req.query;
      logData.params = req.params;
      logData.headers = req.headers;
    }

    // Gestione errori non operazionali
    if (!error.isOperational) {
      logger.error('Critical system failure:', {
        ...logData,
        systemError: error.cause || 'Unknown system error'
      });
      
      // In produzione: notifica il team via sistemi esterni
      if (process.env.NODE_ENV === 'production') {
        // Qui andrebbe l'integrazione con Sentry/DataDog/etc
      }
    } else {
      logger.error(logData);
    }

    // Previene doppio invio di header
    if (!res.headersSent) {
      next(error);
    } else {
      logger.error('Headers already sent, cannot forward error:', logData);
    }
  }
};