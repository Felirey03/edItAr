# Vulnerabilidad 6: Inyección de Metadatos Internos (`data-source-loc`) en Entornos de Producción

## Problema y Riesgo de Seguridad
El plugin de Babel `src/babel-plugin.js` inyectaba incondicionalmente el atributo `data-source-loc` en todos los elementos JSX compilados, sin verificar el entorno de ejecución (`NODE_ENV`).

En un entorno de producción (bundle distribuido a usuarios finales), exponer la estructura de archivos, nombres de componentes y números de línea exactos en el DOM público constituye una divulgación de información sensible (Information Disclosure / Fingerprinting).

## Solución Implementada
Se modificó `src/babel-plugin.js` para añadir una comprobación de entorno:
1. El plugin solo ejecuta la inyección del atributo `data-source-loc` cuando `process.env.NODE_ENV !== 'production'`.
2. Se garantiza que las rutas generadas sean relativas al workspace del proyecto y usen separadores estándar sin exponer rutas absolutas del sistema operativo host.

## Cómo Funciona la Protección
Durante la compilación o empaquetado para producción (`NODE_ENV=production`), el visitante AST del plugin de Babel retorna de inmediato sin modificar los elementos JSX. Esto mantiene el código compilado para producción limpio y libre de metadatos internos de desarrollo.
