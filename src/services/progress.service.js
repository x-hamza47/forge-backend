import mongoose from "mongoose";
import BodyEntry from "../models/bodyEntry.model.js";
import PerformanceEntry from "../models/performanceEntry.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import ApiError from "../utils/ApiError.js";

const RANGE_DAYS = { "30d": 30, "90d": 90, "1y": 365 };
const DUPLICATE_DATE_MESSAGE = "You already logged a check-in for this date. Edit it instead.";

const toISODate = (d) => {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const sinceDate = (days) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (days - 1));
  return toISODate(d);
};

const findOwned = async (Model, userId, id, label) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, `${label} not found`);
  const doc = await Model.findOne({ _id: id, user: userId });
  if (!doc) throw new ApiError(404, `${label} not found`);
  return doc;
};

const isDuplicateKey = (err) => err?.code === 11000;

const syncWeight = async (userId) => {
  try {
    const latest = await BodyEntry.findOne({ user: userId, weightKg: { $ne: null } }).sort({
      date: -1,
    });
    if (!latest) return;

    const user = await User.findById(userId).select("weight targetWeight goal preferences");
    if (!user) return;

    const previous = user.weight;
    user.weight = latest.weightKg;
    await user.save();

    const target = user.targetWeight;
    if (!target || previous === null || user.preferences?.notifications?.goal === false) return;

    const crossed =
      (previous > target && latest.weightKg <= target) ||
      (previous < target && latest.weightKg >= target);
    if (!crossed) return;

    await Notification.create({
      user: userId,
      type: "goal_achieved",
      message: "You reached your target weight",
    });
  } catch {
    // Syncing must never fail the check-in save
  }
};

export const getProgress = async (userId, range = "90d") => {
  const since = sinceDate(RANGE_DAYS[range] ?? 90);

  const [body, performance, user] = await Promise.all([
    BodyEntry.find({ user: userId, date: { $gte: since } }).sort({ date: 1, createdAt: 1 }),
    PerformanceEntry.find({ user: userId, date: { $gte: since } }).sort({ date: 1, createdAt: 1 }),
    User.findById(userId).select("targetWeight"),
  ]);

  return { range, body, performance, goalWeightKg: user?.targetWeight ?? null };
};

export const createBodyEntry = async (userId, payload) => {
  try {
    const entry = await BodyEntry.create({ ...payload, user: userId });
    await syncWeight(userId);
    return entry;
  } catch (err) {
    if (isDuplicateKey(err)) throw new ApiError(409, DUPLICATE_DATE_MESSAGE);
    throw err;
  }
};

export const updateBodyEntry = async (userId, id, payload) => {
  const entry = await findOwned(BodyEntry, userId, id, "Check-in");
  entry.set(payload);
  try {
    await entry.save();
  } catch (err) {
    if (isDuplicateKey(err)) throw new ApiError(409, DUPLICATE_DATE_MESSAGE);
    throw err;
  }
  await syncWeight(userId);
  return entry;
};

export const deleteBodyEntry = async (userId, id) => {
  const entry = await findOwned(BodyEntry, userId, id, "Check-in");
  await entry.deleteOne();
  await syncWeight(userId);
};

export const createPerformance = (userId, payload) =>
  PerformanceEntry.create({ ...payload, user: userId });

export const updatePerformance = async (userId, id, payload) => {
  const entry = await findOwned(PerformanceEntry, userId, id, "Record");
  entry.set(payload);
  await entry.save();
  return entry;
};

export const deletePerformance = async (userId, id) => {
  const entry = await findOwned(PerformanceEntry, userId, id, "Record");
  await entry.deleteOne();
};