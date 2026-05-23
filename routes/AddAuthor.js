import Author from "../models/AddAuthor.js";
import Product from "../models/Product.js";
import express from "express";

const router = express.Router();

// ── সব author list ─────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const authors = await Author.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: authors });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});


router.patch("/:id/follow", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "userId required" });

    const author = await Author.findById(req.params.id);
    if (!author) return res.status(404).json({ success: false, message: "Not found" });

    const alreadyFollowed = author.followedBy.includes(userId);

    if (alreadyFollowed) {
      // unfollow
      author.followedBy = author.followedBy.filter(id => id !== userId);
      author.followers = Math.max(0, author.followers - 1);
    } else {
      // follow
      author.followedBy.push(userId);
      author.followers += 1;
    }

    await author.save();
    res.json({
      success: true,
      followers: author.followers,
      isFollowed: !alreadyFollowed,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});
// ── Single author + তার সব product ────────────────────────
router.get("/:id", async (req, res) => {
  try {
    const author = await Author.findById(req.params.id).lean();
    if (!author) return res.status(404).json({ success: false, message: "Author not found" });

    const products = await Product.find({
      childcategoryName: author.name
    }).sort({ createdAt: -1 }).lean();

    res.json({ success: true, data: { author, products } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ── Author add ─────────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { name, image, description, followers } = req.body;
    if (!name) return res.status(400).json({ success: false, message: "Name required" });

    const author = await Author.create({ name, image, description, followers });
    res.json({ success: true, data: author });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ── Author update ──────────────────────────────────────────
router.put("/:id", async (req, res) => {
  try {
    const author = await Author.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!author) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: author });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ── Follow/Unfollow ────────────────────────────────────────
router.patch("/:id/follow", async (req, res) => {
  try {
    const { action } = req.body;
    const inc = action === "follow" ? 1 : -1;
    const author = await Author.findByIdAndUpdate(
      req.params.id,
      { $inc: { followers: inc } },
      { new: true }
    );
    res.json({ success: true, followers: author.followers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// ── Author delete ──────────────────────────────────────────
router.delete("/:id", async (req, res) => {
  try {
    await Author.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

export default router;