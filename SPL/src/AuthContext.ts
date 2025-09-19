import { createContext } from "react";

export type User = { id: number; email: string; username?: string } | null;

export type AuthContextType = {
  user: User;
  token: string | null;
  login: (u: User, t: string) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
});
