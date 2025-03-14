import { verifyToken } from '../config/jwt.js';
import { logger } from '../utils/logger.js';

// Verifica JWT e autorizzazione
export const authenticate = (roles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Token mancante' });
      }

      const decoded = verifyToken(token);
      req.user = decoded; // Aggiunge i dati dell'utente alla richiesta

      // Controllo del ruolo (se specificato)
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Accesso negato' });
      }

      next();
    } catch (error) {
      logger.error('Errore di autenticazione:', error.message);
      res.status(401).json({ message: 'Token non valido' });
    }
  };
};

// Middleware per organizzatori
export const isOrganizer = authenticate(['organizer']);