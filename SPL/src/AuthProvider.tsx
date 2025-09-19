import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AppUser, AuthContextType } from "./AuthContext";

function toNumber(v: unknown, fallback = 0): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function toString(v: unknown, fb = ""): string {
  return typeof v === "string" ? v : String(v ?? fb);
}

/** Accepte un user qui peut contenir `admin` (DB) ou `isAdmin`, et normalise vers `isAdmin` */
function toAppUser(u: unknown): AppUser {
  const o =
    typeof u === "object" && u !== null ? (u as Record<string, unknown>) : {};

  const id = Number(o.id ?? 0);
  const username = String(o.username ?? "");
  const email = String(o.email ?? "");
  const isAdmin = Number(o.admin ?? 0) === 1;

  return { id, username, email, isAdmin };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const ru = localStorage.getItem("auth_user");
      const rt = localStorage.getItem("auth_token");
      if (ru && rt) {
        setUser(toAppUser(JSON.parse(ru)));
        setToken(rt);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      token,
      login: (u, t) => {
        const safe = toAppUser(u);
        setUser(safe);
        setToken(t);
        localStorage.setItem("auth_user", JSON.stringify(safe));
        localStorage.setItem("auth_token", t);
      },
      logout: () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_token");
      },
    }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
