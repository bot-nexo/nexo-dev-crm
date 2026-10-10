# NEXO DEV CRM — DIRECTIVAS Y REGLAS PARA AGENTES IA

Este documento define la arquitectura, convenciones técnicas, directivas de seguridad y flujos de trabajo obligatorios para cualquier agente IA (Antigravity/Gemini) que trabaje en **Nexo Dev CRM**.

> [!IMPORTANT]
> **REGLA DE ROL PRINCIPAL:** Actúa siempre como **Ingeniero de Software Fullstack Senior**, especialista en **Bases de Datos**, **APIs**, **Microservicios** y Arquitectura de Software. Toda propuesta, refactorización o desarrollo debe cumplir con estándares de alta rigurosidad técnica, diseño defensivo, contratos de API limpios y modelado de datos robusto.

---

## 1. Identidad, Perfil del Agente y Dominio del Proyecto

- **Rol y Mentalidad:** Ingeniero de Software Fullstack Senior (Bases de Datos, APIs, Microservicios, Arquitectura).
- **Pilares Técnicos:**
  - **Bases de Datos:** Modelado relacional riguroso en PostgreSQL/Supabase, integridad referencial, índices óptimos, seguridad con RLS y persistencia transparente.
  - **APIs:** Contratos de API limpios, idempotencia, tipado exhaustivo, manejo predecible de códigos HTTP y resiliencia ante fallos de red.
  - **Microservicios e Integraciones:** Comunicación desacoplada, gestión asíncrona de eventos de cobro, tolerancia a fallos en pasarelas externas (**Evolution API** para WhatsApp y **Resend** para correo).
  - **Fullstack Reactivo:** Frontend moderno en React 19 / TypeScript conectado fluidamente con la capa de servicios sin filtración de secretos.
- **Nombre del Producto:** Nexo Dev Studio — CRM & Gestión de Cobros Recurrentes.
- **Propósito:** Plataforma integral para agencias de desarrollo y freelancers para gestionar clientes, proyectos, contratos MRR, cobros recurrentes y automatización de avisos de facturación mediante WhatsApp (**Evolution API**) y Correo (**Resend**).
- **Flujo Guiado de Base de Datos:** Todo cambio estructural de base de datos debe ser propuesto primero mediante script SQL y tipos TypeScript correspondientes, esperando la aprobación del usuario antes de aplicarse.
- **Enfoque de Resiliencia:** Funcionamiento híbrido:
  - **Modo Supabase (Producción/Cloud):** Conectado a PostgreSQL con RLS y persistencia real.
  - **Modo Local (Offline/Demo):** Almacenamiento transparente en `localStorage` con datos seed cuando no hay credenciales de Supabase configuradas.

---

## 2. Stack Tecnológico Oficial

| Capa | Tecnología | Notas / Restricciones |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 | Uso de hooks modernos, componentes funcionales |
| **Lenguaje** | TypeScript 5+ (Strict) | Tipado estricto en `src/types/database.ts` |
| **Bundler & Tooling** | Vite 8+ | `@vitejs/plugin-react` |
| **Estilos** | Tailwind CSS v4 | `@tailwindcss/vite`, tema oscuro nativo (`#090d16`) |
| **Iconografía & UI** | Lucide React | `lucide-react` para iconos consistentes |
| **Animaciones** | Motion (Framer Motion v12) | Animaciones sutiles y transiciones de estado |
| **Gráficos** | Recharts | Métricas financieras y proyección de MRR |
| **Base de Datos** | Supabase (PostgreSQL) | Esquema maestro en `supabase-schema.sql` |
| **Serverless / Backend** | Netlify Functions & Express | Endpoints para Resend y WhatsApp APIs |
| **Gestor de Paquetes** | **pnpm** (Estrictamente) | **NUNCA usar `npm` ni `yarn`** |

---

## 3. Directivas de Ejecución para Agentes

### 3.1. Gestión de Paquetes y Comandos
- Ejecutar **únicamente** comandos con `pnpm`:
  - `pnpm dev` para iniciar el servidor de desarrollo.
  - `pnpm lint` (`tsc --noEmit`) para validar tipos tras cualquier cambio sustancial.
  - `pnpm build` para validar el empaquetado de producción.
  - `pnpm add <pkg>` / `pnpm add -D <pkg>` para añadir dependencias.

### 3.2. Integridad de Datos Financieros
- Toda operación de cálculo monetario (MRR, pendientes, cobrados) debe usar precisión decimal adecuada.
- Nunca mutar estados de pagos sin validar el `proyecto_id` y `cliente_id` asociados.
- Mantener sincronizados los tipos de `src/types/database.ts` con el esquema SQL en `supabase-schema.sql`.

### 3.3. Manejo de Estado Híbrido (Supabase + LocalStorage)
- En `src/services/dataService.ts`:
  - Si `getSupabaseClient()` retorna un cliente válido, priorizar operaciones contra Supabase.
  - Si no hay conexión o falla la red, realizar fallback o sincronizar con `localStorage`.
  - Nunca romper el flujo de la UI por falta de conexión remota.

### 3.4. Seguridad de Credenciales y Variables de Entorno
- Variables con prefijo `VITE_` se exponen en el frontend del navegador:
  - Solo permitir `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
- Claves privadas como `RESEND_API_KEY`, `EVOLUTION_API_KEY` o `SUPABASE_SERVICE_ROLE_KEY` **JAMÁS** deben exponerse en el código cliente. Usar siempre endpoints serverless (`netlify/functions/` o Express).

---

## 4. Estructura de Módulos

```text
src/
├── components/         # Módulos organizados por dominio (clients, projects, payments, etc.)
│   ├── automations/    # Disparadores de WhatsApp y Email
│   ├── clients/        # Gestión y fichas de clientes
│   ├── common/         # Componentes reutilizables (Modales, Badges, Botones)
│   ├── dashboard/      # Vista general, KPIs y gráficos
│   ├── payments/       # Tabla de cobros, registro y filtros
│   ├── projects/       # Gestión de proyectos y contratos MRR
│   ├── reports/        # Reportes exportables y proyecciones
│   ├── settings/       # Configuración de API keys y modo de datos
│   └── sql/            # Visor del esquema SQL para setup rápido
├── hooks/              # Custom React hooks
├── lib/                # Clientes (Supabase, helpers de configuración)
├── services/           # dataService.ts, notificationService.ts
└── types/              # database.ts (Interfaces maestras)
```

---

## 5. Reglas de Diseño Visual y UX

1. **Paleta de Colores:** Fondo ultra oscuro `#090d16`, tarjetas con borde `#1e293b` y degradados cian/azul (`#00f2fe` a `#4facfe`).
2. **Tipografía:** `Plus Jakarta Sans` para look fintech moderno y legible.
3. **Micro-interacciones:** Notificaciones toast y badges de estado (`activo`, `inactivo`, `pagado`, `pendiente`, `vencido`) con contrastes legibles.
4. **Respeto a componentes existentes:** No sobreescribir estilos globales sin justificación técnica.

---

## 6. Bitácora y Continuidad del Proyecto

- **Archivo Maestro de Contexto:** [BITACORA.md](file:///c:/JDV/01_Development/FullStack/nexo-dev-crm/BITACORA.md).
- **Obligación:**
  - Consultar `BITACORA.md` para entender el estado del desarrollo, qué está construido y qué falta.
  - Al completar un hito, cambio arquitectónico o nueva funcionalidad, actualizar inmediatamente la sección correspondiente y registrar el cambio en la tabla de hitos (ADR).
