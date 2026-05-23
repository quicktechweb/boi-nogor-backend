import express from "express";
import Employee from "../models/EmployeeDirectory.js";

const router = express.Router();

// GET /api/employees — সব employee
router.get("/", async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Could not fetch employees",
      error: error.message,
    });
  }
});

// GET /api/employees/:id — একটি employee
router.get("/:id", async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// POST /api/employees — নতুন employee register
// POST /api/employees — নতুন employee register
router.post("/", async (req, res) => {
  try {
    // joinDateRaw বাদ দিয়ে বাকিটা নাও
    const { name, email, department, role, joinDate, salary } = req.body;

    if (!name || !email || !department || !role || !joinDate || !salary) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existing = await Employee.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Employee with this email already exists" });
    }

    const employee = new Employee({ name, email, department, role, joinDate, salary });
    await employee.save();

    res.status(201).json({
      success: true,
      message: "Employee profile committed to registry",
      data: employee,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// PUT /api/employees/:id — employee update
router.put("/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    );
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    res.status(200).json({ success: true, message: "Employee updated", data: employee });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// DELETE /api/employees/:id — employee delete
router.delete("/:id", async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    res.status(200).json({ success: true, message: "Employee removed from registry" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// PATCH /api/employees/:id/payment-status — payment status update
router.patch("/:id/payment-status", async (req, res) => {
  try {
    const { paymentStatus } = req.body;

    const allowed = ["Pending", "Cleared", "Rejected"];
    if (!allowed.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be Pending, Cleared, or Rejected",
      });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { paymentStatus },
      { new: true }
    );

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    res.status(200).json({
      success: true,
      message: `Payment status updated to ${paymentStatus}`,
      data: employee,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;