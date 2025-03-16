import express from 'express';
import authRoutes from './authRoutes.js';
import eventRoutes from './eventRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import errorHandler from '../middleware/errorHandler.js'; // Import aggiunto

const router = express.Router();

// Definizione dei percorsi base
router.use('/api/auth', authRoutes);
router.use('/api/events', eventRoutes);
router.use('/api/tickets', ticketRoutes);
router.use('/api/notifications', notificationRoutes);

// Middleware per la gestione centralizzata degli errori (deve essere l'ultimo!)
router.use(errorHandler);

export default router;