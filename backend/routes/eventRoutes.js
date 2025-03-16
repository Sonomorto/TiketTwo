import express from 'express';
import { 
  createEvent, 
  updateEvent, 
  deleteEvent, 
  getEvents,          // Rinominato da listEvents → getEvents
  getEventById        // Rinominato da getEventDetails → getEventById
} from '../controllers/eventController.js';
import { authenticate, authorizeOrganizer } from '../middleware/authMiddleware.js';

const router = express.Router();

// Endpoint pubblici
router.get('/', getEvents);               // listEvents → getEvents
router.get('/:id', getEventById);         // getEventDetails → getEventById

// Endpoint protetti (solo organizzatori)
router.post('/', authenticate, authorizeOrganizer, createEvent);
router.put('/:id', authenticate, authorizeOrganizer, updateEvent);
router.delete('/:id', authenticate, authorizeOrganizer, deleteEvent);  // Funzione deleteEvent aggiunta al controller

export default router;