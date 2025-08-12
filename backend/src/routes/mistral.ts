import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

// Schéma de validation pour le prompt
const promptSchema = Joi.object({
    prompt: Joi.string().required().min(1).max(1000),
    context: Joi.string().optional()
});

// Générer du contenu avec Mistral AI
router.post('/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
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
            const { Mistral } = await import('@mistralai/mistralai');

            const client = new Mistral({
                apiKey: process.env.MISTRAL_API_KEY
            });

            // Construire le prompt système pour le journal
            let systemPrompt = `Tu es un assistant qui aide à rédiger des entrées de journal personnel. 
Tu dois créer un texte authentique et personnel basé sur le prompt de l'utilisateur. 
Le texte doit être écrit à la première personne, comme si c'était l'utilisateur qui écrivait.
Garde un ton naturel et personnel, évite d'être trop formel.
Limite ta réponse à environ 200-300 mots.`;

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

        } catch (mistralError: any) {
            console.error('Erreur Mistral AI:', mistralError);
            return res.status(500).json({
                error: 'Erreur lors de la génération de contenu avec Mistral AI',
                details: mistralError.message
            });
        }

    } catch (error) {
        console.error('Erreur lors de la génération:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
