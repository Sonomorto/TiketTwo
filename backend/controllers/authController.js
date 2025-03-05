// controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findUserByEmail, createUser } from '../models/userModel.js';

// Validazione email semplice
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

// Politica password: almeno 8 caratteri, 1 numero, 1 maiuscola
const isStrongPassword = (password) => 
  /^(?=.*\d)(?=.*[A-Z]).{8,}$/.test(password);

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Validazione input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Tutti i campi sono obbligatori' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Formato email non valido' });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({ 
        message: 'Password debole: minimo 8 caratteri, 1 numero e 1 maiuscola' 
      });
    }

    if (!['organizer', 'customer'].includes(role)) {
      return res.status(400).json({ message: 'Ruolo non valido' });
    }

    // Crittografia password e creazione utente
    const hashedPassword = await bcrypt.hash(password, 12);
    await createUser({ name, email, password: hashedPassword, role });
    
    res.status(201).json({ 
      success: true,
      message: 'Registrazione completata con successo'
    });

  } catch (error) {
    if (error.message === 'EMAIL_EXISTS') {
      return res.status(409).json({ message: 'Email già registrata' });
    }
    console.error('Errore registrazione:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email e password richieste' });
    }

    const user = await findUserByEmail(email);
    
    // Response generica per evitare informazioni sensibili
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Credenziali non valide' });
    }

    // Generazione JWT con expiration configurata
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    // Rimuovi password dalla response
    delete user.password;

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Errore login:', error);
    res.status(500).json({ message: 'Errore interno del server' });
  }
};

// Logout opzionale (gestito lato client rimuovendo il token)
export const logout = (req, res) => {
  res.json({ success: true, message: 'Logout effettuato' });
};