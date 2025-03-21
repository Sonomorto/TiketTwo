// middleware/authMiddleware.js
import { verifyToken } from '../config/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * Middleware generico per l'autenticazione JWT e controllo ruoli
 * @param {Array<string>} roles - Ruoli consentiti (es: ['organizer', 'user'])
 */
export const authenticate = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    // 1. Estrazione token dall'header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new ApiError(401, 'Token JWT mancante');

    try {
      // 2. Verifica e decodifica token
      const decoded = verifyToken(token);

      // 3. Controllo validità del ruolo
      if (!['user', 'organizer'].includes(decoded.role)) {
        throw new ApiError(403, 'Ruolo utente non riconosciuto');
      }

      // 4. Autorizzazione per ruoli specifici
      if (roles.length > 0 && !roles.includes(decoded.role)) {
        throw new ApiError(403, 'Accesso negato: permessi insufficienti');
      }

      // 5. Aggiunge i dati dell'utente alla richiesta
      req.user = decoded;
      next();

    } catch (error) {
      logger.error(`Errore autenticazione: ${error.message}`);
      throw new ApiError(401, 'Token JWT non valido o scaduto');
    }
  });
};

// ===============================================
// MIDDLEWARE SPECIALIZZATI PER PROGETTO 4
// ===============================================

/** 
 * Middleware per soli organizzatori 
 * @example router.post('/', authorizeOrganizer, createEvent)
 */
export const authorizeOrganizer = authenticate(['organizer']);

/** 
 * Middleware per soli utenti standard 
 * @example router.get('/my-tickets', authorizeUser, getTickets)
 */
export const authorizeUser = authenticate(['user']);