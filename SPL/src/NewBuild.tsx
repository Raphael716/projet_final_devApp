import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./NewBuild.css";
import { AuthContext } from "./AuthContext";

export default function NewBuild() {
  const [form, setForm] = useState({
    nom: "",
    description: "",
    version: "",
    statut: "",
    proprietaire: "",
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Create build then upload files (if any)
    setError(null);
    fetch("/api/builds", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        nom: form.nom,
        description: form.description,
        version: form.version,
        statut: form.statut,
        proprietaire: form.proprietaire,
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Erreur création");
        return r.json();
      })
      .then(async (created) => {
        const id = created.id;
        if (files && files.length) {
          if (!user?.isAdmin) {
            console.warn("Upload réservé aux admins");
            return;
          }
          const formData = new FormData();
          Array.from(files).forEach((f) => formData.append("files", f));
          await fetch(`/api/assets/upload/${id}`, {
            method: "POST",
            body: formData,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        }
      })
      .catch((err) => {
        console.error("NewBuild create error", err);
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => navigate("/builds"));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  return (
    <main className="new-build-container">
      <h2>Créer un nouveau logiciel</h2>
      <form className="new-build-form" onSubmit={handleSubmit}>
        {error && <div style={{ color: "#c00", marginBottom: 8 }}>{error}</div>}
        <input
          name="nom"
          placeholder="Nom du logiciel"
          value={form.nom}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description courte"
          value={form.description}
          onChange={handleChange}
          required
        />
        <input
          name="version"
          placeholder="Version (ex: v1.0.0)"
          value={form.version}
          onChange={handleChange}
        />
        <input
          name="statut"
          placeholder="Statut (ex: En prod / En test)"
          value={form.statut}
          onChange={handleChange}
        />
        <div className="select-label">Choisir un statut</div>
        <select name="statut" value={form.statut} onChange={handleChange}>
          <option value="">-- Choisir --</option>
          <option value="En développement">En développement</option>
          <option value="En test">En test</option>
          <option value="Production">Production</option>
          <option value="Déprécié">Déprécié</option>
        </select>
        <input
          name="proprietaire"
          placeholder="Responsable / Propriétaire"
          value={form.proprietaire}
          onChange={handleChange}
          required
        />
        <label style={{ marginTop: 8 }}>
          Joindre des fichiers (optionnel)
          {user?.isAdmin ? (
            <input type="file" multiple onChange={handleFileChange} />
          ) : (
            <div style={{ fontSize: 12, color: "#666" }}>
              Seuls les admins peuvent joindre des fichiers
            </div>
          )}
        </label>
        <button type="submit" className="btn primary">
          Créer
        </button>
      </form>
    </main>
  );
}
