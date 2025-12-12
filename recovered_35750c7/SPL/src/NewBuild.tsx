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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (files?.length && !form.version.trim()) {
      setError("Veuillez indiquer une version pour les fichiers joints.");
      return;
    }

    try {
      const payload = new FormData();
      const nomValue = form.nom.trim();
      const descriptionValue = form.description.trim();
      const versionValue = form.version.trim();
      const statutValue = form.statut.trim();
      const proprietaireValue = form.proprietaire.trim();

      payload.append("nom", nomValue);
      payload.append("description", descriptionValue);
      if (versionValue) payload.append("version", versionValue);
      if (statutValue) payload.append("statut", statutValue);
      payload.append("proprietaire", proprietaireValue);

      if (files?.length) {
        payload.append("file", files[0]);
      }

      const response = await fetch("/api/builds", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: payload,
      });

      if (!response.ok) {
        let message = "Erreur création";
        try {
          const details = await response.json();
          if (details && typeof details === "object" && "error" in details) {
            message = String(details.error);
          }
        } catch (parseError) {
          console.warn("Unable to parse error response", parseError);
        }
        throw new Error(message);
      }

      const created = await response.json();
      if (!created?.id) {
        throw new Error("Réponse invalide du serveur");
      }

      navigate(`/builds/${created.id}`);
    } catch (err) {
      console.error("NewBuild create error", err);
      setError(err instanceof Error ? err.message : String(err));
    }
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
        <div className="select-label">Choisir un statut</div>
        <select name="statut" value={form.statut} onChange={handleChange}>
          <option value="">-- Choisir --</option>
          <option value="En développement">En développement</option>
          <option value="En test">En test</option>
          <option value="Production">Production</option>
          <option value="Déprécié">Déprécié</option>
          <option value="Terminé">Terminé</option>
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
