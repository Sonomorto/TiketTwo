import { ApiError } from '../utils/apiResponse.js'; // Import aggiunto

// Gestione centralizzata degli errori
export const errorHandler = (err, req, res, next) => {
  // Determina status code e messaggio in base al tipo di errore
  const statusCode = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || 'Errore del server';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};