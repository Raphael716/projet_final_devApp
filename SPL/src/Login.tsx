import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import "./Auth.css";
import "./Login.css";
import AuthFooter from "./AuthFooter";

export default function Login() {
  const nav = useNavigate();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data?.error ?? "Identifiants invalides");
        setLoading(false);
        return;
      }

      login(
        {
          id: data.user.id,
          email: data.user.email,
          username: data.user.username,
          isAdmin: Number(data.user.isAdmin ?? data.user.admin ?? 0) === 1,
        },
        data.token
      );
      nav("/", { replace: true });
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-container">
      <div className="auth-card">
        <h2>Connexion</h2>

        <form onSubmit={submit} className="auth-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </label>

          <label>
            <span>Mot de passe</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </label>

          <AuthFooter
            error={error}
            loading={loading}
            buttonText="Se connecter"
            loadingText="Connexion..."
            alt={
              <>
                Pas encore de compte ? <Link to="/signup">S'inscrire</Link>
              </>
            }
          />
        </form>
      </div>
    </main>
  );
}
