import express from "express";
import Notification from "../models/Notification.js";

const router = express.Router();

/**
 * @route   GET /api/notifications/all
 * @desc    Get all notifications (latest first)
 */
router.get("/all", async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 });

    res.status(200).json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);

    res.status(500).json({
      error: "Notifications fetch karne mein masla hai."
    });
  }
});

/**
 * @route   POST /api/notifications/add
 * @desc    Add new notification
 */
router.post("/add", async (req, res) => {
  try {
    const { title, message, type } = req.body;

    // Validation
    if (!title || !message) {
      return res.status(400).json({
        error: "Title aur Message zaroori hain."
      });
    }

    const newNotification = new Notification({
      title: title,
      message: message,
      type: type ? type : "general"
    });

    const savedNotification = await newNotification.save();

    res.status(201).json({
      success: true,
      data: savedNotification
    });
  } catch (err) {
    console.error("Error saving notification:", err);

    res.status(500).json({
      error: "Notification save nahi ho saki. Database ka masla ho sakta hai."
    });
  }
});

/**
 * @route   PUT /api/notifications/update/:id
 * @desc    Update notification
 */
router.put("/update/:id", async (req, res) => {
  try {
    const updated = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!updated) {
      return res.status(404).json({
        error: "Notification nahi mili."
      });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("Update error:", err);

    res.status(500).json({
      error: "Update error"
    });
  }
});

/**
 * @route   DELETE /api/notifications/delete/:id
 * @desc    Delete notification
 */
router.delete("/delete/:id", async (req, res) => {
  try {
    const deleted = await Notification.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        error: "Notification nahi mili."
      });
    }

    res.status(200).json({
      message: "Notification delete kar di gayi."
    });
  } catch (err) {
    console.error("Delete error:", err);

    res.status(500).json({
      error: "Delete karne mein masla aaya."
    });
  }
});

export default router;