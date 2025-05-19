// src/server/appointments/handlers.ts
import type { Context } from 'hono';
import type { Appointment, User } from '@/shared/types';
import { broadcastUpdate } from '../index'; // Importar desde el index del servidor
import { WebSocketMessageType } from '@/shared/types';

// Mock de base de datos de citas (reemplazar con una base de datos real)
let appointmentsDB: Appointment[] = [
    { id: 'appt1', userId: '1', title: 'Reunión de equipo', startTime: new Date(Date.now() + 3600000).toISOString(), endTime: new Date(Date.now() + 7200000).toISOString(), createdAt: new Date().toISOString() },
    { id: 'appt2', userId: '1', title: 'Revisión de proyecto', startTime: new Date(Date.now() + 86400000).toISOString(), endTime: new Date(Date.now() + 86400000 + 3600000).toISOString(), createdAt: new Date().toISOString() },
];

export const getAppointmentsHandler = async (c: Context): Promise<Response> => {
  const user = c.get('user') as User; // Del authMiddleware
  // Filtrar citas por el usuario autenticado (o mostrar todas si es un admin, etc.)
  const userAppointments = appointmentsDB.filter(appt => appt.userId === user.id);
  return c.json(userAppointments);
};

export const getAppointmentByIdHandler = async (c: Context): Promise<Response> => {
    const user = c.get('user') as User;
    const appointmentId = c.req.param('id');
    const appointment = appointmentsDB.find(appt => appt.id === appointmentId && appt.userId === user.id);

    if (!appointment) {
        return c.json({ error: 'Appointment not found or access denied' }, 404);
    }
    return c.json(appointment);
};

export const createAppointmentHandler = async (c: Context): Promise<Response> => {
  try {
    const user = c.get('user') as User;
    const { title, description, startTime, endTime } = await c.req.json<Omit<Appointment, 'id' | 'userId' | 'createdAt'>>();

    if (!title || !startTime || !endTime) {
      return c.json({ error: 'Title, startTime, and endTime are required' }, 400);
    }

    // Validación simple de fechas (mejorar con una librería si es necesario)
    if (new Date(startTime) >= new Date(endTime)) {
        return c.json({ error: 'End time must be after start time' }, 400);
    }

    const newAppointment: Appointment = {
      id: `appt${Date.now()}${Math.random().toString(16).slice(2)}`, // ID único simple
      userId: user.id,
      title,
      description,
      startTime,
      endTime,
      createdAt: new Date().toISOString(),
    };

    appointmentsDB.push(newAppointment);

    // Notificar a los clientes vía WebSocket
    broadcastUpdate({
      type: WebSocketMessageType.APPOINTMENT_CREATED,
      payload: newAppointment,
    });

    return c.json(newAppointment, 201);
  } catch (error) {
    console.error("Create appointment error:", error);
    return c.json({ error: 'Failed to create appointment' }, 500);
  }
};

export const updateAppointmentHandler = async (c: Context): Promise<Response> => {
    try {
        const user = c.get('user') as User;
        const appointmentId = c.req.param('id');
        const updates = await c.req.json<Partial<Omit<Appointment, 'id' | 'userId' | 'createdAt'>>>();

        const appointmentIndex = appointmentsDB.findIndex(appt => appt.id === appointmentId && appt.userId === user.id);

        if (appointmentIndex === -1) {
        return c.json({ error: 'Appointment not found or access denied' }, 404);
        }

        // Validación de fechas si se actualizan
        const currentStartTime = appointmentsDB[appointmentIndex].startTime;
        const currentEndTime = appointmentsDB[appointmentIndex].endTime;
        const newStartTime = updates.startTime || currentStartTime;
        const newEndTime = updates.endTime || currentEndTime;

        if (new Date(newStartTime) >= new Date(newEndTime)) {
            return c.json({ error: 'End time must be after start time' }, 400);
        }


        appointmentsDB[appointmentIndex] = {
        ...appointmentsDB[appointmentIndex],
        ...updates,
        startTime: newStartTime, // Asegurar que se usan las fechas validadas/actuales
        endTime: newEndTime,
        };

        const updatedAppointment = appointmentsDB[appointmentIndex];

        broadcastUpdate({
        type: WebSocketMessageType.APPOINTMENT_UPDATED,
        payload: updatedAppointment,
        });

        return c.json(updatedAppointment);
    } catch (error) {
        console.error("Update appointment error:", error);
        return c.json({ error: 'Failed to update appointment' }, 500);
    }
};

export const deleteAppointmentHandler = async (c: Context): Promise<Response> => {
    try {
        const user = c.get('user') as User;
        const appointmentId = c.req.param('id');

        const initialLength = appointmentsDB.length;
        appointmentsDB = appointmentsDB.filter(appt => !(appt.id === appointmentId && appt.userId === user.id));

        if (appointmentsDB.length === initialLength) {
        return c.json({ error: 'Appointment not found or access denied' }, 404);
        }

        broadcastUpdate({
        type: WebSocketMessageType.APPOINTMENT_DELETED,
        payload: { id: appointmentId, userId: user.id }, // Enviar userId puede ser útil para el cliente
        });

        return c.json({ message: 'Appointment deleted successfully' }, 200); // o 204 No Content
    } catch (error) {
        console.error("Delete appointment error:", error);
        return c.json({ error: 'Failed to delete appointment' }, 500);
    }
};
