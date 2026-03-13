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

        // Extract IDs for validation
        const maquinariaIds = maquinaria.map(m => m.item);

        // Verificar que la maquinaria no esté dada de baja
        const maquinariaItems = await MaquinariaEquipo.find({
            _id: { $in: maquinariaIds }
        });

        const dadosDeBaja = maquinariaItems.filter(item => item.estado === 'Baja');
        if (dadosDeBaja.length > 0) {
            const nombres = dadosDeBaja.map(item => item.nombre).join(', ');
            return sendBadRequest(res, `Los siguientes equipos están dados de baja: ${nombres}`);
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
        const { fechaDevolucion, itemsDevueltos } = req.body;

        if (!fechaDevolucion) {
            return sendBadRequest(res, 'La fecha de devolución es requerida');
        }

        if (!itemsDevueltos || !Array.isArray(itemsDevueltos) || itemsDevueltos.length === 0) {
            return sendBadRequest(res, 'Debe especificar al menos un item para devolver');
        }

        const asignacion = await Asignacion.findById(req.params.id);

        if (!asignacion) {
            return sendNotFound(res, 'Asignación no encontrada');
        }

        if (asignacion.estado === 'Finalizado') {
            return sendBadRequest(res, 'Esta asignación ya ha sido finalizada');
        }

        // Validar y procesar cada item devuelto
        for (const itemDevuelto of itemsDevueltos) {
            const { itemId, cantidadDevuelta } = itemDevuelto;

            if (!itemId || !cantidadDevuelta || cantidadDevuelta <= 0) {
                return sendBadRequest(res, 'Cada item debe tener un ID válido y una cantidad mayor a 0');
            }

            // Buscar el item en la asignación - Priorizar items con pendiente
            const matchingItems = asignacion.maquinaria.filter(
                m => m.item.toString() === itemId.toString()
            );

            if (matchingItems.length === 0) {
                return sendBadRequest(res, `El item ${itemId} no pertenece a esta asignación`);
            }

            // Buscar uno que tenga cantidad pendiente
            let maquinariaItem = matchingItems.find(
                m => (m.cantidad - (m.cantidadDevuelta || 0)) > 0
            );

            // Si todos están devueltos, tomar el primero para que el error de validación abajo lo reporte
            if (!maquinariaItem) {
                maquinariaItem = matchingItems[0];
            }

            // Validar que no se devuelva más de lo asignado
            const cantidadPendiente = maquinariaItem.cantidad - (maquinariaItem.cantidadDevuelta || 0);
            if (cantidadDevuelta > cantidadPendiente) {
                return sendBadRequest(res, `No se puede devolver ${cantidadDevuelta} unidades. Solo hay ${cantidadPendiente} pendientes de devolución`);
            }

            // Actualizar cantidad devuelta
            maquinariaItem.cantidadDevuelta = (maquinariaItem.cantidadDevuelta || 0) + cantidadDevuelta;

            // Si se devolvió completamente, marcar fecha de devolución del item
            if (maquinariaItem.cantidadDevuelta >= maquinariaItem.cantidad) {
                maquinariaItem.fechaDevolucionItem = fechaDevolucion;
            }
        }

        // Verificar si todos los items están completamente devueltos
        const todosDevueltos = asignacion.maquinaria.every(
            m => (m.cantidadDevuelta || 0) >= m.cantidad
        );

        // Actualizar estado de la asignación
        if (todosDevueltos) {
            asignacion.estado = 'Finalizado';
            asignacion.fechaDevolucion = fechaDevolucion;

            // SOLO cuando la asignación se finaliza, verificar qué maquinaria puede regresar a 'Alta'
            // Solo si NO está en ninguna otra asignación activa
            const allMaquinariaIds = asignacion.maquinaria.map(m => m.item);

            for (const maqId of allMaquinariaIds) {
                // Buscar si este equipo está en otras asignaciones activas
                const otrasAsignacionesActivas = await Asignacion.countDocuments({
                    _id: { $ne: asignacion._id }, // Excluir la asignación actual
                    'maquinaria.item': maqId,
                    estado: 'Activo' // Solo asignaciones activas
                });

                // Si no hay otras asignaciones activas, cambiar a 'Alta'
                if (otrasAsignacionesActivas === 0) {
                    await MaquinariaEquipo.updateOne(
                        { _id: maqId },
                        { estado: 'Alta' }
                    );
                }
            }
        }

        await asignacion.save();

        const populatedAsignacion = await Asignacion.findById(asignacion._id)
            .populate('empleado', 'nombre')
            .populate('maquinaria.item', 'nombre codigo tipo')
            .populate('obra', 'nombre_obra numero_contrato');

        return sendSuccess(res, 'Devolución procesada exitosamente', populatedAsignacion);
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
            // Verificar que la nueva maquinaria no esté dada de baja
            const newMaquinariaIds = maquinaria.map(m => m.item);
            const maquinariaItems = await MaquinariaEquipo.find({
                _id: { $in: newMaquinariaIds }
            });

            const dadosDeBaja = maquinariaItems.filter(item => item.estado === 'Baja');
            if (dadosDeBaja.length > 0) {
                const nombres = dadosDeBaja.map(item => item.nombre).join(', ');
                return sendBadRequest(res, `Los siguientes equipos están dados de baja: ${nombres}`);
            }

            // Update assignment data
            updateData.maquinaria = maquinaria;
        }

        const updatedAsignacion = await Asignacion.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        ).populate('empleado', 'nombre')
            .populate('maquinaria.item', 'nombre codigo tipo')
            .populate('obra', 'nombre_obra numero_contrato');

        // Si se actualizó la maquinaria, gestionar estados inteligentemente
        if (maquinaria && Array.isArray(maquinaria)) {
            const oldMaquinariaIds = asignacion.maquinaria.map(m => m.item);
            const newMaquinariaIds = maquinaria.map(m => m.item);

            // Para cada equipo antiguo, verificar si puede regresar a 'Alta'
            for (const oldMaqId of oldMaquinariaIds) {
                // Si el equipo ya no está en la nueva lista
                if (!newMaquinariaIds.some(id => id.toString() === oldMaqId.toString())) {
                    // Verificar si está en otras asignaciones activas
                    const otrasAsignacionesActivas = await Asignacion.countDocuments({
                        _id: { $ne: req.params.id },
                        'maquinaria.item': oldMaqId,
                        estado: 'Activo'
                    });

                    // Si no hay otras asignaciones activas, cambiar a 'Alta'
                    if (otrasAsignacionesActivas === 0) {
                        await MaquinariaEquipo.updateOne(
                            { _id: oldMaqId },
                            { estado: 'Alta' }
                        );
                    }
                }
            }

            // Marcar la nueva maquinaria como 'Asignado'
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

export const getAssignedMachinery = async (req, res) => {
    try {
        const asignacionesActivas = await Asignacion.find({ estado: 'Activo' })
            .populate('empleado', 'nombre')
            .populate('obra', 'nombre_obra')
            .populate('maquinaria.item', 'nombre codigo');

        let assignedItems = [];

        asignacionesActivas.forEach(asignacion => {
            if (asignacion.maquinaria && Array.isArray(asignacion.maquinaria)) {
                asignacion.maquinaria.forEach(m => {
                    // Calculamos cantidad pendiente para saber si sigue asignada
                    const cantidadPendiente = m.cantidad - (m.cantidadDevuelta || 0);
                    // Si hay items pendientes y el item existe (no es null)
                    if (cantidadPendiente > 0 && m.item) {
                        assignedItems.push({
                            id: m.item._id,
                            code: m.item.codigo,
                            name: m.item.nombre,
                            quantity: cantidadPendiente,
                            fechaAsignacion: asignacion.fechaAsignacion,
                            assigned_to: {
                                person_id: asignacion.empleado?._id,
                                person_name: asignacion.empleado?.nombre || 'Desconocido'
                            },
                            project: {
                                project_id: asignacion.obra?._id,
                                project_name: asignacion.obra?.nombre_obra || 'Sin obra asignada'
                            },
                            assigned_quantity: m.cantidad,
                            returned_quantity: m.cantidadDevuelta || 0
                        });
                    }
                });
            }
        });

        return sendSuccess(res, 'Maquinaria asignada obtenida exitosamente', assignedItems);
    } catch (error) {
        console.error('Error al obtener maquinaria asignada:', error);
        return sendError(res, 'Error al obtener maquinaria asignada', { error: error.message });
    }
};
