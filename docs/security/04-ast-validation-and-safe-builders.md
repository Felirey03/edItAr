# Vulnerabilidad 4: Inyección de código JSX/HTML, Escrituras AST Inválidas y Falta de Backup

## Problema y Riesgo de Seguridad
1. **Sobrescritura Directa de Archivos sin Backup ni Validación**: Antes de esta mejora, la API `/api/edit-style` modificaba el AST de Recast y escribía el código generado directamente en el disco. Si la modificación AST generaba un código sintácticamente inválido o corrupto, el archivo de código fuente del proyecto se destruía sin posibilidad de recuperación.
2. **Construcción Manual de Nodos AST (Literales)**: Se utilizaban objetos literales planos (ej. `{ type: 'StringLiteral', value: ... }`) en lugar de los constructores oficiales de `recast.types.builders` / `@babel/types`. Esto podía generar nodos AST defectuosos sin la estructura interna adecuada exigida por Recast/Babel.
3. **Riesgo de Inyección JSX/HTML**: Al actualizar `newText`, asignar cadenas arbitrarias o estructuras complejas sin validar el contenido ni usar constructores seguros permitía la inyección inadvertida de código o elementos indeseados.

## Solución Implementada
1. **Creación Automática de Backup**: Antes de sobrescribir cualquier archivo en `/api/edit-style`, se crea una copia de seguridad en la carpeta `.editar-backups` dentro del workspace con un prefijo de marca de tiempo (`ISO Timestamp`).
2. **Pre-validación del Código Generado**: Tras transformar el AST y convertirlo a código fuente con `recast.print(ast).code`, se valida el parseo del código resultante mediante `@babel/parser` configurado con los mismos plugins que el proyecto. Si el parseo falla, la operación se aborta con `400 Bad Request` / `500 Internal Server Error` y el archivo original no se modifica.
3. **Uso de Constructores Oficiales (`recast.types.builders`)**: Se sustituyeron todas las creaciones manuales de nodos por `b.jsxAttribute`, `b.jsxIdentifier`, `b.stringLiteral`, `b.jsxText`, etc.
4. **Protección de Nodos Dinámicos**: Se mantienen y refuerzan las comprobaciones estáticas (`checkClassNameIsDynamic` y `checkChildrenAreDynamic`) rechazando la edición si el elemento contiene expresiones complejas.

## Cómo Funciona la Protección
- Si el usuario intenta editar un componente React, el servidor primero valida que sus clases o hijos no contengan expresiones dinámicas (ej. llamadas a funciones o variables no estáticas).
- Construye la modificación utilizando los builders seguros de `recast.types.builders`.
- Imprime el código nuevo y ejecuta un análisis sintáctico previo (`parser.parse`). Si el parseo es exitoso, respalda el archivo original en `.editar-backups` y escribe los cambios en disco. Si hay un fallo de sintaxis, preserva el archivo sin tocar.
