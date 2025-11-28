import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { useContext } from "react";
import { AuthContext, type AppUser } from "../AuthContext";
import { AuthProvider } from "../AuthProvider";

// Test component to access AuthContext
function TestConsumer() {
  const { user, token, login, logout } = useContext(AuthContext);
  return (
    <div>
      <span data-testid="user">{user ? JSON.stringify(user) : "null"}</span>
      <span data-testid="token">{token ?? "null"}</span>
      <button
        onClick={() =>
          login(
            { id: 1, username: "testuser", email: "test@example.com", isAdmin: false },
            "test-token"
          )
        }
      >
        Login
      </button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("should provide initial null values", () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId("user")).toHaveTextContent("null");
    expect(screen.getByTestId("token")).toHaveTextContent("null");
  });

  it("should update user and token on login", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Login"));
    });

    const userText = screen.getByTestId("user").textContent;
    expect(userText).toContain("testuser");
    expect(userText).toContain("test@example.com");
    expect(screen.getByTestId("token")).toHaveTextContent("test-token");
  });

  it("should persist user and token to localStorage on login", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Login"));
    });

    expect(localStorage.getItem("auth_token")).toBe("test-token");
    const storedUser = JSON.parse(localStorage.getItem("auth_user") || "{}");
    expect(storedUser.username).toBe("testuser");
    expect(storedUser.email).toBe("test@example.com");
  });

  it("should clear user and token on logout", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // First login
    await act(async () => {
      fireEvent.click(screen.getByText("Login"));
    });

    expect(screen.getByTestId("token")).toHaveTextContent("test-token");

    // Then logout
    await act(async () => {
      fireEvent.click(screen.getByText("Logout"));
    });

    expect(screen.getByTestId("user")).toHaveTextContent("null");
    expect(screen.getByTestId("token")).toHaveTextContent("null");
  });

  it("should remove localStorage items on logout", async () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // First login
    await act(async () => {
      fireEvent.click(screen.getByText("Login"));
    });

    expect(localStorage.getItem("auth_token")).toBe("test-token");

    // Then logout
    await act(async () => {
      fireEvent.click(screen.getByText("Logout"));
    });

    expect(localStorage.getItem("auth_token")).toBeNull();
    expect(localStorage.getItem("auth_user")).toBeNull();
  });

  it("should restore user from localStorage on mount", async () => {
    const storedUser: AppUser = {
      id: 2,
      username: "storeduser",
      email: "stored@example.com",
      isAdmin: true,
    };
    localStorage.setItem("auth_user", JSON.stringify({ ...storedUser, admin: 1 }));
    localStorage.setItem("auth_token", "stored-token");

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    // Wait for useEffect to run
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const userText = screen.getByTestId("user").textContent;
    expect(userText).toContain("storeduser");
    expect(screen.getByTestId("token")).toHaveTextContent("stored-token");
  });

  it("should handle invalid localStorage data gracefully", async () => {
    localStorage.setItem("auth_user", "invalid-json");
    localStorage.setItem("auth_token", "some-token");

    // Should not throw
    expect(() => {
      render(
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      );
    }).not.toThrow();
  });
});
