import express from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";
import path from "path";

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
}));

app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Forge API is running",
  });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;