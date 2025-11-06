import { useEffect, useState, useContext, type JSX } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import "./NewBuild.css";

type Form = {
  nom: string;
  description?: string;
  descriptionComplete?: string;
  version?: string;
  statut?: string;
  proprietaire?: string;
};

export default function EditBuild(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  const [form, setForm] = useState<Form>({
    nom: "",
    description: "",
    descriptionComplete: "",
    version: "",
    statut: "",
    proprietaire: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/builds/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Erreur récupération");
        return res.json();
      })
      .then((data) => {
        setForm({
          nom: data.nom ?? "",
          description: data.description ?? "",
          descriptionComplete: data.descriptionComplete ?? "",
          version: data.version ?? "",
          statut: data.statut ?? "",
          proprietaire: data.proprietaire ?? "",
        });
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : String(err))
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (!user || !user.isAdmin) return <p>Accès réservé aux administrateurs.</p>;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const name = e.target.name as keyof Form;
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/builds/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Erreur lors de la mise à jour");
      navigate("/builds");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <main className="new-build-container">
      <h2>Modifier le logiciel</h2>
      {error && <div style={{ color: "#c00", marginBottom: 8 }}>{error}</div>}
      <form className="new-build-form" onSubmit={handleSubmit}>
        <label className="field-label">Nom</label>
        <input name="nom" value={form.nom} onChange={handleChange} required />

        <label className="field-label">Description</label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
        />

        <label className="field-label">Version</label>
        <input name="version" value={form.version} onChange={handleChange} />

        <label className="field-label">Statut</label>
        <select
          name="statut"
          value={form.statut}
          onChange={(e) => setForm((p) => ({ ...p, statut: e.target.value }))}
        >
          <option value="">-- Choisir --</option>
          <option value="En développement">En développement</option>
          <option value="En test">En test</option>
          <option value="Production">Production</option>
          <option value="Déprécié">Déprécié</option>
        </select>

        <label className="field-label">Propriétaire</label>
        <input
          name="proprietaire"
          value={form.proprietaire}
          onChange={handleChange}
        />

        <button className="btn primary" type="submit" disabled={saving}>
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </form>
    </main>
  );
}
