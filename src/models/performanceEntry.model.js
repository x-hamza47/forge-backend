import mongoose from "mongoose";

export const PERFORMANCE_METRICS = [
  "bench_press",
  "squat",
  "deadlift",
  "run_5k",
  "pull_ups",
];

const toJSON = {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.user;
    return ret;
  },
};

const performanceEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"],
    },
    metric: { type: String, enum: PERFORMANCE_METRICS, required: true },
    value: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: true, toJSON },
);

performanceEntrySchema.index({ user: 1, date: 1, metric: 1 });

export default mongoose.model("PerformanceEntry", performanceEntrySchema);