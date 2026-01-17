/**
 * CONFIGURACIÓN CENTRALIZADA DE INFRAESTRUCTURA - CONSUMIDA DESDE config/instance_ips.json
 * 
 * Este archivo lee todas las IPs desde config/instance_ips.json (FUENTE ÚNICA DE VERDAD)
 * Cualquier cambio en las IPs se refleja automáticamente sin modificar este archivo.
 * 
 * ⚠️ IMPORTANTE: Las IPs se actualizan automáticamente ejecutando:
 *   npm run generate:config  (genera archivos desde instance_ips.json)
 */

const fs = require('fs');
const path = require('path');

// Cargar IPs desde config/instance_ips.json
let instanceIps = {};
try {
    const configPath = path.join(__dirname, 'config', 'instance_ips.json');
    instanceIps = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    console.log('✅ IPs cargadas desde config/instance_ips.json');
} catch (error) {
    console.warn('⚠️  No se pudo cargar config/instance_ips.json:', error.message);
}

/**
 * Obtener IP pública de una instancia desde config
 * @param {string} instanceKey - Clave de la instancia en instance_ips.json
 * @param {string} fallback - IP por defecto si no se encuentra
 * @returns {string} IP pública de la instancia
 */
const getPublicIp = (instanceKey, fallback = '') => {
    if (instanceIps[instanceKey] && instanceIps[instanceKey].PublicIpAddress) {
        return instanceIps[instanceKey].PublicIpAddress;
    }
    return fallback || process.env[`${instanceKey}_IP`] || '';
};

/**
 * Obtener IP privada de una instancia desde config
 * @param {string} instanceKey - Clave de la instancia en instance_ips.json
 * @param {string} fallback - IP por defecto si no se encuentra
 * @returns {string} IP privada de la instancia
 */
const getPrivateIp = (instanceKey, fallback = '') => {
    if (instanceIps[instanceKey] && instanceIps[instanceKey].PrivateIpAddress) {
        return instanceIps[instanceKey].PrivateIpAddress;
    }
    return fallback || '';
};

module.exports = {
    // Bandera para indicar que las IPs provienen de config/instance_ips.json
    SOURCE: 'config/instance_ips.json (Single Source of Truth)',
    TIMESTAMP: new Date().toISOString(),
    
    // ============================================
    // AMBIENTE ACTUAL
    // ============================================
    ENVIRONMENT: process.env.ENVIRONMENT || 'production',

    // ============================================
    // IPs PÚBLICAS (consumidas desde instance_ips.json)
    // ============================================
    PUBLIC: {
        // BASTION HOST
        BASTION_IP: getPublicIp('EC-Bastion', process.env.BASTION_IP || '54.91.218.98'),
        BASTION_PORT: process.env.BASTION_PORT || 22,
        BASTION_USER: process.env.BASTION_USER || 'ec2-user',
        BASTION_KEY_PATH: process.env.BASTION_KEY_PATH || './ssh-key-bastion.pem',

        // EC2-DB
        DB_IP: getPublicIp('EC2-DB', process.env.DB_PUBLIC_IP || '3.235.242.53'),
        DB_PORT: 27017,
        
        // EC2-CORE
        CORE_IP: getPublicIp('EC2-CORE', process.env.CORE_PUBLIC_IP || '44.197.251.135'),
        CORE_PORT: 22,

        // EC2-API-Gateway
        API_GATEWAY_IP: getPublicIp('EC2-API-Gateway', process.env.API_GATEWAY_IP || '35.168.216.132'),
        API_GATEWAY_PORT: process.env.API_GATEWAY_PORT || 8080,

        // EC2-Frontend
        FRONTEND_IP: getPublicIp('EC2-Frontend', process.env.FRONTEND_IP || '3.231.12.130'),
        FRONTEND_PORT: process.env.FRONTEND_PORT || 5500,

        // EC2-Notificaciones
        NOTIFICACIONES_IP: getPublicIp('EC2-Notificaciones', process.env.NOTIFICACIONES_IP || '13.222.108.162'),
        NOTIFICACIONES_PORT: 3005,

        // EC2-Messaging
        MESSAGING_IP: getPublicIp('EC2-Messaging', process.env.MESSAGING_IP || '44.201.68.131'),
        MESSAGING_PORT: 5672,

        // EC2-Monitoring
        MONITORING_IP: getPublicIp('EC2-Monitoring', process.env.MONITORING_IP || '100.29.147.5'),
        MONITORING_PORT: 9090,

        // EC2-Reportes
        REPORTES_IP: getPublicIp('EC2-Reportes', process.env.REPORTES_IP || '44.206.88.188'),
        REPORTES_PORT: 5004,
    },

    // ============================================
    // IPs PRIVADAS (para comunicación interna)
    // ============================================
    PRIVATE: {
        BASTION_IP: getPrivateIp('EC-Bastion', '172.31.75.78'),
        DB_IP: getPrivateIp('EC2-DB', '172.31.65.122'),
        CORE_IP: getPrivateIp('EC2-CORE', '172.31.65.0'),
        API_GATEWAY_IP: getPrivateIp('EC2-API-Gateway', '172.31.70.50'),
        FRONTEND_IP: getPrivateIp('EC2-Frontend', '172.31.68.200'),
        NOTIFICACIONES_IP: getPrivateIp('EC2-Notificaciones', '172.31.78.38'),
        MESSAGING_IP: getPrivateIp('EC2-Messaging', '172.31.68.53'),
        MONITORING_IP: getPrivateIp('EC2-Monitoring', '172.31.73.216'),
        REPORTES_IP: getPrivateIp('EC2-Reportes', '172.31.77.76'),
    },

    // ============================================
    // URLs DE ACCESO
    // ============================================
    URLS: {
        api_gateway: () => `http://${module.exports.PUBLIC.API_GATEWAY_IP}:${module.exports.PUBLIC.API_GATEWAY_PORT}`,
        frontend: () => `http://${module.exports.PUBLIC.FRONTEND_IP}:${module.exports.PUBLIC.FRONTEND_PORT}`,
        bastion: () => `ssh://${process.env.BASTION_USER}@${module.exports.PUBLIC.BASTION_IP}:${module.exports.PUBLIC.BASTION_PORT}`,
    },

    // ============================================
    // UTILIDADES
    // ============================================
    
    /**
     * Obtener información completa de una instancia
     * @param {string} instanceKey - Clave en instance_ips.json
     * @returns {object} Objeto con toda la información de la instancia
     */
    getInstance: (instanceKey) => {
        return instanceIps[instanceKey] || null;
    },

    /**
     * Obtener todas las instancias (para debugging/logging)
     * @returns {object} Todas las instancias desde instance_ips.json
     */
    getAllInstances: () => instanceIps,

    /**
     * Verificar si las IPs están disponibles
     * @returns {boolean} true si las IPs se cargaron correctamente
     */
    isConfigValid: () => Object.keys(instanceIps).length > 0,

    /**
     * Obtener un resumen de las IPs activas
     * @returns {object} Resumen de todas las IPs públicas
     */
    getSummary: () => ({
        source: module.exports.SOURCE,
        timestamp: module.exports.TIMESTAMP,
        instances: Object.keys(instanceIps).reduce((acc, key) => {
            acc[key] = {
                public: instanceIps[key].PublicIpAddress,
                private: instanceIps[key].PrivateIpAddress,
            };
            return acc;
        }, {}),
    }),
};
