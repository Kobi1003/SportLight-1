import mongoose from "mongoose";

const clubSchema = new mongoose.Schema(
  {
    name: String,
    league: String,
    location: String,
    address: String,
    description: String,
    foundationDate: String,
    createdAt: String,
    contactPerson: String,
    contactMobile: String,
    contactEmail: String,
    logo: String,
    affiliation: String,
    scoutingFocus: [String],
    profileCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const Club = mongoose.models.Club || mongoose.model("Club", clubSchema);
export default Club;
