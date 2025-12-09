import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import "./BuildDetail.css";

type BuildDetailType = {
  id: number;
  nom: string;
  description?: string | null;
  version?: string | null;
  statut?: string | null;
  proprietaire?: string | null;
  updatedAt: string;
};

type Asset = {
  id: number;
  filename: string;
  original: string;
  mimetype: string;
  size: number;
  path: string;
  buildId: number;
  version?: string | null;
  createdAt?: string;
};

export default function BuildDetail() {
  const { id } = useParams();
  const [build, setBuild] = useState<BuildDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const { user, token } = useContext(AuthContext);

  const statusClass = (s?: string | null) => {
    if (!s) return "";
    const k = s.toLowerCase();
    if (k.includes("prod") || k.includes("production")) return "production";
    if (
      k.includes("dépréci") ||
      k.includes("depréci") ||
      k.includes("deprecated")
    )
      return "deprecated";
    if (k.includes("test")) return "test";
    if (
      k.includes("développement") ||
      k.includes("dev") ||
      k.includes("developp")
    )
      return "development";
    return "";
  };

  const sortVersions = (a: string, b: string) => {
    const pa = a
      .replace(/[^\d.]/g, "")
      .split(".")
      .map(Number);
    const pb = b
      .replace(/[^\d.]/g, "")
      .split(".")
      .map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
      const diff = (pb[i] || 0) - (pa[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  };

  useEffect(() => {
    fetch(`/api/builds/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setBuild({
          id: data.id,
          nom: data.nom ?? null,
          description: data.description ?? null,
          version: data.version ?? null,
          statut: data.statut ?? null,
          proprietaire: data.proprietaire ?? null,
          updatedAt:
            data.updatedAt ?? data.updated_at ?? new Date().toISOString(),
        });
      })
      .finally(() => setLoading(false));

    fetch(`/api/assets/build/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((data) => {
        const sorted = [...data].sort((a, b) =>
          sortVersions(a.version || "v0.0.0", b.version || "v0.0.0")
        );
        setAssets(sorted);
      })
      .catch((e) => console.error("assets fetch", e));
  }, [id, token]);

  if (loading) return <p className="loading">Chargement...</p>;
  if (!build) return <p className="loading">Logiciel introuvable</p>;

  return (
    <main className="build-detail-container">
      <div className="build-detail-header">
        <div>
          <h2>{build.nom}</h2>
          <p className="muted">{build.description || ""}</p>
          <div style={{ marginTop: 8, color: "#475569", fontSize: 13 }}>
            {assets.length > 0 ? (
              <>
                {assets.length} fichier(s) • Dernier upload :{" "}
                {new Date(
                  assets[0].createdAt || build.updatedAt
                ).toLocaleString()}
              </>
            ) : (
              <>Aucun fichier publié pour le moment</>
            )}
          </div>
          <div className="status-owner">
            <span className={`status-badge ${statusClass(build.statut)}`}>
              {build.statut || "—"}
            </span>
            <span className="owner">
              Responsable : <strong>{build.proprietaire || "—"}</strong>
            </span>
          </div>
        </div>

        <div className="build-detail-actions">
          {user?.isAdmin && (
            <Link to={`/builds/${build.id}/edit`} className="btn-edit">
              Modifier
            </Link>
          )}

          {/* Download latest version if available */}
          {assets &&
            assets.length > 0 &&
            (() => {
              const latest =
                assets.find((a) => a.version === build.version) || assets[0];
              return (
                <a
                  href={`/api/assets/download/${latest.id}`}
                  className="btn primary btn-download-large"
                  target="_blank"
                  rel="noreferrer"
                >
                  Télécharger la dernière version
                </a>
              );
            })()}

          <Link to={`/builds/${build.id}/add-version`} className="btn">
            Ajouter une version
          </Link>
        </div>
      </div>

      <div className="build-detail-grid">
        <section className="build-detail-main">
          <div className="build-detail-section">
            <h3>Détails</h3>
            <ul className="build-detail-list">
              <li>
                <b>Version actuelle :</b> {build.version || "—"}
              </li>
              <li>
                <b>Dernière mise à jour :</b>{" "}
                {new Date(build.updatedAt).toLocaleDateString()}
              </li>
            </ul>
          </div>
        </section>

        <aside className="build-detail-side">
          <div className="build-detail-section">
            <h3>Fichiers par version</h3>
            {assets.length === 0 ? (
              <p>Aucun fichier pour cette version.</p>
            ) : (
              <ul className="assets-list">
                {assets.map((a) => (
                  <li key={a.id} className="asset-item">
                    {a.version && (
                      <div className="asset-version">
                        <strong>{a.version}</strong>
                      </div>
                    )}
                    <Link
                      to={`/builds/${build.id}/versions/${a.id}`}
                      className="asset-version-link"
                    >
                      {a.original}
                    </Link>
                    <div className="asset-meta">
                      <span>{Math.round(a.size / 1024)} KB</span>
                    </div>

                    {user?.isAdmin && (
                      <button
                        className="btn-delete"
                        onClick={async () => {
                          if (!window.confirm("Supprimer ce fichier ?")) return;
                          try {
                            await fetch(`/api/assets/${a.id}`, {
                              method: "DELETE",
                              headers: { Authorization: `Bearer ${token}` },
                            });
                            setAssets((cur) =>
                              cur.filter((x) => x.id !== a.id)
                            );
                          } catch (e) {
                            console.error("delete asset", e);
                            alert("Erreur suppression");
                          }
                        }}
                      >
                        Supprimer
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
