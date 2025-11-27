# Backend - Construcciones JJ

API REST construida con Node.js, Express y MongoDB para el sistema de Construcciones JJ.

## Requisitos Previos

- Node.js (versión 18 o superior)
- MongoDB instalado y corriendo localmente o acceso a MongoDB Atlas

## Instalación

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
Crea un archivo `.env` en la raíz del directorio `backend/` con el siguiente contenido:

```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/construcciones-jj
JWT_SECRET=tu_secret_jwt_super_seguro_cambiar_en_produccion
JWT_EXPIRES_IN=7d
```

**Nota:** Cambia `JWT_SECRET` por un valor seguro en producción.

## Ejecución

### Modo desarrollo (con recarga automática):
```bash
npm run dev
```

### Modo producción:
```bash
npm start
```

El servidor se ejecutará en `http://localhost:3000`

### Crear usuario inicial:

Para crear un usuario por defecto (admin/admin123):

```bash
npm run create-user
```

Esto creará un usuario con:
- Username: `admin`
- Password: `admin123`
- Email: `admin@example.com`
- Rol: `admin`

**Nota:** Asegúrate de tener MongoDB corriendo antes de ejecutar este comando.

## Endpoints

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
  - Body: `{ "username": "usuario", "password": "contraseña" }`
  
- `POST /api/auth/register` - Registrar nuevo usuario
  - Body: `{ "username": "usuario", "email": "email@ejemplo.com", "password": "contraseña", "rol": "usuario" }`

### Usuarios (Requieren autenticación JWT)

- `GET /api/users` - Listar todos los usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `POST /api/users` - Crear nuevo usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Autenticación

Todas las rutas de usuarios requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

## Estructura del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js      # Configuración de MongoDB
│   │   └── jwt.js           # Configuración de JWT
│   ├── controllers/
│   │   ├── auth.controller.js   # Controlador de autenticación
│   │   └── user.controller.js   # Controlador de usuarios
│   ├── middleware/
│   │   └── auth.middleware.js   # Middleware de autenticación JWT
│   ├── models/
│   │   └── User.js          # Modelo de Usuario
│   ├── routes/
│   │   ├── auth.routes.js   # Rutas de autenticación
│   │   └── user.routes.js   # Rutas de usuarios
│   └── index.js             # Punto de entrada
├── .env                     # Variables de entorno (no incluido en git)
├── package.json
└── README.md
```

