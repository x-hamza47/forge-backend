import mongoose from "mongoose";
import Meal, { MEAL_TYPES } from "../models/meal.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import ApiError from "../utils/ApiError.js";
import { calculateTargets } from "../utils/nutritionTargets.js";

const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 };
const round1 = (n) => Math.round(n * 10) / 10;

const toISODate = (d) => {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const cleanItems = (items) =>
  items.map(({ name, quantity, unit, calories, macros }) => ({
    name,
    quantity,
    unit,
    calories,
    macros: {
      protein: macros?.protein ?? 0,
      carbs: macros?.carbs ?? 0,
      fat: macros?.fat ?? 0,
    },
  }));

const findOwned = async (userId, id) => {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "Meal not found");
  const meal = await Meal.findOne({ _id: id, user: userId });
  if (!meal) throw new ApiError(404, "Meal not found");
  return meal;
};

const totalsOf = (meals) => {
  const totals = { calories: 0, macros: { protein: 0, carbs: 0, fat: 0 } };
  for (const meal of meals) {
    for (const item of meal.items) {
      totals.calories += item.calories;
      totals.macros.protein += item.macros?.protein ?? 0;
      totals.macros.carbs += item.macros?.carbs ?? 0;
      totals.macros.fat += item.macros?.fat ?? 0;
    }
  }
  return {
    calories: Math.round(totals.calories),
    macros: {
      protein: round1(totals.macros.protein),
      carbs: round1(totals.macros.carbs),
      fat: round1(totals.macros.fat),
    },
  };
};

const getTargets = async (userId) => {
  const user = await User.findById(userId).select(
    "weight height dateOfBirth sex goal activityLevel",
  );
  return calculateTargets(user);
};

const notifyGoalReached = async (userId, date, targets) => {
  try {
    if (date !== toISODate(new Date())) return;
    const user = await User.findById(userId).select("preferences.notifications");
    if (user?.preferences?.notifications?.goal === false) return;

    const meals = await Meal.find({ user: userId, date });
    const { calories } = totalsOf(meals);
    if (calories < targets.calories * 0.95 || calories > targets.calories * 1.05) return;

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const exists = await Notification.exists({
      user: userId,
      type: "goal_achieved",
      createdAt: { $gte: startOfDay },
    });
    if (exists) return;

    await Notification.create({
      user: userId,
      type: "goal_achieved",
      message: "You hit your daily calorie target",
    });
  } catch {
    // A failed notification must never fail the meal save
  }
};

export const getDay = async (userId, date) => {
  const [meals, targets] = await Promise.all([
    Meal.find({ user: userId, date }),
    getTargets(userId),
  ]);

  meals.sort(
    (a, b) =>
      MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType) ||
      a.createdAt - b.createdAt,
  );

  return { date, meals, totals: totalsOf(meals), targets };
};

export const getAnalytics = async (userId, range = "7d") => {
  const days = RANGE_DAYS[range] ?? 7;
  const dates = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (days - 1 - i));
    return toISODate(d);
  });

  const [meals, targets] = await Promise.all([
    Meal.find({ user: userId, date: { $gte: dates[0], $lte: dates[dates.length - 1] } }),
    getTargets(userId),
  ]);

  const byDate = new Map();
  for (const meal of meals) {
    byDate.set(meal.date, [...(byDate.get(meal.date) ?? []), meal]);
  }

  let loggedDays = 0;
  const sum = { calories: 0, protein: 0, carbs: 0, fat: 0 };

  const trend = dates.map((date) => {
    const dayMeals = byDate.get(date) ?? [];
    const totals = totalsOf(dayMeals);
    if (dayMeals.length > 0) {
      loggedDays += 1;
      sum.calories += totals.calories;
      sum.protein += totals.macros.protein;
      sum.carbs += totals.macros.carbs;
      sum.fat += totals.macros.fat;
    }
    return { date, calories: totals.calories, macros: totals.macros };
  });

  const divisor = loggedDays || 1;

  return {
    range,
    targets,
    trend,
    averages: {
      calories: Math.round(sum.calories / divisor),
      macros: {
        protein: round1(sum.protein / divisor),
        carbs: round1(sum.carbs / divisor),
        fat: round1(sum.fat / divisor),
      },
    },
    loggedDays,
  };
};

export const createMeal = async (userId, payload) => {
  const meal = await Meal.create({
    user: userId,
    date: payload.date,
    mealType: payload.mealType,
    items: cleanItems(payload.items),
    notes: payload.notes,
  });
  await notifyGoalReached(userId, meal.date, await getTargets(userId));
  return meal;
};

export const updateMeal = async (userId, id, payload) => {
  const meal = await findOwned(userId, id);
  const { date, mealType, items, notes } = payload;
  if (date !== undefined) meal.date = date;
  if (mealType !== undefined) meal.mealType = mealType;
  if (items !== undefined) meal.items = cleanItems(items);
  if (notes !== undefined) meal.notes = notes;
  await meal.save();
  await notifyGoalReached(userId, meal.date, await getTargets(userId));
  return meal;
};

export const deleteMeal = async (userId, id) => {
  const meal = await findOwned(userId, id);
  await meal.deleteOne();
};