// src/frontend/hooks/useAuth.ts
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService"; // Para el logout

export const useAuth = () => {
	const { user, token, isAuthenticated, setAuth, clearAuth } = useAuthStore();

	// Podrías añadir funciones de conveniencia aquí si es necesario,
	// aunque authService ya las proporciona.
	const logout = () => {
		authService.logout(); // authService ya llama a clearAuth
	};

	return {
		user,
		token,
		isAuthenticated,
		setAuth, // Exponer por si acaso, aunque es mejor usar los servicios
		clearAuth: logout, // Renombrar a logout para claridad de acción
	};
};
