import mongoose from 'mongoose';

const empleadosSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    estatus: {
        type: String,
        required: [true, 'El estatus es requerido'],
        default: 'ALTA',
        enum: {
            values: ['ALTA', 'BAJA'],
            message: '{VALUE} no es un estatus válido'
        }
    },
    area: {
        type: String,
        required: [true, 'El área es requerida'],
        trim: true
    },
    puesto: {
        type: String,
        required: [true, 'El puesto es requerido'],
        trim: true
    },
    obra: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

const Empleados = mongoose.model('Empleados', empleadosSchema);

export default Empleados;
