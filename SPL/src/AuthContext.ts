import { createContext } from "react";

export type AppUser = {
  id: number;
  username: string;
  email: string;
  isAdmin: boolean;
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
