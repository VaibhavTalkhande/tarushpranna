import mongoose from "mongoose";
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ["customer", "owner"], 
    default: "customer" 
  },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "Order" }],

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("User", UserSchema);
