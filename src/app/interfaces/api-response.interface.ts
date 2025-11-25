/**
 * Interfaz estándar para las respuestas del API
 */
export interface ApiResponse<T = any> {
  intCode: number;
  message: string;
  data?: T;
}

/**
 * Interfaz para respuesta de login
 */
export interface LoginResponseData {
  token: string;
  user: {
    id: string;
    username: string;
    email: string;
    rol: string;
  };
}

export type LoginResponse = ApiResponse<LoginResponseData>;

/**
 * Interfaz para respuesta de usuarios
 */
export interface User {
  _id?: string;
  id?: string;
  username: string;
  email: string;
  password?: string;
  rol: string;
  createdAt?: string;
  updatedAt?: string;
}

export type UsersResponse = ApiResponse<User[]>;
export type UserResponse = ApiResponse<User>;

/**
 * Interfaz para Maquinaria y Equipo
 */
export interface MaquinariaEquipo {
  _id?: string;
  id?: string;
  codigo: string;
  nombre: string;
  tipo: 'Vehiculo' | 'Herramienta' | 'Maquinaria';
  estado?: 'Alta' | 'Baja' | 'Asignado';
  descripcion?: string;
  placa?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MaquinariaEquipoListResponse = ApiResponse<MaquinariaEquipo[]>;
export type MaquinariaEquipoResponse = ApiResponse<MaquinariaEquipo>;


