# Estándares de Código y Desarrollo

Este documento especifica las pautas de código para TypeScript, React 19 y gestión del ciclo de vida en **nexo-dev-crm**.

---

## 1. TypeScript y Tipado Estricto

1. **Sin `any` implícito ni explícito:** Siempre utilizar tipos concretos, uniones o genéricos bien definidos.
2. **Entidades Centrales:** Todas las estructuras de datos (Clientes, Proyectos, Pagos, Notificaciones) provienen de `src/types/database.ts`.
3. **Validación de Tipos en Builds:**
   - Antes de considerar completada cualquier tarea, ejecutar:
     ```bash
     pnpm lint
     ```
   - No debe haber errores de compilación (`tsc --noEmit`).

---

## 2. React 19 y Arquitectura de Componentes

1. **Componentes Funcionales:** Usar componentes funcionales con TypeScript. Tipar props mediante interfaces explícitas.
2. **Manejo de Estado:**
   - Para estado local de UI: `useState`, `useReducer`.
   - Para efectos secundarios asíncronos: envolver llamadas a `dataService` en bloques `try/catch` con manejo de estados de carga (`loading`) y error.
3. **Evitar Re-renders Innecesarios:** Usar `useMemo` y `useCallback` en cálculos financieros pesados o filtros complejos de listas.
4. **Separación de Responsabilidades:**
   - La lógica de acceso a datos y Supabase reside en `src/services/` y `src/lib/`.
   - Los componentes de `src/components/` deben centrarse en la presentación y manejo de interacción de usuario.

---

## 3. Gestor de Paquetes (pnpm)

- **Regla Estricta:** Este repositorio está administrado con `pnpm` (lockfile `pnpm-lock.yaml`).
- **Comandos Permitidos:**
  - `pnpm dev`
  - `pnpm build`
  - `pnpm lint`
  - `pnpm add <paquete>`
- **Comandos Prohibidos:** `npm`, `yarn`, `bun` (a menos que el usuario lo solicite expresamente).
