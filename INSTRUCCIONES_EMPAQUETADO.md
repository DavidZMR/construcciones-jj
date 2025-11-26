# Instrucciones para Empaquetar la Aplicación Electron

## Problemas Resueltos

### 1. Backend no funcionaba en otras máquinas
**Causa**: Se usaba `fork()` que requiere Node.js instalado en el sistema  
**Solución**: Ahora se usa `spawn()` con `ELECTRON_RUN_AS_NODE=1` para usar el Node.js embebido de Electron

### 2. Se abrían múltiples ventanas al ejecutar el .exe
**Causa**: No había protección de instancia única y el backend se ejecutaba como Electron en lugar de Node.js  
**Solución**: 
- Agregado `app.requestSingleInstanceLock()` para permitir solo una instancia
- Agregada variable de entorno `ELECTRON_RUN_AS_NODE=1` para ejecutar el backend como Node.js puro

## Cambios Realizados

### 1. main.js
- ✅ Agregado `app.requestSingleInstanceLock()` para evitar múltiples instancias
- ✅ Agregado manejo de evento `second-instance` para enfocar ventana existente
- ✅ Cambiado de `fork()` a `spawn()` con `ELECTRON_RUN_AS_NODE=1`
- ✅ Esto permite que el backend funcione sin Node.js instalado y sin abrir ventanas múltiples

### 2. package.json
- ✅ Agregado `backend/package.json` a `extraResources` para asegurar compatibilidad

## Pasos para Generar el Ejecutable

### 1. Preparar el Backend
```bash
cd backend
npm install
cd ..
```

### 2. Construir el Frontend
```bash
npm run build
```

### 3. Generar el Ejecutable
```bash
npm run electron:build
```

### 4. Ubicación del Instalador
El instalador se generará en:
```
release/Construcciones JJ Setup [version].exe
```

## Verificación Antes de Distribuir

### Verificar que existan estos archivos en `release/win-unpacked/resources/`:
- ✅ `backend/` (carpeta completa)
- ✅ `backend/src/` (código fuente)
- ✅ `backend/node_modules/` (dependencias)
- ✅ `backend/.env` (configuración)
- ✅ `backend/package.json` (metadatos del backend)

### Probar en Modo Desarrollo
Antes de generar el ejecutable, prueba que todo funcione:
```bash
npm run electron:dev
```

## Requisitos de la Máquina de Destino

### ✅ NO Requiere:
- Node.js instalado
- npm instalado
- Variables de entorno configuradas

### ⚠️ SÍ Requiere:
- **MongoDB** debe estar accesible (local o remoto)
- El archivo `.env` del backend debe tener la configuración correcta de MongoDB
- Windows 10 o superior

## Configuración del .env del Backend

Asegúrate de que `backend/.env` tenga la configuración correcta antes de empaquetar:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/construcciones-jj
# O si usas MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/construcciones-jj

# JWT
JWT_SECRET=tu_clave_secreta_super_segura_aqui

# Puerto (no cambiar, el frontend espera 3000)
PORT=3000
```

## Solución de Problemas

### Si el backend no inicia:
1. Verifica los logs de Electron (se muestran en la consola durante desarrollo)
2. Asegúrate de que MongoDB esté corriendo y accesible
3. Verifica que el `.env` esté correctamente configurado

### Si hay errores de módulos no encontrados:
1. Elimina `backend/node_modules`
2. Ejecuta `cd backend && npm install`
3. Vuelve a generar el ejecutable

### Para ver logs en producción:
Los logs de Electron se guardan en:
```
%APPDATA%\Construcciones JJ\logs\
```

## Comandos Útiles

```bash
# Limpiar builds anteriores
Remove-Item -Recurse -Force release

# Reinstalar dependencias del backend
cd backend
Remove-Item -Recurse -Force node_modules
npm install
cd ..

# Reinstalar dependencias del frontend
Remove-Item -Recurse -Force node_modules
npm install

# Build completo desde cero
npm run build
npm run electron:build
```

## Notas Importantes

1. **Cada vez que cambies el código del backend**, debes:
   - Volver a generar el ejecutable con `npm run electron:build`
   
2. **MongoDB debe estar configurado correctamente**:
   - Si usas MongoDB local, la máquina de destino debe tener MongoDB instalado
   - Si usas MongoDB Atlas (nube), solo necesitas internet

3. **El .env se incluye en el ejecutable**:
   - No incluyas credenciales sensibles si vas a distribuir públicamente
   - Considera usar variables de entorno del sistema para producción

4. **Tamaño del ejecutable**:
   - El instalador será grande (~150-300 MB) porque incluye:
     - Electron (Chromium + Node.js)
     - Angular compilado
     - Backend completo con node_modules
