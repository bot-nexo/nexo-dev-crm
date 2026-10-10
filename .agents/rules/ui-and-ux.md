# Diseño, Estilos y Experiencia de Usuario (UI/UX)

Este documento rige la coherencia visual, tokens de diseño y componentes en **nexo-dev-crm**.

---

## 1. Sistema de Diseño y Tailwind CSS v4

1. **Tema Base:**
   - Modo Oscuro Profundo: Fondo principal `#090d16`, superficies elevadas `#0f172a` y `#1e293b`.
   - Acentos: Cian eléctrico `#00f2fe` y azul tecnológico `#4facfe`.
2. **Tipografía:**
   - `Plus Jakarta Sans` configurada en `index.css`.
3. **Tailwind CSS v4:**
   - La configuración se realiza a través de `@tailwindcss/vite` e `@import "tailwindcss";`.
   - Utilizar utilidades modernas de Tailwind v4 y evitar sintaxis obsoleta de versiones anteriores.

---

## 2. Componentes y Usabilidad

1. **Micro-interacciones y Animaciones:**
   - Utilizar `motion` (Framer Motion v12) para transiciones fluidas de modales, tabs y gráficos.
   - Uso controlado de `canvas-confetti` para eventos de celebración (e.g. pago registrado con éxito).
2. **Estados Visuales de Cobro:**
   - **Pagado:** Verde esmeralda (`text-emerald-400`, `bg-emerald-500/10`, `border-emerald-500/20`).
   - **Pendiente:** Amarillo ámbar (`text-amber-400`, `bg-amber-500/10`, `border-amber-500/20`).
   - **Vencido:** Rojo carmesí (`text-rose-400`, `bg-rose-500/10`, `border-rose-500/20`).
3. **Accesibilidad y Responsividad:**
   - Todos los botones interactivos deben tener estados `hover`, `active`, y `focus-visible`.
   - Toda tabla o vista de datos debe responder adecuadamente en pantallas móviles y desktop.
