import express from 'express';
import {
    getObras,
    getObraById,
    createObra,
    updateObra,
    deleteObra
} from '../controllers/obra.controller.js';

const router = express.Router();

router.get('/', getObras);
router.get('/:id', getObraById);
router.post('/', createObra);
router.put('/:id', updateObra);
router.delete('/:id', deleteObra);

export default router;
