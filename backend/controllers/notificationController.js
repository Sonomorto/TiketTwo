// backend/controllers/notificationController.js
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import Notification from '../models/Notification.js';
import logger from '../utils/logger.js';

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