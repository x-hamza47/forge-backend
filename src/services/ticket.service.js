import Ticket from "../models/ticket.model.js";

export const listUserTickets = async (userId) => {
  return Ticket.find({ user: userId }).sort({ createdAt: -1 });
};

export const createTicket = async (userId, payload) => {
  return Ticket.create({
    user: userId,
    type: payload.type,
    subject: payload.subject,
    message: payload.message,
  });
};
