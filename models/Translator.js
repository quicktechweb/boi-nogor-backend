import mongoose from "mongoose";

const translatorSchema = mongoose.Schema(
  {
    translatorName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Inactive",
    },
    translatorImg: {
      type: String, // শুধু URL save হবে (যেমন imgbb এর লিঙ্ক)
      default: "",
    },
  },
  { timestamps: true }
);

const Translator = mongoose.model("Translator", translatorSchema);
export default Translator;