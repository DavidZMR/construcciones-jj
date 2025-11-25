import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database.js';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import maquinariaEquipoRoutes from './routes/maquinariaEquipo.routes.js';

// Cargar variables de entorno
dotenv.config();

// Conectar a MongoDB
connectDB();

// Crear aplicación Express
const app = express();

// Middleware
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/maquinaria-equipo', maquinariaEquipoRoutes);

import { sendSuccess, sendError } from './utils/response.js';

// Ruta de prueba
app.get('/api/health', (req, res) => {
  return sendSuccess(res, 'API funcionando correctamente');
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  return sendError(res, 'Error interno del servidor', { error: err.message });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

