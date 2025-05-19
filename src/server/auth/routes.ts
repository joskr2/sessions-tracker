// src/server/auth/routes.ts
import { Hono } from 'hono';
import { loginHandler, registerHandler } from './handlers';

const authRoutes = new Hono();

authRoutes.post('/login', loginHandler);
authRoutes.post('/register', registerHandler);

export { authRoutes };
