export const ok = (res, data, message = "OK", status = 200) =>
  res.status(status).json({ success: true, data, message });

export const fail = (res, message, status = 400, errors = []) =>
  res.status(status).json({ success: false, message, errors });