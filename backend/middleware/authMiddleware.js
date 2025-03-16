import { verifyToken } from '../config/jwt.js';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/apiResponse.js'; // Import aggiunto

// Verifica JWT e autorizzazione
export const authenticate = (roles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        throw new ApiError(401, 'Token mancante'); // Sostituito con ApiError
      }

      const decoded = verifyToken(token);
      req.user = decoded;

      // Controllo del ruolo (se specificato)
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        throw new ApiError(403, 'Accesso negato'); // Sostituito con ApiError
      }

      next();
    } catch (error) {
      logger.error('Errore di autenticazione:', error.message);
      next(error); // Propagazione dell'errore al gestore centrale
    }
  };
};

// Middleware per organizzatori
export const isOrganizer = authenticate(['organizer']);