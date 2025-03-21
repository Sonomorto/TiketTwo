// backend/routes/authRoutes.js
import express from 'express';
import { validate } from '../utils/validationSchemas.js';
import { authSchemas } from '../utils/validationSchemas.js';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

/**
 * @route POST /api/v1/auth/register
 * @desc Registra un nuovo utente (ruolo 'user' di default)
 * @access Public
 * @param {string} name - Nome utente
 * @param {string} email - Email valida
 * @param {string} password - Password (8+ caratteri, 1 maiuscola, 1 numero, 1 carattere speciale)
 */
router.post(
  '/register',
  validate(authSchemas.register, 'body'), // Valida body con schema Joi
  register // Controller per la registrazione
);

/**
 * @route POST /api/v1/auth/login
 * @desc Effettua il login per utenti/organizzatori
 * @access Public
 * @param {string} email - Email registrata
 * @param {string} password - Password corrispondente
 */
router.post(
  '/login',
  validate(authSchemas.login, 'body'), // Valida body con schema Joi
  login // Controller per il login
);

export default router;