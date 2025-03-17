import { ApiError } from './apiResponse.js';
import logger from './logger.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  // 1. Gestione errori di validazione Joi
  if (error.name === 'ValidationError' && error.details) {
    const errors = error.details.map(detail => ({
      field: detail.context.label,
      message: detail.message.replace(/['"]/g, '')
    }));
    error = new ApiError(422, 'Errore di validazione', errors);
  }

  // 2. Converti errori generici in ApiError
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Errore del server';
    error = new ApiError(statusCode, message);
  }

  // 3. Logging avanzato (dettagli solo in sviluppo)
  logger.error({
    method: req.method,
    path: req.path,
    statusCode: error.statusCode,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.errors
    })
  });

  // 4. Risposta strutturata all'utente
  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.errors && { errors: error.errors }), // Mostra errori di validazione
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};