# Vulnerabilidad 1: CORS Permisivo y Falta de Autenticación en Endpoints Sensibles

## Problema y Riesgo de Seguridad
Originalmente, el servidor Express utilizaba `app.use(cors())` sin parámetros, habilitando Cross-Origin Resource Sharing (CORS) con comodín (`*`). Esto permitía que cualquier sitio web malicioso ejecutándose en el navegador del usuario enviara peticiones HTTP a la API local (ej. `http://localhost:8080/api/read` o `/api/edit-style`).

Además, no existía ninguna autenticación o token secreto para verificar la legitimidad de las llamadas a la API. Un script malicioso en una pestaña secundaria podía leer y modificar archivos arbitrarios del proyecto local sin restricción alguna.

En entorno de producción (`NODE_ENV === 'production'`), la falta de un secreto configurado dejaba la API completamente expuesta a cualquier cliente en la red.

## Solución Implementada
1. **Middleware de CORS Restringido**:
   - Lee la variable de entorno `EDITOR_ALLOWED_ORIGINS` (cadena separada por comas).
   - Valida el encabezado `Origin` entrante contra la lista blanca.
   - Permite solicitudes sin encabezado `Origin` (como llamadas locales mediante `curl` o herramientas CLI).
2. **Middleware de Autenticación (`requireEditorSecret`)**:
   - Compara el token del encabezado `x-editor-secret` con `process.env.EDITOR_SECRET`.
   - En producción (`NODE_ENV === 'production'`), si `EDITOR_SECRET` no está configurado, bloquea el servidor o devuelve `403 Forbidden` en endpoints sensibles.
   - Protege los endpoints `/api/read`, `/api/analyze-element`, `/api/edit-style`, `/api/files` y `/api/tailwind-config`.

## Cómo Funciona la Protección
Cuando una solicitud llega a la API, primero pasa por la validación de CORS. Si el origen es desconocido, el navegador bloquea la respuesta. Si pasa CORS, el middleware `requireEditorSecret` verifica que la solicitud contenga la cabecera `x-editor-secret` correcta. Si el token falta o es erróneo, la petición se rechaza con `401 Unauthorized` o `403 Forbidden` antes de ejecutar cualquier lógica de lectura o escritura de archivos.
