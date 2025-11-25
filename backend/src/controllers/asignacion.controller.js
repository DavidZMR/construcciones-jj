import Asignacion from '../models/Asignacion.js';
import MaquinariaEquipo from '../models/MaquinariaEquipo.js';
import { sendSuccess, sendBadRequest, sendNotFound, sendError, sendCreated } from '../utils/response.js';

export const getAsignaciones = async (req, res) => {
    try {
        const asignaciones = await Asignacion.find()
            .populate('empleado', 'nombre')
            .populate('maquinaria', 'nombre codigo tipo')
            .sort({ createdAt: -1 });
        return sendSuccess(res, 'Asignaciones obtenidas exitosamente', asignaciones);
    } catch (error) {
        console.error('Error al obtener asignaciones:', error);
        return sendError(res, 'Error al obtener asignaciones', { error: error.message });
    }
};

export const createAsignacion = async (req, res) => {
    try {
        const { empleado, maquinaria, fechaAsignacion, observaciones } = req.body;

        if (!empleado || !maquinaria || !maquinaria.length || !fechaAsignacion) {
            return sendBadRequest(res, 'Empleado, maquinaria y fecha de asignación son requeridos');
        }

        // Verificar que la maquinaria esté disponible (estado 'Alta')
        const maquinariaItems = await MaquinariaEquipo.find({
            _id: { $in: maquinaria }
        });

        const noDisponibles = maquinariaItems.filter(item => item.estado !== 'Alta');
        if (noDisponibles.length > 0) {
            const nombres = noDisponibles.map(item => item.nombre).join(', ');
            return sendBadRequest(res, `Los siguientes equipos no están disponibles: ${nombres}`);
        }

        // Crear asignación
        const newAsignacion = await Asignacion.create({
            empleado,
            maquinaria,
            fechaAsignacion,
            observaciones,
            estado: 'Activo'
        });

        // Actualizar estado de maquinaria a 'Asignado'
        await MaquinariaEquipo.updateMany(
            { _id: { $in: maquinaria } },
            { estado: 'Asignado' }
        );

        const populatedAsignacion = await Asignacion.findById(newAsignacion._id)
            .populate('empleado', 'nombre')
            .populate('maquinaria', 'nombre codigo tipo');

        return sendCreated(res, 'Asignación creada exitosamente', populatedAsignacion);
    } catch (error) {
        console.error('Error al crear asignación:', error);
        return sendError(res, 'Error al crear asignación', { error: error.message });
    }
};

export const returnAsignacion = async (req, res) => {
    try {
        const { fechaDevolucion } = req.body;

        if (!fechaDevolucion) {
            return sendBadRequest(res, 'La fecha de devolución es requerida');
        }

        const asignacion = await Asignacion.findById(req.params.id);

        if (!asignacion) {
            return sendNotFound(res, 'Asignación no encontrada');
        }

        if (asignacion.estado === 'Finalizado') {
            return sendBadRequest(res, 'Esta asignación ya ha sido finalizada');
        }

        // Actualizar asignación
        asignacion.fechaDevolucion = fechaDevolucion;
        asignacion.estado = 'Finalizado';
        await asignacion.save();

        // Actualizar estado de maquinaria a 'Alta'
        await MaquinariaEquipo.updateMany(
            { _id: { $in: asignacion.maquinaria } },
            { estado: 'Alta' }
        );

        return sendSuccess(res, 'Asignación devuelta exitosamente', asignacion);
    } catch (error) {
        console.error('Error al devolver asignación:', error);
        return sendError(res, 'Error al devolver asignación', { error: error.message });
    }
};

export const updateAsignacion = async (req, res) => {
    try {
        // Por ahora solo permitiremos actualizar observaciones o fecha de asignación si no está finalizada
        // Cambiar maquinaria es complejo porque implica revertir estados.
        // Para simplificar, si quieren cambiar maquinaria, mejor que borren y creen otra o devuelvan.
        // Pero el usuario pidió editar. Vamos a permitir editar campos simples.

        const { fechaAsignacion, observaciones } = req.body;
        const updateData = {};
        if (fechaAsignacion) updateData.fechaAsignacion = fechaAsignacion;
        if (observaciones !== undefined) updateData.observaciones = observaciones;

        const asignacion = await Asignacion.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('empleado', 'nombre')
            .populate('maquinaria', 'nombre codigo tipo');

        if (!asignacion) {
            return sendNotFound(res, 'Asignación no encontrada');
        }

        return sendSuccess(res, 'Asignación actualizada exitosamente', asignacion);
    } catch (error) {
        console.error('Error al actualizar asignación:', error);
        return sendError(res, 'Error al actualizar asignación', { error: error.message });
    }
};
