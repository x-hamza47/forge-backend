import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import {
  getAdminStats,
  getAdminUsers,
  toggleUserStatus,
  deleteUserByAdmin,
  createUserByAdmin,
  updateUserByAdmin,
  getUserDetailsByAdmin,
  getAdminTickets,
  updateTicketByAdmin,
  deleteTicketByAdmin,
} from "../services/admin.service.js";

export const stats = asyncHandler(async (req, res) => {
  const data = await getAdminStats();
  return ok(res, data, "Admin stats fetched.");
});

export const users = asyncHandler(async (req, res) => {
  const data = await getAdminUsers(req.query);
  return ok(res, data, "Admin users fetched.");
});

export const createUser = asyncHandler(async (req, res) => {
  const data = await createUserByAdmin(req.body);
  return ok(res, data, "User created successfully.", 201);
});

export const updateUser = asyncHandler(async (req, res) => {
  const data = await updateUserByAdmin(req.user._id, req.params.id, req.body);
  return ok(res, data, "User updated successfully.");
});

export const userDetails = asyncHandler(async (req, res) => {
  const data = await getUserDetailsByAdmin(req.params.id);
  return ok(res, data, "User details fetched.");
});

export const toggleStatus = asyncHandler(async (req, res) => {
  const data = await toggleUserStatus(req.user._id, req.params.id);
  return ok(res, data, "User status updated.");
});

export const deleteUser = asyncHandler(async (req, res) => {
  const data = await deleteUserByAdmin(req.user._id, req.params.id);
  return ok(res, data, "User deleted successfully.");
});

export const tickets = asyncHandler(async (req, res) => {
  const data = await getAdminTickets(req.query);
  return ok(res, data, "Admin tickets fetched.");
});

export const updateTicket = asyncHandler(async (req, res) => {
  const data = await updateTicketByAdmin(req.params.id, req.body);
  return ok(res, data, "Ticket updated successfully.");
});

export const deleteTicket = asyncHandler(async (req, res) => {
  const data = await deleteTicketByAdmin(req.params.id);
  return ok(res, data, "Ticket deleted successfully.");
});

