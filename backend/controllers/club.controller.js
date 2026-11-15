import Club from "../models/club.js";
import { saveBase64Image } from "../utils/saveImage.js";

// Get all clubs (public)
export const getClubs = async (req, res) => {
  try {
    const clubs = await Club.find();
    res.status(200).json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get logged-in club profile
export const getMyClub = async (req, res) => {
  try {
    const club = await Club.findById(req.user.profileId);

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    res.status(200).json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createClub = async (req, res) => {
  try {
    const data = { ...req.body };
    if (data.logo) data.logo = saveBase64Image(data.logo, "logo");
    if (data.affiliation) data.affiliation = saveBase64Image(data.affiliation, "affiliation");
    const club = await Club.create(data);
    res.status(201).json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getClubById = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: "Club not found" });
    res.status(200).json(club);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update club profile
export const updateClub = async (req, res) => {
  try {
    const data = { ...req.body };

    // Handle file uploads
    if (req.files) {
      if (req.files.logo) {
        data.logo = `/uploads/${req.files.logo[0].filename}`;
      }
      if (req.files.affiliation) {
        data.affiliation = `/uploads/${req.files.affiliation[0].filename}`;
      }
    }

    // Convert any base64 images into physical files on disk in uploads/
    if (data.logo) {
      data.logo = saveBase64Image(data.logo, "logo");
    }
    if (data.affiliation) {
      data.affiliation = saveBase64Image(data.affiliation, "affiliation");
    }

    const targetId = (req.params && req.params.id && req.params.id !== 'me') ? req.params.id : req.user?.profileId;
    if (!targetId) {
      return res.status(400).json({ message: "No club ID provided" });
    }

    const existingClub = await Club.findById(targetId);
    if (!existingClub) {
      const created = await Club.create({ ...data, _id: targetId });
      return res.status(200).json({ message: "Club created successfully", club: created });
    }

    // Profile completion logic
    const isProfileCompleted =
      (data.name || existingClub.name) &&
      (data.address || existingClub.address) &&
      (data.contactPerson || existingClub.contactPerson) &&
      (data.contactMobile || existingClub.contactMobile) &&
      (data.contactEmail || existingClub.contactEmail);

    data.profileCompleted = Boolean(isProfileCompleted);

    const updatedClub = await Club.findByIdAndUpdate(
      targetId,
      data,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Club profile updated successfully",
      club: updatedClub,
    });

  } catch (error) {
    console.error("UPDATE CLUB ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};
