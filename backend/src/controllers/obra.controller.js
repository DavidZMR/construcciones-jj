import Obra from '../models/Obra.js';
import { sendSuccess, sendBadRequest, sendNotFound, sendError, sendCreated } from '../utils/response.js';

export const getObras = async (req, res) => {
    try {
        const obras = await Obra.find().sort({ createdAt: -1 });
        return sendSuccess(res, 'Obras obtenidas exitosamente', obras);
    } catch (error) {
        console.error('Error al obtener obras:', error);
        return sendError(res, 'Error al obtener obras', { error: error.message });
    }
};

export const getObraById = async (req, res) => {
    try {
        const obra = await Obra.findById(req.params.id);

        if (!obra) {
            return sendNotFound(res, 'Obra no encontrada');
        }

        return sendSuccess(res, 'Obra obtenida exitosamente', obra);
    } catch (error) {
        console.error('Error al obtener obra:', error);

        if (error.name === 'CastError') {
            return sendBadRequest(res, 'ID inválido');
        }

        return sendError(res, 'Error al obtener obra', { error: error.message });
    }
};

export const createObra = async (req, res) => {
    try {
        const { numero_contrato, nombre_obra, estatus } = req.body;

        // Validar campos requeridos
        if (!numero_contrato || !nombre_obra) {
            return sendBadRequest(res, 'Número de contrato y nombre de obra son requeridos');
        }

        // Verificar si ya existe el número de contrato
        const existingObra = await Obra.findOne({ numero_contrato });
        if (existingObra) {
            return sendBadRequest(res, 'El número de contrato ya existe');
        }

        // Crear nueva obra
        const newObra = await Obra.create({
            numero_contrato,
            nombre_obra,
            estatus: estatus || 'ALTA'
        });

        return sendCreated(res, 'Obra creada exitosamente', newObra);
    } catch (error) {
        console.error('Error al crear obra:', error);
        return sendError(res, 'Error al crear obra', { error: error.message });
    }
};

export const updateObra = async (req, res) => {
    try {
        const { numero_contrato, nombre_obra, estatus } = req.body;

        const updateData = {};
        if (numero_contrato) updateData.numero_contrato = numero_contrato;
        if (nombre_obra) updateData.nombre_obra = nombre_obra;
        if (estatus) updateData.estatus = estatus;

        // Si se actualiza el número de contrato, verificar que no exista otro igual
        if (numero_contrato) {
            const existingObra = await Obra.findOne({
                numero_contrato,
                _id: { $ne: req.params.id }
            });
            if (existingObra) {
                return sendBadRequest(res, 'El número de contrato ya existe');
            }
        }

        const obra = await Obra.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!obra) {
            return sendNotFound(res, 'Obra no encontrada');
        }

        return sendSuccess(res, 'Obra actualizada exitosamente', obra);
    } catch (error) {
        console.error('Error al actualizar obra:', error);

        if (error.name === 'CastError') {
            return sendBadRequest(res, 'ID inválido');
        }

        return sendError(res, 'Error al actualizar obra', { error: error.message });
    }
};

export const deleteObra = async (req, res) => {
    try {
        // Soft delete: cambiar estatus a Baja
        const obra = await Obra.findByIdAndUpdate(
            req.params.id,
            { estatus: 'BAJA' },
            { new: true }
        );

        if (!obra) {
            return sendNotFound(res, 'Obra no encontrada');
        }

        return sendSuccess(res, 'Obra dada de baja correctamente');
    } catch (error) {
        console.error('Error al dar de baja obra:', error);

        if (error.name === 'CastError') {
            return sendBadRequest(res, 'ID inválido');
        }

        return sendError(res, 'Error al dar de baja obra', { error: error.message });
    }
};
