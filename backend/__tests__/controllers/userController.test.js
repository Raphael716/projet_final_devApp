const mockPrisma = require("../setup");

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe("UserController", () => {
  let userController;
  let mockReq;
  let mockRes;

  beforeAll(() => {
    userController = require("../../src/controllers/userController");
  });

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      headers: {},
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe("getAllUsers", () => {
    it("should return all users successfully", async () => {
      const mockUsers = [
        { id: 1, username: "user1", email: "user1@test.com", admin: 0 },
        { id: 2, username: "user2", email: "user2@test.com", admin: 1 },
      ];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      await userController.getAllUsers(mockReq, mockRes);

      expect(mockPrisma.user.findMany).toHaveBeenCalledWith({
        select: { id: true, username: true, email: true, admin: true },
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockUsers);
    });

    it("should return 500 error on database failure", async () => {
      mockPrisma.user.findMany.mockRejectedValue(new Error("Database error"));

      await userController.getAllUsers(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Impossible de récupérer les utilisateurs",
      });
    });
  });

  describe("getUserById", () => {
    it("should return a user by id", async () => {
      const mockUser = { id: 1, username: "testuser", email: "test@test.com", admin: 0 };
      mockReq.params.id = "1";
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await userController.getUserById(mockReq, mockRes);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: { id: true, username: true, email: true, admin: true },
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockUser);
    });

    it("should return 404 if user not found", async () => {
      mockReq.params.id = "999";
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await userController.getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Utilisateur non trouvé" });
    });

    it("should return 500 on database error", async () => {
      mockReq.params.id = "1";
      mockPrisma.user.findUnique.mockRejectedValue(new Error("DB Error"));

      await userController.getUserById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Impossible de récupérer l'utilisateur",
      });
    });
  });

  describe("createUser", () => {
    it("should create a new user successfully", async () => {
      const newUserData = {
        username: "newuser",
        email: "new@test.com",
        password: "password123",
        admin: 0,
      };
      const createdUser = {
        id: 1,
        ...newUserData,
        password: "hashedPassword",
      };

      mockReq.body = newUserData;
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(createdUser);

      await userController.createUser(mockReq, mockRes);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: newUserData.email },
      });
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("should return 400 if email already exists", async () => {
      mockReq.body = {
        username: "existinguser",
        email: "existing@test.com",
        password: "password123",
      };
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: "existing@test.com" });

      await userController.createUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Email déjà utilisé" });
    });
  });

  describe("updateUser", () => {
    it("should update a user successfully", async () => {
      const updatedUser = {
        id: 1,
        username: "updateduser",
        email: "updated@test.com",
        admin: 1,
        password: "hashedPw",
      };
      mockReq.params.id = "1";
      mockReq.body = { username: "updateduser", email: "updated@test.com", admin: 1 };
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      await userController.updateUser(mockReq, mockRes);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { username: "updateduser", email: "updated@test.com", admin: 1 },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        id: 1,
        username: "updateduser",
        email: "updated@test.com",
        admin: 1,
      });
    });

    it("should return 500 on update failure", async () => {
      mockReq.params.id = "1";
      mockReq.body = { username: "test" };
      mockPrisma.user.update.mockRejectedValue(new Error("Update failed"));

      await userController.updateUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Impossible de modifier l'utilisateur",
      });
    });
  });

  describe("deleteUser", () => {
    it("should delete a user successfully", async () => {
      mockReq.params.id = "1";
      mockPrisma.user.delete.mockResolvedValue({ id: 1 });

      await userController.deleteUser(mockReq, mockRes);

      expect(mockPrisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Utilisateur supprimé avec succès",
      });
    });

    it("should return 500 on delete failure", async () => {
      mockReq.params.id = "1";
      mockPrisma.user.delete.mockRejectedValue(new Error("Delete failed"));

      await userController.deleteUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Impossible de supprimer l'utilisateur",
      });
    });
  });

  describe("registerUser", () => {
    it("should register a new user successfully", async () => {
      const newUser = {
        id: 1,
        username: "newuser",
        email: "new@test.com",
        password: "hashedPassword",
        admin: 0,
      };
      mockReq.body = {
        username: "newuser",
        email: "new@test.com",
        password: "password123",
      };
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue(newUser);

      await userController.registerUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            id: 1,
            username: "newuser",
            email: "new@test.com",
          }),
          token: expect.any(String),
        })
      );
    });

    it("should return 400 if email already exists", async () => {
      mockReq.body = {
        username: "existinguser",
        email: "existing@test.com",
        password: "password123",
      };
      mockPrisma.user.findUnique.mockResolvedValue({ id: 1, email: "existing@test.com" });

      await userController.registerUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Email déjà utilisé" });
    });
  });

  describe("loginUser", () => {
    it("should return 400 for non-existent email", async () => {
      mockReq.body = { email: "nonexistent@test.com", password: "password123" };
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await userController.loginUser(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Email ou mot de passe incorrect",
      });
    });
  });
});
