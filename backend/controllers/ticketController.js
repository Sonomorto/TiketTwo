import { query } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Acquisto biglietti
export const purchaseTicket = async (req, res) => {
  const { eventId, quantity } = req.body;
  const userId = req.user.id;

  try {
    // Transazione per atomicità
    await query('START TRANSACTION');

    // Verifica disponibilità biglietti
    const [event] = await query('SELECT total_tickets FROM events WHERE id = ? FOR UPDATE', [eventId]);
    if (event.total_tickets < quantity) {
      await query('ROLLBACK');
      return res.status(400).json({ message: 'Biglietti insufficienti' });
    }

    // Aggiorna disponibilità
    await query('UPDATE events SET total_tickets = ? WHERE id = ?', [
      event.total_tickets - quantity, 
      eventId
    ]);

    // Crea biglietto
    await query(
      'INSERT INTO tickets (event_id, user_id, quantity) VALUES (?, ?, ?)',
      [eventId, userId, quantity]
    );

    // Crea notifica
    await query(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, ?)',
      [userId, `Hai acquistato ${quantity} biglietto/i per l'evento ${eventId}`, 'purchase']
    );

    await query('COMMIT');
    res.json({ message: 'Acquisto completato' });

  } catch (error) {
    await query('ROLLBACK');
    logger.error('Errore nell\'acquisto biglietti:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};

// Cancella biglietto
export const cancelTicket = async (req, res) => {
  const ticketId = req.params.id;
  const userId = req.user.id;

  try {
    const [ticket] = await query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (!ticket || ticket.user_id !== userId) {
      return res.status(404).json({ message: 'Biglietto non trovato' });
    }

    await query('DELETE FROM tickets WHERE id = ?', [ticketId]);
    res.json({ message: 'Biglietto cancellato' });
  } catch (error) {
    logger.error('Errore nella cancellazione biglietto:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};