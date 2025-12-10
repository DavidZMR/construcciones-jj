import MaquinariaEquipo from '../models/MaquinariaEquipo.js';
import { sendSuccess, sendBadRequest, sendNotFound, sendError, sendCreated } from '../utils/response.js';

export const getMaquinaria = async (req, res) => {
    try {
        const maquinaria = await MaquinariaEquipo.find().sort({ createdAt: -1 });
        return sendSuccess(res, 'Maquinaria y equipo obtenidos exitosamente', maquinaria);
    } catch (error) {
        console.error('Error al obtener maquinaria:', error);
        return sendError(res, 'Error al obtener maquinaria', { error: error.message });
    }
};

export const getMaquinariaById = async (req, res) => {
    try {
        const item = await MaquinariaEquipo.findById(req.params.id);

        if (!item) {
            return sendNotFound(res, 'Elemento no encontrado');
        }

        return sendSuccess(res, 'Elemento obtenido exitosamente', item);
    } catch (error) {
        console.error('Error al obtener elemento:', error);

        if (error.name === 'CastError') {
            return sendBadRequest(res, 'ID inválido');
        }

        return sendError(res, 'Error al obtener elemento', { error: error.message });
    }
};

export const createMaquinaria = async (req, res) => {
    try {
        const { codigo, nombre, tipo, descripcion, placa } = req.body;

        // Validar campos requeridos básicos
        if (!codigo || !nombre || !tipo) {
            return sendBadRequest(res, 'Código, nombre y tipo son requeridos');
        }

        // Validar placa si es vehículo
        if (tipo === 'Vehículo' && !placa) {
            return sendBadRequest(res, 'La placa es requerida para vehículos');
        }

        // Verificar si el código ya existe
        const existingItem = await MaquinariaEquipo.findOne({ codigo });
        if (existingItem) {
            return sendBadRequest(res, 'El código ya existe');
        }

        // Crear nuevo elemento
        const newItem = await MaquinariaEquipo.create({
            codigo,
            nombre,
            tipo,
            descripcion,
            placa: tipo === 'Vehículo' ? placa : undefined
        });

        return sendCreated(res, 'Elemento creado exitosamente', newItem);
    } catch (error) {
        console.error('Error al crear elemento:', error);

        if (error.code === 11000) {
            return sendBadRequest(res, 'El código ya existe');
        }

        return sendError(res, 'Error al crear elemento', { error: error.message });
    }
};

export const updateMaquinaria = async (req, res) => {
    try {
        const { codigo, nombre, tipo, descripcion, placa, estado } = req.body;
        const updateData = {};

        if (codigo) updateData.codigo = codigo;
        if (nombre) updateData.nombre = nombre;
        if (tipo) updateData.tipo = tipo;
        if (descripcion !== undefined) updateData.descripcion = descripcion;
        if (estado) updateData.estado = estado;

        // Manejo de placa
        if (tipo === 'Vehículo') {
            if (placa) updateData.placa = placa;
        } else if (tipo) {
            // Si cambiamos a un tipo que no es vehículo, eliminamos la placa
            updateData.placa = undefined;
            updateData.$unset = { placa: 1 }; // Para eliminar el campo de la BD
        } else if (placa !== undefined) {
            // Si no cambiamos el tipo pero actualizamos la placa (solo si ya era Vehículo o no sabemos)
            // Mejor confiamos en que el frontend manda todo o validamos contra el objeto actual
            updateData.placa = placa;
        }

        // Si se actualiza código, verificar que no exista ya
        if (codigo) {
            const existingItem = await MaquinariaEquipo.findOne({
                codigo,
                _id: { $ne: req.params.id }
            });

            if (existingItem) {
                return sendBadRequest(res, 'El código ya existe');
            }
        }

        // Actualizar elemento
        // Nota: $unset debe ir en el segundo argumento de findByIdAndUpdate si se usa, pero aquí lo mezclé en updateData.
        // Mongoose maneja $unset si está en el objeto de actualización.
        // Pero updateData tiene campos directos. Mongoose `findByIdAndUpdate` espera operadores o un objeto plano.
        // Si mezclamos, puede fallar. Mejor hacemos un objeto plano y si necesitamos unset, usamos $unset.

        // Refactor update logic for safety
        const finalUpdate = { ...updateData };
        delete finalUpdate.$unset;

        const updateOps = { $set: finalUpdate };
        if (updateData.$unset) {
            updateOps.$unset = updateData.$unset;
        }

        const item = await MaquinariaEquipo.findByIdAndUpdate(
            req.params.id,
            updateOps,
            { new: true, runValidators: true }
        );

        if (!item) {
            return sendNotFound(res, 'Elemento no encontrado');
        }

        return sendSuccess(res, 'Elemento actualizado exitosamente', item);
    } catch (error) {
        console.error('Error al actualizar elemento:', error);

        if (error.name === 'CastError') {
            return sendBadRequest(res, 'ID inválido');
        }

        if (error.code === 11000) {
            return sendBadRequest(res, 'El código ya existe');
        }

        return sendError(res, 'Error al actualizar elemento', { error: error.message });
    }
};

export const deleteMaquinaria = async (req, res) => {
    try {
        const item = await MaquinariaEquipo.findByIdAndUpdate(
            req.params.id,
            { estado: 'Baja' },
            { new: true }
        );

        if (!item) {
            return sendNotFound(res, 'Elemento no encontrado');
        }

        return sendSuccess(res, 'Elemento dado de baja correctamente');
    } catch (error) {
        console.error('Error al dar de baja elemento:', error);

        if (error.name === 'CastError') {
            return sendBadRequest(res, 'ID inválido');
        }

        return sendError(res, 'Error al dar de baja elemento', { error: error.message });
    }
};
