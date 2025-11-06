import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import "./Header.css";

export default function Header() {
  const { user, token, logout } = useContext(AuthContext);
  const isAdmin = user?.isAdmin ?? false;

  return (
    <header className="header">
      <Link to="/" className="logo">
        Software Production Line
      </Link>

      <nav className="nav">
        {token ? (
          <>
            <Link to="/builds">Builds</Link>
            {isAdmin && <Link to="/admin/users">Utilisateurs</Link>}
            <span className="user-label">
              {user?.username ?? user?.email}
              {isAdmin && <span className="admin-badge">Admin</span>}
            </span>
            <button className="logout-btn" onClick={logout}>
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link to="/login">Connexion</Link>
            <Link to="/signup">Inscription</Link>
          </>
        )}
      </nav>
    </header>
  );
}
