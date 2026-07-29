# Explicación Técnica: Filtrado de Archivos Sensibles y Restricción a Componentes UI

## 1. Qué se agregó / cambió
Se implementaron dos mecanismos de filtrado y protección en el servidor Express (`src/server.js`):
1. **`isSensitiveFile(filename, relativePath)`**: Un clasificador que detecta y bloquea archivos o carpetas que contienen variables de entorno (`.env*`), credenciales/llaves (`*.key`, `*.pem`, `*.secret`), carpetas ocultas/del sistema (`.git`, `.vscode`, `.editar-backups`, `node_modules`, `dist`, `out`, `.next`), archivos de registro (`*.log`) y archivos de configuración del proyecto (`package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.js`, etc.).
2. **`isEditableUIFile(filename, relativePath)`**: Un filtro para `/api/files` que restringe el árbol de archivos únicamente a archivos fuente de interfaz de usuario editables (`.jsx`, `.tsx`, `.js`, `.ts`, `.html`, `.css`), omitiendo ruido visual de archivos de infraestructura.

---

## 2. Cómo funciona técnicamente
- **En la resolución y lectura de archivos (`resolveFilePath`)**:
  Cuando cualquier endpoint (`/api/read`, `/api/analyze-element`, `/api/edit-style`) intenta acceder a un archivo, se resuelve la ruta real en disco con `fs.realpathSync()`. A continuación, se evalúa `isSensitiveFile`. Si el archivo coincide con algún patrón de secretos, carpetas privadas o configuración bloqueada, el servidor interrumpe la petición inmediatamente respondiendo con un error HTTP `403 Forbidden` (`Access denied: Sensitive file access blocked`).
  
- **En la API del explorador de archivos (`GET /api/files`)**:
  Al escanear recursivamente el espacio de trabajo (`WORKSPACE_PATH`), el servidor ignora las carpetas o archivos que devuelven `isSensitiveFile === true`. Para los archivos restantes, solo incluye en el JSON aquellos que devuelven `isEditableUIFile === true`.

---

## 3. Por qué se agregó
1. **Seguridad y Privacidad de Datos**: Si el servidor Express se ejecuta localmente (`localhost`) en la máquina de un desarrollador, cualquier script o cliente en el navegador podía pedir `/api/read` con la ruta `.env` y exfiltrar credenciales privadas (bases de datos, llaves API de OpenAI, tokens de AWS, etc.).
2. **Reducción de Ruido Visual en la UI**: El usuario del editor visual necesita seleccionar páginas y componentes React/Next.js para editarlos. Mostrar archivos como `package-lock.json` o `vite.config.js` en el árbol de navegación no aporta valor de edición visual y entorpece la experiencia de usuario.
