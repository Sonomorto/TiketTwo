import express from 'express';
import { 
  purchaseTickets, 
  cancelTicket, 
  getUserTickets 
} from '../controllers/ticketController.js';
import { authenticate, authorizeUser } from '../middleware/authMiddleware.js';

const router = express.Router();

// Endpoint per l'acquisto di biglietti (solo utenti registrati)
router.post('/', authenticate, purchaseTickets);

// Endpoint per ottenere i biglietti dell'utente (solo utenti registrati)
router.get('/', authenticate, getUserTickets);

// Endpoint per annullare un biglietto (solo proprietario del biglietto)
router.delete('/:id', authenticate, authorizeUser, cancelTicket);

export default router;