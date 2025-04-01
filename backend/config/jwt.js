import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiResponse.js';
import { config } from 'dotenv';
import logger from '../utils/logger.js';

config();

// Validazione delle variabili d'ambiente
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET non configurato nelle variabili d\'ambiente');
}

if (!process.env.JWT_EXPIRES_IN) {
  throw new Error('JWT_EXPIRES_IN non configurato nelle variabili d\'ambiente');
}

const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN,
  refreshExpiresIn: '7d' // Token di refresh valido per 7 giorni
};

// Genera token JWT con gestione errori
function generateToken(payload) {
  try {
    const token = jwt.sign(payload, jwtConfig.secret, { 
      expiresIn: jwtConfig.expiresIn 
    });
    logger.debug('Token generato con successo');
    return token;
  } catch (error) {
    logger.error('Errore nella generazione del token:', error.message);
    throw new ApiError(500, 'Errore nella generazione del token');
  }
}

// Genera refresh token
function generateRefreshToken(payload) {
  try {
    const refreshToken = jwt.sign(payload, jwtConfig.secret, {
      expiresIn: jwtConfig.refreshExpiresIn
    });
    logger.debug('Refresh token generato con successo');
    return refreshToken;
  } catch (error) {
    logger.error('Errore nella generazione del refresh token:', error.message);
    throw new ApiError(500, 'Errore nella generazione del refresh token');
  }
}

// Verifica token JWT con gestione errori avanzata
function verifyToken(token) {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    logger.error('Errore nella verifica del token:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token scaduto');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Token non valido');
    }
    if (error.name === 'NotBeforeError') {
      throw new ApiError(401, 'Token non ancora valido');
    }
    throw new ApiError(401, 'Errore nella verifica del token');
  }
}

// Verifica refresh token
function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    logger.error('Errore nella verifica del refresh token:', error.message);
    throw new ApiError(401, 'Refresh token non valido o scaduto');
  }
}

// Decodifica token senza verifica (utile per debug)
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Errore nella decodifica del token:', error.message);
    throw new ApiError(400, 'Token non decodificabile');
  }
}

export { 
  generateToken, 
  generateRefreshToken,
  verifyToken, 
  verifyRefreshToken,
  decodeToken,
  jwtConfig 
};