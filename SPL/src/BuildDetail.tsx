import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useContext } from "react";
import "./BuildDetail.css";
import { AuthContext } from "./AuthContext";

type BuildDetailType = {
  id: number;
  name: string;
  description: string;
  fullDescription: string;
  version: string;
  status?: string;
  proprietaire?: string;
  // optional frontend-friendly aliases
  owner?: string;
  statusLabel?: string;
  updatedAt: string;
  versions: { version: string; date: string }[];
  technologies?: string[];
  wikiUrl?: string;
  bugs?: { id: number; title: string; status: string }[];
  usageStats?: { users: number; sessions: number };
};

export default function BuildDetail() {
  const { id } = useParams();
  const [build, setBuild] = useState<BuildDetailType | null>(null);
  const [loading, setLoading] = useState(true);
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

  const [assets, setAssets] = useState<Asset[]>([]);
  const { user, token } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Remplace par ton endpoint API
    fetch(`/api/builds/${id}`)
      .then((res) => res.json())
      .then((data) => {
        // Normalize server fields (fr/back naming mismatch)
        const normalized: Partial<BuildDetailType> = {
          id: data.id,
          name: data.name ?? data.nom ?? "",
          description: data.description ?? "",
          fullDescription:
            data.descriptionComplete ??
            data.fullDescription ??
            data.description ??
            "",
          version: data.version ?? data.version,
          status: data.status ?? data.statut ?? "",
          proprietaire: data.proprietaire ?? data.owner ?? data.ownerName ?? "",
          owner: data.proprietaire ?? data.owner ?? "",
          updatedAt:
            data.updatedAt ?? data.updated_at ?? new Date().toISOString(),
          versions: data.versions ?? [],
          technologies: data.technologies ?? [],
          wikiUrl: data.wikiUrl ?? data.wiki_url,
          bugs: data.bugs ?? [],
          usageStats: data.usageStats ?? null,
        };
        setBuild(normalized as BuildDetailType);
      })
      .finally(() => setLoading(false));
    // fetch assets
    fetch(`/api/assets/build/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then(setAssets)
      .catch((e) => console.error("assets fetch", e));
  }, [id, token]);

  if (loading) return <p>Chargement...</p>;
  if (!build) return <p>Logiciel introuvable</p>;

  return (
    <main className="admin-container">
      <h2>{build.name}</h2>
      <p>{build.fullDescription || build.description}</p>
      <ul>
        <li>
          <b>Version actuelle:</b> {build.version}
        </li>
        <li>
          <b>Statut:</b> {build.status}
        </li>
        <li>
          <b>Responsable:</b> {build.owner}
        </li>
        <li>
          <b>Dernière mise à jour:</b>{" "}
          {new Date(build.updatedAt).toLocaleDateString()}
        </li>
        <li>
          <b>Technologies:</b> {build.technologies?.join(", ")}
        </li>
      </ul>
      <h3>Historique des versions</h3>
      <ul>
        {build.versions?.map((v) => (
          <li key={v.version}>
            {v.version} - {new Date(v.date).toLocaleDateString()}
          </li>
        ))}
      </ul>
      {build.wikiUrl && (
        <a
          href={build.wikiUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn"
        >
          Documentation interne
        </a>
      )}
      <h3>Bugs / Tickets associés</h3>
      <ul>
        {build.bugs?.map((b) => (
          <li key={b.id}>
            {b.title} ({b.status})
          </li>
        ))}
      </ul>
      <h3>Fichiers téléchargeables</h3>
      {assets.length === 0 && <p>Aucun fichier pour cette version.</p>}
      <ul>
        {assets.map((a) => (
          <li
            key={a.id}
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <a
              href={`/api/assets/download/${a.id}`}
              target="_blank"
              rel="noreferrer"
            >
              {a.original} ({Math.round(a.size / 1024)} KB)
            </a>
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
                    setAssets((cur) => cur.filter((x) => x.id !== a.id));
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
      {build.usageStats && (
        <div>
          <h3>Statistiques d'utilisation</h3>
          <p>Utilisateurs: {build.usageStats.users}</p>
          <p>Sessions: {build.usageStats.sessions}</p>
        </div>
      )}
      <div style={{ marginTop: 24 }}>
        {user?.isAdmin ? (
          <>
            <Link to={`/builds/${build.id}/edit`} className="btn-edit">
              Modifier
            </Link>
            <button
              className="btn-archive"
              style={{ marginLeft: 8 }}
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
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
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
        ) : null}
        <Link to={`/builds/${build.id}/add-version`} className="btn">
          Ajouter une version
        </Link>
      </div>
    </main>
  );
}
