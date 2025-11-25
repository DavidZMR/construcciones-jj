import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';
import { sendSuccess, sendBadRequest, sendUnauthorized, sendError } from '../utils/response.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('Datos recibidos para login:', { username, password: password ? password : undefined });

    console.log('Intento de login para usuario:', username);

    // Validar que se enviaron username y password
    if (!username || !password) {
      console.log('Login fallido: faltan credenciales');
      return sendBadRequest(res, 'Usuario y contraseña son requeridos');
    }

    // Buscar usuario incluyendo la contraseña
    const user = await User.findOne({ username }).select('+password');


    if (!user) {
      console.log('Login fallido: usuario no encontrado');
      return sendUnauthorized(res, 'Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = User.findOne({username}).select('+password').then(user => {
      return user.comparePassword(password);
    });

    if (!isPasswordValid) {
      console.log('Login fallido: contraseña incorrecta');
      return sendUnauthorized(res, 'Credenciales inválidas');
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    // Responder con token y datos del usuario (sin contraseña)
    return sendSuccess(res, 'Login exitoso', {
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return sendError(res, 'Error al iniciar sesión', { error: error.message });
  }
};

export const register = async (req, res) => {
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

    // Responder con token y datos del usuario
    return sendCreated(res, 'Usuario registrado exitosamente', {
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    
    if (error.code === 11000) {
      return sendBadRequest(res, 'El usuario o email ya existe');
    }
    
    return sendError(res, 'Error al registrar usuario', { error: error.message });
  }
};

