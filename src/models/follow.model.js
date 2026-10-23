import mongoose from "mongoose";

const followSchema = new mongoose.Schema(
  {
    follower: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    following: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      validate: {
        validator: function (value) {
          return !value.equals(this.follower);
        },
        message: "You can't follow yourself.",
      },
    },
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "accepted",
    },
  },
  { timestamps: true }
);


followSchema.index({ follower: 1, following: 1 }, { unique: true });

followSchema.index({ following: 1, status: 1, createdAt: -1 });

followSchema.index({ follower: 1, status: 1, createdAt: -1 });

followSchema.set("toJSON", {
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const Follow = mongoose.model("Follow", followSchema);

export default Follow;