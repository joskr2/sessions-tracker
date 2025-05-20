// src/server/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/bun';
import { secureHeaders } from 'hono/secure-headers';
import { authRoutes } from './auth/routes';
import { appointmentRoutes } from './appointments/routes';
import { webSocketHandler, broadcastUpdate } from './websockets'; // Asegúrate que el path es correcto
import type { User } from '@/shared/types';

declare module 'hono' {
  interface ContextVariableMap {
    user?: User;
  }
}

export interface WebSocketSessionData {
  socketId: string;
  userId?: string;
}

const app = new Hono();

// --- Middleware ---
app.use('*', logger());
app.use('/api/*', cors());
app.use('*', secureHeaders());

// --- Rutas API ---
app.route('/api/auth', authRoutes);
app.route('/api/appointments', appointmentRoutes);

// --- Servir Frontend ---

// 1. Servir archivos estáticos específicos conocidos que están en la raíz de 'dist'
//    Asegúrate de que 'logo.svg' y 'react.svg' (si existe) se copian a 'dist/' durante el build.
//    Tu build.ts actual no parece copiar explícitamente src/logo.svg a dist/logo.svg.
//    Bun como bundler, cuando procesa src/index.html, debería manejar esto.
//    Si logo.svg está en la raíz de 'dist' después del build, esto funcionará.
app.get('/logo.svg', serveStatic({ path: './dist/logo.svg' }));
// app.get('/react.svg', serveStatic({ path: './dist/react.svg' })); // Si tienes este

// 2. Servir los chunks de CSS, JS y sourcemaps generados por el build.
//    Estos también están en la raíz de 'dist/'.
//    Este patrón Hono usa un parámetro con una expresión regular.
//    Captura nombres de archivo como 'chunk-xxxxxxx.css' o 'chunk-yyyyyyy.js'.
app.get(
  '/:filename{[a-zA-Z0-9_-]+-[a-zA-Z0-9]+\\.(css|js|js\\.map)}',
  serveStatic({ root: './dist' })
);
// Explicación del patrón:
// - '/:filename' - define un parámetro llamado 'filename'.
// - '{...}' - envuelve una expresión regular para este parámetro.
// - '[a-zA-Z0-9_-]+' - una o más letras, números, guiones bajos o guiones (para la parte antes del hash).
// - '-' - un guion literal.
// - '[a-zA-Z0-9]+' - una o más letras o números (para la parte del hash).
// - '\\.' - un punto literal (escapado).
// - '(css|js|js\\.map)' - coincide con las extensiones 'css', 'js', o 'js.map'.
// `serveStatic({ root: './dist' })` tomará el path completo que coincidió (ej. /chunk-c3w9s8bg.css)
// y buscará el archivo en `./dist/chunk-c3w9s8bg.css`.

// 3. SPA Fallback: Si ninguna ruta de API o de archivo estático coincidió, servir index.html.
//    Esta debe ser la ÚLTIMA ruta GET general.
app.get('*', serveStatic({ path: './dist/index.html' }));

console.log("Servidor Hono configurado para servir API y Frontend desde './dist'");

// --- Servidor Bun principal (HTTP y WebSocket) ---
const server = Bun.serve({
  port: process.env.PORT || 3000,
  async fetch(request, serverInstance) {
    const url = new URL(request.url);
    if (url.pathname === '/ws') {
      const success = serverInstance.upgrade<WebSocketSessionData>(request, {
        data: { socketId: `temp-${crypto.randomUUID()}` },
      });
      if (success) return;
      return new Response("WebSocket upgrade failed", { status: 500 });
    }
    // Para Hono v4, el segundo argumento para app.fetch puede ser env y executionContext.
    // Pasar serverInstance es más para Hono < v4 o contextos específicos.
    // Para la simplicidad y compatibilidad general con Bun.serve y Hono:
    return app.fetch(request); // Hono normalmente no necesita serverInstance aquí.
  },
  websocket: webSocketHandler,
  error(error) {
    console.error("Bun.serve error:", error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

console.log(`🚀 Servidor escuchando en http://${server.hostname}:${server.port}`);
export { broadcastUpdate };
