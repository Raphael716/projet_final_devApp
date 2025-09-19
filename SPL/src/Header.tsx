import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import "./Header.css";
export default function Header() {
  const { user, token, logout } = useContext(AuthContext);
  const isAdmin = (user?.isAdmin ?? 0) === 1;

  return (
    <header className="header">
      <nav className="nav">
        <Link to="/" className="logo">
          Software Production Line
        </Link>

        <div className="spacer" />

        <div className="nav">
          {token ? (
            <>
              {isAdmin && (
                <Link to="/admin/users" className="btn-link">
                  Gérer utilisateurs
                </Link>
              )}
              <span className="user-label">
                {user?.username ?? user?.email}
              </span>
              <button onClick={logout}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/login">Connexion</Link>
              <Link to="/signup">S'inscrire</Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
