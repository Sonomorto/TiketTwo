import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import { Notification } from '../models/Notification.js';
import { logger } from '../utils/logger.js';

/**
 * @desc    Recupera tutte le notifiche dell'utente
 * @route   GET /api/notifications
 * @access  Privato (Utente/Organizer)
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.getNotificationsByUser(req.user.id);
  
  if (!notifications || notifications.length === 0) {
    throw new ApiError(404, 'Nessuna notifica trovata');
  }

  res.status(200).json(
    new ApiResponse(200, notifications, 'Notifiche recuperate con successo')
  );
});

/**
 * @desc    Crea una nuova notifica (per uso interno/admin)
 * @route   POST /api/notifications
 * @access  Privato (Organizer/Admin)
 */
export const createNotification = asyncHandler(async (req, res) => {
  const { userId, message, type = 'info' } = req.body;

  // Validazione manuale per dimostrazione (in produzione usare Joi)
  if (!userId || !message) {
    throw new ApiError(400, 'UserId e Message sono campi obbligatori');
  }

  const notification = await Notification.createNotification(
    userId,
    message,
    type
  );

  logger.info(`Notifica creata per l'utente ${userId}: ${message}`);
  
  res.status(201).json(
    new ApiResponse(201, notification, 'Notifica creata con successo')
  );
});

/**
 * @desc    Marca una notifica come letta
 * @route   PATCH /api/notifications/:id/read
 * @access  Privato (Utente/Organizer)
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.markAsRead(
    req.params.id,
    req.user.id
  );

  if (!notification) {
    throw new ApiError(404, 'Notifica non trovata o non autorizzati');
  }

  res.json(
    new ApiResponse(200, notification, 'Notifica marcata come letta')
  );
});