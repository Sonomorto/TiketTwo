import { query } from '../config/db.js';

// Metodi esistenti + nuovo metodo per "I miei eventi"
async function getEventsByOrganizer(organizerId) {
  const sql = 'SELECT * FROM events WHERE organizer_id = ?';
  return await query(sql, [organizerId]);
}

// Modifica alla query getAllEvents (rimossa clausola non necessaria)
async function getAllEvents() {
  const sql = `
    SELECT e.*, u.name AS organizer_name 
    FROM events e
    JOIN users u ON e.organizer_id = u.id
  `;
  return await query(sql);
}

export { 
  createEvent, 
  getAllEvents, 
  getEventById, 
  updateTicketCount,
  getEventsByOrganizer // Esportazione aggiunta
};