import express from "express";
import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import Course from "../models/Course.js";
import { protect } from "../middleware/authMiddleware.js";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();

/**
 * @desc    Create Razorpay order
 * @route   POST /api/payments/razorpay
 * @access  Private
 */
router.post("/razorpay", protect, async (req, res) => {
  const { orderId } = req.body; // our DB order id
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: "Order not found" });

  const options = {
    amount: order.totalAmount * 100, // in paise
    currency: "INR",
    receipt: order._id.toString(),
  };

  try {
    const razorOrder = await razorpay.orders.create(options);
    res.json({ orderId: razorOrder.id, key: process.env.RAZORPAY_KEY_ID, amount: razorOrder.amount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * @desc    Razorpay Webhook (payment success/failure)
 * @route   POST /api/payments/webhook
 * @access  Public
 */
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const body = req.body;

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest("hex");

  if (signature !== expected) {
    return res.status(400).json({ message: "Invalid signature" });
  }

  try {
    const payment = body.payload.payment.entity;
    const dbOrderId = body.payload.payment.entity.notes?.orderId || body.payload.payment.entity.order_id;

    const order = await Order.findOne({ _id: dbOrderId });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Update order
    order.status = "paid";
    order.paymentId = payment.id;
    await order.save();

    // Find user
    const user = await User.findById(order.user);

    // If any course, send WhatsApp group link
    const courseItems = order.items.filter(i => i.itemType === "course");

    if (courseItems.length > 0) {
      for (const c of courseItems) {
        const course = await Course.findById(c.itemId);
        if (course) {
          const message = `Hi ${user.name}, thanks for purchasing ${course.title}. 
Join the WhatsApp group here: ${course.groupLink}`;

          // Option A: Send via Email
          await sendEmail({
            email: user.email,
            subject: "Course Access Link",
            message,
          });

          // Option B: (Optional) Send via WhatsApp API (Meta/Twilio) → needs setup
        }
      }
    }

    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
