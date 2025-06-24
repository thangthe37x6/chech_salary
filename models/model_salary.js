import mongoose from "mongoose";
const salarySchema = new mongoose.Schema({
  payPeriod: {
    year: Number,
    month: Number,
    batch: Number
  },
  createdAt: { type: Date, default: Date.now },
  salaryDetails: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    required: true
  }
}, { strict: false });

export default mongoose.model('Salary', salarySchema);