import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./NewBuild.css";

export default function NewBuild() {
  const [form, setForm] = useState({
    name: "",
    description: "",
    owner: "",
  });
  const navigate = useNavigate();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Envoyer au backend
    // fetch('/api/builds', { method: 'POST', body: JSON.stringify(form) })
    navigate("/builds");
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
        <button type="submit" className="btn primary">
          Créer
        </button>
      </form>
    </main>
  );
}
