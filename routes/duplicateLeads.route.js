import { Router } from "express";
import { filteredLeads, uploadLeads } from "../controllers/duplicateLeads.controller.js";

const router = Router();

router.post("/uploadLeads", uploadLeads);
router.post("/fileterdLeads", filteredLeads);

export default router;
