// src/frontend/components/appointments/AppointmentList.tsx
import React from "react";
import type { Appointment } from "@/shared/types";
import { AppointmentItem } from "./AppointmentItem";

interface AppointmentListProps {
	appointments: Appointment[];
	onEdit: (appointment: Appointment) => void;
	onDelete: (appointmentId: string) => void;
}

export function AppointmentList({
	appointments,
	onEdit,
	onDelete,
}: AppointmentListProps) {
	if (appointments.length === 0) {
		return (
			<p className="text-center text-muted-foreground mt-8">
				No appointments scheduled yet.
			</p>
		);
	}

	// Ordenar citas por fecha de inicio (más recientes primero o más próximas primero)
	const sortedAppointments = [...appointments].sort(
		(a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
	);

	return (
		<div className="space-y-4">
			{sortedAppointments.map((appointment) => (
				<AppointmentItem
					key={appointment.id}
					appointment={appointment}
					onEdit={onEdit}
					onDelete={onDelete}
				/>
			))}
		</div>
	);
}
