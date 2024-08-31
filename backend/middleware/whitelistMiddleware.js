import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

// MongoDB Atlas API credentials
const publicKey = process.env.API_PUBLIC_KEY;
const privateKey = process.env.API_PRIVATE_KEY;
const groupId = process.env.GROUP_ID; // Project/Cluster ID

// Function to get public IP address
async function getPublicIP() {
  try {
    const response = await axios.get("https://api.ipify.org?format=json");
    return response.data.ip;
  } catch (error) {
    console.error("Error fetching public IP:", error.message);
    throw error;
  }
}

// Function to add IP to MongoDB Atlas whitelist
async function addIPToWhitelist(ip) {
  const url = `https://cloud.mongodb.com/api/atlas/v1.0/groups/${groupId}/accessList`;

  const auth = {
    username: publicKey,
    password: privateKey,
  };

  const data = {
    ipAddress: ip,
    comment: "Automatically added by Node.js middleware",
  };

  try {
    console.log("Auth:", auth);
    console.log("Group ID:", groupId);
    console.log("Sent data:", data);
    const response = await axios.post(url, data, { auth });
    console.log("IP added to whitelist:", response.data);
    return true;
  } catch (error) {
    console.error(
      "Error adding IP to whitelist:",
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}

// Middleware function
async function whitelistMiddleware(req, res, next) {
  try {
    const ip = await getPublicIP();
    console.log("Your public IP:", ip);

    await addIPToWhitelist(ip);

    console.log("IP has been successfully whitelisted!");
  } catch (error) {
    res.status(500).send("Failed to whitelist IP address");
  }
}

export default whitelistMiddleware;
