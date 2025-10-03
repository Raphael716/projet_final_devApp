import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import "./BuildDetail.css";

type BuildDetailType = {
  id: number;
  name: string;
  description: string;
  fullDescription: string;
  version: string;
  status: string;
  proprietaire: string;
  updatedAt: string;
  versions: { version: string; date: string }[];
};

export default function BuildDetail() {
  const { id } = useParams();
  const [build, setBuild] = useState<BuildDetailType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Remplace par ton endpoint API
    fetch(`/api/builds/${id}`)
      .then((res) => res.json())
      .then(setBuild)
      .finally(() => setLoading(false));
  }, [id]);

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
      {build.usageStats && (
        <div>
          <h3>Statistiques d'utilisation</h3>
          <p>Utilisateurs: {build.usageStats.users}</p>
          <p>Sessions: {build.usageStats.sessions}</p>
        </div>
      )}
      <div style={{ marginTop: 24 }}>
        <Link to={`/builds/${build.id}/edit`} className="btn-edit">
          Modifier
        </Link>
        <button className="btn-archive" style={{ marginLeft: 8 }}>
          Archiver
        </button>
        <Link to={`/builds/${build.id}/add-version`} className="btn">
          Ajouter une version
        </Link>
        <Link to={`/builds/${build.id}/assign`} className="btn">
          Assigner des utilisateurs/équipes
        </Link>
      </div>
    </main>
  );
}
