import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AddVersion from "../AddVersion";
import { AuthContext, type AuthContextType } from "../AuthContext";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithContext = (contextValue: AuthContextType, initialEntry = "/builds/1/add-version") =>
  render(
    <AuthContext.Provider value={contextValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/builds/:id/add-version" element={<AddVersion />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe("AddVersion", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("redirige vers /login quand aucun utilisateur n'est authentifié", async () => {
    const context: AuthContextType = {
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderWithContext(context);

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/login"));
  });

  it("affiche la version actuelle du logiciel chargé", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ id: 1, nom: "Logiciel", version: "v1.2.0" }),
      } as Response)
    );

    const context: AuthContextType = {
      user: { id: 1, email: "admin@test.com", isAdmin: true },
      token: "tok",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderWithContext(context);

    const versionInput = await screen.findByPlaceholderText(
      /Entrez une version supérieure à v1.2.0/
    );
    expect(versionInput).toBeInTheDocument();
  });

  it("affiche une erreur lorsque l'API échoue", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((url: RequestInfo, options?: RequestInit) => {
        if (url === "/api/builds/1") {
          return Promise.resolve({ ok: true, json: async () => ({ id: 1, nom: "Logiciel" }) } as Response);
        }
        if (url === "/api/builds/1/add-version") {
          return Promise.resolve({ ok: false, json: async () => ({ error: "Erreur serveur" }) } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const context: AuthContextType = {
      user: { id: 1, email: "admin@test.com", isAdmin: true },
      token: "tok",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderWithContext(context);

    await screen.findByText("Ajouter une version");

    fireEvent.change(screen.getByLabelText(/Version/i), {
      target: { value: "v2.0.0" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Notes" },
    });

    const fileInput = screen.getByLabelText(/Fichier/i) as HTMLInputElement;
    const file = new File(["content"], "release.zip", {
      type: "application/zip",
    });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const form = screen.getByText("Ajouter").closest("form")!;
    fireEvent.submit(form);

    expect(
      await screen.findByText("Erreur serveur")
    ).toBeInTheDocument();
  });

  it("envoie la requête POST et redirige après succès", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((url: RequestInfo, options?: RequestInit) => {
        if (url === "/api/builds/1") {
          return Promise.resolve({ ok: true, json: async () => ({ id: 1, nom: "Logiciel" }) } as Response);
        }
        if (url === "/api/builds/1/add-version" && options?.method === "POST") {
          const body = options.body as FormData;
          expect(body).toBeInstanceOf(FormData);
          expect(body.get("version")).toBe("v2.0.0");
          expect(body.get("description")).toBe("Notes");
          expect(options.headers).toMatchObject({ Authorization: "Bearer tok" });
          return Promise.resolve({ ok: true, json: async () => ({ success: true }) } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const context: AuthContextType = {
      user: { id: 1, email: "admin@test.com", isAdmin: true },
      token: "tok",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderWithContext(context);

    await screen.findByText("Ajouter une version");

    fireEvent.change(screen.getByLabelText(/Version/i), {
      target: { value: "v2.0.0" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Notes" },
    });

    const fileInput = screen.getByLabelText(/Fichier/i) as HTMLInputElement;
    const file = new File(["content"], "release.zip", {
      type: "application/zip",
    });
    fireEvent.change(fileInput, { target: { files: [file] } });

    const form = screen.getByText("Ajouter").closest("form")!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/builds/1/add-version",
        expect.objectContaining({ method: "POST" })
      );
    });

    await waitFor(
      () =>
        expect(mockNavigate).toHaveBeenCalledWith("/builds/1", {
          replace: true,
        })
    );

  });

  it("redirige un utilisateur non admin vers la page du build", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: async () => ({ id: 1, nom: "Logiciel" }),
      } as Response)
    );

    const context: AuthContextType = {
      user: { id: 9, email: "user@test.com", isAdmin: false },
      token: "tok",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderWithContext(context);

    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/builds/1")
    );
  });

  it("affiche une erreur si des champs obligatoires manquent", async () => {
    global.fetch = vi.fn((url: RequestInfo) => {
      if (url === "/api/builds/1") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, nom: "Logiciel" }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    }) as unknown as typeof fetch;

    const context: AuthContextType = {
      user: { id: 1, email: "admin@test.com", isAdmin: true },
      token: "tok",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderWithContext(context);

    fireEvent.change(await screen.findByLabelText(/Version/i), {
      target: { value: "v3.0.0" },
    });

    fireEvent.submit(screen.getByText("Ajouter").closest("form")!);

    expect(
      screen.getByText("Veuillez remplir tous les champs")
    ).toBeInTheDocument();
  });

  it("affiche une erreur lorsque l'API répond success false", async () => {
    const fetchMock = vi.fn((url: RequestInfo, options?: RequestInit) => {
      if (url === "/api/builds/1") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 1, nom: "Logiciel" }),
        } as Response);
      }
      if (url === "/api/builds/1/add-version" && options?.method === "POST") {
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: false }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const context: AuthContextType = {
      user: { id: 1, email: "admin@test.com", isAdmin: true },
      token: "tok",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderWithContext(context);

    fireEvent.change(await screen.findByLabelText(/Version/i), {
      target: { value: "v4.0.0" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Notes" },
    });
    const fileInput = screen.getByLabelText(/Fichier/i) as HTMLInputElement;
    const file = new File(["content"], "release.zip", {
      type: "application/zip",
    });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.submit(screen.getByText("Ajouter").closest("form")!);

    expect(
      await screen.findByText("La création de la version a échoué")
    ).toBeInTheDocument();
  });

  it("affiche un message clair quand la requête est annulée", async () => {
    const abortError = new DOMException("Aborted", "AbortError");

    global.fetch = vi.fn(() => Promise.reject(abortError)) as unknown as typeof fetch;

    const context: AuthContextType = {
      user: { id: 1, email: "admin@test.com", isAdmin: true },
      token: "tok",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderWithContext(context);

    fireEvent.change(await screen.findByLabelText(/Version/i), {
      target: { value: "v5.0.0" },
    });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Notes" },
    });
    const fileInput = screen.getByLabelText(/Fichier/i) as HTMLInputElement;
    const file = new File(["content"], "release.zip", {
      type: "application/zip",
    });
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.submit(screen.getByText("Ajouter").closest("form")!);

    expect(
      await screen.findByText("La requête a pris trop de temps, veuillez réessayer")
    ).toBeInTheDocument();
  });
});
