import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/types';
import Joi from 'joi';

const router = Router();

// Schémas de validation
const registerSchema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    // email: Joi.string().email().required(),
    password: Joi.string().required()
});

const loginSchema = Joi.object({
    username: Joi.string().min(3).max(50).required(),
    password: Joi.string().required()
});

// Inscription
router.post('/register', async (req: AuthRequest, res: Response) => {
    try {
        const { error } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }


        const { username, password } = req.body;
        const email = null;

        // Vérifier si l'utilisateur existe déjà
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Un utilisateur avec cette adresse email ou ce nom d\'utilisateur existe déjà' });
        }


        // Hasher le mot de passe
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);
        // Créer l'utilisateur
        const result = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username, email, password_hash]
        );
        const user = result.rows[0];

        // Générer le token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET as string,
            { expiresIn: '30d' }
        );

        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            user: { id: user.id, username: user.username },
            token
        });
    } catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Connexion
router.post('/login', async (req: AuthRequest, res: Response) => {
    try {
        console.log('req.body', req.body);

        const { error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { username, password } = req.body;

        // Trouver l'utilisateur
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }

        const user = result.rows[0];

        // Vérifier le mot de passe
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }

        // Générer le token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }
        );

        res.json({
            message: 'Connexion réussie',
            user: { id: user.id, username: user.username },
            token
        });
    } catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
