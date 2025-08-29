import { Router } from "express";
import { btqFinance } from "../controllers/btqFinance.controller.js";

const router = Router();

router.post("/webhook", btqFinance);

export default router;
