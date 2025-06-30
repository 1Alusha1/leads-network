import { Router } from "express";
import { validationHook } from "../controllers/fb.controller";

const router = Router();

router.get("/leadformhook", validationHook);
router.post("/leadformhook", sendDataToCRM);

export default router;
