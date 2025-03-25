// utils/errorHandler.js
import { ApiError } from './apiResponse.js';
import logger from './logger.js';
import { pool } from '../config/db.js';

export const errorHandler = async (err, req, res, next) => {
  let error = err;
  const environment = process.env.NODE_ENV || 'development';
  const user = req.user || {};
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  try {
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

    // 3. Logging nel database
    const logData = {
      message: error.message,
      status_code: error.statusCode,
      path: req.path,
      method: req.method,
      stack: environment === 'development' ? error.stack : null,
      user_id: user.id || null,
      ip_address: ip,
      environment
    };

    await pool.query(
      'INSERT INTO error_logs SET ?',
      logData
    );

    // 4. Logging avanzato sul file system
    logger.error({
      method: req.method,
      path: req.path,
      statusCode: error.statusCode,
      message: error.message,
      userId: user.id,
      ip,
      ...(environment === 'development' && {
        stack: error.stack,
        details: error.errors
      })
    });

  } catch (dbError) {
    logger.error('Errore nel salvataggio del log su database:', dbError.message, {
      stack: dbError.stack
    });
  } finally {
    // 5. Risposta strutturata all'utente
    const response = {
      success: false,
      message: error.message,
      ...(error.errors && { errors: error.errors }),
      ...(environment === 'development' && { stack: error.stack })
    };

    // Nascondi dettagli sensibili in produzione
    if (environment === 'production' && error.statusCode >= 500) {
      response.message = 'Errore interno del server';
    }

    res.status(error.statusCode).json(response);
  }
};