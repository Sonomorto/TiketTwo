// backend/controllers/eventController.js
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import { Event } from '../models/index.js';
import { eventSchemas } from '../utils/validationSchemas.js'; // Import corretto
import { pool } from '../config/db.js';

// ===============================================
// FUNZIONALITÀ PRINCIPALI PER LA GESTIONE EVENTI
// ===============================================

/**
 * Crea un nuovo evento (solo organizzatori)
 * @route POST /api/v1/events
 */
export const createEvent = asyncHandler(async (req, res) => {
  // 1. Validazione input con schema Joi
  const { error } = eventSchemas.create.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  // 2. Verifiche aggiuntive
  if (new Date(req.body.date) < new Date()) {
    throw new ApiError(400, 'La data non può essere nel passato');
  }
  
  if (req.body.total_tickets <= 0) {
    throw new ApiError(400, 'Deve esserci almeno un biglietto disponibile');
  }

  // 3. Creazione evento con transazione
  const event = await pool.transaction(async (connection) => {
    return await Event.createEvent(
      {
        ...req.body,
        organizer_id: req.user.id
      },
      { connection }
    );
  });

  res.status(201).json(
    new ApiResponse(201, event, 'Evento creato con successo')
  );
});

/**
 * Recupera lista eventi con filtri
 * @route GET /api/v1/events
 */
export const getEvents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, location, start_date } = req.query;

  // 1. Validazione parametri
  const parsedPage = Math.max(1, parseInt(page));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(limit)) || 10);

  // 2. Ricerca eventi
  const result = await Event.searchEvents(
    { location, start_date },
    { page: parsedPage, limit: parsedLimit }
  );

  res.json(
    new ApiResponse(200, result, 'Lista eventi recuperata')
  );
});

/**
 * Recupera dettaglio singolo evento
 * @route GET /api/v1/events/:id
 */
export const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.getEventById(req.params.id);
  if (!event) throw new ApiError(404, 'Evento non trovato');

  res.json(
    new ApiResponse(200, event, 'Dettagli evento recuperati')
  );
});

/**
 * Modifica evento (solo proprietario)
 * @route PUT /api/v1/events/:id
 */
export const updateEvent = asyncHandler(async (req, res) => {
  // 1. Verifica esistenza evento
  const existingEvent = await Event.getEventById(req.params.id);
  if (!existingEvent) throw new ApiError(404, 'Evento non trovato');

  // 2. Controllo proprietario
  if (existingEvent.organizer_id !== req.user.id) {
    throw new ApiError(403, 'Operazione non autorizzata');
  }

  // 3. Validazione input
  const { error } = eventSchemas.update.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  // 4. Aggiornamento con transazione
  const updatedEvent = await pool.transaction(async (connection) => {
    await Event.updateEvent(req.params.id, req.body, { connection });
    return Event.getEventById(req.params.id, { connection });
  });

  res.json(
    new ApiResponse(200, updatedEvent, 'Evento aggiornato')
  );
});

/**
 * Elimina evento (solo proprietario)
 * @route DELETE /api/v1/events/:id
 */
export const deleteEvent = asyncHandler(async (req, res) => {
  // 1. Verifica esistenza
  const event = await Event.getEventById(req.params.id);
  if (!event) throw new ApiError(404, 'Evento non trovato');

  // 2. Controllo permessi
  if (event.organizer_id !== req.user.id) {
    throw new ApiError(403, 'Operazione non autorizzata');
  }

  // 3. Eliminazione con transazione
  await pool.transaction(async (connection) => {
    await Event.deleteEvent(req.params.id, { connection });
  });

  res.json(
    new ApiResponse(200, null, 'Evento eliminato')
  );
});

// ===============================================
// FUNZIONALITÀ AGGIUNTIVE PER IL PROGETTO 4
// ===============================================

/**
 * Eventi organizzati dall'utente corrente
 * @route GET /api/v1/events/my-events
 */
export const getMyEvents = asyncHandler(async (req, res) => {
  const events = await Event.getEventsByOrganizer(req.user.id);
  res.json(
    new ApiResponse(200, events, 'Eventi personali recuperati')
  );
});

/**
 * Verifica disponibilità biglietti
 * @route POST /api/v1/events/check-availability
 */
export const checkAvailability = asyncHandler(async (req, res) => {
  const { event_id, quantity } = req.body;
  
  // 1. Validazione input
  if (!event_id || !quantity) {
    throw new ApiError(400, 'Specificare event_id e quantity');
  }

  // 2. Verifica disponibilità
  await Event.checkTicketAvailability(event_id, quantity);
  
  res.json(
    new ApiResponse(200, null, 'Biglietti disponibili')
  );
});