SPL/src/BuildDetail.tsx [139:210]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          {assets &&
            assets.length > 0 &&
            (() => {
              const latest =
                assets.find((a) => a.version === build.version) || assets[0];
              return (
                <a
                  href={`/api/assets/download/${latest.id}`}
                  className="btn primary btn-download-large"
                  target="_blank"
                  rel="noreferrer"
                >
                  Télécharger la dernière version
                </a>
              );
            })()}

          <Link to={`/builds/${build.id}/add-version`} className="btn">
            Ajouter une version
          </Link>
        </div>
      </div>

      <div className="build-detail-grid">
        <section className="build-detail-main">
          <div className="build-detail-section">
            <h3>Détails</h3>
            <ul className="build-detail-list">
              <li>
                <b>Version actuelle :</b> {build.version || "—"}
              </li>
              <li>
                <b>Dernière mise à jour :</b>{" "}
                {new Date(build.updatedAt).toLocaleDateString()}
              </li>
            </ul>
          </div>
        </section>

        <aside className="build-detail-side">
          <div className="build-detail-section">
            <h3>Fichiers par version</h3>
            {assets.length === 0 ? (
              <p>Aucun fichier pour cette version.</p>
            ) : (
              <ul className="assets-list">
                {assets.map((a) => (
                  <li key={a.id} className="asset-item">
                    {a.version && (
                      <div className="asset-version">
                        <strong>{a.version}</strong>
                      </div>
                    )}
                    <Link
                      to={`/builds/${build.id}/versions/${a.id}`}
                      className="asset-version-link"
                    >
                      {a.original}
                    </Link>
                    <div className="asset-meta">
                      <span>{Math.round(a.size / 1024)} KB</span>
                    </div>

                    {user?.isAdmin && (
                      <button
                        className="btn-delete"
                        onClick={async () => {
                          if (!window.confirm("Supprimer ce fichier ?")) return;
                          try {
                            await fetch(`/api/assets/${a.id}`, {
                              method: "DELETE",
                              headers: { Authorization: `Bearer ${token}` },
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



backend/uploads/1761856845660-484720083.tsx [140:211]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
          {assets &&
            assets.length > 0 &&
            (() => {
              const latest =
                assets.find((a) => a.version === build.version) || assets[0];
              return (
                <a
                  href={`/api/assets/download/${latest.id}`}
                  className="btn primary btn-download-large"
                  target="_blank"
                  rel="noreferrer"
                >
                  Télécharger la dernière version
                </a>
              );
            })()}

          <Link to={`/builds/${build.id}/add-version`} className="btn">
            Ajouter une version
          </Link>
        </div>
      </div>

      <div className="build-detail-grid">
        <section className="build-detail-main">
          <div className="build-detail-section">
            <h3>Détails</h3>
            <ul className="build-detail-list">
              <li>
                <b>Version actuelle :</b> {build.version || "—"}
              </li>
              <li>
                <b>Dernière mise à jour :</b>{" "}
                {new Date(build.updatedAt).toLocaleDateString()}
              </li>
            </ul>
          </div>
        </section>

        <aside className="build-detail-side">
          <div className="build-detail-section">
            <h3>Fichiers par version</h3>
            {assets.length === 0 ? (
              <p>Aucun fichier pour cette version.</p>
            ) : (
              <ul className="assets-list">
                {assets.map((a) => (
                  <li key={a.id} className="asset-item">
                    {a.version && (
                      <div className="asset-version">
                        <strong>{a.version}</strong>
                      </div>
                    )}
                    <Link
                      to={`/builds/${build.id}/versions/${a.id}`}
                      className="asset-version-link"
                    >
                      {a.original}
                    </Link>
                    <div className="asset-meta">
                      <span>{Math.round(a.size / 1024)} KB</span>
                    </div>

                    {user?.isAdmin && (
                      <button
                        className="btn-delete"
                        onClick={async () => {
                          if (!window.confirm("Supprimer ce fichier ?")) return;
                          try {
                            await fetch(`/api/assets/${a.id}`, {
                              method: "DELETE",
                              headers: { Authorization: `Bearer ${token}` },
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



