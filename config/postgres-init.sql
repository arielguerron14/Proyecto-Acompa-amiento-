-- ============================================================================
-- ACOMPAÑAMIENTO PROJECT - DATABASE INITIALIZATION
-- ============================================================================

-- Create schemas
CREATE SCHEMA IF NOT EXISTS public;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS estudiantes;
CREATE SCHEMA IF NOT EXISTS maestros;

-- ============================================================================
-- AUTHENTICATION SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS auth.usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(512) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auth.sesiones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES auth.usuarios(id),
    token VARCHAR(512) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ESTUDIANTES SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS estudiantes.estudiantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    matricula VARCHAR(50) NOT NULL UNIQUE,
    grado VARCHAR(50) NOT NULL,
    usuario_id INTEGER REFERENCES auth.usuarios(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estudiantes.asistencias (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes.estudiantes(id),
    fecha DATE NOT NULL,
    presente BOOLEAN NOT NULL,
    razon_falta VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS estudiantes.calificaciones (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes.estudiantes(id),
    materia VARCHAR(255) NOT NULL,
    calificacion DECIMAL(5,2) NOT NULL,
    periodo VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- MAESTROS SCHEMA
-- ============================================================================

CREATE TABLE IF NOT EXISTS maestros.maestros (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    especialidad VARCHAR(255) NOT NULL,
    usuario_id INTEGER REFERENCES auth.usuarios(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maestros.clases (
    id SERIAL PRIMARY KEY,
    maestro_id INTEGER NOT NULL REFERENCES maestros.maestros(id),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    dias_semana VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PUBLIC SCHEMA - ACOMPAÑAMIENTO
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.acompañamientos (
    id SERIAL PRIMARY KEY,
    estudiante_id INTEGER NOT NULL REFERENCES estudiantes.estudiantes(id),
    maestro_id INTEGER NOT NULL REFERENCES maestros.maestros(id),
    tipo VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.eventos (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL,
    fecha TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_usuarios_username ON auth.usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON auth.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON auth.sesiones(token);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON auth.sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_estudiantes_matricula ON estudiantes.estudiantes(matricula);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON estudiantes.asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_calificaciones_periodo ON estudiantes.calificaciones(periodo);
CREATE INDEX IF NOT EXISTS idx_acompañamientos_estado ON public.acompañamientos(estado);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON public.eventos(fecha);

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default admin user
INSERT INTO auth.usuarios (username, email, password_hash, rol) 
VALUES ('admin', 'admin@proyecto.local', 'admin123', 'administrador')
ON CONFLICT (username) DO NOTHING;

-- Insert sample maestro
INSERT INTO maestros.maestros (nombre, apellido, email, especialidad)
VALUES ('Juan', 'Pérez', 'juan.perez@proyecto.local', 'Matemáticas')
ON CONFLICT (email) DO NOTHING;

-- Insert sample estudiante
INSERT INTO estudiantes.estudiantes (nombre, apellido, email, matricula, grado)
VALUES ('Carlos', 'González', 'carlos.gonzalez@proyecto.local', 'MAT001', 'Grado 10')
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT ALL PRIVILEGES ON DATABASE acompanamiento_db TO proyecto;
GRANT ALL PRIVILEGES ON SCHEMA public, auth, estudiantes, maestros TO proyecto;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public, auth, estudiantes, maestros TO proyecto;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public, auth, estudiantes, maestros TO proyecto;
