# Posicionamiento Dinámico de la Barra Flotante

## 1. ¿Qué se agregó/cambió?
Se modificó la lógica de cálculo matemático para la posición vertical (`toolbarTop`) de la barra flotante de herramientas del editor visual en `src/client/App.jsx`.

## 2. ¿Cómo funciona técnicamente?
Antes, la barra se ubicaba 46px por encima del elemento seleccionado. Si esa área quedaba recortada por el scroll (borde superior del iframe), la barra "saltaba" hacia abajo del elemento.
Ahora, la lógica incorpora el tamaño de la ventana (`windowHeight`) para determinar si el elemento seleccionado es "gigante" (ocupa más del 60% de la pantalla, como el contenedor de la página). Si el elemento es gigante, o si su parte superior está fuera del viewport, en lugar de enviar la barra al fondo, se "ancla" en la parte superior interna del elemento, usando `Math.max(16, rect.top + 16)`.
Además, se agregó un *clamp* (límite inferior) con `Math.min(toolbarTop, windowHeight - 100)` para garantizar que ningún cálculo extremo saque la barra de los límites inferiores de la pantalla.

## 3. ¿Por qué se agregó?
Se descubrió un problema grave de usabilidad: al seleccionar el fondo entero de la página (`body`, `<main>`), su altura es enorme. Como el límite superior de dicho elemento suele estar en el borde de la pantalla (`top: 0`), el editor evaluaba que la barra chocaría, mandándola al final del contenedor (muchos píxeles por debajo del final del monitor). Esto hacía que la barra desapareciera visualmente para el usuario. Con esta solución inteligente, la barra prioriza quedarse siempre visible en la parte de arriba de la pantalla.
