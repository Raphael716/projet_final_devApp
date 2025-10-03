import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import "./NewBuild.css";
import { AuthContext } from "./AuthContext";

export default function NewBuild() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    owner: "",
  });
  const [files, setFiles] = useState<FileList | null>(null);
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Create build then upload files (if any)
    fetch('/api/builds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: form.name,
        description: form.description,
        proprietaire: form.owner,
      }),
    })
      .then((r) => r.json())
      .then(async (created) => {
        const id = created.id;
        if (files && files.length) {
          if (!user?.isAdmin) {
            console.warn('Upload réservé aux admins');
            return;
          }
          const formData = new FormData();
          Array.from(files).forEach((f) => formData.append('files', f));
          await fetch(`/api/assets/upload/${id}`, {
            method: 'POST',
            body: formData,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
        }
      })
      .finally(() => navigate('/builds'));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  return (
    <main className="new-build-container">
      <h2>Créer un nouveau logiciel</h2>
      <form className="new-build-form" onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Nom du logiciel"
          value={form.name}
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
          name="owner"
          placeholder="Responsable"
          value={form.owner}
          onChange={handleChange}
          required
        />
        <label style={{ marginTop: 8 }}>
          Joindre des fichiers (optionnel)
            {user?.isAdmin ? (
              <input type="file" multiple onChange={handleFileChange} />
            ) : (
              <div style={{ fontSize: 12, color: '#666' }}>Seuls les admins peuvent joindre des fichiers</div>
            )}
        </label>
        <button type="submit" className="btn primary">
          Créer
        </button>
      </form>
    </main>
  );
}
