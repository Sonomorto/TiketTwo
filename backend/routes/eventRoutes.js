// backend/routes/eventRoutes.js
import express from 'express';
import { 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  getEvents,
  getEventById,
  getMyEvents
} from '../controllers/eventController.js';
import { authenticate, authorizeOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router();

// Endpoint pubblici
router.get('/', getEvents);               // Lista eventi con filtri e paginazione
router.get('/:id', getEventById);         // Dettagli singolo evento

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

// Endpoint eventi personali organizzatore
router.get(
  '/my/events',
  authenticate,
  authorizeOrganizer,
  getMyEvents
);

// Endpoint ricerca avanzata (esempio aggiuntivo)
router.get(
  '/search/advanced',
  async (req, res) => {
    // Implementazione personalizzata se necessaria
  }
);

export default router;