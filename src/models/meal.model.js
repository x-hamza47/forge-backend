import mongoose from "mongoose";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"];

const toJSON = {
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.user;
    return ret;
  },
};

const macrosSchema = new mongoose.Schema(
  {
    protein: { type: Number, default: 0, min: 0 },
    carbs: { type: Number, default: 0, min: 0 },
    fat: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const foodItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true, maxlength: 20 },
    calories: { type: Number, required: true, min: 0 },
    macros: { type: macrosSchema, default: () => ({}) },
  },
  { toJSON },
);

const mealSchema = new mongoose.Schema(
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
    mealType: { type: String, enum: MEAL_TYPES, required: true },
    items: {
      type: [foodItemSchema],
      validate: [(v) => v.length >= 1 && v.length <= 30, "A meal needs 1 to 30 food items"],
    },
    notes: { type: String, default: "", trim: true, maxlength: 500 },
  },
  { timestamps: true, toJSON },
);

mealSchema.index({ user: 1, date: 1, mealType: 1 });

export default mongoose.model("Meal", mealSchema);