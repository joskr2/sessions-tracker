// src/frontend/router/index.tsx
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import AppointmentsPage from "../pages/AppointmentsPage";
import { useAuthStore } from "../store/authStore";
import Navbar from "../components/layout/Navbar"; // Importa Navbar

const ProtectedLayout = () => {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	if (!isAuthenticated) {
		return <Navigate to="/login" replace />;
	}

	return (
		<>
			<Navbar />
			<main className="container mx-auto p-4 mt-4 md:mt-6">
				<Outlet /> {/* Child routes will render here */}
			</main>
		
		</>
	);
};

const PublicLayout = () => {
	// Podrías tener un Navbar diferente para rutas públicas si quisieras
	// <PublicNavbar />
	return (
		<>
			{/* No hay Navbar por defecto en el layout público, LoginPage puede tener su propio header si es necesario */}
			<main className="container mx-auto p-4 flex justify-center items-center min-h-screen">
				<Outlet />
			</main>
	
		</>
	);
};

export const AppRoutes = () => {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	return (
		<Routes>
			<Route element={<PublicLayout />}>
				<Route path="/login" element={<LoginPage />} />
			</Route>

			<Route element={<ProtectedLayout />}>
				<Route path="/appointments" element={<AppointmentsPage />} />
				{/* Otras rutas protegidas aquí */}
			</Route>

			{/* Redirección por defecto */}
			<Route
				path="*"
				element={
					<Navigate to={isAuthenticated ? "/appointments" : "/login"} replace />
				}
			/>
		</Routes>
	);
};
