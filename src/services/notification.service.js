import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { env } from "../config/env.js";

const PREFERENCE_BY_TYPE = {
    workout_completed: "workout",
    goal_achieved: "goal",
    reminder: "meal",
};

export async function createNotification({ user, actor = null, type, message }) {
    try {
        const prefKey = PREFERENCE_BY_TYPE[type];

        if (prefKey) {
            const target = await User.findById(user).select("preferences.notifications");
            if (target && target.preferences?.notifications?.[prefKey] === false) return null;
        }

        return await Notification.create({ user, actor, type, message });
    } catch (error) {
        console.error("Notification failed:", error.message);
        return null;
    }
}

export async function getNotifications(userId, { page = 1, limit = 20 } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
    const safePage = Math.max(Number(page) || 1, 1);

    const [items, total] = await Promise.all([
        Notification.find({ user: userId })
            .sort({ createdAt: -1 })
            .skip((safePage - 1) * safeLimit)
            .limit(safeLimit)
            .populate("actor", "name username profilePicture"),
        Notification.countDocuments({ user: userId }),
    ]);

    return {
        items: items.map((n) => ({
            id: n._id.toString(),
            type: n.type,
            message: n.message,
            read: n.read,
            createdAt: n.createdAt,
            actor: n.actor
                ? {
                    id: n.actor._id.toString(),
                    name: n.actor.name,
                    username: n.actor.username,
                    profilePicture: n.actor.profilePicture ? `${env.serverUrl}${n.actor.profilePicture}` : null,
                }
                : null,
        })),
        total,
        page: safePage,
        pages: Math.ceil(total / safeLimit),
    };
}

export function getUnreadCount(userId) {
    return Notification.countDocuments({ user: userId, read: false });
}

export async function markAllRead(userId) {
    await Notification.updateMany({ user: userId, read: false }, { read: true });
}

export async function markRead(userId, notificationId) {
    await Notification.updateOne({ _id: notificationId, user: userId }, { read: true });
}