"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = __importDefault(require("../config/database"));
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
// Schémas de validation
const registerSchema = joi_1.default.object({
    username: joi_1.default.string().min(3).max(50).required(),
    // email: Joi.string().email().required(),
    password: joi_1.default.string().required()
});
const loginSchema = joi_1.default.object({
    username: joi_1.default.string().min(3).max(50).required(),
    password: joi_1.default.string().required()
});
// Inscription
router.post('/register', async (req, res) => {
    try {
        const { error } = registerSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { username, password } = req.body;
        const email = null;
        // Vérifier si l'utilisateur existe déjà
        const existingUser = await database_1.default.query('SELECT id FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Un utilisateur avec cette adresse email ou ce nom d\'utilisateur existe déjà' });
        }
        // Hasher le mot de passe
        const saltRounds = 10;
        const password_hash = await bcryptjs_1.default.hash(password, saltRounds);
        // Créer l'utilisateur
        const result = await database_1.default.query('INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at', [username, email, password_hash]);
        const user = result.rows[0];
        // Générer le token JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            message: 'Utilisateur créé avec succès',
            user: { id: user.id, username: user.username },
            token
        });
    }
    catch (error) {
        console.error('Erreur lors de l\'inscription:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
// Connexion
router.post('/login', async (req, res) => {
    try {
        console.log('req.body', req.body);
        const { error } = loginSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { username, password } = req.body;
        // Trouver l'utilisateur
        const result = await database_1.default.query('SELECT * FROM users WHERE username = $1', [username]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }
        const user = result.rows[0];
        // Vérifier le mot de passe
        const isValidPassword = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Nom d\'utilisateur ou mot de passe incorrect' });
        }
        // Générer le token JWT
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
        res.json({
            message: 'Connexion réussie',
            user: { id: user.id, username: user.username },
            token
        });
    }
    catch (error) {
        console.error('Erreur lors de la connexion:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map