import asyncHandler from "../utils/asyncHandler.js";
import { ok } from "../utils/response.js";
import { listUserTickets, createTicket } from "../services/ticket.service.js";

export const list = asyncHandler(async (req, res) => {
  const data = await listUserTickets(req.user._id);
  return ok(res, data, "Tickets fetched.");
});

export const create = asyncHandler(async (req, res) => {
  const data = await createTicket(req.user._id, req.body);
  return ok(res, data, "Ticket submitted successfully.", 201);
});
