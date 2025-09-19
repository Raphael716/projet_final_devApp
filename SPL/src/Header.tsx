import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "./AuthContext";

export default function Header() {
  const { user, token, logout } = useContext(AuthContext);

  return (
    <header className="header">
      <Link to="/" className="logo">
        Software Production Line
      </Link>

      {!token ? (
        <nav className="nav-links">
          <Link to="/login">Connexion</Link>
          <Link to="/signup">S’inscrire</Link>
        </nav>
      ) : (
        <div className="user-zone">
          <span>{user?.username}</span>
          <button onClick={logout}>Déconnexion</button>
        </div>
      )}
    </header>
  );
}
