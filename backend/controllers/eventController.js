import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import { Event } from '../models/Event.js';
import { eventSchema } from '../utils/validationSchemas.js';

// Crea evento (Solo organizzatori)
export const createEvent = asyncHandler(async (req, res) => {
  // Verifica ruolo utente
  if (req.user.role !== 'organizer') {
    throw new ApiError(403, 'Accesso negato: ruolo non valido');
  }

  // Validazione input
  const { error } = eventSchema.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  // Crea evento
  const event = await Event.create({
    ...req.body,
    organizer_id: req.user.id
  });

  res.status(201).json(
    new ApiResponse(201, event, 'Evento creato con successo')
  );
});

// Lista eventi con filtri
export const getEvents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  const events = await Event.findAllPaginated({
    page: parseInt(page),
    limit: parseInt(limit)
  });

  res.json(
    new ApiResponse(200, events, 'Lista eventi recuperata')
  );
});

// Modifica evento (Solo proprietario)
export const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  
  // Verifica proprietario
  if (event.organizer_id !== req.user.id) {
    throw new ApiError(403, 'Non sei il proprietario di questo evento');
  }

  const updatedEvent = await Event.update(req.params.id, req.body);
  
  res.json(
    new ApiResponse(200, updatedEvent, 'Evento aggiornato')
  );
});