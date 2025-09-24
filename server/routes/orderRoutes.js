import express from "express";
import Order from "../models/Order.js";
import User from "../models/User.js";
import { protect, ownerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * @desc    Place new order
 * @route   POST /api/orders
 * @access  Private (customer)
 */
router.post("/", protect, async (req, res) => {
  const { items, totalAmount, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: "No items in order" });
  }

  try {
    const order = new Order({
      user: req.user._id,
      items,
      totalAmount,
      paymentMethod,
      status: "pending",
    });

    const createdOrder = await order.save();

    // Save order under user
    const user = await User.findById(req.user._id);
    user.orders.push(createdOrder._id);
    await user.save();

    res.status(201).json(createdOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc    Get logged-in user's orders
 * @route   GET /api/orders/my
 * @access  Private
 */
router.get("/my", protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc    Get all orders (owner only)
 * @route   GET /api/orders
 * @access  Owner only
 */
router.get("/", protect, ownerOnly, async (req, res) => {
  try {
    const orders = await Order.find({}).populate("user", "name email");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 * @access  Private (owner or user who placed it)
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (req.user.role !== "owner" && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc    Update order status (owner only)
 * @route   PUT /api/orders/:id/status
 * @access  Owner only
 */
router.put("/:id/status", protect, ownerOnly, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = req.body.status || order.status;
    const updatedOrder = await order.save();

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
