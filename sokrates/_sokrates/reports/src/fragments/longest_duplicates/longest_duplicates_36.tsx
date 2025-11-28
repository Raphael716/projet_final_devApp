SPL/src/AddVersion.tsx [17:33]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();

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
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



backend/uploads/1761328515350-537683809.tsx [16:33]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



