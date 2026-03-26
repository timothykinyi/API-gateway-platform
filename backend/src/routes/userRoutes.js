// routes/userRoutes.js
const express = require("express");
const {
  createUser,
  getUsers,
  getUserById,
} = require("../controllers/userController");

const router = express.Router();

router.post("/register", createUser);
router.get("/", getUsers);
router.get("/:id", getUserById);

module.exports = router;