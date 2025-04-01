// backend/controllers/eventController.js
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import { Event } from '../models/index.js';
import { eventSchemas } from '../utils/validationSchemas.js'; // Import corretto
import { pool } from '../config/db.js';
import { query, transaction } from '../config/db.js';
import logger from '../utils/logger.js';

// ===============================================
// FUNZIONALITÀ PRINCIPALI PER LA GESTIONE EVENTI
// ===============================================

/**
 * Crea un nuovo evento (solo organizzatori)
 * @route POST /api/v1/events
 */
export const createEvent = asyncHandler(async (req, res) => {
  try {
    const {
      titolo,
      descrizione,
      data_evento,
      luogo,
      prezzo,
      posti_disponibili,
      categoria,
      immagine_url
    } = req.body;

    // Validazione input
    if (!titolo || !descrizione || !data_evento || !luogo || !prezzo || !posti_disponibili) {
      throw new ApiError(400, 'Tutti i campi obbligatori devono essere compilati');
    }

    // Validazione data
    const eventDate = new Date(data_evento);
    if (eventDate < new Date()) {
      throw new ApiError(400, 'La data dell\'evento deve essere futura');
    }

    // Validazione prezzo e posti
    if (prezzo < 0 || posti_disponibili <= 0) {
      throw new ApiError(400, 'Prezzo e posti disponibili devono essere positivi');
    }

    const result = await query(
      `INSERT INTO eventi (
        titolo, descrizione, data_evento, luogo, prezzo,
        posti_disponibili, categoria, immagine_url, organizzatore_id, stato
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        titolo, descrizione, data_evento, luogo, prezzo,
        posti_disponibili, categoria, immagine_url, req.user.id, 'bozza'
      ]
    );

    logger.info(`Nuovo evento creato: ${titolo} da ${req.user.email}`);

    res.status(201).json({
      status: 'success',
      message: 'Evento creato con successo',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Recupera lista eventi con filtri
 * @route GET /api/v1/events
 */
export const getEvents = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', categoria = '' } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT e.*, 
           u.nome as organizzatore_nome,
           u.cognome as organizzatore_cognome,
           COUNT(DISTINCT t.id) as biglietti_venduti
    FROM eventi e
    LEFT JOIN utenti u ON e.organizzatore_id = u.id
    LEFT JOIN biglietti t ON e.id = t.evento_id
    WHERE e.stato = 'pubblicato'
  `;
  const params = [];

  if (search) {
    sql += ` AND (e.titolo LIKE ? OR e.descrizione LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (categoria) {
    sql += ` AND e.categoria = ?`;
    params.push(categoria);
  }

  sql += ` GROUP BY e.id ORDER BY e.data_evento DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  const events = await query(sql, params);

  // Conta totale eventi per paginazione
  const [{ total }] = await query(
    'SELECT COUNT(*) as total FROM eventi WHERE stato = ?',
    ['pubblicato']
  );

  res.json({
    status: 'success',
    data: {
      events,
      pagination: {
        total: parseInt(total),
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    }
  });
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
  try {
    const { id } = req.params;
    const {
      titolo,
      descrizione,
      data_evento,
      luogo,
      prezzo,
      posti_disponibili,
      categoria,
      immagine_url,
      stato
    } = req.body;

    // Verifica proprietà evento
    const events = await query(
      'SELECT * FROM eventi WHERE id = ? AND organizzatore_id = ?',
      [id, req.user.id]
    );

    if (events.length === 0) {
      throw new ApiError(404, 'Evento non trovato o non autorizzato');
    }

    const event = events[0];

    // Validazione stato
    if (stato && !['bozza', 'pubblicato', 'cancellato'].includes(stato)) {
      throw new ApiError(400, 'Stato non valido');
    }

    // Validazione data
    if (data_evento) {
      const eventDate = new Date(data_evento);
      if (eventDate < new Date()) {
        throw new ApiError(400, 'La data dell\'evento deve essere futura');
      }
    }

    // Validazione posti
    if (posti_disponibili) {
      const [{ biglietti_venduti }] = await query(
        'SELECT COUNT(*) as biglietti_venduti FROM biglietti WHERE evento_id = ?',
        [id]
      );

      if (posti_disponibili < biglietti_venduti) {
        throw new ApiError(400, 'Non è possibile ridurre i posti sotto il numero di biglietti già venduti');
      }
    }

    await query(
      `UPDATE eventi SET 
        titolo = COALESCE(?, titolo),
        descrizione = COALESCE(?, descrizione),
        data_evento = COALESCE(?, data_evento),
        luogo = COALESCE(?, luogo),
        prezzo = COALESCE(?, prezzo),
        posti_disponibili = COALESCE(?, posti_disponibili),
        categoria = COALESCE(?, categoria),
        immagine_url = COALESCE(?, immagine_url),
        stato = COALESCE(?, stato)
      WHERE id = ?`,
      [
        titolo, descrizione, data_evento, luogo, prezzo,
        posti_disponibili, categoria, immagine_url, stato, id
      ]
    );

    logger.info(`Evento aggiornato: ${id} da ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Evento aggiornato con successo'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Elimina evento (solo proprietario)
 * @route DELETE /api/v1/events/:id
 */
export const deleteEvent = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica proprietà evento
    const events = await query(
      'SELECT * FROM eventi WHERE id = ? AND organizzatore_id = ?',
      [id, req.user.id]
    );

    if (events.length === 0) {
      throw new ApiError(404, 'Evento non trovato o non autorizzato');
    }

    // Verifica biglietti venduti
    const [{ biglietti_venduti }] = await query(
      'SELECT COUNT(*) as biglietti_venduti FROM biglietti WHERE evento_id = ?',
      [id]
    );

    if (biglietti_venduti > 0) {
      throw new ApiError(400, 'Non è possibile eliminare un evento con biglietti già venduti');
    }

    await query('DELETE FROM eventi WHERE id = ?', [id]);

    logger.info(`Evento eliminato: ${id} da ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Evento eliminato con successo'
    });
  } catch (error) {
    next(error);
  }
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