import mongoose from "mongoose";

export const MEASUREMENT_KEYS = ["chest", "waist", "hips", "biceps", "thighs"];

const toJSON = {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.user;
    return ret;
  },
};

const cm = { type: Number, min: 0, max: 500 };

const measurementsSchema = new mongoose.Schema(
  Object.fromEntries(MEASUREMENT_KEYS.map((key) => [key, cm])),
  { _id: false },
);

const bodyEntrySchema = new mongoose.Schema(
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
    weightKg: { type: Number, default: null, min: 0, max: 700 },
    measurements: { type: measurementsSchema, default: () => ({}) },
    notes: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: true, minimize: false, toJSON },
);

bodyEntrySchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("BodyEntry", bodyEntrySchema);