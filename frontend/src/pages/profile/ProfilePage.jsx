import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";

import Posts from "../../components/common/Posts";
import ProfileHeaderSkeleton from "../../components/skeletons/ProfileHeaderSkeleton";
import EditProfileModal from "./EditProfileModal";

import { POSTS } from "../../utils/db/dummy";

import { FaArrowLeft } from "react-icons/fa6";
import { IoCalendarOutline } from "react-icons/io5";
import { FaLink } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import useFollow from "../../components/hooks/useFollow";
import { formatJoinedDate } from "../../utils/date";
import toast from "react-hot-toast";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const ProfilePage = () => {
  const [coverImg, setCoverImg] = useState(null);
  const [profileImg, setProfileImg] = useState(null);
  const [profileImgUrl, setProfileImgUrl] = useState(null); // For displaying the image
  const [coverImgUrl, setCoverImgUrl] = useState(null); // For displaying the image
  const [feedType, setFeedType] = useState("userPosts");
  const { username } = useParams();

  const coverImgRef = useRef(null);
  const profileImgRef = useRef(null);

  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const isMyProfile = username === authUser.username;

  const {
    data: userProfile,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      try {
        const res = await fetch(`/api/users/profile/${username}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        return data;
      } catch (error) {
        throw new Error(error);
      }
    },
  });

  console.log("Fetched user is ", userProfile);

  // Handle uploading/updating profile/cover imgaes
  const { mutate: updateImages, isPending: isUpdatingImg } = useMutation({
    mutationFn: async () => {
      try {
        // Handle image uploading
        if (profileImg || coverImg) {
          const formData = new FormData();

          if (profileImg) {
            formData.append("profileImg", profileImg);
          }

          if (coverImg) {
            formData.append("coverImg", coverImg);
          }

          const imgRes = await fetch("/api/users/update-images", {
            method: "POST",
            body: formData, // FormData for images
          });

          const imgData = await imgRes.json();
          if (!imgRes.ok)
            throw new Error(
              imgData.error || "Something went wrong during uploading images"
            );
        }
        return imgData;
      } catch (error) {
        throw new Error(error);
      }
    },
    onSuccess: () => {
      toast.success("Image updated");
    },
  });

  const handleImgChange = (e, state) => {
    const file = e.target.files[0];
    if (file) {
      const imgUrl = URL.createObjectURL(file);
      if (state === "coverImg") {
        setProfileImg(null);
        setCoverImg(file);
        setCoverImgUrl(imgUrl);
        console.log("Cover img: ", imgUrl);
      }
      if (state === "profileImg") {
        setCoverImg(null);
        setProfileImg(file);
        setProfileImgUrl(imgUrl);
        console.log("Profile img: ", imgUrl);
      }
      updateImages();
    }
  };

  const { follow, isPending } = useFollow();

  useEffect(() => {
    refetch();
  }, [username, refetch]);

  const { data: userPosts, isLoading: isFetchingPosts } = useQuery({
    queryKey: ["posts"],
  });

  return (
    <>
      <div className="flex-[4_4_0]  border-r border-gray-700 min-h-screen ">
        {/* HEADER */}
        {isLoading && isRefetching && <ProfileHeaderSkeleton />}
        {!isLoading && isRefetching && !userProfile && (
          <p className="text-center text-lg mt-4">User not found</p>
        )}
        <div className="flex flex-col">
          {!isLoading && !isRefetching && userProfile && (
            <>
              <div className="flex gap-10 px-4 py-2 items-center">
                <Link to="/">
                  <FaArrowLeft className="w-4 h-4" />
                </Link>
                <div className="flex flex-col">
                  <p className="font-bold text-lg">{userProfile?.fullName}</p>
                  <span className="text-sm text-slate-500">
                    {userPosts?.length} posts
                  </span>
                </div>
              </div>
              {/* COVER IMG */}
              <div className="relative group/cover">
                {!isUpdatingImg && (
                  <img
                    src={coverImgUrl || userProfile?.coverImg || "/cover.png"}
                    className="h-52 w-full object-cover"
                    alt="cover image"
                  />
                )}
                {isUpdatingImg && (
                  <div className=" content-center justify-center">
                    <LoadingSpinner />
                  </div>
                )}

                {isMyProfile && (
                  <div
                    className="absolute top-2 right-2 rounded-full p-2 bg-gray-800 bg-opacity-75 cursor-pointer opacity-0 group-hover/cover:opacity-100 transition duration-200"
                    onClick={() => coverImgRef.current.click()}
                  >
                    <MdEdit className="w-5 h-5 text-white" />
                  </div>
                )}

                <input
                  type="file"
                  hidden
                  ref={coverImgRef}
                  onChange={(e) => handleImgChange(e, "coverImg")}
                />
                <input
                  type="file"
                  hidden
                  ref={profileImgRef}
                  onChange={(e) => handleImgChange(e, "profileImg")}
                />
                {/* USER AVATAR */}
                <div className="avatar absolute -bottom-16 left-4">
                  <div className="w-32 rounded-full relative group/avatar">
                    {!isUpdatingImg && (
                      <img
                        src={
                          profileImgUrl ||
                          userProfile?.profileImg ||
                          "/avatar-placeholder.png"
                        }
                      />
                    )}
                    <div className="absolute top-5 right-3 p-1 bg-primary rounded-full group-hover/avatar:opacity-100 opacity-0 cursor-pointer">
                      {isMyProfile && (
                        <MdEdit
                          className="w-4 h-4 text-white"
                          onClick={() => profileImgRef.current.click()}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end px-4 mt-5">
                {isMyProfile && (
                  <EditProfileModal
                    profileImg={profileImg}
                    coverImg={coverImg}
                  />
                )}
                {!isMyProfile && (
                  <button
                    className="btn btn-outline rounded-full btn-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      follow(userProfile._id);
                    }}
                  >
                    Follow
                  </button>
                )}
                {/* {(coverImg || profileImg) && (
                  <button
                    className="btn btn-primary rounded-full btn-sm text-white px-4 ml-2"
                    onClick={() => }
                  >
                    Update
                  </button>
                )} */}
              </div>

              <div className="flex flex-col gap-4 mt-14 px-4">
                <div className="flex flex-col">
                  <span className="font-bold text-lg">
                    {userProfile?.fullname}
                  </span>
                  <span className="text-sm text-slate-500">
                    @{userProfile?.username}
                  </span>
                  <span className="text-sm my-1">{userProfile?.bio}</span>
                </div>

                <div className="flex gap-2 flex-wrap">
                  {userProfile?.link && (
                    <div className="flex gap-1 items-center ">
                      <>
                        <FaLink className="w-3 h-3 text-slate-500" />
                        <a
                          href={userProfile?.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-blue-500 hover:underline"
                        >
                          {userProfile?.link}
                        </a>
                      </>
                    </div>
                  )}
                  <div className="flex gap-2 items-center">
                    <IoCalendarOutline className="w-4 h-4 text-slate-500" />
                    <span className="text-sm text-slate-500">
                      Joined {formatJoinedDate(userProfile?.createdAt)}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex gap-1 items-center">
                    <span className="font-bold text-xs">
                      {userProfile?.following.length}
                    </span>
                    <span className="text-slate-500 text-xs">Following</span>
                  </div>
                  <div className="flex gap-1 items-center">
                    <span className="font-bold text-xs">
                      {userProfile?.followers.length}
                    </span>
                    <span className="text-slate-500 text-xs">Followers</span>
                  </div>
                </div>
              </div>
              <div className="flex w-full border-b border-gray-700 mt-4">
                <div
                  className="flex justify-center flex-1 p-3 hover:bg-secondary transition duration-300 relative cursor-pointer"
                  onClick={() => setFeedType("userPosts")}
                >
                  Posts
                  {feedType === "userPosts" && (
                    <div className="absolute bottom-0 w-10 h-1 rounded-full bg-primary" />
                  )}
                </div>
                <div
                  className="flex justify-center flex-1 p-3 text-slate-500 hover:bg-secondary transition duration-300 relative cursor-pointer"
                  onClick={() => setFeedType("likes")}
                >
                  Likes
                  {feedType === "likes" && (
                    <div className="absolute bottom-0 w-10  h-1 rounded-full bg-primary" />
                  )}
                </div>
              </div>
            </>
          )}

          <Posts feedType={feedType} />
        </div>
      </div>
    </>
  );
};
export default ProfilePage;
