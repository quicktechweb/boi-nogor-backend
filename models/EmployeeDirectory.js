import mongoose from "mongoose";

async function generateEmpId() {
  const last = await Employee.findOne().sort({ createdAt: -1 }).select("empId");
  if (!last || !last.empId) return "EMP-0001";
  const num = parseInt(last.empId.replace("EMP-", ""), 10);
  return `EMP-${String(num + 1).padStart(4, "0")}`;
}

const employeeSchema = new mongoose.Schema(
  {
    empId: {
      type: String,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    paymentStatus: {
  type: String,
  default: "Pending",
  enum: ["Pending", "Cleared", "Rejected"],
},
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
    },
    paymentStatusByMonth: {
  type: Map,
  of: String,
  default: {},
},
kpiBonus: {
  type: Number,
  default: 0,
},
structuralDeduction: {
  type: Number,
  default: 0,
},
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
      // enum সরানো হয়েছে — যেকোনো department লেখা যাবে
    },
    role: {
      type: String,
      required: [true, "Role designation is required"],
      trim: true,
    },
    joinDate: {
      type: String,
      required: [true, "Join date is required"],
    },
    salary: {
      type: Number,
      required: [true, "Base salary is required"],
      min: [1, "Salary must be greater than 0"],
    },
    status: {
      type: String,
      default: "Active Staff",
      enum: ["Active Staff", "On Leave", "Inactive"],
    },
  },
  { timestamps: true }
);

employeeSchema.pre("save", async function (next) {
  if (!this.empId) {
    this.empId = await generateEmpId();
  }
  next();
});

const Employee = mongoose.model("Employee", employeeSchema, "employees");
export default Employee;