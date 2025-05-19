
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { appointmentService } from "../../services/appointmentService";
import type { Appointment } from "@/shared/types";

import { Button } from "../ui/button";
// shadcn/ui textarea
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "../ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { toast } from "sonner";
import { format, parseISO } from "date-fns"; // Para formatear para input datetime-local
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

const appointmentSchema = z
	.object({
		title: z
			.string()
			.min(3, { message: "Title must be at least 3 characters." }),
		description: z.string().optional(),
		startTime: z
			.string()
			// biome-ignore lint/suspicious/noGlobalIsNan: <explanation>
			.refine((val) => !isNaN(Date.parse(val)), {
				message: "Invalid start date and time.",
			}),
		endTime: z
			.string()
			// biome-ignore lint/suspicious/noGlobalIsNan: <explanation>
			.refine((val) => !isNaN(Date.parse(val)), {
				message: "Invalid end date and time.",
			}),
	})
	.refine((data) => new Date(data.startTime) < new Date(data.endTime), {
		message: "End time must be after start time.",
		path: ["endTime"], // Asocia el error al campo endTime
	});

type AppointmentFormValues = z.infer<typeof appointmentSchema>;

interface AppointmentFormProps {
	onSuccess: () => void; // Para cerrar el formulario o refrescar
	existingAppointment?: Appointment | null;
}

export function AppointmentForm({
	onSuccess,
	existingAppointment,
}: AppointmentFormProps) {
	const [isLoading, setIsLoading] = useState(false);

	const form = useForm<AppointmentFormValues>({
		resolver: zodResolver(appointmentSchema),
		defaultValues: {
			title: existingAppointment?.title || "",
			description: existingAppointment?.description || "",
			// Formatear para datetime-local: YYYY-MM-DDTHH:mm
			startTime: existingAppointment
				? format(parseISO(existingAppointment.startTime), "yyyy-MM-dd'T'HH:mm")
				: "",
			endTime: existingAppointment
				? format(parseISO(existingAppointment.endTime), "yyyy-MM-dd'T'HH:mm")
				: "",
		},
	});

	useEffect(() => {
		if (existingAppointment) {
			form.reset({
				title: existingAppointment.title,
				description: existingAppointment.description || "",
				startTime: format(
					parseISO(existingAppointment.startTime),
					"yyyy-MM-dd'T'HH:mm",
				),
				endTime: format(
					parseISO(existingAppointment.endTime),
					"yyyy-MM-dd'T'HH:mm",
				),
			});
		} else {
			form.reset({
				// Valores por defecto para nuevo formulario
				title: "",
				description: "",
				startTime: format(new Date(), "yyyy-MM-dd'T'HH:00"), // Default a la próxima hora en punto
				endTime: format(new Date(Date.now() + 3600000), "yyyy-MM-dd'T'HH:00"), // Default a una hora después
			});
		}
	}, [existingAppointment, form]);

	const onSubmit = async (data: AppointmentFormValues) => {
		setIsLoading(true);
		try {
			// Asegúrate de que data tenga las propiedades obligatorias
			const { startTime, endTime, title, description } = data;
			const appointment = await appointmentService.createAppointment({
				startTime,
				endTime,
				title,
				description: description || "", // Asegúrate de que description no sea undefined
			});

			if (appointment) {
				toast.success("Appointment created successfully!");
				onSuccess(); // Llama a la función onSuccess para cerrar el formulario o refrescar
			} else {
				toast.error("Appointment creation failed. Please check your input.");
			}
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (err: any) {
			console.error(err);
			toast.error(err.message || "An unexpected error occurred.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-lg mx-auto my-4">
			<CardHeader>
				<CardTitle className="text-xl">
					{existingAppointment ? "Edit Appointment" : "New Appointment"}
				</CardTitle>
				<CardDescription>
					{existingAppointment
						? "Update the details of your appointment."
						: "Fill in the details for your new appointment."}
				</CardDescription>
			</CardHeader>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
							name="title"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Title</FormLabel>
									<FormControl>
										<Input
											placeholder="Team Meeting"
											{...field}
											disabled={isLoading}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Description (Optional)</FormLabel>
									<FormControl>
										<Textarea
											placeholder="Discuss project milestones..."
											{...field}
											disabled={isLoading}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="startTime"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Start Time</FormLabel>
										<FormControl>
											<Input
												type="datetime-local"
												{...field}
												disabled={isLoading}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="endTime"
								render={({ field }) => (
									<FormItem>
										<FormLabel>End Time</FormLabel>
										<FormControl>
											<Input
												type="datetime-local"
												{...field}
												disabled={isLoading}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
					</CardContent>
					<CardFooter className="flex justify-end space-x-2">
						<Button
							type="button"
							variant="outline"
							onClick={onSuccess}
							disabled={isLoading}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading}>
							{isLoading
								? existingAppointment
									? "Saving..."
									: "Creating..."
								: existingAppointment
									? "Save Changes"
									: "Create Appointment"}
						</Button>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}
