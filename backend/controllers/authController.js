import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse, ApiError } from '../utils/apiResponse.js';
import { User } from '../models/User.js';
import { generateToken } from '../config/jwt.js';
import bcrypt from 'bcryptjs';
import Joi from 'joi';

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

// Registrazione utente (solo ruolo 'user' di default)
export const register = asyncHandler(async (req, res) => {
  // 1. Validazione input
  const { error } = registerSchema.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  // 2. Verifica email esistente
  const existingUser = await User.findByEmail(req.body.email);
  if (existingUser) throw new ApiError(409, 'Email già registrata');

  // 3. Hash password
  const hashedPassword = await bcrypt.hash(req.body.password, 12);

  // 4. Crea utente con ruolo 'user'
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: hashedPassword,
    role: 'user' // Forzato a 'user' per registrazioni pubbliche
  });

  // 5. Genera token JWT
  const token = generateToken({
    id: newUser.id,
    role: newUser.role
  });

  // 6. Risposta
  res.status(201).json(
    new ApiResponse(201, { user: newUser, token }, 'Registrazione completata')
  );
});

// Login utente/organizzatore
export const login = asyncHandler(async (req, res) => {
  // 1. Validazione input
  const { error } = loginSchema.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  // 2. Verifica esistenza utente
  const user = await User.findByEmail(req.body.email);
  if (!user) throw new ApiError(401, 'Credenziali non valide');

  // 3. Confronta password
  const isValidPassword = await bcrypt.compare(req.body.password, user.password);
  if (!isValidPassword) throw new ApiError(401, 'Credenziali non valide');

  // 4. Genera token JWT
  const token = generateToken({
    id: user.id,
    role: user.role
  });

  // 5. Rimuovi password dalla risposta
  delete user.password;

  // 6. Risposta
  res.json(
    new ApiResponse(200, { user, token }, 'Login effettuato')
  );
});