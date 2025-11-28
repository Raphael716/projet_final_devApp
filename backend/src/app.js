const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Augmenter les timeouts
app.use((req, res, next) => {
  res.setTimeout(120000);
  next();
});

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const buildRoutes = require("./routes/buildRoutes");
const assetRoutes = require("./routes/assetRoutes");
app.use("/api/builds", buildRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);

// Serve uploads folder (optional, downloads use controlled endpoint)
app.use("/uploads", express.static("uploads"));

// Route racine
app.get("/", (req, res) => {
  res.json({ message: "Backend Express en marche 🚀" });
});

module.exports = app;
