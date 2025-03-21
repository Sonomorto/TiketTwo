// models/User.js
import { query } from '../config/db.js';
import { ApiError } from '../utils/apiResponse.js';
import Joi from 'joi';

// Schema Joi per la validazione degli utenti
const userSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('user', 'organizer').default('user')
});

// ===============================================
// FUNZIONALITÀ PRINCIPALI PER IL PROGETTO 4
// ===============================================

/**
 * Crea un nuovo utente (ruolo 'user' di default)
 * @param {Object} userData - Dati utente
 * @returns {Promise<Object>} Utente creato
 */
async function createUser(userData) {
  // Validazione input con Joi
  const { error } = userSchema.validate(userData);
  if (error) throw new ApiError(400, error.details[0].message);

  // Controllo ruolo per registrazioni pubbliche
  if (userData.role && userData.role !== 'user') {
    throw new ApiError(403, 'Solo gli amministratori possono creare account organizer');
  }

  // Query SQL per creazione utente
  const sql = `INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)`;
  const [result] = await query(sql, [
    userData.name,
    userData.email,
    userData.password,
    userData.role || 'user'
  ]);

  return { 
    id: result.insertId,
    ...userData,
    password: undefined // Rimuove la password dalla risposta
  };
}

/**
 * Trova utente per email (login)
 * @param {string} email - Email da cercare
 * @returns {Promise<Object|null>} Utente o null
 */
async function findByEmail(email) {
  const sql = 'SELECT * FROM users WHERE email = ?';
  const [rows] = await query(sql, [email]);
  return rows[0] || null;
}

/**
 * Ottieni utente per ID (senza password)
 * @param {number} id - ID utente
 * @returns {Promise<Object|null>} Dati utente
 */
async function findById(id) {
  const sql = `SELECT id, name, email, role, created_at FROM users WHERE id = ?`;
  const [rows] = await query(sql, [id]);
  return rows[0] || null;
}

// ===============================================
// EXPORT DEFAULT PER IL PROGETTO 4
// ===============================================
export default {
  createUser,
  findByEmail,
  findById
};