import mongoose from "mongoose";
import { nanoid } from "nanoid";

const priceCardSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => nanoid(),
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    bg: {
      type: String,
      required: true,
      default: "#2eaa6e",
    },
    categoryName: {
      type: String,
      required: true,
    },
    books: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },
  },
  { timestamps: true, _id: false }
);

export default mongoose.model("PriceCard", priceCardSchema);