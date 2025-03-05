// routes/eventRoutes.js
import express from 'express';
import { 
    getAllEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent
} from '../controllers/eventController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { validateEventCreation } from '../validators/eventValidator.js';

const router = express.Router();

// Public routes
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Organizer-only routes
router.use(authenticateUser, authorizeRoles('organizer'));

router.post('/', validateEventCreation, createEvent);
router.put('/:id', validateEventCreation, updateEvent);
router.delete('/:id', deleteEvent);

export default router;