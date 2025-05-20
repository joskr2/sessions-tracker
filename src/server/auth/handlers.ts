// src/server/auth/handlers.ts
import type { Context } from 'hono';
import { SignJWT, importJWK } from 'jose';
import type { User, AuthResponse } from '@/shared/types';

// En un entorno de producción, esto debería venir de variables de entorno seguras
// y ser una clave más compleja.
const JWT_SECRET_KEY_STRING = process.env.JWT_SECRET || "super-secret-key-for-dev-at-least-32-chars-long";
// Convertir la clave string a un formato que jose pueda usar (Uint8Array)
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY_STRING);
const ALG = 'HS256';

// Mock de base de datos de usuarios (reemplazar con una base de datos real)
const usersDB: User[]  = [
  { id: '1', email: 'user@example.com', name: 'Test User' },
];
const passwordsDB: Record<string, string> = { // Simulación de contraseñas (¡NO HACER ESTO EN PRODUCCIÓN!)
  '1': 'password123',
};

export const loginHandler = async (c: Context): Promise<Response> => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const user = usersDB.find(u => u.email === email);

    // ¡IMPORTANTE! En producción, las contraseñas deben ser hasheadas y comparadas de forma segura.
    // Esta es una simulación muy insegura solo para desarrollo.
    if (!user || passwordsDB[user.id] !== password) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Crear el token JWT
    const token = await new SignJWT({ userId: user.id, email: user.email, name: user.name })
      .setProtectedHeader({ alg: ALG })
      .setIssuedAt()
      .setExpirationTime('1h') // El token expira en 1 hora
      .sign(JWT_SECRET);

    const response: AuthResponse = {
      token,
      user: { id: user.id, email: user.email, name: user.name },
    };
    return c.json(response);

  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: 'An unexpected error occurred during login.' }, 500);
  }
};

export const registerHandler = async (c: Context): Promise<Response> => {
  try {
    const { email, password, name } = await c.req.json();

    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    if (usersDB.some(u => u.email === email)) {
      return c.json({ error: 'User with this email already exists' }, 409);
    }

    const newUser: User = {
      id: String(usersDB.length + 1),
      email,
      name,
    };
    usersDB.push(newUser);
    // ¡IMPORTANTE! Hashear la contraseña antes de guardarla en una BD real.
    passwordsDB[newUser.id] = password; // Simulación

    // Opcionalmente, generar un token y loguear al usuario directamente
    const token = await new SignJWT({ userId: newUser.id, email: newUser.email, name: newUser.name })
      .setProtectedHeader({ alg: ALG })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(JWT_SECRET);

    const response: AuthResponse = {
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
    };
    return c.json(response, 201);

  } catch (error) {
    console.error("Registration error:", error);
    return c.json({ error: 'An unexpected error occurred during registration.' }, 500);
  }
};
