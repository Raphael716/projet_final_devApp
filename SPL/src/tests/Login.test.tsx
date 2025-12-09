// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "../Login";
import { AuthContext, type AuthContextType } from "../AuthContext";

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

global.fetch = vi.fn();

const mockLogin = vi.fn();
const mockLogout = vi.fn();

const renderLogin = () => {
  const contextValue: AuthContextType = {
    user: null,
    token: null,
    login: mockLogin,
    logout: mockLogout,
  };

  return render(
    <AuthContext.Provider value={contextValue}>
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

describe("Login Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le formulaire de connexion avec les champs vides", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", { name: /connexion/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /se connecter/i })
    ).toBeInTheDocument();

    const signupLink = screen.getByRole("link", { name: /s'inscrire/i });
    expect(signupLink).toBeInTheDocument();
    expect(signupLink).toHaveAttribute("href", "/signup");
  });

  it("permet à l'utilisateur de saisir son email et mot de passe", () => {
    renderLogin();
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = screen.getByLabelText(
      /mot de passe/i
    ) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: "test@exemple.com" } });
    fireEvent.change(passwordInput, { target: { value: "secret123" } });

    expect(emailInput.value).toBe("test@exemple.com");
    expect(passwordInput.value).toBe("secret123");
  });

  it("gère une connexion réussie : appel API, update contexte et redirection", async () => {
    renderLogin();

    // Simulation d'une réponse API positive
    const fakeUser = {
      id: 10,
      email: "test@exemple.com",
      username: "Tester",
      isAdmin: 1,
    };
    const fakeToken = "jwt-token-xyz";

    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ user: fakeUser, token: fakeToken }),
    });

    // Remplissage du formulaire
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@exemple.com" },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: "secret123" },
    });

    const submitButton = screen.getByRole("button", { name: /se connecter/i });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent("Connexion...");

    await waitFor(() => {
      // Vérifie l'appel API correct
      expect(global.fetch).toHaveBeenCalledWith("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test@exemple.com",
          password: "secret123",
        }),
      });
    });

    // Vérifie que la fonction login du contexte est appelée avec les bonnes données transformées
    expect(mockLogin).toHaveBeenCalledWith(
      {
        id: 10,
        email: "test@exemple.com",
        username: "Tester",
        isAdmin: true,
      },
      fakeToken
    );

    // Vérifie la redirection vers la racine
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("affiche un message d'erreur si l'API rejette les identifiants", async () => {
    renderLogin();

    // Simulation d'une réponse API négative (400/401)
    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Email ou mot de passe incorrect" }),
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "bad@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: "wrongpass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    // Attendre l'affichage de l'erreur
    await waitFor(() => {
      const errorDiv = screen.getByText("Email ou mot de passe incorrect");
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv).toHaveClass("auth-error");
    });

    // S'assurer que login n'a PAS été appelé
    expect(mockLogin).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("gère les erreurs réseau (API inaccessible)", async () => {
    renderLogin();

    // Simulation d'un crash réseau
    (global.fetch as Mock).mockRejectedValue(new Error("Network Error"));

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "a@b.com" },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText("Erreur réseau")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /se connecter/i })
    ).not.toBeDisabled();
  });

  it("utilise le message d'erreur par défaut si l'API ne renvoie pas de détails", async () => {
    renderLogin();

    // Simulation : Erreur 400 mais corps vide ou sans champ 'error'
    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      // Vérifie que le fallback "Identifiants invalides" est utilisé
      expect(screen.getByText("Identifiants invalides")).toBeInTheDocument();
    });
  });

  it("gère la compatibilité des champs admin (fallback sur data.user.admin ou 0)", async () => {
    renderLogin();

    const userLegacy = {
      id: 11,
      email: "vieux@test.com",
      username: "Old",
      admin: 1,
    };
    const userStandard = { id: 12, email: "std@test.com", username: "Std" };

    // Test 1 : Cas 'admin' (legacy)
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: userLegacy, token: "tok1" }),
    });

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "vieux@test.com" },
    });
    fireEvent.change(screen.getByLabelText(/mot de passe/i), {
      target: { value: "pass" },
    });
    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ isAdmin: true }),
        "tok1"
      );
    });

    // Test 2 : Cas par défaut (0)
    (global.fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: userStandard, token: "tok2" }),
    });

    fireEvent.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({ isAdmin: false }),
        "tok2"
      );
    });
  });
});
