// src/frontend/pages/LoginPage.tsx
import React from 'react';
import { LoginForm } from '../components/auth/LoginForm';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { CalendarDays } from 'lucide-react';

export default function LoginPage() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (isAuthenticated) {
    return <Navigate to="/appointments" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full">
        <div className="mb-8 text-center">
            <CalendarDays className="mx-auto h-16 w-16 text-primary mb-3" />
            <h1 className="text-4xl font-bold text-primary">SessionsTracker</h1>
            <p className="text-muted-foreground">Manage your appointments efficiently.</p>
        </div>
        <LoginForm />
    </div>
  );
}
