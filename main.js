const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

let mainWindow;
let backendProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        // icon: path.join(__dirname, 'dist/construcciones-jj/browser/assets/icons/icon.png') // Uncomment if icon exists
    });

    // In dev, we might want to load localhost, but for simplicity and consistency with build,
    // we'll load the built files. 
    // Ideally in dev: loadURL('http://localhost:4200')
    // In prod: loadFile(...)

    const isDev = !app.isPackaged;

    if (isDev) {
        // If running with ng serve, use localhost
        // mainWindow.loadURL('http://localhost:4200');
        // But since we are packaging, let's test the build artifact
        mainWindow.loadFile(path.join(__dirname, 'dist/construcciones-jj/browser/index.html'));
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist/construcciones-jj/browser/index.html'));
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function startBackend() {
    const isDev = !app.isPackaged;
    let backendPath;
    let cwd;

    if (isDev) {
        backendPath = path.join(__dirname, 'backend', 'src', 'index.js');
        cwd = path.join(__dirname, 'backend');
    } else {
        // In production, backend is in resources/backend
        backendPath = path.join(process.resourcesPath, 'backend', 'src', 'index.js');
        cwd = path.join(process.resourcesPath, 'backend');
    }

    console.log('Starting backend from:', backendPath);
    console.log('Backend CWD:', cwd);

    if (!fs.existsSync(backendPath)) {
        console.error('Backend entry point not found at:', backendPath);
        return;
    }

    // Use fork to run the backend script using Electron's Node environment
    // We pass the CWD so dotenv can find the .env file if it's in the backend root
    backendProcess = fork(backendPath, [], {
        cwd: cwd,
        env: { ...process.env, PORT: 3000 },
        stdio: 'pipe'
    });

    backendProcess.stdout.on('data', (data) => {
        console.log(`Backend: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
        console.error(`Backend Error: ${data}`);
    });

    backendProcess.on('error', (err) => {
        console.error('Backend process failed:', err);
    });
}

app.on('ready', () => {
    startBackend();
    createWindow();
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
    if (backendProcess) {
        backendProcess.kill();
    }
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});
