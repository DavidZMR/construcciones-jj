# Construcciones JJ

Aplicación de escritorio para gestión de construcciones, desarrollada con Angular y Electron.

## Requisitos Previos

- Node.js (versión 18 o superior)
- npm (versión 10.8.2 o superior)
- MongoDB (local o MongoDB Atlas)

## Instalación

### 1. Instalar dependencias en la carpeta raíz

```bash
npm install
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
cd ..
```

### 3. Configurar variables de entorno

Crear un archivo `.env` en la carpeta `backend` con las siguientes credenciales:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/construcciones-jj
# O para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/construcciones-jj

# JWT
JWT_SECRET=tu_clave_secreta_super_segura_aqui

# Puerto del servidor
PORT=3000
```

**Importante:** Asegúrate de usar una conexión MongoDB accesible desde cualquier equipo si planeas distribuir la aplicación.

## Desarrollo

### Ejecutar en modo desarrollo

```bash
npm run electron:dev
```

Esto iniciará el servidor de desarrollo de Angular y abrirá la aplicación Electron.

### Solo frontend (Angular)

```bash
npm run start
```

### Solo backend

```bash
cd backend
npm run dev
```

## Generar Instalador

Para crear el instalador ejecutable (.exe) de la aplicación:

```bash
npm run electron:build
```

El instalador se generará en la carpeta `release/`.

**Nota:** Antes de generar el instalador, asegúrate de:
- Tener todas las dependencias instaladas (raíz y backend)
- Configurar correctamente el archivo `.env` en la carpeta `backend`
- Usar una URI de MongoDB accesible desde otros equipos (MongoDB Atlas recomendado)

## Estructura del Proyecto

```
construcciones-jj/
├── src/                    # Código fuente Angular (frontend)
├── backend/                # API Node.js + Express
│   ├── src/               # Código fuente del backend
│   ├── .env               # Variables de entorno (crear manualmente)
│   └── package.json       # Dependencias del backend
├── dist/                   # Build del frontend
├── release/                # Instaladores generados
├── main.js                 # Proceso principal de Electron
└── package.json            # Dependencias principales

```

## Tecnologías

- **Frontend:** Angular 21, Angular Material
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **Desktop:** Electron
- **Autenticación:** JWT (JSON Web Tokens)

## Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run start` | Servidor de desarrollo Angular |
| `npm run build` | Build de producción Angular |
| `npm run electron:dev` | Desarrollo con Electron |
| `npm run electron:build` | Generar instalador |
| `cd backend && npm run dev` | Servidor backend en desarrollo |
| `cd backend && npm run create-user` | Crear usuario administrador |

## Solución de Problemas

### El backend no funciona en el instalador

1. Verifica que instalaste las dependencias del backend: `cd backend && npm install`
2. Asegúrate de que el archivo `backend/.env` existe y tiene las credenciales correctas
3. Si usas MongoDB local, considera migrar a MongoDB Atlas para distribución

### Error de conexión a MongoDB

- Verifica que MongoDB esté corriendo (si es local)
- Verifica que la URI en `.env` sea correcta
- Para MongoDB Atlas, asegúrate de permitir acceso desde cualquier IP (0.0.0.0/0)

## Licencia

Privado - Construcciones JJ
