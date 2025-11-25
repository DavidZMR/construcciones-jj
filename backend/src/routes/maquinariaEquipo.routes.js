import express from 'express';
import {
    getMaquinaria,
    getMaquinariaById,
    createMaquinaria,
    updateMaquinaria,
    deleteMaquinaria
} from '../controllers/maquinariaEquipo.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.get('/', authenticate, getMaquinaria);
router.get('/:id', authenticate, getMaquinariaById);
router.post('/', authenticate, createMaquinaria);
router.put('/:id', authenticate, updateMaquinaria);
router.delete('/:id', authenticate, deleteMaquinaria);

export default router;
