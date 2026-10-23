import mongoose from "mongoose";

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: 100,
    },
    kind: {
      type: String,
      enum: ["workout", "meal", "goal"],
      required: [true, "Kind is required"],
    },
    time: {
      type: String,
      required: [true, "Time is required (HH:mm)"],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "Time must be in 24-hour HH:mm format"],
    },
    days: {
      type: [Number],
      default: [0, 1, 2, 3, 4, 5, 6],
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastTriggeredAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

reminderSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.user;
    return ret;
  },
});

const Reminder = mongoose.model("Reminder", reminderSchema);

export default Reminder;
