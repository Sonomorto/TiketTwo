import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiResponse.js';
import { config } from 'dotenv';

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
  expiresIn: process.env.JWT_EXPIRES_IN
};

// Genera token JWT
function generateToken(payload) {
  try {
    return jwt.sign(payload, jwtConfig.secret, { 
      expiresIn: jwtConfig.expiresIn 
    });
  } catch (error) {
    throw new ApiError(500, 'Errore nella generazione del token');
  }
}

// Verifica token JWT
function verifyToken(token) {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Token scaduto');
    }
    throw new ApiError(401, 'Token non valido');
  }
}

export { generateToken, verifyToken, jwtConfig };