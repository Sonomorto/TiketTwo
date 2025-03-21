// routes/eventRoutes.js
import express from 'express';
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEvents,
  getEventById,
  getMyEvents,
  checkAvailability
} from '../controllers/eventController.js';
import { authenticate, authorizeOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router();

// Endpoint pubblici
router.get('/', getEvents);
router.get('/:id', getEventById);

// Endpoint protetti per organizzatori
router.post(
  '/',
  authenticate,
  authorizeOrganizer,
  createEvent
);

router.put(
  '/:id',
  authenticate,
  authorizeOrganizer,
  updateEvent
);

router.delete(
  '/:id',
  authenticate,
  authorizeOrganizer,
  deleteEvent
);

// Endpoint personali organizzatore
router.get(
  '/my/events',
  authenticate,
  authorizeOrganizer,
  getMyEvents
);

// Verifica disponibilità biglietti
router.post(
  '/check-availability',
  authenticate,
  checkAvailability
);

export default router;