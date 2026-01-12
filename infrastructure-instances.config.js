/**
 * 🏗️ CONFIGURACIÓN SEPARADA POR INSTANCIA EC2
 * 
 * Nueva arquitectura: Cada servicio en su propia instancia
 * - Direccionamiento público y privado separados
 * - Mejor escalabilidad y mantenimiento
 * - Seguridad mejorada con instancias privadas
 * 
 * Fecha: Enero 2026
 * Versión: 2.0 (Instancias Separadas)
 */

module.exports = {
  // ==========================================
  // 1️⃣ EC2-CORE (3.234.198.34)
  // Microservicios: auth, estudiantes, maestros
  // ==========================================
  EC2_CORE: {
    name: 'EC2-CORE',
    public: {
      ip: '3.234.198.34',
      elastic: '3.234.198.34',
      accessible: true,
      description: 'IP pública fija (Elastic IP)'
    },
    private: {
      ip: '172.31.78.183',
      accessible: false,
      description: 'IP privada para comunicación interna AWS'
    },
    services: {
      'micro-auth': {
        port: 3000,
        url_public: 'http://3.234.198.34:3000',
        url_private: 'http://172.31.78.183:3000',
        description: 'Autenticación y gestión de usuarios'
      },
      'micro-estudiantes': {
        port: 3001,
        url_public: 'http://3.234.198.34:3001',
        url_private: 'http://172.31.78.183:3001',
        description: 'Gestión de estudiantes'
      },
      'micro-maestros': {
        port: 3002,
        url_public: 'http://3.234.198.34:3002',
        url_private: 'http://172.31.78.183:3002',
        description: 'Gestión de maestros y disponibilidad'
      }
    },
    docker_compose: 'docker-compose.core.yml',
    instance_type: 't2.medium',
    region: 'us-east-1'
  },

  // ==========================================
  // 2️⃣ EC2-API-GATEWAY (52.71.188.181)
  // Microservicio: api-gateway
  // ==========================================
  EC2_API_GATEWAY: {
    name: 'EC2-API-Gateway',
    public: {
      ip: '52.71.188.181',
      elastic: '52.71.188.181',
      accessible: true,
      description: 'IP pública fija (Elastic IP)'
    },
    private: {
      ip: '172.31.76.105',
      accessible: false,
      description: 'IP privada para comunicación interna AWS'
    },
    services: {
      'api-gateway': {
        port: 8080,
        url_public: 'http://52.71.188.181:8080',
        url_private: 'http://172.31.76.105:8080',
        description: 'Gateway API (proxy reverso y enrutamiento)'
      }
    },
    routes_to: {
      micro_auth: 'http://172.31.78.183:3000',
      micro_estudiantes: 'http://172.31.78.183:3001',
      micro_maestros: 'http://172.31.78.183:3002',
      micro_reportes_estudiantes: 'http://172.31.69.133:5003',
      micro_reportes_maestros: 'http://172.31.69.133:5004',
      micro_notificaciones: 'http://172.31.65.57:5006',
      micro_analytics: 'http://172.31.73.6:5007'
    },
    docker_compose: 'docker-compose.api-gateway.yml',
    instance_type: 't2.medium',
    region: 'us-east-1'
  },

  // ==========================================
  // 3️⃣ EC2-FRONTEND (107.21.124.81)
  // Frontend web: HTML, CSS, JS
  // ==========================================
  EC2_FRONTEND: {
    name: 'EC2-Frontend',
    public: {
      ip: '107.21.124.81',
      elastic: '107.21.124.81',
      accessible: true,
      description: 'IP pública fija (Elastic IP)'
    },
    private: {
      ip: '172.31.69.203',
      accessible: false,
      description: 'IP privada para comunicación interna AWS'
    },
    services: {
      'frontend-web': {
        port: 80,
        url_public: 'http://107.21.124.81',
        url_public_https: 'https://107.21.124.81',
        url_private: 'http://172.31.69.203',
        description: 'Aplicación web - Interfaz de usuario'
      }
    },
    api_gateway_endpoint: 'http://52.71.188.181:8080',
    docker_compose: 'docker-compose.frontend.yml',
    instance_type: 't2.small',
    region: 'us-east-1'
  },

  // ==========================================
  // 4️⃣ EC2-REPORTES (54.175.62.79)
  // Microservicios: reportes-estudiantes, reportes-maestros
  // ==========================================
  EC2_REPORTES: {
    name: 'EC2-Reportes',
    public: {
      ip: '54.175.62.79',
      elastic: '54.175.62.79',
      accessible: true,
      description: 'IP pública fija (Elastic IP)'
    },
    private: {
      ip: '172.31.69.133',
      accessible: false,
      description: 'IP privada para comunicación interna AWS'
    },
    services: {
      'micro-reportes-estudiantes': {
        port: 5003,
        url_public: 'http://54.175.62.79:5003',
        url_private: 'http://172.31.69.133:5003',
        description: 'Generación de reportes de estudiantes'
      },
      'micro-reportes-maestros': {
        port: 5004,
        url_public: 'http://54.175.62.79:5004',
        url_private: 'http://172.31.69.133:5004',
        description: 'Generación de reportes de maestros'
      }
    },
    databases: {
      postgresql: '172.31.79.193:5432',
      mongodb: '172.31.79.193:27017'
    },
    docker_compose: 'docker-compose.reportes.yml',
    instance_type: 't2.medium',
    region: 'us-east-1'
  },

  // ==========================================
  // 5️⃣ EC2-NOTIFICACIONES (100.31.143.213)
  // Microservicio: notificaciones
  // ==========================================
  EC2_NOTIFICACIONES: {
    name: 'EC2-Notificaciones',
    public: {
      ip: '100.31.143.213',
      elastic: null,
      accessible: true,
      description: 'IP pública (sin Elastic IP - puede cambiar en reboot)'
    },
    private: {
      ip: '172.31.65.57',
      accessible: false,
      description: 'IP privada para comunicación interna AWS'
    },
    services: {
      'micro-notificaciones': {
        port: 5006,
        url_public: 'http://100.31.143.213:5006',
        url_private: 'http://172.31.65.57:5006',
        description: 'Sistema de notificaciones (email, SMS, push)'
      }
    },
    messaging: {
      kafka: '172.31.73.6:9092',
      rabbitmq: '172.31.73.6:5672'
    },
    databases: {
      postgresql: '172.31.79.193:5432'
    },
    docker_compose: 'docker-compose.notificaciones.yml',
    instance_type: 't2.small',
    region: 'us-east-1'
  },

  // ==========================================
  // 6️⃣ EC2-MESSAGING (3.235.24.36)
  // Servicios: Kafka, RabbitMQ, Zookeeper
  // ==========================================
  EC2_MESSAGING: {
    name: 'EC2-Messaging',
    public: {
      ip: '3.235.24.36',
      elastic: null,
      accessible: true,
      description: 'IP pública (sin Elastic IP - puede cambiar en reboot)'
    },
    private: {
      ip: '172.31.73.6',
      accessible: false,
      description: 'IP privada para comunicación interna AWS'
    },
    services: {
      'kafka': {
        port: 9092,
        url_public: '3.235.24.36:9092',
        url_private: '172.31.73.6:9092',
        description: 'Message broker - Kafka'
      },
      'rabbitmq': {
        port: 5672,
        url_public: '3.235.24.36:5672',
        url_private: '172.31.73.6:5672',
        description: 'Message broker - RabbitMQ'
      },
      'zookeeper': {
        port: 2181,
        url_public: '3.235.24.36:2181',
        url_private: '172.31.73.6:2181',
        description: 'Coordinador Zookeeper para Kafka'
      }
    },
    docker_compose: 'docker-compose.messaging.yml',
    instance_type: 't2.medium',
    region: 'us-east-1'
  },

  // ==========================================
  // 7️⃣ EC2-MONITORING (54.198.235.28)
  // Servicios: Prometheus, Grafana
  // ==========================================
  EC2_MONITORING: {
    name: 'EC2-Monitoring',
    public: {
      ip: '54.198.235.28',
      elastic: '54.198.235.28',
      accessible: true,
      description: 'IP pública fija (Elastic IP)'
    },
    private: {
      ip: '172.31.71.151',
      accessible: false,
      description: 'IP privada para comunicación interna AWS'
    },
    services: {
      'prometheus': {
        port: 9090,
        url_public: 'http://54.198.235.28:9090',
        url_private: 'http://172.31.71.151:9090',
        description: 'Prometheus - Base de datos de métricas'
      },
      'grafana': {
        port: 3001,
        url_public: 'http://54.198.235.28:3001',
        url_private: 'http://172.31.71.151:3001',
        description: 'Grafana - Visualización de métricas'
      }
    },
    targets: {
      core: '172.31.78.183:9090',
      api_gateway: '172.31.76.105:9090',
      reportes: '172.31.69.133:9090',
      notificaciones: '172.31.65.57:9090',
      messaging: '172.31.73.6:9090'
    },
    docker_compose: 'docker-compose.monitoring.yml',
    instance_type: 't2.small',
    region: 'us-east-1'
  },

  // ==========================================
  // 8️⃣ EC2-DB (44.222.119.15)
  // Bases de datos: MongoDB, PostgreSQL, Redis
  // ==========================================
  EC2_DB: {
    name: 'EC2-DB',
    public: {
      ip: '44.222.119.15',
      elastic: null,
      accessible: false,
      description: 'IP pública (sin Elastic IP, NO ACCESIBLE públicamente)'
    },
    private: {
      ip: '172.31.79.193',
      accessible: true,
      description: 'IP privada (ÚNICA forma de acceso desde VPC)'
    },
    services: {
      'mongodb': {
        port: 27017,
        url_public: null,
        url_private: 'mongodb://172.31.79.193:27017',
        description: 'Base de datos NoSQL MongoDB'
      },
      'postgresql': {
        port: 5432,
        url_public: null,
        url_private: 'postgresql://172.31.79.193:5432',
        description: 'Base de datos relacional PostgreSQL'
      },
      'redis': {
        port: 6379,
        url_public: null,
        url_private: 'redis://172.31.79.193:6379',
        description: 'Cache en memoria Redis'
      }
    },
    docker_compose: 'docker-compose.databases.yml',
    instance_type: 't2.medium',
    region: 'us-east-1',
    security_note: 'CRÍTICO: Solo accesible desde VPC privada. NO exponer a internet.'
  },

  // ==========================================
  // 📊 RESUMEN Y RUTAS
  // ==========================================
  SUMMARY: {
    total_instances: 8,
    public_ips: 5,  // Con IP Elástica fija
    private_instances: 1,  // EC2-DB sin IP pública
    elastic_ips_count: 5,
    monthly_cost_estimate: '$70-80'
  },

  // ==========================================
  // 🔗 RUTAS DE COMUNICACIÓN
  // ==========================================
  COMMUNICATION_ROUTES: {
    // Desde Internet (público)
    internet_to_frontend: {
      route: 'Internet → 107.21.124.81 (EC2-Frontend)',
      protocol: 'HTTP/HTTPS',
      port: 80,
      security: 'CloudFront recomendado'
    },
    internet_to_api: {
      route: 'Internet → 52.71.188.181:8080 (EC2-API-Gateway)',
      protocol: 'HTTP/HTTPS',
      port: 8080,
      security: 'WAF recomendado'
    },
    internet_to_reportes: {
      route: 'Internet → 54.175.62.79:5003/5004 (EC2-Reportes)',
      protocol: 'HTTP/HTTPS',
      port: '5003, 5004',
      security: 'A través de API Gateway preferentemente'
    },

    // Interno (privado - VPC)
    api_gateway_to_core: {
      route: '52.71.188.181 → 172.31.78.183:3000-3002 (EC2-CORE)',
      protocol: 'HTTP interno',
      security: 'Security Group privado'
    },
    api_gateway_to_reportes: {
      route: '52.71.188.181 → 172.31.69.133:5003-5004 (EC2-Reportes)',
      protocol: 'HTTP interno',
      security: 'Security Group privado'
    },
    microservices_to_messaging: {
      route: 'Servicios → 172.31.73.6:9092/5672 (EC2-Messaging)',
      protocol: 'AMQP/Kafka',
      security: 'Security Group privado'
    },
    services_to_database: {
      route: 'Servicios → 172.31.79.193:27017/5432/6379 (EC2-DB)',
      protocol: 'TCP nativo',
      security: 'Security Group muy restrictivo'
    },
    services_to_monitoring: {
      route: 'Servicios → 172.31.71.151:9090 (EC2-Monitoring)',
      protocol: 'Prometheus scraping',
      security: 'Security Group privado'
    }
  },

  // ==========================================
  // 🚀 COMANDOS DE DEPLOYMENT
  // ==========================================
  DEPLOYMENT_COMMANDS: {
    core: 'docker-compose -f docker-compose.core.yml up -d',
    api_gateway: 'docker-compose -f docker-compose.api-gateway.yml up -d',
    frontend: 'docker-compose -f docker-compose.frontend.yml up -d',
    reportes: 'docker-compose -f docker-compose.reportes.yml up -d',
    notificaciones: 'docker-compose -f docker-compose.notificaciones.yml up -d',
    messaging: 'docker-compose -f docker-compose.messaging.yml up -d',
    monitoring: 'docker-compose -f docker-compose.monitoring.yml up -d',
    databases: 'docker-compose -f docker-compose.databases.yml up -d',
    all: 'npm run deploy:all'
  },

  // ==========================================
  // 🔐 SECURITY GROUPS NECESARIOS
  // ==========================================
  SECURITY_GROUPS: {
    public_instances: {
      inbound: [
        { port: 80, protocol: 'TCP', source: '0.0.0.0/0', description: 'HTTP' },
        { port: 443, protocol: 'TCP', source: '0.0.0.0/0', description: 'HTTPS' },
        { port: 3000, protocol: 'TCP', source: 'VPC-CIDR', description: 'Servicios internos' },
        { port: 5003, protocol: 'TCP', source: '0.0.0.0/0', description: 'API reportes' },
        { port: 8080, protocol: 'TCP', source: '0.0.0.0/0', description: 'API Gateway' }
      ],
      outbound: [
        { port: 'all', protocol: 'all', destination: '0.0.0.0/0', description: 'Acceso total saliente' }
      ]
    },
    private_instances: {
      inbound: [
        { port: 'all', protocol: 'all', source: 'VPC-CIDR', description: 'Todo desde VPC' }
      ],
      outbound: [
        { port: 'all', protocol: 'all', destination: 'VPC-CIDR', description: 'Salida a VPC' },
        { port: 443, protocol: 'TCP', destination: '0.0.0.0/0', description: 'HTTPS para updates' }
      ]
    }
  }
};
