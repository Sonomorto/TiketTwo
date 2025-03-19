import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import { Ticket, Event, Notification } from '../models/index.js';
import { ticketSchema } from '../utils/validationSchemas.js';
import { transaction } from '../config/db.js';

// Acquista biglietti (con notifica integrata)
export const purchaseTickets = asyncHandler(async (req, res) => {
  // Verifica ruolo utente
  if (req.user.role !== 'user') {
    throw new ApiError(403, 'Solo gli utenti possono acquistare biglietti');
  }

  // Validazione input
  const { error } = ticketSchema.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  const result = await transaction(async (connection) => {
    // 1. Recupera e verifica l'evento
    const event = await Event.findById(req.body.event_id, { connection });
    if (!event) throw new ApiError(404, 'Evento non trovato');
    
    if (event.total_tickets < req.body.quantity) {
      throw new ApiError(400, 'Biglietti insufficienti');
    }

    // 2. Aggiorna i biglietti disponibili
    await Event.updateTicketCount(
      event.id, 
      -req.body.quantity, 
      { connection }
    );

    // 3. Crea il ticket
    const ticket = await Ticket.create(
      {
        event_id: event.id,
        user_id: req.user.id,
        quantity: req.body.quantity
      },
      { connection }
    );

    // 4. Genera notifica
    await Notification.createNotification(
      req.user.id,
      `Acquisto confermato: ${req.body.quantity} biglietto/i per "${event.title}"`,
      'info',
      { connection }
    );

    return ticket;
  });

  res.status(201).json(
    new ApiResponse(201, result, 'Biglietti acquistati con successo')
  );
});

// Annulla biglietto (con notifica integrata)
export const cancelTicket = asyncHandler(async (req, res) => {
  // 1. Verifica esistenza e proprietà biglietto
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Biglietto non trovato');
  
  if (ticket.user_id !== req.user.id) {
    throw new ApiError(403, 'Non sei il proprietario del biglietto');
  }

  await transaction(async (connection) => {
    // 2. Recupera dettagli evento
    const event = await Event.findById(ticket.event_id, { connection });
    
    // 3. Ripristina i biglietti
    await Event.updateTicketCount(
      ticket.event_id,
      ticket.quantity,
      { connection }
    );

    // 4. Elimina il ticket
    await Ticket.delete(req.params.id, { connection });

    // 5. Genera notifica
    await Notification.createNotification(
      req.user.id,
      `Annullamento confermato: ${ticket.quantity} biglietto/i per "${event.title}"`,
      'warning',
      { connection }
    );
  });

  res.json(
    new ApiResponse(200, null, 'Biglietto annullato con successo')
  );
});

// Ottieni i ticket dell'utente con dettagli evento
export const getUserTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.getTicketsByUser(req.user.id);
  
  res.json(
    new ApiResponse(200, tickets, 'Biglietti recuperati con successo')
  );
});