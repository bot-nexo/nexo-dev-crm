import React, { useState } from 'react';
import { FileCode2, Copy, Check, Terminal, ExternalLink, ShieldCheck, Database } from 'lucide-react';

const SQL_SCRIPT_CONTENT = `-- ============================================================================
-- NEXO DEV STUDIO - SCHEMA DE BASE DE DATOS PARA SUPABASE (POSTGRESQL)
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
    dia_cobro SMALLINT NOT NULL DEFAULT 1 CHECK (dia_cobro BETWEEN 1 AND 31),
    estado VARCHAR(20) NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'pausado', 'finalizado')),
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_proyectos_cliente_id ON public.proyectos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON public.proyectos(estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_dia_cobro ON public.proyectos(dia_cobro);

-- 3. TABLA: pagos
CREATE TABLE IF NOT EXISTS public.pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proyecto_id UUID NOT NULL REFERENCES public.proyectos(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    monto NUMERIC(12, 2) NOT NULL CHECK (monto >= 0),
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    periodo_mes VARCHAR(7) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pagado', 'pendiente', 'vencido')),
    comprobante_url TEXT DEFAULT NULL,
    notas TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_pagos_proyecto_id ON public.pagos(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_pagos_cliente_id ON public.pagos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado ON public.pagos(estado);
CREATE INDEX IF NOT EXISTS idx_pagos_periodo ON public.pagos(periodo_mes);
CREATE INDEX IF NOT EXISTS idx_pagos_fecha ON public.pagos(fecha_pago);

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

CREATE INDEX IF NOT EXISTS idx_notificaciones_cliente ON public.notificaciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_notificaciones_tipo ON public.notificaciones(tipo);

-- 5. TRIGGER AUTOMÁTICO PARA UPDATED_AT
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

-- 6. POLÍTICAS RLS (Row Level Security)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proyectos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir acceso a clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso a proyectos" ON public.proyectos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso a pagos" ON public.pagos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Permitir acceso a notificaciones" ON public.notificaciones FOR ALL USING (true) WITH CHECK (true);`;

export const SqlSchemaView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCRIPT_CONTENT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Intro card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Esquema SQL Oficial de Supabase</h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Copia este script completo y pégalo directamente en el <strong>SQL Editor</strong> de tu proyecto en Supabase.
              Crea las 4 tablas principales con Foreign Keys, índices de alto rendimiento, triggers automáticos para updated_at y políticas de seguridad RLS.
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar Script SQL'}</span>
          </button>
        </div>
      </div>

      {/* Guide steps */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px]">
              1
            </span>
            <span>Abre Supabase</span>
          </div>
          <p className="text-slate-400">
            Ingresa a tu panel en <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-cyan-400 underline">supabase.com</a> y abre tu proyecto.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-bold mb-1">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px]">
              2
            </span>
            <span>Pega en SQL Editor</span>
          </div>
          <p className="text-slate-400">
            En la barra lateral izquierda haz clic en <strong>SQL Editor</strong> &gt; <strong>New Query</strong>, pega el código y presiona <strong>RUN</strong>.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-bold mb-1">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px]">
              3
            </span>
            <span>Conecta en Configuración</span>
          </div>
          <p className="text-slate-400">
            Copia tu <strong>Project URL</strong> y <strong>anon public key</strong> de Project Settings &gt; API y pégalas en la pestaña "Configuración".
          </p>
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
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        <div className="p-4 overflow-x-auto max-h-[500px] text-xs font-mono leading-relaxed text-slate-300">
          <pre>{SQL_SCRIPT_CONTENT}</pre>
        </div>
      </div>
    </div>
  );
};
