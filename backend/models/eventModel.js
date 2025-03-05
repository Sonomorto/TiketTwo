import pool from '../config/db.js';

export const createEvent = async (eventData) => {
    const { title, description, date, location, available_seats, price, organizer_id } = eventData;
    
    // Verifica che l'organizzatore esista
    const [organizer] = await pool.query('SELECT id FROM users WHERE id = ? AND role = "organizer"', [organizer_id]);
    if (!organizer.length) {
        throw new Error('ORGANIZER_NOT_FOUND');
    }

    const [result] = await pool.query(
        `INSERT INTO events 
        (title, description, date, location, available_seats, price, organizer_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [title, description, date, location, available_seats, price, organizer_id]
    );
    return result.insertId;
};

export const getEvents = async (filters = {}) => {
    let query = 'SELECT * FROM events WHERE 1=1';
    const params = [];

    // Filtri dinamici
    if (filters.organizer_id) {
        query += ' AND organizer_id = ?';
        params.push(filters.organizer_id);
    }
    if (filters.min_date) {
        query += ' AND date >= ?';
        params.push(filters.min_date);
    }

    const [rows] = await pool.query(query, params);
    return rows;
};

export const updateEvent = async (eventId, organizerId, updateData) => {
    // Verifica proprietà dell'evento
    const [event] = await pool.query('SELECT id FROM events WHERE id = ? AND organizer_id = ?', [eventId, organizerId]);
    if (!event.length) throw new Error('EVENT_NOT_FOUND_OR_UNAUTHORIZED');

    const [result] = await pool.query(
        'UPDATE events SET ? WHERE id = ?',
        [updateData, eventId]
    );
    return result.affectedRows;
};

export const deleteEvent = async (eventId, organizerId) => {
    const [result] = await pool.query(
        'DELETE FROM events WHERE id = ? AND organizer_id = ?',
        [eventId, organizerId]
    );
    if (result.affectedRows === 0) throw new Error('EVENT_NOT_FOUND_OR_UNAUTHORIZED');
    return true;
};