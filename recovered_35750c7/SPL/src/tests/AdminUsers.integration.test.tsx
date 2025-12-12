import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminUsers from "../AdminUsers";
import { AuthContext } from "../AuthContext";

global.fetch = vi.fn();
vi.spyOn(window, "confirm").mockImplementation(() => true);

describe("AdminUsers Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderAdminUsers = () => {
    return render(
      <AuthContext.Provider
        value={{
          user: { id: 1, username: "Admin", email: "a@a.com", isAdmin: true },
          token: "admin-token",
          login: vi.fn(),
          logout: vi.fn(),
        }}
      >
        <MemoryRouter>
          <AdminUsers />
        </MemoryRouter>
      </AuthContext.Provider>
    );
  };

  it("charge et affiche la liste des utilisateurs", async () => {
    const mockUsers = [
      { id: 1, username: "Admin", email: "admin@test.com", admin: 1 },
      { id: 2, username: "UserStandard", email: "user@test.com", admin: 0 },
    ];

    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    renderAdminUsers();

    expect(screen.getByText("Chargement...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("UserStandard")).toBeInTheDocument();
      expect(screen.getByText("user@test.com")).toBeInTheDocument();
    });
  });

  it("gère la suppression d'un utilisateur", async () => {
    const mockUsers = [
      { id: 99, username: "To Delete", email: "del@test.com", admin: 0 },
    ];

    // Mock chargement initial
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockUsers,
    });

    // Mock requête DELETE
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
    });

    renderAdminUsers();

    await waitFor(() => screen.getByText("To Delete"));

    // Ici, pas de getByName, on utilise le texte du bouton
    const deleteBtn = screen.getByText("Supprimer");
    fireEvent.click(deleteBtn);

    expect(window.confirm).toHaveBeenCalled();

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/users/99",
        expect.objectContaining({
          method: "DELETE",
          headers: { Authorization: "Bearer admin-token" },
        })
      );
    });

    expect(screen.queryByText("To Delete")).not.toBeInTheDocument();
  });
});
