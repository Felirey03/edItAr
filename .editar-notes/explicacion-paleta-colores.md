# Paleta de Colores Pop-over

## 1. ¿Qué se agregó/cambió?
Se reemplazaron los clásicos `<select>` nativos para elegir el color de Fondo y el color de Texto en la barra flotante (Toolbar) del editor visual. Ahora se utilizan botones que despliegan un **Pop-over con una grilla de colores visuales** (estilo Canva).

Archivos modificados:
- `src/client/App.jsx`: Se añadió el estado `activeColorPicker` y la constante `TAILWIND_COLORS`. Se cambió la renderización en el JSX de la toolbar.
- `src/client/index.css`: Se añadieron las clases `.color-popover` y `.color-swatch` con animaciones de hover y diseño en grilla.

## 2. ¿Cómo funciona técnicamente?
1. Se mapeó una lista curada de colores de Tailwind (ej: `red-500`) directamente a sus valores HEX (ej: `#ef4444`) dentro del objeto `TAILWIND_COLORS`. Esto permite que el propio editor UI pinte los cuadraditos de color sin depender de que Tailwind genere dinámicamente esas clases para la interfaz del editor.
2. Al hacer clic en los botones de "Fondo" o "Texto", se setea el estado `activeColorPicker` en `'bg'` o `'text'`.
3. Esto renderiza un `div.color-popover` posicionado de manera absoluta respecto al botón presionado.
4. Dentro del popover, se itera sobre `TAILWIND_COLORS` generando botones `.color-swatch` pintados con el HEX correspondiente.
5. Al hacer clic en un *swatch*, se dispara `handleStyleChange` pasándole la clase de Tailwind (`bg-red-500` o `text-red-500`), el estado se cierra y el AST actualiza el componente.

## 3. ¿Por qué se agregó?
El uso de selectores nativos (`<select>`) no ofrecía una buena experiencia visual, ya que el usuario sólo leía el texto "bg-red-500" sin ver el color real. Al construir una grilla visual, la experiencia se vuelve mucho más intuitiva y cercana a herramientas de diseño profesionales, manteniendo al mismo tiempo la pureza de estar inyectando utilidades estándar de Tailwind CSS.
