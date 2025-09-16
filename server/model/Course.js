import mongoose from "mongoose";
const CourseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  level: String, // e.g., Beginner, Masterclass
  description: String,
  price: { type: Number, required: true },
  groupLink: { type: String, required: true }, // WhatsApp invite link

  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Course", CourseSchema);
