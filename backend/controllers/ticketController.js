import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import { Ticket, Event, Notification } from '../models/index.js';
import { ticketSchemas } from '../utils/validationSchemas.js';
import { query, transaction } from '../config/db.js';
import logger from '../utils/logger.js';

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

// Genera codice biglietto univoco
function generateTicketCode() {
  return Math.random().toString().slice(2, 18); // 16 cifre
}

// Lista biglietti utente
export async function getUserTickets(req, res, next) {
  try {
    const { page = 1, limit = 10, stato = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT t.*, 
             e.titolo as evento_titolo,
             e.data_evento,
             e.luogo
      FROM biglietti t
      JOIN eventi e ON t.evento_id = e.id
      WHERE t.utente_id = ?
    `;
    const params = [req.user.id];

    if (stato) {
      sql += ` AND t.stato = ?`;
      params.push(stato);
    }

    sql += ` ORDER BY t.data_acquisto DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const tickets = await query(sql, params);

    // Conta totale biglietti per paginazione
    const [{ total }] = await query(
      'SELECT COUNT(*) as total FROM biglietti WHERE utente_id = ?',
      [req.user.id]
    );

    res.json({
      status: 'success',
      data: {
        tickets,
        pagination: {
          total: parseInt(total),
          page: parseInt(page),
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

// Dettaglio biglietto
export async function getTicket(req, res, next) {
  try {
    const { id } = req.params;

    const tickets = await query(
      `SELECT t.*, 
              e.titolo as evento_titolo,
              e.data_evento,
              e.luogo,
              e.organizzatore_id
       FROM biglietti t
       JOIN eventi e ON t.evento_id = e.id
       WHERE t.id = ? AND (t.utente_id = ? OR e.organizzatore_id = ?)`,
      [id, req.user.id, req.user.id]
    );

    if (tickets.length === 0) {
      throw new ApiError(404, 'Biglietto non trovato o non autorizzato');
    }

    res.json({
      status: 'success',
      data: { ticket: tickets[0] }
    });
  } catch (error) {
    next(error);
  }
}

// Prenota biglietto
export async function bookTicket(req, res, next) {
  try {
    const { evento_id, quantita = 1 } = req.body;

    // Validazione input
    if (!evento_id || quantita <= 0) {
      throw new ApiError(400, 'Parametri non validi');
    }

    // Verifica disponibilità posti
    const events = await query(
      `SELECT e.*, 
              COUNT(t.id) as biglietti_venduti
       FROM eventi e
       LEFT JOIN biglietti t ON e.id = t.evento_id
       WHERE e.id = ? AND e.stato = 'pubblicato'
       GROUP BY e.id`,
      [evento_id]
    );

    if (events.length === 0) {
      throw new ApiError(404, 'Evento non trovato o non disponibile');
    }

    const event = events[0];
    const posti_disponibili = event.posti_disponibili - event.biglietti_venduti;

    if (quantita > posti_disponibili) {
      throw new ApiError(400, 'Posti non sufficienti');
    }

    // Verifica data evento
    const eventDate = new Date(event.data_evento);
    if (eventDate < new Date()) {
      throw new ApiError(400, 'Evento già concluso');
    }

    // Creazione biglietti in transazione
    const tickets = await transaction(async (connection) => {
      const newTickets = [];
      for (let i = 0; i < quantita; i++) {
        const ticketCode = generateTicketCode();
        const [result] = await connection.execute(
          `INSERT INTO biglietti (
            evento_id, utente_id, codice, stato, data_acquisto
          ) VALUES (?, ?, ?, 'attivo', NOW())`,
          [evento_id, req.user.id, ticketCode]
        );
        newTickets.push({
          id: result.insertId,
          codice: ticketCode
        });
      }
      return newTickets;
    });

    logger.info(`Biglietti prenotati: ${quantita} per evento ${evento_id} da ${req.user.email}`);

    res.status(201).json({
      status: 'success',
      message: 'Biglietti prenotati con successo',
      data: { tickets }
    });
  } catch (error) {
    next(error);
  }
}

// Modifica stato biglietto
export async function updateTicketStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { stato } = req.body;

    // Validazione stato
    if (!['attivo', 'utilizzato', 'cancellato'].includes(stato)) {
      throw new ApiError(400, 'Stato non valido');
    }

    // Verifica proprietà biglietto
    const tickets = await query(
      `SELECT t.*, e.organizzatore_id
       FROM biglietti t
       JOIN eventi e ON t.evento_id = e.id
       WHERE t.id = ? AND (t.utente_id = ? OR e.organizzatore_id = ?)`,
      [id, req.user.id, req.user.id]
    );

    if (tickets.length === 0) {
      throw new ApiError(404, 'Biglietto non trovato o non autorizzato');
    }

    const ticket = tickets[0];

    // Verifiche aggiuntive
    if (stato === 'utilizzato' && ticket.stato !== 'attivo') {
      throw new ApiError(400, 'Solo i biglietti attivi possono essere utilizzati');
    }

    if (stato === 'cancellato' && ticket.stato === 'utilizzato') {
      throw new ApiError(400, 'Non è possibile cancellare un biglietto già utilizzato');
    }

    await query(
      'UPDATE biglietti SET stato = ? WHERE id = ?',
      [stato, id]
    );

    logger.info(`Stato biglietto aggiornato: ${id} a ${stato} da ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Stato biglietto aggiornato con successo'
    });
  } catch (error) {
    next(error);
  }
}

// Verifica biglietto
export async function verifyTicket(req, res, next) {
  try {
    const { codice } = req.params;

    const tickets = await query(
      `SELECT t.*, 
              e.titolo as evento_titolo,
              e.data_evento,
              e.luogo,
              e.organizzatore_id
       FROM biglietti t
       JOIN eventi e ON t.evento_id = e.id
       WHERE t.codice = ?`,
      [codice]
    );

    if (tickets.length === 0) {
      throw new ApiError(404, 'Biglietto non trovato');
    }

    const ticket = tickets[0];

    // Verifica autorizzazione
    if (ticket.organizzatore_id !== req.user.id) {
      throw new ApiError(403, 'Non autorizzato a verificare questo biglietto');
    }

    // Verifica stato
    if (ticket.stato !== 'attivo') {
      throw new ApiError(400, `Biglietto ${ticket.stato}`);
    }

    // Verifica data evento
    const eventDate = new Date(ticket.data_evento);
    if (eventDate < new Date()) {
      throw new ApiError(400, 'Evento già concluso');
    }

    res.json({
      status: 'success',
      data: {
        ticket: {
          ...ticket,
          valido: true
        }
      }
    });
  } catch (error) {
    next(error);
  }
}