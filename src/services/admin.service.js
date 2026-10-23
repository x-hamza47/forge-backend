import User from "../models/user.model.js";
import WorkoutLog from "../models/workoutLog.model.js";
import Meal from "../models/meal.model.js";
import Ticket from "../models/ticket.model.js";
import Notification from "../models/notification.model.js";
import ApiError from "../utils/ApiError.js";
import { deleteUserData } from "../utils/userCleanup.js";

export const getAdminStats = async () => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const [
    totalUsers,
    activeUsers,
    newUsersThisWeek,
    workoutsLogged,
    mealsLogged,
    openTickets,
    recentUsers,
    recentTickets,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
    WorkoutLog.countDocuments(),
    Meal.countDocuments(),
    Ticket.countDocuments({ status: "open" }),
    User.find({ role: "user" })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name username email profilePicture createdAt isActive"),
    Ticket.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name username email profilePicture"),
  ]);

  // Aggregate user registrations & workout activity for last 7 days
  const userGrowthMap = {};
  const workoutMap = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().split("T")[0];
    userGrowthMap[iso] = 0;
    workoutMap[iso] = 0;
  }

  const start7Days = new Date();
  start7Days.setDate(start7Days.getDate() - 6);
  start7Days.setHours(0, 0, 0, 0);

  const [rawUsers, rawLogs] = await Promise.all([
    User.find({ createdAt: { $gte: start7Days } }, "createdAt"),
    WorkoutLog.find({ performedAt: { $gte: start7Days } }, "performedAt"),
  ]);

  rawUsers.forEach((u) => {
    const iso = new Date(u.createdAt).toISOString().split("T")[0];
    if (userGrowthMap[iso] !== undefined) userGrowthMap[iso] += 1;
  });

  rawLogs.forEach((l) => {
    const iso = new Date(l.performedAt).toISOString().split("T")[0];
    if (workoutMap[iso] !== undefined) workoutMap[iso] += 1;
  });

  const activityTrend = Object.keys(userGrowthMap).map((date) => ({
    date,
    newUsers: userGrowthMap[date],
    workouts: workoutMap[date],
  }));

  return {
    totalUsers,
    activeUsers,
    newUsersThisWeek,
    workoutsLogged,
    mealsLogged,
    openTickets,
    activityTrend,
    recentUsers,
    recentTickets,
  };
};

export const getAdminUsers = async ({ search, role, status, page = 1, limit = 20 } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);

  const filter = {};

  if (search && String(search).trim()) {
    const term = String(search).trim();
    filter.$or = [
      { name: { $regex: term, $options: "i" } },
      { username: { $regex: term, $options: "i" } },
      { email: { $regex: term, $options: "i" } },
    ];
  }

  if (role && role !== "all") {
    filter.role = role;
  }

  if (status === "active") {
    filter.isActive = true;
  } else if (status === "inactive") {
    filter.isActive = false;
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .select("name username email role isActive createdAt profilePicture"),
    User.countDocuments(filter),
  ]);

  return {
    users,
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit) || 1,
  };
};

export const toggleUserStatus = async (adminUserId, targetUserId) => {
  if (String(adminUserId) === String(targetUserId)) {
    throw new ApiError(400, "You cannot deactivate your own admin account.");
  }

  const user = await User.findById(targetUserId);
  if (!user) throw new ApiError(404, "User not found.");

  user.isActive = !user.isActive;
  await user.save();

  return user;
};

export const deleteUserByAdmin = async (adminUserId, targetUserId) => {
  if (String(adminUserId) === String(targetUserId)) {
    throw new ApiError(400, "You cannot delete your own admin account.");
  }

  const success = await deleteUserData(targetUserId);
  if (!success) throw new ApiError(404, "User not found.");

  return { deleted: true };
};

export const getAdminTickets = async ({ status, page = 1, limit = 20 } = {}) => {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);

  const filter = {};
  if (status && status !== "all") {
    filter.status = status;
  }

  const [tickets, total] = await Promise.all([
    Ticket.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .populate("user", "name email username profilePicture"),
    Ticket.countDocuments(filter),
  ]);

  return {
    tickets,
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit) || 1,
  };
};

export const updateTicketByAdmin = async (ticketId, payload) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new ApiError(404, "Ticket not found.");

  const { status, adminReply } = payload;
  if (status !== undefined) ticket.status = status;

  if (adminReply !== undefined && adminReply.trim()) {
    ticket.adminReply = adminReply.trim();
    // Notify user of staff reply
    try {
      await Notification.create({
        user: ticket.user,
        type: "reminder",
        message: `Staff replied to your ticket: "${ticket.subject}"`,
      });
    } catch {
      // Notification failure shouldn't fail ticket reply
    }
  }

  await ticket.save();
  return ticket;
};

export const createUserByAdmin = async (payload) => {
  const { name, username, email, password, role = "user", isActive = true } = payload;
  const cleanEmail = String(email).toLowerCase().trim();
  const cleanUsername = String(username).toLowerCase().trim();

  const existing = await User.findOne({
    $or: [{ email: cleanEmail }, { username: cleanUsername }],
  });
  if (existing) {
    if (existing.email === cleanEmail) {
      throw new ApiError(409, "A user with this email already exists.");
    }
    throw new ApiError(409, "A user with this username already exists.");
  }

  const user = await User.create({
    name: name.trim(),
    username: cleanUsername,
    email: cleanEmail,
    password,
    role,
    isActive,
    consentAt: new Date(),
  });

  return user;
};

export const updateUserByAdmin = async (adminUserId, targetUserId, payload) => {
  const user = await User.findById(targetUserId);
  if (!user) throw new ApiError(404, "User not found.");

  const { name, username, email, password, role, isActive } = payload;

  if (username && username.toLowerCase().trim() !== user.username) {
    const existing = await User.findOne({ username: username.toLowerCase().trim() });
    if (existing) throw new ApiError(409, "Username already in use.");
    user.username = username.toLowerCase().trim();
  }

  if (email && email.toLowerCase().trim() !== user.email) {
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) throw new ApiError(409, "Email already in use.");
    user.email = email.toLowerCase().trim();
  }

  if (name) user.name = name.trim();

  if (role) {
    if (String(adminUserId) === String(targetUserId) && role !== "admin") {
      throw new ApiError(400, "You cannot remove your own admin privileges.");
    }
    user.role = role;
  }

  if (isActive !== undefined) {
    if (String(adminUserId) === String(targetUserId) && !isActive) {
      throw new ApiError(400, "You cannot deactivate your own admin account.");
    }
    user.isActive = isActive;
  }

  if (password && password.trim()) {
    user.password = password.trim();
  }

  await user.save();
  return user;
};

export const getUserDetailsByAdmin = async (targetUserId) => {
  const user = await User.findById(targetUserId);
  if (!user) throw new ApiError(404, "User not found.");

  const [workoutsCount, mealsCount, ticketsCount] = await Promise.all([
    WorkoutLog.countDocuments({ user: targetUserId }),
    Meal.countDocuments({ user: targetUserId }),
    Ticket.countDocuments({ user: targetUserId }),
  ]);

  return {
    ...user.toJSON(),
    stats: {
      workoutsCount,
      mealsCount,
      ticketsCount,
    },
  };
};

export const deleteTicketByAdmin = async (ticketId) => {
  const ticket = await Ticket.findByIdAndDelete(ticketId);
  if (!ticket) throw new ApiError(404, "Ticket not found.");
  return { deleted: true };
};

