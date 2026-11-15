import Player from "../models/player.js";
import User from "../models/user.js";
import { saveBase64Image } from "../utils/saveImage.js";

export const getPlayers = async (req, res) => {
  try {
    const players = await Player.find();
    const users = await User.find({ role: "player" });
    const userMap = new Map(users.map(u => [u.profileId?.toString(), u.email]));

    const enriched = players.map(p => {
      const pObj = p.toObject();
      if (!pObj.email && userMap.has(p._id.toString())) {
        pObj.email = userMap.get(p._id.toString());
      }
      return pObj;
    });

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyProfile = async (req, res) => {
  try {
    const player = await Player.findById(req.user.profileId);

    if (!player) {
      return res.status(404).json({ message: "Player profile not found" });
    }

    res.status(200).json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPlayer = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.avatar) data.avatar = saveBase64Image(data.avatar, "avatar");
    if (data.achievementsImage) data.achievementsImage = saveBase64Image(data.achievementsImage, "achievement");
    const player = await Player.create(data);
    res.status(201).json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPlayerById = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) return res.status(404).json({ message: "Player not found" });
    res.status(200).json(player);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePlayer = async (req, res) => {
  try {
    const data = { ...req.body };
    if (req.file) {
      data.achievementsImage = `/uploads/${req.file.filename}`;
    }
    if (req.files) {
      if (req.files.avatar) data.avatar = `/uploads/${req.files.avatar[0].filename}`;
      if (req.files.achievementImage) data.achievementsImage = `/uploads/${req.files.achievementImage[0].filename}`;
    }

    // Convert any base64 images into physical files on disk in uploads/
    if (data.avatar) {
      data.avatar = saveBase64Image(data.avatar, "avatar");
    }
    if (data.achievementsImage) {
      data.achievementsImage = saveBase64Image(data.achievementsImage, "achievement");
    }

    // Always preserve or set user email on player profile
    if (req.user?.email && !data.email) {
      data.email = req.user.email;
    }

    const targetId = (req.params && req.params.id && req.params.id !== 'me') ? req.params.id : req.user?.profileId;

    if (!targetId) {
      return res.status(400).json({ message: "No player ID provided" });
    }

    const existingPlayer = await Player.findById(targetId);

    if (!existingPlayer) {
      // If it doesn't exist, create it with this ID or as new
      const created = await Player.create({ ...data, _id: targetId });
      return res.status(200).json({ message: "Profile created successfully", player: created });
    }

    const isProfileCompleted =
      (data.name || existingPlayer.name) &&
      (data.sport || existingPlayer.sport) &&
      (data.mobile || existingPlayer.mobile) &&
      (data.age || existingPlayer.age) &&
      ((data.performanceData || existingPlayer.performanceData)?.length > 0);

    data.profileCompleted = isProfileCompleted;

    const updated = await Player.findByIdAndUpdate(
      targetId,
      data,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      player: updated,
    });

  } catch (error) {
    console.error("UPDATE PLAYER ERROR:", error);
    res.status(500).json({ error: error.message });
  }
};

export const deletePlayerById = async (req, res) => {
  try {
    const player = await Player.findById(req.params.id);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }

    // Comprehensive ownership check:
    // 1. Matches profileId in JWT
    const isProfileMatch = Boolean(req.user?.profileId && req.user.profileId.toString() === player._id.toString());
    // 2. Matches email in player document
    const isEmailMatch = Boolean(player.email && req.user?.email && player.email.toLowerCase().trim() === req.user.email.toLowerCase().trim());
    // 3. Matches linked User record in database
    const linkedUser = await User.findOne({ profileId: player._id });
    const isUserMatch = Boolean(linkedUser && req.user?.email && linkedUser.email.toLowerCase().trim() === req.user.email.toLowerCase().trim());

    if (!isProfileMatch && !isEmailMatch && !isUserMatch && (player.email || linkedUser)) {
      return res.status(403).json({ message: "Not authorized to delete this profile" });
    }

    await Player.findByIdAndDelete(req.params.id);
    if (linkedUser) {
      await User.findByIdAndDelete(linkedUser._id);
    }
    res.status(200).json({ message: "Player deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteMyProfile = async (req, res) => {
  try {
    const player = await Player.findById(req.user.profileId);
    if (!player) {
      return res.status(404).json({ message: "Player not found" });
    }
    await Player.findByIdAndDelete(req.user.profileId);

    // Delete user account
    await User.findByIdAndDelete(req.user.userId);

    res.status(200).json({
      message: "Player profile and account deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      message: "Failed to delete player",
      error: error.message,
    });
  }
};
