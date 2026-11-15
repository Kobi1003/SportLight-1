import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import {
  getPlayers,
  getPlayerById,
  getMyProfile,
  createPlayer,
  updatePlayer,
  deleteMyProfile,
  deletePlayerById
} from "../controllers/player.controller.js";
import { upload } from "../utils/upload.js";

const router = express.Router();

router.get("/", getPlayers);
router.post("/", createPlayer);
router.get("/me", protect, getMyProfile);
router.put(
  "/me",
  protect,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "achievementImage", maxCount: 1 },
  ]),
  updatePlayer
);
router.delete("/me", protect, deleteMyProfile); 
router.get("/:id", getPlayerById);
router.put(
  "/:id",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "achievementImage", maxCount: 1 },
  ]),
  updatePlayer
);
router.delete("/:id", protect, deletePlayerById);

export default router;
