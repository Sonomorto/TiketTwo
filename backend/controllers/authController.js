import bcrypt from 'bcryptjs';
import { generateToken } from '../config/jwt.js';
import { query } from '../config/db.js';
import { logger } from '../utils/logger.js';

// Registrazione utente/organizzatore
export const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  
  try {
    // Verifica se l'email esiste già
    const [userExists] = await query('SELECT id FROM users WHERE email = ?', [email]);
    if (userExists) {
      return res.status(400).json({ message: 'Email già registrata' });
    }

    // Hash della password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Inserimento utente
    const result = await query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'user']
    );

    res.status(201).json({ 
      id: result.insertId, 
      message: 'Registrazione completata' 
    });

  } catch (error) {
    logger.error('Errore durante la registrazione:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};

// Login
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Verifica utente
    const [user] = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    // Verifica password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    // Genera token JWT
    const token = generateToken({ 
      id: user.id, 
      role: user.role 
    });

    res.json({ 
      token, 
      user: { id: user.id, name: user.name, role: user.role } 
    });

  } catch (error) {
    logger.error('Errore durante il login:', error);
    res.status(500).json({ message: 'Errore del server' });
  }
};