import mongoose from "mongoose";
import Follow from "../models/follow.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import { env } from "../config/env.js";
import { createNotification } from "./notification.service.js";

const USER_FIELDS = "name username profilePicture";

function toSummary(user, followStatus = null) {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    profilePicture: user.profilePicture ? `${env.serverUrl}${user.profilePicture}` : null,
    followStatus,
  };
}

function paginate({ page, limit }) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 50);
  const safePage = Math.max(Number(page) || 1, 1);
  return { safePage, safeLimit, skip: (safePage - 1) * safeLimit };
}

function assertValidId(id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Invalid user id.");
}

async function getTarget(targetId) {
  assertValidId(targetId);
  const target = await User.findById(targetId);
  if (!target || !target.isActive) throw new ApiError(404, "User not found.");
  return target;
}

async function canViewLists(viewerId, target) {
  if (!target.preferences?.privacy?.isPrivate) return true;
  if (target._id.equals(viewerId)) return true;
  const rel = await Follow.exists({ follower: viewerId, following: target._id, status: "accepted" });
  return !!rel;
}

export async function getFollowCounts(userId) {
  const [followers, following] = await Promise.all([
    Follow.countDocuments({ following: userId, status: "accepted" }),
    Follow.countDocuments({ follower: userId, status: "accepted" }),
  ]);
  return { followers, following };
}

export async function getFollowStatus(viewerId, targetId) {
  const rel = await Follow.findOne({ follower: viewerId, following: targetId });
  return rel ? rel.status : null;
}

export async function followUser(currentUser, targetId) {
  const target = await getTarget(targetId);

  if (target._id.equals(currentUser._id)) throw new ApiError(400, "You can't follow yourself.");
  if (currentUser.role === "admin" || target.role === "admin") {
    throw new ApiError(403, "Admin accounts can't follow or be followed.");
  }

  const existing = await Follow.findOne({ follower: currentUser._id, following: target._id });
  if (existing) {
    throw new ApiError(409, existing.status === "pending" ? "Follow request already sent." : "You already follow this user.");
  }

  const isPrivate = !!target.preferences?.privacy?.isPrivate;
  const status = isPrivate ? "pending" : "accepted";

  await Follow.create({ follower: currentUser._id, following: target._id, status });

  await createNotification({
    user: target._id,
    actor: currentUser._id,
    type: isPrivate ? "follow_request" : "new_follower",
    message: isPrivate
      ? `${currentUser.name} requested to follow you.`
      : `${currentUser.name} started following you.`,
  });

  return { status };
}

export async function unfollowUser(currentUserId, targetId) {
  assertValidId(targetId);
  const result = await Follow.deleteOne({ follower: currentUserId, following: targetId });
  if (result.deletedCount === 0) throw new ApiError(404, "You are not following this user.");
}

export async function removeFollower(currentUserId, followerId) {
  assertValidId(followerId);
  const result = await Follow.deleteOne({ follower: followerId, following: currentUserId, status: "accepted" });
  if (result.deletedCount === 0) throw new ApiError(404, "This user is not following you.");
}

export async function getFollowers(viewerId, targetId, query = {}) {
  const target = await getTarget(targetId);
  if (!(await canViewLists(viewerId, target))) throw new ApiError(403, "This account is private.");

  const { safePage, safeLimit, skip } = paginate(query);
  const filter = { following: target._id, status: "accepted" };

  const [items, total] = await Promise.all([
    Follow.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).populate("follower", USER_FIELDS),
    Follow.countDocuments(filter),
  ]);

  return {
    items: items.filter((f) => f.follower).map((f) => toSummary(f.follower, "accepted")),
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit),
  };
}

export async function getFollowing(viewerId, targetId, query = {}) {
  const target = await getTarget(targetId);
  if (!(await canViewLists(viewerId, target))) throw new ApiError(403, "This account is private.");

  const { safePage, safeLimit, skip } = paginate(query);
  const filter = { follower: target._id, status: "accepted" };

  const [items, total] = await Promise.all([
    Follow.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).populate("following", USER_FIELDS),
    Follow.countDocuments(filter),
  ]);

  return {
    items: items.filter((f) => f.following).map((f) => toSummary(f.following, "accepted")),
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit),
  };
}

export async function getIncomingRequests(userId, query = {}) {
  const { safePage, safeLimit, skip } = paginate(query);
  const filter = { following: userId, status: "pending" };

  const [items, total] = await Promise.all([
    Follow.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).populate("follower", USER_FIELDS),
    Follow.countDocuments(filter),
  ]);

  return {
    items: items
      .filter((f) => f.follower)
      .map((f) => ({ requestId: f._id.toString(), createdAt: f.createdAt, user: toSummary(f.follower, "pending") })),
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit),
  };
}

export async function approveRequest(currentUser, requestId) {
  assertValidId(requestId);
  const request = await Follow.findOneAndUpdate(
    { _id: requestId, following: currentUser._id, status: "pending" },
    { status: "accepted" },
    { new: true }
  );
  if (!request) throw new ApiError(404, "Follow request not found.");

  await createNotification({
    user: request.follower,
    actor: currentUser._id,
    type: "follow_accepted",
    message: `${currentUser.name} accepted your follow request.`,
  });
}

export async function rejectRequest(currentUserId, requestId) {
  assertValidId(requestId);
  const result = await Follow.deleteOne({ _id: requestId, following: currentUserId, status: "pending" });
  if (result.deletedCount === 0) throw new ApiError(404, "Follow request not found.");
}

export async function searchUsers(currentUserId, { q = "", page = 1, limit = 20 } = {}) {
  const term = String(q).trim();

  const { safePage, safeLimit, skip } = paginate({ page, limit });

  const filter = {
    _id: { $ne: currentUserId },
    role: "user",
    isActive: true,
    "preferences.privacy.searchable": { $ne: false },
  };

  if (term) {
    const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: regex }, { username: regex }];
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .select(USER_FIELDS)
      .sort(term ? { name: 1 } : { createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
    User.countDocuments(filter),
  ]);

  const relations = await Follow.find({
    follower: currentUserId,
    following: { $in: users.map((u) => u._id) },
  }).select("following status");

  const statusById = new Map(relations.map((r) => [r.following.toString(), r.status]));

  return {
    items: users.map((u) => toSummary(u, statusById.get(u._id.toString()) ?? null)),
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit),
  };
}