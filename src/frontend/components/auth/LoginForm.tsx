import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { authService } from "../../services/authService";

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
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "../ui/form";
import { toast } from "sonner"; // Para notificaciones
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const loginSchema = z.object({
	email: z.string().email({ message: "Invalid email address." }),
	password: z
		.string()
		.min(6, { message: "Password must be at least 6 characters." }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
	const navigate = useNavigate();
	const [isLoading, setIsLoading] = useState(false);
	// const [error, setError] = useState<string | null>(null); // Manejado por toast

	const form = useForm<LoginFormValues>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data: LoginFormValues) => {
		setIsLoading(true);
		// setError(null);

		// Validar los datos antes de pasarlos a la función de inicio de sesión
		const validationResult = loginSchema.safeParse(data);

		if (!validationResult.success) {
			// Manejar los errores de validación
			// biome-ignore lint/complexity/noForEach: <explanation>
			validationResult.error.errors.forEach((error) => {
				toast.error(error.message);
			});
			setIsLoading(false);
			return;
		}

		try {
			const { email, password } = validationResult.data;
			const user = await authService.login({ email, password });
			if (user) {
				toast.success(`Welcome back, ${user.name || user.email}!`);
				navigate("/appointments");
			} else {
				// setError('Login failed. Please check your credentials.');
				toast.error("Login failed. Please check your credentials.");
			}
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		} catch (err: any) {
			console.error(err);
			// setError(err.message || 'An unexpected error occurred.');
			toast.error(err.message || "An unexpected error occurred.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader>
				<CardTitle className="text-2xl">Login</CardTitle>
				<CardDescription>
					Enter your email below to login to your account.
				</CardDescription>
			</CardHeader>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<CardContent className="space-y-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											type="email"
											placeholder="m@example.com"
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
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="••••••••"
											{...field}
											disabled={isLoading}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</CardContent>
					<CardFooter className="flex flex-col">
						{/* {error && <p className="text-sm font-medium text-destructive mb-4">{error}</p>} */}
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? "Logging in..." : "Login"}
						</Button>
						<p className="mt-4 text-center text-sm text-muted-foreground">
							Don't have an account?{" "}
							<Button
								variant="link"
								type="button"
								onClick={() => navigate("/register")}
								className="p-0 h-auto"
							>
								Sign up
							</Button>
							{/* TODO: Implementar página de registro si se desea */}
						</p>
					</CardFooter>
				</form>
			</Form>
		</Card>
	);
}
