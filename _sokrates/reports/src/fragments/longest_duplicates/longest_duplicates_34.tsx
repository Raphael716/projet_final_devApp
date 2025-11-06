SPL/src/AddVersion.tsx [6:15]:
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
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



backend/uploads/1761265231112-624819031.tsx [6:15]:
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
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



