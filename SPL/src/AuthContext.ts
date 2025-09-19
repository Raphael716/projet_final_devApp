import { createContext } from "react";

export type AppUser = {
  id: number;
  email: string;
  username?: string;
  /** 0 ou 1 — toujours normalisé côté front */
  isAdmin?: number;
};

export type AuthContextType = {
  user: AppUser | null;
  token: string | null;
  login: (u: AppUser, t: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
});
