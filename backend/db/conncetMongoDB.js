import mongoose from "mongoose";
import whitelistMiddleware from "../middleware/whitelistMiddleware.js";

export const connectMongoDB = async () => {
  try {
    // await whitelistMiddleware();
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to the Mongo DB successfully!....");
  } catch (error) {
    console.error(`Error connecting to database: ${error.message}`);
    process.exit(1);
  }
};
