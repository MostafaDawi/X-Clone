import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart } from "react-icons/fa";
import { FaRegBookmark } from "react-icons/fa6";
import { FaTrash } from "react-icons/fa";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "./LoadingSpinner";
import toast from "react-hot-toast";
import { formatPostDate } from "../../utils/date";

const Post = ({ post }) => {
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const queryClient = useQueryClient();
  const [comments, setComments] = useState(post.comments);
  const [likes, setLikes] = useState(post.likes);
  const [isLiked, setIsLiked] = useState(post.likes.includes(authUser._id));
  const [uilike, setuiLike] = useState(isLiked);
  const [comment, setComment] = useState("");

  const postOwner = post.user;

  const isMyPost = authUser._id === post.user._id;

  const formattedDate = formatPostDate(post.createdAt);

  // function to handle deleting a post
  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`api/posts/${post._id}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      toast.success("Post deleted successfully!");
      queryClient.invalidateQueries("posts");
    },
  });

  // function to handle liking a post
  const { mutate: likePost, isPending: isLiking } = useMutation({
    mutationFn: async () => {
      try {
        const res = await fetch(`api/posts/like/${post._id}`, {
          method: "POST",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: (updatedLikes) => {
      // queryClient.invalidateQueries("posts");
      // queryClient.setQueryData(["posts"], (oldData) => {
      //   return oldData.map((p) => {
      //     if (p._id === post._id) {
      //       return { ...p, likes: updatedLikes };
      //     }
      //     return p;
      //   });
      // });
      setLikes(updatedLikes);
      console.log("is user still liked", likes.includes(authUser._id));
      // setIsLiked(likes.includes(authUser._id));
    },
    onError: (error) => {
      throw new Error(error.message);
    },
  });

  // Function to handle the commenting on post
  const { mutate: commentOnPost, isPending: isCommenting } = useMutation({
    mutationFn: async ({ comment }) => {
      try {
        const res = await fetch(`api/posts/comment/${post._id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ text: comment }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        console.log("newly received data is ", data);
        return data.comments;
      } catch (error) {
        throw new Error(error.message);
      }
    },
    onSuccess: (newComments) => {
      toast.success("Comment sent!");
      // queryClient.invalidateQueries(["posts"]);
      setComment("");
      setComments(newComments);
      console.log("New comments are :", newComments);
    },
    onError: (error) => {
      toast.error(`Something went wrong ${error.message}`);
    },
  });

  const handleDeletePost = () => {
    deletePost();
  };

  const handlePostComment = (e) => {
    e.preventDefault();
    commentOnPost({ comment });
  };

  const handleLikePost = () => {
    setuiLike(!uilike);
    if (isLiking) return;
    likePost();
    setIsLiked(likes.includes(authUser._id));
  };

  useEffect(() => {
    setIsLiked(likes.includes(authUser._id));
  }, [likes]);

  return (
    <>
      <div className="flex gap-2 items-start p-4 border-b border-gray-700">
        <div className="avatar">
          <Link
            to={`/profile/${postOwner.username}`}
            className="w-8 rounded-full overflow-hidden"
          >
            <img src={postOwner.profileImg || "/avatar-placeholder.png"} />
          </Link>
        </div>
        <div className="flex flex-col flex-1">
          <div className="flex gap-2 items-center">
            <Link to={`/profile/${postOwner.username}`} className="font-bold">
              {postOwner.fullname}
            </Link>
            <span className="text-gray-700 flex gap-1 text-sm">
              <Link to={`/profile/${postOwner.username}`}>
                @{postOwner.username}
              </Link>
              <span>·</span>
              <span>{formattedDate}</span>
            </span>
            {isMyPost && (
              <span className="flex justify-end flex-1">
                {!isDeleting && (
                  <FaTrash
                    className="cursor-pointer hover:text-red-500"
                    onClick={handleDeletePost}
                  />
                )}
                {isDeleting && <LoadingSpinner size="sm" />}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3 overflow-hidden">
            <span>{post.text}</span>
            {post.img && (
              <img
                src={post.img}
                className="h-80 object-contain rounded-lg border border-gray-700"
                alt=""
              />
            )}
          </div>
          <div className="flex justify-between mt-3">
            <div className="flex gap-4 items-center w-2/3 justify-between">
              <div
                className="flex gap-1 items-center cursor-pointer group"
                onClick={() =>
                  document
                    .getElementById("comments_modal" + post._id)
                    .showModal()
                }
              >
                <FaRegComment className="w-4 h-4  text-slate-500 group-hover:text-sky-400" />
                <span className="text-sm text-slate-500 group-hover:text-sky-400">
                  {comments.length}
                </span>
              </div>
              {/* We're using Modal Component from DaisyUI */}
              <dialog
                id={`comments_modal${post._id}`}
                className="modal border-none outline-none"
              >
                <div className="modal-box rounded border border-gray-600">
                  <h3 className="font-bold text-lg mb-4">COMMENTS</h3>
                  <div className="flex flex-col gap-3 max-h-60 overflow-auto">
                    {comments.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No comments yet 🤔 Be the first one 😉
                      </p>
                    )}
                    {comments.map((comment) => (
                      <div key={comment._id} className="flex gap-2 items-start">
                        <div className="avatar">
                          <div className="w-8 rounded-full">
                            <img
                              src={
                                comment.user.profileImg ||
                                "/avatar-placeholder.png"
                              }
                            />
                          </div>
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1">
                            <span className="font-bold">
                              {comment.user.fullname}
                            </span>
                            <span className="text-gray-700 text-sm">
                              @{comment.user.username}
                            </span>
                          </div>
                          <div className="text-sm">{comment.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <form
                    className="flex gap-2 items-center mt-4 border-t border-gray-600 pt-2"
                    onSubmit={handlePostComment}
                  >
                    <textarea
                      className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none  border-gray-800"
                      placeholder="Add a comment..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <button className="btn btn-primary rounded-full btn-sm text-white px-4">
                      {isCommenting ? <LoadingSpinner size="sm" /> : "Post"}
                    </button>
                  </form>
                </div>
                <form method="dialog" className="modal-backdrop">
                  <button className="outline-none">close</button>
                </form>
              </dialog>
              <div className="flex gap-1 items-center group cursor-pointer">
                <BiRepost className="w-6 h-6  text-slate-500 group-hover:text-green-500" />
                <span className="text-sm text-slate-500 group-hover:text-green-500">
                  0
                </span>
              </div>
              <div
                className="flex gap-1 items-center group cursor-pointer"
                onClick={handleLikePost}
              >
                {!uilike && (
                  <FaRegHeart className="w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500" />
                )}
                {uilike && (
                  <FaRegHeart className="w-4 h-4 cursor-pointer text-pink-500 " />
                )}

                <span
                  className={`text-sm  ${
                    uilike
                      ? "text-pink-500"
                      : "text-slate-500 group-hover:text-pink-500"
                  }`}
                >
                  {likes.length}
                </span>
              </div>
            </div>
            <div className="flex w-1/3 justify-end gap-2 items-center">
              <FaRegBookmark className="w-4 h-4 text-slate-500 cursor-pointer" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
export default Post;
