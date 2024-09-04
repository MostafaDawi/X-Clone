import { deleteObject, ref } from "firebase/storage";
import Post from "../models/postModel.js";
import User from "../models/userModel.js";
import { uploadPostImage, uploadProfileOrCoverImg } from "./uploadImage.js";
import { storage } from "../storage/firebaseStrorage.js";
import Notification from "../models/notificationModel.js";

export const createPost = async (req, res) => {
  try {
    const { text } = req.body;
    let { img } = req.body;
    const userId = req.user._id.toString();

    const user = await User.findById(userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!img && !text) {
      return res
        .status(400)
        .json({ error: "Please add text or image to create a post." });
    }

    if (img) {
      try {
        uploadPostImage(img, user);
      } catch (error) {
        res.status(400).json({ error: "Error during uploading post image" });
      }
    }

    const newPost = new Post({
      user: userId,
      text,
      img,
    });

    await newPost.save();
    return res.status(200).json(newPost);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const likeUnlikePost = async (req, res) => {
  try {
    // Find Post
    const post = await Post.findById(req.params.id);

    // Check if it exists in the database
    if (!post) return res.status(404).json({ error: "Post not found" });

    const isLiked = post.likes.includes(req.user._id.toString());

    if (isLiked) {
      // Unlike Post
      await Post.updateOne(
        { _id: post._id },
        { $pull: { likes: req.user._id } }
      );
      await User.updateOne(
        { _id: req.user._id },
        { $pull: { likedPosts: post._id } }
      );

      const updatedLikes = post.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
      res.status(200).json(updatedLikes);
    } else {
      // Like Post
      post.likes.push(req.user._id);
      await User.updateOne(
        { _id: req.user._id },
        { $push: { likedPosts: post._id } }
      );
      await post.save();
      const newNotif = new Notification({
        from: req.user._id,
        to: post.user,
        type: "like",
      });
      await newNotif.save();

      const updatedLikes = post.likes;
      res.status(200).json(updatedLikes);
    }
  } catch (error) {
    console.log("Error while liking or unliking the post", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const commentOnPost = async (req, res) => {
  try {
    const { text } = req.body;
    const userId = req.user._id;
    const postId = req.params.id;

    const post = await Post.findById(postId).populate({
      path: "user",
      select: "-password",
    });
    if (!post) return res.status(404).json({ error: "Post not found" });

    if (!text)
      return res.status(400).json({ error: "Text field cannot be empty!" });

    const comment = { user: userId, text };

    // await post.updateOne({ _id: postId }, { $push: { comments: comment } });
    post.comments.push(comment);
    await post.save();
    res.status(200).json(
      await Post.findById(postId).populate({
        path: "comments.user",
        select: "-password",
      })
    );
  } catch (error) {
    console.log("Error while commenting on post", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ error: "Post not found" });

    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(401)
        .json({ error: "Unauthorized user can't delete this post" });
    }

    // if (post.img) {
    //   const oldPostImg = ref(storage, post.img);
    //   if (oldPostImg) {
    //     await deleteObject(oldPostImg);
    //     console.log(
    //       `Post Image of id ${post._id} for user Id ${post.user} has been deleted`
    //     );
    //   }
    // }

    await Post.findByIdAndDelete(post._id);

    console.log("Post has been deleted");
    res.status(200).json({ message: "Post has been successfully deleted!" });
  } catch (error) {
    console.log("Error in deleting post", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });
    if (posts.length === 0) return res.status(200).json([]);
    console.log("requested posts are: ", posts);
    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error while fetching the posts", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getLikedPosts = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    // First Appraoch
    // const allPosts = await Post.find()
    //   .sort({ createdAt: -1 })
    //   .populate({
    //     path: "user",
    //     select: "-password",
    //   })
    //   .populate({
    //     path: "comments.user",
    //     select: "-password",
    //   });

    // const likedPosts = allPosts.filter((post) =>
    //   post.likes.includes(req.user._id)
    // );

    // Second Approach
    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json({ likedPosts });
  } catch (error) {
    console.log("Error fetching the liked posts", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    const followingPosts = await Post.find({
      user: { $in: user.following },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    res.status(200).json(followingPosts);
  } catch (error) {
    console.log("Error fetching following posts", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });
    console.log("Received request from user:", username);
    const myPosts = await Post.find({
      user: { $in: user._id },
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "-password",
      })
      .populate({
        path: "comments.user",
        select: "-password",
      });

    return res.status(200).json(myPosts);
  } catch (error) {
    console.log("Error fetching user's posts", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
