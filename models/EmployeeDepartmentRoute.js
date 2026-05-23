import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Department name is required"],
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      default: "Operational",
      enum: ["Operational", "Inactive", "Under Review"],
    },
  },
  { timestamps: true }
);

const Department = mongoose.model("Department", departmentSchema, "departments");
export default Department;