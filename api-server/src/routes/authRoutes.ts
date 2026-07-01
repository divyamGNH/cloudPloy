import express from "express";
import * as authController from "../controllers/authController.js"
import { requireAuth } from "../middlewares/auth.js"

const router = express.Router();

router.post("/login", authController.login);
router.post("/signup", authController.signup);
router.post("/logout", authController.logout);
router.post("/refresh", authController.refresh);
router.get("/me", requireAuth, authController.me);

export default router;