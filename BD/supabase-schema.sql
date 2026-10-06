-- ============================================================================
-- NEXO DEV STUDIO - SCHEMA DE BASE DE DATOS PARA SUPABASE (POSTGRESQL)
-- CRM LIGERO, PROYECTOS, PRUEBAS GRATIS, IMPLEMENTACIÓN, PAGOS Y NOTIFICACIONES
-- ============================================================================

-- Habilitar extensión para UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER DATABASE postgres SET timezone TO 'America/Bogota';

-- ----------------------------------------------------------------------------
-- SCRIPT DE MIGRACIÓN PARA BASES DE DATOS EXISTENTES
-- Execute estas líneas en el Editor SQL de Supabase si ya tienes las tablas creadas:
-- ----------------------------------------------------------------------------
/*
ALTER TABLE public.proyectos DROP CONSTRAINT IF EXISTS proyectos_estado_check;
ALTER TABLE public.proyectos ADD CONSTRAINT proyectos_estado_check CHECK (estado IN ('activo', 'en_prueba', 'pausado', 'finalizado'));

ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS dias_prueba SMALLINT DEFAULT 7;
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS fecha_fin_prueba DATE DEFAULT NULL;
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS valor_implementacion NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS estado_implementacion VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_implementacion IN ('pendiente', 'pagado', 'no_aplica'));
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS fecha_pago_implementacion DATE DEFAULT NULL;

ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(30) DEFAULT 'cuota_mensual' CHECK (tipo_pago IN ('cuota_mensual', 'implementacion'));
*/

-- ----------------------------------------------------------------------------
-- 1. TABLA: clientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    empresa VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(50) NOT NULL, -- Número internacional con prefijo
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de clientes
CREATE INDEX IF NOT EXISTS idx_clientes_estado ON public.clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON public.clientes(empresa);

-- ----------------------------------------------------------------------------
-- 2. TABLA: proyectos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proyectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    nombre_proyecto VARCHAR(200) NOT NULL,
    valor_mensual NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (valor_mensual >= 0),
    dia_cobro SMALLINT NOT NULL DEFAULT 5 CHECK (dia_cobro BETWEEN 1 AND 31),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'en_prueba', 'pausado', 'finalizado')),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Pruebas Gratis
    dias_prueba SMALLINT DEFAULT 7,
    fecha_fin_prueba DATE DEFAULT NULL,

    -- Implementación (Pago único por puesta en producción)
    valor_implementacion NUMERIC(12, 2) DEFAULT 0.00 CHECK (valor_implementacion >= 0),
    estado_implementacion VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_implementacion IN ('pendiente', 'pagado', 'no_aplica')),
    fecha_pago_implementacion DATE DEFAULT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de proyectos
CREATE INDEX IF NOT EXISTS idx_proyectos_cliente_id ON public.proyectos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON public.proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_dia_cobro ON public.proyectos(dia_cobro);
CREATE INDEX IF NOT EXISTS idx_proyectos_implementacion ON public.proyectos(estado_implementacion);

-- ----------------------------------------------------------------------------
-- 3. TABLA: pagos
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto >= 0),
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    periodo_mes VARCHAR(7) NOT NULL, -- Formato YYYY-MM (ej: 2026-10)
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pagado', 'pendiente', 'vencido')),
    tipo_pago VARCHAR(30) DEFAULT 'cuota_mensual' CHECK (tipo_pago IN ('cuota_mensual', 'implementacion')),
    comprobante_url TEXT DEFAULT NULL,
    notas TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de pagos
CREATE INDEX IF NOT EXISTS idx_pagos_proyecto_id ON public.pagos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cliente_id ON public.pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON public.pagos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_tipo ON public.pagos(tipo_pago);
CREATE INDEX IF NOT EXISTS idx_pagos_periodo ON public.pagos(periodo_mes);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON public.pagos(fecha_pago);

-- ----------------------------------------------------------------------------
-- 4. TABLA: notificaciones
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('email', 'whatsapp')),
    mensaje TEXT NOT NULL,
    fecha_envio TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    estado VARCHAR(20) NOT NULL DEFAULT 'enviado' CHECK (estado IN ('enviado', 'fallido', 'pendiente')),
    referencia_pago_id UUID REFERENCES public.pagos(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de notificaciones
CREATE INDEX IF NOT EXISTS idx_notificaciones_cliente ON public.notificaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON public.notificaciones(tipo);
CREATE INDEX IF NOT EXISTS idx_notificaciones_fecha ON public.notificaciones(fecha_envio DESC);

-- ----------------------------------------------------------------------------
-- 5. TRIGGER AUTOMÁTICO PARA UPDATED_AT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_clientes ON public.clientes;
CREATE TRIGGER set_updated_at_clientes
    BEFORE UPDATE ON public.clientes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_proyectos ON public.proyectos;
CREATE TRIGGER set_updated_at_proyectos
    BEFORE UPDATE ON public.proyectos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_pagos ON public.pagos;
CREATE TRIGGER set_updated_at_pagos
    BEFORE UPDATE ON public.pagos
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 6. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso completo a clientes" ON public.clientes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a proyectos" ON public.proyectos
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a pagos" ON public.pagos
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a notificaciones" ON public.notificaciones
    FOR ALL USING (true) WITH CHECK (true);
