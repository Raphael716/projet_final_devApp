import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import { AuthContext } from "./AuthContext";
import "./BuildDetail.css"; // CSS séparé

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
  createdAt?: string;
};

export default function BuildDetail() {
  const { id } = useParams();
  const [build, setBuild] = useState<BuildDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

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
      .then(setAssets)
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
          <div className="status-owner">
            <span className="status-badge">{build.statut || "—"}</span>
            <span className="owner">
              Responsable: <strong>{build.proprietaire || "—"}</strong>
            </span>
          </div>
        </div>

        <div className="build-detail-actions">
          {user?.isAdmin && (
            <>
              <Link to={`/builds/${build.id}/edit`} className="btn-edit">
                Modifier
              </Link>
              <button
                className="btn-archive"
                onClick={async () => {
                  if (
                    !window.confirm(
                      "Voulez-vous vraiment archiver (supprimer) ce logiciel ?"
                    )
                  )
                    return;
                  try {
                    const res = await fetch(`/api/builds/${build.id}`, {
                      method: "DELETE",
                      headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                    });
                    if (!res.ok) throw new Error("Erreur suppression");
                    navigate("/builds");
                  } catch (e) {
                    console.error("delete build", e);
                    alert("Impossible de supprimer le logiciel");
                  }
                }}
              >
                Archiver
              </button>
            </>
          )}
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
                <b>Version actuelle:</b> {build.version || "—"}
              </li>
              <li>
                <b>Dernière mise à jour:</b>{" "}
                {new Date(build.updatedAt).toLocaleDateString()}
              </li>
            </ul>
          </div>
        </section>

        <aside className="build-detail-side">
          <div className="build-detail-section">
            <h3>Fichiers</h3>
            {assets.length === 0 ? (
              <p>Aucun fichier pour cette version.</p>
            ) : (
              <ul className="assets-list">
                {assets.map((a) => (
                  <li key={a.id} className="asset-item">
                    <a
                      className="asset-download"
                      href={`/api/assets/download/${a.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {a.original}
                    </a>
                    <span className="asset-meta">
                      {Math.round(a.size / 1024)} KB
                    </span>
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
