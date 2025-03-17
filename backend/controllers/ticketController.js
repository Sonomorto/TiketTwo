import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import { Ticket, Event } from '../models/index.js';
import { ticketSchema } from '../utils/validationSchemas.js';
import { transaction } from '../config/db.js'; // Import corretto della transazione

// Acquista biglietti
export const purchaseTickets = asyncHandler(async (req, res) => {
  if (req.user.role !== 'user') {
    throw new ApiError(403, 'Solo gli utenti possono acquistare biglietti');
  }

  const { error } = ticketSchema.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  const result = await transaction(async (connection) => {
    const event = await Event.findById(req.body.event_id, { connection });
    if (!event) throw new ApiError(404, 'Evento non trovato');
    if (event.total_tickets < req.body.quantity) {
      throw new ApiError(400, 'Biglietti insufficienti');
    }

    await Event.updateTicketCount(event.id, -req.body.quantity, { connection });
    return Ticket.create(
      { event_id: event.id, user_id: req.user.id, quantity: req.body.quantity },
      { connection }
    );
  });

  res.status(201).json(new ApiResponse(201, result, 'Biglietti acquistati'));
});

// Annulla biglietto
export const cancelTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) throw new ApiError(404, 'Biglietto non trovato');
  if (ticket.user_id !== req.user.id) {
    throw new ApiError(403, 'Non sei il proprietario del biglietto');
  }

  await transaction(async (connection) => {
    await Event.updateTicketCount(ticket.event_id, ticket.quantity, { connection });
    await Ticket.delete(req.params.id, { connection });
  });

  res.json(new ApiResponse(200, null, 'Biglietto annullato'));
});

// Ottieni i ticket dell'utente
export const getUserTickets = asyncHandler(async (req, res) => {
  const tickets = await Ticket.findByUserId(req.user.id);
  res.json(new ApiResponse(200, tickets, 'Biglietti recuperati'));
});