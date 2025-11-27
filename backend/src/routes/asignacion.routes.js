import express from 'express';
import {
    getAsignaciones,
    createAsignacion,
    returnAsignacion,
    updateAsignacion
} from '../controllers/asignacion.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.get('/', authenticate, getAsignaciones);
router.post('/', authenticate, createAsignacion);
router.put('/:id/devolver', authenticate, returnAsignacion);
router.put('/:id', authenticate, updateAsignacion);

export default router;
