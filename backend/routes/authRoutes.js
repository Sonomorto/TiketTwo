import express from 'express';
import { validate } from '../utils/validationSchemas.js';
import { authSchemas } from '../utils/validationSchemas.js';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

/**
 * Registrazione utente/organizzatore
 * Valida lo schema Joi `authSchemas.register` prima di passare al controller.
 */
router.post('/register', validate(authSchemas.register), register);

/**
 * Login utente
 * Valida lo schema Joi `authSchemas.login` prima di passare al controller.
 */
router.post('/login', validate(authSchemas.login), login);

export default router;