import fs from "fs/promises";
import path from "path";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { AVATAR_DIR } from "../middlewares/upload.middleware.js";
import { getFollowCounts } from "./follow.service.js";

const BASIC_FIELDS = ["name", "username", "bio"];
const NUMBER_FIELDS = ["height", "weight", "targetWeight"];
const ENUM_FIELDS = ["sex", "goal", "activityLevel"];
const FITNESS_FIELDS = [
    "dateOfBirth",
    ...NUMBER_FIELDS,
    ...ENUM_FIELDS,
];

export function toProfile(user, stats = { followers: 0, following: 0, workouts: 0 }) {
    return {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture ? `${env.serverUrl}${user.profilePicture}` : null,
        bio: user.bio,
        dateOfBirth: user.dateOfBirth,
        sex: user.sex ?? null,
        height: user.height,
        weight: user.weight,
        targetWeight: user.targetWeight,
        goal: user.goal ?? null,
        activityLevel: user.activityLevel ?? null,
        preferences: {
            units: user.preferences?.units ?? "metric",
            notifications: {
                workout: user.preferences?.notifications?.workout ?? true,
                meal: user.preferences?.notifications?.meal ?? true,
                goal: user.preferences?.notifications?.goal ?? true,
            },
            privacy: {
                isPrivate: user.preferences?.privacy?.isPrivate ?? false,
                searchable: user.preferences?.privacy?.searchable ?? true,
                showStats: user.preferences?.privacy?.showStats ?? true,
            },
        },
        createdAt: user.createdAt,
        stats,
    };
}

async function deleteAvatarFile(publicPath) {
    if (!publicPath) return;

    const file = path.join(AVATAR_DIR, path.basename(publicPath));
    await fs.unlink(file).catch(() => { });
}

export async function getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found.");
    const counts = await getFollowCounts(user._id);
    return toProfile(user, { ...counts, workouts: 0 });
}

export async function updateProfile(userId, body, avatarPath) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found.");

    try {

        for (const field of BASIC_FIELDS) {
            if (body[field] !== undefined) user[field] = body[field];
        }

        if (body.username !== undefined) {
            const taken = await User.findOne({
                username: String(body.username).toLowerCase().trim(),
                _id: { $ne: user._id },
            });
            if (taken) throw new ApiError(409, "Username is already in use.");
        }


        if (user.role !== "admin") {
            for (const field of FITNESS_FIELDS) {
                const value = body[field];
                if (value === undefined) continue;

                if (value === "" || value === "null") {
                    user.set(field, field === "dateOfBirth" || NUMBER_FIELDS.includes(field) ? null : undefined);
                } else if (NUMBER_FIELDS.includes(field)) {
                    const num = Number(value);
                    if (Number.isNaN(num)) throw new ApiError(400, `${field} must be a number.`);
                    user.set(field, num);
                } else {
                    user.set(field, value);
                }
            }
        }


        const oldAvatar = user.profilePicture;
        if (avatarPath) {
            user.profilePicture = avatarPath;
        } else if (body.removeAvatar === "true") {
            user.profilePicture = null;
        }

        await user.save();

        if (oldAvatar && oldAvatar !== user.profilePicture) {
            await deleteAvatarFile(oldAvatar);
        }

        return toProfile(user);
    } catch (error) {

        await deleteAvatarFile(avatarPath);
        throw error;
    }
}