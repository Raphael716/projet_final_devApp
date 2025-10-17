import { useParams, useContext } from "react-router-dom";
import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext";

type BuildDetailType = {
  id: number;
  name: string;
  description: string;
  version: string;
  updatedAt: string;
};

type Asset = {
  id: number;
  filename: string;
  size: number;
};

export default function BuildDetail() {
  const { id } = useParams();
  const { token } = useContext(AuthContext);
  const [build, setBuild] = useState<BuildDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    fetch(`/api/builds/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const normalized: Partial<BuildDetailType> = {
          id: data.id,
          name: data.name ?? data.nom ?? "",
          description: data.description ?? "",
          fullDescription:
            data.descriptionComplete ??
            data.fullDescription ??
            data.description ??
            "",
          version: data.version ?? "",
          updatedAt:
            data.updatedAt ?? data.updated_at ?? new Date().toISOString(),
        };
        setBuild(normalized as BuildDetailType);
      })
      .finally(() => setLoading(false));

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
    <main>
      <h2>{build.name}</h2>
      <p>{build.description}</p>
    </main>
  );
}
