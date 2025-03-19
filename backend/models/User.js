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

// Crea un nuovo utente (ruolo 'user' di default)
async function createUser(userData) {
  // Validazione input con Joi
  const { error } = userSchema.validate(userData);
  if (error) throw new ApiError(400, error.details[0].message);

  // Blocca registrazioni dirette come organizer
  if (userData.role && userData.role !== 'user') {
    throw new ApiError(403, 
      'Solo gli amministratori possono creare account organizer'
    );
  }

  // Hash password (già gestito nel controller)
  const sql = `
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, ?)
  `;
  
  const result = await query(sql, [
    userData.name,
    userData.email,
    userData.password,
    userData.role || 'user' // Forza 'user' se non specificato
  ]);

  return result.insertId;
}

// Trova utente per email (usato per il login)
async function findUserByEmail(email) {
  const sql = 'SELECT * FROM users WHERE email = ?';
  const [user] = await query(sql, [email]);
  return user;
}

// Ottieni utente per ID (esclude la password)
async function getUserById(id) {
  const sql = `
    SELECT id, name, email, role, created_at 
    FROM users WHERE id = ?
  `;
  const [user] = await query(sql, [id]);
  return user;
}

// Funzione per admin: crea organizer
async function createOrganizerByAdmin(adminId, userData) {
  // Verifica privilegi admin (da implementare altrove)
  const isAdmin = await checkAdminPrivileges(adminId);
  if (!isAdmin) throw new ApiError(403, 'Operazione non autorizzata');

  const sql = `
    INSERT INTO users (name, email, password, role)
    VALUES (?, ?, ?, 'organizer')
  `;
  
  const result = await query(sql, [
    userData.name,
    userData.email,
    userData.password
  ]);

  return result.insertId;
}

export { 
  createUser,
  findUserByEmail,
  getUserById,
  createOrganizerByAdmin 
};