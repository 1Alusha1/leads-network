import { Router } from "express";
import { searchLead } from "../controllers/antiFraud.controller.js";

const router = Router();

// поиск по номеру телефона и email
router.get("/", searchLead);

export default router;
