import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import Joi from 'joi';

const router = Router();

// Schéma de validation pour le prompt
const promptSchema = Joi.object({
    prompt: Joi.string().required().min(1).max(1000),
    context: Joi.string().optional()
});

// Schéma de validation pour le résumé de journal
const summarySchema = Joi.object({
    entries: Joi.array().items(Joi.object({
        date: Joi.date().required(),
        content: Joi.string().required(),
        location_name: Joi.string().optional()
    })).required().min(1),
    startDate: Joi.date().required(),
    endDate: Joi.date().required()
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

// Générer un résumé de journal avec tout le contenu dans le contexte
router.post('/summarize', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { error } = summarySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { entries, startDate, endDate } = req.body;

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

            // Formater les entrées pour le contexte
            const formattedEntries = entries.map((entry: any) => {
                const date = new Date(entry.date).toLocaleDateString('fr-FR', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric' 
                });
                let entryText = `${date}: ${entry.content}`;
                if (entry.location_name) {
                    entryText += ` (📍 ${entry.location_name})`;
                }
                return entryText;
            }).join('\n\n');

            // Construire le prompt système avec tout le contenu
            const systemPrompt = `Tu es un assistant qui aide à analyser et résumer des journaux personnels.

Voici les entrées de journal de l'utilisateur du ${new Date(startDate).toLocaleDateString('fr-FR')} au ${new Date(endDate).toLocaleDateString('fr-FR')} :

${formattedEntries}

Analyse ces entrées et crée un résumé structuré qui met en évidence :
- Les thèmes principaux et récurrents
- Les événements marquants
- L'évolution émotionnelle ou personnelle
- Les lieux visités (s'il y en a)
- Les insights et observations pertinents

Utilise un ton bienveillant et personnel, comme si tu analysais le journal d'un ami. Le résumé doit être informatif mais aussi refleter l'expérience humaine derrière ces entrées.`;

            const response = await client.chat.complete({
                model: 'mistral-small-latest',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: `Résume-moi les entrées de mon journal pour cette période. J'aimerais avoir une vue d'ensemble de ce que j'ai vécu.`
                    }
                ],
                temperature: 0.7,
                maxTokens: 1500  // Plus de tokens pour un résumé plus détaillé
            });

            const generatedSummary = response.choices?.[0]?.message?.content;

            if (!generatedSummary) {
                return res.status(500).json({ error: 'Aucun résumé généré par l\'IA' });
            }

            res.json({
                summary: generatedSummary,
                entries_count: entries.length,
                period: {
                    start: startDate,
                    end: endDate
                },
                model: 'mistral-small-latest'
            });

        } catch (mistralError: any) {
            console.error('Erreur Mistral AI pour résumé:', mistralError);
            return res.status(500).json({
                error: 'Erreur lors de la génération du résumé avec Mistral AI',
                details: mistralError.message
            });
        }

    } catch (error) {
        console.error('Erreur lors de la génération du résumé:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
