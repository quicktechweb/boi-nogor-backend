import express from "express";
import Department from "../models/EmployeeDepartmentRoute.js";
import Employee from "../models/EmployeeDirectory.js";

const router = express.Router();

// GET /api/departments — সব department + employee count
router.get("/", async (req, res) => {
  try {
    const departments = await Department.find().sort({ createdAt: -1 });

    // প্রতিটা department এ কতজন employee আছে count করো
    const data = await Promise.all(
      departments.map(async (dept) => {
        const count = await Employee.countDocuments({ department: dept.name });
        return {
          _id: dept._id,
          name: dept.name,
          status: dept.status,
          employeeCount: count,
          createdAt: dept.createdAt,
        };
      })
    );

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not fetch departments", error: error.message });
  }
});

// POST /api/departments — নতুন department add
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: "Department name is required" });
    }

    const existing = await Department.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ success: false, message: "Department already exists" });
    }

    const department = new Department({ name: name.trim() });
    await department.save();

    res.status(201).json({
      success: true,
      message: "Department added successfully",
      data: { ...department.toObject(), employeeCount: 0 },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// PUT /api/departments/:id — status update
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    res.status(200).json({ success: true, message: "Department updated", data: department });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// DELETE /api/departments/:id — department delete
router.delete("/:id", async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }
    res.status(200).json({ success: true, message: "Department removed" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

export default router;