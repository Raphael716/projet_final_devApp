import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import "./EditUser.css";
import { Link } from "react-router-dom";

function EditUser() {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [admin, setAdmin] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/users/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setUsername(data.username ?? "");
        setEmail(data.email ?? "");
        setAdmin(data.admin ?? 0);
      });
  }, [id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setLoading(true);
    await fetch(`/api/users/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ username, email, admin }),
    });
    setLoading(false);
    navigate("/admin/users");
  };

return (
  <main className="admin-container">
    <div className="edit-card">
      <h2>Modifier utilisateur</h2>
      <form onSubmit={handleSubmit} className="edit-form">
        <label>
          Nom
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Admin ?
          <select
            value={admin}
            onChange={(e) => setAdmin(Number(e.target.value))}
          >
            <option value={0}>Non</option>
            <option value={1}>Oui</option>
          </select>
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
      <br/>
      <Link to="/admin/users" className="btn primary">Retour</Link>
    </div>
  </main>
);
}

export default EditUser;