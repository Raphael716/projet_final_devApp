backend/uploads/1761265169126-984135838.tsx [6:102]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type BuildInfo = {
  id: number;
  nom: string;
  version?: string | null;
};

export default function AddVersion() {
  const { id } = useParams();
  const [build, setBuild] = useState<BuildInfo | null>(null);
  const [newVersion, setNewVersion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Charger la version actuelle du build
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
        console.error(err);
        setError("Impossible de charger le logiciel.");
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
    formData.append("file", file);

    try {
      const res = await fetch(`/api/builds/${id}/add-version`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur ajout version");
      navigate(`/builds/${id}`);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'ajout de la version");
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
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



backend/uploads/1761328515350-537683809.tsx [6:102]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
type BuildInfo = {
  id: number;
  nom: string;
  version?: string | null;
};

export default function AddVersion() {
  const { id } = useParams();
  const [build, setBuild] = useState<BuildInfo | null>(null);
  const [newVersion, setNewVersion] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

  // Charger la version actuelle du build
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
        console.error(err);
        setError("Impossible de charger le logiciel.");
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
    formData.append("file", file);

    try {
      const res = await fetch(`/api/builds/${id}/add-version`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) throw new Error("Erreur ajout version");
      navigate(`/builds/${id}`);
    } catch (err) {
      console.error(err);
      setError("Erreur lors de l'ajout de la version");
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
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



