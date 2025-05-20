// src/frontend/components/appointments/AppointmentItem.tsx
import React from "react";
import type { Appointment } from "@/shared/types";

import { Trash2, Edit3, Clock, CalendarIcon } from "lucide-react"; // Iconos
import { format, parseISO, differenceInMinutes } from "date-fns"; // Para formatear fechas
import { Button } from "../ui/button";
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
	CardFooter,
} from "../ui/card";
import { Badge } from "../ui/badge";

interface AppointmentItemProps {
	appointment: Appointment;
	onEdit: (appointment: Appointment) => void;
	onDelete: (appointmentId: string) => void;
}

export function AppointmentItem({
	appointment,
	onEdit,
	onDelete,
}: AppointmentItemProps) {
	const startTime = parseISO(appointment.startTime);
	const endTime = parseISO(appointment.endTime);

	const duration = differenceInMinutes(endTime, startTime);
	const durationText =
		duration > 60 ? `${(duration / 60).toFixed(1)} hrs` : `${duration} min`;

	// Determinar si la cita ya pasó
	const hasPassed = new Date() > endTime;
	// Determinar si la cita está en curso
	const isInProgress = new Date() >= startTime && new Date() <= endTime;

	const getStatusBadge = () => {
		if (hasPassed) return <Badge variant="outline">Completed</Badge>;
		if (isInProgress)
			return (
				<Badge variant="secondary" className="bg-green-500 text-white">
					In Progress
				</Badge>
			);
		return <Badge variant="default">Upcoming</Badge>; // O 'Scheduled'
	};

	return (
		<Card
			className={`transition-opacity ${hasPassed ? "opacity-70" : "opacity-100"}`}
		>
			<CardHeader>
				<div className="flex justify-between items-start">
					<CardTitle className="text-lg">{appointment.title}</CardTitle>
					{getStatusBadge()}
				</div>
				<CardDescription className="flex items-center text-sm text-muted-foreground pt-1">
					<CalendarIcon className="mr-2 h-4 w-4" />
					{format(startTime, "EEE, MMM d, yyyy")}
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-2">
				{appointment.description && (
					<p className="text-sm text-muted-foreground">
						{appointment.description}
					</p>
				)}
				<div className="flex items-center text-sm">
					<Clock className="mr-2 h-4 w-4 text-muted-foreground" />
					<span>
						{format(startTime, "p")} - {format(endTime, "p")} ({durationText})
					</span>
				</div>
			</CardContent>
			<CardFooter className="flex justify-end space-x-2">
				{!hasPassed && (
					<Button
						variant="outline"
						size="sm"
						onClick={() => onEdit(appointment)}
						disabled={isInProgress}
					>
						<Edit3 className="mr-1 h-4 w-4" /> Edit
					</Button>
				)}
				<Button
					variant="destructive"
					size="sm"
					onClick={() => onDelete(appointment.id)}
				>
					<Trash2 className="mr-1 h-4 w-4" /> Delete
				</Button>
			</CardFooter>
		</Card>
	);
}
