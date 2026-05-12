import { Router, Response } from 'express';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import Joi from 'joi';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

// Générer du contenu avec Gemini AI
router.post('/generate', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { error } = promptSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { prompt, context } = req.body;

        // Vérifier que la clé API Gemini est configurée
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Clé API Gemini non configurée' });
        }

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite"});
            let systemPrompt = `Tu es un assistant qui aide à rédiger des entrées de journal personnel. 
Tu dois créer un texte authentique et personnel basé sur le prompt de l'utilisateur. 
Le texte doit être écrit à la première personne, comme si c'était l'utilisateur qui écrivait.
Garde un ton naturel et personnel, évite d'être trop formel. La réponse doit être bref, concentre toi sur ce que le prompt dit, et n'ajoute de details qui ne t'ont pas été donné.`;


            if (context) {
                systemPrompt += `\n\nContexte supplémentaire: ${context}`;
            }

            const fullPrompt = `${systemPrompt}\n\n${prompt}`;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const generatedContent = response.text();

            if (!generatedContent) {
                return res.status(500).json({ error: 'Aucun contenu généré par l\'IA' });
            }

            res.json({
                generated_content: generatedContent,
                prompt: prompt,
                model: 'gemini-3.1-flash-lite'
            });

        } catch (geminiError: any) {
            console.error('Erreur Gemini AI:', geminiError);
            return res.status(500).json({
                error: 'Erreur lors de la génération de contenu avec Gemini AI',
                details: geminiError.message
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

        // Vérifier que la clé API Gemini est configurée
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'Clé API Gemini non configurée' });
        }

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite"});

            // Formater les entrées pour le contexte
            const formattedEntries = entries.map((entry: any) => {
                const date = new Date(entry.date).toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
                let entryText = `${date}: ${entry.content}`;
                if (entry.location_name) {
                    entryText += ` (Lieu: ${entry.location_name})`;
                }
                return entryText;
            }).join('\n');

            // Construire le prompt système pour le résumé
            const systemPrompt = `Tu es un assistant qui analyse et résume des entrées de journal personnel. 
Voici les entrées pour la période du ${new Date(startDate).toLocaleDateString('fr-FR')} au ${new Date(endDate).toLocaleDateString('fr-FR')}:
${formattedEntries}

Ta tâche est de fournir un résumé qui met en lumière :
- Les thèmes récurrents (émotions, activités, lieux)
- Les moments clés ou les événements marquants
- Les insights et observations pertinents

Le résumé doit être informatif mais aussi refleter l'expérience humaine derrière ces entrées.`;
            
            const prompt = `Résume-moi les entrées de mon journal pour cette période. J'aimerais avoir une vue d'ensemble de ce que j'ai vécu.`;
            const fullPrompt = `${systemPrompt}\n\n${prompt}`;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const generatedSummary = response.text();


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
                model: 'gemini-3.1-flash-lite'
            });

        } catch (geminiError: any) {
            console.error('Erreur Gemini AI pour résumé:', geminiError);
            return res.status(500).json({
                error: 'Erreur lors de la génération du résumé avec Gemini AI',
                details: geminiError.message
            });
        }

    } catch (error) {
        console.error('Erreur lors de la génération du résumé:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
