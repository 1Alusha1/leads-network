import { Router } from "express";
import { checkAuth, login, register } from "../controllers/user.controller.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/checkAuth", checkAuth);

export default router;
