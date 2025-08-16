import { Router, Response } from 'express';
import pool from '../config/database';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { uploadImages, handleUploadError } from '../middleware/upload';
import { JournalEntry, EntryImage } from '../models/types';
import Joi from 'joi';
import path from 'path';
import fs from 'fs';

const router = Router();

// Schémas de validation
const journalEntrySchema = Joi.object({
    date: Joi.date().required(),
    content: Joi.string().required(),
    ai_generated: Joi.boolean().default(false),
    location_name: Joi.string().optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    images: Joi.array().items(Joi.string()).optional()
});

const searchSchema = Joi.object({
    keyword: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    latitude: Joi.number().min(-90).max(90).optional(),
    longitude: Joi.number().min(-180).max(180).optional(),
    radius: Joi.number().positive().optional()
});

// Créer une entrée de journal
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { error } = journalEntrySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const {
            date,
            content,
            ai_generated = false,
            location_name,
            latitude,
            longitude,
            images = []
        } = req.body;

        const result = await pool.query(
            `INSERT INTO journal_entries 
       (user_id, date, content, ai_generated, location_name, latitude, longitude, images) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
            [req.user.id, date, content, ai_generated, location_name, latitude, longitude, images]
        );

        res.status(201).json({
            message: 'Entrée de journal créée avec succès',
            entry: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'entrée:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer toutes les entrées d'un utilisateur
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const result = await pool.query(
            `SELECT je.*, 
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', ei.id,
                                'filename', ei.filename,
                                'original_name', ei.original_name,
                                'file_path', ei.file_path,
                                'file_size', ei.file_size,
                                'mime_type', ei.mime_type,
                                'upload_date', ei.upload_date
                            )
                        ) FILTER (WHERE ei.id IS NOT NULL), 
                        '[]'
                    ) as entry_images
             FROM journal_entries je
             LEFT JOIN entry_images ei ON je.id = ei.entry_id
             WHERE je.user_id = $1 
             GROUP BY je.id
             ORDER BY je.date DESC`,
            [req.user.id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Erreur lors de la récupération des entrées:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Récupérer une entrée spécifique par date
router.get('/date/:date', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { date } = req.params;
        const result = await pool.query(
            `SELECT je.*, 
                    COALESCE(
                        json_agg(
                            json_build_object(
                                'id', ei.id,
                                'filename', ei.filename,
                                'original_name', ei.original_name,
                                'file_path', ei.file_path,
                                'file_size', ei.file_size,
                                'mime_type', ei.mime_type,
                                'upload_date', ei.upload_date
                            )
                        ) FILTER (WHERE ei.id IS NOT NULL), 
                        '[]'
                    ) as entry_images
             FROM journal_entries je
             LEFT JOIN entry_images ei ON je.id = ei.entry_id
             WHERE je.user_id = $1 AND je.date::date = $2
             GROUP BY je.id`,
            [req.user.id, date]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Aucune entrée trouvée pour cette date' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'entrée:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Mettre à jour une entrée
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { error } = journalEntrySchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const {
            date,
            content,
            ai_generated,
            location_name,
            latitude,
            longitude,
            images = []
        } = req.body;

        const result = await pool.query(
            `UPDATE journal_entries 
       SET date = $1, content = $2, ai_generated = $3, location_name = $4, latitude = $5, longitude = $6, images = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND user_id = $9 
       RETURNING *`,
            [date, content, ai_generated, location_name, latitude, longitude, images, id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entrée non trouvée' });
        }

        res.json({
            message: 'Entrée mise à jour avec succès',
            entry: result.rows[0]
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer une entrée
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
            'DELETE FROM journal_entries WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Entrée non trouvée' });
        }

        res.json({ message: 'Entrée supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Recherche par mots-clés
router.post('/search', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { error } = searchSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const { keyword, startDate, endDate, latitude, longitude, radius } = req.body;

        let query = 'SELECT * FROM journal_entries WHERE user_id = $1';
        const params: any[] = [req.user.id];
        let paramCount = 1;

        if (keyword) {
            paramCount++;
            query += ` AND (content ILIKE $${paramCount} OR location_name ILIKE $${paramCount})`;
            params.push(`%${keyword}%`);
        }

        if (startDate) {
            paramCount++;
            query += ` AND date >= $${paramCount}`;
            params.push(startDate);
        }

        if (endDate) {
            paramCount++;
            query += ` AND date <= $${paramCount}`;
            params.push(endDate);
        }

        // Recherche géographique (cercle)
        if (latitude && longitude && radius) {
            paramCount += 3;
            query += ` AND (
        6371 * acos(
          cos(radians($${paramCount - 2})) * cos(radians(latitude)) *
          cos(radians(longitude) - radians($${paramCount - 1})) +
          sin(radians($${paramCount - 2})) * sin(radians(latitude))
        ) <= $${paramCount}
      )`;
            params.push(latitude, longitude, radius);
        }

        query += ' ORDER BY date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erreur lors de la recherche:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Upload d'images pour une entrée
router.post('/:id/images', authenticateToken, uploadImages.array('images', 10), handleUploadError, async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'Aucun fichier fourni' });
        }

        // Vérifier que l'entrée appartient à l'utilisateur
        const entryCheck = await pool.query(
            'SELECT id FROM journal_entries WHERE id = $1 AND user_id = $2',
            [id, req.user.id]
        );

        if (entryCheck.rows.length === 0) {
            // Supprimer les fichiers uploadés si l'entrée n'existe pas
            files.forEach(file => {
                fs.unlinkSync(file.path);
            });
            return res.status(404).json({ error: 'Entrée non trouvée' });
        }

        // Insérer les informations des images en base
        const imageRecords = [];
        for (const file of files) {
            const result = await pool.query(
                `INSERT INTO entry_images 
                 (entry_id, filename, original_name, file_path, file_size, mime_type) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING *`,
                [id, file.filename, file.originalname, file.path, file.size, file.mimetype]
            );
            imageRecords.push(result.rows[0]);
        }

        res.status(201).json({
            message: 'Images uploadées avec succès',
            images: imageRecords
        });
    } catch (error) {
        console.error('Erreur lors de l\'upload d\'images:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Supprimer une image spécifique
router.delete('/:entryId/images/:imageId', authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { entryId, imageId } = req.params;

        // Vérifier que l'image appartient à une entrée de l'utilisateur
        const result = await pool.query(
            `SELECT ei.file_path 
             FROM entry_images ei
             JOIN journal_entries je ON ei.entry_id = je.id
             WHERE ei.id = $1 AND ei.entry_id = $2 AND je.user_id = $3`,
            [imageId, entryId, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Image non trouvée' });
        }

        const filePath = result.rows[0].file_path;

        // Supprimer l'enregistrement de la base de données
        await pool.query('DELETE FROM entry_images WHERE id = $1', [imageId]);

        // Supprimer le fichier physique
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ message: 'Image supprimée avec succès' });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'image:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Servir les images
router.get('/images/:filename', (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '../../uploads/images', filename);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Image non trouvée' });
        }

        // Déterminer le bon type MIME à partir de l'extension
        const ext = path.extname(filename).toLowerCase();
        const mimeMap: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.jfif': 'image/jpeg',
            '.pjpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
        };
        const contentType = mimeMap[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        res.sendFile(filePath);
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'image:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

export default router;
