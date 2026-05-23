import express from "express";
import PriceCard from "../models/SaleCategory.js";

const router = express.Router();

// GET all price cards
router.get("/", async (req, res) => {
  try {
    const cards = await PriceCard.find().sort({ createdAt: -1 });
    res.json({ success: true, data: cards });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single price card
router.get("/:id", async (req, res) => {
  try {
    const card = await PriceCard.findById(req.params.id);
    if (!card) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: card });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create new price card
router.post("/", async (req, res) => {
  try {
    const { label, bg, categoryName, books, status } = req.body;
    const card = new PriceCard({ label, bg, categoryName, books, status });
    await card.save();
    res.status(201).json({ success: true, data: card });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PUT update price card
router.put("/:id", async (req, res) => {
  try {
    const { label, bg, categoryName, books, status } = req.body;
    const card = await PriceCard.findByIdAndUpdate(
      req.params.id,
      { label, bg, categoryName, books, status },
      { new: true, runValidators: true }
    );
    if (!card) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: card });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE price card
router.delete("/:id", async (req, res) => {
  try {
    const card = await PriceCard.findByIdAndDelete(req.params.id);
    if (!card) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;