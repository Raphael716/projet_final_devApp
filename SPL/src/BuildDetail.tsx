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
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    fetch(`/api/builds/${id}`)
      .then((r) => r.json())
      .then(setBuild);

    fetch(`/api/assets/build/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then(setAssets);
  }, [id, token]);

  if (!build) return <p>Chargement...</p>;

  return (
    <main>
      <h2>{build.name}</h2>
      <p>{build.description}</p>
    </main>
  );
}
