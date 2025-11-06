import { useEffect, useMemo, useState, useContext } from "react";
import { Routes, Route, Link, Navigate } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Login from "./Login";
import { AuthContext } from "./AuthContext";
import type { AppUser } from "./AuthContext";
import "./App.css";
import Signup from "./Signup";
import AdminUsers from "./AdminUsers";
import EditUser from "./EditUser";

function Home() {
  const { user } = useContext(AuthContext);
  return (
    <main className="home">
      <h1>Software Production Line</h1>
      <p>
        Gérez vos logiciels, vos versions et vos fichiers à partir d’une
        interface claire et centralisée.
      </p>

      <div className="home-actions">
        {!user && (
          <Link to="/login" className="btn primary">
            Se connecter
          </Link>
        )}
        <Link to="/builds" className="btn secondary">
          Voir les builds
        </Link>
      </div>

      <section className="features">
        <div className="feature-card">
          <h3>Gestion simplifiée</h3>
          <p>
            Créez, modifiez et suivez vos builds en quelques clics avec une
            interface fluide.
          </p>
        </div>
        <div className="feature-card">
          <h3>Suivi des versions</h3>
          <p>
            Gardez une trace claire de l’évolution de vos projets et téléchargez
            chaque version facilement.
          </p>
        </div>
        <div className="feature-card">
          <h3>Sécurité intégrée</h3>
          <p>
            Profitez d’un accès protégé grâce à l’authentification par jeton et
            la gestion des rôles.
          </p>
        </div>
      </section>
    </main>
  );
}

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

        {/* fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </AuthContext.Provider>
  );
}
