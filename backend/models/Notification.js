import { query } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js'; // Import aggiunto

// Tipi di notifica consentiti
const ALLOWED_NOTIFICATION_TYPES = ['info', 'warning', 'alert'];

// Crea una notifica
async function createNotification(userId, message, type) {
  // Validazione del tipo di notifica
  if (!ALLOWED_NOTIFICATION_TYPES.includes(type)) {
    throw new ApiError(400, 'Tipo di notifica non valido');
  }

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