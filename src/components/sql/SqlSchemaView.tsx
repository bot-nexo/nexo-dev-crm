import React, { useState } from 'react';
import { FileCode2, Copy, Check, Terminal, ExternalLink, ShieldCheck, Database, Wrench, AlertCircle } from 'lucide-react';

const SQL_MIGRATION_ONLY = `-- ============================================================================
-- SCRIPT DE MIGRACIÓN Y REPARACIÓN RÁPIDA (SUPABASE SQL EDITOR)
-- Pega y ejecuta esto si recibiste el error "column tipo_pago does not exist":
-- ============================================================================

-- 1. Agregar columna tipo_pago a la tabla pagos
ALTER TABLE public.pagos ADD COLUMN IF NOT EXISTS tipo_pago VARCHAR(30) DEFAULT 'cuota_mensual';
ALTER TABLE public.pagos DROP CONSTRAINT IF EXISTS pagos_tipo_pago_check;
ALTER TABLE public.pagos ADD CONSTRAINT pagos_tipo_pago_check CHECK (tipo_pago IN ('cuota_mensual', 'implementacion', 'venta_directa_hito'));

-- 2. Actualizar la tabla proyectos con estados, recursos y modelos de cobro
ALTER TABLE public.proyectos DROP CONSTRAINT IF EXISTS proyectos_estado_check;
ALTER TABLE public.proyectos ADD CONSTRAINT proyectos_estado_check CHECK (estado IN ('activo', 'en_desarrollo', 'en_prueba', 'pausado', 'finalizado'));

ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS modelo_cobro VARCHAR(30) DEFAULT 'mensual_alquiler';
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS valor_total_venta NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS modalidad_pago_venta VARCHAR(30) DEFAULT 'pago_unico';
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS etapas_pago JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS dias_prueba SMALLINT DEFAULT 7;
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS fecha_fin_prueba DATE DEFAULT NULL;
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS valor_implementacion NUMERIC(12, 2) DEFAULT 0.00;
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS estado_implementacion VARCHAR(20) DEFAULT 'pendiente';
ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS fecha_pago_implementacion DATE DEFAULT NULL;

ALTER TABLE public.proyectos ADD COLUMN IF NOT EXISTS recursos_tecnicos JSONB DEFAULT '[]'::jsonb;

-- 3. Crear tabla para suscripciones y herramientas de la startup
CREATE TABLE IF NOT EXISTS public.suscripciones_startup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_servicio VARCHAR(200) NOT NULL,
    proveedor VARCHAR(150),
    categoria VARCHAR(50) NOT NULL DEFAULT 'herramientas_dev',
    estado VARCHAR(30) NOT NULL DEFAULT 'activa',
    email_cuenta VARCHAR(255) NOT NULL,
    usuario_login VARCHAR(150),
    costo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    moneda VARCHAR(10) NOT NULL DEFAULT 'USD',
    ciclo_cobro VARCHAR(20) NOT NULL DEFAULT 'mensual',
    dia_cobro SMALLINT NOT NULL DEFAULT 1,
    proxima_fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo_pago VARCHAR(150),
    auto_renovacion BOOLEAN NOT NULL DEFAULT true,
    fecha_fin_prueba DATE DEFAULT NULL,
    dias_prueba SMALLINT DEFAULT NULL,
    dias_anticipacion_alerta SMALLINT NOT NULL DEFAULT 3,
    email_notificacion_alerta VARCHAR(255),
    alerta_activa BOOLEAN NOT NULL DEFAULT true,
    ultima_alerta_enviada TIMESTAMPTZ DEFAULT NULL,
    url_panel_gestion TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.suscripciones_startup ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir acceso completo a suscripciones_startup" ON public.suscripciones_startup FOR ALL USING (true) WITH CHECK (true);`;

const SQL_FULL_SCHEMA = `-- ============================================================================
-- NEXO DEV STUDIO - SCHEMA COMPLETO DE BASE DE DATOS PARA SUPABASE (POSTGRESQL)
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TABLA: clientes
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(150) NOT NULL,
    empresa VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    telefono VARCHAR(50) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_clientes_estado ON public.clientes(estado);
CREATE INDEX IF NOT EXISTS idx_clientes_email ON public.clientes(email);
CREATE INDEX IF NOT EXISTS idx_clientes_empresa ON public.clientes(empresa);

-- 2. TABLA: proyectos
CREATE TABLE IF NOT EXISTS public.proyectos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    nombre_proyecto VARCHAR(200) NOT NULL,
    valor_mensual NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (valor_mensual >= 0),
    dia_cobro SMALLINT NOT NULL DEFAULT 5 CHECK (dia_cobro BETWEEN 1 AND 31),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'en_desarrollo', 'en_prueba', 'pausado', 'finalizado')),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    
    modelo_cobro VARCHAR(30) DEFAULT 'mensual_alquiler',
    valor_total_venta NUMERIC(12, 2) DEFAULT 0.00,
    modalidad_pago_venta VARCHAR(30) DEFAULT 'pago_unico',
    etapas_pago JSONB DEFAULT '[]'::jsonb,

    dias_prueba SMALLINT DEFAULT 7,
    fecha_fin_prueba DATE DEFAULT NULL,

    valor_implementacion NUMERIC(12, 2) DEFAULT 0.00,
    estado_implementacion VARCHAR(20) DEFAULT 'pendiente',
    fecha_pago_implementacion DATE DEFAULT NULL,

    recursos_tecnicos JSONB DEFAULT '[]'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_proyectos_cliente_id ON public.proyectos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON public.proyectos(estado);

-- 3. TABLA: pagos
CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto >= 0),
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    periodo_mes VARCHAR(7) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pagado', 'pendiente', 'vencido')),
    tipo_pago VARCHAR(30) DEFAULT 'cuota_mensual',
    comprobante_url TEXT DEFAULT NULL,
    notas TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_pagos_proyecto_id ON public.pagos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cliente_id ON public.pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON public.pagos(estado);

-- 4. TABLA: notificaciones
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

-- 5. TABLA: suscripciones_startup (Herramientas & SaaS)
CREATE TABLE IF NOT EXISTS public.suscripciones_startup (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_servicio VARCHAR(200) NOT NULL,
    proveedor VARCHAR(150),
    categoria VARCHAR(50) NOT NULL DEFAULT 'herramientas_dev',
    estado VARCHAR(30) NOT NULL DEFAULT 'activa',
    email_cuenta VARCHAR(255) NOT NULL,
    usuario_login VARCHAR(150),
    costo NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    moneda VARCHAR(10) NOT NULL DEFAULT 'USD',
    ciclo_cobro VARCHAR(20) NOT NULL DEFAULT 'mensual',
    dia_cobro SMALLINT NOT NULL DEFAULT 1,
    proxima_fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    metodo_pago VARCHAR(150),
    auto_renovacion BOOLEAN NOT NULL DEFAULT true,
    fecha_fin_prueba DATE DEFAULT NULL,
    dias_prueba SMALLINT DEFAULT NULL,
    dias_anticipacion_alerta SMALLINT NOT NULL DEFAULT 3,
    email_notificacion_alerta VARCHAR(255),
    alerta_activa BOOLEAN NOT NULL DEFAULT true,
    ultima_alerta_enviada TIMESTAMPTZ DEFAULT NULL,
    url_panel_gestion TEXT,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON public.suscripciones_startup(estado);
CREATE INDEX IF NOT EXISTS idx_suscripciones_email ON public.suscripciones_startup(email_cuenta);

-- 6. TRIGGER AUTOMÁTICO PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_clientes BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_proyectos BEFORE UPDATE ON public.proyectos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_pagos BEFORE UPDATE ON public.pagos FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_suscripciones BEFORE UPDATE ON public.suscripciones_startup FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 7. POLÍTICAS RLS
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripciones_startup ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso a clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso a proyectos" ON public.proyectos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso a pagos" ON public.pagos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso a notificaciones" ON public.notificaciones FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso a suscripciones_startup" ON public.suscripciones_startup FOR ALL USING (true) WITH CHECK (true);`;

export const SqlSchemaView: React.FC = () => {
  const [copiedMigration, setCopiedMigration] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);

  const handleCopyMigration = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_ONLY);
    setCopiedMigration(true);
    setTimeout(() => setCopiedMigration(false), 2500);
  };

  const handleCopyFull = () => {
    navigator.clipboard.writeText(SQL_FULL_SCHEMA);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Migration Card for existing Supabase DBs */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-slate-900 border border-amber-500/40 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">
                Script de Migración & Solución al Error <code className="text-amber-300 font-mono text-xs bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/30">column tipo_pago does not exist</code>
              </h2>
            </div>
            <p className="text-xs text-amber-200/90 max-w-2xl">
              Si tu base de datos en Supabase ya tenía la tabla <code className="font-mono text-cyan-300">pagos</code> creada anteriormente, ejecuta este script en Supabase SQL Editor para agregar la columna <code className="font-mono text-cyan-300">tipo_pago</code> y todos los nuevos campos <strong>sin borrar ningún cliente ni dato existente</strong>.
            </p>
          </div>

          <button
            onClick={handleCopyMigration}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition cursor-pointer shrink-0"
          >
            {copiedMigration ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedMigration ? '¡Script Copiado!' : 'Copiar Script de Migración SQL'}</span>
          </button>
        </div>

        <div className="mt-4 p-3 rounded-xl bg-slate-950/80 border border-amber-500/20 text-xs font-mono text-amber-300/90 max-h-40 overflow-y-auto">
          <pre>{SQL_MIGRATION_ONLY}</pre>
        </div>
      </div>

      {/* Intro card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Esquema SQL Completo (Instalación desde Cero)</h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Usa este script completo si estás creando una nueva base de datos desde cero en Supabase.
            </p>
          </div>

          <button
            onClick={handleCopyFull}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
          >
            {copiedFull ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedFull ? '¡Copiado!' : 'Copiar Esquema Completo'}</span>
          </button>
        </div>
      </div>

      {/* SQL Code Block */}
      <div className="rounded-2xl bg-[#090d16] border border-slate-800 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>supabase-schema.sql</span>
          </div>
          <button
            onClick={handleCopyFull}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
          >
            {copiedFull ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFull ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        <div className="p-4 overflow-x-auto max-h-[500px] text-xs font-mono leading-relaxed text-slate-300">
          <pre>{SQL_FULL_SCHEMA}</pre>
        </div>
      </div>
    </div>
  );
};
