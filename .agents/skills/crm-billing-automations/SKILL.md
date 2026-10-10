---
name: crm-billing-automations
description: >-
  Use this skill when developing, testing, or refining automated payment reminders, WhatsApp triggers (Evolution API), or email notifications (Resend) for Nexo Dev CRM.
---

# Flujos de Automatización de Cobros y Notificaciones

Esta habilidad define la metodología para crear o modificar integraciones y automatizaciones de cobro.

## Procedimiento

1. **Revisión del Servicio de Notificaciones:**
   - Inspeccionar [notificationService.ts](../../../src/services/notificationService.ts).
   - Validar plantillas de mensajes (variables dinámicas: `{cliente}`, `{proyecto}`, `{monto}`, `{fecha_vencimiento}`).

2. **Verificación de Proveedores de Envío:**
   - **WhatsApp:** Confirmar formato de URL y payload hacia Evolution API (`/message/sendText`).
   - **Email:** Confirmar integración con Resend API y cabeceras de autorización.

3. **Registro y Auditoría:**
   - Toda notificación enviada debe guardarse mediante `dataService.createNotificacion()` con el estado resultante (`enviado` o `fallido`) y la referencia del pago correspondiente.

4. **Validación Visual:**
   - Verificar que los componentes en `src/components/automations/` reflejen el historial de envíos y el feedback inmediato al usuario mediante toasts o indicadores de estado.
