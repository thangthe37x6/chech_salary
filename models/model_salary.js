import mongoose from "mongoose";

const salarySchema = new mongoose.Schema({
  payPeriod: {
    year: Number,
    month: Number,
    batch: Number
  },
  createdAt: { type: Date, default: Date.now },
  salaryDetails: {
    name: { type: String, required: true, trim: true },
    commission: { type: Number },
    payout1: { type: Number },
    payout2: { type: Number },
    payout3: { type: Number },
    payout4: { type: Number },
    payout5: { type: Number },
    payout6: { type: Number },
    extracommission: { type: Number },
    ebonusTCTy: { type: Number },
    ebonusCT: { type: Number },
    compensation: { type: Number },
    extrasalary: { type: Number },
    ebonusTCTy1: { type: Number },
    ebonusCT1: { type: Number },
    tax: { type: Number },
    actualcost: { type: Number }
  }
});

export default mongoose.model('Salary', salarySchema);