import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js"; 

const router = express.Router();

// Register Route (Updated with Role Logic & Security Key)
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, className, rollNumber, departmentCode } = req.body;

    // 1. Password Hash
    const hashed = await bcrypt.hash(password, 10);

    // 2. User Object Setup
    const newUser = new User({ 
      name, 
      email, 
      password: hashed, 
      role 
    });

    // 3. Logic for Teacher (Security Key Check)
    if (role === "teacher") {
      const TEACHER_SECRET_KEY = "MySchool123"; // Yahi wo Security Key hai
      if (departmentCode !== TEACHER_SECRET_KEY) {
        return res.status(400).json({ success: false, message: "Invalid Department Code! Access Denied. ❌" });
      }
      newUser.teacherData = { departmentCode };
    } 
    // 4. Logic for Student
    else {
      newUser.studentData = { className, rollNumber };
    }

    // 5. Save to Database
    await newUser.save();
    res.status(201).json({ success: true, message: "Registered Successfully! ✅" });

  } catch (error) {
    res.status(400).json({ success: false, message: "Error: Email pehle se exist karti hai ya server problem hai! ❌" });
  }
});

// Login Route (Original logic preserved)
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

    // Token mein role bhi bhej rahe hain
    const token = jwt.sign(
      { userId: user._id, role: user.role }, 
      process.env.JWT_SECRET || "secret",
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      token,
      user: { 
        email: user.email, 
        role: user.role, 
        name: user.name,
        // Optional: Aap yahan data bhi return kar sakte hain
        studentData: user.studentData,
        teacherData: user.teacherData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error ❌" });
  }
});

export default router;