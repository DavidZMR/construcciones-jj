import mongoose from 'mongoose';

const obraSchema = new mongoose.Schema({
    numero_contrato: {
        type: String,
        required: [true, 'El número de contrato es requerido'],
        unique: true,
        trim: true
    },
    nombre_obra: {
        type: String,
        required: [true, 'El nombre de la obra es requerido'],
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
    }
}, {
    timestamps: true
});

const Obra = mongoose.model('Obra', obraSchema);

export default Obra;
