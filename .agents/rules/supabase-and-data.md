# Reglas de Supabase, Base de Datos y Persistencia

Este documento rige la gestión de datos, consultas SQL, políticas de seguridad y fallback de persistencia en **nexo-dev-crm**.

---

## 1. Esquema Maestro y Migraciones

1. **Archivo de Verdad:** El esquema canónico se encuentra en `supabase-schema.sql`.
2. **Modificaciones de Esquema:**
   - Todo cambio a tablas existentes (columnas, tipos, restricciones) debe reflejarse en:
     1. `supabase-schema.sql`
     2. `src/types/database.ts`
     3. `src/services/dataService.ts` (en las operaciones CRUD y datos seed).
3. **Identificadores UUID:** Todas las tablas (`clientes`, `proyectos`, `pagos`, `notificaciones`) utilizan `UUID` como clave primaria generada por `gen_random_uuid()`.

---

## 2. Resiliencia y Modo Híbrido (Supabase + LocalStorage)

1. **Prioridad Supabase:** Si el cliente Supabase está configurado e inicializado correctamente (`getSupabaseClient() != null`), todas las lecturas y escrituras deben ejecutarse contra Supabase.
2. **Fallback Transparente:**
   - Si no hay credenciales o hay fallo de red, `src/services/dataService.ts` debe recurrir al almacenamiento en `localStorage`.
   - La aplicación jamás debe quedar en pantalla blanca ni arrojar errores no controlados si el usuario no ha conectado su proyecto de Supabase todavía.
3. **Inicialización de Datos Seed:**
   - En modo local o cuando una tabla esté vacía por primera vez, alimentar con datos demo predefinidos para permitir una experiencia interactiva inmediata.

---

## 3. Seguridad a Nivel de Filas (RLS)

1. En Supabase, mantener habilitado RLS (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`).
2. Las políticas públicas o por usuario autenticado deben contemplar operaciones CRUD seguras sin exponer claves de servicio (`SERVICE_ROLE_KEY`) en el frontend.
