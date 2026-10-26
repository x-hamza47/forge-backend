import { Router } from "express";
import { authenticate } from "../middlewares/authenticate.middleware.js";
import { search } from "../controllers/food.controller.js";

const router = Router();

router.get("/search", authenticate, search);

export default router;