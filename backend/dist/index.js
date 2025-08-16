"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const journal_1 = __importDefault(require("./routes/journal"));
const auth_1 = __importDefault(require("./routes/auth"));
const mistral_1 = __importDefault(require("./routes/mistral"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
// Middlewares de sécurité
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production' ? 'https://daily-note-cs.onrender.com' : 'https://daily-note-cs.onrender.com',
    credentials: true
}));
// Servir les fichiers statiques du dossier uploads (images)
app.use('/uploads', express_1.default.static('uploads'));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);
// Middleware de logging
app.use((0, morgan_1.default)('combined'));
// Parser JSON
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Middleware de debug pour loguer toutes les requêtes
app.use((req, res, next) => {
    console.log(`🔍 ${req.method} ${req.path} - Body:`, req.body);
    next();
});
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/journal', journal_1.default);
app.use('/api/mistral', mistral_1.default);
// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});
// Middleware pour les routes non trouvées
app.use((req, res) => {
    console.log(`❌ Route non trouvée: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'routess_inconnue' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map