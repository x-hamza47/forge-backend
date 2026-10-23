import mongoose from "mongoose";
import Workout from "../models/workout.model.js";
import WorkoutLog from "../models/workoutLog.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import ApiError from "../utils/ApiError.js";

const WRITABLE_FIELDS = ["name", "category", "performedAt", "durationMin", "exercises", "notes"];
const DAY_MS = 24 * 60 * 60 * 1000;

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseDate = (value, label) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new ApiError(400, `Invalid ${label}`);
  return date;
};

const cleanExercises = (exercises) =>
  exercises.map(({ name, sets, notes }) => ({
    name,
    sets: sets.map(({ reps, weightKg }) => ({ reps, weightKg: weightKg ?? null })),
    notes,
  }));

const expandRoutine = (routine) =>
  routine.exercises.map((e) => ({
    name: e.name,
    sets: Array.from({ length: e.sets }, () => ({ reps: e.reps, weightKg: e.weightKg })),
    notes: e.notes,
  }));

const findOwnedLog = async (userId, id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "Workout log not found");
  const log = await WorkoutLog.findOne({ _id: id, user: userId });
  if (!log) throw new ApiError(404, "Workout log not found");
  return log;
};

const syncLastPerformed = async (userId, workoutId) => {
  if (!workoutId) return;
  const latest = await WorkoutLog.findOne({ user: userId, workout: workoutId })
    .sort({ performedAt: -1 })
    .select("performedAt");
  await Workout.updateOne(
    { _id: workoutId, user: userId },
    { lastPerformedAt: latest?.performedAt ?? null },
  );
};

const notifyCompleted = async (userId, log) => {
  try {
    const user = await User.findById(userId).select("preferences.notifications");
    if (user?.preferences?.notifications?.workout === false) return;
    await Notification.create({
      user: userId,
      type: "workout_completed",
      message: `You completed "${log.name}"`,
    });
  } catch {
    // A failed notification must never fail the workout log
  }
};

export const logWorkout = async (userId, payload = {}) => {
  let data = {};
  let routine = null;

  if (payload.workoutId) {
    if (!mongoose.isValidObjectId(payload.workoutId)) {
      throw new ApiError(404, "Workout not found");
    }
    routine = await Workout.findOne({ _id: payload.workoutId, user: userId });
    if (!routine) throw new ApiError(404, "Workout not found");
    data = {
      name: routine.name,
      category: routine.category,
      durationMin: routine.durationMin,
      exercises: expandRoutine(routine),
    };
  }

  for (const key of WRITABLE_FIELDS) {
    if (payload[key] !== undefined) data[key] = payload[key];
  }

  if (data.exercises) data.exercises = cleanExercises(data.exercises);

  if (data.performedAt !== undefined) {
    data.performedAt = parseDate(data.performedAt, "date");
    if (data.performedAt.getTime() > Date.now() + DAY_MS) {
      throw new ApiError(400, "Workout date cannot be in the future");
    }
  }

  const log = await WorkoutLog.create({
    ...data,
    user: userId,
    workout: routine?._id ?? null,
  });

  await syncLastPerformed(userId, routine?._id);
  await notifyCompleted(userId, log);

  return log;
};

export const listLogs = async (userId, query = {}) => {
  const { category, search, from, to } = query;
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);

  const filter = { user: userId };
  if (category && category !== "all") filter.category = category;

  if (from || to) {
    filter.performedAt = {};
    if (from) filter.performedAt.$gte = parseDate(from, "from date");
    if (to) {
      const toDate = parseDate(to, "to date");
      toDate.setHours(23, 59, 59, 999);
      filter.performedAt.$lte = toDate;
    }
  }

  const term = typeof search === "string" ? search.trim() : "";
  if (term) {
    const regex = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ name: regex }, { "exercises.name": regex }];
  }

  const [items, total] = await Promise.all([
    WorkoutLog.find(filter)
      .sort({ performedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    WorkoutLog.countDocuments(filter),
  ]);

  return { items, total, page, limit, pages: Math.ceil(total / limit) };
};

export const getLog = (userId, id) => findOwnedLog(userId, id);

export const deleteLog = async (userId, id) => {
  const log = await findOwnedLog(userId, id);
  const workoutId = log.workout;
  await log.deleteOne();
  await syncLastPerformed(userId, workoutId);
};

export const listExerciseNames = async (userId) => {
  const names = await WorkoutLog.distinct("exercises.name", { user: userId });
  return names.sort((a, b) => a.localeCompare(b));
};

export const getExerciseProgress = async (userId, name, query = {}) => {
  const exercise = typeof name === "string" ? name.trim() : "";
  if (!exercise) throw new ApiError(400, "Exercise name is required");

  const days = { "7d": 7, "30d": 30, "90d": 90 }[query.range];
  const filter = {
    user: userId,
    exercises: { $elemMatch: { name: new RegExp(`^${escapeRegex(exercise)}$`, "i") } },
  };
  if (days) filter.performedAt = { $gte: new Date(Date.now() - days * DAY_MS) };

  const logs = await WorkoutLog.find(filter).sort({ performedAt: 1 });
  const target = exercise.toLowerCase();

  const points = logs.map((log) => {
    let maxWeightKg = 0;
    let volumeKg = 0;
    let totalReps = 0;
    let estimated1RMKg = 0;

    for (const e of log.exercises) {
      if (e.name.toLowerCase() !== target) continue;
      for (const set of e.sets) {
        const weight = set.weightKg ?? 0;
        maxWeightKg = Math.max(maxWeightKg, weight);
        volumeKg += weight * set.reps;
        totalReps += set.reps;
        estimated1RMKg = Math.max(estimated1RMKg, weight * (1 + set.reps / 30));
      }
    }

    return {
      date: log.performedAt,
      maxWeightKg,
      volumeKg: Math.round(volumeKg * 100) / 100,
      totalReps,
      estimated1RMKg: Math.round(estimated1RMKg * 10) / 10,
    };
  });

  const best = points.reduce(
    (acc, p) => ({
      maxWeightKg: Math.max(acc.maxWeightKg, p.maxWeightKg),
      estimated1RMKg: Math.max(acc.estimated1RMKg, p.estimated1RMKg),
    }),
    { maxWeightKg: 0, estimated1RMKg: 0 },
  );

  return { exercise, points, personalBest: best, sessions: points.length };
};