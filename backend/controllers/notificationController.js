import { query } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Recupera notifiche utente
export const getNotifications = async (req, res) => {
  const userId = req.user.id;

  try {
    const notifications = await query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json(notifications);
  } catch (error) {
    logger.error('Errore nel recupero notifiche:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};