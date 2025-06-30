import { Router } from "express";
import { sendDataToCRM, validationHook } from "../controllers/fb.controller.js";

const router = Router();

router.get("/leadformhook", validationHook);
router.post("/leadformhook", sendDataToCRM);

export default router;
