import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Builds from "../Builds";
import {
  AuthContext,
  type AuthContextType,
  type AppUser,
} from "../AuthContext";

// Mock de fetch global typé
global.fetch = vi.fn();

// Mock de window.confirm
global.confirm = vi.fn(() => true);

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Données de test
const mockBuilds = [
  {
    id: 1,
    nom: "Logiciel Alpha",
    description: "Description test",
    version: "v1.0",
    statut: "Production",
    proprietaire: "Dev Team",
    updatedAt: new Date().toISOString(),
  },
];

// Correction ici : on type user avec AppUser | null
const renderBuilds = (user: AppUser | null) => {
  const contextValue: AuthContextType = {
    user: user,
    token: user ? "fake-token" : null,
    login: vi.fn(),
    logout: vi.fn(),
  };

  return render(
    <AuthContext.Provider value={contextValue}>
      <MemoryRouter>
        <Builds />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe("Builds Page Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche la liste des builds récupérée via l'API", async () => {
    // Cast explicite en Mock pour éviter l'erreur TypeScript
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBuilds,
    });

    renderBuilds({
      id: 1,
      username: "User",
      email: "u@test.com",
      isAdmin: false,
    });

    expect(screen.getByText("Chargement...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Logiciel Alpha")).toBeInTheDocument();
      expect(screen.getByText("Production")).toBeInTheDocument();
    });
  });

  it("affiche les boutons d'admin (Modifier/Archiver) seulement si l'utilisateur est admin", async () => {
    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => mockBuilds,
    });

    // Cas NON ADMIN
    const { unmount } = renderBuilds({
      id: 1,
      username: "User",
      email: "u@test.com",
      isAdmin: false,
    });
    await waitFor(() => screen.getByText("Logiciel Alpha"));
    expect(screen.queryByText("Archiver")).not.toBeInTheDocument();
    unmount();

    // Cas ADMIN
    renderBuilds({
      id: 2,
      username: "Admin",
      email: "a@test.com",
      isAdmin: true,
    });
    await waitFor(() => screen.getByText("Logiciel Alpha"));
    expect(screen.getByText("Archiver")).toBeInTheDocument();
  });

  it("permet à un admin d'archiver (supprimer) un build", async () => {
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockBuilds,
    });

    // Mock de la réponse DELETE
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
    });

    renderBuilds({
      id: 2,
      username: "Admin",
      email: "a@test.com",
      isAdmin: true,
    });

    await waitFor(() => screen.getByText("Logiciel Alpha"));

    const deleteBtn = screen.getByText("Archiver");
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/builds/1",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    expect(screen.queryByText("Logiciel Alpha")).not.toBeInTheDocument();
  });
});
