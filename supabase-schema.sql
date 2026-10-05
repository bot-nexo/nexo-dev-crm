-- ============================================================================
-- NEXO DEV STUDIO - SCHEMA DE BASE DE DATOS PARA SUPABASE (POSTGRESQL)
-- CRM LIGERO, PROYECTOS, PAGOS Y NOTIFICACIONES
-- ============================================================================

-- Habilitar extensión para UUIDs si no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. TABLA: clientes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    empresa VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(50) NOT NULL, -- Número internacional con prefijo (ej: +5491123456789)
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
    dia_cobro SMALLINT NOT NULL DEFAULT 1 CHECK (dia_cobro BETWEEN 1 AND 31),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'pausado', 'finalizado')),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de proyectos
CREATE INDEX IF NOT EXISTS idx_proyectos_cliente_id ON public.proyectos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON public.proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_dia_cobro ON public.proyectos(dia_cobro);

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
    comprobante_url TEXT DEFAULT NULL,
    notas TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de pagos
CREATE INDEX IF NOT EXISTS idx_pagos_proyecto_id ON public.pagos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cliente_id ON public.pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON public.pagos(estado);
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

-- Políticas de acceso para anon / authenticated en entorno de agencia
-- (Permite lectura, inserción, actualización y eliminación para el CRM)
CREATE POLICY "Permitir acceso completo a clientes" ON public.clientes
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a proyectos" ON public.proyectos
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a pagos" ON public.pagos
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Permitir acceso completo a notificaciones" ON public.notificaciones
    FOR ALL USING (true) WITH CHECK (true);

-- ----------------------------------------------------------------------------
-- 7. DATOS INICIALES DE PRUEBA (SEED DATA - NEXO DEV STUDIO)
-- ----------------------------------------------------------------------------
INSERT INTO public.clientes (id, nombre, empresa, email, telefono, estado)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Lucas Morales', 'Aura Fintech', 'lucas@aurafintech.io', '+5491145678901', 'activo'),
    ('a0000000-0000-0000-0000-000000000002', 'Valeria Rossi', 'Kroma Digital', 'valeria@kromadigital.com', '+5491198765432', 'activo'),
    ('a0000000-0000-0000-0000-000000000003', 'Martín Gómez', 'Vortex Logistics', 'mgomez@vortexlog.com', '+525512345678', 'activo'),
    ('a0000000-0000-0000-0000-000000000004', 'Camila Benítez', 'Nova Retail Group', 'camila@novaretail.co', '+573105557890', 'inactivo')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.proyectos (id, cliente_id, nombre_proyecto, valor_mensual, dia_cobro, estado, fecha_inicio)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Plataforma Core Banking & API', 2800.00, 5, 'activo', '2026-01-15'),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Desarrollo E-Commerce Headless & PWA', 1950.00, 10, 'activo', '2026-03-01'),
    ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'Sistema SaaS de Envíos en Tiempo Real', 3400.00, 1, 'activo', '2026-02-10'),
    ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000004', 'App Mobile de Fidelización', 1200.00, 20, 'pausado', '2026-04-01')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.pagos (id, proyecto_id, cliente_id, monto, fecha_pago, periodo_mes, estado, comprobante_url, notas)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 2800.00, '2026-10-05', '2026-10', 'pagado', 'https://storage.googleapis.com/recibos/recibo-nexo-1001.pdf', 'Pago mensual transferido vía Wise con éxito.'),
    ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 1950.00, '2026-10-10', '2026-10', 'pendiente', NULL, 'Cobro programado para el día 10 de octubre.'),
    ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 3400.00, '2026-10-01', '2026-10', 'vencido', NULL, 'Factura vencida hace 4 días. Se requiere aviso de mora urgente.'),
    ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 2800.00, '2026-09-05', '2026-09', 'pagado', 'https://storage.googleapis.com/recibos/recibo-nexo-0901.pdf', 'Mes de septiembre cancelado puntualmente.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.notificaciones (id, cliente_id, tipo, mensaje, fecha_envio, estado, referencia_pago_id)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'whatsapp', 'Hola Lucas! Desde Nexo Dev Studio confirmamos la recepción de tu pago por $2,800.00 USD correspondiente al periodo 2026-10. ¡Muchas gracias por tu puntualidad!', '2026-10-05 10:15:00+00', 'enviado', 'c0000000-0000-0000-0000-000000000001'),
    ('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003', 'email', 'Estimado Martín Gómez, le recordamos que el abono mensual de Sistema SaaS de Envíos correspondiente a 2026-10 por $3,400.00 USD se encuentra en mora.', '2026-10-04 09:00:00+00', 'enviado', 'c0000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;
