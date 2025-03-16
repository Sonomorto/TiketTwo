import { query, transaction } from '../config/db.js'; // Import aggiunto: transaction

// Acquista biglietti (con transazione atomica)
async function createTicket(eventId, userId, quantity) {
  return transaction(async (connection) => {
    // 1. Riduci i posti disponibili
    await connection.query(
      'UPDATE events SET total_tickets = total_tickets - ? WHERE id = ?',
      [quantity, eventId]
    );

    // 2. Crea il ticket
    const [result] = await connection.query(
      'INSERT INTO tickets (event_id, user_id, quantity) VALUES (?, ?, ?)',
      [eventId, userId, quantity]
    );

    return result.insertId;
  });
}

// Ottieni i ticket di un utente con dettagli evento
async function getTicketsByUser(userId) {
  const sql = `
    SELECT t.*, e.title, e.date, e.location 
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    WHERE t.user_id = ?
  `;
  return await query(sql, [userId]);
}

export { createTicket, getTicketsByUser }; // Codice duplicato rimosso