// src/frontend/App.tsx

import { AppRoutes } from "./frontend/router";

function App() {
	// El ThemeProvider ya está en main.tsx envolviendo a App
	return <AppRoutes />;
}

export default App;
