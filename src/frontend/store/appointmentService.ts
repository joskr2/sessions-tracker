// src/frontend/store/appointmentStore.ts
import { create } from 'zustand';
import type { Appointment } from '@/shared/types';

interface AppointmentState {
  appointments: Appointment[];
  isLoading: boolean;
  error: string | null;
  setAppointments: (appointments: Appointment[]) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointmentState: (updatedAppointment: Appointment) => void;
  removeAppointmentState: (appointmentId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAppointments: () => void; // Para el logout
}

export const useAppointmentStore = create<AppointmentState>()((set, get) => ({
  appointments: [],
  isLoading: false,
  error: null,
  setAppointments: (appointments) => set({ appointments, isLoading: false, error: null }),
  addAppointment: (appointment) =>
    set((state) => ({ appointments: [...state.appointments, appointment] })),
  updateAppointmentState: (updatedAppointment) =>
    set((state) => ({
      appointments: state.appointments.map((appt) =>
        appt.id === updatedAppointment.id ? updatedAppointment : appt
      ),
    })),
  removeAppointmentState: (appointmentId) =>
    set((state) => ({
      appointments: state.appointments.filter((appt) => appt.id !== appointmentId),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error, isLoading: false }),
  clearAppointments: () => set({ appointments: [], isLoading: false, error: null }),
}));
