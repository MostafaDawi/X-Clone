import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { uploadProfileOrCoverImg } from "./uploadImage.js";

export const getUserProfile = async (req, res) => {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in getUserProfile, ", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const followUnfollowUser = async (req, res) => {
  const { id } = req.params;
  try {
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id);

    if (!userToModify || !currentUser)
      return res.status(400).json({ error: "User not found" });

    if (id === req.user._id.toString())
      return res.status(400).json({ error: "Cannot Follow/Unfollow yourself" });

    const isFollowing = currentUser.following.includes(id);

    if (isFollowing) {
      //Unfollow user
      await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $pull: { following: id } });

      return res.status(200).json({ message: "User unfollowed successfully!" });
    } else {
      //Follow user
      await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } });
      await User.findByIdAndUpdate(req.user._id, { $push: { following: id } });

      //Send notification to user
      const newNotif = new Notification({
        type: "follow",
        from: req.user._id,
        to: userToModify._id,
      });

      //Save notification in the Database
      await newNotif.save();

      //TODO return the id of the user as a response
      return res.status(200).json({
        message: "User followed successfully!",
        notification: newNotif,
      });
    }
  } catch (error) {
    console.log("Error in followUnfollowUser, ", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const userId = req.user._id;
    const usersFollowedByMe = await User.findById(userId).select("following");

    const users = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId },
        },
      },
      {
        $sample: {
          size: 10,
        },
      },
    ]);

    const filteredUsers = users.filter(
      (user) => !usersFollowedByMe.following.includes(user._id)
    );
    const suggestedUsers = filteredUsers.slice(0, 10);

    suggestedUsers.forEach((user) => (user.password = null));

    res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error at suggested users: ", error.message);
    res.status(500).json({ error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { fullname, username, email, currentPass, newPass, bio, link } =
      req.body;
    const { profileImg, coverImg } = req.body;

    let user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
    }

    if ((!currentPass && newPass) || (!newPass && currentPass)) {
      return res
        .status(400)
        .json({ error: "Please enter both current and new password" });
    }

    if (currentPass && newPass) {
      const isMatching = await bcrypt.compare(currentPass, user.password);
      if (!isMatching) {
        return res.status(400).json({ error: "Current password is not valid" });
      }
      if (newPass.length < 4) {
        return res
          .status(400)
          .json({ error: "Password is less than 4 characters" });
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPass, salt);

      //Cloudinary is not available in my country,
      // but this is how it goes if the user wants to edit profile or cover images
      //------------------------------------------------------------------------------
      // if (profileImg) {
      //   if (user.profileImg) {
      //     //Let's say the img url is like this: https://res.cloudinary.com/something/something/123456.png
      //     await cloudinary.uploader.destroy(
      //       user.profileImg.split("/").pop().split(".")[0]
      //     );
      //   }
      //   const uploadedImg = await cloudinary.uploader.upload(profileImg);
      //   user.profileImg = uploadedImg.secure_url;
      // }
      // if (coverImg) {
      //   if (user.coverImg) {
      //     //Let's say the img url is like this: https://res.cloudinary.com/something/something/123456.png
      //     await cloudinary.uploader.destroy(
      //       user.coverImg.split("/").pop().split(".")[0]
      //     );
      //   }
      //   const uploadedImg = await cloudinary.uploader.upload(coverImg);
      //   user.coverImg = uploadedImg.secure_url;
      // }
      //------------------------------------------------------------------------------

      //Using Firebase instead
      //------------------------------------------------------------------------------
      if (profileImg) {
        try {
          uploadProfileOrCoverImg(profileImg, user);
        } catch (error) {
          res
            .status(400)
            .json({ error: "Error during uploading profile image" });
        }
      }
      if (coverImg) {
        try {
          uploadProfileOrCoverImg(coverImg, user);
        } catch (error) {
          res.status(400).json({ error: "Error during uploading cover image" });
        }
      }
      //------------------------------------------------------------------------------
    }

    user.fullname = fullname || user.fullname;
    user.username = username || user.username;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;

    user = await user.save();

    //In order not to reveal password
    user.password = null;

    return res
      .status(200)
      .json({ message: "User's profile has been updated", updatedUser: user });
  } catch (error) {
    console.log("Error in updateUserProfile", error.message);
    res.status(500).json({ error: error.message });
  }
};
