import { 
    createTicket, 
    getTicketsByUser, 
    cancelTicket 
  } from '../models/ticketModel.js';
  
  export const purchaseTicket = async (req, res) => {
    try {
      const ticket = await createTicket({
        event_id: req.body.event_id,
        user_id: req.user.id, // ID dall'JWT
        quantity: req.body.quantity
      });
      
      res.status(201).json({
        id: ticket,
        message: 'Biglietto acquistato con successo'
      });
    } catch (error) {
      switch(error.message) {
        case 'EVENT_NOT_FOUND':
          res.status(404).json({ message: 'Evento non trovato' });
          break;
        case 'NOT_ENOUGH_SEATS':
          res.status(409).json({ message: 'Posti insufficienti' });
          break;
        default:
          res.status(500).json({ message: 'Errore nell acquisto' });
      }
    }
  };
  
  export const getUserTickets = async (req, res) => {
    try {
      const tickets = await getTicketsByUser(req.user.id);
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: 'Errore nel recupero biglietti' });
    }
  };
  
  export const cancelUserTicket = async (req, res) => {
    try {
      const ticketId = req.params.id;
      const userId = req.user.id;
      
      await cancelTicket(ticketId, userId);
      res.json({ message: 'Biglietto annullato' });
    } catch (error) {
      if(error.message === 'TICKET_NOT_FOUND') {
        res.status(404).json({ message: 'Biglietto non trovato' });
      } else {
        res.status(500).json({ message: 'Errore nell annullamento' });
      }
    }
  };