import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { User } from '../models/User.js';
import { generateToken } from '../config/jwt.js';
import bcrypt from 'bcryptjs';
import { userSchema } from '../utils/validationSchemas.js';

// Registrazione utente/organizzatore
export const register = asyncHandler(async (req, res) => {
  // Validazione input
  const { error } = userSchema.validate(req.body);
  if (error) throw new ApiError(400, error.details[0].message);

  // Verifica utente esistente
  const existingUser = await User.findByEmail(req.body.email);
  if (existingUser) throw new ApiError(409, 'Email già registrata');

  // Hash password
  const hashedPassword = await bcrypt.hash(req.body.password, 12);
  
  // Creazione utente
  const newUser = await User.create({
    ...req.body,
    password: hashedPassword
  });

  // Genera token JWT
  const token = generateToken({
    id: newUser.id,
    role: newUser.role
  });

  res.status(201).json(
    new ApiResponse(201, { user: newUser, token }, 'Registrazione completata')
  );
});

// Login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // Verifica credenziali
  const user = await User.findByEmail(email);
  if (!user) throw new ApiError(401, 'Credenziali non valide');

  const isValidPassword = await bcrypt.compare(password, user.password);
  if (!isValidPassword) throw new ApiError(401, 'Credenziali non valide');

  // Genera token JWT
  const token = generateToken({
    id: user.id,
    role: user.role
  });

  res.json(
    new ApiResponse(200, { user, token }, 'Login effettuato')
  );
});