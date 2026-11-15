import mongoose from "mongoose";
import { seedDefaultData } from "./seed.js";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    await seedDefaultData();
  } catch (error) {
    console.error("MongoDB connection failed!!");
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;
