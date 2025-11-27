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

/**
 * Interfaz para Empleados
 */
export interface Empleado {
  _id?: string;
  id?: string;
  nombre: string;
  estatus: 'ALTA' | 'BAJA';
  area: string;
  puesto: string;
  obra?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type EmpleadoListResponse = ApiResponse<Empleado[]>;
export type EmpleadoResponse = ApiResponse<Empleado>;

/**
 * Interfaz para Asignaciones
 */
export interface Asignacion {
  _id?: string;
  id?: string;
  empleado: Empleado | string; // Puede ser el objeto poblado o el ID
  maquinaria: {
    item: MaquinariaEquipo | string;
    cantidad: number;
    observaciones?: string;
  }[]; // Array de objetos con item, cantidad y observaciones
  obra?: any; // Obra poblada o ID. Usamos any temporalmente para evitar dependencias circulares o complejas si Obra no está aquí.
  fechaAsignacion: string; // ISO Date string
  fechaDevolucion?: string; // ISO Date string
  // observaciones removed from here as it is now per item
  estado: 'Activo' | 'Finalizado';
  createdAt?: string;
  updatedAt?: string;
}

export type AsignacionListResponse = ApiResponse<Asignacion[]>;
export type AsignacionResponse = ApiResponse<Asignacion>;
