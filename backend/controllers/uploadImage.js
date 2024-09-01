import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";
import { auth, storage } from "../storage/firebaseStrorage.js";
import fetch from "node-fetch";

export const uploadProfileOrCoverImg = async (base64Image, user) => {
  try {
    // Check if the user already has a profile image and delete it from Firebase Storage
    if (user.profileImg) {
      try {
        // Assuming the profileImg URL is from Firebase Storage, extract the file path
        const oldProfilePicRef = ref(storage, user.profileImg);

        // Delete the old image from Firebase Storage
        await deleteObject(oldProfilePicRef);
        console.log("Old profile picture deleted successfully.");
      } catch (error) {
        console.error("Error deleting old profile picture:", error);
      }
    }

    // Remove the prefix and decode the base64 string
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Generate a unique filename, you could also use the user ID or other identifiers
    const fileName = `profile_${Date.now()}.png`;

    // Reference to Firebase Storage for the new image
    const profilePicRef = ref(
      storage,
      `profile_pictures/${user._id}/${fileName}`
    );

    // Upload the blob to Firebase Storage
    const snapshot = await uploadBytes(profilePicRef, buffer);

    // Get the download URL of the uploaded image
    const downloadURL = await getDownloadURL(snapshot.ref);

    // Update the user's profile with the new image URL
    user.profileImg = downloadURL;

    console.log("New profile picture uploaded successfully!");
    console.log("Download URL:", downloadURL);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading new profile picture:", error);
    throw error;
  }
};

export const uploadPostImage = async (base64Image, user) => {
  try {
    // Remove the prefix and decode the base64 string
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Generate a unique filename, you could also use the user ID or other identifiers
    const fileName = `post_${Date.now()}.png`;

    // Reference to Firebase Storage for the new image
    const postPicRef = ref(storage, `post_pictures/${user._id}/${fileName}`);

    // Upload the blob to Firebase Storage
    const snapshot = await uploadBytes(postPicRef, buffer);

    // Get the download URL of the uploaded image
    const downloadURL = await getDownloadURL(snapshot.ref);

    console.log("New post picture uploaded successfully!");
    console.log("Download URL:", downloadURL);

    return downloadURL;
  } catch (error) {
    console.error("Error uploading new post picture:", error);
    throw error;
  }
};
