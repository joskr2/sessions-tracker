import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serveStatic } from 'hono/bun'; // Para servir el frontend
import { secureHeaders } from 'hono/secure-headers';

import { authRoutes } from './auth/routes';
import { appointmentRoutes } from './appointments/routes';
import { webSocketHandler, broadcastUpdate } from './websockets'; // Importaremos esto
import type { User } from '@/shared/types'; // Asegúrate que el alias funciona

// Para adjuntar el usuario al contexto de Hono después de la autenticación
// y también para la información del WebSocket.
declare module 'hono' {
  interface ContextVariableMap {
    user?: User;
    // wsInstance?: ServerWebSocket<WebSocketSessionData>;
  }
}

// Datos que queremos asociar a cada conexión WebSocket en el servidor
export interface WebSocketSessionData {
  socketId: string;
  userId?: string; // Opcional, si quieres asociar usuarios autenticados a sockets
}


const app = new Hono();

// --- Middleware ---
app.use('*', logger()); // Logger para todas las rutas
app.use('/api/*', cors()); // CORS para todas las rutas API
app.use('*', secureHeaders()); // Headers de seguridad básicos

// --- Rutas API ---
app.route('/api/auth', authRoutes);
app.route('/api/appointments', appointmentRoutes);

// --- Servir Frontend ---
// Asumimos que `bun run build` (usando tu build.ts)
// coloca los archivos del frontend en `dist` o `dist/frontend`.
// Ajusta 'root' si tu `build.ts` tiene un outdir diferente para el frontend.
// Por ahora, el build.ts original pone todo en 'dist'.
// Y `src/frontend/index.html` será el punto de entrada.

// Durante el desarrollo, Bun puede servir directamente desde `src` si `frontend.tsx` se importa.
// Pero para producción y para que `serveStatic` funcione bien, necesitamos un build.

// Sirve archivos estáticos de la carpeta `dist` (donde `build.ts` compila el frontend)
app.use('/assets/*', serveStatic({ root: './dist/assets' })) // JS, CSS compilados
app.use('/logo.svg', serveStatic({ path: './dist/logo.svg' })) // Si está en dist
app.use('/react.svg', serveStatic({ path: './dist/react.svg' })) // Si está en dist

// Para todas las demás rutas que no son API ni assets, sirve el index.html del frontend (SPA)
app.get('*', serveStatic({ path: './dist/index.html' }));


console.log("Servidor Hono configurado.");

// --- Servidor Bun principal (HTTP y WebSocket) ---
const server = Bun.serve({
  port: process.env.PORT || 3000,
  async fetch(request, serverInstance) {
    const url = new URL(request.url);
    if (url.pathname === '/ws') {
      // Intenta actualizar a WebSocket si la ruta es /ws
      // El objeto serverInstance se pasa a webSocketHandler.upgrade
      const success = serverInstance.upgrade<WebSocketSessionData>(request, {
        data: { socketId: `temp-${crypto.randomUUID()}` }, // data inicial, se actualiza en open
      });
      if (success) {
        return; // La conexión WebSocket ha sido manejada por el handler de Bun
      }
      return new Response("WebSocket upgrade failed", { status: 500 });
    }
    // Para todas las demás peticiones, usa la app Hono
    return app.fetch(request, { server: serverInstance }); // Pasar serverInstance por si Hono lo necesita
  },
  websocket: webSocketHandler, // El handler de WebSocket de Bun
  error(error) {
    console.error("Bun.serve error:", error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

console.log(`🚀 Servidor escuchando en http://${server.hostname}:${server.port}`);

// Exportar broadcastUpdate para que los handlers de Hono puedan usarlo
export { broadcastUpdate };
