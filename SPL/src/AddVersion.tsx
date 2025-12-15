import { useParams, useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import "./AddVersion.css";

type BuildInfo = {
  id: number;
  nom: string;
  version?: string | null;
};

export default function AddVersion() {
  const { id } = useParams();
  const [build, setBuild] = useState<BuildInfo | null>(null);
  const [newVersion, setNewVersion] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // If no token and no user, send to login
    if (!token && !user) {
      navigate("/login");
      return;
    }

    // If user is known and not admin, redirect back to build
    if (user && !user.isAdmin) {
      navigate(`/builds/${id}`);
    }
  }, [user, token, id, navigate]);

  useEffect(() => {
    const fetchBuild = async () => {
      try {
        const res = await fetch(`/api/builds/${id}`);
        if (!res.ok) throw new Error("Erreur lors du chargement du build");
        const data = await res.json();
        setBuild({
          id: data.id,
          nom: data.nom,
          version: data.version || null,
        });
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Impossible de charger le logiciel."
        );
      }
    };
    fetchBuild();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file || !newVersion) {
      setError("Veuillez remplir tous les champs");
      return;
    }

    const formData = new FormData();
    formData.append("version", newVersion);
    formData.append("description", description);
    formData.append("file", file);

    try {
      setError("");
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const res = await fetch(`/api/builds/${id}/add-version`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData?.error || "Erreur ajout version");
      }

      if (!responseData?.success) {
        throw new Error("La création de la version a échoué");
      }

      // La version a été créée avec succès
      await new Promise((resolve) => setTimeout(resolve, 500));
      navigate(`/builds/${id}`, { replace: true });
      return;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else if (err instanceof DOMException && err.name === "AbortError") {
        setError("La requête a pris trop de temps, veuillez réessayer");
      } else {
        setError("Erreur lors de l'ajout de la version");
      }
    }
  };

  return (
    <main className="add-version">
      <h2>Ajouter une version</h2>
      {error && <p className="error">{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Version :
          <input
            type="text"
            value={newVersion}
            onChange={(e) => setNewVersion(e.target.value)}
            placeholder={
              build?.version
                ? `Entrez une version supérieure à ${build.version}`
                : "Ex: v1.0.2"
            }
            required
          />
        </label>

        <label>
          Description :
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez les nouveautés de cette version"
            rows={3}
            required
          />
        </label>

        <label>
          Fichier :
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </label>

        <button type="submit" className="btn primary">
          Ajouter
        </button>
      </form>
    </main>
  );
}
