import { protect, ownerOnly } from "../middleware/authMiddleware.js";
import express from "express";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

const router = express.Router();

// @desc   Register new user
// @route  POST /api/users/register
router.post("/register", async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role, // ⚠️ role should not be client-controlled in real app; restrict to customer by default
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role),
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc   Login user
// @route  POST /api/users/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Forgot password
// @route   POST /api/users/forgot
// @access  Public
router.post("/forgot", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    const message = `You requested a password reset. Please click this link: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request",
        message,
      });

      res.json({ message: "Email sent" });
    } catch (err) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc    Reset password
// @route   PUT /api/users/reset/:token
// @access  Public
router.put("/reset/:token", async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc    Get logged in user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
router.get("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password").populate("orders");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
/**
 * @desc    Update logged in user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
router.put("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.name = req.body.name || user.name;
    user.phone = req.body.phone || user.phone;
    if (req.body.password) user.password = req.body.password; // auto-hash in model

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      token: generateToken(updatedUser._id, updatedUser.role),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ========== OWNER ONLY ROUTES ========== */

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Owner only
 */
router.get("/", protect, ownerOnly, async (req, res) => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc    Get single user by ID
 * @route   GET /api/users/:id
 * @access  Owner only
 */
router.get("/:id", protect, ownerOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").populate("orders");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc    Update user role (customer <-> owner)
 * @route   PUT /api/users/:id
 * @access  Owner only
 */
router.put("/:id", protect, ownerOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = req.body.role || user.role;

    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Owner only
 */
router.delete("/:id", protect, ownerOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await user.deleteOne();
    res.json({ message: "User removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
