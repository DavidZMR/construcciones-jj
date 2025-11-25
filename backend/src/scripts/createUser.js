import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import connectDB from '../config/database.js';

dotenv.config();

const createDefaultUser = async () => {
  try {
    // Conectar a la base de datos
    await connectDB();

    // Datos del usuario por defecto
    const defaultUser = {
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      rol: 'admin'
    };

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      $or: [
        { username: defaultUser.username },
        { email: defaultUser.email }
      ]
    });

    if (existingUser) {
      console.log('El usuario por defecto ya existe');
      process.exit(0);
    }

    // Crear el usuario
    const user = await User.create(defaultUser);
    console.log('Usuario por defecto creado exitosamente:');
    console.log('Username:', user.username);
    console.log('Email:', user.email);
    console.log('Rol:', user.rol);
    console.log('\nPuedes iniciar sesión con:');
    console.log('Usuario: admin');
    console.log('Contraseña: admin123');

    process.exit(0);
  } catch (error) {
    console.error('Error al crear usuario por defecto:', error);
    process.exit(1);
  }
};

createDefaultUser();

