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

## Cómo Empezar

Para iniciar el editor visual y la aplicación de demostración localmente, segui estos pasos:

### 1. Instalar dependencias

Instala las dependencias tanto en el editor (raíz) como en la aplicación de demostración (`demo-app`):

```bash
# Instalar dependencias del editor en la raíz
npm install

# Instalar dependencias de la aplicación demo
cd demo-app && npm install && cd ..
```

### 2. Levantar los servidores

Necesitas iniciar ambos servidores en paralelo (en terminales separadas):

```bash
# Terminal 1: Iniciar el editor visual (en el puerto 8080)
npm run dev

# Terminal 2: Iniciar la aplicación demo de Next.js (en el puerto 3000)
cd demo-app && npm run dev
```

Abre **`http://localhost:8080`** en tu navegador para ver la interfaz de **edItAr** y empezar a editar de forma interactiva.

---

##  Cómo Funciona

```
[ Canvas Visual (Iframe) ] ──(Click en elemento)──> [ Inspector de Estilos ]
           ▲                                                   │
     (HMR Recarga)                                        (Modifica clases)
           │                                                   ▼
[ Next.js Servidor Dev ] <──(Guarda archivo)── [ AST Modificador Backend ]
```

1. **Babel Plugin (`src/babel-plugin.js`):** Durante la compilación en desarrollo, este plugin inyecta un atributo `data-source-loc="ruta/archivo.jsx:linea:columna"` en cada etiqueta JSX de tu código React.
2. **Iframe Preview & Client Script (`src/client.js`):** La vista previa renderiza la aplicación dentro de un `iframe` que tiene inyectado un script especial (`editar-client.js`). Al hacer clic en cualquier elemento, el script detecta su ubicación original y envía esa información al panel del editor usando la API `postMessage`.
3. **AST Parser & Recast (`src/server.js`):** Cuando cambias un valor (como añadir padding `p-4` a `p-6` o cambiar el fondo), el editor envía una petición al backend. Este lee el archivo JSX exacto, usa **Recast** y **Babel Parser** para modificar únicamente el atributo `className` en el árbol AST de ese elemento y guarda el archivo preservando tus espacios y formato original del código.
4. **Hot Module Replacement (HMR):** Next.js detecta el cambio en el archivo de código guardado, lo recompila al instante, y el iframe se actualiza de inmediato para reflejar el cambio en pantalla.

---

##  Cómo integrarlo en tu propio proyecto Next.js / React

Para agregar **edItAr** a cualquier proyecto existente:

### 1. Copia el archivo `babel-plugin.js`
Copia el archivo `src/babel-plugin.js` a tu proyecto.

### 2. Configura tu compilador para usar Babel
Crea o modifica tu archivo `babel.config.js` en la raíz de tu proyecto para inyectar las ubicaciones en desarrollo:
```javascript
module.exports = {
  presets: ['next/babel'],
  plugins: [
    process.env.NODE_ENV === 'development' && ['./path/to/babel-plugin.js']
  ].filter(Boolean)
};
```

### 3. Inyecta el script cliente en tu Layout
Añade la etiqueta de script en tu archivo raíz layout/plantilla (ej. `app/layout.jsx` o `_document.jsx`):
```jsx
export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        {process.env.NODE_ENV === 'development' && (
          <script src="http://localhost:8080/editar-client.js" async />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 4. Inicia el editor en tu proyecto
Una vez configurado Babel y el script cliente, podes ejecutar el editor visual directamente en la raíz de tu proyecto ejecutando:

```bash
# Si lo tienes instalado local o globalmente
npx editar
```

El servidor detectará tu directorio de trabajo actual (`process.cwd()`) y buscará los archivos para editar las clases e inyectar el código AST localmente.
