# Undo/Redo Estructural (Insertar y Eliminar Elementos)

## 1. ¿Qué se agregó/cambió?
Se implementó el soporte completo de **Undo/Redo (Ctrl+Z / Ctrl+Y)** para operaciones estructurales en el AST, específicamente la **inserción** y la **eliminación** de elementos. Anteriormente, el historial sólo soportaba cambios de clases Tailwind y de contenido de texto.

Archivos modificados:
- `src/server.js`: Se actualizaron `/api/insert-element` y `/api/delete-element`, y se agregó el endpoint `/api/write-file-content`.
- `src/client/App.jsx`: Se actualizó `pushHistoryState`, `handleUndo`, y `handleRedo`.

## 2. ¿Cómo funciona técnicamente?
Dado que deshacer una eliminación de AST en tiempo real a través de simples mutaciones aisladas es matemáticamente complejo e inconsistente (si no tenés los identificadores precisos), adoptamos una solución robusta basada en **versiones completas del archivo**:
1. Cuando el frontend envía un comando de insertar/borrar, el `server.js` extrae el código actual del archivo (`prevCode`).
2. Se muta el AST y se extrae el código final (`newCode`).
3. El servidor devuelve ambos (`prevCode` y `newCode`) en la respuesta JSON.
4. El frontend guarda una transacción en su pila de historial con el formato `{ type: 'structural', file, prevCode, newCode }`.
5. Si el usuario presiona **Ctrl+Z** (Undo), el editor visual intercepta que es de tipo `structural` y llama al endpoint `POST /api/write-file-content` enviando el `prevCode`, el cual sobrescribe directamente el archivo `.jsx`.
6. Al sobrescribirse el archivo, el sistema de **Fast Refresh de Next.js** (HMR) actualiza la interfaz instantáneamente sin recargar la página.

## 3. ¿Por qué se agregó?
Era una limitación crítica en el flujo de diseño: los usuarios podían arrepentirse de cambiar un color y darle Ctrl+Z, pero si insertaban o borraban un elemento por accidente, la pérdida era irreversible desde la interfaz visual y rompía la experiencia fluida de edición. Con este sistema, cualquier mutación drástica en el AST cuenta con una red de seguridad infalible y estricta a nivel de archivo fuente.
