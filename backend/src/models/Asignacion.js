import mongoose from 'mongoose';

const asignacionSchema = new mongoose.Schema({
    empleado: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Empleados',
        required: [true, 'El empleado es requerido']
    },
    maquinaria: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MaquinariaEquipo'
    }],
    fechaAsignacion: {
        type: Date,
        required: [true, 'La fecha de asignación es requerida']
    },
    fechaDevolucion: {
        type: Date
    },
    observaciones: {
        type: String,
        trim: true
    },
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
