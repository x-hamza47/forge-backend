import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import {
  followUser,
  unfollowUser,
  removeFollower,
  getFollowers,
  getFollowing,
  getIncomingRequests,
  approveRequest,
  rejectRequest,
  searchUsers,
} from "../services/follow.service.js";

export const follow = asyncHandler(async (req, res) => {
  const result = await followUser(req.user, req.params.id);
  const message = result.status === "pending" ? "Follow request sent." : "Followed successfully.";
  return ok(res, result, message, 201);
});

export const unfollow = asyncHandler(async (req, res) => {
  await unfollowUser(req.user._id, req.params.id);
  return ok(res, null, "Unfollowed.");
});

export const removeMyFollower = asyncHandler(async (req, res) => {
  await removeFollower(req.user._id, req.params.id);
  return ok(res, null, "Follower removed.");
});

export const listFollowers = asyncHandler(async (req, res) => {
  const data = await getFollowers(req.user._id, req.params.id, req.query);
  return ok(res, data, "Followers fetched.");
});

export const listFollowing = asyncHandler(async (req, res) => {
  const data = await getFollowing(req.user._id, req.params.id, req.query);
  return ok(res, data, "Following fetched.");
});

export const listRequests = asyncHandler(async (req, res) => {
  const data = await getIncomingRequests(req.user._id, req.query);
  return ok(res, data, "Requests fetched.");
});

export const approve = asyncHandler(async (req, res) => {
  await approveRequest(req.user, req.params.requestId);
  return ok(res, null, "Request approved.");
});

export const reject = asyncHandler(async (req, res) => {
  await rejectRequest(req.user._id, req.params.requestId);
  return ok(res, null, "Request rejected.");
});

export const search = asyncHandler(async (req, res) => {
  const data = await searchUsers(req.user._id, req.query);
  return ok(res, data, "Users fetched.");
});