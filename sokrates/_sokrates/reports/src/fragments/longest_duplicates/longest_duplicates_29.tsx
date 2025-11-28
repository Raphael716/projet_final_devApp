SPL/src/AddVersion.tsx [91:117]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
        setError("Erreur lors de l'ajout de la version");
      }
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
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



backend/uploads/1761265231112-624819031.tsx [64:89]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



