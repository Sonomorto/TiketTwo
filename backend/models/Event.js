import { query } from '../config/db.js';

// Crea un nuovo evento (con validazione base)
async function createEvent(
  organizerId,
  title,
  description,
  date,
  location,
  totalTickets,
  price,
  imageUrl
) {
  // Validazione input minimale
  if (totalTickets <= 0) throw new Error('totalTickets deve essere un numero positivo');
  if (new Date(date) < new Date()) throw new Error('La data non può essere nel passato');

  const sql = `
    INSERT INTO events (
      organizer_id, title, description, date,
      location, total_tickets, price, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const result = await query(sql, [
    organizerId, title, description, date,
    location, totalTickets, price, imageUrl
  ]);
  return result.insertId;
}

// Ottieni tutti gli eventi pubblici con nome organizzatore
async function getAllEvents() {
  const sql = `
    SELECT e.*, u.name AS organizer_name 
    FROM events e
    JOIN users u ON e.organizer_id = u.id
    WHERE u.name IS NOT NULL -- Assicura che la colonna 'name' esista in 'users'
  `;
  return await query(sql);
}

// Ottieni evento per ID con dettagli organizzatore
async function getEventById(id) {
  const sql = `
    SELECT e.*, u.name AS organizer_name 
    FROM events e
    JOIN users u ON e.organizer_id = u.id
    WHERE e.id = ?
  `;
  const [event] = await query(sql, [id]);
  return event;
}

// Aggiorna il conteggio dei biglietti (usato in ticketController.js)
async function updateTicketCount(eventId, delta) {
  const sql = 'UPDATE events SET total_tickets = total_tickets + ? WHERE id = ?';
  await query(sql, [delta, eventId]);
}

export { createEvent, getAllEvents, getEventById, updateTicketCount };