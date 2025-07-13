import { Router } from "express";
import { uploadLeadsfile } from "../controllers/tt.controller.js";

const router = Router();

router.post("/uploadLeadsfile", uploadLeadsfile);

export default router;
