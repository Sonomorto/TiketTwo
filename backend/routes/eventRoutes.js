import express from 'express';
import { 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  listEvents,
  getEventDetails 
} from '../controllers/eventController.js';
import { authenticate, authorizeOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router();

// Endpoint pubblici
router.get('/', listEvents);
router.get('/:id', getEventDetails);

// Endpoint protetti (solo organizzatori)
router.post('/', authenticate, authorizeOrganizer, createEvent);
router.put('/:id', authenticate, authorizeOrganizer, updateEvent);
router.delete('/:id', authenticate, authorizeOrganizer, deleteEvent);

export default router;