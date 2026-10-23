import mongoose from "mongoose";
import Workout, { WORKOUT_CATEGORIES } from "../models/workout.model.js";
import ApiError from "../utils/ApiError.js";

const WRITABLE_FIELDS = [
  "name",
  "category",
  "tags",
  "exercises",
  "durationMin",
  "notes",
  "favorite",
];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pickWritable = (payload = {}) =>
  Object.fromEntries(
    WRITABLE_FIELDS.filter((key) => payload[key] !== undefined).map((key) => [
      key,
      payload[key],
    ]),
  );

const cleanExercises = (exercises) =>
  exercises.map(({ name, sets, reps, weightKg, notes }) => ({
    name,
    sets,
    reps,
    weightKg,
    notes,
  }));

const findOwned = async (userId, id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "Workout not found");
  const workout = await Workout.findOne({ _id: id, user: userId });
  if (!workout) throw new ApiError(404, "Workout not found");
  return workout;
};

export const listWorkouts = async (userId, query = {}) => {
  const { search, category, tag, favorite, sort = "recent" } = query;
  const filter = { user: userId };

  if (category && category !== "all") {
    if (!WORKOUT_CATEGORIES.includes(category)) {
      throw new ApiError(400, "Invalid category");
    }
    filter.category = category;
  }

  if (tag) filter.tags = String(tag).trim().toLowerCase();
  if (favorite === "true" || favorite === true) filter.favorite = true;

  const term = typeof search === "string" ? search.trim() : "";
  if (term) {
    const regex = new RegExp(escapeRegex(term), "i");
    filter.$or = [{ name: regex }, { tags: regex }, { "exercises.name": regex }];
  }

  const sortSpec =
    sort === "name"
      ? { favorite: -1, name: 1 }
      : { favorite: -1, updatedAt: -1 };

  let cursor = Workout.find(filter).sort(sortSpec);
  if (sort === "name") cursor = cursor.collation({ locale: "en", strength: 2 });

  const workouts = await cursor;

  if (sort === "exercises") {
    workouts.sort(
      (a, b) =>
        Number(b.favorite) - Number(a.favorite) ||
        b.exercises.length - a.exercises.length,
    );
  }

  return workouts;
};

export const getWorkout = (userId, id) => findOwned(userId, id);

export const createWorkout = async (userId, payload) => {
  const data = pickWritable(payload);
  if (data.exercises) data.exercises = cleanExercises(data.exercises);
  return Workout.create({ ...data, user: userId });
};

export const updateWorkout = async (userId, id, payload) => {
  const workout = await findOwned(userId, id);
  const data = pickWritable(payload);
  if (data.exercises) data.exercises = cleanExercises(data.exercises);
  workout.set(data);
  await workout.save();
  return workout;
};

export const deleteWorkout = async (userId, id) => {
  const workout = await findOwned(userId, id);
  await workout.deleteOne();
};

export const duplicateWorkout = async (userId, id) => {
  const source = await findOwned(userId, id);
  const suffix = " (copy)";
  return Workout.create({
    user: userId,
    name: `${source.name.slice(0, 80 - suffix.length)}${suffix}`,
    category: source.category,
    tags: source.tags,
    exercises: cleanExercises(source.exercises),
    durationMin: source.durationMin,
    notes: source.notes,
  });
};