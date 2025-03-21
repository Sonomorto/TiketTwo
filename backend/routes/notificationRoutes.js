// routes/notificationRoutes.js
import express from 'express';
import { 
  getNotifications,
  createNotification,
  markAsRead
} from '../controllers/notificationController.js';
import { authenticate, authorizeOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router();

// ===============================================
// ENDPOINT PER LA GESTIONE DELLE NOTIFICHE
// ===============================================

/**
 * @route   GET /api/v1/notifications
 * @desc    Recupera tutte le notifiche dell'utente
 * @access  Privato (Utente/Organizer)
 */
router.get('/', authenticate, getNotifications);

/**
 * @route   POST /api/v1/notifications
 * @desc    Crea una nuova notifica (solo organizzatori)
 * @access  Privato (Organizer)
 */
router.post('/', authenticate, authorizeOrganizer, createNotification);

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Marca una notifica come letta
 * @access  Privato (Utente/Organizer)
 */
router.patch('/:id/read', authenticate, markAsRead);

export default router;