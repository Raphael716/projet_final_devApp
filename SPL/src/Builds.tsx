import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Builds.css"; // nouveau fichier CSS

type Build = {
  id: number;
  nom: string;
  description?: string;
  version?: string;
  statut?: string;
  proprietaire?: string;
  updatedAt: string;
};

export default function Builds() {
  const [builds, setBuilds] = useState<Build[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/builds")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setBuilds(data);
        else setBuilds([]);
      })
      .catch(() => setBuilds([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="builds-container">
      <div className="builds-header">
        <h2>Liste des logiciels</h2>
        <Link to="/builds/new" className="btn primary">
          Nouveau logiciel
        </Link>
      </div>
      {loading ? (
        <p>Chargement...</p>
      ) : (
        <table className="builds-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Description</th>
              <th>Version</th>
              <th>Statut</th>
              <th>Responsable</th>
              <th>Dernière MAJ</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {builds.map((s) => (
              <tr key={s.id}>
                <td>
                  <Link to={`/builds/${s.id}`}>{s.nom}</Link>
                </td>
                <td>{s.description}</td>
                <td>{s.version}</td>
                <td>{s.statut}</td>
                <td>{s.proprietaire}</td>
                <td>{new Date(s.updatedAt).toLocaleDateString()}</td>
                <td className="builds-actions">
                  <Link to={`/builds/${s.id}/edit`} className="btn-edit">
                    Modifier
                  </Link>
                  <button className="btn-archive">Archiver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
