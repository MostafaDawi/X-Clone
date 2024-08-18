import express from "express";
import authRoute from "./routes/auth.js";
import dotenv from "dotenv";
import { connectMongoDB } from "./db/conncetMongoDB.js";
import cookieParser from "cookie-parser";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // parse form data

app.use("/api/auth", authRoute);

app.listen(PORT, () => {
  console.log("Server is running...");
  connectMongoDB();
});
