import { query } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Crea un evento (solo organizzatori)
export const createEvent = async (req, res) => {
  const { title, description, date, location, total_tickets, price, image_url } = req.body;
  const organizerId = req.user.id;

  try {
    const result = await query(
      `INSERT INTO events 
      (organizer_id, title, description, date, location, total_tickets, price, image_url) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [organizerId, title, description, date, location, total_tickets, price, image_url]
    );

    res.status(201).json({ 
      id: result.insertId, 
      message: 'Evento creato con successo' 
    });

  } catch (error) {
    logger.error('Errore nella creazione evento:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};

// Lista eventi pubblici
export const getEvents = async (req, res) => {
  try {
    const events = await query(`
      SELECT e.*, u.name AS organizer_name 
      FROM events e
      JOIN users u ON e.organizer_id = u.id
      WHERE e.date > NOW()
    `);

    res.json(events);
  } catch (error) {
    logger.error('Errore nel recupero eventi:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};

// Modifica evento (solo proprietario)
export const updateEvent = async (req, res) => {
  const eventId = req.params.id;
  const { title, description, date, location, total_tickets, price } = req.body;

  try {
    // Verifica proprietario
    const [event] = await query('SELECT organizer_id FROM events WHERE id = ?', [eventId]);
    if (event.organizer_id !== req.user.id) {
      return res.status(403).json({ message: 'Non autorizzato' });
    }

    await query(
      `UPDATE events 
      SET title = ?, description = ?, date = ?, location = ?, total_tickets = ?, price = ? 
      WHERE id = ?`,
      [title, description, date, location, total_tickets, price, eventId]
    );

    res.json({ message: 'Evento aggiornato' });
  } catch (error) {
    logger.error('Errore nell\'aggiornamento evento:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};