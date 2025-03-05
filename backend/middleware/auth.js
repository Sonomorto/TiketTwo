import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import logger from '../utils/logger.js'; // Supponendo l'uso di un logger

const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // 1. Verifica presenza token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        logger.warn('Tentativo di accesso senza token');
        return res.status(401).json({ 
            error: 'Unauthorized',
            message: 'Token di autenticazione mancante o malformato' 
        });
    }

    const token = authHeader.split(' ')[1];
    
    try {
        // 2. Verifica validità token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 3. Verifica esistenza utente nel database
        const [user] = await pool.query(
            'SELECT id, role, status FROM users WHERE id = ?',
            [decoded.id]
        );

        if (!user.length || user[0].status !== 'active') {
            logger.warn(`Tentativo di accesso con utente non valido: ${decoded.id}`);
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Utente non esistente o disabilitato' 
            });
        }

        // 4. Aggiungi informazioni utente alla request
        req.user = {
            id: user[0].id,
            role: user[0].role,
            status: user[0].status
        };

        logger.info(`Accesso autorizzato per utente: ${req.user.id}`);
        next();

    } catch (error) {
        logger.error(`Errore autenticazione: ${error.message}`);
        
        const response = {
            error: 'Unauthorized',
            message: 'Token non valido o scaduto'
        };

        if (error.name === 'TokenExpiredError') {
            response.message = 'Token scaduto';
            response.expiredAt = error.expiredAt;
        }

        res.status(401).json(response);
    }
};

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            logger.warn(`Tentativo di accesso non autorizzato: ${req.user.id} - Ruolo: ${req.user.role}`);
            return res.status(403).json({
                error: 'Forbidden',
                message: `Il ruolo ${req.user.role} non ha i permessi necessari`
            });
        }
        next();
    };
};

export { authenticateUser, authorizeRoles };