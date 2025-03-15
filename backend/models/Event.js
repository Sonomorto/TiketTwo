import { query } from '../config/db.js';

// Crea un nuovo evento
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

// Ottieni tutti gli eventi pubblici
async function getAllEvents() {
  const sql = `
    SELECT e.*, u.name AS organizer_name 
    FROM events e
    JOIN users u ON e.organizer_id = u.id
  `;
  return await query(sql);
}

// Ottieni evento per ID
async function getEventById(id) {
  const sql = 'SELECT * FROM events WHERE id = ?';
  const [event] = await query(sql, [id]);
  return event;
}

export { createEvent, getAllEvents, getEventById };