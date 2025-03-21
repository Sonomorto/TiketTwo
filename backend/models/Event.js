// backend/models/Event.js
import { query } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

// 1. Creazione evento
async function createEvent(eventData, options = {}) {
  const requiredFields = ['title', 'description', 'date', 'location', 'total_tickets', 'price', 'organizer_id'];
  const missingFields = requiredFields.filter(field => !eventData[field]);

  if (missingFields.length > 0) {
    throw new ApiError(400, `Campi mancanti: ${missingFields.join(', ')}`);
  }

  const sql = `
    INSERT INTO events 
    (title, description, date, location, total_tickets, available_tickets, price, organizer_id, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  const values = [
    eventData.title,
    eventData.description,
    new Date(eventData.date),
    eventData.location,
    eventData.total_tickets,
    eventData.total_tickets, // Available tickets inizialmente uguali al totale
    eventData.price,
    eventData.organizer_id,
    eventData.image_url || null
  ];

  const result = await query(sql, values, options);
  return { id: result.insertId, ...eventData };
}

// 2. Recupero evento per ID
async function getEventById(eventId, options = {}) {
  const sql = `
    SELECT e.*, u.name AS organizer_name, 
    COUNT(t.id) AS tickets_sold,
    (e.total_tickets - COUNT(t.id)) AS available_tickets
    FROM events e
    LEFT JOIN tickets t ON e.id = t.event_id
    JOIN users u ON e.organizer_id = u.id
    WHERE e.id = ?
    GROUP BY e.id
  `;
  
  const [event] = await query(sql, [eventId], options);
  return event || null;
}

// 3. Aggiornamento biglietti disponibili
async function updateTicketCount(eventId, quantityDelta, options = {}) {
  const sql = `
    UPDATE events 
    SET available_tickets = GREATEST(0, available_tickets + ?) 
    WHERE id = ?
  `;
  await query(sql, [quantityDelta, eventId], options);
}

// 4. Aggiornamento dati evento
async function updateEvent(eventId, updateData, options = {}) {
  const allowedFields = ['title', 'description', 'date', 'location', 'price', 'image_url'];
  const validUpdates = Object.keys(updateData)
    .filter(key => allowedFields.includes(key))
    .reduce((obj, key) => (obj[key] = updateData[key], obj), {});

  if (Object.keys(validUpdates).length === 0) {
    throw new ApiError(400, 'Nessun campo valido da aggiornare');
  }

  const setClause = Object.keys(validUpdates).map(key => `${key} = ?`).join(', ');
  const sql = `UPDATE events SET ${setClause} WHERE id = ?`;
  const values = [...Object.values(validUpdates), eventId];

  await query(sql, values, options);
  return getEventById(eventId, options);
}

// 5. Eliminazione evento
async function deleteEvent(eventId, options = {}) {
  const sql = 'DELETE FROM events WHERE id = ?';
  await query(sql, [eventId], options);
}

// 6. Ricerca eventi con filtri
async function searchEvents(filters = {}, options = {}) {
  let sql = `
    SELECT e.*, u.name AS organizer_name 
    FROM events e
    JOIN users u ON e.organizer_id = u.id
    WHERE 1=1
  `;
  
  const values = [];
  
  if (filters.title) {
    sql += ' AND e.title LIKE ?';
    values.push(`%${filters.title}%`);
  }
  
  if (filters.location) {
    sql += ' AND e.location LIKE ?';
    values.push(`%${filters.location}%`);
  }
  
  if (filters.start_date) {
    sql += ' AND e.date >= ?';
    values.push(new Date(filters.start_date));
  }
  
  if (filters.end_date) {
    sql += ' AND e.date <= ?';
    values.push(new Date(filters.end_date));
  }

  sql += ' ORDER BY e.date ASC';
  return await query(sql, values, options);
}

// 7. Controllo disponibilità biglietti
async function checkTicketAvailability(eventId, quantity, options = {}) {
  const event = await getEventById(eventId, options);
  if (!event) throw new ApiError(404, 'Evento non trovato');
  if (event.available_tickets < quantity) throw new ApiError(400, 'Biglietti insufficienti');
  return true;
}

// 8. Recupera tutti gli eventi
async function getAllEvents(options = {}) {
  const sql = `
    SELECT e.*, u.name AS organizer_name 
    FROM events e
    JOIN users u ON e.organizer_id = u.id
    ORDER BY e.date DESC
  `;
  return await query(sql, [], options);
}

// 9. Eventi per organizzatore
async function getEventsByOrganizer(organizerId, options = {}) {
  const sql = `
    SELECT e.*, u.name AS organizer_name 
    FROM events e
    JOIN users u ON e.organizer_id = u.id
    WHERE e.organizer_id = ?
    ORDER BY e.date DESC
  `;
  return await query(sql, [organizerId], options);
}

// 10. Paginazione eventi
async function findAllPaginated({ page = 1, limit = 10, filters }, options = {}) {
  const offset = (page - 1) * limit;
  let sql = `
    SELECT SQL_CALC_FOUND_ROWS e.*, u.name AS organizer_name 
    FROM events e
    JOIN users u ON e.organizer_id = u.id
    WHERE 1=1
  `;

  const values = [];
  if (filters?.location) {
    sql += ' AND e.location LIKE ?';
    values.push(`%${filters.location}%`);
  }
  if (filters?.minDate) {
    sql += ' AND e.date >= ?';
    values.push(new Date(filters.minDate));
  }

  sql += ' ORDER BY e.date DESC LIMIT ? OFFSET ?';
  values.push(limit, offset);

  const [data] = await query(sql, values, options);
  const [[total]] = await query('SELECT FOUND_ROWS() AS total', [], options);

  return {
    data,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total: total.total
    }
  };
}

export { 
  createEvent,
  getAllEvents,
  getEventById,
  updateTicketCount,
  getEventsByOrganizer,
  updateEvent,
  deleteEvent,
  searchEvents,
  checkTicketAvailability,
  findAllPaginated
};