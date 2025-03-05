// routes/ticketRoutes.js
import express from 'express';
import { 
    purchaseTicket,
    getUserTickets,
    cancelTicket
} from '../controllers/ticketController.js';
import { authenticateUser, authorizeRoles } from '../middleware/auth.js';
import { validateTicketPurchase } from '../validators/ticketValidator.js';

const router = express.Router();

router.use(authenticateUser);

// Customer routes
router.post('/', 
    authorizeRoles('customer'),
    validateTicketPurchase,
    purchaseTicket
);

router.get('/my-tickets', getUserTickets);

// Cancellazione biglietto (owner-only)
router.delete('/:ticketId', 
    authorizeRoles('customer'),
    cancelTicket
);

export default router;