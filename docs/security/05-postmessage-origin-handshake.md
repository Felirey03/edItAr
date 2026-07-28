# Vulnerabilidad 5: Inseguridad en postMessage (Uso de Wildcard '*' y Falta de Handshake de Origen)

## Problema y Riesgo de Seguridad
En `src/client.js` (script inyectado en el iframe o aplicación cliente), todas las llamadas a `window.parent.postMessage(..., '*')` utilizaban el comodín `'*'`. Esto enviaba la información de la aplicación (eventos de selección, árbol de ancestros, clases, texto y pulsaciones de teclas) a cualquier ventana padre, sin importar su origen.

Si el cliente se embebía dentro de un iframe controlado por un atacante en un dominio malicioso, el atacante podía interceptar esos mensajes con `window.addEventListener('message', ...)`. Asimismo, el cliente aceptaba cualquier mensaje recibido de la ventana padre sin verificar si procedía de una fuente de confianza.

## Solución Implementada
1. **Handshake de Origen (`allowedParentOrigin`)**:
   - Al inicializarse `src/client.js`, el cliente espera un mensaje de inicialización `VISUALDEV_INIT` conteniendo `parentOrigin` (o lee el origen desde los parámetros de la URL `?parentOrigin=...`).
   - Registra y fija la variable `allowedParentOrigin`.
2. **Restricción de Envíos Salientes**:
   - Al emitir mensajes con `window.parent.postMessage`, se utiliza `allowedParentOrigin` en lugar del comodín `'*'`. Si `allowedParentOrigin` aún no está definido, se pospone o se restringe el envío.
3. **Validación de Mensajes Entrantes**:
   - En el oyente de eventos de mensaje (`window.addEventListener('message', ...)`), se comprueba de forma estricta si `event.origin === allowedParentOrigin`. Si el origen no coincide, el mensaje se ignora completamente.

## Cómo Funciona la Protección
Al eliminar el uso de `'*'` en `postMessage`, los navegadores modernos garantizan que los datos solo sean entregados si el dominio receptor coincide exactamente con `allowedParentOrigin`. Esto previene ataques de exfiltración de datos por robo de contexto en iFrames o Cross-Frame Scripting.
