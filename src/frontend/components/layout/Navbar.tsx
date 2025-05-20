import { Link, useNavigate } from "react-router-dom";

import { authService } from "../../services/authService";
import { useAuthStore } from "../../store/authStore";
import { ThemeToggle } from "./ThemeToggle"; // Importa el ThemeToggle
import { LogOut, CalendarDays, UserCircle } from "lucide-react"; // Iconos
import { Button } from "../ui/button";

export default function Navbar() {
	const navigate = useNavigate();
	const { user, clearAuth } = useAuthStore((state) => ({
		user: state.user,
		clearAuth: state.clearAuth,
	}));

	const handleLogout = () => {
		authService.logout(); // Esto ya llama a clearAuth internamente
		navigate("/login");
	};

	return (
		<nav className="bg-card border-b border-border shadow-sm">
			<div className="container mx-auto px-4">
				<div className="flex justify-between items-center h-16">
					<Link
						to={user ? "/appointments" : "/login"}
						className="text-2xl font-bold text-primary flex items-center"
					>
						<CalendarDays className="mr-2 h-7 w-7" />
						SessionsTracker
					</Link>
					<div className="flex items-center space-x-4">
						{user && (
							<div className="flex items-center space-x-2 text-sm">
								<UserCircle className="h-5 w-5 text-muted-foreground" />
								<span className="text-foreground hidden md:inline">
									{user.name || user.email}
								</span>
							</div>
						)}
						<ThemeToggle />
						{user && (
							<Button variant="ghost" size="sm" onClick={handleLogout}>
								<LogOut className="mr-2 h-4 w-4" />
								Logout
							</Button>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
}
