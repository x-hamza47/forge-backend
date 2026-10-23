import mongoose from "mongoose";
import { WORKOUT_CATEGORIES } from "./workout.model.js";

const toJSON = {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.user;
    if (ret.workout) ret.workout = ret.workout.toString();
    return ret;
  },
};

const setSchema = new mongoose.Schema(
  {
    reps: { type: Number, required: true, min: 0, max: 1000 },
    weightKg: { type: Number, default: null, min: 0 },
  },
  { _id: false },
);

const logExerciseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    sets: {
      type: [setSchema],
      validate: [(v) => v.length >= 1 && v.length <= 100, "Between 1 and 100 sets required"],
    },
    notes: { type: String, default: "", trim: true, maxlength: 300 },
  },
  { toJSON },
);

const workoutLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    workout: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Workout",
      default: null,
    },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    category: { type: String, enum: WORKOUT_CATEGORIES, default: "strength" },
    performedAt: { type: Date, default: Date.now },
    durationMin: { type: Number, default: 0, min: 0, max: 600 },
    exercises: { type: [logExerciseSchema], default: [] },
    notes: { type: String, default: "", trim: true, maxlength: 1000 },
    totalVolumeKg: { type: Number, default: 0, min: 0 },
    totalSets: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true, toJSON },
);

workoutLogSchema.pre("validate", function () {
  let volume = 0;
  let sets = 0;
  for (const exercise of this.exercises) {
    for (const set of exercise.sets) {
      volume += set.reps * (set.weightKg ?? 0);
      sets += 1;
    }
  }
  this.totalVolumeKg = Math.round(volume * 100) / 100;
  this.totalSets = sets;
});

workoutLogSchema.index({ user: 1, performedAt: -1 });
workoutLogSchema.index({ user: 1, category: 1, performedAt: -1 });
workoutLogSchema.index({ user: 1, "exercises.name": 1, performedAt: -1 });

export default mongoose.model("WorkoutLog", workoutLogSchema);