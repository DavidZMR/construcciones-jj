/**
 * Utilidad para crear respuestas estándar del API
 * Estructura: { intCode: number, message: string, data?: any }
 */

export const sendResponse = (res, intCode, message, data = null) => {
  const response = {
    intCode,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  // Mapear códigos personalizados a códigos HTTP estándar
  const httpStatusMap = {
    200: 200, // Success
    201: 201, // Created
    400: 400, // Bad Request
    401: 401, // Unauthorized
    403: 403, // Forbidden
    404: 404, // Not Found
    500: 500  // Internal Server Error
  };

  const httpStatus = httpStatusMap[intCode] || 200;
  return res.json(response);
};

// Helpers para respuestas comunes
export const sendSuccess = (res, message, data = null) => {
  return sendResponse(res, 200, message, data);
};

export const sendCreated = (res, message, data = null) => {
  return sendResponse(res, 201, message, data);
};

export const sendBadRequest = (res, message, data = null) => {
  return sendResponse(res, 400, message, data);
};

export const sendUnauthorized = (res, message, data = null) => {
  return sendResponse(res, 401, message, data);
};

export const sendForbidden = (res, message, data = null) => {
  return sendResponse(res, 403, message, data);
};

export const sendNotFound = (res, message, data = null) => {
  return sendResponse(res, 404, message, data);
};

export const sendError = (res, message, data = null) => {
  return sendResponse(res, 500, message, data);
};

