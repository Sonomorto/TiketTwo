// Gestione centralizzata degli errori
export const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Errore del server' : err.message;
  
    res.status(statusCode).json({
      success: false,
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  };