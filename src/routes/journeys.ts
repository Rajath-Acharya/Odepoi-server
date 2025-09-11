import { Router } from "express";
import * as JourneysController from "../controllers/journeysController";

const router = Router();

router.get("/", JourneysController.listJourneys);
router.get("/:id", JourneysController.getJourneyById);
router.post("/", JourneysController.createJourney);
router.post("/:id/join-requests", JourneysController.createJoinRequest);

export default router;
