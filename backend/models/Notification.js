import { query } from '../config/db.js';

// Crea una notifica
async function createNotification(userId, message, type) {
  const sql = `
    INSERT INTO notifications (user_id, message, type)
    VALUES (?, ?, ?)
  `;
  const result = await query(sql, [userId, message, type]);
  return result.insertId;
}

// Ottieni notifiche per utente
async function getNotificationsByUser(userId) {
  const sql = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC';
  return await query(sql, [userId]);
}

export { createNotification, getNotificationsByUser };