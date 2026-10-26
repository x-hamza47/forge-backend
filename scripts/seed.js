import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/user.model.js";
import Workout from "../src/models/workout.model.js";
import WorkoutLog from "../src/models/workoutLog.model.js";
import Meal from "../src/models/meal.model.js";
import BodyEntry from "../src/models/bodyEntry.model.js";
import PerformanceEntry from "../src/models/performanceEntry.model.js";
import Follow from "../src/models/follow.model.js";
import Reminder from "../src/models/reminder.model.js";
import Ticket from "../src/models/ticket.model.js";
import Notification from "../src/models/notification.model.js";

const pad = (n) => String(n).padStart(2, "0");
const isoDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const dateDaysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

async function runSeed() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/forge";
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);

  console.log("Purging old records...");
  await Promise.all([
    User.deleteMany({}),
    Workout.deleteMany({}),
    WorkoutLog.deleteMany({}),
    Meal.deleteMany({}),
    BodyEntry.deleteMany({}),
    PerformanceEntry.deleteMany({}),
    Follow.deleteMany({}),
    Reminder.deleteMany({}),
    Ticket.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log("Seeding users...");

  // ---------------------------------------------------------------- Admin
  await User.create({
    name: "Forge Admin",
    username: "admin",
    email: "admin@gmail.com",
    password: "Admin12345!",
    role: "admin",
    isActive: true,
    bio: "Forge platform administrator.",
    consentAt: new Date(),
    preferences: {
      units: "metric",
      privacy: { isPrivate: false, searchable: true, showStats: true },
    },
  });

  // ---------------------------------------------------------------- Alex (main demo user)
  const alex = await User.create({
    name: "Alex Carter",
    username: "alex_carter",
    email: "alex@gmail.com",
    password: "Alex12345!",
    role: "user",
    isActive: true,
    bio: "Focused on progressive overload and balanced performance.",
    sex: "male",
    dateOfBirth: new Date("1998-05-14"),
    height: 178,
    weight: 76,
    targetWeight: 80,
    goal: "muscle_gain",
    activityLevel: "very_active",
    consentAt: new Date(),
    preferences: {
      units: "metric",
      notifications: { workout: true, meal: true, goal: true },
      privacy: { isPrivate: false, searchable: true, showStats: true },
    },
  });

  // ---------------------------------------------------------------- Elena
  const elena = await User.create({
    name: "Elena Rostova",
    username: "elena_fit",
    email: "elena@gmail.com",
    password: "Elena12345!",
    role: "user",
    isActive: true,
    bio: "Marathon runner and nutrition fan.",
    sex: "female",
    height: 168,
    weight: 60,
    targetWeight: 58,
    goal: "endurance",
    activityLevel: "active",
    consentAt: new Date(),
    preferences: {
      units: "metric",
      privacy: { isPrivate: false, searchable: true, showStats: true },
    },
  });

  // ---------------------------------------------------------------- Marcus
  const marcus = await User.create({
    name: "Marcus Vance",
    username: "marcus_lift",
    email: "marcus@gmail.com",
    password: "Marcus12345!",
    role: "user",
    isActive: true,
    bio: "Powerlifter chasing heavy compound records.",
    sex: "male",
    height: 182,
    weight: 88,
    targetWeight: 90,
    goal: "muscle_gain",
    activityLevel: "very_active",
    consentAt: new Date(),
    preferences: {
      units: "metric",
      privacy: { isPrivate: false, searchable: true, showStats: true },
    },
  });

  // ================================================================ WORKOUT ROUTINES
  console.log("Seeding workout routines...");

  const pushRoutine = await Workout.create({
    user: alex._id,
    name: "Push Day",
    category: "strength",
    durationMin: 60,
    tags: ["chest", "shoulders", "triceps"],
    notes: "Rest 2 minutes between compound sets.",
    favorite: true,
    exercises: [
      { name: "Barbell Bench Press", sets: 4, reps: 8, weightKg: 85, notes: "Explosive press" },
      { name: "Incline Dumbbell Press", sets: 3, reps: 10, weightKg: 30, notes: "Deep stretch" },
      { name: "Standing Overhead Press", sets: 3, reps: 8, weightKg: 50, notes: "Core tight" },
      { name: "Cable Tricep Pushdowns", sets: 3, reps: 12, weightKg: 35, notes: "Squeeze at lockout" },
    ],
  });

  const pullRoutine = await Workout.create({
    user: alex._id,
    name: "Pull Day",
    category: "strength",
    durationMin: 65,
    tags: ["back", "biceps"],
    notes: "Drive with the elbows.",
    favorite: true,
    exercises: [
      { name: "Weighted Pull-Ups", sets: 4, reps: 8, weightKg: 10, notes: "Full stretch" },
      { name: "Barbell Bent Over Row", sets: 4, reps: 10, weightKg: 75, notes: "45 degree torso" },
      { name: "Lat Pulldown", sets: 3, reps: 12, weightKg: 65, notes: "Control the negative" },
      { name: "Dumbbell Bicep Curls", sets: 3, reps: 12, weightKg: 14, notes: "Supinate at top" },
    ],
  });

  const legRoutine = await Workout.create({
    user: alex._id,
    name: "Leg Day",
    category: "strength",
    durationMin: 70,
    tags: ["quads", "hamstrings", "core"],
    notes: "Deep squat with a tight brace.",
    favorite: false,
    exercises: [
      { name: "Barbell Back Squat", sets: 4, reps: 6, weightKg: 110, notes: "Hit parallel" },
      { name: "Romanian Deadlift", sets: 3, reps: 10, weightKg: 90, notes: "Feel the stretch" },
      { name: "Bulgarian Split Squats", sets: 3, reps: 10, weightKg: 20, notes: "Per leg" },
      { name: "Hanging Leg Raises", sets: 3, reps: 15, weightKg: null, notes: "Controlled" },
    ],
  });

  await Workout.create({
    user: alex._id,
    name: "Easy Cardio",
    category: "cardio",
    durationMin: 30,
    tags: ["running"],
    notes: "Easy pace, keep heart rate low.",
    favorite: false,
    exercises: [{ name: "Treadmill Jog", sets: 1, reps: 1, weightKg: null, notes: "30 minutes" }],
  });

  await Workout.create({
    user: elena._id,
    name: "5K Tempo Run",
    category: "cardio",
    durationMin: 45,
    tags: ["running", "endurance"],
    notes: "Tempo run followed by core work.",
    favorite: true,
    exercises: [
      { name: "Outdoor 5K Run", sets: 1, reps: 1, weightKg: null, notes: "22:15 pace" },
      { name: "Plank Hold", sets: 3, reps: 60, weightKg: null, notes: "60 seconds each" },
    ],
  });

  await Workout.create({
    user: marcus._id,
    name: "Heavy Deadlift Day",
    category: "strength",
    durationMin: 75,
    tags: ["back", "legs"],
    notes: "Work up to a heavy top set.",
    favorite: true,
    exercises: [
      { name: "Conventional Deadlift", sets: 5, reps: 3, weightKg: 180, notes: "Reset each rep" },
      { name: "Barbell Row", sets: 3, reps: 8, weightKg: 90, notes: "Strict form" },
    ],
  });

  // ================================================================ WORKOUT LOGS (Alex: 6 sessions over the last 2 weeks)
  console.log("Seeding workout sessions...");

  await WorkoutLog.create([
    {
      user: alex._id,
      workout: pushRoutine._id,
      name: "Push Day",
      category: "strength",
      durationMin: 58,
      performedAt: dateDaysAgo(1),
      exercises: [
        {
          name: "Barbell Bench Press",
          sets: [
            { reps: 8, weightKg: 85 },
            { reps: 8, weightKg: 85 },
            { reps: 8, weightKg: 85 },
            { reps: 7, weightKg: 85 },
          ],
          notes: "Felt strong",
        },
        {
          name: "Incline Dumbbell Press",
          sets: [
            { reps: 10, weightKg: 30 },
            { reps: 10, weightKg: 30 },
            { reps: 9, weightKg: 30 },
          ],
        },
      ],
      notes: "Great session, clean sets on bench.",
    },
    {
      user: alex._id,
      workout: pullRoutine._id,
      name: "Pull Day",
      category: "strength",
      durationMin: 62,
      performedAt: dateDaysAgo(2),
      exercises: [
        {
          name: "Weighted Pull-Ups",
          sets: [
            { reps: 8, weightKg: 10 },
            { reps: 8, weightKg: 10 },
            { reps: 7, weightKg: 10 },
          ],
        },
        {
          name: "Barbell Bent Over Row",
          sets: [
            { reps: 10, weightKg: 75 },
            { reps: 10, weightKg: 75 },
            { reps: 10, weightKg: 75 },
          ],
        },
      ],
      notes: "Good pump, strict form.",
    },
    {
      user: alex._id,
      workout: legRoutine._id,
      name: "Leg Day",
      category: "strength",
      durationMin: 67,
      performedAt: dateDaysAgo(4),
      exercises: [
        {
          name: "Barbell Back Squat",
          sets: [
            { reps: 6, weightKg: 110 },
            { reps: 6, weightKg: 110 },
            { reps: 6, weightKg: 110 },
          ],
        },
      ],
      notes: "Heavy squats felt stable.",
    },
    {
      user: alex._id,
      workout: pushRoutine._id,
      name: "Push Day",
      category: "strength",
      durationMin: 60,
      performedAt: dateDaysAgo(8),
      exercises: [
        {
          name: "Barbell Bench Press",
          sets: [
            { reps: 8, weightKg: 82.5 },
            { reps: 8, weightKg: 82.5 },
            { reps: 7, weightKg: 82.5 },
          ],
        },
      ],
      notes: "Slightly lighter week.",
    },
    {
      user: alex._id,
      workout: pullRoutine._id,
      name: "Pull Day",
      category: "strength",
      durationMin: 63,
      performedAt: dateDaysAgo(9),
      exercises: [
        {
          name: "Barbell Bent Over Row",
          sets: [
            { reps: 10, weightKg: 72.5 },
            { reps: 10, weightKg: 72.5 },
            { reps: 9, weightKg: 72.5 },
          ],
        },
      ],
      notes: "Solid back session.",
    },
    {
      user: alex._id,
      workout: legRoutine._id,
      name: "Leg Day",
      category: "strength",
      durationMin: 66,
      performedAt: dateDaysAgo(11),
      exercises: [
        {
          name: "Barbell Back Squat",
          sets: [
            { reps: 6, weightKg: 105 },
            { reps: 6, weightKg: 105 },
            { reps: 6, weightKg: 105 },
          ],
        },
      ],
      notes: "Good depth on every rep.",
    },
    {
      user: elena._id,
      name: "5K Tempo Run",
      category: "cardio",
      durationMin: 44,
      performedAt: dateDaysAgo(1),
      exercises: [
        {
          name: "Outdoor 5K Run",
          sets: [{ reps: 1, weightKg: null }],
          notes: "Fast 22 minute pace",
        },
      ],
      notes: "Morning run in cool weather.",
    },
    {
      user: marcus._id,
      name: "Heavy Deadlift Day",
      category: "strength",
      durationMin: 72,
      performedAt: dateDaysAgo(2),
      exercises: [
        {
          name: "Conventional Deadlift",
          sets: [
            { reps: 3, weightKg: 180 },
            { reps: 3, weightKg: 180 },
            { reps: 3, weightKg: 180 },
          ],
        },
      ],
      notes: "New training max.",
    },
  ]);

  // ================================================================ NUTRITION (Alex: today + 3 earlier days)
  console.log("Seeding nutrition...");

  await Meal.create([
    // Today
    {
      user: alex._id,
      date: isoDaysAgo(0),
      mealType: "breakfast",
      items: [
        { name: "Scrambled Eggs (4 whole)", quantity: 4, unit: "piece", calories: 280, macros: { protein: 24, carbs: 2, fat: 20 } },
        { name: "Oats with Honey and Blueberries", quantity: 100, unit: "g", calories: 370, macros: { protein: 12, carbs: 68, fat: 5 } },
        { name: "Whey Protein Shake", quantity: 30, unit: "g", calories: 120, macros: { protein: 26, carbs: 1, fat: 1 } },
      ],
      notes: "High protein breakfast",
    },
    {
      user: alex._id,
      date: isoDaysAgo(0),
      mealType: "lunch",
      items: [
        { name: "Grilled Chicken Breast", quantity: 220, unit: "g", calories: 320, macros: { protein: 60, carbs: 0, fat: 6 } },
        { name: "Basmati Rice", quantity: 200, unit: "g", calories: 260, macros: { protein: 5, carbs: 58, fat: 1 } },
        { name: "Roasted Vegetables", quantity: 150, unit: "g", calories: 95, macros: { protein: 3, carbs: 12, fat: 4 } },
      ],
      notes: "Post-workout meal",
    },
    {
      user: alex._id,
      date: isoDaysAgo(0),
      mealType: "dinner",
      items: [
        { name: "Salmon Fillet", quantity: 180, unit: "g", calories: 370, macros: { protein: 36, carbs: 0, fat: 22 } },
        { name: "Sweet Potato Mash", quantity: 200, unit: "g", calories: 180, macros: { protein: 3, carbs: 42, fat: 0 } },
        { name: "Steamed Asparagus", quantity: 100, unit: "g", calories: 25, macros: { protein: 3, carbs: 4, fat: 0 } },
      ],
    },
    {
      user: alex._id,
      date: isoDaysAgo(0),
      mealType: "snack",
      items: [
        { name: "Greek Yogurt", quantity: 150, unit: "g", calories: 90, macros: { protein: 15, carbs: 6, fat: 0 } },
        { name: "Banana", quantity: 1, unit: "piece", calories: 105, macros: { protein: 1, carbs: 27, fat: 0 } },
      ],
    },
    // Yesterday
    {
      user: alex._id,
      date: isoDaysAgo(1),
      mealType: "breakfast",
      items: [
        { name: "Whole Wheat Toast", quantity: 2, unit: "piece", calories: 160, macros: { protein: 8, carbs: 28, fat: 2 } },
        { name: "Peanut Butter", quantity: 30, unit: "g", calories: 190, macros: { protein: 8, carbs: 6, fat: 16 } },
      ],
    },
    {
      user: alex._id,
      date: isoDaysAgo(1),
      mealType: "lunch",
      items: [
        { name: "Lean Beef Steak", quantity: 200, unit: "g", calories: 380, macros: { protein: 52, carbs: 0, fat: 18 } },
        { name: "Baked Potato", quantity: 250, unit: "g", calories: 240, macros: { protein: 8, carbs: 50, fat: 1 } },
      ],
    },
    {
      user: alex._id,
      date: isoDaysAgo(1),
      mealType: "dinner",
      items: [
        { name: "Chicken Stir Fry with Rice", quantity: 1, unit: "serving", calories: 520, macros: { protein: 42, carbs: 55, fat: 14 } },
      ],
    },
    // 2 days ago
    {
      user: alex._id,
      date: isoDaysAgo(2),
      mealType: "breakfast",
      items: [
        { name: "Oatmeal with Milk", quantity: 250, unit: "g", calories: 300, macros: { protein: 12, carbs: 50, fat: 6 } },
      ],
    },
    {
      user: alex._id,
      date: isoDaysAgo(2),
      mealType: "dinner",
      items: [
        { name: "Tuna Pasta", quantity: 1, unit: "serving", calories: 600, macros: { protein: 40, carbs: 70, fat: 15 } },
      ],
    },
    // 3 days ago
    {
      user: alex._id,
      date: isoDaysAgo(3),
      mealType: "lunch",
      items: [
        { name: "Chicken Wrap", quantity: 1, unit: "piece", calories: 450, macros: { protein: 32, carbs: 40, fat: 14 } },
      ],
    },
    // Elena and Marcus (one day each)
    {
      user: elena._id,
      date: isoDaysAgo(0),
      mealType: "breakfast",
      items: [
        { name: "Banana Smoothie", quantity: 300, unit: "ml", calories: 220, macros: { protein: 6, carbs: 45, fat: 3 } },
      ],
    },
    {
      user: marcus._id,
      date: isoDaysAgo(0),
      mealType: "lunch",
      items: [
        { name: "Beef and Rice Bowl", quantity: 1, unit: "serving", calories: 750, macros: { protein: 55, carbs: 80, fat: 20 } },
      ],
    },
  ]);

  // ================================================================ PROGRESS (Alex)
  console.log("Seeding progress...");

  await BodyEntry.create([
    { user: alex._id, date: isoDaysAgo(28), weightKg: 74.2, measurements: { chest: 102, waist: 80, hips: 95, biceps: 37.5, thighs: 57 }, notes: "Starting point" },
    { user: alex._id, date: isoDaysAgo(21), weightKg: 74.8, measurements: { chest: 102.8, waist: 79.8, hips: 95.5, biceps: 37.9, thighs: 57.3 } },
    { user: alex._id, date: isoDaysAgo(14), weightKg: 75.2, measurements: { chest: 103.5, waist: 79.5, hips: 95.8, biceps: 38.2, thighs: 57.8 } },
    { user: alex._id, date: isoDaysAgo(7), weightKg: 75.7, measurements: { chest: 104.5, waist: 79, hips: 96, biceps: 38.8, thighs: 58.2 } },
    { user: alex._id, date: isoDaysAgo(0), weightKg: 76.0, measurements: { chest: 105.5, waist: 78.5, hips: 96, biceps: 39.2, thighs: 58.5 }, notes: "Gaining lean muscle steadily" },
  ]);

  await PerformanceEntry.create([
    { user: alex._id, date: isoDaysAgo(21), metric: "bench_press", value: 80, notes: "Clean 8 reps" },
    { user: alex._id, date: isoDaysAgo(14), metric: "bench_press", value: 82.5 },
    { user: alex._id, date: isoDaysAgo(7), metric: "bench_press", value: 85, notes: "Smooth 8 reps" },
    { user: alex._id, date: isoDaysAgo(14), metric: "squat", value: 100 },
    { user: alex._id, date: isoDaysAgo(2), metric: "squat", value: 110, notes: "Solid 4x6" },
    { user: alex._id, date: isoDaysAgo(10), metric: "pull_ups", value: 12 },
    { user: alex._id, date: isoDaysAgo(3), metric: "pull_ups", value: 14, notes: "Strict bodyweight reps" },
  ]);

  // ================================================================ SOCIAL
  console.log("Seeding follows...");

  await Follow.create([
    { follower: alex._id, following: elena._id, status: "accepted" },
    { follower: elena._id, following: alex._id, status: "accepted" },
    { follower: marcus._id, following: alex._id, status: "accepted" },
    { follower: alex._id, following: marcus._id, status: "accepted" },
  ]);

  // ================================================================ REMINDERS (Alex)
  console.log("Seeding reminders...");

  await Reminder.create([
    {
      user: alex._id,
      title: "Morning creatine and water",
      kind: "meal",
      time: "08:00",
      days: [0, 1, 2, 3, 4, 5, 6],
      active: true,
    },
    {
      user: alex._id,
      title: "Gym session",
      kind: "workout",
      time: "17:30",
      days: [1, 3, 5],
      active: true,
    },
  ]);

  // ================================================================ SUPPORT TICKETS
  console.log("Seeding support tickets...");

  await Ticket.create([
    {
      user: alex._id,
      type: "feedback",
      subject: "Great workout tracking",
      message: "Logging sets and reps is smooth, and the dashboard charts are very helpful.",
      status: "resolved",
      adminReply: "Thank you Alex! Glad you like Forge. More updates are coming soon.",
    },
    {
      user: elena._id,
      type: "issue",
      subject: "Cardio details in PDF export",
      message: "Can interval and pace details be shown in the PDF report?",
      status: "in_progress",
      adminReply: "Thanks Elena, we are looking into improving the PDF report.",
    },
    {
      user: marcus._id,
      type: "contact",
      subject: "Group workouts",
      message: "Is it possible to share routines with the people I follow?",
      status: "open",
    },
  ]);

  console.log("\n==============================================");
  console.log("FORGE SEED COMPLETE");
  console.log("==============================================");
  console.log("Admin : admin@gmail.com  / Admin12345!");
  console.log("User  : alex@gmail.com   / Alex12345!   (main demo, most data)");
  console.log("User  : elena@gmail.com  / Elena12345!");
  console.log("User  : marcus@gmail.com / Marcus12345!");
  console.log("==============================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});