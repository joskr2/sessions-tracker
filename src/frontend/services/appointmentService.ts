
// src/frontend/services/appointmentService.ts
import { apiClient } from '../lib/apiClient';

import type { Appointment } from '@/shared/types';
import { useAppointmentStore } from '../store/appointmentService';

export const appointmentService = {
  getAppointments: async (): Promise<Appointment[]> => {
    const { setLoading, setAppointments, setError } = useAppointmentStore.getState();
    setLoading(true);
    try {
      const appointments = await apiClient.get<Appointment[]>('/appointments');
      setAppointments(appointments || []); // Asegurar que es un array
      return appointments || [];
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
      console.error('Failed to fetch appointments:', error);
      setError(error.message || 'Failed to fetch appointments');
      return []; // Devuelve un array vacío en caso de error para evitar que el UI rompa
    }
  },

  createAppointment: async (
    appointmentData: Omit<Appointment, 'id' | 'userId' | 'createdAt'>
  ): Promise<Appointment | null> => {
    const { addAppointment, setError } = useAppointmentStore.getState();
    try {
      const newAppointment = await apiClient.post<Appointment>('/appointments', appointmentData);
      // El store se actualizará a través del WebSocket, pero podemos añadirlo aquí
      // por optimismo o si el WS falla. El backend es la fuente de verdad.
      // Si el WS funciona bien, esta línea podría ser redundante o causar duplicados si no se maneja con cuidado.
      // Por ahora, confiaremos en el WS para la actualización del store.
      // addAppointment(newAppointment);
      return newAppointment;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
      console.error('Failed to create appointment:', error);
      // No actualizamos el store de error globalmente aquí, el componente puede manejarlo
      throw error;
    }
  },

  updateAppointment: async (
    id: string,
    appointmentData: Partial<Omit<Appointment, 'id' | 'userId' | 'createdAt'>>
  ): Promise<Appointment | null> => {
    try {
      const updatedAppointment = await apiClient.put<Appointment>(`/appointments/${id}`, appointmentData);
      // Similar al create, confiar en WS para la actualización del store.
      // useAppointmentStore.getState().updateAppointmentState(updatedAppointment);
      return updatedAppointment;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: any) {
      console.error('Failed to update appointment:', error);
      throw error;
    }
  },

  deleteAppointment: async (id: string): Promise<void> => {
    try {
      await apiClient.delete<void>(`/appointments/${id}`);
      // Similar al create, confiar en WS para la actualización del store.
      // useAppointmentStore.getState().removeAppointmentState(id);
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                } catch (error: any) {
      console.error('Failed to delete appointment:', error);
      throw error;
    }
  },
};
