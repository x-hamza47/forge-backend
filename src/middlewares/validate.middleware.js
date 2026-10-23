import ApiError from "../utils/ApiError.js";

export const validate =
  (schema, source = "body") =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => {
        const path = issue.path.join(".");
        return path ? `${path}: ${issue.message}` : issue.message;
      });
      return next(new ApiError(400, errors[0], errors));
    }

    Object.defineProperty(req, source, {
      value: result.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    next();
  };