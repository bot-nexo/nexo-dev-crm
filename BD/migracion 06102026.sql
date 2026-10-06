-- 1. Agregar columna tipo_pago a la tabla pagos sin borrar datos
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
