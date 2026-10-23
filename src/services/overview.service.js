import User from "../models/user.model.js";
import Workout from "../models/workout.model.js";
import WorkoutLog from "../models/workoutLog.model.js";
import Meal from "../models/meal.model.js";
import BodyEntry from "../models/bodyEntry.model.js";
import Notification from "../models/notification.model.js";
import { calculateTargets } from "../utils/nutritionTargets.js";

const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 };
const WEEKLY_GOAL = 5;
const DAY_MS = 24 * 60 * 60 * 1000;
const round1 = (n) => Math.round(n * 10) / 10;

const toISODate = (d) => {
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
};

const startOfDay = (offset = 0) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - offset);
    return d;
};

const computeStreaks = (logDates) => {
    const days = [...new Set(logDates)].sort();
    let best = 0;
    let run = 0;
    let prev = null;
    for (const day of days) {
        const t = new Date(day).getTime();
        run = prev !== null && t - prev === DAY_MS ? run + 1 : 1;
        best = Math.max(best, run);
        prev = t;
    }

    const set = new Set(days);
    let current = 0;
    let cursor = startOfDay(set.has(toISODate(startOfDay())) ? 0 : 1);
    while (set.has(toISODate(cursor))) {
        current += 1;
        cursor = new Date(cursor.getTime() - DAY_MS);
    }
    return { current, best };
};
const ACTIVITY_TYPE = {
    workout_completed: "workout_completed",
    goal_achieved: "goal_achieved",
    new_follower: "new_follower",
    follow_request: "new_follower",
    follow_accepted: "new_follower",
    reminder: "goal_achieved",
};
export const getOverview = async (userId, range = "30d") => {
    const days = RANGE_DAYS[range] ?? 30;
    const rangeStart = startOfDay(days - 1);
    const weekStart = startOfDay(6);
    const today = toISODate(startOfDay());
    const rangeStartISO = toISODate(rangeStart);

    const [user, logs, allLogDates, meals, bodyEntries, recentLogs, recentMealDocs, notifications] =
        await Promise.all([
            User.findById(userId),
            WorkoutLog.find({ user: userId, performedAt: { $gte: rangeStart } }),
            WorkoutLog.find({ user: userId }).select("performedAt"),
            Meal.find({ user: userId, date: today }),
            BodyEntry.find({ user: userId, weightKg: { $ne: null }, date: { $gte: rangeStartISO } }).sort({
                date: 1,
            }),
            WorkoutLog.find({ user: userId }).sort({ performedAt: -1 }).limit(5),
            Meal.find({ user: userId }).sort({ date: -1, createdAt: -1 }).limit(4),
            Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(4).populate("actor", "name"),
        ]);

    const targets = calculateTargets(user);

    const activityByDate = new Map();
    for (const log of logs) {
        const key = toISODate(log.performedAt);
        const entry = activityByDate.get(key) ?? { workouts: 0, minutes: 0 };
        entry.workouts += 1;
        entry.minutes += log.durationMin;
        activityByDate.set(key, entry);
    }
    const workoutActivity = Array.from({ length: days }, (_, i) => {
        const date = toISODate(startOfDay(days - 1 - i));
        return { date, workouts: 0, minutes: 0, ...activityByDate.get(date) };
    });

    const workoutsThisWeek = logs.filter((l) => l.performedAt >= weekStart).length;

    const todayTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const meal of meals) {
        for (const item of meal.items) {
            todayTotals.calories += item.calories;
            todayTotals.protein += item.macros?.protein ?? 0;
            todayTotals.carbs += item.macros?.carbs ?? 0;
            todayTotals.fat += item.macros?.fat ?? 0;
        }
    }

    const progressTrend = bodyEntries.map((e) => ({ date: e.date, weightKg: e.weightKg }));
    const currentWeightKg = progressTrend.at(-1)?.weightKg ?? user.weight ?? 0;
    const weightChangeKg =
        progressTrend.length > 1 ? round1(currentWeightKg - progressTrend[0].weightKg) : 0;

    const streaks = computeStreaks(allLogDates.map((l) => toISODate(l.performedAt)));

    const goals = [
        {
            id: "weekly-workouts",
            title: "Workouts this week",
            current: workoutsThisWeek,
            target: WEEKLY_GOAL,
            unit: "workouts",
        },
    ];
    if (user.targetWeight && currentWeightKg) {
        goals.unshift({
            id: "target-weight",
            title: `Reach ${user.targetWeight} kg`,
            current: currentWeightKg,
            target: user.targetWeight,
            startValue: progressTrend[0]?.weightKg ?? currentWeightKg,
            unit: "kg",
        });
    }

    return {
        range,
        summary: {
            workoutsThisWeek,
            workoutsWeeklyGoal: WEEKLY_GOAL,
            caloriesToday: Math.round(todayTotals.calories),
            caloriesTarget: targets.calories,
            currentWeightKg,
            weightChangeKg,
            streakDays: streaks.current,
            bestStreakDays: streaks.best,
        },
        workoutActivity,
        nutritionToday: {
            calories: Math.round(todayTotals.calories),
            caloriesTarget: targets.calories,
            macros: {
                protein: round1(todayTotals.protein),
                carbs: round1(todayTotals.carbs),
                fat: round1(todayTotals.fat),
            },
            macroTargets: targets.macros,
        },
        progressTrend,
        recentWorkouts: recentLogs.map((l) => ({
            id: l.id,
            name: l.name,
            category: l.category,
            performedAt: l.performedAt,
            durationMin: l.durationMin,
            exerciseCount: l.exercises.length,
        })),
        recentMeals: recentMealDocs.map((m) => {
            const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
            for (const item of m.items) {
                totals.calories += item.calories;
                totals.protein += item.macros?.protein ?? 0;
                totals.carbs += item.macros?.carbs ?? 0;
                totals.fat += item.macros?.fat ?? 0;
            }
            return {
                id: m.id,
                name: m.items.map((i) => i.name).join(", "),
                mealType: m.mealType,
                loggedAt: m.createdAt,
                calories: Math.round(totals.calories),
                macros: {
                    protein: round1(totals.protein),
                    carbs: round1(totals.carbs),
                    fat: round1(totals.fat),
                },
            };
        }),
        goals,
        activity: notifications.map((n) => ({
            id: n.id,
            type: ACTIVITY_TYPE[n.type] ?? "goal_achieved",
            message: n.message,
            createdAt: n.createdAt,
            read: n.read,
        })),
        reminders: [],
    };
};