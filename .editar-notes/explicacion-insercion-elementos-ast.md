# Explicación Técnica: Solución de Drag & Drop Cross-Iframe con Overlay

## 1. Qué se cambió

Se solucionó la limitación nativa de los navegadores donde los eventos HTML5 `dragover` / `drop` no cruzan la barrera entre la ventana principal (`App.jsx` en `localhost:8080`) y un `iframe` embebido (`localhost:3000`).

### Cambios principales:
1. **Overlay Transparente de Drag en `App.jsx`**:
   - Al iniciar el arrastre de una tarjeta desde la paleta lateral ("Elementos"), se activa una capa transparente (`<div style={{ position: 'absolute', inset: 0, zIndex: 999999 }}>`) sobre el contenedor del `iframe`.
   - Esta capa captura todos los eventos `onDragOver`, `onDrop` y `onDragLeave` directamente en el documento del padre con 100% de confiabilidad.
   - En cada movimiento (`onDragOver`), la capa calcula las coordenadas `(x, y)` relativas al `iframe` y las envía vía `postMessage` (`VISUALDEV_DRAG_HOVER`).

2. **Detección por `document.elementFromPoint(x,y)` en `src/client.js`**:
   - El script que corre dentro del `iframe` escucha `VISUALDEV_DRAG_HOVER` y llama a `document.elementFromPoint(x, y)` para encontrar el elemento DOM exacto sobre el que está el cursor.
   - Calcula si el cursor está en la mitad superior (`before`), centro (`inside`) o mitad inferior (`after`), y renderiza el indicador azul en vivo (`↑ Insert before`, `↓ Insert after`, `⊕ Insert inside`).

3. **Inserción AST y HMR en Vivo**:
   - Al soltar el mouse, se resuelve la posición en el código fuente JSX y se modifica el archivo `.jsx` usando recast.
   - **Nota sobre HMR**: Originalmente se forzaba la recarga del iframe (`iframe.src = iframe.src`) después de cada inserción. Esto causaba un problema visual porque interrumpía la conexión WebSocket de Next.js antes de que terminara de compilar, impidiendo ver el elemento nuevo. Al quitar la recarga manual, **Next.js Fast Refresh** (HMR) inyecta el nuevo componente en el DOM automáticamente de forma instantánea sin parpadeos.
   - `App.jsx` llama a `/api/insert-element` para modificar el AST en el archivo `.jsx` de Next.js.

---

## 2. Por qué se hizo así

- **Restricción de Seguridad del Navegador**: El estándar HTML5 prohíbe o degrada severamente el arrastre de elementos DOM nativos a través de marcos `iframe` cross-origin o sin coordinación entre ventanas.
- **Confiabilidad total**: El Overlay en el padre garantiza que NINGÚN evento de arrastre se pierda, mientras que `document.elementFromPoint` en el cliente obtiene el elemento DOM con precisión de píxel.
