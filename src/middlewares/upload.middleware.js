import multer from "multer";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";
import crypto from "crypto";
import ApiError from "../utils/ApiError.js";

export const AVATAR_DIR = path.join(process.cwd(), "uploads", "avatars");

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
            return cb(new ApiError(400, "Only image files are allowed."));
        }
        cb(null, true);
    },
});

export const uploadAvatar = upload.single("avatar");

export async function processAvatar(req, res, next) {
    try {
        if (!req.file) return next();

        await fs.mkdir(AVATAR_DIR, { recursive: true });

        const filename = `${crypto.randomUUID()}.webp`;

        await sharp(req.file.buffer)
            .rotate()
            .resize(256, 256, { fit: "cover", position: "centre" })
            .webp({ quality: 80 })
            .toFile(path.join(AVATAR_DIR, filename));

        req.avatarPath = `/uploads/avatars/${filename}`;
        next();
    } catch {
        next(new ApiError(400, "Invalid or corrupted image."));
    }
}