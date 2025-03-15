import { ApiError } from './apiResponse.js';
import logger from './logger.js';

export const errorHandler = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || "Internal Server Error";
    error = new ApiError(statusCode, message);
  }

  logger.error(`[${req.method}] ${req.path} >> StatusCode: ${error.statusCode}, Message: ${error.message}`);
  
  return res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};