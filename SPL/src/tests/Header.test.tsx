import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Header from "../Header";

import { AuthContext } from "../AuthContext";
import type { AuthContextType, AppUser } from "../AuthContext";

//Définition du Mock pour AuthContext
const mockLogout = vi.fn();
const mockLogin = vi.fn();

const mockAuthContextValue = (
  token: string | null,
  user: AppUser | null
): AuthContextType => ({
  user,
  token,
  logout: mockLogout,
  login: mockLogin,
});

const defaultUser: AppUser = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  isAdmin: false,
};

const adminUser: AppUser = {
  id: 2,
  username: "adminuser",
  email: "admin@example.com",
  isAdmin: true,
};

// Fonction utilitaire pour le rendu du composant
const renderHeader = (contextValue: AuthContextType) => {
  return render(
    <AuthContext.Provider value={contextValue}>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche les liens de connexion et inscription lorsque l'utilisateur n'est PAS authentifié", () => {
    const context = mockAuthContextValue(null, null);
    renderHeader(context);

    // Liens publics
    expect(screen.getByText("Connexion")).toBeInTheDocument();
    expect(screen.getByText("Inscription")).toBeInTheDocument();

    // Éléments privés ne devraient pas être là
    expect(screen.queryByText("Builds")).not.toBeInTheDocument();
    expect(screen.queryByText("Déconnexion")).not.toBeInTheDocument();
    expect(screen.queryByText("Utilisateurs")).not.toBeInTheDocument();
  });

  it("affiche les liens standard et le nom d'utilisateur (non-admin)", () => {
    const context = mockAuthContextValue("mock-token", defaultUser);
    renderHeader(context);

    // Liens authentifiés
    expect(screen.getByText("Builds")).toBeInTheDocument();
    expect(screen.getByText("Déconnexion")).toBeInTheDocument();
    expect(screen.getByText("testuser")).toBeInTheDocument();

    // Le lien admin ne doit pas être présent
    expect(screen.queryByText("Utilisateurs")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it('affiche le lien "Utilisateurs" et le badge "Admin" pour un administrateur', () => {
    const context = mockAuthContextValue("mock-token", adminUser);
    renderHeader(context);

    // Le lien admin DOIT être présent
    expect(screen.getByText("Utilisateurs")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("adminuser")).toBeInTheDocument();
  });

  it("appelle la fonction logout lors du clic sur le bouton Déconnexion", () => {
    const context = mockAuthContextValue("mock-token", defaultUser);
    renderHeader(context);

    const logoutButton = screen.getByRole("button", { name: /Déconnexion/i });
    fireEvent.click(logoutButton);

    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("affiche l'email si le nom d'utilisateur n'est pas défini", () => {
    const userNoName = {
      id: 3,
      username: undefined,
      email: "emailonly@test.com",
      isAdmin: false,
    };
    const context = mockAuthContextValue("mock-token", userNoName);
    renderHeader(context);

    // Vérifie que c'est bien l'email qui s'affiche
    expect(screen.getByText("emailonly@test.com")).toBeInTheDocument();
  });
});
