import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  items: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, required: true },
      itemType: { type: String, enum: ["product", "course"], required: true },
      title: String,    // snapshot of item name
      price: Number,    // snapshot of item price
      qty: { type: Number, default: 1 }
    }
  ],

  totalAmount: { type: Number, required: true },

  status: {
    type: String,
    enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
    default: "pending"
  },

  paymentId: { type: String }, // Razorpay/Stripe ID
  paymentMethod: { type: String, default: "razorpay" },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Order", OrderSchema);
