import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "./AuthContext";
import "./AddVersion.css";

type BuildDetailType = {
  id: number;
  nom: string;
  version?: string | null;
};

export default function AddVersion() {
  const { id } = useParams();
  const [build, setBuild] = useState<BuildDetailType | null>(null);
  const [newVersion, setNewVersion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/builds/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setBuild({
          id: data.id,
          nom: data.nom,
          version: data.version,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="loading">Chargement...</p>;
  if (!build) return <p className="loading">Logiciel introuvable</p>;

  const compareVersions = (v1: string, v2: string) => {
    const a1 = v1.split(".").map(Number);
    const a2 = v2.split(".").map(Number);
    for (let i = 0; i < Math.max(a1.length, a2.length); i++) {
      const n1 = a1[i] || 0;
      const n2 = a2[i] || 0;
      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
    }
    return 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!newVersion || !file) {
      setError("Veuillez saisir une version et sélectionner un fichier.");
      return;
    }

    if (build.version && compareVersions(newVersion, build.version) <= 0) {
      setError(`La nouvelle version doit être supérieure à ${build.version}`);
      return;
    }

    const formData = new FormData();
    formData.append("version", newVersion);
    formData.append("file", file);

    try {
      const res = await fetch(`/api/builds/${id}/add-version`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur lors de l'ajout de la version");

      alert("Version ajoutée avec succès !");
      navigate(`/builds/${id}`);
    } catch (e) {
      console.error(e);
      setError("Impossible d'ajouter la version.");
    }
  };

  return (
    <main className="add-version-container">
      <div className="add-version-card">
        <h2>
          Ajouter une version pour{" "}
          <span className="build-name">{build.nom}</span>
        </h2>
        <form className="add-version-form" onSubmit={handleSubmit}>
          <label>
            Nouvelle version (ex: 1.0.1)
            <input
              type="text"
              value={newVersion}
              onChange={(e) => setNewVersion(e.target.value)}
              placeholder={
                build.version ? `Supérieur à ${build.version}` : "Ex: 1.0.1"
              }
              required
              className="input-version"
            />
          </label>

          <label>
            Fichier
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              required
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-submit">
            Ajouter
          </button>
        </form>
      </div>
    </main>
  );
}
