// routes/authRoutes.js
import express from 'express';
import { register, login, getProfile } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Registrazione pubblica
router.post('/register', register);

// Login pubblico
router.post('/login', login);

// Profilo utente (protetto)
router.get('/profile', authenticateUser, getProfile);

export default router;