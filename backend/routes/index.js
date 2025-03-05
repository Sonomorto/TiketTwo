// routes/index.js
import express from 'express';
import authRoutes from './authRoutes.js';
import eventRoutes from './eventRoutes.js';
import ticketRoutes from './ticketRoutes.js';

const router = express.Router();

router.use('/api/auth', authRoutes);
router.use('/api/events', eventRoutes);
router.use('/api/tickets', ticketRoutes);

// Gestione route non trovate
router.use('*', (req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.originalUrl} non esistente`
    });
});

export default router;