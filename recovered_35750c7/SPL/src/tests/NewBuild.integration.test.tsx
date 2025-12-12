import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NewBuild from "../NewBuild";
import { AuthContext } from "../AuthContext";

global.fetch = vi.fn();

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("NewBuild Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderNewBuild = () => {
    const contextValue = {
      user: {
        id: 1,
        username: "Admin",
        email: "admin@test.com",
        isAdmin: true,
      },
      token: "valid-token",
      login: vi.fn(),
      logout: vi.fn(),
    };

    return render(
      <AuthContext.Provider value={contextValue}>
        <MemoryRouter>
          <NewBuild />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it("envoie le formulaire et redirige après succès", async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: 100, nom: "Nouveau Soft" }),
    });

    const { container } = renderNewBuild();

    fireEvent.change(screen.getByPlaceholderText(/Nom du logiciel/i), {
      target: { value: "Mon Logiciel" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Description courte/i), {
      target: { value: "Ceci est un test" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Version/i), {
      target: { value: "v1.0.0" },
    });

    const select = container.querySelector('select[name="statut"]');
    if (select) {
      fireEvent.change(select, { target: { value: "En développement" } });
    }

    fireEvent.change(screen.getByPlaceholderText(/Responsable/i), {
      target: { value: "John Doe" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Créer/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    const [url, options] = (global.fetch as Mock).mock.calls[0];
    expect(url).toBe("/api/builds");
    expect(options.method).toBe("POST");
    expect(options.headers).toEqual({ Authorization: "Bearer valid-token" });
    expect(options.body).toBeInstanceOf(FormData);

    const formDataEntries = Array.from((options.body as FormData).entries());
    expect(formDataEntries).toContainEqual(["nom", "Mon Logiciel"]);
    expect(formDataEntries).toContainEqual(["description", "Ceci est un test"]);
    expect(formDataEntries).toContainEqual(["version", "v1.0.0"]);
    expect(formDataEntries).toContainEqual(["proprietaire", "John Doe"]);

    expect(mockNavigate).toHaveBeenCalledWith("/builds/100");
  });

  it("affiche une erreur si l'API échoue", async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: false,
      statusText: "Bad Request",
    });

    renderNewBuild();

    fireEvent.change(screen.getByPlaceholderText(/Nom du logiciel/i), {
      target: { value: "Fail Build" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Description courte/i), {
      target: { value: "Description obligatoire" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Responsable/i), {
      target: { value: "Responsable obligatoire" },
    });

    // Soumettre le formulaire
    fireEvent.click(screen.getByRole("button", { name: /Créer/i }));

    await waitFor(() => {
      expect(screen.getByText(/Erreur création/i)).toBeInTheDocument();
    });
  });

  it("valide qu'une version est fournie lorsqu'un fichier est joint", async () => {
    const { container } = renderNewBuild();

    fireEvent.change(screen.getByPlaceholderText(/Nom du logiciel/i), {
      target: { value: "Logiciel" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Description courte/i), {
      target: { value: "Description" },
    });
    fireEvent.change(screen.getByPlaceholderText(/Responsable/i), {
      target: { value: "Manager" },
    });

    const fileInput = container.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    const file = new File(["binary"], "build.zip", { type: "application/zip" });
    const fakeFileList = {
      0: file,
      length: 1,
      item: () => file,
      [Symbol.iterator]: function* () {
        yield file;
      },
    } as unknown as FileList;

    fireEvent.change(fileInput, { target: { files: fakeFileList } });

    fireEvent.click(screen.getByRole("button", { name: /Créer/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Veuillez indiquer une version/i)
      ).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });
});
