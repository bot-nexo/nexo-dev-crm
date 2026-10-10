---
name: sync-schema
description: >-
  Use this skill when adding, modifying, or removing database tables, fields, or relations in Nexo Dev CRM to ensure supabase-schema.sql, src/types/database.ts, and src/services/dataService.ts remain strictly synchronized.
---

# Sincronización de Esquema de Base de Datos

Esta habilidad guía al agente en el proceso de actualización del modelo de datos sin provocar discrepancias entre PostgreSQL (Supabase) y el frontend TypeScript.

## Pasos de Ejecución

1. **Actualizar el Esquema SQL:**
   - Modificar [supabase-schema.sql](../../../supabase-schema.sql).
   - Incluir columnas nuevas, tipos de datos, restricciones (`NOT NULL`, `DEFAULT`, `CHECK`), y claves foráneas.

2. **Actualizar Definición de Tipos TypeScript:**
   - Modificar [database.ts](../../../src/types/database.ts).
   - Reflejar las nuevas propiedades en las interfaces (`Cliente`, `Proyecto`, `Pago`, `Notificacion`).

3. **Actualizar Capa de Servicios y Fallback Local:**
   - Modificar [dataService.ts](../../../src/services/dataService.ts).
   - Ajustar las consultas `select()`, `insert()`, y `update()`.
   - Ajustar los datos seed (`SEED_CLIENTES`, `SEED_PROYECTOS`, etc.) si se requieren valores por defecto.

4. **Validación:**
   - Ejecutar comprobación de tipos:
     ```bash
     pnpm lint
     ```
   - Corregir cualquier error de tipado antes de concluir.
