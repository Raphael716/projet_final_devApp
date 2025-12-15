import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import VersionDetail from "../VersionDetail";
import { AuthContext, type AuthContextType } from "../AuthContext";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderComponent = (context: AuthContextType) =>
  render(
    <AuthContext.Provider value={context}>
      <MemoryRouter initialEntries={["/builds/123/versions/55"]}>
        <Routes>
          <Route
            path="/builds/:buildId/versions/:assetId"
            element={<VersionDetail />}
          />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe("VersionDetail", () => {
  const originalFetch = global.fetch;
  const originalConfirm = window.confirm;
  const originalCreateObjectURL = window.URL.createObjectURL;
  const originalRevokeObjectURL = window.URL.revokeObjectURL;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.confirm = originalConfirm;
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("affiche les métadonnées et un aperçu texte", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((url: RequestInfo) => {
        if (url === "/api/assets/55") {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 55,
              original: "notes.txt",
              mimetype: "text/plain",
              displayType: "Fichier texte",
              size: 2048,
              path: "/tmp/notes.txt",
              buildId: 123,
              version: "1.0",
              createdAt: new Date().toISOString(),
            }),
          } as Response);
        }
        if (url === "/api/builds/123") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 123, nom: "Logiciel" }),
          } as Response);
        }
        if (url === "/api/assets/download/55") {
          return Promise.resolve({
            ok: true,
            headers: { get: () => "text/plain" },
            text: async () => "Contenu du fichier",
          } as unknown as Response);
        }
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const context: AuthContextType = {
      user: { id: 1, email: "user@test.com", isAdmin: false },
      token: "tok",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderComponent(context);

    expect(await screen.findByText("Version 1.0")).toBeInTheDocument();
    await screen.findByText("notes.txt");
    expect(await screen.findByText("Contenu du fichier")).toBeInTheDocument();

    const toggle = await screen.findByRole("button", { name: "Voir plus" });
    fireEvent.click(toggle);
    await screen.findByRole("button", { name: "Réduire" });
  });

  it("permet à un admin de supprimer une version", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((request: RequestInfo, options?: RequestInit) => {
        const url = typeof request === "string" ? request : request.url;
        if (url === "/api/assets/55") {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 55,
              original: "archive.zip",
              mimetype: "application/zip",
              path: "/uploads/archive.zip",
              buildId: 123,
              version: "2.0",
              createdAt: new Date().toISOString(),
            }),
          } as Response);
        }
        if (url === "/api/builds/123") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 123, nom: "Logiciel" }),
          } as Response);
        }
        if (url === "/api/assets/55" && options?.method === "DELETE") {
          expect(options.headers).toMatchObject({
            Authorization: "Bearer admin-token",
          });
          return Promise.resolve({ ok: true } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      });

    global.fetch = fetchMock as unknown as typeof fetch;
    window.confirm = vi.fn(() => true);

    const context: AuthContextType = {
      user: { id: 1, email: "admin@test.com", isAdmin: true },
      token: "admin-token",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderComponent(context);

    const deleteButton = await screen.findByRole("button", { name: "Supprimer" });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/assets/55",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/builds/123");
  });

  it("affiche un message lorsque la version est introuvable", async () => {
    const fetchMock = vi.fn((url: RequestInfo) => {
      if (url === "/api/assets/55") {
        return Promise.resolve({ ok: false, status: 404 } as Response);
      }
      if (url === "/api/builds/123") {
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const context: AuthContextType = {
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderComponent(context);

    expect(await screen.findByText("Version introuvable")).toBeInTheDocument();
  });

  it("permet de télécharger un fichier binaire sans afficher d'aperçu", async () => {
    const downloadResponse = {
      ok: true,
      blob: async () => new Blob(["zip"], { type: "application/zip" }),
    } as unknown as Response;

    const fetchMock = vi
      .fn()
      .mockImplementation((url: RequestInfo, options?: RequestInit) => {
        if (url === "/api/assets/55") {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 55,
              original: "release.zip",
              mimetype: "application/zip",
              path: "/uploads/release.zip",
              buildId: 123,
              version: "3.0",
              createdAt: new Date().toISOString(),
            }),
          } as Response);
        }
        if (url === "/api/builds/123") {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 123, nom: "Logiciel" }),
          } as Response);
        }
        if (url === "/api/assets/download/55") {
          expect(options?.headers).toMatchObject({ Authorization: "Bearer tok" });
          return Promise.resolve(downloadResponse);
        }
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      });

    global.fetch = fetchMock as unknown as typeof fetch;
    window.fetch = fetchMock as unknown as typeof fetch;

    const objectUrlMock = vi.fn(() => "blob:mock");
    const revokeUrlMock = vi.fn();
    window.URL.createObjectURL = objectUrlMock;
    window.URL.revokeObjectURL = revokeUrlMock;

    const anchor = document.createElement("a");
    const clickSpy = vi.spyOn(anchor, "click");
    const realCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tagName: string, options?: ElementCreationOptions) => {
        if (tagName.toLowerCase() === "a") {
          return anchor;
        }
        return realCreateElement(tagName, options);
      });

    const context: AuthContextType = {
      user: { id: 2, email: "user@test.com", isAdmin: false },
      token: "tok",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderComponent(context);

    await screen.findByText("Version 3.0");
    expect(screen.queryByText("Aperçu")).not.toBeInTheDocument();

    const downloadButton = await screen.findByRole("button", { name: "Télécharger" });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/assets/download/55",
        expect.objectContaining({ headers: { Authorization: "Bearer tok" } })
      );
    });

    expect(objectUrlMock).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeUrlMock).toHaveBeenCalled();

    createElementSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it("détecte l'aperçu grâce au displayType même sans mimetype texte", async () => {
    const fetchMock = vi.fn((request: RequestInfo, options?: RequestInit) => {
      const url = typeof request === "string" ? request : request.url;
      if (url === "/api/assets/55") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 55,
            original: "release.md",
            mimetype: "application/octet-stream",
            displayType: "Fichier Markdown",
            path: "/tmp/release.md",
            buildId: 123,
            version: "4.0",
            createdAt: new Date().toISOString(),
          }),
        } as Response);
      }
      if (url === "/api/builds/123") {
        return Promise.resolve({ ok: true, json: async () => ({ id: 123 }) } as Response);
      }
      if (url === "/api/assets/download/55") {
        return Promise.resolve({
          ok: true,
          headers: { get: () => "text/markdown" },
          text: async () => "Contenu markdown",
        } as unknown as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const context: AuthContextType = {
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderComponent(context);

    expect(await screen.findByText("Version 4.0")).toBeInTheDocument();
    expect(await screen.findByText("Contenu markdown")).toBeInTheDocument();
  });

  it("affiche \"Type inconnu\" lorsque aucune extension n'est disponible", async () => {
    const fetchMock = vi.fn((request: RequestInfo) => {
      const url = typeof request === "string" ? request : request.url;
      if (url === "/api/assets/55") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 55,
            original: "fichier",
            mimetype: "application/octet-stream",
            displayType: " ",
            size: 128,
            path: "/tmp/fichier",
            buildId: 123,
            version: null,
            createdAt: new Date().toISOString(),
          }),
        } as Response);
      }
      if (url === "/api/builds/123") {
        return Promise.resolve({ ok: true, json: async () => ({ id: 123 }) } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const context: AuthContextType = {
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderComponent(context);

    expect(await screen.findByText("Type inconnu")).toBeInTheDocument();
  });

  it("n'appelle pas l'API de suppression si l'utilisateur annule la confirmation", async () => {
    const fetchMock = vi.fn((request: RequestInfo) => {
      const url = typeof request === "string" ? request : request.url;
      if (url === "/api/assets/55") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 55,
            original: "archive.zip",
            mimetype: "application/zip",
            path: "/uploads/archive.zip",
            buildId: 123,
            version: "2.0",
            createdAt: new Date().toISOString(),
          }),
        } as Response);
      }
      if (url === "/api/builds/123") {
        return Promise.resolve({ ok: true, json: async () => ({ id: 123 }) } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });

    global.fetch = fetchMock as unknown as typeof fetch;
    window.confirm = vi.fn(() => false);

    const context: AuthContextType = {
      user: { id: 1, email: "admin@test.com", isAdmin: true },
      token: "admin-token",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderComponent(context);

    const deleteButton = await screen.findByRole("button", { name: "Supprimer" });
    fireEvent.click(deleteButton);

    expect(fetchMock).not.toHaveBeenCalledWith(
      "/api/assets/55",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("alerte l'utilisateur quand le téléchargement échoue", async () => {
    const fetchMock = vi.fn((request: RequestInfo, options?: RequestInit) => {
      const url = typeof request === "string" ? request : request.url;
      if (url === "/api/assets/55") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 55,
            original: "release.zip",
            mimetype: "application/zip",
            path: "/uploads/release.zip",
            buildId: 123,
            version: "1.0",
            createdAt: new Date().toISOString(),
          }),
        } as Response);
      }
      if (url === "/api/builds/123") {
        return Promise.resolve({ ok: true, json: async () => ({ id: 123 }) } as Response);
      }
      if (url === "/api/assets/download/55") {
        return Promise.resolve({ ok: false } as Response);
      }
      if (url === "/api/assets/55" && options?.method === "DELETE") {
        return Promise.resolve({ ok: true } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });

    global.fetch = fetchMock as unknown as typeof fetch;
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

    const context: AuthContextType = {
      user: null,
      token: null,
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderComponent(context);

    const downloadButton = await screen.findByRole("button", { name: "Télécharger" });
    fireEvent.click(downloadButton);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Erreur lors du téléchargement du fichier");
    });

    alertSpy.mockRestore();
  });
});
