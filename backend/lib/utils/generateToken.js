import jwt from "jsonwebtoken";

export const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "30m",
  });

  res.cookie("jwt", token, {
    maxAge: 30 * 60 * 1000, // ms
    httpOnly: true, // prevents XSS attacks
    sameSite: "strict",
    secure: process.env.NODE_ENV !== "development",
  });
};
