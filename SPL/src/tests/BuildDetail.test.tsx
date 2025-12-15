import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import BuildDetail from "../BuildDetail";
import { AuthContext, type AuthContextType } from "../AuthContext";

const adminContext: AuthContextType = {
  user: { id: 1, email: "admin@test.com", isAdmin: true, username: "Admin" },
  token: "admin-token",
  login: vi.fn(),
  logout: vi.fn(),
};

const renderWithRouter = (initialEntry = "/builds/5") =>
  render(
    <AuthContext.Provider value={adminContext}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/builds/:id" element={<BuildDetail />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe("BuildDetail", () => {
  const originalFetch = global.fetch;
  const originalConfirm = window.confirm;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    window.confirm = originalConfirm;
  });

  it("affiche le build et trie les assets en utilisant le token", async () => {
    const buildResponse = {
      ok: true,
      json: async () => ({
        id: 5,
        nom: "Logiciel QA",
        description: "Desc",
        version: "v2.0.0",
        statut: "Production",
        proprietaire: "Equipe",
        updatedAt: new Date("2024-01-02").toISOString(),
      }),
    } as Response;

    const assetsResponse = {
      ok: true,
      json: async () => [
        {
          id: 20,
          original: "ancien.zip",
          version: "v1.0.0",
          size: 512,
          createdAt: new Date("2024-01-01").toISOString(),
        },
        {
          id: 21,
          original: "feature.zip",
          version: "v2.0.0",
          size: 1024,
          createdAt: new Date("2024-02-01").toISOString(),
        },
      ],
    } as Response;

    const fetchMock = vi
      .fn()
      .mockImplementation((url: RequestInfo, options?: RequestInit) => {
        if (url === "/api/builds/5") {
          return Promise.resolve(buildResponse);
        }
        if (url === "/api/assets/build/5") {
          expect(options?.headers).toMatchObject({
            Authorization: "Bearer admin-token",
          });
          return Promise.resolve(assetsResponse);
        }
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      });

    global.fetch = fetchMock as unknown as typeof global.fetch;

    renderWithRouter();

    await screen.findByRole("heading", { name: "Logiciel QA" });

    await waitFor(() => {
      const assetItems = document.querySelectorAll(".asset-item");
      expect(assetItems.length).toBe(2);
      expect(assetItems[0].textContent).toContain("v2.0.0");
      expect(assetItems[0].textContent).toContain("feature.zip");
      expect(assetItems[1].textContent).toContain("ancien.zip");
    });
  });

  it("permet à un admin de supprimer un fichier", async () => {
    const buildResponse = {
      ok: true,
      json: async () => ({
        id: 5,
        nom: "Logiciel QA",
        updatedAt: new Date().toISOString(),
      }),
    } as Response;

    const assetsResponse = {
      ok: true,
      json: async () => [
        {
          id: 99,
          original: "release.zip",
          version: "v1.0.0",
          size: 1024,
          createdAt: new Date().toISOString(),
        },
      ],
    } as Response;

    const fetchMock = vi
      .fn()
      .mockImplementation((url: RequestInfo, options?: RequestInit) => {
        if (url === "/api/builds/5") return Promise.resolve(buildResponse);
        if (url === "/api/assets/build/5") return Promise.resolve(assetsResponse);
        if (url === "/api/assets/99" && options?.method === "DELETE") {
          expect(options.headers).toMatchObject({
            Authorization: "Bearer admin-token",
          });
          return Promise.resolve({ ok: true } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      });
    global.fetch = fetchMock as unknown as typeof global.fetch;

    window.confirm = vi.fn(() => true);

    renderWithRouter();

    const deleteButton = await screen.findByRole("button", {
      name: "Supprimer",
    });
    deleteButton.click();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/assets/99",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    await waitFor(() => {
      expect(screen.queryByText("release.zip")).toBeNull();
    });
  });

  it("affiche un message quand aucun fichier n'est disponible", async () => {
    const fetchMock = vi.fn((url: RequestInfo) => {
      if (url === "/api/builds/5") {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: 5,
            nom: "Logiciel QA",
            version: null,
            statut: "En développement",
            proprietaire: "Equipe",
            updatedAt: new Date().toISOString(),
          }),
        } as Response);
      }
      if (url === "/api/assets/build/5") {
        return Promise.resolve({ ok: true, json: async () => [] } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    renderWithRouter();

    await screen.findByRole("heading", { name: "Logiciel QA" });
    expect(
      await screen.findByText("Aucun fichier pour cette version.")
    ).toBeInTheDocument();
  });

});
