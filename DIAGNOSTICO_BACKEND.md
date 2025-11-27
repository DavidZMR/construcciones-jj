# Cómo Diagnosticar Problemas del Backend en Otras Máquinas

## 📋 Sistema de Logging Implementado

He agregado un sistema de logging detallado que guarda **TODA** la información de ejecución en un archivo de log. Esto te permitirá ver exactamente qué está pasando cuando instalas la aplicación en otra máquina.

## 📍 Ubicación del Archivo de Log

El archivo de log se guarda en:

### Windows:
```
%APPDATA%\Construcciones JJ\app-debug.log
```

Ruta completa típica:
```
C:\Users\[NombreDeUsuario]\AppData\Roaming\Construcciones JJ\app-debug.log
```

### Cómo Acceder al Archivo de Log:

#### Opción 1: Usando el Explorador de Archivos
1. Presiona `Windows + R`
2. Escribe: `%APPDATA%\Construcciones JJ`
3. Presiona Enter
4. Busca el archivo `app-debug.log`

#### Opción 2: Desde la Barra de Direcciones
1. Abre el Explorador de Archivos
2. En la barra de direcciones, pega: `%APPDATA%\Construcciones JJ`
3. Presiona Enter

## 📝 Qué Información Contiene el Log

El archivo de log contiene información detallada sobre:

### 1. Información del Sistema
- Versión de Electron
- Versión de Node.js
- Plataforma (Windows/Mac/Linux)
- Rutas de ejecución

### 2. Inicio del Backend
- Modo de ejecución (Desarrollo/Producción)
- Ruta del backend
- Verificación de archivos:
  - ✓ Backend entry point (index.js)
  - ✓ package.json
  - ✓ .env
  - ✓ node_modules
  - ✓ Dependencias críticas (express, mongoose, dotenv)

### 3. Proceso del Backend
- PID del proceso
- Salida estándar (STDOUT) del backend
- Errores (STDERR) del backend
- Códigos de salida

### 4. Errores Detallados
- Mensajes de error completos
- Stack traces
- Listado de archivos cuando algo no se encuentra

## 🔍 Pasos para Diagnosticar el Problema

### En la Máquina Donde NO Funciona:

1. **Ejecuta la aplicación**
   - Instala el .exe
   - Ejecuta la aplicación
   - Espera unos segundos (aunque no funcione)

2. **Encuentra el archivo de log**
   - Presiona `Windows + R`
   - Escribe: `%APPDATA%\Construcciones JJ`
   - Abre `app-debug.log`

3. **Copia el contenido completo del archivo**
   - Abre el archivo con Notepad
   - Selecciona todo (Ctrl+A)
   - Copia (Ctrl+C)

4. **Envíame el contenido del log**
   - Pégalo en un mensaje
   - O guárdalo en un archivo .txt y compártelo

## 🔎 Qué Buscar en el Log

### Errores Comunes:

#### 1. Backend no encontrado
```
ERROR: Backend entry point no encontrado en: [ruta]
```
**Causa**: El backend no se empaquetó correctamente  
**Solución**: Verificar que `backend/` esté en `extraResources`

#### 2. node_modules no encontrado
```
ERROR: node_modules del backend no encontrado
```
**Causa**: Las dependencias del backend no se empaquetaron  
**Solución**: Verificar que `backend/node_modules` esté en `extraResources`

#### 3. Dependencias faltantes
```
✗ express NO encontrado
✗ mongoose NO encontrado
```
**Causa**: Dependencias específicas no se empaquetaron  
**Solución**: Reinstalar dependencias del backend antes de empaquetar

#### 4. Error de MongoDB
```
[Backend STDERR] MongooseError: ...
```
**Causa**: MongoDB no está instalado o no está corriendo  
**Solución**: Instalar MongoDB o configurar MongoDB Atlas

#### 5. Error de módulos ES
```
[Backend STDERR] SyntaxError: Cannot use import statement outside a module
```
**Causa**: Problema con ES Modules  
**Solución**: Verificar que `backend/package.json` tenga `"type": "module"`

## 🛠️ Soluciones Rápidas

### Si el log muestra que falta el backend:
```bash
# Verificar que el backend esté en extraResources
npm run verify-build
```

### Si el log muestra que faltan dependencias:
```bash
# Reinstalar dependencias del backend
cd backend
Remove-Item -Recurse -Force node_modules
npm install
cd ..

# Volver a empaquetar
npm run electron:build
```

### Si el log muestra errores de MongoDB:
- Instalar MongoDB en la máquina de destino, O
- Configurar MongoDB Atlas (nube) en el `.env`

## 📧 Información para Compartir

Cuando me compartas el log, incluye también:

1. **Sistema Operativo**: Windows 10/11, versión
2. **¿MongoDB instalado?**: Sí/No
3. **¿Primera vez instalando?**: Sí/No
4. **Contenido completo del archivo `app-debug.log`**

## 🎯 Próximos Pasos

1. Genera un nuevo .exe con el sistema de logging:
   ```bash
   npm run electron:build
   ```

2. Instala en la otra máquina

3. Ejecuta la aplicación

4. Encuentra y comparte el archivo de log

Con esta información podré decirte exactamente qué está fallando y cómo solucionarlo.
