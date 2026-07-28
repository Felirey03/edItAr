# Vulnerabilidad 3: Denegación de Servicio (DoS) y Falta de Rate-Limiting

## Problema y Riesgo de Seguridad
El servidor Express aceptaba payloads de JSON sin límite de tamaño (`bodyParser.json()`), lo que permitía ataques de denegación de servicio (DoS) enviando peticiones de varios megabytes o gigabytes que consumían la memoria RAM y CPU del servidor.

Además, no existía límite en la frecuencia de peticiones que una IP cliente podía realizar, permitiendo ataques de fuerza bruta o saturación de la API.

## Solución Implementada
1. Se configuró el límite de tamaño de carga útil JSON a un máximo de 100 KB: `bodyParser.json({ limit: '100kb' })`.
2. Se integró `express-rate-limit` aplicando una restricción de un máximo de 100 solicitudes por cada ventana de 15 minutos por dirección IP sobre todos los endpoints `/api/*`.

## Cómo Funciona la Protección
- **Límite de Payload**: Si un cliente intenta enviar un cuerpo JSON mayor a 100 KB, el servidor rechaza inmediatamente la petición con un código de estado `413 Payload Too Large`.
- **Limítador de Frecuencia**: El servidor mantiene un conteo de peticiones por IP en una ventana de 15 minutos. Si se superan las 100 peticiones, las solicitudes posteriores devuelven `429 Too Many Requests` con un encabezado `Retry-After`.
