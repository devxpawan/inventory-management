const User = require("../models/user");
const Transaction = require("../models/transaction");
const jwt = require("jsonwebtoken");

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "3d", // Token expires in 3 days
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({
      username,
      password,
      role,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        username: user.username,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a sub-admin (only accessible by superadmin)
// @route   POST /api/users/subadmin
// @access  Private/Superadmin
const addSubAdmin = async (req, res) => {
  const { username, password } = req.body;

  // Check if the requesting user is a superadmin (this will be handled by middleware later)
  if (req.user.role !== "superadmin") {
    return res.status(403).json({ message: "Not authorized as an superadmin" });
  }

  try {
    const userExists = await User.findOne({ username });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const subAdmin = await User.create({
      username,
      password,
      role: "subadmin", // Force role to subadmin
    });

    if (subAdmin) {
      res.status(201).json({
        _id: subAdmin._id,
        username: subAdmin.username,
        role: subAdmin.role,
      });

      // Audit Log: Create User
      await Transaction.create({
        type: 'create_user',
        itemName: subAdmin.username, // Using itemName to store username
        itemCategory: 'User',
        performedBy: req.user._id,
        reason: 'Sub-admin created'
      });
    } else {
      res.status(400).json({ message: "Invalid sub-admin data" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all sub-admins (only accessible by superadmin)
// @route   GET /api/users/subadmins
// @access  Private/Superadmin
const getSubAdmins = async (req, res) => {
  try {
    const subAdmins = await User.find({ role: "subadmin" }).select("-password"); // Exclude password
    res.status(200).json(subAdmins);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a sub-admin (only accessible by superadmin)
// @route   DELETE /api/users/subadmin/:id
// @access  Private/Superadmin
const deleteSubAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Sub-admin not found" });
    }

    if (user.role !== "subadmin") {
      return res.status(400).json({ message: "Can only delete sub-admins" });
    }

    // Audit Log: Delete User
    await Transaction.create({
      type: 'delete_user',
      itemName: user.username,
      itemCategory: 'User',
      performedBy: req.user._id,
      reason: 'Sub-admin deleted'
    });

    await User.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: "Sub-admin removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sub-admin count (only accessible by superadmin)
// @route   GET /api/users/subadmin-count
// @access  Private/Superadmin
const getSubAdminCount = async (req, res) => {
  try {
    const count = await User.countDocuments({ role: "subadmin" });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change sub-admin password (only accessible by superadmin)
// @route   PUT /api/users/subadmin/:id/change-password
// @access  Private/Superadmin
const changeSubAdminPassword = async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "Password is required" });
  }

  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Sub-admin not found" });
    }

    if (user.role !== "subadmin") {
      return res.status(400).json({ message: "Can only change password for sub-admins" });
    }

    user.password = password;
    await user.save();

    res.status(200).json({ message: "Sub-admin password updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  authUser,
  addSubAdmin,
  getSubAdmins,
  deleteSubAdmin,
  getSubAdminCount,
  changeSubAdminPassword,
};
