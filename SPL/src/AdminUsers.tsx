import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import "./AdminUsers.css";

type UserRow = {
  id: number;
  username: string;
  email: string;
  admin: number;
};

function AdminUsers() {
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Charger la liste des utilisateurs
  useEffect(() => {
    fetch("/api/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur API");
        return res.json();
      })
      .then((data) => setUsers(data))
      .catch(() => setError("Impossible de charger les utilisateurs"))
      .finally(() => setLoading(false));
  }, [token]);

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;

    await fetch(`/api/users/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setUsers((prev) => prev.filter((u) => u.id !== id));
  };

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <main className="admin-container">
      <h2>Gestion des utilisateurs</h2>
      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nom</th>
            <th>Email</th>
            <th>Admin</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.username}</td>
              <td>{u.email}</td>
              <td>{u.admin === 1 ? "Oui" : "Non"}</td>
              <td className="actions">
                <div className="btn-container">
                  <Link to={`/admin/users/${u.id}/edit`} className="btn-edit">
                    Modifier
                  </Link>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(u.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}

export default AdminUsers;
