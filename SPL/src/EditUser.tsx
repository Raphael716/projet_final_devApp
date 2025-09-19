// src/EditUser.tsx
import { useContext, useEffect, useMemo, useState } from "react";
import { AuthContext } from "./AuthContext";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";

type BackendUser = {
  id: number;
  username: string;
  email: string;
  admin?: number; // 0 ou 1, côté API/DB
};

export default function EditUser() {
  const { token, user: me } = useContext(AuthContext);
  const isAdmin = useMemo(() => (me?.isAdmin ?? 0) === 1, [me]);

  const { id } = useParams(); // si présent => mode édition
  const nav = useNavigate();

  // états liste
  const [users, setUsers] = useState<BackendUser[]>([]);
  // états édition
  const [form, setForm] = useState<{
    username: string;
    email: string;
    admin: number;
  }>({
    username: "",
    email: "",
    admin: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // ⚠️ Hooks toujours appelés avant tout return. On “protège” via le rendu plus bas.
  useEffect(() => {
    if (!token || !isAdmin) {
      // pas d'appel si non autorisé, mais le hook est bien appelé
      setLoading(false);
      return;
    }

    let ignore = false;

    const load = async () => {
      setError("");
      setLoading(true);

      try {
        if (id) {
          // mode édition : charger un utilisateur
          const res = await fetch(`/api/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            setError("Impossible de charger l'utilisateur");
            setLoading(false);
            return;
          }
          const u = (await res.json()) as BackendUser;
          if (ignore) return;
          setForm({
            username: u.username,
            email: u.email,
            admin: u.admin ?? 0,
          });
        } else {
          // mode liste : charger tous les utilisateurs
          const res = await fetch(`/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            setError("Impossible de charger les utilisateurs");
            setLoading(false);
            return;
          }
          const data = (await res.json()) as BackendUser[];
          if (ignore) return;
          setUsers(data);
        }
      } catch {
        setError("Erreur réseau");
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [id, token, isAdmin]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "admin" ? Number(value) : value,
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // IMPORTANT: on envoie "admin" (pas isAdmin) au backend
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        setError("Impossible de modifier l'utilisateur");
        setSaving(false);
        return;
      }

      // retour à la liste
      nav("/admin/users", { replace: true });
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  };

  // ====== Rendu protégé (après hooks) ======
  if (!token) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  // Vue liste
  if (!id) {
    return (
      <main className="admin-users">
        <div className="admin-users__header">
          <h2>Administration — Utilisateurs</h2>
        </div>

        {loading ? (
          <div className="loading">Chargement…</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : (
          <ul className="user-list">
            {users.map((u) => (
              <li key={u.id} className="user-list-item">
                <div className="user-main">
                  <span className="u-name">{u.username}</span>
                  <span className="u-email">{u.email}</span>
                </div>
                <div className="user-actions">
                  <span className="u-role">
                    {(u.admin ?? 0) === 1 ? "Admin" : "Utilisateur"}
                  </span>
                  <Link to={`/admin/users/${u.id}/edit`}>Éditer</Link>
                </div>
              </li>
            ))}
            {users.length === 0 && <li>Aucun utilisateur.</li>}
          </ul>
        )}
      </main>
    );
  }

  // Vue édition
  return (
    <main className="edit-user">
      <div className="edit-user__header">
        <h2>Éditer l’utilisateur</h2>
        <Link className="btn-link" to="/admin/users">
          ← Retour
        </Link>
      </div>

      {loading ? (
        <div className="loading">Chargement…</div>
      ) : (
        <form onSubmit={onSubmit} className="edit-user__form">
          {error && <div className="error">{error}</div>}

          <label>
            <span>Nom d’utilisateur</span>
            <input
              name="username"
              value={form.username}
              onChange={onChange}
              required
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={onChange}
              required
            />
          </label>

          <label>
            <span>Rôle</span>
            <select name="admin" value={form.admin} onChange={onChange}>
              <option value={0}>Utilisateur</option>
              <option value={1}>Admin</option>
            </select>
          </label>

          <div className="edit-user__actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => nav("/admin/users")}
            >
              Annuler
            </button>
            <button type="submit" disabled={saving}>
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
