import { Router } from "express";
import { getOffers } from "../controllers/kt.controller.js";

const router = Router();

router.get("/offers", getOffers);

export default router;
