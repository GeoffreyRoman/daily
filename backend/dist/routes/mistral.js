"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const joi_1 = __importDefault(require("joi"));
const router = (0, express_1.Router)();
// Schéma de validation pour le prompt
const promptSchema = joi_1.default.object({
    prompt: joi_1.default.string().required().min(1).max(1000),
    context: joi_1.default.string().optional()
});
// Générer du contenu avec Mistral AI
router.post('/generate', auth_1.authenticateToken, async (req, res) => {
    try {
        const { error } = promptSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        const { prompt, context } = req.body;
        // Vérifier que la clé API Mistral est configurée
        if (!process.env.MISTRAL_API_KEY) {
            return res.status(500).json({ error: 'Clé API Mistral non configurée' });
        }
        try {
            // Import dynamique de Mistral AI
            const { Mistral } = await Promise.resolve().then(() => __importStar(require('@mistralai/mistralai')));
            const client = new Mistral({
                apiKey: process.env.MISTRAL_API_KEY
            });
            // Construire le prompt système pour le journal
            let systemPrompt = `Tu es un assistant qui aide à rédiger des entrées de journal personnel. 
Tu dois créer un texte authentique et personnel basé sur le prompt de l'utilisateur. 
Le texte doit être écrit à la première personne, comme si c'était l'utilisateur qui écrivait.
Garde un ton naturel et personnel, évite d'être trop formel. La réponse doit être bref, concentre toi sur ce que le prompt dit, et n'ajoute de details qui ne t'ont pas été donné.`;
            if (context) {
                systemPrompt += `\n\nContexte supplémentaire: ${context}`;
            }
            const response = await client.chat.complete({
                model: 'mistral-small-latest',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                maxTokens: 500
            });
            const generatedContent = response.choices?.[0]?.message?.content;
            if (!generatedContent) {
                return res.status(500).json({ error: 'Aucun contenu généré par l\'IA' });
            }
            res.json({
                generated_content: generatedContent,
                prompt: prompt,
                model: 'mistral-small-latest'
            });
        }
        catch (mistralError) {
            console.error('Erreur Mistral AI:', mistralError);
            return res.status(500).json({
                error: 'Erreur lors de la génération de contenu avec Mistral AI',
                details: mistralError.message
            });
        }
    }
    catch (error) {
        console.error('Erreur lors de la génération:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});
exports.default = router;
//# sourceMappingURL=mistral.js.map