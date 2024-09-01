import express from "express";
//import { v2 as cloudinary } from "cloudinary";

import authRoute from "./routes/authRoute.js";
import userRoute from "./routes/userRoute.js";
import postRoute from "./routes/postRoute.js";
import notificationRoute from "./routes/notificationRoute.js";

import dotenv from "dotenv";
import { connectMongoDB } from "./db/conncetMongoDB.js";
import cookieParser from "cookie-parser";

dotenv.config();
// cloudinary.config({
//   //We provide the :
//   //{Cloud Name,
//   //API key,
//   //API secret}
//   //here
// });

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cookieParser());
app.use(express.json({ limit: "5mb" })); // Image size shouldn't be too big otherwise the system is prone to DoS attacks
app.use(express.urlencoded({ extended: true })); // parse form data

app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/posts", postRoute);
app.use("/api/notifications", notificationRoute);

app.listen(PORT, () => {
  console.log("Server is running...");
  connectMongoDB();
});
