import { query } from '../config/db.js';

// Acquista biglietti
async function createTicket(eventId, userId, quantity) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

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

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Ottieni i ticket di un utente
async function getTicketsByUser(userId) {
  const sql = `
    SELECT t.*, e.title, e.date, e.location 
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    WHERE t.user_id = ?
  `;
  return await query(sql, [userId]);
}

export { createTicket, getTicketsByUser };import { query } from '../config/db.js';

// Acquista biglietti
async function createTicket(eventId, userId, quantity) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

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

    await connection.commit();
    return result.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Ottieni i ticket di un utente
async function getTicketsByUser(userId) {
  const sql = `
    SELECT t.*, e.title, e.date, e.location 
    FROM tickets t
    JOIN events e ON t.event_id = e.id
    WHERE t.user_id = ?
  `;
  return await query(sql, [userId]);
}

export { createTicket, getTicketsByUser };