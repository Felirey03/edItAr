# Explicación Técnica: Arreglo de Toolbar y Eliminación de Elementos

## 1. Clamping de la Toolbar (Barra Flotante)
- **Problema:** Al hacer clic en un elemento ubicado muy a la derecha del contenedor (iframe), la barra flotante (que utiliza coordenadas CSS `left` y `top` absolutas basadas en el `rect` del elemento seleccionado) se desbordaba de la pantalla o quedaba oculta bajo el panel lateral derecho (`Inspector`).
- **Solución Técnica:** Se modificó la variable `toolbarLeft` en `App.jsx`. Antes se usaba `Math.max(8, rect.left)`. Ahora se obtiene el ancho del `iframe` (o la ventana como fallback) y se aplica una fórmula de límite superior e inferior (Clamping):
  ```javascript
  const iframeWidth = iframeRef.current ? iframeRef.current.clientWidth : window.innerWidth - 320;
  const toolbarLeft = Math.min(Math.max(8, rect.left), iframeWidth - 360);
  ```
  El valor de `360` representa el margen necesario para acomodar el ancho aproximado de la toolbar y el padding.

## 2. Eliminación de Elementos vía AST
- **Problema:** No existía funcionalidad para borrar elementos que ya fueron añadidos a la vista.
- **Solución Técnica:**
  - **Motor de AST (`server.js`)**: Se creó el endpoint `POST /api/delete-element`. Este endpoint localiza el elemento JSX exacto usando `line` y `column` (al igual que el insert/edit) y utiliza la función de Babel/Recast `targetPathNode.remove()` para eliminar el nodo del AST. Finalmente, re-imprime el código y lo guarda en disco.
  - **Cliente (`client.js` en iframe)**: Se amplió el escuchador de eventos `keydown` para capturar las teclas `Delete` (Suprimir) y `Backspace` (Retroceso) cuando no se está dentro de un input. Estas teclas se envían vía `postMessage` con el tipo `VISUALDEV_KEY_DOWN`.
  - **Interfaz de Editor (`App.jsx`)**: 
    - Se agregó el botón con el icono `Trash2` (Rojo) al final de la `.floating-toolbar`.
    - Se actualizó el manejador de mensajes del iframe para invocar `handleDeleteElement()` al presionar las teclas de borrado.
    - Se incorporaron las dependencias correctas en el `useEffect` para asegurar que `selectedElement` esté disponible al presionar las teclas.

## 3. Discusión de Layout (Opción A vs B)
- **Opción A (Adoptada):** Construcción estructurada usando flujos HTML estándar (Flex/Grid). Esto asegura escalabilidad y produce un código React final limpio y fácil de mantener para los desarrolladores.
- **Opción B (Investigación Futura):** Para lograr posicionamiento libre estilo Canva sin degradar el código (Option B responsiva), requeriría un sistema que traduzca dinámicamente posiciones absolutas a estructuras Flexbox complejas o Grids CSS (`grid-template-areas`), en lugar de usar inyección cruda de píxeles (`top/left`). Es una investigación profunda para el futuro.
