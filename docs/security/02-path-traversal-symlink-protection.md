# Vulnerabilidad 2: Path Traversal, Enlaces Simbólicos y TOCTOU (Time-of-Check to Time-of-Use)

## Problema y Riesgo de Seguridad
El servidor resolvía rutas usando `path.join(WORKSPACE_PATH, file)` y verificaba que comenzara con `WORKSPACE_PATH`. Sin embargo:
1. `startsWith` sobre cadenas no normalizadas permitía desbordamiento si la ruta contenía secuencias como `../` o enlaces simbólicos (symlinks) dentro del espacio de trabajo que apuntasen fuera del proyecto (ej. hacia `/etc/passwd` o `~/.ssh/id_rsa`).
2. Existía riesgo de vulnerabilidad TOCTOU (Time-of-Check to Time-of-Use) si un archivo o directorio se modificaba o reemplazaba entre el momento del chequeo y la lectura/escritura en disco.

## Solución Implementada
Se reescribió `resolveFilePath` y la validación de seguridad asociada:
1. Se utiliza `path.resolve(WORKSPACE_PATH, filePath)` para resolver rutas relativas y absolutas dentro del workspace (o en la subcarpeta fallback `demo-app`).
2. Se resuelve la ruta canónica real en el sistema de archivos mediante `fs.realpathSync()` tanto para `WORKSPACE_PATH` como para el archivo objetivo (`realTarget`).
3. Se verifica estrictamente que `realTarget` sea igual a `realWorkspace` o que empiece con `realWorkspace + path.sep`.
4. Si la comprobación falla o el archivo apunta fuera del workspace, se lanza un error y la API responde con `403 Forbidden` y un mensaje claro de denegación de acceso.

## Cómo Funciona la Protección
Al evaluar las rutas con `fs.realpathSync()`, Node.js resuelve todos los enlaces simbólicos y elimina componentes `.`, `..` en el sistema de archivos real. Esto garantiza que sin importar qué trucos de secuencias relativas o symlinks contenga la entrada del usuario, el archivo final leído o escrito estará garantizado dentro de la carpeta del proyecto.
