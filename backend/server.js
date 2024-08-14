import express from "express";
import authRoute from "./routes/auth.js";
import dotenv from "dotenv";
import { connectMongoDB } from "./db/conncetMongoDB.js";

dotenv.config();

const app = express();

app.use("/api/auth", authRoute);

app.listen(8000, () => {
  console.log("Server is running...");
  connectMongoDB();
});
