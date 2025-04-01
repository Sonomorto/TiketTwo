// controllers/authController.js
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import User from '../models/User.js'; // Import default corretto
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../config/jwt.js';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import { query } from '../config/db.js';
import logger from '../utils/logger.js';

// Schema Joi per la registrazione (senza campo 'role')
const registerSchema = Joi.object({
  name: Joi.string().min(3).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

// Schema Joi per il login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Registrazione utente
export async function register(req, res, next) {
  try {
    const { email, password, nome, cognome, ruolo } = req.body;

    // Validazione input
    if (!email || !password || !nome || !cognome) {
      throw new ApiError(400, 'Tutti i campi sono obbligatori');
    }

    // Verifica email già esistente
    const existingUser = await query(
      'SELECT id FROM utenti WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      throw new ApiError(409, 'Email già registrata');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Inserimento utente
    const result = await query(
      'INSERT INTO utenti (email, password, nome, cognome, ruolo) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, nome, cognome, ruolo || 'utente']
    );

    logger.info(`Nuovo utente registrato: ${email}`);

    res.status(201).json({
      status: 'success',
      message: 'Utente registrato con successo',
      data: { id: result.insertId }
    });
  } catch (error) {
    next(error);
  }
}

// Login utente
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Validazione input
    if (!email || !password) {
      throw new ApiError(400, 'Email e password sono obbligatori');
    }

    // Verifica utente
    const users = await query(
      'SELECT * FROM utenti WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      throw new ApiError(401, 'Credenziali non valide');
    }

    const user = users[0];

    // Verifica password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new ApiError(401, 'Credenziali non valide');
    }

    // Genera token
    const token = generateToken({ 
      id: user.id, 
      email: user.email,
      ruolo: user.ruolo 
    });

    // Genera refresh token
    const refreshToken = generateRefreshToken({ 
      id: user.id 
    });

    // Aggiorna refresh token nel database
    await query(
      'UPDATE utenti SET refresh_token = ? WHERE id = ?',
      [refreshToken, user.id]
    );

    logger.info(`Utente loggato: ${email}`);

    res.json({
      status: 'success',
      data: {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          nome: user.nome,
          cognome: user.cognome,
          ruolo: user.ruolo
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

// Refresh token
export async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'Refresh token mancante');
    }

    // Verifica refresh token
    const decoded = verifyRefreshToken(refreshToken);

    // Verifica refresh token nel database
    const users = await query(
      'SELECT * FROM utenti WHERE id = ? AND refresh_token = ?',
      [decoded.id, refreshToken]
    );

    if (users.length === 0) {
      throw new ApiError(401, 'Refresh token non valido');
    }

    const user = users[0];

    // Genera nuovo token
    const newToken = generateToken({ 
      id: user.id, 
      email: user.email,
      ruolo: user.ruolo 
    });

    // Genera nuovo refresh token
    const newRefreshToken = generateRefreshToken({ 
      id: user.id 
    });

    // Aggiorna refresh token nel database
    await query(
      'UPDATE utenti SET refresh_token = ? WHERE id = ?',
      [newRefreshToken, user.id]
    );

    res.json({
      status: 'success',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
}

// Logout
export async function logout(req, res, next) {
  try {
    const userId = req.user.id;

    // Rimuovi refresh token
    await query(
      'UPDATE utenti SET refresh_token = NULL WHERE id = ?',
      [userId]
    );

    logger.info(`Utente disconnesso: ${userId}`);

    res.json({
      status: 'success',
      message: 'Logout effettuato con successo'
    });
  } catch (error) {
    next(error);
  }
}