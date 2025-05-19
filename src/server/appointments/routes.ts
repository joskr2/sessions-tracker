// src/server/appointments/routes.ts
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/authMiddleware';
import {
  getAppointmentsHandler,
  getAppointmentByIdHandler,
  createAppointmentHandler,
  updateAppointmentHandler,
  deleteAppointmentHandler,
} from './handlers';

const appointmentRoutes = new Hono();

// Aplicar middleware de autenticación a todas las rutas de citas
appointmentRoutes.use('*', authMiddleware);

appointmentRoutes.get('/', getAppointmentsHandler);
appointmentRoutes.post('/', createAppointmentHandler);
appointmentRoutes.get('/:id', getAppointmentByIdHandler);
appointmentRoutes.put('/:id', updateAppointmentHandler);
appointmentRoutes.delete('/:id', deleteAppointmentHandler);

export { appointmentRoutes };
