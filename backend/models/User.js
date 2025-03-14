import { query } from '../config/db.js';

// Registra un nuovo utente
async function createUser(name, email, password, role = 'user') {
  const sql = `
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `;
  const result = await query(sql, [name, email, password, role]);
  return result.insertId;
}

// Trova utente per email
async function findUserByEmail(email) {
  const sql = 'SELECT * FROM users WHERE email = ?';
  const [user] = await query(sql, [email]);
  return user;
}

// Ottieni utente per ID
async function getUserById(id) {
  const sql = 'SELECT id, name, email, role FROM users WHERE id = ?';
  const [user] = await query(sql, [id]);
  return user;
}

export { createUser, findUserByEmail, getUserById };