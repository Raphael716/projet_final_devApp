const request = require("supertest");
const mockPrisma = require("../setup");

// Must import app after mocks are set up
let app;

beforeAll(() => {
  app = require("../../src/app");
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Auth Routes Integration Tests", () => {
  describe("POST /api/auth/register", () => {
    it("should register a new user successfully", async () => {
      const newUser = {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        password: "hashedPassword",
        admin: 0,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(newUser);

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser",
          email: "test@example.com",
          password: "password123",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user).toHaveProperty("email", "test@example.com");
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("should return 400 if email already exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: "existing@example.com" });

      const response = await request(app)
        .post("/api/auth/register")
        .send({
          username: "testuser",
          email: "existing@example.com",
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Email déjà utilisé");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should return 400 for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Email ou mot de passe incorrect");
    });
  });
});

describe("User Routes Integration Tests", () => {
  describe("GET /api/users", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/users");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Non autorisé : token manquant");
    });
  });

  describe("POST /api/users", () => {
    it("should create a new user", async () => {
      const newUser = {
        id: 1,
        username: "newuser",
        email: "new@example.com",
        password: "hashedPassword",
        admin: 0,
      };

      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(newUser);

      const response = await request(app)
        .post("/api/users")
        .send({
          username: "newuser",
          email: "new@example.com",
          password: "password123",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("email", "new@example.com");
      expect(response.body).not.toHaveProperty("password");
    });

    it("should return 400 if email already exists", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: "existing@example.com" });

      const response = await request(app)
        .post("/api/users")
        .send({
          username: "testuser",
          email: "existing@example.com",
          password: "password123",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error", "Email déjà utilisé");
    });
  });
});

describe("Root Route", () => {
  it("GET / should return welcome message", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("message", "Backend Express en marche 🚀");
  });
});
