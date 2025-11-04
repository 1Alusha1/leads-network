import { Router } from "express";
import {
  fbSpend,
  getLongLivedToken,
  saveLeadFormTemplate,
  sendDataToCRM,
  validationHook,
} from "../controllers/fb.controller.js";

const router = Router();

router.get("/leadformhook", validationHook);
router.post("/leadformhook", sendDataToCRM);
router.post("/getLongLivedToken", getLongLivedToken);
router.post("/saveLeadFormTemplate", saveLeadFormTemplate);
router.post("/fbspend", fbSpend);
export default router;
