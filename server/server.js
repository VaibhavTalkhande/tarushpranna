import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./lib/connectDb.js";

// Load env vars
dotenv.config();

// Connect Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // parse JSON body

// Test Route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// // Routes (we’ll add later)
// import userRoutes from "./routes/userRoutes.js";
// import productRoutes from "./routes/productRoutes.js";
// import courseRoutes from "./routes/courseRoutes.js";
// import orderRoutes from "./routes/orderRoutes.js";

// app.use("/api/users", userRoutes);
// app.use("/api/products", productRoutes);
// app.use("/api/courses", courseRoutes);
// app.use("/api/orders", orderRoutes);

// Server listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
