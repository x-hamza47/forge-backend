import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
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

async function runSeed() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/forge";
  console.log(`Connecting to MongoDB: ${uri}`);
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

  console.log("Seeding Admin and Athletes...");

  // 1. Admin Account
  const admin = await User.create({
    name: "Forge Administrator",
    username: "admin",
    email: "admin@forge.fitness",
    password: "Admin12345!",
    role: "admin",
    isActive: true,
    bio: "Chief Systems & Athletics Director at Forge HQ.",
    consentAt: new Date(),
    preferences: {
      units: "metric",
      privacy: { isPrivate: false, searchable: true, showStats: true },
    },
  });

  // 2. Hamza Aamir (Primary User Account) - support both hamza@forge.com & hamza@forge.fitness
  const hamza = await User.create({
    name: "Hamza Aamir",
    username: "hamza_aamir",
    email: "hamza@forge.com",
    password: "Hamza123!",
    role: "user",
    isActive: true,
    bio: "Dedicated athlete at Forge. Focused on progressive overload, aesthetic strength, and balanced performance.",
    sex: "male",
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

  // Also create hamza@forge.fitness so both .com and .fitness work!
  await User.create({
    name: "Hamza Aamir",
    username: "hamza",
    email: "hamza@forge.fitness",
    password: "Hamza123!",
    role: "user",
    isActive: true,
    bio: "Dedicated athlete at Forge.",
    consentAt: new Date(),
  });

  // 3. Community Athletes
  const elena = await User.create({
    name: "Elena Rostova",
    username: "elena_fit",
    email: "elena@forge.fitness",
    password: "Athlete123!",
    role: "user",
    isActive: true,
    bio: "Functional fitness athlete, marathon runner, and nutrition nerd.",
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

  const marcus = await User.create({
    name: "Marcus Vance",
    username: "marcus_lift",
    email: "marcus@forge.fitness",
    password: "Athlete123!",
    role: "user",
    isActive: true,
    bio: "Powerlifter & Strength enthusiast. Chasing heavy compound personal records.",
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

  console.log("Seeding Workout Routines for Hamza Aamir...");
  const pushRoutine = await Workout.create({
    user: hamza._id,
    name: "Hamza's Heavy Push Day",
    category: "strength",
    durationMin: 60,
    tags: ["chest", "shoulders", "triceps"],
    notes: "Rest 2 mins between compound sets. Controlled eccentrics.",
    favorite: true,
    exercises: [
      { name: "Barbell Bench Press", sets: 4, reps: 8, weightKg: 85, notes: "Explosive press" },
      { name: "Incline Dumbbell Press", sets: 3, reps: 10, weightKg: 30, notes: "Deep stretch at bottom" },
      { name: "Standing Overhead Press", sets: 3, reps: 8, weightKg: 50, notes: "Core tight" },
      { name: "Dumbbell Lateral Raises", sets: 4, reps: 15, weightKg: 12, notes: "Slight forward lean" },
      { name: "Cable Tricep Pushdowns", sets: 3, reps: 12, weightKg: 35, notes: "Squeeze at lockout" },
    ],
  });

  const pullRoutine = await Workout.create({
    user: hamza._id,
    name: "Hamza's Lat & Upper Back Focus",
    category: "strength",
    durationMin: 65,
    tags: ["back", "biceps", "pull"],
    notes: "Drive with the elbows, squeeze the upper back.",
    favorite: true,
    exercises: [
      { name: "Weighted Pull-Ups", sets: 4, reps: 8, weightKg: 10, notes: "Full dead-hang stretch" },
      { name: "Barbell Bent Over Row", sets: 4, reps: 10, weightKg: 75, notes: "45 degree torso" },
      { name: "Close-Grip Lat Pulldown", sets: 3, reps: 12, weightKg: 65, notes: "Control the negative" },
      { name: "Incline Dumbbell Bicep Curls", sets: 3, reps: 12, weightKg: 14, notes: "Supinate at top" },
      { name: "Face Pulls", sets: 4, reps: 15, weightKg: 25, notes: "Rear delt activation" },
    ],
  });

  const legRoutine = await Workout.create({
    user: hamza._id,
    name: "Hamza's Leg & Core Circuit",
    category: "strength",
    durationMin: 70,
    tags: ["quads", "hamstrings", "core"],
    notes: "Deep squat depth with tight brace.",
    favorite: false,
    exercises: [
      { name: "Barbell Back Squat", sets: 4, reps: 6, weightKg: 110, notes: "Hit parallel" },
      { name: "Romanian Deadlift", sets: 3, reps: 10, weightKg: 90, notes: "Feel hamstring stretch" },
      { name: "Bulgarian Split Squats", sets: 3, reps: 10, weightKg: 20, notes: "Per leg" },
      { name: "Hanging Leg Raises", sets: 3, reps: 15, weightKg: null, notes: "Controlled core contraction" },
    ],
  });

  // Routine for Elena
  await Workout.create({
    user: elena._id,
    name: "Elena's 5K Tempo Run & Core",
    category: "cardio",
    durationMin: 45,
    tags: ["running", "endurance"],
    notes: "Zone 4 tempo run followed by core stability.",
    favorite: true,
    exercises: [
      { name: "Outdoor 5K Run", sets: 1, reps: 1, weightKg: null, notes: "22:15 pace" },
      { name: "Plank Hold", sets: 3, reps: 60, weightKg: null, notes: "60 seconds each" },
    ],
  });

  console.log("Seeding Completed Workout Sessions...");
  const now = new Date();
  const d1 = new Date(now);
  d1.setDate(d1.getDate() - 1);
  const d2 = new Date(now);
  d2.setDate(d2.getDate() - 2);
  const d3 = new Date(now);
  d3.setDate(d3.getDate() - 4);

  await WorkoutLog.create([
    {
      user: hamza._id,
      workout: pushRoutine._id,
      name: "Hamza's Heavy Push Day",
      category: "strength",
      durationMin: 58,
      performedAt: d1,
      exercises: [
        {
          name: "Barbell Bench Press",
          sets: [
            { reps: 8, weightKg: 85 },
            { reps: 8, weightKg: 85 },
            { reps: 8, weightKg: 85 },
            { reps: 7, weightKg: 85 },
          ],
          notes: "Felt strong!",
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
      notes: "Felt incredible! Hit 85kg on bench press for clean sets.",
    },
    {
      user: hamza._id,
      workout: pullRoutine._id,
      name: "Hamza's Lat & Upper Back Focus",
      category: "strength",
      durationMin: 62,
      performedAt: d2,
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
      notes: "Great pump in lats and biceps. Form remained strict throughout.",
    },
    {
      user: hamza._id,
      workout: legRoutine._id,
      name: "Hamza's Leg & Core Circuit",
      category: "strength",
      durationMin: 67,
      performedAt: d3,
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
      notes: "Heavy squats felt strong and stable.",
    },
    {
      user: elena._id,
      name: "Elena's 5K Tempo Run & Core",
      category: "cardio",
      durationMin: 44,
      performedAt: d1,
      exercises: [
        {
          name: "Outdoor 5K Run",
          sets: [{ reps: 1, weightKg: null }],
          notes: "Fast 22 min pace",
        },
      ],
      notes: "Morning 5k completed in brisk weather.",
    },
  ]);

  console.log("Seeding Daily Nutrition for Hamza...");
  const todayStr = new Date().toISOString().split("T")[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

  await Meal.create([
    {
      user: hamza._id,
      date: todayStr,
      mealType: "breakfast",
      items: [
        { name: "Scrambled Eggs (4 whole)", quantity: 4, unit: "unit", calories: 280, macros: { protein: 24, carbs: 2, fat: 20 } },
        { name: "Oats with Honey & Blueberries", quantity: 100, unit: "g", calories: 370, macros: { protein: 12, carbs: 68, fat: 5 } },
        { name: "Whey Protein Shake", quantity: 30, unit: "g", calories: 120, macros: { protein: 26, carbs: 1, fat: 1 } },
      ],
      notes: "High protein breakfast",
    },
    {
      user: hamza._id,
      date: todayStr,
      mealType: "lunch",
      items: [
        { name: "Grilled Herb Chicken Breast", quantity: 220, unit: "g", calories: 320, macros: { protein: 60, carbs: 0, fat: 6 } },
        { name: "Basmati Rice", quantity: 200, unit: "g", calories: 260, macros: { protein: 5, carbs: 58, fat: 1 } },
        { name: "Mixed Roasted Vegetables", quantity: 150, unit: "g", calories: 95, macros: { protein: 3, carbs: 12, fat: 4 } },
      ],
      notes: "Post-workout fueling",
    },
    {
      user: hamza._id,
      date: todayStr,
      mealType: "dinner",
      items: [
        { name: "Salmon Fillet", quantity: 180, unit: "g", calories: 370, macros: { protein: 36, carbs: 0, fat: 22 } },
        { name: "Sweet Potato Mash", quantity: 200, unit: "g", calories: 180, macros: { protein: 3, carbs: 42, fat: 0 } },
        { name: "Steamed Asparagus", quantity: 100, unit: "g", calories: 25, macros: { protein: 3, carbs: 4, fat: 0 } },
      ],
    },
    {
      user: hamza._id,
      date: yesterdayStr,
      mealType: "lunch",
      items: [
        { name: "Lean Beef Steak", quantity: 200, unit: "g", calories: 380, macros: { protein: 52, carbs: 0, fat: 18 } },
        { name: "Baked Potato with Greek Yogurt", quantity: 250, unit: "g", calories: 240, macros: { protein: 8, carbs: 50, fat: 1 } },
      ],
    },
  ]);

  console.log("Seeding Progress Metrics for Hamza...");
  await BodyEntry.create([
    {
      user: hamza._id,
      date: yesterdayStr,
      weightKg: 75.5,
      measurements: {
        chest: 104,
        waist: 79,
        hips: 96,
        biceps: 38.5,
        thighs: 58,
      },
      notes: "Morning measurement",
    },
    {
      user: hamza._id,
      date: todayStr,
      weightKg: 76.0,
      measurements: {
        chest: 105.5,
        waist: 78.5,
        hips: 96,
        biceps: 39.2,
        thighs: 58.5,
      },
      notes: "Gaining lean muscle steadily",
    },
  ]);

  await PerformanceEntry.create([
    {
      user: hamza._id,
      date: yesterdayStr,
      metric: "bench_press",
      value: 85,
      notes: "Smooth 8 reps",
    },
    {
      user: hamza._id,
      date: yesterdayStr,
      metric: "pull_ups",
      value: 14,
      notes: "Strict bodyweight reps",
    },
    {
      user: hamza._id,
      date: todayStr,
      metric: "squat",
      value: 110,
      notes: "Solid 4x6",
    },
  ]);

  console.log("Seeding Social Follow Connections...");
  await Follow.create([
    { follower: hamza._id, following: elena._id, status: "accepted" },
    { follower: elena._id, following: hamza._id, status: "accepted" },
    { follower: marcus._id, following: hamza._id, status: "accepted" },
    { follower: hamza._id, following: marcus._id, status: "accepted" },
  ]);

  console.log("Seeding Reminders for Hamza...");
  await Reminder.create([
    {
      user: hamza._id,
      title: "Morning Creatine & Hydration",
      kind: "meal",
      time: "08:00",
      days: [0, 1, 2, 3, 4, 5, 6],
      active: true,
    },
    {
      user: hamza._id,
      title: "Push Workout at 6:00 PM",
      kind: "workout",
      time: "17:30",
      days: [1, 3, 5],
      active: true,
    },
  ]);

  console.log("Seeding Support Tickets...");
  await Ticket.create([
    {
      user: hamza._id,
      type: "feedback",
      subject: "Incredible dark mode & workout tracking UX!",
      message: "The platform feels state of the art. Adding sets, reps, and viewing telemetry in the dashboard is super smooth.",
      status: "resolved",
      adminReply: "Thank you Hamza! Glad you are enjoying the Forge platform. Stay tuned for upcoming updates!",
    },
    {
      user: elena._id,
      type: "issue",
      subject: "Cardio interval tempo formatting in export",
      message: "Checking if treadmill interval tempo can be highlighted in custom PDF exports.",
      status: "in_progress",
      adminReply: "Thanks Elena, our engineering team is addressing PDF report customization.",
    },
    {
      user: marcus._id,
      type: "contact",
      subject: "Platform powerlifting group workouts",
      message: "Can we organize shared barbell club routines among followers?",
      status: "open",
    },
  ]);

  console.log("\n==============================================");
  console.log("🔥 FORGE SEED COMPLETE FOR HAMZA AAMIR 🔥");
  console.log("==============================================");
  console.log("User Account (Hamza Aamir):");
  console.log("  Email:    hamza@forge.fitness");
  console.log("  Password: Hamza123!");
  console.log("----------------------------------------------");
  console.log("Admin Account:");
  console.log("  Email:    admin@forge.fitness");
  console.log("  Password: Admin12345!");
  console.log("----------------------------------------------");
  console.log("Community Athletes (password: Athlete123!):");
  console.log("  • elena@forge.fitness");
  console.log("  • marcus@forge.fitness");
  console.log("==============================================\n");

  await mongoose.disconnect();
  process.exit(0);
}

runSeed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
