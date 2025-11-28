import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import "./VersionDetail.css";

type Asset = {
  id: number;
  filename: string;
  original: string;
  mimetype: string;
  displayType?: string;
  size: number;
  path: string;
  buildId: number;
  version: string | null;
  description?: string | null;
  createdAt: string;
};

type Build = {
  id: number;
  nom: string;
  version?: string | null;
};

export default function VersionDetail() {
  const { buildId, assetId } = useParams();
  const [asset, setAsset] = useState<Asset | null>(null);
  const [build, setBuild] = useState<Build | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewExpanded, setPreviewExpanded] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`/api/assets/${assetId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        setAsset(data);
        return fetch(`/api/builds/${buildId}`);
      })
      .then((r) => r.json())
      .then((data) => {
        setBuild(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [buildId, assetId, token]);

  useEffect(() => {
    if (!asset) return;
    const isTextType = (a: Asset) => {
      if (!a) return false;
      if (a.mimetype && a.mimetype.startsWith("text/")) return true;
      if (a.displayType) {
        const d = a.displayType.toLowerCase();
        if (
          d.includes("fichier") ||
          d.includes("text") ||
          d.includes("markdown") ||
          d.includes("json")
        )
          return true;
      }
      return [".md", ".txt", ".json", ".csv", ".log"].some((e) =>
        a.original.toLowerCase().endsWith(e)
      );
    };

    if (!isTextType(asset)) {
      setPreview(null);
      return;
    }

    fetch(`/api/assets/download/${asset.id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(async (res) => {
        const ct = res.headers.get("content-type") || "";
        if (
          res.ok &&
          (ct.startsWith("text/") || ct.includes("json") || ct.includes("csv"))
        ) {
          return res.text();
        }
        return null;
      })
      .then((text) => {
        if (text) setPreview(text);
      })
      .catch((e) => {
        console.debug("preview fetch failed", e);
      });
  }, [asset, token]);

  if (loading) return <p>Chargement...</p>;
  if (!asset || !build) return <p>Version introuvable</p>;
  const friendlyType = (() => {
    if (!asset) return "Type inconnu";
    const dt = asset.displayType?.trim();
    if (dt && dt.length > 0) return dt;
    const idx = asset.original.lastIndexOf(".");
    if (idx !== -1) return asset.original.slice(idx).toLowerCase();
    return "Type inconnu";
  })();

  return (
    <main className="version-detail-container">
      <div className="version-detail-nav">
        <Link to={`/builds/${buildId}`} className="back-link">
          &larr; Retour au logiciel
        </Link>
      </div>

      <div className="version-detail-header">
        <div className="version-detail-title">
          <h2>Version {asset.version || "non spécifiée"}</h2>
        </div>

        <div className="version-detail-actions">
          <button
            className="btn-download"
            onClick={async () => {
              try {
                const response = await fetch(
                  `/api/assets/download/${asset.id}`,
                  {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                  }
                );

                if (!response.ok) {
                  throw new Error("Erreur lors du téléchargement");
                }

                // Créer un blob à partir de la réponse
                const blob = await response.blob();

                // Créer un URL pour le blob
                const url = window.URL.createObjectURL(blob);

                // Créer un lien temporaire et cliquer dessus
                const a = document.createElement("a");
                a.href = url;
                a.download = asset.original; // Utiliser le nom original du fichier
                document.body.appendChild(a);
                a.click();

                // Nettoyer
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (error) {
                console.error("Erreur de téléchargement:", error);
                alert("Erreur lors du téléchargement du fichier");
              }
            }}
          >
            Télécharger
          </button>
          {user?.isAdmin && (
            <button
              className="btn-delete"
              onClick={async () => {
                if (!window.confirm("Supprimer cette version ?")) return;
                try {
                  const res = await fetch(`/api/assets/${asset.id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (!res.ok) throw new Error("Erreur suppression");
                  navigate(`/builds/${buildId}`);
                } catch (e) {
                  console.error("delete version", e);
                  alert("Impossible de supprimer la version");
                }
              }}
            >
              Supprimer
            </button>
          )}
        </div>
      </div>

      <div className="version-detail-content">
        <div className="version-detail-section">
          <h3>Informations</h3>
          <ul className="version-info-list">
            <li>
              <span>Nom du fichier:</span>
              <strong>{asset.original}</strong>
            </li>
            <li>
              <span>Type:</span>
              <strong>{friendlyType}</strong>
            </li>
            <li>
              <span>Description :</span>
              <strong>
                {asset.description || "Aucune description fournie"}
              </strong>
            </li>
            <li>
              <span>Taille:</span>
              <strong>{(asset.size / 1024).toFixed(1)} KB</strong>
            </li>
            <li>
              <span>Date d'ajout:</span>
              <strong>{new Date(asset.createdAt).toLocaleString()}</strong>
            </li>
          </ul>
          {preview !== null && (
            <div className="version-preview">
              <div className="version-preview-header">
                <strong>Aperçu</strong>
                <button
                  className="preview-toggle"
                  onClick={() => setPreviewExpanded((p) => !p)}
                >
                  {previewExpanded ? "Réduire" : "Voir plus"}
                </button>
              </div>
              <pre
                className={`preview-box ${previewExpanded ? "expanded" : ""}`}
              >
                {preview}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
