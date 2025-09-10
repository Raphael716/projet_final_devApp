const express = require("express");
const router = express.Router();
const { getUsers } = require("../controllers/userController");

// Exemple route GET
router.get("/", getUsers);

module.exports = router;
