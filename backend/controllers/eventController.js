// backend/controllers/eventController.js
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import { Event } from '../models/index.js';
import { eventSchema } from '../utils/validationSchemas.js';
import { pool } from '../config/db.js';

// Crea nuovo evento (Solo organizzatori)
export const createEvent = asyncHandler(async (req, res) => {
  // Validazione input
  const { error } = eventSchema.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  // Verifica aggiuntiva
  if (new Date(req.body.date) < new Date()) {
    throw new ApiError(400, 'La data non può essere nel passato');
  }
  
  if (req.body.total_tickets <= 0) {
    throw new ApiError(400, 'Deve esserci almeno un biglietto disponibile');
  }

  // Creazione evento con transazione
  const event = await pool.transaction(async (connection) => {
    const newEvent = await Event.createEvent(
      {
        ...req.body,
        organizer_id: req.user.id
      },
      { connection }
    );
    
    return newEvent;
  });

  res.status(201).json(
    new ApiResponse(201, event, 'Evento creato con successo')
  );
});

// Lista eventi con paginazione
export const getEvents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, location, start_date } = req.query;

  // Validazione parametri
  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)));

  const result = await Event.searchEvents(
    {
      location,
      start_date
    },
    {
      page: parsedPage,
      limit: parsedLimit
    }
  );

  res.json(
    new ApiResponse(200, result, 'Lista eventi recuperata con successo')
  );
});

// Dettaglio evento
export const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.getEventById(req.params.id);
  if (!event) throw new ApiError(404, 'Evento non trovato');

  res.json(
    new ApiResponse(200, event, 'Dettagli evento recuperati')
  );
});

// Modifica evento (Solo proprietario)
export const updateEvent = asyncHandler(async (req, res) => {
  // Verifica esistenza evento
  const existingEvent = await Event.getEventById(req.params.id);
  if (!existingEvent) throw new ApiError(404, 'Evento non trovato');

  // Controllo proprietario
  if (existingEvent.organizer_id !== req.user.id) {
    throw new ApiError(403, 'Non sei il proprietario di questo evento');
  }

  // Validazione input
  const { error } = eventSchema.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  // Aggiornamento con transazione
  const updatedEvent = await pool.transaction(async (connection) => {
    await Event.updateEvent(
      req.params.id,
      req.body,
      { connection }
    );
    
    return Event.getEventById(req.params.id, { connection });
  });

  res.json(
    new ApiResponse(200, updatedEvent, 'Evento aggiornato con successo')
  );
});

// Elimina evento (Solo proprietario)
export const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.getEventById(req.params.id);
  if (!event) throw new ApiError(404, 'Evento non trovato');

  if (event.organizer_id !== req.user.id) {
    throw new ApiError(403, 'Non sei il proprietario di questo evento');
  }

  await pool.transaction(async (connection) => {
    await Event.deleteEvent(req.params.id, { connection });
  });

  res.json(
    new ApiResponse(200, null, 'Evento eliminato con successo')
  );
});

// Eventi dell'organizzatore
export const getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.getEventsByOrganizer(req.user.id);
  
  res.json(
    new ApiResponse(200, events, 'Lista eventi personali recuperata')
  );
});

// Controlla disponibilità biglietti
export const checkAvailability = asyncHandler(async (req, res) => {
  const { event_id, quantity } = req.body;
  
  await Event.checkTicketAvailability(event_id, quantity);
  
  res.json(
    new ApiResponse(200, null, 'Biglietti disponibili')
  );
});