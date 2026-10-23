const ACTIVITY_FACTOR = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

const GOAL_ADJUSTMENT = {
  weight_loss: -500,
  muscle_gain: 300,
  maintenance: 0,
  endurance: 200,
};

const PROTEIN_PER_KG = {
  weight_loss: 2,
  muscle_gain: 1.8,
  maintenance: 1.6,
  endurance: 1.4,
};

const MIN_CALORIES = 1200;

export const DEFAULT_TARGETS = {
  calories: 2000,
  macros: { protein: 120, carbs: 225, fat: 65 },
};

const ageFrom = (dateOfBirth) => {
  if (!dateOfBirth) return 30;
  const diff = Date.now() - new Date(dateOfBirth).getTime();
  return Math.max(Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000)), 15);
};

export const calculateTargets = (user) => {
  if (!user?.weight || !user?.height) return DEFAULT_TARGETS;

  const sexOffset = user.sex === "male" ? 5 : user.sex === "female" ? -161 : -78;
  const bmr = 10 * user.weight + 6.25 * user.height - 5 * ageFrom(user.dateOfBirth) + sexOffset;
  const maintenance = bmr * (ACTIVITY_FACTOR[user.activityLevel] ?? 1.375);
  const goal = user.goal ?? "maintenance";

  const calories = Math.max(Math.round(maintenance + GOAL_ADJUSTMENT[goal]), MIN_CALORIES);
  const protein = Math.round(user.weight * PROTEIN_PER_KG[goal]);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(Math.round((calories - protein * 4 - fat * 9) / 4), 0);

  return { calories, macros: { protein, carbs, fat } };
};

const REQUIRED_FIELDS = [
  "weight",
  "height",
  "dateOfBirth",
  "sex",
  "goal",
  "activityLevel",
];

const WORKOUTS_PER_WEEK_BY_GOAL = {
  weight_loss: 4,
  muscle_gain: 4,
  maintenance: 3,
  endurance: 5,
};

const CATEGORIES_BY_GOAL = {
  weight_loss: ["Strength", "Cardio", "HIIT"],
  muscle_gain: ["Strength", "Hypertrophy", "Full Body"],
  maintenance: ["Strength", "Cardio", "Mobility"],
  endurance: ["Cardio", "Endurance", "Running"],
};

const WEEKLY_WEIGHT_CHANGE = {
  weight_loss: -0.5,
  muscle_gain: 0.25,
  maintenance: 0,
  endurance: 0,
};

export const calculatePlan = (user) => {
  const missingFields = REQUIRED_FIELDS.filter(
    (field) =>
      !user ||
      user[field] === undefined ||
      user[field] === null ||
      user[field] === "",
  );

  const targets = calculateTargets(user);
  const goal = user?.goal ?? "maintenance";

  const weightKg = user?.weight ?? 70;
  const waterMl = Math.round(weightKg * 35);
  const waterLiters = Math.round((waterMl / 1000) * 10) / 10;

  const recommendedWorkoutsPerWeek = WORKOUTS_PER_WEEK_BY_GOAL[goal] ?? 4;
  const recommendedCategories = CATEGORIES_BY_GOAL[goal] ?? ["Strength", "Cardio"];
  const estimatedWeeklyWeightChange = WEEKLY_WEIGHT_CHANGE[goal] ?? 0;

  let estimatedTargetDate = null;
  if (user?.targetWeight && user?.weight && estimatedWeeklyWeightChange !== 0) {
    const diff = user.targetWeight - user.weight;
    const movingCloser =
      (estimatedWeeklyWeightChange < 0 && diff < 0) ||
      (estimatedWeeklyWeightChange > 0 && diff > 0);
    if (movingCloser) {
      const weeks = Math.abs(diff) / Math.abs(estimatedWeeklyWeightChange);
      const targetDate = new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000);
      estimatedTargetDate = targetDate.toISOString().split("T")[0];
    }
  }

  const tips = [
    `Eat ${targets.calories.toLocaleString()} kcal and ${targets.macros.protein} g protein daily`,
    `Train ${recommendedWorkoutsPerWeek} times this week (${recommendedCategories.slice(0, 2).join(" & ")})`,
    `Drink ${waterLiters} L of water daily (${waterMl.toLocaleString()} ml)`,
  ];

  if (goal === "weight_loss") {
    tips.push("Maintain a 500 kcal deficit and prioritize high-protein meals");
  } else if (goal === "muscle_gain") {
    tips.push("Focus on progressive overload and get 7-8 hours of sleep");
  } else if (goal === "endurance") {
    tips.push("Stay hydrated and fuel workouts with complex carbohydrates");
  } else {
    tips.push("Keep nutrition balanced and maintain regular workout sessions");
  }

  return {
    calories: targets.calories,
    macros: targets.macros,
    waterMl,
    waterLiters,
    recommendedWorkoutsPerWeek,
    recommendedCategories,
    estimatedWeeklyWeightChange,
    estimatedTargetDate,
    tips,
    missingFields,
  };
};