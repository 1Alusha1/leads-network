import { Router } from "express";
import { fileterdLeads, uploadLeads } from "../controllers/duplicateLeads.controller.js";

const router = Router();

router.post("/uploadLeads", uploadLeads);
router.post("/fileterdLeads", fileterdLeads);

export default router;
