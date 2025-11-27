import User from '../models/User.js';
import { sendSuccess, sendBadRequest, sendNotFound, sendError, sendCreated } from '../utils/response.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return sendSuccess(res, 'Usuarios obtenidos exitosamente', users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return sendError(res, 'Error al obtener usuarios', { error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return sendNotFound(res, 'Usuario no encontrado');
    }
    
    return sendSuccess(res, 'Usuario obtenido exitosamente', user);
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    
    if (error.name === 'CastError') {
      return sendBadRequest(res, 'ID de usuario inválido');
    }
    
    return sendError(res, 'Error al obtener usuario', { error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, rol } = req.body;

    // Validar campos requeridos
    if (!username || !email || !password) {
      return sendBadRequest(res, 'Usuario, email y contraseña son requeridos');
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return sendBadRequest(res, 'El usuario o email ya existe');
    }

    // Crear nuevo usuario
    const user = await User.create({
      username,
      email,
      password,
      rol: rol || 'usuario'
    });

    return sendCreated(res, 'Usuario creado exitosamente', user);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    
    if (error.code === 11000) {
      return sendBadRequest(res, 'El usuario o email ya existe');
    }
    
    return sendError(res, 'Error al crear usuario', { error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { username, email, password, rol } = req.body;
    const updateData = {};

    // Construir objeto de actualización solo con los campos proporcionados
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (rol) updateData.rol = rol;
    if (password) updateData.password = password;

    // Si se actualiza username o email, verificar que no existan ya
    if (username || email) {
      const existingUser = await User.findOne({
        $or: [
          username ? { username, _id: { $ne: req.params.id } } : {},
          email ? { email, _id: { $ne: req.params.id } } : {}
        ]
      });

      if (existingUser) {
        return sendBadRequest(res, 'El usuario o email ya existe');
      }
    }

    // Actualizar usuario
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return sendNotFound(res, 'Usuario no encontrado');
    }

    return sendSuccess(res, 'Usuario actualizado exitosamente', user);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    
    if (error.name === 'CastError') {
      return sendBadRequest(res, 'ID de usuario inválido');
    }
    
    if (error.code === 11000) {
      return sendBadRequest(res, 'El usuario o email ya existe');
    }
    
    return sendError(res, 'Error al actualizar usuario', { error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return sendNotFound(res, 'Usuario no encontrado');
    }

    return sendSuccess(res, 'Usuario eliminado correctamente');
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    
    if (error.name === 'CastError') {
      return sendBadRequest(res, 'ID de usuario inválido');
    }
    
    return sendError(res, 'Error al eliminar usuario', { error: error.message });
  }
};

