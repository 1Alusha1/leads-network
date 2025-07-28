import { Router } from "express";
import {
  getLongLivedToken,
  sendDataToCRM,
  validationHook,
} from "../controllers/fb.controller.js";

const router = Router();

router.get("/leadformhook", validationHook);
router.post("/leadformhook", sendDataToCRM);
router.post("/getLongLivedToken", getLongLivedToken);

export default router;
