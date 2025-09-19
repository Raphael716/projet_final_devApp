// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Header from "./Header";
import Login from "./Login";
import { AuthContext } from "./AuthContext";
import "./App.css";
import Signup from "./Signup";
import AdminUsers from "./EditUser";
import EditUser from "./EditUser";

type User = {
  id: number;
  email: string;
  username?: string;
  isAdmin?: number; // 0/1 côté front
} | null;

function Home() {
  return (
    <main className="container">
      <h1>Software Production Line</h1>
      <p>Base propre et rapide pour votre pipeline logiciel.</p>
      <Link to="/login" className="btn primary">
        Se connecter
      </Link>
    </main>
  );
}

export default function App() {
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("spl_token");
    const u = localStorage.getItem("spl_user");
    if (t) setToken(t);
    if (u) setUser(JSON.parse(u));
  }, []);

  const login = (u: User, t: string) => {
    setUser(u);
    setToken(t);
    localStorage.setItem("spl_token", t);
    localStorage.setItem("spl_user", JSON.stringify(u));
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
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/users/:id/edit" element={<EditUser />} />

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <footer className="footer">
        © {new Date().getFullYear()} Software Production Line
      </footer>
    </AuthContext.Provider>
  );
}
