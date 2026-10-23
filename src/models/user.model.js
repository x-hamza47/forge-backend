import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            maxlength: 60,
        },
        username: {
            type: String,
            required: [true, "Username is required"],
            unique: true,
            lowercase: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
            match: [/^[a-z0-9_]+$/, "Username can only contain letters, numbers and underscores"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: 8,
            select: false,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        isActive: {
            type: Boolean,
            default: true,
        },

        profilePicture: { type: String, default: null },
        bio: { type: String, maxlength: 200, default: "" },
        dateOfBirth: { type: Date, default: null },
        sex: { type: String, enum: ["male", "female", "other"], default: undefined },
        height: { type: Number, min: 0, default: null },
        weight: { type: Number, min: 0, default: null },
        targetWeight: { type: Number, min: 0, default: null },

        goal: {
            type: String,
            enum: ["weight_loss", "muscle_gain", "maintenance", "endurance"],
            default: undefined,
        },
        activityLevel: {
            type: String,
            enum: ["sedentary", "light", "moderate", "active", "very_active"],
            default: undefined,
        },

        preferences: {
            units: { type: String, enum: ["metric", "imperial"], default: "metric" },
            notifications: {
                workout: { type: Boolean, default: true },
                meal: { type: Boolean, default: true },
                goal: { type: Boolean, default: true },
            },
            privacy: {
                isPrivate: { type: Boolean, default: false },
                searchable: { type: Boolean, default: true },
                showStats: { type: Boolean, default: true },
            },
        },
    },
    { timestamps: true }
);

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
};

userSchema.set("toJSON", {
    transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        return ret;
    },
});

const User = mongoose.model("User", userSchema);

export default User;