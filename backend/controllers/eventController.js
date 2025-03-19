import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import { Event } from '../models/Event.js';
import { eventSchema } from '../utils/validationSchemas.js';
import { db } from '../config/db.js';

// Crea evento (Solo organizzatori)
export const createEvent = asyncHandler(async (req, res) => {
  // Validazione input
  const { error } = eventSchema.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  // Verifica aggiuntiva: data futura e biglietti positivi
  if (new Date(req.body.date) < new Date()) {
    throw new ApiError(400, 'La data non può essere nel passato');
  }
  if (req.body.total_tickets <= 0) {
    throw new ApiError(400, 'Il numero di biglietti deve essere positivo');
  }

  // Creazione evento
  const event = await Event.create({
    ...req.body,
    organizer_id: req.user.id
  });

  res.status(201).json(
    new ApiResponse(201, event, 'Evento creato con successo')
  );
});

// Lista eventi con filtri e paginazione
export const getEvents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, location, minDate } = req.query;

  // Validazione parametri
  const parsedPage = Math.max(1, parseInt(page)) || 1;
  const parsedLimit = Math.min(Math.max(1, parseInt(limit)), 100) || 10; // Max 100 risultati

  const events = await Event.findAllPaginated({
    page: parsedPage,
    limit: parsedLimit,
    filters: { location, minDate }
  });

  res.json(
    new ApiResponse(200, events, 'Lista eventi recuperata')
  );
});

// Modifica evento (Solo proprietario)
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Evento non trovato');

  // Verifica proprietario
  if (event.organizer_id !== req.user.id) {
    throw new ApiError(403, 'Non sei il proprietario di questo evento');
  }

  // Validazione input
  const { error } = eventSchema.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  // Transazione per atomicità
  const updatedEvent = await db.transaction(async (transaction) => {
    await Event.update(req.params.id, req.body, { transaction });
    return Event.findById(req.params.id, { transaction });
  });

  res.json(
    new ApiResponse(200, updatedEvent, 'Evento aggiornato')
  );
});

// Elimina evento (Solo proprietario)
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) throw new ApiError(404, 'Evento non trovato');

  if (event.organizer_id !== req.user.id) {
    throw new ApiError(403, 'Non sei il proprietario di questo evento');
  }

  // Transazione per eliminazione sicura
  await db.transaction(async (transaction) => {
    await Event.delete(req.params.id, { transaction });
  });

  res.json(
    new ApiResponse(200, null, 'Evento eliminato con successo')
  );
});

// Nuovo controller per "I miei eventi"
export const getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.getEventsByOrganizer(req.user.id);
  res.json(new ApiResponse(200, events, 'Lista eventi personali recuperata'));
});