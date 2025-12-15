import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import EditUser from "../EditUser";
import { AuthContext, type AuthContextType } from "../AuthContext";

const mockNavigate = vi.fn();
const mockUseParams = vi.fn(() => ({ id: "7" }));
vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockUseParams(),
  };
});

const renderComponent = (context: AuthContextType) =>
  render(
    <AuthContext.Provider value={context}>
      <MemoryRouter initialEntries={["/admin/users/7/edit"]}>
        <Routes>
          <Route path="/admin/users/:id/edit" element={<EditUser />} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>
  );

describe("EditUser", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ id: "7" });
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("charge l'utilisateur et envoie la mise à jour", async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation((url: RequestInfo, options?: RequestInit) => {
        if (url === "/api/users/7" && (!options || !options.method)) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 7, username: "Alice", email: "a@test.com", admin: 0 }),
          } as Response);
        }
        if (url === "/api/users/7" && options?.method === "PUT") {
          expect(options.headers).toMatchObject({
            "Content-Type": "application/json",
            Authorization: "Bearer admin-token",
          });
          expect(options.body).toContain("\"admin\":1");
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

    const nameInput = await screen.findByDisplayValue("Alice");
    fireEvent.change(nameInput, { target: { value: "Alice Updated" } });
    fireEvent.change(screen.getByLabelText(/Admin/i), {
      target: { value: "1" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/users/7",
        expect.objectContaining({ method: "PUT" })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
  });

  it("n'appelle pas l'API lorsqu'aucun identifiant n'est fourni", () => {
    mockUseParams.mockReturnValue({});

    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const context: AuthContextType = {
      user: { id: 1, email: "admin@test.com", isAdmin: true },
      token: "admin-token",
      login: vi.fn(),
      logout: vi.fn(),
    };

    renderComponent(context);

    fireEvent.submit(screen.getByRole("button", { name: /Enregistrer/i }).closest("form")!);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("affiche l'état d'enregistrement pendant l'appel réseau", async () => {
    let resolvePut: ((value: Response) => void) | null = null;
    const putPromise = new Promise<Response>((resolve) => {
      resolvePut = resolve;
    });

    const fetchMock = vi
      .fn()
      .mockImplementation((url: RequestInfo, options?: RequestInit) => {
        if (url === "/api/users/7" && (!options || !options.method)) {
          return Promise.resolve({
            ok: true,
            json: async () => ({ id: 7, username: "Alice", email: "a@test.com", admin: 0 }),
          } as Response);
        }
        if (url === "/api/users/7" && options?.method === "PUT") {
          return putPromise;
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

    await screen.findByDisplayValue("Alice");
    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));

    expect(screen.getByRole("button", { name: /Enregistrement.../i })).toBeDisabled();

    resolvePut?.({ ok: true } as Response);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/admin/users");
    });
  });
});
