import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import { query } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Recupera notifiche utente
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const notifications = await query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );

  if (!notifications || notifications.length === 0) {
    throw new ApiError(404, 'Nessuna notifica trovata');
  }

  res.status(200).json(
    new ApiResponse(200, notifications, 'Notifiche recuperate con successo')
  );
});