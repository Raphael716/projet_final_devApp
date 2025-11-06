SPL/src/AddVersion.tsx [40:53]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



backend/uploads/1761265169126-984135838.tsx [37:50]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
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
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



