import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AuthContext, type AuthContextType, type AppUser } from "../AuthContext";
import Header from "../Header";

const mockLogout = vi.fn();

const renderHeader = (contextValue: AuthContextType) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={contextValue}>
        <Header />
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe("Header", () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  describe("when user is not logged in", () => {
    it("should render logo and login/signup links", () => {
      const contextValue: AuthContextType = {
        user: null,
        token: null,
        login: vi.fn(),
        logout: mockLogout,
      };

      renderHeader(contextValue);

      expect(screen.getByText("Software Production Line")).toBeInTheDocument();
      expect(screen.getByText("Connexion")).toBeInTheDocument();
      expect(screen.getByText("Inscription")).toBeInTheDocument();
    });

    it("should not show logout button", () => {
      const contextValue: AuthContextType = {
        user: null,
        token: null,
        login: vi.fn(),
        logout: mockLogout,
      };

      renderHeader(contextValue);

      expect(screen.queryByText("Déconnexion")).not.toBeInTheDocument();
    });

    it("should not show Builds link", () => {
      const contextValue: AuthContextType = {
        user: null,
        token: null,
        login: vi.fn(),
        logout: mockLogout,
      };

      renderHeader(contextValue);

      expect(screen.queryByText("Builds")).not.toBeInTheDocument();
    });
  });

  describe("when user is logged in (regular user)", () => {
    const regularUser: AppUser = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      isAdmin: false,
    };

    it("should render user name and logout button", () => {
      const contextValue: AuthContextType = {
        user: regularUser,
        token: "test-token",
        login: vi.fn(),
        logout: mockLogout,
      };

      renderHeader(contextValue);

      expect(screen.getByText("testuser")).toBeInTheDocument();
      expect(screen.getByText("Déconnexion")).toBeInTheDocument();
    });

    it("should show Builds link", () => {
      const contextValue: AuthContextType = {
        user: regularUser,
        token: "test-token",
        login: vi.fn(),
        logout: mockLogout,
      };

      renderHeader(contextValue);

      expect(screen.getByText("Builds")).toBeInTheDocument();
    });

    it("should not show Admin badge or Users link", () => {
      const contextValue: AuthContextType = {
        user: regularUser,
        token: "test-token",
        login: vi.fn(),
        logout: mockLogout,
      };

      renderHeader(contextValue);

      expect(screen.queryByText("Admin")).not.toBeInTheDocument();
      expect(screen.queryByText("Utilisateurs")).not.toBeInTheDocument();
    });

    it("should call logout when clicking logout button", () => {
      const contextValue: AuthContextType = {
        user: regularUser,
        token: "test-token",
        login: vi.fn(),
        logout: mockLogout,
      };

      renderHeader(contextValue);

      fireEvent.click(screen.getByText("Déconnexion"));
      expect(mockLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe("when user is logged in (admin user)", () => {
    const adminUser: AppUser = {
      id: 2,
      username: "adminuser",
      email: "admin@example.com",
      isAdmin: true,
    };

    it("should show Admin badge", () => {
      const contextValue: AuthContextType = {
        user: adminUser,
        token: "test-token",
        login: vi.fn(),
        logout: mockLogout,
      };

      renderHeader(contextValue);

      expect(screen.getByText("Admin")).toBeInTheDocument();
    });

    it("should show Users link for admin", () => {
      const contextValue: AuthContextType = {
        user: adminUser,
        token: "test-token",
        login: vi.fn(),
        logout: mockLogout,
      };

      renderHeader(contextValue);

      expect(screen.getByText("Utilisateurs")).toBeInTheDocument();
    });
  });

  describe("when user has no username", () => {
    it("should display email instead", () => {
      const userWithoutUsername: AppUser = {
        id: 3,
        email: "noname@example.com",
        isAdmin: false,
      };

      const contextValue: AuthContextType = {
        user: userWithoutUsername,
        token: "test-token",
        login: vi.fn(),
        logout: mockLogout,
      };

      renderHeader(contextValue);

      expect(screen.getByText("noname@example.com")).toBeInTheDocument();
    });
  });
});
