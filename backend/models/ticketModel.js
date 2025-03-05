import pool from '../config/db.js';

export const createTicket = async (ticketData) => {
    const { event_id, user_id, quantity } = ticketData;
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Verifica disponibilità posti
        const [event] = await connection.query(
            'SELECT available_seats FROM events WHERE id = ? FOR UPDATE',
            [event_id]
        );
        
        if (!event.length) throw new Error('EVENT_NOT_FOUND');
        if (event[0].available_seats < quantity) throw new Error('NOT_ENOUGH_SEATS');

        // 2. Crea biglietto
        const [ticketResult] = await connection.query(
            'INSERT INTO tickets (event_id, user_id, quantity) VALUES (?, ?, ?)',
            [event_id, user_id, quantity]
        );

        // 3. Aggiorna posti disponibili
        await connection.query(
            'UPDATE events SET available_seats = available_seats - ? WHERE id = ?',
            [quantity, event_id]
        );

        await connection.commit();
        return ticketResult.insertId;

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

export const getTicketsByUser = async (userId) => {
    const [rows] = await pool.query(
        `SELECT t.*, e.title, e.date 
         FROM tickets t
         JOIN events e ON t.event_id = e.id
         WHERE t.user_id = ?`,
        [userId]
    );
    return rows;
};

export const cancelTicket = async (ticketId, userId) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();

        // 1. Recupera quantità ed event_id
        const [ticket] = await connection.query(
            'SELECT event_id, quantity FROM tickets WHERE id = ? AND user_id = ?',
            [ticketId, userId]
        );
        if (!ticket.length) throw new Error('TICKET_NOT_FOUND');

        // 2. Elimina biglietto
        await connection.query(
            'DELETE FROM tickets WHERE id = ?',
            [ticketId]
        );

        // 3. Rimborsa posti
        await connection.query(
            'UPDATE events SET available_seats = available_seats + ? WHERE id = ?',
            [ticket[0].quantity, ticket[0].event_id]
        );

        await connection.commit();
        return true;

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};