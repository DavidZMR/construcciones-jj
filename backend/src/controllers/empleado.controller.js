import Empleados from '../models/Empleado.js';
import { sendSuccess, sendBadRequest, sendNotFound, sendError, sendCreated } from '../utils/response.js';

export const getEmpleados = async (req, res) => {
    try {
        const empleados = await Empleados.find().sort({ createdAt: -1 });
        console.log(empleados)
        return sendSuccess(res, 'Empleados obtenidos exitosamente', empleados);
    } catch (error) {
        console.error('Error al obtener empleados:', error);
        return sendError(res, 'Error al obtener empleados', { error: error.message });
    }
};

export const getEmpleadoById = async (req, res) => {
    try {
        const empleado = await Empleados.findById(req.params.id);

        if (!empleado) {
            return sendNotFound(res, 'Empleado no encontrado');
        }

        return sendSuccess(res, 'Empleado obtenido exitosamente', empleado);
    } catch (error) {
        console.error('Error al obtener empleado:', error);

        if (error.name === 'CastError') {
            return sendBadRequest(res, 'ID inválido');
        }

        return sendError(res, 'Error al obtener empleado', { error: error.message });
    }
};

export const createEmpleado = async (req, res) => {
    try {
        const { nombre, estatus, area, puesto, obra } = req.body;

        // Validar campos requeridos
        if (!nombre || !area || !puesto) {
            return sendBadRequest(res, 'Nombre, área y puesto son requeridos');
        }

        // Crear nuevo empleado
        const newEmpleado = await Empleados.create({
            nombre,
            estatus: estatus || 'ALTA',
            area,
            puesto,
            obra
        });

        return sendCreated(res, 'Empleado creado exitosamente', newEmpleado);
    } catch (error) {
        console.error('Error al crear empleado:', error);
        return sendError(res, 'Error al crear empleado', { error: error.message });
    }
};

export const updateEmpleado = async (req, res) => {
    try {
        const { nombre, estatus, area, puesto, obra } = req.body;

        const updateData = {};
        if (nombre) updateData.nombre = nombre;
        if (estatus) updateData.estatus = estatus;
        if (area) updateData.area = area;
        if (puesto) updateData.puesto = puesto;
        if (obra !== undefined) updateData.obra = obra;

        const empleado = await Empleados.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!empleado) {
            return sendNotFound(res, 'Empleado no encontrado');
        }

        return sendSuccess(res, 'Empleado actualizado exitosamente', empleado);
    } catch (error) {
        console.error('Error al actualizar empleado:', error);

        if (error.name === 'CastError') {
            return sendBadRequest(res, 'ID inválido');
        }

        return sendError(res, 'Error al actualizar empleado', { error: error.message });
    }
};

export const deleteEmpleado = async (req, res) => {
    try {
        // Soft delete: cambiar estatus a Baja
        const empleado = await Empleados.findByIdAndUpdate(
            req.params.id,
            { estatus: 'BAJA' },
            { new: true }
        );

        if (!empleado) {
            return sendNotFound(res, 'Empleado no encontrado');
        }

        return sendSuccess(res, 'Empleado dado de baja correctamente');
    } catch (error) {
        console.error('Error al dar de baja empleado:', error);

        if (error.name === 'CastError') {
            return sendBadRequest(res, 'ID inválido');
        }

        return sendError(res, 'Error al dar de baja empleado', { error: error.message });
    }
};
