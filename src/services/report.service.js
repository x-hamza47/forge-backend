import WorkoutLog from "../models/workoutLog.model.js";
import Meal from "../models/meal.model.js";
import BodyEntry from "../models/bodyEntry.model.js";
import PerformanceEntry from "../models/performanceEntry.model.js";

const toISODate = (d) => {
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const escapeCell = (value) => {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export const toCsv = (headers, rows) =>
  [headers, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n");

const resolveRange = ({ from, to }) => {
  const end = to ? new Date(`${to}T23:59:59.999`) : new Date();
  const start = from ? new Date(`${from}T00:00:00`) : new Date(end.getTime() - 90 * 86400000);
  return { start, end, startISO: toISODate(start), endISO: toISODate(end) };
};

export const buildReportData = async (userId, type, range = {}) => {
  const { start, end, startISO, endISO } = resolveRange(range);

  if (type === "workouts") {
    const logs = await WorkoutLog.find({
      user: userId,
      performedAt: { $gte: start, $lte: end },
    }).sort({ performedAt: 1 });

    return {
      title: "Workout report",
      headers: ["Date", "Workout", "Category", "Duration (min)", "Exercise", "Set", "Reps", "Weight (kg)"],
      rows: logs.flatMap((log) =>
        log.exercises.flatMap((e) =>
          e.sets.map((s, i) => [
            toISODate(log.performedAt),
            log.name,
            log.category,
            log.durationMin,
            e.name,
            i + 1,
            s.reps,
            s.weightKg ?? "",
          ]),
        ),
      ),
    };
  }

  if (type === "nutrition") {
    const meals = await Meal.find({
      user: userId,
      date: { $gte: startISO, $lte: endISO },
    }).sort({ date: 1, createdAt: 1 });

    return {
      title: "Nutrition report",
      headers: ["Date", "Meal", "Food", "Quantity", "Unit", "Calories", "Protein (g)", "Carbs (g)", "Fat (g)"],
      rows: meals.flatMap((m) =>
        m.items.map((i) => [
          m.date,
          m.mealType,
          i.name,
          i.quantity,
          i.unit,
          i.calories,
          i.macros?.protein ?? 0,
          i.macros?.carbs ?? 0,
          i.macros?.fat ?? 0,
        ]),
      ),
    };
  }

  if (type === "progress") {
    const [body, perf] = await Promise.all([
      BodyEntry.find({ user: userId, date: { $gte: startISO, $lte: endISO } }),
      PerformanceEntry.find({ user: userId, date: { $gte: startISO, $lte: endISO } }),
    ]);

    const rows = [
      ...body.map((b) => [
        b.date,
        "body",
        "weight_kg",
        b.weightKg ?? "",
        [
          ...["chest", "waist", "hips", "biceps", "thighs"]
            .filter((k) => b.measurements?.[k] !== undefined && b.measurements?.[k] !== null)
            .map((k) => `${k} ${b.measurements[k]} cm`),
        ].join("; "),
      ]),
      ...perf.map((p) => [p.date, "performance", p.metric, p.value, p.notes]),
    ].sort((a, b) => a[0].localeCompare(b[0]));

    return {
      title: "Progress report",
      headers: ["Date", "Type", "Metric", "Value", "Details"],
      rows,
    };
  }

  return null;
};