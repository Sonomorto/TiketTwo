import express from 'express';
import { 
  getNotifications,
  createNotification // Funzione aggiunta
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// Recupera notifiche utente
router.get('/', authenticate, getNotifications);

// Crea una nuova notifica (es: per admin/organizzatori)
router.post('/', authenticate, createNotification); // Endpoint aggiunto

export default router;