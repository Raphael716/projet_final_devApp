// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import EditBuild from "../EditBuild";
import { AuthContext, type AuthContextType } from "../AuthContext";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderComponent = (context: AuthContextType, initialEntry = "/builds/42/edit") =>
  render(
    <AuthContext.Provider value={context}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/builds/:id/edit" element={<EditBuild />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe("EditBuild", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("bloque l'accès aux non-admins", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({ ok: true, json: async () => ({}) } as Response)
    );

    const context: AuthContextType = {
      user: { id: 2, email: "user@test.com", isAdmin: false },
      token: "tok",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderComponent(context);

    await screen.findByText("Accès réservé aux administrateurs.");
  });

  it("charge les données du build et envoie la mise à jour", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((url: RequestInfo, options?: RequestInit) => {
        if (url === "/api/builds/42" && !options) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              id: 42,
              nom: "Logiciel",
              version: "1.0",
              statut: "En test",
              proprietaire: "QA",
            }),
          } as Response);
        }
        if (url === "/api/builds/42" && options?.method === "PUT") {
          expect(options.headers).toMatchObject({
            "Content-Type": "application/json",
            Authorization: "Bearer admin-token",
          });
          expect(options.body).toContain("\"version\":\"2.0\"");
          return Promise.resolve({ ok: true } as Response);
        }
        return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const context: AuthContextType = {
      user: { id: 1, email: "admin@test.com", isAdmin: true },
      token: "admin-token",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderComponent(context);

    const versionInput = await screen.findByDisplayValue("1.0");
    fireEvent.change(versionInput, { target: { value: "2.0" } });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/builds/42",
        expect.objectContaining({ method: "PUT" })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/builds");
  });

  it("affiche l'état de chargement pendant la récupération", () => {
    global.fetch = vi.fn(() => new Promise(() => {})) as unknown as typeof fetch;

    const context: AuthContextType = {
      user: { id: 1, email: "admin@test.com", isAdmin: true },
      token: "admin-token",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderComponent(context);

    expect(screen.getByText("Chargement...")).toBeInTheDocument();
  });

  it("affiche un message d'erreur quand la mise à jour échoue", async () => {
    const fetchMock = vi.fn((url: RequestInfo, options?: RequestInit) => {
      if (url === "/api/builds/42" && !options) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ id: 42, nom: "Logiciel" }),
        } as Response);
      }
      if (url === "/api/builds/42" && options?.method === "PUT") {
          return Promise.resolve({ ok: false } as Response);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as Response);
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const context: AuthContextType = {
      user: { id: 1, email: "admin@test.com", isAdmin: true },
      token: "admin-token",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderComponent(context);

    const nameInput = await screen.findByDisplayValue("Logiciel");
    fireEvent.change(nameInput, { target: { value: "Logiciel 2" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    expect(
      await screen.findByText("Erreur lors de la mise à jour")
    ).toBeInTheDocument();
  });
});
