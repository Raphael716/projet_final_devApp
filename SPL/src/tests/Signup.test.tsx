// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Signup from "../Signup";
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

const renderSignup = () => {
  const contextValue: AuthContextType = {
    user: null,
    token: null,
    login: mockLogin,
    logout: mockLogout,
  };

  return render(
    <AuthContext.Provider value={contextValue}>
      <MemoryRouter>
        <Signup />
      </MemoryRouter>
    </AuthContext.Provider>
  );
};

// Petite fonction utilitaire pour remplir le formulaire rapidement
const fillForm = () => {
  fireEvent.change(screen.getByLabelText(/nom d’utilisateur/i), {
    target: { value: "TestUser" },
  });
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: "test@test.com" },
  });
  fireEvent.change(screen.getByLabelText(/mot de passe/i), {
    target: { value: "password123" },
  });
};

describe("Signup Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le formulaire d'inscription avec tous les champs", () => {
    renderSignup();
    expect(
      screen.getByRole("heading", { name: /créer un compte/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/nom d’utilisateur/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /s’inscrire/i })
    ).toBeInTheDocument();
  });

  it("permet la saisie des informations utilisateur", () => {
    renderSignup();
    const nameInput = screen.getByLabelText(
      /nom d’utilisateur/i
    ) as HTMLInputElement;
    fillForm();
    expect(nameInput.value).toBe("TestUser");
  });

  it("gère une inscription réussie : API call, login et redirection", async () => {
    renderSignup();
    const fakeUser = {
      id: 50,
      username: "TestUser",
      email: "test@test.com",
      isAdmin: false,
    };
    const fakeToken = "token-inscription";

    (global.fetch as Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ user: fakeUser, token: fakeToken }),
    });

    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /s’inscrire/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/auth/register",
        expect.any(Object)
      );
    });

    expect(mockLogin).toHaveBeenCalledWith(fakeUser, fakeToken);
    expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
  });

  it("affiche une erreur si l'API rejette l'inscription (ex: email déjà pris)", async () => {
    renderSignup();

    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Cet email est déjà utilisé" }),
    });

    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /s’inscrire/i }));

    await waitFor(() => {
      const errorMsg = screen.getByText("Cet email est déjà utilisé");
      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg).toHaveClass("auth-error");
    });

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("utilise un message d'erreur par défaut si l'API ne renvoie pas de détails", async () => {
    renderSignup();

    (global.fetch as Mock).mockResolvedValue({
      ok: false,
      json: async () => ({}),
    });

    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /s’inscrire/i }));

    await waitFor(() => {
      expect(
        screen.getByText("Impossible de créer le compte")
      ).toBeInTheDocument();
    });
  });

  it("gère les erreurs réseau (fetch crash)", async () => {
    renderSignup();

    (global.fetch as Mock).mockRejectedValue(new Error("Network Error"));

    fillForm();
    fireEvent.click(screen.getByRole("button", { name: /s’inscrire/i }));

    await waitFor(() => {
      expect(screen.getByText("Erreur réseau")).toBeInTheDocument();
    });
  });
});
