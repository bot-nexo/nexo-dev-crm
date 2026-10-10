# BITÁCORA DE PROYECTO — NEXO DEV STUDIO CRM

> **Última Actualización:** 09 de Octubre de 2026  
> **Estado General:** Fase 1 y 2 Funcionales (Dashboard, Clientes, Proyectos/MRR, Pagos, Notificaciones y Modo Híbrido Activos).  
> **Arquitectura:** React 19 + TypeScript + Vite + Tailwind v4 + Supabase / LocalStorage Fallback + Netlify Functions.

---

## 1. Resumen Ejecutivo y Objetivos

**Nexo Dev Studio** es un CRM especializado para agencias de desarrollo y freelancers de software, enfocado en:
1. Control de contratos recurrentes (**MRR**) y fechas de corte de pago.
2. Conciliación ágil de estados de cuenta por cliente.
3. Automatización de cobranza y avisos preventivos/correctivos vía **WhatsApp (Evolution API)** y **Correo (Resend)**.
4. Resiliencia total con funcionamiento híbrido: nube (Supabase PostgreSQL) y local (offline con localStorage).

---

## 2. Mapa del Sistema: QUÉ HAY IMPLEMENTADO (Inventario Actual)

### 2.1. Frontend & Módulos UI (`src/components/`)
- [x] **Dashboard General (`dashboard/DashboardOverview.tsx`):**
  - Métricas financieras en tiempo real: MRR proyectado, cobrado en el mes en curso, montos pendientes y deuda vencida.
  - Gráficos con Recharts: Distribución de ingresos por proyecto y evolución financiera.
  - Centro de alertas urgentes: Detección automática de pagos vencidos y cobros programados en los próximos 3 días.
- [x] **Gestión de Clientes (`clients/`):**
  - Listado con búsqueda, filtro por estado (`activo` / `inactivo`) y ordenamiento.
  - Modal de creación y edición (`ClientFormModal.tsx`) con validación de teléfono internacional.
  - Ficha 360° del cliente (`ClientDetailModal.tsx`) con balance financiero histórico, proyectos vinculados y accesos rápidos de WhatsApp/Email.
- [x] **Gestión de Proyectos & Retainers MRR (`projects/`):**
  - Registro de contratos mensuales vinculados a clientes.
  - Definición de valor recurrente (USD) y día de corte/facturación (1 al 31).
  - Modal de creación y edición (`ProjectFormModal.tsx`).
- [x] **Control de Pagos y Facturación (`payments/`):**
  - Registro de cobros por período mensual (`YYYY-MM`), monto y estado (`pagado`, `pendiente`, `vencido`).
  - Modal de registro con notas y URL de comprobante (`PaymentFormModal.tsx`).
  - Recibo/Invoice digital interactivo (`InvoiceReceiptModal.tsx`) con animación de confeti y vista de impresión.
  - **Generación y Descarga de PDF Real:** Módulo [pdfService.ts](src/services/pdfService.ts) con motor vectorial `jspdf` para descargar comprobantes oficiales en PDF tanto desde el modal como desde la tabla de pagos.
- [x] **Centro de Automatizaciones (`automations/AutomationsCenter.tsx`):**
  - Plantillas dinámicas de cobro: Recordatorio preventivo, aviso de corte el día de pago y reclamo de mora.
  - Envío individual y en lote de recordatorios.
  - Tabla de historial de notificaciones auditadas con estado (`enviado` / `fallido`).
- [x] **Reportes y Proyecciones (`reports/ReportsView.tsx`):**
  - Balance de flujo de caja mensual y resumen de retención.
  - **Centro de Exportación Contable & Auditoría ([exportService.ts](src/services/exportService.ts)):** Generación de archivos CSV con codificación UTF-8 BOM (compatibilidad nativa con Microsoft Excel sin rotura de tildes ni caracteres especiales). Exportación de:
    - Cobranzas y Pagos filtrados / completos.
    - Cartera de Clientes con MRR y balance histórico.
    - Conciliación Mensual con tasas de recaudación.
    - Respaldos completos de la base de datos en formato JSON.
  - Botones de exportación rápida en las cabeceras de [PaymentList.tsx](src/components/payments/PaymentList.tsx) y [ClientList.tsx](src/components/clients/ClientList.tsx).
- [x] **Configuración del Sistema (`settings/SettingsView.tsx`):**
  - Gestor de credenciales con almacenamiento seguro local.
  - Tester de conexión en tiempo real hacia Supabase.
  - Parámetros de Evolution API (URL, Token, Instancia) y Resend (API Key, From Email).
- [x] **Visor de Esquema SQL (`sql/SqlSchemaView.tsx`):**
  - Visualizador integrado de [supabase-schema.sql](supabase-schema.sql) con copia a un clic.

### 2.2. Capa de Datos y Persistencia (`src/services/` y `src/lib/`)
- [x] **Arquitectura Híbrida (`dataService.ts`):**
  - Detección automática de conexión a Supabase.
  - Fallback transparente en `localStorage` con datos seed de alta fidelidad.
  - Función de sincronización bidireccional (`syncLocalToSupabase`).
- [x] **Cliente Supabase (`lib/supabase.ts`):**
  - Inicialización dinámica y prueba de conectividad contra tabla `clientes`.

### 2.3. Backend Serverless (`netlify/functions/`)
- [x] `send-whatsapp.ts`: Integración con Evolution API (`/message/sendText`) y soporte fallback para Twilio.
- [x] `send-email.ts`: Integración con Resend API para envío de notificaciones de cobro con plantillas HTML formateadas.
- [x] `cron-billing.ts`: **Scheduler & Cron Diario de Cobranza (P0).**
  - Ejecución programada automática en Netlify (`0 14 * * *` UTC / 09:00 AM UTC-5).
  - Soporte de triggers externos vía webhook POST con validación opcional de token `CRON_SECRET`.
  - Detección de proyectos con corte hoy, avisos preventivos a 3 días y morosidad de períodos previos.
  - Modo seguro de Simulación (Dry Run) y ejecución en vivo desde el panel de Automatizaciones.
  - Fallback local para desarrollo offline en Vite.

### 2.4. Sistema de Agentes IA y Gobernanza (`.agents/` y `AGENTS.md`)
- [x] [AGENTS.md](AGENTS.md): Directiva maestra obligatoria. Rol de Ingeniero Fullstack Senior (25 años de experiencia).
- [x] [rules/persona-and-workflow.md](.agents/rules/persona-and-workflow.md): Criterio de arquitectura, APIs, microservicios y protocolo guiado de migraciones.
- [x] [rules/coding-standards.md](.agents/rules/coding-standards.md): Estándares TypeScript estrictos y política de `pnpm`.
- [x] [rules/supabase-and-data.md](.agents/rules/supabase-and-data.md): Reglas de integridad referencial, RLS y datos seed.
- [x] [rules/integrations-security.md](.agents/rules/integrations-security.md): Seguridad de credenciales serverless y sanitización.
- [x] [rules/ui-and-ux.md](.agents/rules/ui-and-ux.md): Tokens visuales dark fintech (`#090d16`, `#00f2fe`).
- [x] [skills/sync-schema](.agents/skills/sync-schema/SKILL.md): Habilidad para sincronizar base de datos y TypeScript.
- [x] [skills/crm-billing-automations](.agents/skills/crm-billing-automations/SKILL.md): Habilidad para flujos de notificación y cobros.

---

## 3. Backlog: QUÉ FALTA Y PRÓXIMOS PASOS (Por Prioridad)

### 🔴 Prioridad Alta (P1) — Experiencia y Operatividad del Negocio
- [ ] **1. Portal de Autoservicio para Clientes (Link Público por Token):**
  - *Objetivo:* Enlace seguro enviado en los WhatsApps/Emails para que el cliente consulte su estado de cuenta en vivo, fecha de próximo corte y descargue sus comprobantes PDF oficiales sin solicitar intervención manual.
- [ ] **2. Autenticación y Control de Acceso (Supabase Auth):**
  - *Objetivo:* Pantalla de login/registro y protección de rutas para blindar el acceso al CRM y permitir gestión por roles (Admin, Finanzas, Dev).
- [ ] **3. Soporte Multi-Moneda Flexible:**
  - *Objetivo:* Configurar moneda principal o moneda por proyecto (COP, ARS, MXN, EUR, USD) con formato regional.

### ⏸️ Pospuesto Temporalmente (Por Decisión del Negocio)
- [ ] **Pasarelas de Pago Online (Stripe / Mercado Pago / Wompi):** Pospuesto hasta contar con credenciales de pasarela activas.
- [ ] **Asistente de Redacción con Gemini AI:** Pospuesto para evitar costos de API de IA en esta fase.

---

## 4. Registro de Hitos y Decisiones de Arquitectura (ADR)

| Fecha | Hito / Decisión | Justificación Técnica |
| :--- | :--- | :--- |
| **2026-10-09** | **Exportación Contable CSV (Excel UTF-8) y Respaldos JSON (P1)** | Implementación de `ExportService` con formato CSV y BOM UTF-8 (`\uFEFF`) para compatibilidad perfecta con Excel sin errores de codificación en español. Generación de informes de pagos, clientes con MRR, conciliación periódica y backups completos del sistema en JSON. |
| **2026-10-09** | **Generación y Descarga de Comprobantes en PDF Real (P1)** | Implementación de `PdfService` con `jspdf` para generación client-side de comprobantes oficiales A4 con diseño fintech, metadatos, tablas de conceptos, badges de estado y código de transacción único. Descarga directa en un clic desde el modal y la tabla de pagos. |
| **2026-10-09** | **Implementación del Scheduler & Cron Diario de Cobranza (P0)** | Se creó `cron-billing.ts` con doble soporte: Netlify Scheduled Function (09:00 AM UTC-5) y trigger HTTP con token secreto. Añadido panel visual interactivo con simulación (Dry Run) y fallback local para desarrollo. |
| **2026-10-09** | **Configuración Integral del Sistema de Agentes IA** | Creación de directivas maestras (`AGENTS.md`), reglas modulares y habilidades especializadas en `.agents/`. |
| **2026-10-09** | **Adopción de Rol Senior Fullstack (25 años)** | Se formaliza en las reglas del workspace la exigencia de alta rigurosidad técnica en bases de datos, APIs y microservicios. |
| **2026-10-09** | **Estandarización de WhatsApp en Evolution API** | Se elige Evolution API por su flexibilidad, costos óptimos y capacidad autohospedada para agencias. |
| **2026-10-09** | **Protocolo Guiado de Base de Datos** | Ningún cambio estructural en `supabase-schema.sql` se ejecuta sin propuesta y aprobación previa del usuario. |
| **2026-10-09** | **Arquitectura Híbrida (Supabase + LocalStorage)** | Garantiza que el CRM sea 100% interactivo y operable sin credenciales o en modo demo/offline. |

---

## 5. Protocolo para Mantener la Bitácora Actualizada

1. **Al iniciar una sesión de trabajo:** Consultar [BITACORA.md](BITACORA.md) para ubicar el contexto y la siguiente tarea del backlog.
2. **Al completar una funcionalidad o cambio estructural:**
   - Mover la tarea de la sección **"QUÉ FALTA"** a **"QUÉ HAY IMPLEMENTADO"**.
   - Registrar la decisión o hito relevante en la tabla de **Registro de Hitos (ADR)**.
   - Actualizar la fecha de *Última Actualización*.
