import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';

const router = express.Router();

// Registrazione utente/organizzatore
router.post('/register', registerUser);

// Login e generazione JWT
router.post('/login', loginUser);

export default router;