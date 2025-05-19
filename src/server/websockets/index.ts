// src/server/ws/index.ts
import type { ServerWebSocket, WebSocketHandler } from 'bun';
import type { WebSocketMessage, User } from '@/shared/types';
import { WebSocketMessageType } from '@/shared/types';
import { jwtVerify } from 'jose'; // Para verificar el token al conectar
import type { WebSocketSessionData } from '../index'; // Importar la interfaz del server/index.ts

const JWT_SECRET_KEY_STRING = process.env.JWT_SECRET || "super-secret-key-for-dev-at-least-32-chars-long";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY_STRING);

// Almacena las conexiones activas
// El tipo ServerWebSocket<T> permite asociar datos a cada conexión
const activeSockets = new Map<string, ServerWebSocket<WebSocketSessionData>>();

export const webSocketHandler: WebSocketHandler<WebSocketSessionData> = {
  async open(ws: ServerWebSocket<WebSocketSessionData>) {
    const socketId = `ws-${crypto.randomUUID()}`;
    ws.data.socketId = socketId; // Actualizar con el ID real
    activeSockets.set(socketId, ws);
    console.log(`WebSocket connection opened: ${socketId}. Total: ${activeSockets.size}`);

    // Opcional: Autenticar WebSocket al abrir conexión usando un token en la URL
    // Ejemplo: const token = new URL(ws.url).searchParams.get('token');
    // Aquí no lo implementaremos directamente en open para simplificar,
    // pero el cliente podría enviar un mensaje de 'auth' después de conectar.

    ws.send(JSON.stringify({
      type: WebSocketMessageType.CONNECTION_ESTABLISHED,
      socketId: socketId,
      payload: "Connection successful. Waiting for authentication if required."
    } as WebSocketMessage));
  },

  async message(ws: ServerWebSocket<WebSocketSessionData>, message: string | Buffer) {
    console.log(`Received message from ${ws.data.socketId}:`, message.toString());
    try {
      const parsedMessage: WebSocketMessage = JSON.parse(message.toString());

      // Ejemplo: Manejar un mensaje de autenticación del cliente
      if (parsedMessage.type === WebSocketMessageType.AUTH_WEBSOCKET && typeof parsedMessage.payload === 'string') {
        const token = parsedMessage.payload;
        try {
          const { payload: jwtPayload } = await jwtVerify(token, JWT_SECRET);
          ws.data.userId = jwtPayload.userId as string; // Asociar userId al socket
          console.log(`WebSocket ${ws.data.socketId} authenticated for user ${ws.data.userId}`);
          // ws.send(JSON.stringify({ type: WebSocketMessageType.AUTH_SUCCESS, payload: `Authenticated as user ${ws.data.userId}`}));
        } catch (err) {
          console.error(`WebSocket ${ws.data.socketId} authentication failed:`, err);
          ws.send(JSON.stringify({ type: WebSocketMessageType.ERROR, error: "Authentication failed" }));
          ws.close(1008, "Authentication failed");
        }
        return;
      }

      // Por ahora, no se espera que el cliente envíe otros mensajes al servidor
      // pero aquí se podrían manejar, por ejemplo, filtros para recibir solo ciertas actualizaciones.

    } catch (e) {
      console.error(`Error processing message from ${ws.data.socketId}:`, e);
      ws.send(JSON.stringify({
        type: WebSocketMessageType.ERROR,
        error: "Invalid message format",
      } as WebSocketMessage));
    }
  },

  close(ws: ServerWebSocket<WebSocketSessionData>, code: number, reason?: string) {
    activeSockets.delete(ws.data.socketId);
    console.log(`WebSocket connection closed: ${ws.data.socketId}. Code: ${code}, Reason: ${reason}. Total: ${activeSockets.size}`);
  },

  
};

// Función para enviar actualizaciones a los clientes conectados
export function broadcastUpdate(update: WebSocketMessage) {
  const message = JSON.stringify(update);
  console.log("Broadcasting update:", message, "to", activeSockets.size, "clients");

  activeSockets.forEach((socket, socketId) => {
    if (socket.readyState === WebSocket.OPEN) {
      // Lógica de filtrado: solo enviar actualizaciones relevantes
      // Ejemplo: si la actualización es para un usuario específico, solo enviar a ese usuario
      if (update.type === WebSocketMessageType.APPOINTMENT_CREATED ||
          update.type === WebSocketMessageType.APPOINTMENT_UPDATED ||
          update.type === WebSocketMessageType.APPOINTMENT_DELETED) {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        const appointmentPayload = update.payload as { userId?: string; [key: string]: any };
        // Si el socket está autenticado y la cita pertenece a ese usuario, o si es una actualización global
        if (socket.data.userId && appointmentPayload.userId && socket.data.userId === appointmentPayload.userId) {
          socket.send(message);
        } else if (!appointmentPayload.userId && !socket.data.userId) {
          // Si la actualización no tiene userId (ej. general) y el socket no está autenticado
          // O, si quieres que todos los autenticados reciban todo (ajusta esta lógica)
          // Por ahora, si la cita tiene un userId, solo se envía a ese usuario.
          // Si quieres enviar a todos los conectados, elimina la condición de userId.
        } else if (!appointmentPayload.userId && socket.data.userId) {
            // Si es una actualización "global" (sin userId específico en el payload)
            // y el socket está autenticado, se la enviamos.
            // Esto es un ejemplo, ajusta según necesites.
            // socket.send(message);
        }
         // DESCOMENTA ESTA LÍNEA SI QUIERES QUE TODOS LOS SOCKETS ABIERTOS RECIBAN TODAS LAS ACTUALIZACIONES
         socket.send(message);

      } else {
        // Para otros tipos de mensajes, enviar a todos los sockets abiertos
        socket.send(message);
      }
    } else {
      // Opcional: limpiar sockets que no estén abiertos si se detectan aquí
      // activeSockets.delete(socketId);
    }
  });
}
