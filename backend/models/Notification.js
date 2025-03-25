// models/Notification.js
import { query } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';

// Costanti per la validazione
const ALLOWED_TYPES = ['info', 'warning', 'alert'];
const MAX_MESSAGE_LENGTH = 500;

// ===============================================
// FUNZIONALITÀ PRINCIPALI
// ===============================================

/**
 * Crea una notifica nel database
 * @param {number} userId - ID dell'utente destinatario
 * @param {string} message - Contenuto della notifica (max 500 caratteri)
 * @param {string} [type='info'] - Tipo di notifica (info/warning/alert)
 */
async function createNotification(userId, message, type = 'info') {
  // Validazione input
  if (!userId || !message) {
    throw new ApiError(400, 'ID utente e messaggio sono obbligatori');
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new ApiError(400, `Il messaggio non può superare ${MAX_MESSAGE_LENGTH} caratteri`);
  }

  if (!ALLOWED_TYPES.includes(type)) {
    throw new ApiError(400, 'Tipo di notifica non valido');
  }

  // Inserimento nel database
  const [result] = await query(
    `INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)`,
    [userId, message, type]
  );

  return { 
    id: result.insertId,
    user_id: userId,
    message,
    type,
    is_read: false,
    created_at: new Date().toISOString()
  };
}

/**
 * Recupera le notifiche di un utente
 * @param {number} userId - ID dell'utente
 * @param {object} [options] - Opzioni di paginazione
 * @param {number} [options.page=1] - Pagina corrente
 * @param {number} [options.limit=10] - Risultati per pagina
 */
async function getNotificationsByUser(userId, options = {}) {
  const { page = 1, limit = 10 } = options;
  const offset = (page - 1) * limit;

  const [notifications] = await query(
    `SELECT * FROM notifications 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );

  return notifications;
}

/**
 * Marca una notifica come letta
 * @param {number} notificationId - ID della notifica
 * @param {number} userId - ID dell'utente (per sicurezza)
 */
async function markAsRead(notificationId, userId) {
  const [result] = await query(
    `UPDATE notifications 
     SET is_read = TRUE 
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );

  if (result.affectedRows === 0) {
    throw new ApiError(404, 'Notifica non trovata o non autorizzati');
  }

  return true;
}

// ===============================================
// EXPORT DEFAULT PER IL MODELLO
// ===============================================
export default {
  createNotification,
  getNotificationsByUser,
  markAsRead
};