<p align="center">
  <img src="./assets/editar_logo.png" alt="edItAr Logo" width="120" />
</p>

<h1 align="center">edItAr</h1>

<p align="center">
  <strong>Editor Visual Auto-Alojable Local para React, Next.js y Tailwind CSS</strong>
</p>

---

**edItAr** (ed**I**t**A**r) es una herramienta de código abierto y auto-alojable para React/Next.js y Tailwind CSS. Te permite diseñar e inspeccionar visualmente tus componentes de forma interactiva (estilo Canva), aplicando los cambios de estilo directamente sobre el código fuente local en tiempo real.

La lógica compleja de programación se delega a tu asistente de IA, mientras que los ajustes visuales y estéticos rápidos los haces vos en la interfaz de **edItAr** con historial Undo/Redo y salvaguarda de código dinámico.

---

## Inicio Rápido en 3 Pasos

Integrar **edItAr** en cualquier proyecto React, Next.js o Vite existente toma **solo 2 comandos**:

### 1️⃣ Configuración Automática (Solo la primera vez)
En la terminal de tu proyecto React o Next.js, ejecuta:

```bash
npx editar init
```

> **¿Qué hace automáticamente?**  
> `edItAr` detecta la estructura de tu proyecto (Next.js App Router, Pages Router o Vite), genera la configuración de `babel.config.js` e inyecta la etiqueta de script en tu plantilla raíz sin que tengas que editar código a mano.

### 2️⃣ Iniciar el Editor Visual
En la misma terminal, ejecuta:

```bash
npx editar
```

Abre **`http://localhost:8080`** en tu navegador para ver la interfaz interactiva de **edItAr**.

### 3️⃣ Diseñar e Inspeccionar en Vivo
* Haz clic en cualquier elemento (botón, título, tarjeta o contenedor) en el lienzo visual.
* Modifica colores de Tailwind, espaciados, fuentes o textos desde los acordeones del Inspector o la barra flotante.
* **Los cambios se guardan instantáneamente en tu código fuente `.jsx` local.**
* Presiona **`Esc`** para salir de la selección o **`Ctrl+Z`** para deshacer un cambio.

---

## Probar la Aplicación Demo Localmente

Si quieres probar **edItAr** en el repositorio local con la aplicación de demostración incluida:

```bash
# 1. Instalar dependencias en la raíz y en demo-app
npm run setup

# 2. Iniciar el editor (puerto 8080) y la app demo de Next.js (puerto 3000)
# Terminal 1:
npm run dev

# Terminal 2:
cd demo-app && npm run dev
```

Abre **`http://localhost:8080`** para interactuar con la demo.

---

## Arquitectura e Integración Técnica

```
[ Canvas Visual (Iframe) ] ──(Click en elemento)──> [ Inspector de Estilos ]
           ▲                                                   │
     (HMR Recarga)                                        (Modifica clases)
           │                                                   ▼
[ Next.js Servidor Dev ] <──(Guarda archivo)── [ AST Modificador Backend ]
```

1. **Babel Plugin (`src/babel-plugin.js`):** Durante la compilación en desarrollo, este plugin inyecta un atributo `data-source-loc="ruta/archivo.jsx:linea:columna"` en cada etiqueta JSX de tu código React.
2. **Iframe Preview & Client Script (`src/client.js`):** La vista previa renderiza la aplicación dentro de un `iframe` que tiene inyectado el script cliente (`editar-client.js`). Al hacer clic en cualquier elemento, el script detecta su ubicación original y envía esa información al panel del editor usando la API `postMessage`.
3. **AST Parser & Recast (`src/server.js`):** Cuando cambias un valor (como añadir padding `p-4` a `p-6` o cambiar el fondo), el backend lee el archivo JSX exacto, utiliza **Recast** y **Babel Parser** para modificar únicamente el atributo `className` o texto en el árbol AST de ese elemento y guarda el archivo preservando tus espacios y formato original del código.
4. **Hot Module Replacement (HMR):** Next.js o Vite detectan el cambio en el archivo de código guardado, lo recompilan al instante, y el iframe se actualiza de inmediato para reflejar el cambio en pantalla.

---
