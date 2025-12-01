import mongoose from 'mongoose';

const asignacionSchema = new mongoose.Schema({
    empleado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empleados',
        required: [true, 'El empleado es requerido']
    },
    maquinaria: [{
        item: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MaquinariaEquipo',
            required: true
        },
        cantidad: {
            type: Number,
            required: true,
            default: 1,
            min: [1, 'La cantidad debe ser mayor a 0']
        },
        cantidadDevuelta: {
            type: Number,
            default: 0,
            min: [0, 'La cantidad devuelta no puede ser negativa']
        },
        fechaDevolucionItem: {
            type: Date
        },
        observaciones: {
            type: String,
            trim: true
        }
    }],
    fechaAsignacion: {
        type: Date,
        required: [true, 'La fecha de asignación es requerida']
    },
    fechaDevolucion: {
        type: Date
    },
    // observaciones removed from here as it is now per item
    obra: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Obra'
    },
    estado: {
        type: String,
        enum: ['Activo', 'Finalizado'],
        default: 'Activo'
    }
}, {
    timestamps: true
});

const Asignacion = mongoose.model('Asignacion', asignacionSchema);

export default Asignacion;
