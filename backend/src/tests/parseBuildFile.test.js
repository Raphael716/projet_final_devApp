import { describe, it, expect, vi, beforeEach } from "vitest";

// Hoisted mock helpers to allow changing callback behavior per test
const { multerFactory, setCallback, MulterError } = vi.hoisted(() => {
  let cb = null;

  class _MulterError extends Error {}

  const factory = (opts) => {
    return {
      single: (field) => (req, res, cbfn) => {
        cbfn(cb);
      },
    };
  };

  factory.diskStorage = () => ({});
  factory.MulterError = _MulterError;

  return {
    multerFactory: factory,
    setCallback: (v) => (cb = v),
    MulterError: _MulterError,
  };
});

// Mock multer before importing the controller
vi.mock("multer", () => {
  const f = multerFactory;
  return { default: f, ...f };
});

import * as buildController from "../controllers/buildController.js";

describe("parseBuildFile middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCallback(null);
  });

  it("calls next when content-type is not multipart", () => {
    const req = { headers: {} };
    const res = {};
    const next = vi.fn();

    buildController.parseBuildFile(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("calls next when multer has no error", () => {
    setCallback(null);
    const req = { headers: { "content-type": "multipart/form-data; boundary=---" } };
    const res = {};
    const next = vi.fn();

    buildController.parseBuildFile(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it("returns 400 when file too large (MulterError LIMIT_FILE_SIZE)", () => {
    const err = new MulterError("too big");
    err.code = "LIMIT_FILE_SIZE";
    setCallback(err);

    const req = { headers: { "content-type": "multipart/form-data; boundary=---" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    buildController.parseBuildFile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it("returns 400 for generic upload error", () => {
    const err = new Error("boom");
    setCallback(err);

    const req = { headers: { "content-type": "multipart/form-data; boundary=---" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();

    buildController.parseBuildFile(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });
});
