import express from 'express';
import {
    getEmpleados,
    getEmpleadoById,
    createEmpleado,
    updateEmpleado,
    deleteEmpleado
} from '../controllers/empleado.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// Todas las rutas requieren autenticación
router.get('/', authenticate, getEmpleados);
router.get('/:id', authenticate, getEmpleadoById);
router.post('/', authenticate, createEmpleado);
router.put('/:id', authenticate, updateEmpleado);
router.delete('/:id', authenticate, deleteEmpleado);

export default router;
