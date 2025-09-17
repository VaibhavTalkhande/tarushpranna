import mongoose from "mongoose";
const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
  price: { type: Number, required: true },
  images: [String],
  stock: { type: Number, default: 0 },

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Product", ProductSchema);
