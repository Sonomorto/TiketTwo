// backend/controllers/notificationController.js
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';
import { query } from '../config/db.js';

/**
 * @route   GET /api/v1/notifications
 * @desc    Recupera tutte le notifiche dell'utente
 * @access  Privato (Utente/Organizer)
 */
export const getNotifications = asyncHandler(async (req, res) => {
  // 1. Recupera notifiche dal modello
  const notifications = await Notification.getNotificationsByUser(req.user.id);
  
  // 2. Gestione caso "nessun risultato"
  if (notifications.length === 0) {
    return res.json(
      new ApiResponse(200, [], 'Nessuna notifica presente')
    );
  }

  // 3. Risposta strutturata
  res.json(
    new ApiResponse(200, notifications, 'Notifiche recuperate con successo')
  );
});

/**
 * @route   POST /api/v1/notifications
 * @desc    Crea una nuova notifica (per admin/organizer)
 * @access  Privato (Organizer/Admin)
 */
export const createNotification = asyncHandler(async (req, res) => {
  // 1. Validazione input
  const { userId, message, type = 'info' } = req.body;
  
  if (!userId || !message) {
    throw new ApiError(400, 'I campi userId e message sono obbligatori');
  }

  // 2. Creazione notifica
  const notification = await Notification.createNotification(
    userId,
    message,
    type
  );

  // 3. Log attività
  logger.info(`Notifica creata - ID: ${notification.id}`, {
    userId: req.user.id,
    targetUser: userId
  });

  // 4. Risposta
  res.status(201).json(
    new ApiResponse(201, notification, 'Notifica creata con successo')
  );
});

/**
 * @route   PATCH /api/v1/notifications/:id/read
 * @desc    Marca una notifica come letta
 * @access  Privato (Utente/Organizer)
 */
export const markAsRead = asyncHandler(async (req, res) => {
  // 1. Verifica esistenza notifica
  const success = await Notification.markAsRead(
    req.params.id,
    req.user.id
  );

  if (!success) {
    throw new ApiError(404, 'Notifica non trovata o non autorizzati');
  }

  // 2. Log attività
  logger.info(`Notifica letta - ID: ${req.params.id}`, {
    userId: req.user.id
  });

  // 3. Risposta
  res.json(
    new ApiResponse(200, null, 'Notifica marcata come letta')
  );
});

// Lista notifiche utente
export async function getUserNotifications(req, res, next) {
  try {
    const { page = 1, limit = 10, non_lette = false } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT n.*, 
             e.titolo as evento_titolo,
             e.id as evento_id
      FROM notifiche n
      LEFT JOIN eventi e ON n.evento_id = e.id
      WHERE n.utente_id = ?
    `;
    const params = [req.user.id];

    if (non_lette) {
      sql += ` AND n.letta = false`;
    }

    sql += ` ORDER BY n.data_creazione DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const notifications = await query(sql, params);

    // Conta totale notifiche per paginazione
    const [{ total }] = await query(
      'SELECT COUNT(*) as total FROM notifiche WHERE utente_id = ?',
      [req.user.id]
    );

    res.json({
      status: 'success',
      data: {
        notifications,
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

// Dettaglio notifica
export async function getNotification(req, res, next) {
  try {
    const { id } = req.params;

    const notifications = await query(
      `SELECT n.*, 
              e.titolo as evento_titolo,
              e.id as evento_id
       FROM notifiche n
       LEFT JOIN eventi e ON n.evento_id = e.id
       WHERE n.id = ? AND n.utente_id = ?`,
      [id, req.user.id]
    );

    if (notifications.length === 0) {
      throw new ApiError(404, 'Notifica non trovata');
    }

    res.json({
      status: 'success',
      data: { notification: notifications[0] }
    });
  } catch (error) {
    next(error);
  }
}

// Marca notifica come letta
export async function markAsRead(req, res, next) {
  try {
    const { id } = req.params;

    // Verifica proprietà notifica
    const notifications = await query(
      'SELECT * FROM notifiche WHERE id = ? AND utente_id = ?',
      [id, req.user.id]
    );

    if (notifications.length === 0) {
      throw new ApiError(404, 'Notifica non trovata');
    }

    await query(
      'UPDATE notifiche SET letta = true, data_lettura = NOW() WHERE id = ?',
      [id]
    );

    logger.info(`Notifica ${id} marcata come letta da ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Notifica marcata come letta'
    });
  } catch (error) {
    next(error);
  }
}

// Marca tutte le notifiche come lette
export async function markAllAsRead(req, res, next) {
  try {
    await query(
      'UPDATE notifiche SET letta = true, data_lettura = NOW() WHERE utente_id = ? AND letta = false',
      [req.user.id]
    );

    logger.info(`Tutte le notifiche marcate come lette da ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Tutte le notifiche marcate come lette'
    });
  } catch (error) {
    next(error);
  }
}

// Elimina notifica
export async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;

    // Verifica proprietà notifica
    const notifications = await query(
      'SELECT * FROM notifiche WHERE id = ? AND utente_id = ?',
      [id, req.user.id]
    );

    if (notifications.length === 0) {
      throw new ApiError(404, 'Notifica non trovata');
    }

    await query('DELETE FROM notifiche WHERE id = ?', [id]);

    logger.info(`Notifica ${id} eliminata da ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Notifica eliminata con successo'
    });
  } catch (error) {
    next(error);
  }
}

// Elimina tutte le notifiche lette
export async function deleteAllRead(req, res, next) {
  try {
    await query(
      'DELETE FROM notifiche WHERE utente_id = ? AND letta = true',
      [req.user.id]
    );

    logger.info(`Tutte le notifiche lette eliminate da ${req.user.email}`);

    res.json({
      status: 'success',
      message: 'Tutte le notifiche lette eliminate con successo'
    });
  } catch (error) {
    next(error);
  }
}

// Crea notifica (funzione interna)
export async function createNotification(userId, type, message, eventId = null) {
  try {
    const result = await query(
      `INSERT INTO notifiche (
        utente_id, tipo, messaggio, evento_id, data_creazione
      ) VALUES (?, ?, ?, ?, NOW())`,
      [userId, type, message, eventId]
    );

    logger.info(`Notifica creata per utente ${userId}: ${message}`);

    return result.insertId;
  } catch (error) {
    logger.error('Errore nella creazione della notifica:', error.message);
    throw error;
  }
}