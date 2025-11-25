import jwt from 'jsonwebtoken';
import jwtConfig from '../config/jwt.js';
import User from '../models/User.js';
import { sendUnauthorized, sendError } from '../utils/response.js';

export const authenticate = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendUnauthorized(res, 'Token no proporcionado');
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    const decoded = jwt.verify(token, jwtConfig.secret);

    // Buscar usuario y adjuntarlo a la request
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return sendUnauthorized(res, 'Usuario no encontrado');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return sendUnauthorized(res, 'Token inválido');
    }
    if (error.name === 'TokenExpiredError') {
      return sendUnauthorized(res, 'Token expirado');
    }
    return sendError(res, 'Error al autenticar', { error: error.message });
  }
};

