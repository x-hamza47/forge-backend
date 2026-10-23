import fs from "fs/promises";
import path from "path";
import User from "../models/user.model.js";
import WorkoutLog from "../models/workoutLog.model.js";
import ApiError from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { AVATAR_DIR } from "../middlewares/upload.middleware.js";
import { getFollowCounts, getFollowStatus } from "./follow.service.js";

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

export async function getPublicProfile(viewer, username) {
    const cleanUsername = String(username).toLowerCase().trim();
    const target = await User.findOne({ username: cleanUsername });
    if (!target || !target.isActive) throw new ApiError(404, "User not found.");

    const isSelf = viewer._id.equals(target._id);
    const followStatus = isSelf ? null : await getFollowStatus(viewer._id, target._id);
    const counts = await getFollowCounts(target._id);

    const isPrivate = target.preferences?.privacy?.isPrivate ?? false;
    const isAcceptedFollower = followStatus === "accepted";
    const canView = isSelf || !isPrivate || isAcceptedFollower;

    if (!canView) {
        return {
            id: target._id.toString(),
            name: target.name,
            username: target.username,
            profilePicture: target.profilePicture ? `${env.serverUrl}${target.profilePicture}` : null,
            bio: target.bio,
            isPrivate: true,
            canView: false,
            followStatus,
            stats: {
                followers: counts.followers,
                following: counts.following,
                workouts: 0,
            },
            message: "This account is private. Follow this user to see their fitness activity.",
        };
    }

    const showStats = target.preferences?.privacy?.showStats ?? true;
    const canSeeStats = isSelf || showStats;

    const [workoutCount, recentLogs] = await Promise.all([
        WorkoutLog.countDocuments({ user: target._id }),
        canSeeStats
            ? WorkoutLog.find({ user: target._id }).sort({ performedAt: -1 }).limit(5)
            : Promise.resolve([]),
    ]);

    return {
        id: target._id.toString(),
        name: target.name,
        username: target.username,
        email: isSelf ? target.email : undefined,
        profilePicture: target.profilePicture ? `${env.serverUrl}${target.profilePicture}` : null,
        bio: target.bio,
        isPrivate,
        canView: true,
        followStatus,
        showStats: canSeeStats,
        stats: {
            followers: counts.followers,
            following: counts.following,
            workouts: workoutCount,
        },
        recentWorkouts: recentLogs.map((l) => ({
            id: l.id,
            name: l.name,
            category: l.category,
            performedAt: l.performedAt,
            durationMin: l.durationMin,
            exerciseCount: l.exercises.length,
        })),
        createdAt: target.createdAt,
    };
}

const VALID_SEX = ["male", "female", "other"];
const VALID_GOALS = ["weight_loss", "muscle_gain", "maintenance", "endurance"];
const VALID_ACTIVITY = ["sedentary", "light", "moderate", "active", "very_active"];

export async function updateProfile(userId, body, avatarPath) {
    const user = await User.findById(userId);
    if (!user) throw new ApiError(404, "User not found.");

    try {
        if (body.name !== undefined) {
            const name = String(body.name).trim();
            if (name.length < 2 || name.length > 60) {
                throw new ApiError(400, "Name must be between 2 and 60 characters.");
            }
            user.name = name;
        }

        if (body.username !== undefined) {
            const username = String(body.username).toLowerCase().trim();
            if (!/^[a-z0-9_]{3,30}$/.test(username)) {
                throw new ApiError(400, "Username must be 3-30 letters, numbers, or underscores.");
            }
            const taken = await User.findOne({
                username,
                _id: { $ne: user._id },
            });
            if (taken) throw new ApiError(409, "Username is already in use.");
            user.username = username;
        }

        if (body.bio !== undefined) {
            user.bio = String(body.bio).trim().slice(0, 200);
        }

        if (body.dateOfBirth !== undefined) {
            const val = body.dateOfBirth;
            if (val === "" || val === "null" || val === null) {
                user.dateOfBirth = null;
            } else {
                const d = new Date(val);
                if (Number.isNaN(d.getTime())) throw new ApiError(400, "Invalid date of birth.");
                if (d > new Date()) throw new ApiError(400, "Date of birth cannot be in the future.");
                user.dateOfBirth = d;
            }
        }

        for (const field of NUMBER_FIELDS) {
            if (body[field] !== undefined) {
                const val = body[field];
                if (val === "" || val === "null" || val === null) {
                    user.set(field, null);
                } else {
                    const num = Number(val);
                    if (Number.isNaN(num) || num < 0 || num > 1000) {
                        throw new ApiError(400, `${field} must be a valid positive number.`);
                    }
                    user.set(field, Math.round(num * 100) / 100);
                }
            }
        }

        if (body.sex !== undefined) {
            const val = body.sex;
            if (val === "" || val === "null" || val === null) {
                user.sex = undefined;
            } else if (!VALID_SEX.includes(val)) {
                throw new ApiError(400, "Invalid sex selection.");
            } else {
                user.sex = val;
            }
        }

        if (body.goal !== undefined) {
            const val = body.goal;
            if (val === "" || val === "null" || val === null) {
                user.goal = undefined;
            } else if (!VALID_GOALS.includes(val)) {
                throw new ApiError(400, "Invalid fitness goal.");
            } else {
                user.goal = val;
            }
        }

        if (body.activityLevel !== undefined) {
            const val = body.activityLevel;
            if (val === "" || val === "null" || val === null) {
                user.activityLevel = undefined;
            } else if (!VALID_ACTIVITY.includes(val)) {
                throw new ApiError(400, "Invalid activity level.");
            } else {
                user.activityLevel = val;
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