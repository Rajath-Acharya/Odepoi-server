import { Router } from "express";
import * as UsersController from "../controllers/usersController";

const router = Router();

router.get("/me", UsersController.getMe);
router.get("/:id", UsersController.getUserById);

export default router;
