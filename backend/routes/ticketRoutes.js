import express from 'express';
import { 
  purchaseTicket, 
  cancelTicket, 
  getUserTickets 
} from '../controllers/ticketController.js';
import { authenticate, authorizeUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Endpoint protetti (utenti registrati)
router.get('/', authenticate, getUserTickets);
router.post('/', authenticate, purchaseTicket);
router.delete('/:id', authenticate, authorizeUser, cancelTicket);

export default router;