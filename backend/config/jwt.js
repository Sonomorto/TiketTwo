import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/apiResponse.js'; // Import aggiunto

const jwtConfig = {
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN
};

// Genera token JWT
function generateToken(payload) {
  return jwt.sign(payload, jwtConfig.secret, { 
    expiresIn: jwtConfig.expiresIn 
  });
}

// Verifica token JWT
function verifyToken(token) {
  try {
    return jwt.verify(token, jwtConfig.secret);
  } catch (error) {
    throw new ApiError(401, 'Token non valido o scaduto'); // Sostituito con ApiError
  }
}

export { generateToken, verifyToken, jwtConfig };