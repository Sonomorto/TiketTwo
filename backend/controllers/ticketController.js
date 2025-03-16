import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import { Ticket, Event } from '../models/index.js';
import { ticketSchema } from '../utils/validationSchemas.js';
import { db } from '../config/db.js'; // Import aggiunto per le transazioni

// Acquista biglietti
export const purchaseTickets = asyncHandler(async (req, res) => {
  // Verifica ruolo utente
  if (req.user.role !== 'user') {
    throw new ApiError(403, 'Solo gli utenti possono acquistare biglietti');
  }

  // Validazione input
  const { error } = ticketSchema.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  // Transazione per atomicità
  const result = await db.transaction(async (transaction) => {
    const event = await Event.findById(req.body.event_id, { transaction });
    
    // Verifica esistenza evento
    if (!event) {
      throw new ApiError(404, 'Evento non trovato');
    }

    // Verifica disponibilità
    if (event.total_tickets < req.body.quantity) {
      throw new ApiError(400, 'Biglietti insufficienti');
    }

    // Aggiorna disponibilità
    await Event.updateTicketCount(
      event.id,
      -req.body.quantity,
      { transaction }
    );

    // Crea biglietto
    return Ticket.create({
      event_id: event.id,
      user_id: req.user.id,
      quantity: req.body.quantity
    }, { transaction });
  });

  res.status(201).json(
    new ApiResponse(201, result, 'Biglietti acquistati con successo')
  );
});