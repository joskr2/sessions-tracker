// src/server/middleware/authMiddleware.ts
import type { Context, Next } from 'hono';
import { jwtVerify, importJWK } from 'jose';
import type { User } from '@/shared/types';

const JWT_SECRET_KEY_STRING = process.env.JWT_SECRET || "super-secret-key-for-dev-at-least-32-chars-long";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_KEY_STRING);

export const authMiddleware = async (c: Context, next: Next) => {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized: Missing or malformed token' }, 401);
  }

  const token = authHeader.substring(7); // Quita "Bearer "

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    // Adjunta la información del usuario al contexto para uso posterior en los handlers
    c.set('user', {
        id: payload.userId as string,
        email: payload.email as string,
        name: payload.name as string,
    });

    await next();
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  } catch (err: any) {
    console.error("JWT Verification Error:", err.message);
    let errorMessage = 'Unauthorized: Invalid token';
    if (err.code === 'ERR_JWT_EXPIRED') {
        errorMessage = 'Unauthorized: Token expired';
    }
    return c.json({ error: errorMessage }, 401);
  }
};
