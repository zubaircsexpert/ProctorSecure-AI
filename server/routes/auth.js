import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js"; // Model ka path sahi check karein

const router = express.Router();

// Register Route
router.post("/register", async (req, res) => {
  try {
    const { email, password, role, name } = req.body;
    const hashed = await bcrypt.hash(password, 10);
    const newUser = new User({ email, password: hashed, role, name });
    await newUser.save();
    res.status(201).json({ success: true, message: "Registered! ✅" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Email pehle se mojood hai ❌" });
  }
});

// Login Route (MongoDB Connection)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: "User nahi mila! ❌" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Ghalat Password ❌" });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET || "secret");

    res.status(200).json({
      success: true,
      token,
      user: { email: user.email, role: user.role, name: user.name }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error ❌" });
  }
});

export default router;