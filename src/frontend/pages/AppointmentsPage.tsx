// src/frontend/pages/AppointmentsPage.tsx
import React, { useEffect, useState, useCallback } from "react";

import { appointmentService } from "../services/appointmentService";
import { authService } from "../services/authService"; // Para obtener el token para WS
import { AppointmentList } from "../components/appointments/AppointmentList";
import { AppointmentForm } from "../components/appointments/AppointmentForm";

import { toast } from "sonner";
import type { Appointment, WebSocketMessage } from "@/shared/types";
import { WebSocketMessageType } from "@/shared/types";
import { PlusCircle, RefreshCw, WifiOff } from "lucide-react"; // Iconos
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
	DialogFooter, // Para el modal de confirmación de borrado
	DialogClose,
} from "@/frontend/components/ui/dialog"; // Para el modal del formulario y confirmación
import { Button } from "../components/ui/button";
import { useAppointmentStore } from "../store/appointmentService";

// Construir la URL del WebSocket dinámicamente
const WS_PROTOCOL = window.location.protocol === "https:" ? "wss:" : "ws:";
const WS_URL = `${WS_PROTOCOL}//${window.location.host}/ws`;

export default function AppointmentsPage() {
	const {
		appointments,
		isLoading: storeIsLoading, // Renombrar para evitar conflicto con loading local
		error: storeError,
		setAppointments,
		addAppointment,
		updateAppointmentState,
		removeAppointmentState,
		setLoading: setStoreLoading, // Renombrar
		setError: setStoreError, // Renombrar
	} = useAppointmentStore();

	const [showFormModal, setShowFormModal] = useState(false);
	const [editingAppointment, setEditingAppointment] =
		useState<Appointment | null>(null);
	const [socket, setSocket] = useState<WebSocket | null>(null);
	const [isWsConnected, setIsWsConnected] = useState(false);
	const [wsError, setWsError] = useState<string | null>(null);
	const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(
		null,
	);

	const fetchAppointments = useCallback(async () => {
		setStoreLoading(true);
		try {
			await appointmentService.getAppointments(); // El servicio actualiza el store
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (err: any) {
			toast.error(err.message || "Failed to fetch appointments");
			// El servicio ya pone el error en el store
		} finally {
			setStoreLoading(false);
		}
	}, [setStoreLoading]);

	useEffect(() => {
		fetchAppointments();
	}, [fetchAppointments]);

	useEffect(() => {
		const ws = new WebSocket(WS_URL);
		setSocket(ws);

		ws.onopen = () => {
			console.log("WebSocket connected");
			setIsWsConnected(true);
			setWsError(null);
			toast.success("Real-time connection established!");
			// Enviar token para autenticar la sesión WebSocket
			const token = authService.getToken();
			if (token) {
				ws.send(
					JSON.stringify({
						type: "AUTH_WEBSOCKET",
						payload: token,
					} as WebSocketMessage),
				);
			}
		};

		ws.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data as string) as WebSocketMessage;
				console.log("WebSocket message received:", message);

				switch (message.type) {
					case WebSocketMessageType.APPOINTMENT_CREATED:
						toast.info(
							`New appointment added: "${(message.payload as Appointment).title}"`,
						);
						addAppointment(message.payload as Appointment);
						break;
					case WebSocketMessageType.APPOINTMENT_UPDATED:
						toast.info(
							`Appointment updated: "${(message.payload as Appointment).title}"`,
						);
						updateAppointmentState(message.payload as Appointment);
						break;
					case WebSocketMessageType.APPOINTMENT_DELETED: {
						const deletedPayload = message.payload as {
							id: string;
							userId?: string;
						};
						// Solo actualiza si el usuario actual es el afectado (o si es una actualización global)
						// El backend ya debería filtrar esto, pero una doble comprobación no hace daño
						// o si el store solo contiene citas del usuario actual.
						toast.warning("An appointment was deleted.");
						removeAppointmentState(deletedPayload.id);
						break;
					}
					case WebSocketMessageType.CONNECTION_ESTABLISHED:
						// console.log("Server confirmed WebSocket connection:", message.socketId);
						break;
					case WebSocketMessageType.ERROR:
						console.error("WebSocket server error:", message.error);
						toast.error(`Real-time error: ${message.error}`);
						setWsError(message.error || "Unknown WebSocket error");
						break;
					default:
						console.log("Unhandled WebSocket message type:", message.type);
				}
			} catch (e) {
				console.error("Error processing WebSocket message:", e);
				toast.error("Error processing real-time update.");
			}
		};

		ws.onclose = (event) => {
			console.log("WebSocket disconnected:", event.reason, event.code);
			setIsWsConnected(false);
			if (!event.wasClean) {
				// si no fue un cierre limpio
				const errorMsg = `Real-time connection lost. Code: ${event.code}. Reason: ${event.reason || "N/A"}`;
				setWsError(errorMsg);
				toast.error(`${errorMsg} Manual refresh may be needed.`);
			} else {
				toast.info("Real-time connection closed.");
			}
		};

		ws.onerror = (errEvent) => {
			console.error("WebSocket error event:", errEvent);
			setIsWsConnected(false);
			const errorMsg =
				"WebSocket connection error. Real-time updates are unavailable.";
			setWsError(errorMsg);
			toast.error(errorMsg);
		};

		return () => {
			console.log("Cleaning up WebSocket connection");
			ws.close(1000, "Component unmounting"); // Cierre limpio
		};
	}, [addAppointment, updateAppointmentState, removeAppointmentState]); // Dependencias para los actualizadores del store

	const handleEdit = (appointment: Appointment) => {
		setEditingAppointment(appointment);
		setShowFormModal(true);
	};

	const handleDeleteRequest = (appointmentId: string) => {
		setAppointmentToDelete(appointmentId); // Abre el modal de confirmación
	};

	const confirmDelete = async () => {
		if (!appointmentToDelete) return;
		try {
			await appointmentService.deleteAppointment(appointmentToDelete);
			toast.success("Appointment deleted successfully!");
			// La actualización del store debería venir por WebSocket.
			// Si no, puedes llamar a removeAppointmentState aquí.
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
								} catch (err: any) {
			toast.error(err.message || "Failed to delete appointment.");
		} finally {
			setAppointmentToDelete(null); // Cierra el modal
		}
	};

	const handleFormSuccess = () => {
		setShowFormModal(false);
		setEditingAppointment(null);
		// Opcional: refrescar la lista si no se confía 100% en WS para el creador/editor
		// fetchAppointments();
	};

	if (storeIsLoading && appointments.length === 0) {
		return (
			<div className="text-center p-8">
				<RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />{" "}
				<p className="mt-2">Loading appointments...</p>
			</div>
		);
	}

	return (
		<div>
			<div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
				<h1 className="text-3xl font-bold">My Appointments</h1>
				<div className="flex items-center gap-2">
					{!isWsConnected && (
						<Button
							onClick={fetchAppointments}
							variant="outline"
							size="sm"
							title="WebSocket disconnected. Click to refresh manually."
						>
							<WifiOff className="mr-2 h-4 w-4 text-destructive" /> Manual
							Refresh
						</Button>
					)}
					<Dialog
						open={showFormModal}
						onOpenChange={(isOpen) => {
							setShowFormModal(isOpen);
							if (!isOpen) setEditingAppointment(null); // Limpiar al cerrar
						}}
					>
						<DialogTrigger asChild>
							<Button
								size="sm"
								onClick={() => {
									setEditingAppointment(null);
									setShowFormModal(true);
								}}
							>
								<PlusCircle className="mr-2 h-5 w-5" /> New Appointment
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-[600px]">
							<AppointmentForm
								onSuccess={handleFormSuccess}
								existingAppointment={editingAppointment}
							/>
						</DialogContent>
					</Dialog>
				</div>
			</div>

			{storeError && (
				<p className="text-destructive mb-4 bg-destructive/10 p-3 rounded-md">
					{storeError}
				</p>
			)}
			{wsError && !isWsConnected && (
				<p className="text-amber-600 mb-4 bg-amber-500/10 p-3 rounded-md">
					{wsError}
				</p>
			)}

			<AppointmentList
				appointments={appointments}
				onEdit={handleEdit}
				onDelete={handleDeleteRequest}
			/>

			{/* Modal de Confirmación de Borrado */}
			<Dialog
				open={!!appointmentToDelete}
				onOpenChange={(isOpen) => !isOpen && setAppointmentToDelete(null)}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Confirm Deletion</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this appointment? This action
							cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-4">
						<DialogClose asChild>
							<Button
								variant="outline"
								onClick={() => setAppointmentToDelete(null)}
							>
								Cancel
							</Button>
						</DialogClose>
						<Button variant="destructive" onClick={confirmDelete}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
