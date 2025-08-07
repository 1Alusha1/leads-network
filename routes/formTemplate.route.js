import { Router } from "express";
import {
  getTemplates,
  updateTemplate,
  deleteTemplate,
} from "../controllers/formTemplate.controller.js";

const router = Router();

router.get("/getTemplates", getTemplates);
router.patch("/updateTemplate", updateTemplate);
router.delete("/deleteTemplate", deleteTemplate);

export default router;
