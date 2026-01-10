const express = require("express");
const router = express.Router();
const {
  registerUser,
  authUser,
  addSubAdmin,
  getSubAdmins,
  deleteSubAdmin,
  getSubAdminCount,
  changeSubAdminPassword,
} = require("../controllers/userController");
const { protect, superadmin } = require("../middleware/authMiddleware"); // Will create this middleware

router.post("/register", registerUser);
router.post("/login", authUser);
router.post("/subadmin", protect, superadmin, addSubAdmin); // Protected route
router.get("/subadmins", protect, superadmin, getSubAdmins); // New route to get sub-admins
router.get("/subadmin-count", protect, superadmin, getSubAdminCount); // New route to get sub-admin count
router.delete("/subadmin/:id", protect, superadmin, deleteSubAdmin); // New route to delete a sub-admin
router.put("/subadmin/:id/change-password", protect, superadmin, changeSubAdminPassword); // New route to change sub-admin password

module.exports = router;
