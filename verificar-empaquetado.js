const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración antes de empaquetar...\n');

let hasErrors = false;

// 1. Verificar que exista el backend
const backendPath = path.join(__dirname, 'backend');
if (!fs.existsSync(backendPath)) {
    console.error('❌ ERROR: No se encuentra la carpeta backend/');
    hasErrors = true;
} else {
    console.log('✅ Carpeta backend/ encontrada');
}

// 2. Verificar backend/src/index.js
const backendIndexPath = path.join(__dirname, 'backend', 'src', 'index.js');
if (!fs.existsSync(backendIndexPath)) {
    console.error('❌ ERROR: No se encuentra backend/src/index.js');
    hasErrors = true;
} else {
    console.log('✅ backend/src/index.js encontrado');
}

// 3. Verificar backend/node_modules
const backendNodeModulesPath = path.join(__dirname, 'backend', 'node_modules');
if (!fs.existsSync(backendNodeModulesPath)) {
    console.error('❌ ERROR: No se encuentra backend/node_modules/');
    console.error('   Ejecuta: cd backend && npm install');
    hasErrors = true;
} else {
    console.log('✅ backend/node_modules/ encontrado');
}

// 4. Verificar backend/package.json
const backendPackageJsonPath = path.join(__dirname, 'backend', 'package.json');
if (!fs.existsSync(backendPackageJsonPath)) {
    console.error('❌ ERROR: No se encuentra backend/package.json');
    hasErrors = true;
} else {
    console.log('✅ backend/package.json encontrado');

    // Verificar que sea type: module
    const packageJson = JSON.parse(fs.readFileSync(backendPackageJsonPath, 'utf8'));
    if (packageJson.type !== 'module') {
        console.warn('⚠️  ADVERTENCIA: backend/package.json no tiene "type": "module"');
    }
}

// 5. Verificar backend/.env
const backendEnvPath = path.join(__dirname, 'backend', '.env');
if (!fs.existsSync(backendEnvPath)) {
    console.warn('⚠️  ADVERTENCIA: No se encuentra backend/.env');
    console.warn('   La aplicación podría no funcionar sin configuración');
} else {
    console.log('✅ backend/.env encontrado');

    // Verificar contenido básico del .env
    const envContent = fs.readFileSync(backendEnvPath, 'utf8');
    if (!envContent.includes('MONGODB_URI')) {
        console.warn('⚠️  ADVERTENCIA: backend/.env no contiene MONGODB_URI');
    }
    if (!envContent.includes('JWT_SECRET')) {
        console.warn('⚠️  ADVERTENCIA: backend/.env no contiene JWT_SECRET');
    }
}

// 6. Verificar que el frontend esté compilado
const distPath = path.join(__dirname, 'dist', 'construcciones-jj', 'browser');
if (!fs.existsSync(distPath)) {
    console.error('❌ ERROR: No se encuentra dist/construcciones-jj/browser/');
    console.error('   Ejecuta: npm run build');
    hasErrors = true;
} else {
    console.log('✅ Frontend compilado encontrado');
}

// 7. Verificar main.js
const mainJsPath = path.join(__dirname, 'main.js');
if (!fs.existsSync(mainJsPath)) {
    console.error('❌ ERROR: No se encuentra main.js');
    hasErrors = true;
} else {
    console.log('✅ main.js encontrado');

    // Verificar que use spawn en lugar de fork
    const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
    if (mainJsContent.includes('fork(')) {
        console.error('❌ ERROR: main.js todavía usa fork() en lugar de spawn()');
        console.error('   Esto causará que el backend no funcione en otras máquinas');
        hasErrors = true;
    } else if (mainJsContent.includes('spawn(')) {
        console.log('✅ main.js usa spawn() correctamente');
    }

    // Verificar protección de instancia única
    if (!mainJsContent.includes('requestSingleInstanceLock')) {
        console.warn('⚠️  ADVERTENCIA: main.js no tiene protección de instancia única');
        console.warn('   Esto podría causar que se abran múltiples ventanas');
    } else {
        console.log('✅ Protección de instancia única configurada');
    }

    // Verificar ELECTRON_RUN_AS_NODE
    if (!mainJsContent.includes('ELECTRON_RUN_AS_NODE')) {
        console.error('❌ ERROR: main.js no usa ELECTRON_RUN_AS_NODE');
        console.error('   Esto causará que se abran múltiples ventanas al ejecutar el backend');
        hasErrors = true;
    } else {
        console.log('✅ ELECTRON_RUN_AS_NODE configurado correctamente');
    }
}

// 8. Verificar package.json principal
const mainPackageJsonPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(mainPackageJsonPath)) {
    console.error('❌ ERROR: No se encuentra package.json');
    hasErrors = true;
} else {
    const mainPackageJson = JSON.parse(fs.readFileSync(mainPackageJsonPath, 'utf8'));

    // Verificar que tenga electron-builder configurado
    if (!mainPackageJson.build) {
        console.error('❌ ERROR: package.json no tiene configuración de build');
        hasErrors = true;
    } else {
        console.log('✅ Configuración de electron-builder encontrada');

        // Verificar extraResources
        if (!mainPackageJson.build.extraResources) {
            console.error('❌ ERROR: No se configuraron extraResources para el backend');
            hasErrors = true;
        } else {
            const hasBackendResource = mainPackageJson.build.extraResources.some(
                resource => resource.from === 'backend' || resource.from === 'backend/'
            );
            if (hasBackendResource) {
                console.log('✅ Backend configurado en extraResources');
            } else {
                console.error('❌ ERROR: Backend no está en extraResources');
                hasErrors = true;
            }
        }
    }
}

console.log('\n' + '='.repeat(50));
if (hasErrors) {
    console.log('❌ HAY ERRORES QUE DEBEN CORREGIRSE ANTES DE EMPAQUETAR');
    console.log('='.repeat(50));
    process.exit(1);
} else {
    console.log('✅ TODO ESTÁ LISTO PARA EMPAQUETAR');
    console.log('='.repeat(50));
    console.log('\nEjecuta: npm run electron:build');
    process.exit(0);
}
