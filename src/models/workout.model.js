import mongoose from "mongoose";

export const WORKOUT_CATEGORIES = ["strength", "cardio", "flexibility", "hiit"];

const toJSON = {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.user;
    return ret;
  },
};

const exerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    sets: { type: Number, required: true, min: 1, max: 100 },
    reps: { type: Number, required: true, min: 1, max: 1000 },
    weightKg: { type: Number, default: null, min: 0 },
    notes: { type: String, default: "", trim: true, maxlength: 300 },
  },
  { toJSON },
);

const workoutSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, enum: WORKOUT_CATEGORIES, default: "strength" },
    tags: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
      default: [],
      validate: [(v) => v.length <= 10, "A routine can have at most 10 tags"],
    },
    exercises: { type: [exerciseSchema], default: [] },
    durationMin: { type: Number, default: 0, min: 0, max: 600 },
    notes: { type: String, default: "", trim: true, maxlength: 1000 },
    favorite: { type: Boolean, default: false },
    lastPerformedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON },
);

workoutSchema.index({ user: 1, updatedAt: -1 });
workoutSchema.index({ user: 1, category: 1 });
workoutSchema.index({ user: 1, tags: 1 });

export default mongoose.model("Workout", workoutSchema);