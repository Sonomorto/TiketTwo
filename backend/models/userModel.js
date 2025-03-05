// models/userModel.js
import pool from '../config/db.js';

export const findUserById = async (id) => {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
}

export const createUser = async (userData) => {
    const { name, email, password, role } = userData;
    
    // Controlla se l'email è già registrata
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
        throw new Error('EMAIL_EXISTS'); // Codice errore personalizzato
    }

    // Crea l'utente se non esiste
    const [result] = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, password, role]
    );
    
    return result.insertId;
};