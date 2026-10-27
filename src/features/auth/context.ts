import { createContext, useContext } from 'react';
import type { AuthController } from './controller';
export const AuthContext = createContext<AuthController | null>(null);
export function useAuthController() {
  const controller = useContext(AuthContext);
  if (!controller) throw new Error('AuthProvider is required');
  return controller;
}
