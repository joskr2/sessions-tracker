// src/shared/types.ts
export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Appointment {
  id: string;
  userId: string; // Quién creó/posee la cita
  title: string;
  description?: string;
  startTime: string; // ISO Date string
  endTime: string;   // ISO Date string
  createdAt?: string; // ISO Date string
  // Podrías añadir más campos como 'status' (pending, confirmed, cancelled, finished)
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Para payloads de WebSocket
export enum WebSocketMessageType {
  CONNECTION_ESTABLISHED = "CONNECTION_ESTABLISHED",
  AUTH_WEBSOCKET = "AUTH_WEBSOCKET",
  APPOINTMENT_CREATED = "APPOINTMENT_CREATED",
  APPOINTMENT_UPDATED = "APPOINTMENT_UPDATED",
  APPOINTMENT_DELETED = "APPOINTMENT_DELETED",
  ERROR = "ERROR",
}

// src/shared/types.ts
export type WebSocketMessage = {
  type: WebSocketMessageType;
  socketId?: string;
  payload: string | object;
  error?: string; // Asegúrate de que esta propiedad esté definida si es necesaria
};

// src/shared/types.ts
export type LoginCredentials = {
  email: string;
  password: string;
};
