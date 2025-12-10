import mongoose from 'mongoose';

const maquinariaEquipoSchema = new mongoose.Schema({
    codigo: {
        type: String,
        required: [true, 'El código es requerido'],
        unique: true,
        trim: true
    },
    nombre: {
        type: String,
        required: [true, 'El nombre es requerido'],
        trim: true
    },
    tipo: {
        type: String,
        required: [true, 'El tipo es requerido'],
        enum: {
            values: ['Vehículo', 'Herramienta', 'Maquinaria'],
            message: '{VALUE} no es un tipo válido'
        }
    },
    estado: {
        type: String,
        default: 'Alta',
        enum: {
            values: ['Alta', 'Baja', 'Asignado'],
            message: '{VALUE} no es un estado válido'
        }
    },
    descripcion: {
        type: String,
        trim: true
    },
    placa: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Validación personalizada para placa
maquinariaEquipoSchema.pre('validate', function (next) {
    if (this.tipo === 'Vehículo' && !this.placa) {
        this.invalidate('placa', 'La placa es requerida para vehículos');
    }
    next();
});

const MaquinariaEquipo = mongoose.model('MaquinariaEquipo', maquinariaEquipoSchema);

export default MaquinariaEquipo;
