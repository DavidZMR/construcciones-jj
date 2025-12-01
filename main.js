const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Sistema de logging para debugging
const logFile = path.join(app.getPath('userData'), 'app-debug.log');
function log(message, isError = false) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${isError ? 'ERROR: ' : ''}${message}\n`;

    // Escribir a archivo
    try {
        fs.appendFileSync(logFile, logMessage);
    } catch (err) {
        console.error('Error writing to log file:', err);
    }

    // También mostrar en consola
    if (isError) {
        console.error(logMessage);
    } else {
        console.log(logMessage);
    }
}

log('=== Aplicación iniciada ===');
log(`Versión de Electron: ${process.versions.electron}`);
log(`Versión de Node: ${process.versions.node}`);
log(`Plataforma: ${process.platform}`);
log(`Ruta de ejecución: ${process.execPath}`);
log(`Directorio de usuario: ${app.getPath('userData')}`);
log(`Archivo de log: ${logFile}`);

let mainWindow;
let backendProcess;

// Protección para evitar múltiples instancias de la aplicación
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    log('Ya existe una instancia de la aplicación, cerrando...');
    app.quit();
} else {
    // Si alguien intenta abrir otra instancia, enfocar la ventana existente
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        log('Intento de abrir segunda instancia detectado');
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}

function createWindow() {
    log('=== Creando ventana principal ===');
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        icon: app.isPackaged
            ? path.join(__dirname, 'dist/construcciones-jj/browser/assets/icons/icon.ico')
            : path.join(__dirname, 'src/assets/icons/icon.ico'),
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    const isDev = !app.isPackaged;
    const indexPath = path.join(__dirname, 'dist/construcciones-jj/browser/index.html');

    log(`Cargando interfaz desde: ${indexPath}`);

    if (fs.existsSync(indexPath)) {
        mainWindow.loadFile(indexPath);
        log('✓ Interfaz cargada correctamente');
    } else {
        log(`ERROR: No se encontró el archivo index.html en: ${indexPath}`, true);
    }

    mainWindow.on('closed', function () {
        log('Ventana principal cerrada');
        mainWindow = null;
    });
}

function startBackend() {
    log('=== Iniciando Backend ===');
    const isDev = !app.isPackaged;
    let backendPath;
    let cwd;

    log(`Modo: ${isDev ? 'Desarrollo' : 'Producción'}`);

    if (isDev) {
        backendPath = path.join(__dirname, 'backend', 'src', 'index.js');
        cwd = path.join(__dirname, 'backend');
    } else {
        // In production, backend is in resources/backend
        backendPath = path.join(process.resourcesPath, 'backend', 'src', 'index.js');
        cwd = path.join(process.resourcesPath, 'backend');
    }

    log(`Backend path: ${backendPath}`);
    log(`Backend CWD: ${cwd}`);
    log(`process.resourcesPath: ${process.resourcesPath || 'undefined'}`);

    // Verificar que existan las rutas
    if (!fs.existsSync(backendPath)) {
        log(`ERROR: Backend entry point no encontrado en: ${backendPath}`, true);

        // Intentar listar el contenido del directorio padre para debugging
        const parentDir = path.dirname(backendPath);
        log(`Intentando listar contenido de: ${parentDir}`);
        try {
            if (fs.existsSync(parentDir)) {
                const files = fs.readdirSync(parentDir);
                log(`Archivos encontrados: ${files.join(', ')}`);
            } else {
                log(`ERROR: El directorio padre tampoco existe: ${parentDir}`, true);

                // Intentar listar resources
                if (process.resourcesPath && fs.existsSync(process.resourcesPath)) {
                    log(`Listando contenido de resources: ${process.resourcesPath}`);
                    const resourceFiles = fs.readdirSync(process.resourcesPath);
                    log(`Archivos en resources: ${resourceFiles.join(', ')}`);
                }
            }
        } catch (err) {
            log(`ERROR al listar directorio: ${err.message}`, true);
        }

        return;
    }

    log('✓ Backend entry point encontrado');

    // Verificar package.json del backend
    const backendPackageJson = path.join(cwd, 'package.json');
    if (fs.existsSync(backendPackageJson)) {
        log('✓ package.json del backend encontrado');
        try {
            const pkg = JSON.parse(fs.readFileSync(backendPackageJson, 'utf8'));
            log(`Backend package: ${pkg.name} v${pkg.version}`);
            log(`Type: ${pkg.type || 'commonjs'}`);
        } catch (err) {
            log(`ERROR leyendo package.json: ${err.message}`, true);
        }
    } else {
        log('ADVERTENCIA: package.json del backend no encontrado', true);
    }

    // Verificar .env
    const envPath = path.join(cwd, '.env');
    if (fs.existsSync(envPath)) {
        log('✓ Archivo .env encontrado');
    } else {
        log('ADVERTENCIA: Archivo .env no encontrado', true);
    }

    // Verificar node_modules
    const nodeModulesPath = path.join(cwd, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
        log('✓ node_modules del backend encontrado');

        // Verificar dependencias críticas
        const criticalDeps = ['express', 'mongoose', 'dotenv'];
        criticalDeps.forEach(dep => {
            const depPath = path.join(nodeModulesPath, dep);
            if (fs.existsSync(depPath)) {
                log(`  ✓ ${dep} encontrado`);
            } else {
                log(`  ✗ ${dep} NO encontrado`, true);
            }
        });
    } else {
        log('ERROR: node_modules del backend no encontrado', true);
    }

    log('Iniciando proceso del backend...');
    log(`Ejecutable: ${process.execPath}`);
    log(`Argumentos: [${backendPath}]`);
    log(`ELECTRON_RUN_AS_NODE: 1`);

    // SOLUCIÓN: Usar ELECTRON_RUN_AS_NODE para ejecutar Electron como Node.js puro
    try {
        backendProcess = spawn(process.execPath, [backendPath], {
            cwd: cwd,
            env: {
                ...process.env,
                PORT: '3000',
                ELECTRON_RUN_AS_NODE: '1'
            },
            stdio: ['pipe', 'pipe', 'pipe']
        });

        log(`✓ Proceso del backend iniciado con PID: ${backendProcess.pid}`);

        backendProcess.stdout.on('data', (data) => {
            const message = data.toString().trim();
            log(`[Backend STDOUT] ${message}`);
        });

        backendProcess.stderr.on('data', (data) => {
            const message = data.toString().trim();
            log(`[Backend STDERR] ${message}`, true);
        });

        backendProcess.on('error', (err) => {
            log(`ERROR en proceso del backend: ${err.message}`, true);
            log(`Stack: ${err.stack}`, true);
        });

        backendProcess.on('exit', (code, signal) => {
            log(`Backend process exited with code ${code} and signal ${signal}`, code !== 0);
            if (code !== 0) {
                log('El backend se cerró con un código de error', true);
            }
        });
    } catch (err) {
        log(`ERROR al iniciar el proceso del backend: ${err.message}`, true);
        log(`Stack: ${err.stack}`, true);
    }
}

app.on('ready', () => {
    log('=== Evento ready disparado ===');
    startBackend();
    createWindow();
});

app.on('window-all-closed', function () {
    log('Todas las ventanas cerradas');
    if (process.platform !== 'darwin') {
        log('Cerrando aplicación...');
        app.quit();
    }
});

app.on('quit', () => {
    log('=== Aplicación cerrándose ===');
    if (backendProcess) {
        log('Matando proceso del backend...');
        backendProcess.kill();
    }
});

app.on('activate', function () {
    log('Evento activate disparado');
    if (mainWindow === null) {
        createWindow();
    }
});
