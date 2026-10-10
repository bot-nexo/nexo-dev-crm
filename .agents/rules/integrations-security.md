# Seguridad e Integraciones de Mensajería (WhatsApp & Email)

Este documento rige el manejo de APIs externas (WhatsApp con Evolution API / Twilio, y Emails con Resend) y la privacidad de datos.

---

## 1. Reglas de Seguridad de Credenciales

1. **Variables Públicas vs Privadas:**
   - En el frontend, solo existen variables `VITE_*` no críticas.
   - Las claves maestras de mensajería (`RESEND_API_KEY`, tokens de WhatsApp) deben procesarse mediante funciones serverless (Netlify Functions o Express) para evitar filtraciones en el bundle compilado.
2. **Sanitización de Datos en Logs:**
   - Nunca imprimir en consola tokens de autenticación ni datos sensibles de tarjetas o facturación.

---

## 2. Automatizaciones de Notificaciones

1. **Estructura del Mensaje:**
   - Los recordatorios de cobro deben incluir: nombre del cliente, nombre del proyecto, monto adeudado, fecha de vencimiento y canal de soporte.
2. **Control de Fallos:**
   - Registrar siempre el resultado del envío en la tabla `notificaciones` con estado `'enviado'` o `'fallido'`.
   - Si la API externa no responde o está mal configurada, retornar un mensaje de error descriptivo en la interfaz para guiar al usuario a la pantalla de Ajustes.
3. **Formato Telefónico:**
   - Asegurarse de que los números de teléfono para WhatsApp incluyan el código de país internacional (formato E.164: e.g. `+549...`, `+57...`, `+52...`).
