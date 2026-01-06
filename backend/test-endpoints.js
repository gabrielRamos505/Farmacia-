// Script de verificación de endpoints
// Ejecutar con: node test-endpoints.js

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';

const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
    warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

async function testEndpoint(method, endpoint, data = null, requiresAuth = false) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: requiresAuth ? { 'Authorization': `Bearer ${authToken}` } : {}
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        log.success(`${method.toUpperCase()} ${endpoint} - Status: ${response.status}`);
        return response.data;
    } catch (error) {
        log.error(`${method.toUpperCase()} ${endpoint} - ${error.response?.status || error.message}`);
        return null;
    }
}

async function runTests() {
    console.log('\n' + '='.repeat(60));
    log.info('INICIANDO VERIFICACIÓN DE ENDPOINTS');
    console.log('='.repeat(60) + '\n');

    // 1. TEST DE AUTENTICACIÓN
    console.log('\n📝 1. AUTENTICACIÓN');
    console.log('-'.repeat(60));

    const loginData = {
        usuario: 'admin',
        password: 'admin123'
    };

    const loginResponse = await testEndpoint('post', '/auth/login', loginData);

    if (loginResponse && loginResponse.token) {
        authToken = loginResponse.token;
        log.success('Token obtenido correctamente');
        log.info(`Usuario: ${loginResponse.user.nombre}`);
        log.info(`Rol: ${loginResponse.user.puesto}`);
        log.info(`Admin: ${loginResponse.user.isAdmin ? 'Sí' : 'No'}`);
    } else {
        log.error('No se pudo obtener el token. Abortando tests...');
        return;
    }

    // 2. TEST DE DASHBOARD
    console.log('\n📊 2. DASHBOARD');
    console.log('-'.repeat(60));
    await testEndpoint('get', '/dashboard/stats', null, true);

    // 3. TEST DE INVENTARIO
    console.log('\n📦 3. INVENTARIO');
    console.log('-'.repeat(60));
    await testEndpoint('get', '/inventory', null, true);
    await testEndpoint('get', '/inventory/low-stock', null, true);

    // 4. TEST DE PRODUCTOS
    console.log('\n💊 4. PRODUCTOS');
    console.log('-'.repeat(60));
    await testEndpoint('get', '/productos', null, true);
    await testEndpoint('get', '/productos/categorias', null, true);

    // 5. TEST DE LOTES
    console.log('\n📋 5. LOTES/STOCK');
    console.log('-'.repeat(60));
    await testEndpoint('get', '/lotes', null, true);
    await testEndpoint('get', '/lotes/proximos-vencer?dias=30', null, true);

    // 6. TEST DE PROVEEDORES
    console.log('\n🚚 6. PROVEEDORES');
    console.log('-'.repeat(60));
    await testEndpoint('get', '/proveedores', null, true);

    // 7. TEST DE VENTAS
    console.log('\n💰 7. VENTAS');
    console.log('-'.repeat(60));
    await testEndpoint('get', '/sales', null, true);
    await testEndpoint('get', '/sales/summary', null, true);
    await testEndpoint('get', '/ventas', null, true);

    // 8. TEST DE CLIENTES
    console.log('\n👥 8. CLIENTES');
    console.log('-'.repeat(60));
    await testEndpoint('get', '/clientes', null, true);

    // 9. TEST DE USUARIOS (Solo Admin)
    console.log('\n👤 9. USUARIOS (Admin)');
    console.log('-'.repeat(60));
    await testEndpoint('get', '/users', null, true);

    // 10. TEST DE POS
    console.log('\n🛒 10. PUNTO DE VENTA');
    console.log('-'.repeat(60));
    await testEndpoint('get', '/pos/productos-disponibles', null, true);

    // RESUMEN
    console.log('\n' + '='.repeat(60));
    log.info('VERIFICACIÓN COMPLETADA');
    console.log('='.repeat(60) + '\n');
    log.warn('Revisa los resultados arriba para ver qué endpoints fallaron');
    log.info('Los endpoints marcados con ✓ están funcionando correctamente');
    log.info('Los endpoints marcados con ✗ necesitan revisión\n');
}

// Ejecutar tests
runTests().catch(error => {
    log.error('Error general en la ejecución de tests:');
    console.error(error);
});
