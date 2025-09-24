import express from "express";
import Course from "../models/Course.js";
import { protect, ownerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// @desc   Get all courses (public)
// @route  GET /api/courses
router.get("/", async (req, res) => {
  try {
    const courses = await Course.find({});
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc   Get single course (public)
// @route  GET /api/courses/:id
router.get("/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// @desc   Create course (owner only)
// @route  POST /api/courses
router.post("/", protect, ownerOnly, async (req, res) => {
  const { title, level, description, price, groupLink } = req.body;
  try {
    const course = new Course({ title, level, description, price, groupLink });
    const createdCourse = await course.save();
    res.status(201).json(createdCourse);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc   Update course (owner only)
// @route  PUT /api/courses/:id
router.put("/:id", protect, ownerOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.title = req.body.title || course.title;
    course.level = req.body.level || course.level;
    course.description = req.body.description || course.description;
    course.price = req.body.price || course.price;
    course.groupLink = req.body.groupLink || course.groupLink;

    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @desc   Delete course (owner only)
// @route  DELETE /api/courses/:id
router.delete("/:id", protect, ownerOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    await course.deleteOne();
    res.json({ message: "Course removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
