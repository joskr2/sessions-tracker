// src/frontend/lib/apiClient.ts
import { useAuthStore } from "../store/authStore";

const API_BASE_URL = "http://localhost:3000/api"; // Cambiado para apuntar al backend en el puerto 3000

interface ApiErrorData {
  error: string; // Esperamos que el backend devuelva un objeto con una propiedad 'error'
  message?: string; // A veces express-validator u otros pueden usar 'message'
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.append("Authorization", `Bearer ${token}`);
  }

  // Solo añadir Content-Type si hay un body y no es FormData
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.append("Content-Type", "application/json");
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorData: ApiErrorData | string = {
      error: `HTTP error ${response.status}: ${response.statusText}`,
    };
    try {
      // Intenta parsear el cuerpo del error como JSON
      const parsedError = await response.json();
      // Asumimos que el backend devuelve un objeto con una propiedad 'error'
      if (parsedError && (parsedError.error || parsedError.message)) {
        errorData = { error: parsedError.error || parsedError.message };
      }
    } catch (e) {
      // Si el parseo falla, usa el statusText
      console.warn("Could not parse error response JSON:", e);
    }
    // Lanzar el mensaje de error extraído o el genérico
    throw new Error(
      typeof errorData === "string" ? errorData : errorData.error
    );
  }

  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    // No Content o sin cuerpo
    return null as T;
  }
  return response.json() as Promise<T>;
}

export const apiClient = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "GET" }),
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  post: <T>(endpoint: string, body: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(body),
    }),
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  put: <T>(endpoint: string, body: any, options?: RequestInit) =>
    request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(body),
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { ...options, method: "DELETE" }),
};
