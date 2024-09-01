import Post from "./Post";
import PostSkeleton from "../skeletons/PostSkeleton";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const Posts = ({ feedType }) => {
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });

  const getPostEndpoint = () => {
    switch (feedType) {
      case "forYou":
        return "api/posts/all";
      case "likes":
        return `api/posts/likes/${authUser._id}`;
      case "following":
        return "api/posts/following";
      case "myPosts":
        console.log(authUser.username);
        return `api/posts/user/${authUser?.username}`;
      default:
        return `api/posts/user/${authUser?.username}`;
    }
  };

  const POST_ENDPOINT = getPostEndpoint();

  const {
    data: posts,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      try {
        const res = await fetch(POST_ENDPOINT);
        console.log("POST_ENDPOINT:", POST_ENDPOINT);
        console.log("response:", res);
        const jsonData = await res.json();

        if (!res.ok) throw new Error(jsonData.error || "Something went wrong");

        return jsonData;
      } catch (error) {
        throw new Error(error);
      }
    },
  });

  useEffect(() => {
    refetch();
  }, [feedType, refetch]);

  return (
    <>
      {(isLoading || isRefetching) && (
        <div className="flex flex-col justify-center">
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      )}
      {!isLoading && !isRefetching && posts?.length === 0 && (
        <p className="text-center my-4">No posts in this tab. Switch 👻</p>
      )}
      {!isLoading && !isRefetching && posts && (
        <div>
          {posts.map((post) => (
            <Post key={post._id} post={post} />
          ))}
        </div>
      )}
    </>
  );
};
export default Posts;
