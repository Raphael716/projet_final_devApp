// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Header from "./Header";
import Login from "./Login";
import { AuthContext } from "./AuthContext";
import type { AppUser } from "./AuthContext";
import "./App.css";
import Signup from "./Signup";
import AdminUsers from "./AdminUsers";
import EditUser from "./EditUser";
import Builds from "./Builds";
import BuildDetail from "./BuildDetail";
import NewBuild from "./NewBuild";
import EditBuild from "./EditBuild";
import AddVersion from "./AddVersion";

function Home() {
  return (
    <main className="container">
      <h1>Software Production Line</h1>
      <p>Base propre et rapide pour votre pipeline logiciel.</p>
      <div style={{ display: "flex", gap: 16 }}>
        <Link to="/login" className="btn primary">
          Se connecter
        </Link>
        <Link to="/builds" className="btn">
          Voir les logiciels
        </Link>
      </div>
    </main>
  );
}

// ✅ Mapper toujours vers AppUser avec isAdmin:boolean
function toAppUser(u: any): AppUser {
  return {
    id: Number(u.id ?? 0),
    username: u.username ?? "",
    email: u.email ?? "",
    isAdmin: Number(u.isAdmin ?? u.admin ?? 0) === 1,
  };
}

export default function App() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("spl_token");
    const u = localStorage.getItem("spl_user");
    if (t) setToken(t);
    if (u) setUser(toAppUser(JSON.parse(u)));
  }, []);

  const login = (u: any, t: string) => {
    const appUser = toAppUser(u);
    setUser(appUser);
    setToken(t);
    localStorage.setItem("spl_token", t);
    localStorage.setItem("spl_user", JSON.stringify(appUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("spl_token");
    localStorage.removeItem("spl_user");
  };

  const value = useMemo(() => ({ user, token, login, logout }), [user, token]);

  return (
    <AuthContext.Provider value={value}>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Auth */}
        <Route
          path="/login"
          element={!token ? <Login /> : <Navigate to="/" replace />}
        />
        <Route
          path="/signup"
          element={!token ? <Signup /> : <Navigate to="/" replace />}
        />

        {/* Admin */}
        <Route
          path="/admin/users"
          element={user?.isAdmin ? <AdminUsers /> : <Navigate to="/" replace />}
        />
        <Route
          path="/admin/users/:id/edit"
          element={user?.isAdmin ? <EditUser /> : <Navigate to="/" replace />}
        />

        {/* Builds */}
        <Route path="/builds" element={<Builds />} />
        <Route path="/builds/new" element={<NewBuild />} />
        <Route
          path="/builds/:id/edit"
          element={user?.isAdmin ? <EditBuild /> : <Navigate to="/" replace />}
        />
        <Route
          path="/builds/:id/add-version"
          element={user?.isAdmin ? <AddVersion /> : <Navigate to="/" replace />}
        />
        <Route path="/builds/:id" element={<BuildDetail />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="footer">
        © {new Date().getFullYear()} Software Production Line
      </footer>
    </AuthContext.Provider>
  );
}
