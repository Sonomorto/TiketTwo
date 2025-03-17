import { verifyToken } from '../config/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

// Middleware per autenticazione JWT e controllo ruoli
export const authenticate = (roles = []) => {
  return asyncHandler(async (req, res, next) => {
    // Verifica presenza token
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new ApiError(401, 'Token mancante');

    // Decodifica e verifica token
    const decoded = verifyToken(token);

    // Controllo validità del ruolo
    if (!['user', 'organizer'].includes(decoded.role)) {
      throw new ApiError(403, 'Ruolo utente non valido');
    }

    // Autorizzazione basata sui ruoli
    if (roles.length > 0 && !roles.includes(decoded.role)) {
      throw new ApiError(403, 'Accesso negato: permessi insufficienti');
    }

    // Aggiunge i dati dell'utente alla richiesta
    req.user = decoded;
    next();
  });
};

// Middleware specializzati
export const isOrganizer = authenticate(['organizer']);
export const isUser = authenticate(['user']);