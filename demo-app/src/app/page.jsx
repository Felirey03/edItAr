import React from 'react';

export default function Home() {
  return (
    <main className="p-8 bg-black text-slate-200 flex flex-col justify-center items-center md:p-16 min-h-screen">
      {/* Hero Section */}
      <div className="text-center max-w-3xl my-8">
        <h1 className="mb-2 bg-gray-700 text-cyan-100 text-5xl tracking-tight">HOLa que tal</h1><p className="text-lg text-zinc-400 max-w-2xl mx-auto">
          Haz clic en cualquier elemento para editar su contenido o modificar sus clases de Tailwind directamente sobre el código fuente local.
        </p>
      </div>
      {/* Feature Grid */}
      <div className="grid text-left lg:max-w-5xl lg:w-full my-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700">
          <h2 className="mb-2 text-white text-lg font-semibold text-center">
            Editor Visual
          </h2>
          <p className="m-0 text-sm text-zinc-400">
            Ajusta márgenes, colores, tipografía y disposiciones haciendo clic en la interfaz.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700">
          <h2 className="mb-2 text-lg font-semibold text-white">
            AST Directo
          </h2>
          <p className="m-0 text-sm text-zinc-400">
            Modifica el código fuente en disco preservando comentarios y formato original.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700">
          <h2 className="mb-2 text-lg font-semibold text-white">
            Cero Tokens
          </h2>
          <p className="m-0 text-sm text-zinc-400">
            Sin llamadas de API para cambios de estilo. Todo se procesa de forma local.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-all hover:border-zinc-700">
          <h2 className="mb-2 text-lg font-semibold text-white">
            Historial Undo/Redo
          </h2>
          <p className="m-0 text-sm text-zinc-400">
            Navega tus cambios con Ctrl+Z / Ctrl+Y sin miedo a romper el código.
          </p>
        </div>
      </div>
      {/* Test Interactive Button */}
      <div className="mt-8 flex gap-4">
        <button className="bg-white hover:bg-zinc-200 text-zinc-950 font-semibold py-2.5 px-6 rounded-lg shadow transition-all">
          Probar Botón Principal
        </button>
        <button className="bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-semibold py-2.5 px-6 rounded-lg transition-all">
          Probar Botón Secundario
        </button>
      </div>
    </main>
  );
}

