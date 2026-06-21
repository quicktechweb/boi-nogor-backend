import mongoose from "mongoose";

const childCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  categoryName: { type: String, required: true },
  subcategoryName: { type: String, required: true },
  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  childCategoryImg: { type: String, default: "" },

  // Author-related fields (top-level, isAuthor এর ভেতরে nested ছিল — bug fix)
  isAuthor: { type: Boolean, default: false }, // admin checkbox দিলে true হবে
  description: { type: String, default: "" },
  followers: { type: Number, default: 0 },
  followedBy: [{ type: String }],
}, { timestamps: true });

export default mongoose.model("ChildCategory", childCategorySchema);