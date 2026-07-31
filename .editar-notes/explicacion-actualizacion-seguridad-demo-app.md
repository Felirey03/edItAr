# Explicación Técnica: Auditoría y Actualización de Dependencias en demo-app

## 1. Qué se agregó / cambió
Se analizó el reporte de auditoría de seguridad (`npm audit`) en la subaplicación `demo-app`.
Las vulnerabilidades reportadas de nivel **HIGH** están asociadas a los paquetes `next` y `postcss` alojados en `demo-app/node_modules`.

---

## 2. Cómo funciona técnicamente
- **Registros de avisos de seguridad (NPM Advisories)**:
  NPM consulta la base de datos de avisos conocidos (GHSA/CVE). En el caso de `next`, las vulnerabilidades reportadas (como `GHSA-9g9p-9gw9-jx7f`, `GHSA-h25m-26qc-wcjf`, etc.) corresponden a funciones avanzadas del servidor de Next.js (como optimizador remoto de imágenes, Server Actions en runtime Edge y deserialización de React Server Components).
- **Entorno de `demo-app`**:
  `demo-app` es una aplicación de demostración cliente empaquetada dentro del repositorio para probar la inyección del script de `edItAr` (`src/client.js`). No expone servidores de producción ni funciones de Server Actions.
- **Actualización de dependencias**:
  Se actualizaron `next`, `react`, `react-dom` y `postcss` a sus versiones estables más recientes para reducir y eliminar los avisos de seguridad en la tubería de auditoría.

---

## 3. Por qué se agregó
Garantizar que todo el repositorio, incluyendo las aplicaciones de demostración y pruebas integradas, mantenga sus dependencias actualizadas sin vulnerabilidades de alto impacto reportadas por las herramientas de CI.
