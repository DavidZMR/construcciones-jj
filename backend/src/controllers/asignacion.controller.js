import Asignacion from '../models/Asignacion.js';
import MaquinariaEquipo from '../models/MaquinariaEquipo.js';
import { sendSuccess, sendBadRequest, sendNotFound, sendError, sendCreated } from '../utils/response.js';

export const getAsignaciones = async (req, res) => {
    try {
        const asignaciones = await Asignacion.find()
            .populate('empleado', 'nombre')
            .populate('maquinaria.item', 'nombre codigo tipo')
            .populate('obra', 'nombre_obra numero_contrato')
            .sort({ createdAt: -1 });
        return sendSuccess(res, 'Asignaciones obtenidas exitosamente', asignaciones);
    } catch (error) {
        console.error('Error al obtener asignaciones:', error);
        return sendError(res, 'Error al obtener asignaciones', { error: error.message });
    }
};

export const createAsignacion = async (req, res) => {
    try {
        const { empleado, maquinaria, fechaAsignacion, obra } = req.body;

        if (!empleado || !maquinaria || !maquinaria.length || !fechaAsignacion) {
            return sendBadRequest(res, 'Empleado, maquinaria y fecha de asignación son requeridos');
        }

        // Extract IDs for availability check
        const maquinariaIds = maquinaria.map(m => m.item);

        // Verificar que la maquinaria esté disponible (estado 'Alta')
        const maquinariaItems = await MaquinariaEquipo.find({
            _id: { $in: maquinariaIds }
        });

        const noDisponibles = maquinariaItems.filter(item => item.estado !== 'Alta');
        if (noDisponibles.length > 0) {
            const nombres = noDisponibles.map(item => item.nombre).join(', ');
            return sendBadRequest(res, `Los siguientes equipos no están disponibles: ${nombres}`);
        }

        // Crear asignación
        const asignacionData = {
            empleado,
            maquinaria, // Array of { item, cantidad, observaciones }
            fechaAsignacion,
            estado: 'Activo'
        };

        if (obra) {
            asignacionData.obra = obra;
        }

        const newAsignacion = await Asignacion.create(asignacionData);

        // Actualizar estado de maquinaria a 'Asignado'
        await MaquinariaEquipo.updateMany(
            { _id: { $in: maquinariaIds } },
            { estado: 'Asignado' }
        );

        const populatedAsignacion = await Asignacion.findById(newAsignacion._id)
            .populate('empleado', 'nombre')
            .populate('maquinaria.item', 'nombre codigo tipo')
            .populate('obra', 'nombre_obra numero_contrato');

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

        // Extract IDs to update status
        const maquinariaIds = asignacion.maquinaria.map(m => m.item);

        // Actualizar estado de maquinaria a 'Alta'
        await MaquinariaEquipo.updateMany(
            { _id: { $in: maquinariaIds } },
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
        const { fechaAsignacion, obra, empleado, maquinaria } = req.body;
        const updateData = {};

        if (fechaAsignacion) updateData.fechaAsignacion = fechaAsignacion;
        if (obra !== undefined) updateData.obra = obra || null;
        if (empleado) updateData.empleado = empleado;

        const asignacion = await Asignacion.findById(req.params.id);

        if (!asignacion) {
            return sendNotFound(res, 'Asignación no encontrada');
        }

        if (asignacion.estado === 'Finalizado') {
            return sendBadRequest(res, 'No se puede editar una asignación finalizada');
        }

        // Handle Maquinaria Update
        if (maquinaria && Array.isArray(maquinaria)) {
            // 1. Revert status of OLD machinery to 'Alta'
            const oldMaquinariaIds = asignacion.maquinaria.map(m => m.item);
            await MaquinariaEquipo.updateMany(
                { _id: { $in: oldMaquinariaIds } },
                { estado: 'Alta' }
            );

            // 2. Check availability of NEW machinery
            const newMaquinariaIds = maquinaria.map(m => m.item);
            const maquinariaItems = await MaquinariaEquipo.find({
                _id: { $in: newMaquinariaIds }
            });

            const noDisponibles = maquinariaItems.filter(item => item.estado !== 'Alta');

            // If any is not available, revert the revert? Or just fail?
            // If we fail here, we must re-assign the old ones back to 'Asignado' to restore state.
            if (noDisponibles.length > 0) {
                // Restore old status
                await MaquinariaEquipo.updateMany(
                    { _id: { $in: oldMaquinariaIds } },
                    { estado: 'Asignado' }
                );
                const nombres = noDisponibles.map(item => item.nombre).join(', ');
                return sendBadRequest(res, `Los siguientes equipos no están disponibles: ${nombres}`);
            }

            // 3. Update assignment data
            updateData.maquinaria = maquinaria;

            // 4. Set status of NEW machinery to 'Asignado'
            // We do this AFTER saving the assignment successfully, or here if we are sure.
            // Let's do it here, if assignment save fails, we have a problem. 
            // Better: Update assignment first, then update status.
        }

        const updatedAsignacion = await Asignacion.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('empleado', 'nombre')
            .populate('maquinaria.item', 'nombre codigo tipo')
            .populate('obra', 'nombre_obra numero_contrato');

        // If machinery was updated, set new status to 'Asignado'
        if (maquinaria && Array.isArray(maquinaria)) {
            const newMaquinariaIds = maquinaria.map(m => m.item);
            await MaquinariaEquipo.updateMany(
                { _id: { $in: newMaquinariaIds } },
                { estado: 'Asignado' }
            );
        }

        return sendSuccess(res, 'Asignación actualizada exitosamente', updatedAsignacion);
    } catch (error) {
        console.error('Error al actualizar asignación:', error);
        return sendError(res, 'Error al actualizar asignación', { error: error.message });
    }
};
