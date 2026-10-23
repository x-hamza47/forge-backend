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