import express from 'express';
import { validate } from '../utils/validationSchemas.js';
import { authSchemas } from '../utils/validationSchemas.js';
import { register, login } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', validate(authSchemas.register), register);
router.post('/login', validate(authSchemas.login), login);

export default router;