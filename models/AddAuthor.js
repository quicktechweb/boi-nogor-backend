import mongoose from "mongoose";

const authorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, default: "" },
  description: { type: String, default: "" },
  followers: { type: Number, default: 0 },
  followedBy: [{ type: String }], // user _id array
}, { timestamps: true });

const Author = mongoose.model("Author", authorSchema);

export default Author;