import ApiError from "../utils/ApiError.js";
import { fail } from "../utils/response.js";

export function notFound(req, res, next) {
    next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Something went wrong";
    let errors = err.errors || [];


    if (err.name === "ValidationError") {
        statusCode = 400;
        errors = Object.values(err.errors).map((e) => e.message);
        message = errors[0];
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || "field";
        statusCode = 409;
        message = `${field.charAt(0).toUpperCase() + field.slice(1)} is already in use.`;
    }

    if (err.name === "CastError") {
        statusCode = 400;
        message = `Invalid ${err.path}`;
    }

    if (err.name === "JsonWebTokenError") {
        statusCode = 401;
        message = "Invalid token. Please log in again.";
    }
    if (err.name === "TokenExpiredError") {
        statusCode = 401;
        message = "Your session has expired. Please log in again.";
    }
    // Multer errors 
    if (err.name === "MulterError") {
        statusCode = 400;
        message =
            err.code === "LIMIT_FILE_SIZE"
                ? "Image is too large. Max 5 MB."
                : err.message;
    }
    if (statusCode === 500) {
        console.error(err);
        message = "Internal server error";
    }


    return fail(res, message, statusCode, errors);
}