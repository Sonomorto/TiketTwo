import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '../models/userModel.js';
import bcrypt from 'bcryptjs';

// controllers/authController.js
export const register = async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = await createUser({
            ...req.body,
            password: hashedPassword
        });
        res.status(201).json({ message: 'Utente registrato con successo' });
    } catch (error) {
        if (error.message === 'EMAIL_EXISTS') {
            res.status(409).json({ message: 'Email già registrata' });
        } else {
            res.status(500).json({ message: 'Errore interno del server' });
        }
    }
};

export const login = async (req, res) => {
    const user = await findUserByEmail(req.body.email);
    if (!user || !(await bcrypt.compare(req.body.password, user.password))) {
        return res.status(401).json({ message: 'Credenziali non valide' });
    }

    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
    );

    res.json({ token });
};