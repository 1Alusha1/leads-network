import { Router } from "express";
import {
  compareData,
  record,
  saveHash,
} from "../controllers/record.controller.js";

const router = Router();

router.get("/save-hash", saveHash);
router.get("/compare-data", compareData);
router.get("/record", record);

export default router;
